import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { setAccessToken } from '@/api/client';
import {
  login as apiLogin,
  register as apiRegister,
  loginWithGoogle as apiLoginWithGoogle,
  loginWithFacebook as apiLoginWithFacebook,
  refreshSession,
  logout as apiLogout,
} from '@/api/auth';
import type { UserDto, RegisterRequest, AuthResponse } from '@/types';

export type Role = 'superadmin' | 'salon_admin' | 'master_admin' | 'client';

export function mapRole(backendRole: string): Role {
  switch (backendRole) {
    case 'SuperAdmin':   return 'superadmin';
    case 'SalonAdmin':   return 'salon_admin';
    case 'Master':
    case 'MasterAdmin':  return 'master_admin';
    default:             return 'client';
  }
}

export interface AuthContextValue {
  user: UserDto | null;
  role: Role;
  salonId: string | null;
  masterId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<UserDto>;
  register: (data: RegisterRequest) => Promise<UserDto>;
  loginWithGoogle: (credential: string) => Promise<UserDto>;
  loginWithFacebook: (accessToken: string) => Promise<UserDto>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applyAuth = useCallback((res: AuthResponse): UserDto => {
    setAccessToken(res.accessToken);
    setUser(res.user);
    return res.user;
  }, []);

  useEffect(() => {
    refreshSession()
      .then(applyAuth)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [applyAuth]);

  const login = async (email: string, password: string) =>
    applyAuth(await apiLogin({ email, password }));

  const register = async (data: RegisterRequest) =>
    applyAuth(await apiRegister(data));

  const loginWithGoogle = async (credential: string) =>
    applyAuth(await apiLoginWithGoogle(credential));

  const loginWithFacebook = async (accessToken: string) =>
    applyAuth(await apiLoginWithFacebook(accessToken));

  const logout = async () => {
    try { await apiLogout(); } catch {}
    setAccessToken(null);
    setUser(null);
  };

  const role: Role = user ? mapRole(user.role) : 'client';
  const salonId = user?.salonId ?? null;
  const masterId = user?.masterId ?? null;

  return (
    <AuthContext.Provider value={{
      user, role, salonId, masterId,
      isLoading,
      isAuthenticated: user !== null,
      login, register, loginWithGoogle, loginWithFacebook, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
