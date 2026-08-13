'use client';

import { useState } from 'react';
import { useSearchParams } from 'wouter';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, ShieldHalf } from 'lucide-react';
import { api } from '@/lib/api';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [complete, setComplete] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Your new password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await api.auth.resetPassword({ token, newPassword: password });
      setComplete(true);
    } catch (err: any) {
      setError(err?.message || 'This password reset link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-bg">
      <div className="relative flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
        <div aria-hidden className="pointer-events-none hero-glow-1 absolute left-1/2 top-1/3 -z-10 h-[400px] w-[400px] -translate-x-1/2 rounded-full blur-3xl" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <a href="/" className="inline-flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-2 text-white shadow-sm"><ShieldHalf className="h-5 w-5" /></div>
              <span className="font-tight text-xl font-semibold tracking-tight text-ink">Axiom<span className="text-accent">.</span></span>
            </a>
          </div>

          <section className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
            <h1 className="text-xl font-semibold text-ink">Choose a new password</h1>
            <p className="mt-1 text-sm text-muted">Your reset link can be used once and expires after one hour.</p>

            {!token ? (
              <div className="mt-6 space-y-4">
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">This password reset link is incomplete. Request a new one to continue.</p>
                <a href="/auth/forgot-password" className="flex w-full items-center justify-center rounded-xl bg-accent py-2.5 text-sm font-medium text-white shadow-sm hover:bg-accent/90">Request a new link</a>
              </div>
            ) : complete ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Your password has been reset. All existing sessions were signed out for your security.</div>
                <a href="/auth/sign-in" className="flex w-full items-center justify-center rounded-xl bg-accent py-2.5 text-sm font-medium text-white shadow-sm hover:bg-accent/90">Sign in with your new password</a>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="new-password" className="mb-1.5 block text-sm font-medium text-ink">New password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    <input id="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" className="w-full pl-10" autoComplete="new-password" minLength={8} required autoFocus />
                  </div>
                </div>
                <div>
                  <label htmlFor="confirm-new-password" className="mb-1.5 block text-sm font-medium text-ink">Confirm new password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    <input id="confirm-new-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full pl-10" autoComplete="new-password" minLength={8} required />
                  </div>
                </div>
                {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
                <button type="submit" disabled={loading} className="flex w-full items-center justify-center rounded-xl bg-accent py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent/90 disabled:opacity-50">
                  {loading ? 'Resetting password…' : 'Reset password'}
                </button>
              </form>
            )}

            <a href="/auth/sign-in" className="mt-6 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"><ArrowLeft className="h-3.5 w-3.5" />Back to sign in</a>
          </section>
        </motion.div>
      </div>
    </main>
  );
}
