import { useEffect } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import AnimatedLoader from '../common/AnimatedLoader';

interface ProtectedRouteProps {
  requiredRole?: string;
}

export default function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, isCheckingAuth, checkAuth, role, user } = useAuthStore();

  useEffect(() => {
    // Only check auth from server if user details are not yet hydrated
    if (!user && localStorage.getItem('billionbiz_token')) {
      checkAuth();
    }
  }, [user]);

  // Only show loader if we have a token but haven't determined auth state yet
  if (isCheckingAuth && !isAuthenticated) {
    return <AnimatedLoader message="Securing session..." />;
  }

  // If definitely not authenticated and no token in storage
  if (!isAuthenticated && !localStorage.getItem('billionbiz_token')) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && role && role.toUpperCase() !== requiredRole.toUpperCase() && role !== 'OWNER' && role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
