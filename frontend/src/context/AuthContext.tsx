// src/context/AuthContext.tsx
// Global auth state — user info, login/logout, role-aware access

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { AuthUser } from '../services/authService';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// All keys that must be wiped on logout (real JWT + demo session)
const AUTH_KEYS = ['ps_token', 'ps_user'];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate auth state from localStorage on first load
  useEffect(() => {
    const stored = localStorage.getItem('ps_user');
    const token = localStorage.getItem('ps_token');
    if (stored && token) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        AUTH_KEYS.forEach(k => localStorage.removeItem(k));
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((userData: AuthUser) => {
    localStorage.setItem('ps_token', userData.token);
    localStorage.setItem('ps_user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    // Wipe every auth key (covers both real JWT and demo tokens)
    AUTH_KEYS.forEach(k => localStorage.removeItem(k));
    setUser(null);
    // Hard-redirect to login so no protected route stays in history
    window.location.replace('/login');
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook — throws if used outside provider
export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
