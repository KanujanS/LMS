import Course from "../models/Course.js";

// Get all courses
export const getAllCourse = async (req, res) => {
    try {
        const courses = await Course.find({ isPublished: true })
            .select(['-courseContent', '-enrolledStudents'])
            .populate({ path: 'educator' });

        res.json({ success: true, courses });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Get course by id
export const getCourseId = async (req, res) => {
    const { id } = req.params;

    try {
        const courseData = await Course.findById(id).populate({ path: 'educator' });

        if (!courseData) {
            return res.json({ success: false, message: "Course not found" });
        }

        if (!Array.isArray(courseData.courseContent)) {
            return res.json({ success: false, message: "Invalid course content format" });
        }

        // Safely iterate over courseContent
        courseData.courseContent.forEach(chapter => {
            if (!chapter || !Array.isArray(chapter.chapterContent)) {
                chapter.chapterContent = [];
                return;
            }

            chapter.chapterContent.forEach(lecture => {
                if (!lecture) return;
                
                // Ensure lecture duration is a number
                lecture.lectureDuration = Number(lecture.lectureDuration) || 0;
                
                // Hide video URL for non-preview lectures
                if (!lecture.isPreviewFree) {
                    lecture.lectureUrl = "";
                }
            });
        });

        res.json({ success: true, courseData });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};