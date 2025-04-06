import Course from "../models/Course.js";

// Get all courses
export const getAllCourse = async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: true })
      .select(["-courseContent", "-enrolledStudents"])
      .populate({ path: "educator" });

    res.json({ success: true, courses });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get course by id
export const getCourseId = async (req, res) => {
  const { id } = req.params;

  try {
    const courseData = await Course.findById(id).populate({ path: "educator" });

    // Safely check if courseContent is an array
    if (Array.isArray(courseData.courseContent)) {
      courseData.courseContent.forEach((chapter) => {
        // Safely check if chapterContent is an array
        if (Array.isArray(chapter.chapterContent)) {
          chapter.chapterContent.forEach((lecture) => {
            if (!lecture.isPreviewFree) {
              lecture.lectureUrl = "";
            }
          });
        } else {
          console.warn(
            "chapterContent is not an array:",
            chapter.chapterContent
          );
        }
      });
    } else {
      console.warn("courseContent is not an array:", courseData.courseContent);
    }

    res.json({ success: true, courseData });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
