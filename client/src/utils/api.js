import axios from 'axios';
import { toast } from 'react-toastify';

// Get the backend URL from environment or default to localhost
const getBackendUrl = () => {
  if (import.meta && import.meta.env && import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  return 'http://localhost:5000';
};

const api = axios.create({
  baseURL: getBackendUrl(),
  withCredentials: true,
  timeout: 10000, // 10 second timeout
});

// Add a request interceptor to attach the token
api.interceptors.request.use(
  (config) => {
    // Skip token for auth routes
    if (config.url.includes('/api/user/login') || config.url.includes('/api/user/register')) {
      return config;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      // If no token is found and we're not on an auth route, redirect to login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      return Promise.reject(new Error('No authentication token found'));
    }

    config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors
    if (!error.response) {
      toast.error('Network error. Please check your connection.');
      return Promise.reject(error);
    }

    // Handle authentication errors
    if (error.response.status === 401) {
      if (!error.config.url.includes('/api/user/login') && !error.config.url.includes('/api/user/register')) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    } else if (!window.isLoggingOut) {
      // Show other errors unless we're logging out
      toast.error(error.response?.data?.message || 'An error occurred');
    }

    return Promise.reject(error);
  }
);

export default api;
