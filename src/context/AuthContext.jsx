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

  const signup = async (fullName, email, phone) => {
    return api.post('/auth/signup', { fullName, email, phone });
  };

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

  const isSuperAdmin = Boolean(
    user?.isSuperAdmin ||
    user?.role === 'Super Administrator' ||
    (typeof user?.role === 'string' && user.role.toLowerCase().includes('super')) ||
    user?.email?.toLowerCase() === 'romantictsolutions@gmail.com' ||
    user?.email?.toLowerCase() === 'benirabok@gmail.com'
  );

  const isAdmin = Boolean(
    user?.isAdmin ||
    isSuperAdmin ||
    user?.role === 'Administrator' ||
    (typeof user?.role === 'string' && user.role.toLowerCase().includes('admin'))
  );

  const hasPermission = (permissionCode) => {
    if (!user) return false;
    if (isSuperAdmin || isAdmin) return true;
    return Array.isArray(user.permissions) && (user.permissions.includes(permissionCode) || user.permissions.includes('*'));
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signup,
      requestOtp,
      verifyOtp,
      loginWithPassword,
      logout,
      hasPermission,
      isAuthenticated: Boolean(user),
      isAdmin,
      isSuperAdmin,
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
