'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useLocation } from 'wouter';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, navigate] = useLocation();

  const fetchSession = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/session`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.data?.user) {
          setUser(data.data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const signOut = async () => {
    await fetch(`${API_BASE}/auth/sign-out`, { method: 'POST', credentials: 'include' });
    setUser(null);
    navigate('/auth/sign-in');
  };

  const refreshSession = async () => {
    await fetchSession();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();

  if (isLoading) {
    return <SessionSpinner />;
  }

  if (!isAuthenticated) {
    navigate('/auth/sign-in');
    return null;
  }

  return <>{children}</>;
}

function SessionSpinner() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-bg" data-testid="session-spinner">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-surface-2 border-t-accent" />
        <p className="text-sm text-muted">Checking session…</p>
      </div>
    </div>
  );
}