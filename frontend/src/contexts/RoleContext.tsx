import { createContext, useContext, useState, type ReactNode } from 'react';

export type Role = 'superadmin' | 'salon_admin' | 'master_admin' | 'client';

interface RoleState {
  role: Role;
  salonId: string | null;
  masterId: string | null;
}

export interface RoleContextValue extends RoleState {
  setRole: (role: Role, entityId?: string) => void;
}

const STORAGE_KEY = 'bookvisit_role';

function loadState(): RoleState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as RoleState;
  } catch {}
  return { role: 'superadmin', salonId: null, masterId: null };
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RoleState>(loadState);

  const setRole = (role: Role, entityId?: string) => {
    const next: RoleState = {
      role,
      salonId: role === 'salon_admin' ? (entityId ?? null) : null,
      masterId: role === 'master_admin' ? (entityId ?? null) : null,
    };
    setState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  return (
    <RoleContext.Provider value={{ ...state, setRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within RoleProvider');
  return ctx;
}
