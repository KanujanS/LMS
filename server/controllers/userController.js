import User from "../models/user.js";
import Stripe from "stripe";
import Course from "../models/Course.js";
import { Purchase } from "../models/Purchase.js";
import { CourseProgress } from "../models/CourseProgress.js";
import jwt from "jsonwebtoken";
import { config } from "dotenv";

config();

const completePurchaseEnrollment = async ({ purchaseId, stripeSessionId }) => {
  const purchase = await Purchase.findById(purchaseId);
  if (!purchase) {
    throw new Error("Purchase not found");
  }

  const user = await User.findById(purchase.userId);
  const course = await Course.findById(purchase.courseId);

  if (!user || !course) {
    throw new Error("User or course not found");
  }

  const courseIdStr = course._id.toString();
  const userIdStr = user._id.toString();

  if (!user.enrolledCourses.some((id) => id.toString() === courseIdStr)) {
    user.enrolledCourses.push(course._id);
    await user.save();
  }

  if (!course.enrolledStudents.some((id) => id.toString() === userIdStr)) {
    course.enrolledStudents.push(user._id);
    await course.save();
  }

  if (purchase.status !== "completed") {
    purchase.status = "completed";
    purchase.completedAt = new Date();
  }

  if (stripeSessionId) {
    purchase.stripeSessionId = stripeSessionId;
  }

  await purchase.save();

  return purchase;
};

// Register user
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: "User already exists" 
      });
    }

    // Create new user with MongoDB ObjectId
    const user = new User({
      name,
      email,
      password,
      imageUrl: "https://www.gravatar.com/avatar/?d=mp"
    });
    await user.save();

    // Generate token with explicit expiration
    const expiresIn = 7 * 24 * 60 * 60; // 7 days in seconds
    const token = jwt.sign(
      { 
        userId: user._id,
        exp: Math.floor(Date.now() / 1000) + expiresIn
      },
      process.env.JWT_SECRET
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        imageUrl: user.imageUrl,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }

    // Generate token with explicit expiration
    const expiresIn = 7 * 24 * 60 * 60; // 7 days in seconds
    const token = jwt.sign(
      { 
        userId: user._id,
        exp: Math.floor(Date.now() / 1000) + expiresIn
      },
      process.env.JWT_SECRET
    );

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        imageUrl: user.imageUrl,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get user data
export const getUserData = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Users enrolled courses with lecture links
export const userEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user._id;
    const userData = await User.findById(userId).populate("enrolledCourses");

    res.json({ success: true, enrolledCourses: userData.enrolledCourses });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Purchase course
export const purchaseCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const { origin } = req.headers;
    const userId = req.user._id;
    const userData = await User.findById(userId);
    const courseData = await Course.findById(courseId);

    if (!userData || !courseData) {
      return res.json({ success: false, message: "Data not found" });
    }

    const purchaseData = {
      courseId: courseData._id,
      userId,
      amount: Number((
        courseData.coursePrice -
        (courseData.discount * courseData.coursePrice) / 100
      ).toFixed(2)),
    };

    const minimumStripeCharge = process.env.CURRENCY?.toLowerCase() === 'lkr' ? 125 : 1;

    if (purchaseData.amount < minimumStripeCharge) {
      return res.status(400).json({
        success: false,
        message: `The course price after discount must be at least ${process.env.CURRENCY?.toUpperCase() || 'USD'} ${minimumStripeCharge} to complete checkout. Please increase the price or reduce the discount.`,
      });
    }

    const newPurchase = await Purchase.create(purchaseData);

    // Stripe gateway initialize
    const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
    const currency = process.env.CURRENCY.toLowerCase();

    // Creating line items to stripe
    const line_items = [
      {
        price_data: {
          currency,
          product_data: {
            name: courseData.courseTitle,
          },
          unit_amount: Math.round(newPurchase.amount * 100),
        },
        quantity: 1,
      },
    ];

    const session = await stripeInstance.checkout.sessions.create({
      success_url: `${origin}/course/${courseId}?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/course/${courseId}?payment_cancelled=true`,
      line_items: line_items,
      mode: "payment",
      metadata: {
        purchaseId: newPurchase._id.toString(),
        courseId: courseId.toString(),
        userId: userId.toString()
      },
    });

    newPurchase.stripeSessionId = session.id;
    await newPurchase.save();

    res.json({ success: true, session_url: session.url });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Verify payment and finalize enrollment (fallback when webhook is delayed)
export const verifyPayment = async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ success: false, message: "Session id is required" });
    }

    const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripeInstance.checkout.sessions.retrieve(sessionId);

    if (!session || session.payment_status !== "paid") {
      return res.status(400).json({
        success: false,
        message: "Payment is not completed yet. Please wait a moment and try again.",
      });
    }

    const purchaseId = session.metadata?.purchaseId;
    if (!purchaseId) {
      return res.status(400).json({ success: false, message: "Invalid payment metadata" });
    }

    const purchase = await completePurchaseEnrollment({
      purchaseId,
      stripeSessionId: session.id,
    });

    res.json({
      success: true,
      message: "Enrollment updated successfully",
      purchaseId: purchase._id,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update user course progress
export const updateUserCourseProgress = async (req, res) => {
  try {
    const userId = req.user._id;
    const { courseId, lectureId } = req.body;
    const progressData = await CourseProgress.findOne({ userId, courseId });

    if (progressData) {
      if (progressData.lectureCompleted.includes(lectureId)) {
        return res.json({
          success: true,
          message: "Lecture already completed",
        });
      }
      progressData.lectureCompleted.push(lectureId);
      await progressData.save();
    } else {
      await CourseProgress.create({
        userId,
        courseId,
        lectureCompleted: [lectureId],
      });
    }

    res.json({ success: true, message: "Progress updated" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get user course progress
export const getUserCourseProgress = async (req, res) => {
  try {
    const userId = req.user._id;
    const { courseId } = req.body;
    const progressData = await CourseProgress.findOne({ userId, courseId });
    res.json({ success: true, progressData });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Add user ratings to course

export const addUserRating = async (req, res) => {
  const userId = req.auth.userId;
  const { courseId, rating } = req.body;
  if (!courseId || !userId || !rating || rating < 1 || rating > 5) {
    return res.json({ success: false, message: "Invalid Details" });
  }
  try {
    const course = await Course.findById(courseId);

    if (!course) {
      return res.json({ success: false, message: "Course not found" });
    }

    const user = await User.findById(userId);
    if (!user || !user.enrolledCourses.includes(courseId)) {
      return res.json({
        success: false,
        message: "User has not purchased this course.",
      });
    }

    const existingRatingIndex = course.courseRatings.findIndex(
      (r) => r.userId === userId
    );

    if (existingRatingIndex > -1) {
      course.courseRatings[existingRatingIndex].rating = rating;
    } else {
      course.courseRatings.push({ userId, rating });
    }
    await course.save();

    return res.json({ success: true, message: "Rating added" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};
