import axios from 'axios';
import { toast } from 'react-hot-toast';

// Get backend URL only from .env
const getBackendUrl = () => {
  const envUrl = import.meta.env.VITE_BACKEND_URL;

  if (!envUrl) {
    throw new Error("VITE_BACKEND_URL is not defined in .env file");
  }

  return envUrl.replace(/\/$/, '');
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
    if (config.url?.includes('/api/user/login') || config.url?.includes('/api/user/register')) {
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
    if (error.code === 'ERR_CANCELED' || error.message === 'canceled' || window.isLoggingOut) {
      return Promise.reject(error);
    }

    // Handle network errors
    if (!error.response) {
      toast.error('Network error. Please check your connection.');
      return Promise.reject(error);
    }

    // Handle authentication errors
    if (error.response.status === 401) {
      const hasToken = !!localStorage.getItem('token');
      if (!hasToken || window.location.pathname.includes('/login')) {
        return Promise.reject(error);
      }

      if (!error.config?.url?.includes('/api/user/login') && !error.config?.url?.includes('/api/user/register')) {
        toast.error('Session expired. Please login again.', { id: 'session-expired' });
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
