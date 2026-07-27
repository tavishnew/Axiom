/**
 * Auth client for the Axiom dashboard
 * Uses fetch-based API for authentication
 */

export interface AuthResult {
  error?: { message: string };
  data?: unknown;
}

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const authClient = {
  signIn: {
    async email({ email, password }: { email: string; password: string; callbackURL?: string }) {
      try {
        const res = await fetch(`${API_BASE}/auth/sign-in`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
          credentials: 'include',
        });
        return await res.json() as AuthResult;
      } catch {
        return { error: { message: 'Network error - unable to reach server' } };
      }
    },
  },
  signUp: {
    async email({ name, email, password }: { name: string; email: string; password: string; callbackURL?: string }) {
      try {
        const res = await fetch(`${API_BASE}/auth/sign-up`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
          credentials: 'include',
        });
        return await res.json() as AuthResult;
      } catch {
        return { error: { message: 'Network error - unable to reach server' } };
      }
    },
  },
  signOut: async () => {
    try {
      await fetch(`${API_BASE}/auth/sign-out`, { method: 'POST', credentials: 'include' });
    } catch { /* ignore */ }
  },
  useSession: () => {
    return { data: null, isPending: false };
  },
};

export const { signIn, signUp, signOut, useSession } = authClient;
