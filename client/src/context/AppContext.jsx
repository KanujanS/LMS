import { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import humanizeDuration from "humanize-duration";
import { toast } from "react-hot-toast";
import axios from "axios";

export const AppContext = createContext();

export const AppContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const currency = import.meta.env.VITE_CURRENCY;
  const navigate = useNavigate();

  const [allCourses, setAllCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [userData, setUserData] = useState(null);

  // Get user from localStorage and initialize data
  useEffect(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (storedUser && storedUser._id) { // Ensure we have a valid user with _id
        setUserData(storedUser);
      } else {
        // Clear invalid user data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  }, []);

  // Add axios interceptor for authentication
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUserData(null);
          navigate('/login');
          toast.error('Session expired. Please login again.');
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptors on unmount
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [navigate]);

  //fetch all courses
  const fetchAllCourses = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/course/all");

      if (data.success) {
        setAllCourses(data.courses);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Fetch user data
  const fetchUserData = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/user/data");
      if (data.success) {
        setUserData(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch user data');
    }
  };

  // Function to calculate average rating of course
  const calculateRating = (course) => {
    if (course.courseRatings.length === 0) {
      return 0;
    }
    let totalRating = 0;
    course.courseRatings.forEach((rating) => {
      totalRating += rating.rating;
    });
    return Math.floor(totalRating / course.courseRatings.length);
  };

  // Function to calculate course chapter time
  const calculateChapterTime = (chapter) => {
    let time = 0;
    if (Array.isArray(chapter.chapterContent)) {
      chapter.chapterContent.forEach((lecture) => (time += lecture.lectureDuration));
    }
    return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] });
  };

  // Function to calculate the course duration
  const calculateCourseDuration = (course) => {
    let time = 0;
    course.courseContent.forEach((chapter) => {
      if (Array.isArray(chapter.chapterContent)) {
        chapter.chapterContent.forEach((lecture) => (time += lecture.lectureDuration));
      }
    });
    return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] });
  };

  // Function to calculate no of lectures in the courses
  const calculateNoOfLectures = (course) => {
    let totalLectures = 0;
    course.courseContent.forEach((chapter) => {
      if (Array.isArray(chapter.chapterContent)) {
        totalLectures += chapter.chapterContent.length;
      }
    });
    return totalLectures;
  };

  // Fetch user enrolled courses
  const fetchUserEnrolledCourses = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/user/enrolled-courses");
      if (data.success) {
        setEnrolledCourses(data.enrolledCourses.reverse());
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchAllCourses();
  }, []);

  // Initialize user data when userData changes
  useEffect(() => {
    const initializeUserData = async () => {
      if (userData) {
        try {
          await Promise.all([
            fetchUserData(),
            fetchUserEnrolledCourses()
          ]);
        } catch (error) {
          console.error('Error initializing user data:', error);
          toast.error('Failed to load user data. Please refresh the page.');
        }
      }
    };
    
    initializeUserData();
  }, [userData]);

  const value = {
    currency,
    allCourses,
    navigate,
    calculateRating,
    calculateChapterTime,
    calculateCourseDuration,
    calculateNoOfLectures,
    enrolledCourses,
    fetchUserEnrolledCourses,
    backendUrl,
    userData,
    setUserData,
    fetchAllCourses,
    fetchUserData
  };

  return (
    <AppContext.Provider value={value}>{props.children}</AppContext.Provider>
  );
};
