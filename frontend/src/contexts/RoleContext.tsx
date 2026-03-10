/**
 * Compatibility shim — delegates to AuthContext.
 * All existing components that import from RoleContext continue to work unchanged.
 */
import type { ReactNode } from 'react';
import { AuthProvider, useAuth, type Role } from './AuthContext';

export type { Role };

export interface RoleContextValue {
  role: Role;
  salonId: string | null;
  masterId: string | null;
  /** No-op — role is derived from the authenticated user's JWT claim. */
  setRole: (role: Role, entityId?: string) => void;
}

export function RoleProvider({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

export function useRole(): RoleContextValue {
  const { role, salonId, masterId } = useAuth();
  return { role, salonId, masterId, setRole: () => {} };
}
