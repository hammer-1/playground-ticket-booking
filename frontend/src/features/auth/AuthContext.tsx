import { createContext, useContext, useState, type ReactNode } from 'react';
import { api } from '../../lib/api';
import type { UserDto } from '../../lib/types';

interface AuthState {
  user: UserDto;
  token: string;
}

interface AuthContextValue {
  user: UserDto | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const STORAGE_KEY = 'floodlit_auth';
const AuthContext = createContext<AuthContextValue | null>(null);

function loadStored(): AuthState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthState) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState | null>(loadStored);

  const persist = (next: AuthState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setState(next);
  };

  const value: AuthContextValue = {
    user: state?.user ?? null,
    token: state?.token ?? null,
    login: async (email, password) => {
      const res = await api.login({ email, password });
      persist({ user: res.user, token: res.token });
    },
    register: async (name, email, password) => {
      const res = await api.register({ name, email, password });
      persist({ user: res.user, token: res.token });
    },
    logout: () => {
      localStorage.removeItem(STORAGE_KEY);
      setState(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
