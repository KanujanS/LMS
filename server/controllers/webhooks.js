import User from "../models/user.js";
import Stripe from "stripe";
import { Purchase } from "../models/Purchase.js";
import Course from "../models/Course.js";
import mongoose from "mongoose";

// Initialize Stripe
const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

// Stripe webhook handler for payment processing
export const stripeWebhooks = async (request, response) => {
  let event;
  
  try {
    // Log request details
    console.log('Received Stripe webhook request:', {
      method: request.method,
      path: request.path,
      contentType: request.headers['content-type'],
      contentLength: request.headers['content-length']
    });
    
    // Get the signature from headers
    const sig = request.headers["stripe-signature"];
    if (!sig) {
      console.error('No Stripe signature found in headers');
      return response.status(400).json({
        success: false,
        message: 'No Stripe signature found'
      });
    }

    // Verify webhook secret is set
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET is not set');
      return response.status(500).json({
        success: false,
        message: 'Webhook secret not configured'
      });
    }
    
    // Log headers for debugging
    console.log('Request headers:', {
      'stripe-signature': sig.substring(0, 20) + '...',
      'content-type': request.headers['content-type'],
      'content-length': request.headers['content-length']
    });

    // Get the raw body
    const rawBody = request.body;
    if (!rawBody) {
      console.error('No request body found');
      return response.status(400).json({
        success: false,
        message: 'No request body found'
      });
    }

    // Log body info for debugging
    console.log('Request body info:', {
      type: typeof rawBody,
      isBuffer: Buffer.isBuffer(rawBody),
      length: rawBody.length || 0
    });

    try {
      // Convert string body to buffer if needed
      const bodyBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody);
      
      // Verify webhook signature and construct event
      event = stripeInstance.webhooks.constructEvent(
        bodyBuffer,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      
      console.log('Successfully constructed webhook event:', {
        type: event.type,
        id: event.id,
        apiVersion: event.apiVersion,
        created: new Date(event.created * 1000).toISOString()
      });
    } catch (err) {
      console.error('Webhook signature verification failed:', {
        error: err.message,
        signature: sig.substring(0, 20) + '...',
        bodyLength: rawBody.length
      });
      return response.status(400).json({
        success: false,
        message: `Webhook Error: ${err.message}`
      });
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        console.log('Processing completed checkout session');
        const session = event.data.object;
        console.log('Session data:', {
          id: session.id,
          customer: session.customer,
          paymentStatus: session.payment_status,
          metadata: session.metadata,
          created: new Date(session.created * 1000).toISOString()
        });
        
        const { purchaseId } = session.metadata;
        if (!purchaseId) {
          throw new Error('No purchaseId found in session metadata');
        }

        // Find and validate purchase with retries
        let purchase = null;
        let retries = 0;
        const maxRetries = 3;
        
        while (!purchase && retries < maxRetries) {
          purchase = await Purchase.findById(purchaseId);
          if (!purchase) {
            retries++;
            console.log(`Purchase not found, retry ${retries}/${maxRetries}`);
            if (retries < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            }
          }
        }
        
        if (!purchase) {
          throw new Error(`Purchase not found after ${maxRetries} retries: ${purchaseId}`);
        }

        console.log('Found purchase:', {
          id: purchase._id,
          userId: purchase.userId,
          courseId: purchase.courseId,
          status: purchase.status,
          created: purchase.createdAt
        });

        // Check if purchase is already completed
        if (purchase.status === 'completed') {
          console.log('Purchase already completed, skipping processing');
          return response.json({
            success: true,
            received: true,
            message: 'Purchase already processed'
          });
        }

        // Find user and course with retries
        let user = null;
        let course = null;
        retries = 0;
        
        while ((!user || !course) && retries < maxRetries) {
          [user, course] = await Promise.all([
            User.findById(purchase.userId),
            Course.findById(purchase.courseId)
          ]);
          
          if (!user || !course) {
            retries++;
            console.log(`User/Course not found, retry ${retries}/${maxRetries}`);
            if (retries < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }

        if (!user) {
          throw new Error(`User not found after ${maxRetries} retries: ${purchase.userId}`);
        }
        if (!course) {
          throw new Error(`Course not found after ${maxRetries} retries: ${purchase.courseId}`);
        }

        console.log('Found user and course:', {
          userId: user._id,
          userName: user.name,
          courseId: course._id,
          courseTitle: course.courseTitle
        });

        // Start a database session for atomic updates
        const dbSession = await mongoose.startSession();
        let savedDocuments = null;

        try {
          // Start transaction
          dbSession.startTransaction();

          // Update purchase status
          purchase.status = "completed";
          purchase.stripeSessionId = session.id;
          purchase.completedAt = new Date();
          await purchase.save({ session: dbSession });
          
          console.log('Updated purchase status to completed');

          // Add user to course's enrolled students if not already enrolled
          const userIdStr = user._id.toString();
          const isUserEnrolled = course.enrolledStudents.some(id => id.toString() === userIdStr);
          
          if (!isUserEnrolled) {
            console.log(`Adding user ${userIdStr} to course ${course._id} enrolled students`);
            course.enrolledStudents.push(user._id);
            await course.save({ session: dbSession });
          } else {
            console.log(`User ${userIdStr} already enrolled in course ${course._id}`);
          }

          // Add course to user's enrolled courses if not already added
          const courseIdStr = course._id.toString();
          const isCourseEnrolled = user.enrolledCourses.some(id => id.toString() === courseIdStr);
          
          if (!isCourseEnrolled) {
            console.log(`Adding course ${courseIdStr} to user ${user._id} enrolled courses`);
            user.enrolledCourses.push(course._id);
            await user.save({ session: dbSession });
          } else {
            console.log(`Course ${courseIdStr} already in user ${user._id} enrolled courses`);
          }

          // Commit the transaction
          await dbSession.commitTransaction();
          console.log('Successfully committed the transaction');

          // Double-check the enrollment with retries
          let verificationRetries = 0;
          const maxVerificationRetries = 3;
          let enrollmentVerified = false;

          while (!enrollmentVerified && verificationRetries < maxVerificationRetries) {
            const updatedUser = await User.findById(user._id).lean();
            const isEnrolled = updatedUser.enrolledCourses.some(id => id.toString() === courseIdStr);

            if (isEnrolled) {
              enrollmentVerified = true;
              console.log('Verified enrollment success:', {
                userId: user._id,
                courseId: course._id,
                enrolledCourses: updatedUser.enrolledCourses.length,
                attempt: verificationRetries + 1
              });
            } else {
              verificationRetries++;
              console.log(`Enrollment verification attempt ${verificationRetries}/${maxVerificationRetries} failed`);
              if (verificationRetries < maxVerificationRetries) {
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
          }

          if (!enrollmentVerified) {
            console.error('Enrollment verification failed after multiple attempts');
            throw new Error('Enrollment verification failed');
          }

        } catch (saveError) {
          console.error('Error in transaction:', {
            error: saveError.message,
            stack: saveError.stack,
            userId: user._id,
            courseId: course._id
          });

          // Abort the transaction on error
          await dbSession.abortTransaction();
          throw new Error(`Transaction failed: ${saveError.message}`);
        } finally {
          // End the session
          await dbSession.endSession();
        }

        break;
      }

      case "checkout.session.expired": {
        console.log('Processing expired checkout session');
        const session = event.data.object;
        const { purchaseId } = session.metadata;

        if (purchaseId) {
          try {
            const result = await Purchase.findByIdAndUpdate(
              purchaseId,
              { 
                status: "expired",
                expiredAt: new Date()
              },
              { new: true }
            );
            console.log('Updated purchase status to expired:', {
              purchaseId,
              newStatus: result?.status
            });
          } catch (updateError) {
            console.error('Error updating purchase status:', updateError);
            throw new Error(`Failed to update purchase status: ${updateError.message}`);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    console.log('Webhook processed successfully');
    return response.json({ success: true, received: true });
  } catch (error) {
    console.error('Error processing webhook:', {
      message: error.message,
      stack: error.stack,
      eventType: event?.type
    });
    return response.status(500).json({
      success: false,
      error: error.message,
      eventType: event?.type
    });
  }
};
