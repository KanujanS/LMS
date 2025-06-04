import { createContext, useEffect, useState, useCallback } from "react";
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

  // Initialize auth state and axios config
  useEffect(() => {
    if (!window.activeRequests) {
      window.activeRequests = [];
    }

    // Set axios base URL
    if (backendUrl) {
      axios.defaults.baseURL = backendUrl;
    }

    // Initialize auth state from localStorage
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user && user._id) {
          setUserData(user);
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
          // Invalid user data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          delete axios.defaults.headers.common['Authorization'];
        }
      } catch (error) {
        // Invalid JSON
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
      }
    } else {
      // No auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [backendUrl]);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (!token) {
          setToken(null);
          setUserData(null);
          return;
        }

        // Set initial user data if available
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser?._id) {
              setUserData(parsedUser);
            }
          } catch (e) {
            console.error('Failed to parse stored user:', e);
          }
        }

        // Verify token by making a request
        const { data } = await axios.get('/api/user/data');
        if (data.success && data.user) {
          setUserData(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
        } else {
          throw new Error('Failed to verify token');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setToken(null);
        setUserData(null);
      }
    };

    if (backendUrl) {
      initializeAuth();
    }
  }, [backendUrl]);




  // Add axios interceptor for authentication
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        // Don't modify auth routes
        if (config.url.includes('/login') || config.url.includes('/register')) {
          return config;
        }

        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Create controller for this request
        const controller = new AbortController();
        config.signal = controller.signal;
        window.activeRequests.push(controller);
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => {
        // Remove controller when request completes
        if (response.config.signal) {
          const index = window.activeRequests.findIndex(
            c => c.signal === response.config.signal
          );
          if (index > -1) {
            window.activeRequests.splice(index, 1);
          }
        }
        return response;
      },
      (error) => {
        // Remove controller on error
        if (error.config?.signal) {
          const index = window.activeRequests.findIndex(
            c => c.signal === error.config.signal
          );
          if (index > -1) {
            window.activeRequests.splice(index, 1);
          }
        }

        // Only show errors if not logging out
        if (!window.isLoggingOut) {
          // Handle 401 errors
          if (error.response?.status === 401) {
            // Don't handle 401s for auth routes
            if (!error.config.url.includes('/api/user/login') && !error.config.url.includes('/api/user/register')) {
              setToken(null);
              toast.error('Session expired. Please login again.');
            }
          } else if (!axios.isCancel(error)) {
            // Show other errors unless it's a cancellation
            toast.error(error.response?.data?.message || 'An error occurred');
          }
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
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No auth token');
      }

      const { data } = await axios.get('/api/user/data', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success && data.user) {
        setUserData(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        return true;
      } else {
        throw new Error(data.message || 'Failed to fetch user data');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      if (error.response?.status === 401) {
        setToken(null);
      }
      toast.error(error.response?.data?.message || error.message || 'Failed to fetch user data');
      return false;
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
      const token = await getToken();
      const { data } = await axios.get(backendUrl + "/api/user/enrolled-courses", {
        headers: { Authorization: `Bearer ${token}` }
      });
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

  // Check if user is an educator
  const isEducator = userData?.role === 'educator';

  // Token management functions
  const getToken = () => localStorage.getItem('token');
  
  const setToken = (token) => {
    if (token) {
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
      setUserData(null);
    }
  };

  const logout = useCallback(() => {
    // Set a flag to prevent error toasts during logout
    window.isLoggingOut = true;

    // Clear localStorage first
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Clear axios headers
    delete axios.defaults.headers.common['Authorization'];

    // Clear state
    setUserData(null);

    // Cancel any pending requests silently
    if (window.activeRequests && window.activeRequests.length > 0) {
      window.activeRequests.forEach(controller => {
        if (controller && controller.abort) {
          try {
            controller.abort('logout');
          } catch (e) {
            console.debug('Error aborting request:', e);
          }
        }
      });
      window.activeRequests = [];
    }

    // Navigate to login
    navigate('/login', { replace: true });

    // Show success message and cleanup
    setTimeout(() => {
      window.isLoggingOut = false;
      toast.success('Logged out successfully');
    }, 100);
  }, [navigate]);

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
    fetchUserData,
    isEducator,
    getToken,
    setToken,
    logout
  };

  return (
    <AppContext.Provider value={value}>{props.children}</AppContext.Provider>
  );
};
