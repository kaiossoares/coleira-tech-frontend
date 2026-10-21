import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '@/api';
import { tokenStore } from '@/api/token';
import type { LoginInput, RegisterInput, User } from '@/api/types';

interface AuthState {
  user: User | null;
  /** true enquanto validamos o token salvo ao abrir o app. */
  booting: boolean;
  login(input: LoginInput): Promise<void>;
  register(input: RegisterInput): Promise<void>;
  logout(): Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [booting, setBooting] = useState(() => tokenStore.get() !== null);

  useEffect(() => {
    if (!tokenStore.get()) return;
    api
      .me()
      .then(setUser)
      .catch(() => tokenStore.set(null))
      .finally(() => setBooting(false));
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const s = await api.login(input);
    tokenStore.set(s.token);
    setUser(s.user);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const s = await api.register(input);
    tokenStore.set(s.token);
    setUser(s.user);
  }, []);

  const logout = useCallback(async () => {
    await api.logout().catch(() => undefined);
    tokenStore.set(null);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, booting, login, register, logout }), [user, booting, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return ctx;
}
