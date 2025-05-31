import axios from 'axios';
import { toast } from 'react-toastify';

// Get the backend URL from window.__INITIAL_DATA__ or environment or default to localhost
const getBackendUrl = () => {
  if (typeof window !== 'undefined' && window.__INITIAL_DATA__ && window.__INITIAL_DATA__.backendUrl) {
    return window.__INITIAL_DATA__.backendUrl;
  }
  // For Vite, use import.meta.env
  if (import.meta && import.meta.env && import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  return 'http://localhost:5000';
};

const api = axios.create({
  baseURL: getBackendUrl(),
  withCredentials: true, // Important for CORS
  timeout: 10000, // 10 second timeout
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // If no token is found and we're not on the login page, redirect to login
      const isLoginRequest = config.url.includes('/login') || config.url.includes('/register');
      if (!isLoginRequest && typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Network error
    if (!error.response) {
      toast.error('Network error. Please check your connection.');
      return Promise.reject(error);
    }

    // Get the error message
    const message = error.response?.data?.message || error.message || 'An error occurred';
    
    // Handle specific error cases
    switch (error.response.status) {
      case 401:
        toast.error('Please login to continue');
        // Optional: Redirect to login page or clear invalid token
        localStorage.removeItem('token');
        break;
      case 403:
        toast.error('You do not have permission to perform this action');
        break;
      case 503:
        toast.error('Service temporarily unavailable. Please try again later.');
        break;
      default:
        toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;
