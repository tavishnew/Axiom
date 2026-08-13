import { useEffect, useState } from 'react';
import { useSearchParams, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { ShieldHalf, ArrowRight, ChevronDown, Mail, Lock, User, Loader2, UserRoundCheck } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { api } from '@/lib/api';

type WorkspaceRole = 'owner' | 'admin' | 'member';

const ROLE_LABELS: Record<WorkspaceRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
};

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<WorkspaceRole>('owner');
  const [invitedRole, setInvitedRole] = useState<WorkspaceRole | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviteWorkspace, setInviteWorkspace] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const [, navigate] = useLocation();

  const inviteToken = searchParams.get('invite_token');
  const effectiveRole = invitedRole ?? role;

  useEffect(() => {
    if (!inviteToken) return;

    let active = true;
    sessionStorage.setItem('pending_invite_token', inviteToken);
    setInviteLoading(true);
    setError('');

    api.invitations.get(inviteToken)
      .then(({ data }) => {
        if (!active) return;
        if (data.status !== 'pending') {
          setError(data.status === 'expired'
            ? 'This invitation has expired. Please request a new one.'
            : 'This invitation is no longer available.');
          return;
        }
        setEmail(data.email);
        setInviteWorkspace(data.organization.name);
        if (data.role === 'owner' || data.role === 'admin' || data.role === 'member') {
          setInvitedRole(data.role);
        }
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Unable to validate invitation');
      })
      .finally(() => {
        if (active) setInviteLoading(false);
      });

    return () => {
      active = false;
    };
  }, [inviteToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!inviteToken && role !== 'owner') {
      setError(`${ROLE_LABELS[role]} access is granted by an organization invitation. Ask an owner or admin to invite you, then open the link from that email.`);
      return;
    }

    setLoading(true);
    try {
      if (inviteToken) {
        await api.auth.acceptInvitation({ token: inviteToken, name, email, password });
        sessionStorage.removeItem('pending_invite_token');
        navigate('/dashboard');
        return;
      }

      const result = await authClient.signUp.email({ name, email, password, role });
      if (result.error) {
        setError(result.error.message);
        return;
      }
      window.location.href = '/policies';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create account');
    } finally {
      setLoading(false);
    }
  };

  const inviteUnavailable = Boolean(inviteToken && error && !inviteWorkspace && !inviteLoading);

  return (
    <main className="min-h-screen bg-bg">
      <div className="relative flex min-h-screen items-center justify-center px-4 py-6 sm:px-6 sm:py-8">
        <div aria-hidden className="pointer-events-none hero-glow-1 absolute left-1/2 top-1/3 -z-10 h-[400px] w-[400px] -translate-x-1/2 rounded-full blur-3xl" />

        <motion.div
          initial={{ opacity: 1, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm"
        >
          <div className="mb-6 text-center sm:mb-8">
            <a href="/" className="inline-flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white shadow-sm">
                <ShieldHalf className="h-5 w-5" />
              </div>
              <span className="font-serif text-2xl leading-none tracking-[-0.045em] text-ink">
                Axiom<span className="text-accent">.</span>
              </span>
            </a>
          </div>

          <div className="auth-panel border border-line bg-paper-raised p-6 sm:p-8">
            <h1 className="font-serif text-3xl font-normal leading-[0.98] tracking-[-0.04em] text-ink">Create an account</h1>
            <p className="mt-1 text-sm text-muted">
              {inviteWorkspace ? `Join ${inviteWorkspace} with your invitation.` : 'Create a secure authorization workspace'}
            </p>

            {inviteLoading && (
              <div className="mt-4 flex items-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                Validating your invitation…
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="auth-field-group">
                <label className="text-sm font-medium text-ink">Name</label>
                <div className="auth-field-wrap">
                  <User className="auth-field-icon" aria-hidden />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="auth-field"
                    placeholder="Your name"
                    autoComplete="name"
                    required
                    disabled={inviteUnavailable || inviteLoading || loading}
                  />
                </div>
              </div>

              <div className="auth-field-group">
                <label className="text-sm font-medium text-ink">Email</label>
                <div className="auth-field-wrap">
                  <Mail className="auth-field-icon" aria-hidden />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="auth-field"
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    readOnly={Boolean(inviteToken)}
                    disabled={inviteUnavailable || inviteLoading || loading}
                  />
                </div>
                {inviteToken && <p className="mt-1.5 text-xs text-muted">The invitation is linked to this email address.</p>}
              </div>

              <div className="auth-field-group">
                <label htmlFor="workspace-role" className="text-sm font-medium text-ink">Workspace role</label>
                <div className="auth-field-wrap">
                  <UserRoundCheck className="auth-field-icon" aria-hidden />
                  <select
                    id="workspace-role"
                    aria-label="Workspace role"
                    value={effectiveRole}
                    onChange={e => setRole(e.target.value as WorkspaceRole)}
                    disabled={Boolean(inviteToken) || inviteUnavailable || inviteLoading || loading}
                    className="auth-select"
                  >
                    <option value="owner">Owner — create a new workspace</option>
                    <option value="admin">Admin — join an existing workspace</option>
                    <option value="member">Member — join an existing workspace</option>
                  </select>
                  <ChevronDown className="auth-select-indicator" aria-hidden />
                </div>
                {inviteToken ? (
                  <p className="mt-1.5 text-xs text-muted">Your invitation assigns the <span className="font-medium text-ink">{ROLE_LABELS[effectiveRole]}</span> role. It cannot be changed here.</p>
                ) : role === 'owner' ? null : (
                  <p className="mt-1.5 text-xs text-muted">Admins and members join an existing workspace only through an invitation, so no one can grant themselves access.</p>
                )}
              </div>

              <div className="auth-field-group">
                <label className="text-sm font-medium text-ink">Password</label>
                <div className="auth-field-wrap">
                  <Lock className="auth-field-icon" aria-hidden />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="auth-field"
                    placeholder="Create a password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    disabled={inviteUnavailable || inviteLoading || loading}
                  />
                </div>
              </div>

              {error && (
                <div className="border-l-2 border-danger bg-danger-wash px-3 py-2 text-xs text-danger">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || inviteLoading || inviteUnavailable}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-accent py-2.5 text-sm font-medium text-white shadow-[0_8px_18px_-12px_rgba(47,96,74,0.34)] transition-all hover:bg-accent/90 hover:shadow-md disabled:opacity-50"
              >
                {loading ? 'Creating account...' : inviteWorkspace ? `Join ${inviteWorkspace}` : role === 'owner' ? 'Create owner workspace' : `Request ${ROLE_LABELS[role]} access`}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-muted">
                Already have an account?{' '}
                <a
                  href={inviteToken ? `/auth/sign-in?invite_token=${encodeURIComponent(inviteToken)}` : '/auth/sign-in'}
                  className="font-medium text-accent hover:underline"
                >
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
