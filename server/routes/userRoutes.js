import express from "express";
import {
  register,
  login,
  addUserRating,
  getUserCourseProgress,
  getUserData,
  purchaseCourse,
  updateUserCourseProgress,
  userEnrolledCourses,
} from "../controllers/userController.js";
import { protect } from "../middlewares/authMiddleware.js";

const userRouter = express.Router();

// Auth routes
userRouter.post("/register", register);
userRouter.post("/login", login);

// Protected routes
userRouter.get("/data", protect, getUserData);
userRouter.get("/enrolled-courses", protect, userEnrolledCourses);
userRouter.post("/purchase", protect, purchaseCourse);
userRouter.post("/update-course-progress", protect, updateUserCourseProgress);
userRouter.post("/get-course-progress", protect, getUserCourseProgress);
userRouter.post("/add-rating", protect, addUserRating);

export default userRouter;
