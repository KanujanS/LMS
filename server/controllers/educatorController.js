import jwt from "jsonwebtoken"; // << Added this import
import Course from "../models/Course.js";
import { v2 as cloudinary } from "cloudinary";
import { Purchase } from "../models/Purchase.js";
import User from "../models/user.js";

// Update role to educator
export const updateRoleToEducator = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const userId = req.user._id;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { role: "educator" },
      { new: true, select: '-password' }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d"
    });

    res.json({
      success: true,
      message: "You can publish a course now",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        imageUrl: user.imageUrl,
        role: user.role
      },
      token
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add new course
export const addCourse = async (req, res) => {
  try {
    const { courseData } = req.body;
    const imageFile = req.file;
    const educatorId = req.user._id;

    if (!imageFile) {
      return res.json({ success: false, message: "Thumbnail not attached" });
    }

    const parsedCourseData = await JSON.parse(courseData);
    parsedCourseData.educator = educatorId;

    // Process course content to add required fields
    if (Array.isArray(parsedCourseData.courseContent)) {
      parsedCourseData.courseContent.forEach((chapter, chapterIndex) => {
        if (Array.isArray(chapter.chapterContent)) {
          chapter.chapterContent.forEach((lecture, lectureIndex) => {
            // Generate lectureId using chapter and lecture index
            lecture.lectureId = `${chapterIndex + 1}-${lectureIndex + 1}-${Date.now()}`;
            // Set lectureOrder based on index
            lecture.lectureOrder = lectureIndex + 1;
          });
        }
      });
    }

    const newCourse = await Course.create(parsedCourseData);
    const imageUpload = await cloudinary.uploader.upload(imageFile.path);
    newCourse.courseThumbnail = imageUpload.secure_url;
    await newCourse.save();

    res.json({ success: true, message: "Course added" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get educator courses
export const getEducatorCourses = async (req, res) => {
  try {
    const educator = req.user._id;
    const courses = await Course.find({ educator });
    res.json({ success: true, courses });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get educator dashboard data ( Total Earnings, Enrolled students, No of Courses )
export const educatorDashboardData = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const educator = req.user._id;
    const courses = await Course.find({ educator });
    const totalCourses = courses.length;

    const courseIds = courses.map((course) => course._id);

    // Calculate total earnings from purchases
    const purchases = await Purchase.find({
      courseId: { $in: courseIds },
      status: "completed",
    });

    const totalEarnings = purchases.reduce(
      (sum, purchase) => sum + purchase.amount,
      0
    );

    // Collect unique enrolled student IDs with their course titles
    const enrolledStudentsData = [];
    for (const course of courses) {
      if (!course.enrolledStudents) continue;
      
      const students = await User.find(
        {
          _id: { $in: course.enrolledStudents },
        },
        "name imageUrl"
      );

      students.forEach((student) => {
        if (student) {
          enrolledStudentsData.push({
            courseTitle: course.courseTitle,
            student: {
              _id: student._id,
              name: student.name,
              imageUrl: student.imageUrl
            },
          });
        }
      });
    }

    res.json({
      success: true,
      dashboardData: {
        totalEarnings,
        enrolledStudentsData,
        totalCourses,
      },
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get enrolled students data with purchase data
export const getEnrolledStudentsData = async (req, res) => {
  try {
    const educatorId = req.user._id;
    const courses = await Course.find({ educator: educatorId });
    const purchases = await Purchase.find({
      courseId: { $in: courses.map(course => course._id) },
      status: 'completed'
    })
      .populate('userId', 'name email')
      .populate('courseId', 'courseTitle price');

    const enrolledStudents = purchases.map((purchase) => ({
      studentName: purchase.userId.name,
      studentEmail: purchase.userId.email,
      courseName: purchase.courseId.courseTitle,
      purchaseDate: purchase.createdAt,
      amount: purchase.courseId.price,
    }));

    res.json({
      success: true,
      enrolledStudents,
      totalStudents: enrolledStudents.length,
      totalRevenue: enrolledStudents.reduce((total, student) => total + student.amount, 0)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};