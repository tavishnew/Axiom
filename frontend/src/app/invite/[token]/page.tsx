'use client';

import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Shield, Loader2, CheckCircle, AlertCircle, Mail, User, ChevronRight, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { AuthProvider, useAuth } from '@/lib/auth.tsx';

interface InviteValidation {
  email: string;
  role: string;
  workspaceName: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  expiresAt: string;
}

export default function InvitePage() {
  const params = useParams();
  const [, router] = useLocation();
  const token = params.token as string | undefined;
  const { user, isLoading: authLoading } = useAuth();

  const [state, setState] = useState<'validating' | 'invalid' | 'expired' | 'accepted' | 'revoked' | 'ready' | 'accepting' | 'success' | 'error'>('validating');
  const [invite, setInvite] = useState<InviteValidation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateInvite = async (t: string) => {
    try {
      const { data } = await api.invitations.get(t);
      const normalizedInvite: InviteValidation = {
        email: data.email,
        role: data.role,
        workspaceName: data.organization.name,
        status: data.status,
        expiresAt: data.expiresAt,
      };
      setInvite(normalizedInvite);
      if (normalizedInvite.status === 'expired') setState('expired');
      else if (normalizedInvite.status === 'accepted') setState('accepted');
      else if (normalizedInvite.status === 'revoked') setState('revoked');
      else setState('ready');
    } catch (err: any) {
      setState('error');
      setError(err?.message || 'Failed to validate invitation');
    }
  };

  const handleAccept = async () => {
    if (!token || !invite) return;
    setState('accepting');
    try {
      await api.invitations.accept(token);
      setState('success');
      setTimeout(() => router('/dashboard'), 1500);
    } catch (err: any) {
      setState('error');
      setError(err?.message || 'Failed to accept invitation');
    }
  };

  useEffect(() => {
    if (token) validateInvite(token);
  }, [token]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-bg">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-4 max-w-md text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-accent" />
          <p className="mt-4 text-sm text-muted">Checking session...</p>
        </motion.div>
      </div>
    );
  }

  if (state === 'validating') {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-bg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-4 max-w-md text-center"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
          <h1 className="mb-2 font-serif text-3xl font-bold text-ink">Validating invitation...</h1>
          <p className="text-sm text-muted">Please wait while we verify your invitation</p>
        </motion.div>
      </div>
    );
  }

  if (state === 'invalid') {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-bg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-4 max-w-md text-center"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="mb-2 font-serif text-3xl font-bold text-ink">Invalid Invitation</h1>
          <p className="mb-8 text-sm text-muted">This invitation link is not valid or has been revoked.</p>
          <a href="/" className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-accent/90">
            <ChevronRight className="h-4 w-4" />
            Go home
          </a>
        </motion.div>
      </div>
    );
  }

  if (state === 'expired') {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-bg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-4 max-w-md text-center"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-2">
            <Shield className="h-8 w-8 text-accent" />
          </div>
          <h1 className="mb-2 font-serif text-3xl font-bold text-ink">Invitation Expired</h1>
          <p className="mb-8 text-sm text-muted">This invitation has expired. Please request a new one from your team admin.</p>
          <a href="/" className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-accent/90">
            <ChevronRight className="h-4 w-4" />
            Go home
          </a>
        </motion.div>
      </div>
    );
  }

  if (state === 'accepted') {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-bg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-4 max-w-md text-center"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
            <CheckCircle className="h-8 w-8 text-emerald-500" />
          </div>
          <h1 className="mb-2 font-serif text-3xl font-bold text-ink">Already Accepted</h1>
          <p className="mb-8 text-sm text-muted">This invitation has already been accepted.</p>
          <Button onClick={() => router('/dashboard')} className="gap-2">
            <ChevronRight className="h-4 w-4" />
            Go to Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  if (state === 'revoked') {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-bg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-4 max-w-md text-center"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
            <Lock className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="mb-2 font-serif text-3xl font-bold text-ink">Invitation Revoked</h1>
          <p className="mb-8 text-sm text-muted">This invitation has been revoked by the sender.</p>
          <a href="/" className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-accent/90">
            <ChevronRight className="h-4 w-4" />
            Go home
          </a>
        </motion.div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-bg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-4 max-w-md text-center"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="mb-2 font-serif text-3xl font-bold text-ink">Error</h1>
          <p className="mb-8 text-sm text-muted">{error || 'Something went wrong'}</p>
          <a href="/" className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-accent/90">
            <ChevronRight className="h-4 w-4" />
            Go home
          </a>
        </motion.div>
      </div>
    );
  }

  // state === 'ready' or 'accepting' or 'success'
  if (!invite) return null;

  const isReady = state === 'ready';
  const isAccepting = state === 'accepting';
  const isSuccess = state === 'success';

  // New recipients create an account using the email attached to this invitation.
  if (isReady && !user) {
    router(`/auth/sign-up?invite_token=${encodeURIComponent(token || '')}`);
    return null;
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-bg p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="rounded-2xl border border-border bg-surface p-8 shadow-xl">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
            <Shield className="h-8 w-8 text-accent" />
          </div>

          <div className="text-center">
            {isSuccess ? (
              <>
                <CheckCircle className="mx-auto mb-4 h-16 w-16 text-emerald-500" />
                <h1 className="mb-2 font-serif text-3xl font-bold text-ink">Welcome to {invite.workspaceName}!</h1>
                <p className="mb-6 text-sm text-muted">Your invitation has been accepted. Redirecting to dashboard...</p>
              </>
            ) : (
              <>
                <h1 className="mb-2 font-serif text-3xl font-bold text-ink">You're invited to join</h1>
                <p className="text-lg font-semibold text-accent mb-6">{invite.workspaceName}</p>
              </>
            )}

            <div className="mb-6 rounded-lg bg-surface-2 p-4 text-left">
              <div className="flex items-center gap-3 mb-3">
                <Mail className="h-5 w-5 text-muted" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted">Email</p>
                  <p className="text-sm font-medium text-ink">{invite.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <User className="h-5 w-5 text-muted" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted">Role</p>
                  <p className="text-sm font-medium text-ink capitalize">{invite.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-muted" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted">Expires</p>
                  <p className="text-sm font-medium text-ink">{new Date(invite.expiresAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>
            </div>

            {isAccepting && (
              <div className="flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
              </div>
            )}

            {isReady && (
              <Button
                onClick={handleAccept}
                className="w-full gap-2 py-3 text-lg"
                size="default"
              >
                Accept Invitation
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          Didn't expect this invitation? You can safely ignore this email.
        </p>
      </motion.div>
    </div>
  );
}