import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('romantic_token');
    if (token) {
      api.get('/auth/me')
        .then(res => {
          setUser(res.user);
        })
        .catch(() => {
          localStorage.removeItem('romantic_token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const requestOtp = async (email) => {
    return api.post('/auth/request-otp', { email });
  };

  const verifyOtp = async (email, code) => {
    const res = await api.post('/auth/verify-otp', { email, code });
    localStorage.setItem('romantic_token', res.token);
    setUser(res.user);
    return res;
  };

  const loginWithPassword = async (email, password) => {
    const res = await api.post('/auth/password-login', { email, password });
    localStorage.setItem('romantic_token', res.token);
    setUser(res.user);
    return res;
  };

  const logout = () => {
    localStorage.removeItem('romantic_token');
    setUser(null);
  };

  const hasPermission = (permissionCode) => {
    if (!user) return false;
    if (user.isAdmin) return true;
    return Array.isArray(user.permissions) && user.permissions.includes(permissionCode);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      requestOtp,
      verifyOtp,
      loginWithPassword,
      logout,
      hasPermission,
      isAuthenticated: Boolean(user),
      isAdmin: Boolean(user?.isAdmin),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
