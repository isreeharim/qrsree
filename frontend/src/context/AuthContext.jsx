import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import * as authApi from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('qr_admin_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('qr_admin_token'));
  const [verifying, setVerifying] = useState(Boolean(localStorage.getItem('qr_admin_token')));

  // On mount, if a token exists verify it and refresh the user object from server
  // This ensures role and other fields are always up to date
  useEffect(() => {
    if (!token) {
      setVerifying(false);
      return;
    }
    authApi.getMe()
      .then((data) => {
        const freshUser = data.user;
        localStorage.setItem('qr_admin_user', JSON.stringify(freshUser));
        setUser(freshUser);
      })
      .catch(() => {
        // Token is invalid/expired — clear everything
        localStorage.removeItem('qr_admin_token');
        localStorage.removeItem('qr_admin_user');
        setToken(null);
        setUser(null);
      })
      .finally(() => setVerifying(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only on mount

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
      verifying,
      isAuthenticated: Boolean(token),
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
    }),
    [user, token, verifying, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

