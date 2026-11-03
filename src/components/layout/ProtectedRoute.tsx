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
    const storedToken = localStorage.getItem('billionbiz_token');
    if (!user && storedToken && !isCheckingAuth) {
      checkAuth();
    }
  }, [user, isCheckingAuth, checkAuth]);

  // If a token exists in storage but user profile is still hydrating, wait for checkAuth
  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('billionbiz_token');
  if (hasToken && !user) {
    return <AnimatedLoader message="Securing session..." />;
  }

  // If definitely not authenticated and no token in storage
  if (!isAuthenticated || !hasToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && role && role.toUpperCase() !== requiredRole.toUpperCase() && role !== 'OWNER' && role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
