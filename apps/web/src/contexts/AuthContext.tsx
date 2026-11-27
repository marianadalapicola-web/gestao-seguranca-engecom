import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, getApiErrorMessage } from '../lib/api';
import type { Action, AuthUser, ModuleKey } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  can: (module: ModuleKey, action: Action) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSession = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    const handleExpired = () => setUser(null);
    window.addEventListener('engecom:session-expired', handleExpired);
    return () => window.removeEventListener('engecom:session-expired', handleExpired);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setUser(data.user);
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Não foi possível entrar. Tente novamente.'));
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
    }
  }, []);

  const can = useCallback(
    (module: ModuleKey, action: Action) => Boolean(user?.permissions?.[module]?.[action]),
    [user]
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, login, logout, refreshUser: loadSession, can }),
    [user, isLoading, login, logout, loadSession, can]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de um AuthProvider.');
  return ctx;
}
