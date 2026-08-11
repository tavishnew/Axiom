'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { ShieldHalf, ArrowRight, Mail, Lock, User } from 'lucide-react';
import { authClient } from '@/lib/auth-client';

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const [, navigate] = useLocation();

  const inviteToken = searchParams.get('invite_token');

  useEffect(() => {
    if (inviteToken) {
      sessionStorage.setItem('pending_invite_token', inviteToken);
    }
  }, [inviteToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await authClient.signUp.email({ name, email, password });
    if (result.error) {
      setError(result.error.message);
      setLoading(false);
    } else {
      const pendingToken = sessionStorage.getItem('pending_invite_token');
      sessionStorage.removeItem('pending_invite_token');
      if (pendingToken) {
        window.location.href = `/invite/${encodeURIComponent(pendingToken)}`;
      } else {
        window.location.href = '/policies';
      }
    }
  };

  return (
    <main className="min-h-screen bg-bg">
      <div className="relative flex min-h-screen items-center justify-center px-6">
        {/* Background effects */}
        <div aria-hidden className="pointer-events-none hero-glow-1 absolute left-1/2 top-1/3 -z-10 h-[400px] w-[400px] -translate-x-1/2 rounded-full blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm"
        >
          {/* Logo */}
          <div className="mb-8 text-center">
            <a href="/" className="inline-flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-2 text-white shadow-sm">
                <ShieldHalf className="h-5 w-5" />
              </div>
              <span className="font-tight text-xl font-semibold tracking-tight text-ink">
                Axiom<span className="text-accent">.</span>
              </span>
            </a>
          </div>

          <div className="rounded-2xl border border-border bg-white p-8 shadow-sm">
            <h1 className="text-xl font-semibold text-ink">Create an account</h1>
            <p className="mt-1 text-sm text-muted">
              Start building your authorization rules
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-10"
                    placeholder="Your name"
                    autoComplete="name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10"
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10"
                    placeholder="Create a password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 border border-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-accent/90 hover:shadow-md disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Create account'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-muted">
                Already have an account?{' '}
                <a href="/auth/sign-in" className="font-medium text-accent hover:underline">
                  Sign in
                </a>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
