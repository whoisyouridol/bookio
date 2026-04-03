import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { setAccessToken } from '@/api/client';
import {
  login as apiLogin,
  register as apiRegister,
  loginWithGoogle as apiLoginWithGoogle,
  loginWithGoogleAccessToken as apiLoginWithGoogleAccessToken,
  loginWithFacebook as apiLoginWithFacebook,
  refreshSession,
  reissueSession,
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
  login: (identifier: string, password: string) => Promise<UserDto>;
  register: (data: RegisterRequest) => Promise<UserDto>;
  loginWithGoogle: (credential: string) => Promise<UserDto>;
  loginWithGoogleAccessToken: (accessToken: string) => Promise<UserDto>;
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
    // After Google OAuth redirect, the access token is passed in the URL hash
    // (#_at=...) so subdomains can authenticate without relying on cross-origin cookie propagation.
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const at = hash.get('_at');

    if (at) {
      // Clean the token from the URL immediately
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      // Store the access token so the reissue call is authenticated
      setAccessToken(at);
      // Exchange for a fresh session: backend sets refresh cookie scoped to this origin
      reissueSession()
        .then(applyAuth)
        .catch(() => setIsLoading(false))
        .finally(() => setIsLoading(false));
    } else {
      refreshSession()
        .then(applyAuth)
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  }, [applyAuth]);

  const login = async (identifier: string, password: string) =>
    applyAuth(await apiLogin({ identifier, password }));

  const register = async (data: RegisterRequest) =>
    applyAuth(await apiRegister(data));

  const loginWithGoogle = async (credential: string) =>
    applyAuth(await apiLoginWithGoogle(credential));

  const loginWithGoogleAccessToken = async (accessToken: string) =>
    applyAuth(await apiLoginWithGoogleAccessToken(accessToken));

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
      login, register, loginWithGoogle, loginWithGoogleAccessToken, loginWithFacebook, logout,
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
