import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { LoadingScreen } from '../ui/Loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, isLoading, loadUser, user } = useAuthStore();

  useEffect(() => {
    if (!user && localStorage.getItem('access_token')) {
      loadUser();
    }
  }, [user, loadUser]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated && !localStorage.getItem('access_token')) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
