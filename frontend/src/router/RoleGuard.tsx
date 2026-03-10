import { Navigate } from 'react-router';
import { useAuth, type Role } from '@/contexts/AuthContext';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  allow: Role[];
  redirect: string | ((role: Role, salonId: string | null, masterId: string | null) => string);
}

export function RoleGuard({ children, allow, redirect }: Props) {
  const { role, salonId, masterId, isLoading, isAuthenticated } = useAuth();

  if (isLoading) return null;

  // Unauthenticated users trying to access protected routes go to login
  if (!isAuthenticated && !allow.includes('client')) {
    return <Navigate to="/login" replace />;
  }

  if (!allow.includes(role)) {
    const to = typeof redirect === 'function' ? redirect(role, salonId, masterId) : redirect;
    return <Navigate to={to} replace />;
  }

  return <>{children}</>;
}
