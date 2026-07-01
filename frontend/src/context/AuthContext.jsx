import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import * as authApi from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('qr_admin_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('qr_admin_token'));

  const login = useCallback(async (username, password) => {
    const data = await authApi.login(username, password);
    localStorage.setItem('qr_admin_token', data.token);
    localStorage.setItem('qr_admin_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (username, email, password, department) => {
    const data = await authApi.register(username, email, password, department);
    localStorage.setItem('qr_admin_token', data.token);
    localStorage.setItem('qr_admin_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('qr_admin_token');
    localStorage.removeItem('qr_admin_user');
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
    }),
    [user, token, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
