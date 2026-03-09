import { Navigate } from 'react-router';
import { useRole, type Role } from '@/contexts/RoleContext';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Roles that are allowed to render children. */
  allow: Role[];
  /**
   * Where to redirect if current role is not in `allow`.
   * Can be a static path or a function that receives current role + entity IDs.
   */
  redirect: string | ((role: Role, salonId: string | null, masterId: string | null) => string);
}

export function RoleGuard({ children, allow, redirect }: Props) {
  const { role, salonId, masterId } = useRole();

  if (!allow.includes(role)) {
    const to =
      typeof redirect === 'function' ? redirect(role, salonId, masterId) : redirect;
    return <Navigate to={to} replace />;
  }

  return <>{children}</>;
}
