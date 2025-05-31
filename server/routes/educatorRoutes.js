import express from "express";
import {
  addCourse,
  educatorDashboardData,
  getEducatorCourses,
  getEnrolledStudentsData,
  updateRoleToEducator,
} from "../controllers/educatorController.js";
import upload from "../configs/multer.js";
import { protect, protectEducator } from "../middlewares/authMiddleware.js";

const educatorRouter = express.Router();

// Add educator role
// Public route to become an educator
educatorRouter.get("/update-role", protect, updateRoleToEducator);

// Protected educator routes - need both protect and protectEducator
educatorRouter.post(
  "/add-course",
  protect,
  protectEducator,
  upload.single("image"),
  addCourse
);

educatorRouter.get("/courses", protect, protectEducator, getEducatorCourses);
educatorRouter.get("/dashboard", protect, protectEducator, educatorDashboardData);
educatorRouter.get(
  "/enrolled-students",
  protect,
  protectEducator,
  getEnrolledStudentsData
);

export default educatorRouter;
