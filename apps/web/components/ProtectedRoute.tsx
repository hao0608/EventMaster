import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="p-4">Loading session...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If Admin, they usually can access everything, but if strict check fails:
    if (user.role === UserRole.ADMIN) {
       return <>{children}</>; 
    }
    return <div className="p-8 text-center text-red-600">Access Denied: You do not have permission to view this page.</div>;
  }

  return <>{children}</>;
};