import { Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

export const ProtectedRoute = ({ children, requireEducator = false }) => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  useEffect(() => {
    // Clean up invalid user data
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (!user || !user._id || typeof user._id !== 'string') {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          window.location.reload();
        }
      } catch (error) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.reload();
      }
    }
  }, [userStr]);

  if (!token || !userStr) {
    // Redirect to login page with the return url
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  try {
    const user = JSON.parse(userStr);
    if (!user || !user._id) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    if (requireEducator && user.role !== 'educator') {
      // Redirect to home if not an educator
      return <Navigate to="/" replace />;
    }

    return children;
  } catch (error) {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
};

export default ProtectedRoute;
