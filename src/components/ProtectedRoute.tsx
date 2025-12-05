import React from 'react';
import { Navigate } from 'react-router-dom';
import AccountDeactivated from './auth/AccountDeactivated';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'ADMIN' | 'OFFICER' | 'CANDIDATE';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  if (!token || !userStr) {
    return <Navigate to="/admin/login" replace />;
  }

  try {
    const user = JSON.parse(userStr);

    // Check if account is deactivated (for officers and admins)
    if (user.status === 'INACTIVE') {
      if (user.role === 'OFFICER') {
        return <AccountDeactivated />;
      }
      // For admins, redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return <Navigate to="/admin/login" replace />;
    }

    // Check role authorization
    if (requiredRole && user.role !== requiredRole) {
      // Redirect based on user's actual role
      if (user.role === 'ADMIN') {
        return <Navigate to="/admin/dashboard" replace />;
      } else if (user.role === 'OFFICER') {
        return <Navigate to="/officer/dashboard" replace />;
      } else if (user.role === 'CANDIDATE') {
        return <Navigate to="/candidate/dashboard" replace />;
      }
      // Fallback to login
      return <Navigate to="/admin/login" replace />;
    }

    return <>{children}</>;
  } catch (error) {
    // If user data is invalid, clear and redirect to login
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/admin/login" replace />;
  }
};

export default ProtectedRoute;
