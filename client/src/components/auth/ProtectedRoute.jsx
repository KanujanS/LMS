import { Navigate, useLocation } from 'react-router-dom';
import { useContext, useEffect } from 'react';
import { AppContext } from '../../context/AppContext';

export const ProtectedRoute = ({ children, requireEducator = false }) => {
  const location = useLocation();
  const { userData } = useContext(AppContext);
  const token = localStorage.getItem('token');

  // Check authentication
  if (!token || !userData) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Check educator access
  if (requireEducator && userData.role !== 'educator') {
    return <Navigate to="/" state={{ from: location.pathname }} replace />;
  }

  return children;
};

export default ProtectedRoute;
