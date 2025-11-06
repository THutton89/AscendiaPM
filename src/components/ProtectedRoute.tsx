import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permissions';
import { Permission } from '../types/permissions';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: Permission;
  fallback?: ReactNode;
}

export function ProtectedRoute({
  children,
  requiredPermission,
  fallback = null
}: ProtectedRouteProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  if (requiredPermission && !hasPermission(user.role, requiredPermission)) {
    return fallback;
  }

  return <>{children}</>;
}