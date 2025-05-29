import mongoose from "mongoose";
import "dotenv/config";
import User from "../models/user.js";
import Course from "../models/Course.js";
import { Purchase } from "../models/Purchase.js";
import { CourseProgress } from "../models/CourseProgress.js";

const migrateUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(`${process.env.MONGODB_URI}/lms`);
    console.log("Connected to database");

    // Clean up invalid users
    await User.deleteMany({ _id: { $exists: false } });
    console.log('Cleaned up invalid users');

    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users`);

    for (const user of users) {
      const userId = user._id?.toString();
      if (!userId) {
        console.log('Found user without ID:', user);
        await User.findByIdAndDelete(user._id);
        continue;
      }
      
      if (userId.startsWith('user_')) {
        console.log(`Migrating user: ${user._id}`);
        
        // Create new user with MongoDB ObjectId
        const newUser = new User({
          name: user.name,
          email: user.email,
          password: user.password || 'migrated_' + Math.random().toString(36).slice(-8),
          imageUrl: user.imageUrl,
          enrolledCourses: user.enrolledCourses,
          role: user.role
        });

        // Save the new user
        await newUser.save();
        console.log(`Created new user with ID: ${newUser._id}`);

        // Update references in other collections
        await Course.updateMany(
          { educator: user._id },
          { $set: { educator: newUser._id } }
        );

        await Purchase.updateMany(
          { userId: user._id },
          { $set: { userId: newUser._id } }
        );

        await CourseProgress.updateMany(
          { userId: user._id },
          { $set: { userId: newUser._id } }
        );

        // Delete the old user
        await User.findByIdAndDelete(user._id);
        console.log(`Deleted old user: ${user._id}`);
      }
    }

    console.log("Migration completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

migrateUsers();
