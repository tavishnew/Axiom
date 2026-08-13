'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, ShieldHalf } from 'lucide-react';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.auth.forgotPassword(email);
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || 'Unable to request a password reset. Please try again.');
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
            <h1 className="text-xl font-semibold text-ink">Reset your password</h1>
            <p className="mt-1 text-sm text-muted">Enter your email and we will send a secure, one-time reset link.</p>

            {submitted ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                  If an active account exists for this email address, a reset link has been sent. Please check your inbox.
                </div>
                <a href="/auth/sign-in" className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent/90">
                  Return to sign in
                </a>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full pl-10" autoComplete="email" required autoFocus />
                  </div>
                </div>
                {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
                <button type="submit" disabled={loading} className="flex w-full items-center justify-center rounded-xl bg-accent py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent/90 disabled:opacity-50">
                  {loading ? 'Sending reset link…' : 'Send reset link'}
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
