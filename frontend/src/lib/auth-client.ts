/**
 * Auth client for the Axiom dashboard.
 * Converts all API failures, including unexpected HTML proxy responses, into
 * structured errors that the sign-in and sign-up screens can display safely.
 */

export interface AuthResult {
  error?: { message: string };
  data?: unknown;
}

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function parseAuthResponse(response: Response): Promise<AuthResult> {
  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');

  if (!isJson) {
    // Consume the body so callers do not see a secondary JSON parse exception.
    await response.text();
    return {
      error: {
        message: response.status >= 500
          ? 'The authentication service is temporarily unavailable. Please try again shortly.'
          : 'The server returned an unexpected response. Please try again.',
      },
    };
  }

  let body: AuthResult;
  try {
    body = await response.json() as AuthResult;
  } catch {
    return { error: { message: 'The server returned an invalid response. Please try again.' } };
  }

  if (!response.ok) {
    return body.error
      ? body
      : { error: { message: 'Unable to complete authentication. Please try again.' } };
  }

  return body;
}

async function sendAuthRequest(
  endpoint: '/auth/sign-in' | '/auth/sign-up',
  payload: Record<string, string>,
): Promise<AuthResult> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include',
    });

    return await parseAuthResponse(response);
  } catch {
    return { error: { message: 'Network error — unable to reach the authentication service.' } };
  }
}

export const authClient = {
  signIn: {
    email({ email, password }: { email: string; password: string; callbackURL?: string }) {
      return sendAuthRequest('/auth/sign-in', { email, password });
    },
  },
  signUp: {
    email({ name, email, password, role }: { name: string; email: string; password: string; role: 'owner' | 'admin' | 'member'; callbackURL?: string }) {
      return sendAuthRequest('/auth/sign-up', { name, email, password, role });
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
