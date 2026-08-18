'use client';

import { useLocation } from 'wouter';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Copy, Trash2, Plus, Building2, Key, Users as UsersIcon, CreditCard, User as LucideUser, Check, RefreshCw, Loader2, Mail, Lock, Shield, X, ArrowUpRight } from 'lucide-react';
import { api, type Organization, type ApiKey, type Session, type Invitation } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth.tsx';
import { useConfirm } from '@/components/ConfirmProvider';

const navItems = [
 { href: '/settings', label: 'Organization', icon: Building2 },
 { href: '/settings/api-keys', label: 'API Keys', icon: Key },
 { href: '/settings/team', label: 'Team Members', icon: UsersIcon },
 { href: '/settings/billing', label: 'Billing', icon: CreditCard },
 { href: '/settings/profile', label: 'Profile', icon: LucideUser },
];

export default function SettingsPage() {
 const confirm = useConfirm();
 const [pathname, router] = useLocation();
 const { user } = useAuth();
 const canManageTeam = user?.role === 'owner' || user?.role === 'admin';
 const [org, setOrg] = useState<Organization | null>(null);
 const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
 const [loading, setLoading] = useState(true);
 const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

 // Team members state
 const [teamMembers, setTeamMembers] = useState<any[]>([]);
 const [teamLoading, setTeamLoading] = useState(false);
 const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
 const [inviteEmail, setInviteEmail] = useState('');
 const [inviteName, setInviteName] = useState('');
 const [inviteRole, setInviteRole] = useState('member');
 const [inviting, setInviting] = useState(false);
 const [inviteError, setInviteError] = useState<string | null>(null);

 // Pending invitations state
 const [invitations, setInvitations] = useState<Invitation[]>([]);
 const [invitationsLoading, setInvitationsLoading] = useState(false);
 const [resendingId, setResendingId] = useState<string | null>(null);
 const [revokingId, setRevokingId] = useState<string | null>(null);
 const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);
 const [lastInviteLink, setLastInviteLink] = useState<{ invitationId: string; url: string } | null>(null);

 // Billing state
 const [billing, setBilling] = useState<any>(null);
 const [billingLoading, setBillingLoading] = useState(false);

 // Profile state
 const [profile, setProfile] = useState<any>(null);
 const [profileLoading, setProfileLoading] = useState(false);
 const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false);
 const [deleteAccountConfirmation, setDeleteAccountConfirmation] = useState('');
 const [deletingAccount, setDeletingAccount] = useState(false);
 const [deleteOrgDialogOpen, setDeleteOrgDialogOpen] = useState(false);
 const [deleteOrgConfirmation, setDeleteOrgConfirmation] = useState('');
 const [deletingOrg, setDeletingOrg] = useState(false);

 // Dialog states
 const [newKeyDialogOpen, setNewKeyDialogOpen] = useState(false);
 const [newKeyName, setNewKeyName] = useState('');
 const [creatingKey, setCreatingKey] = useState(false);
 const [newKeyValue, setNewKeyValue] = useState<string | null>(null);

 const fetchOrgAndKeys = useCallback(async () => {
 setLoading(true);
 try {
 const [orgs, keys] = await Promise.all([
 api.organizations.list(),
 api.apiKeys.list({ limit: 100 }),
 ]);
 setOrg(orgs[0] || null);
 setApiKeys(keys.data);
 } catch (err) {
 console.error(err);
 toast.error('Failed to load organization data');
 } finally {
 setLoading(false);
 }
 }, []);

 const fetchTeam = useCallback(async () => {
 setTeamLoading(true);
 try {
 const members = await api.team.list();
 setTeamMembers(members);
 } catch (err) {
 console.error(err);
 toast.error('Failed to load team');
 } finally {
 setTeamLoading(false);
 }
 }, []);

 const fetchInvitations = useCallback(async () => {
 setInvitationsLoading(true);
  try {
  const { data } = await api.invitations.list({ includeTerminal: true });
  setInvitations(data);
 } catch (err) {
 console.error(err);
 toast.error('Failed to load invitations');
 } finally {
 setInvitationsLoading(false);
 }
 }, []);

 const fetchBilling = useCallback(async () => {
 setBillingLoading(true);
 try {
 const res = await api.billing.getSubscription();
 setBilling(res.data);
 } catch (err) {
 console.error(err);
 } finally {
 setBillingLoading(false);
 }
 }, []);

 const fetchProfile = useCallback(async () => {
 setProfileLoading(true);
 try {
 const [profileRes, sessionsRes] = await Promise.all([
 api.auth.getProfile(),
 api.auth.listSessions(),
 ]);
 const user = profileRes.data;
 const sessions = sessionsRes.map(s => ({
 id: s.id,
 location: 'Unknown',
 device: 'Current session',
 current: true,
 }));
 if (sessions.length > 0) {
 sessions[0].current = true;
 sessions.slice(1).forEach(s => s.current = false);
 }
 setProfile({
 name: user.name,
 email: user.email,
 timezone: 'utc',
 lastPasswordChange: user.updatedAt?.split('T')[0] || '2025-01-10',
 twoFactorEnabled: false,
 activeSessions: sessions,
 });
 } catch (err) {
 console.error(err);
 toast.error('Failed to load profile');
 } finally {
 setProfileLoading(false);
 }
 }, []);

 useEffect(() => {
 if (pathname === '/settings' || pathname.startsWith('/settings/api-keys')) {
 fetchOrgAndKeys();
 } else {
 setLoading(false);
 }
 }, [pathname, fetchOrgAndKeys]);

 useEffect(() => {
 if (pathname.startsWith('/settings/team')) {
 fetchTeam();
 fetchInvitations();
 }
 }, [pathname, fetchTeam, fetchInvitations]);

 useEffect(() => {
 if (pathname.startsWith('/settings/billing')) fetchBilling();
 }, [pathname, fetchBilling]);

 useEffect(() => {
 if (pathname.startsWith('/settings/profile')) fetchProfile();
 }, [pathname, fetchProfile]);

 const handleCopy = async (text: string, index: number) => {
 try {
 await navigator.clipboard.writeText(text);
 setCopiedIndex(index);
 setTimeout(() => setCopiedIndex(null), 2000);
 toast.success('Copied to clipboard');
 } catch {
 /* ignore */
 }
 };

 const handleRevoke = async (id: string) => {
 if (!(await confirm({
 title: 'Revoke this API key?',
 description: 'Any service using this key will immediately lose access. This cannot be undone.',
 confirmLabel: 'Revoke key',
 cancelLabel: 'Keep key',
 }))) return;
 try {
 await api.apiKeys.delete(id);
 const keys = await api.apiKeys.list({ limit: 100 });
 setApiKeys(keys.data);
 toast.success('API key revoked');
 } catch (err) {
 console.error('Failed to revoke API key:', err);
 toast.error('Failed to revoke API key');
 }
 };

 const handleCreateApiKey = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!newKeyName.trim()) return;
 setCreatingKey(true);
 try {
 const key = await api.apiKeys.create({ name: newKeyName.trim() });
 if (!key.key) {
 toast.error('The API key was created, but its one-time secret was not returned. Revoke it and create a new key.');
 return;
 }
 setNewKeyValue(key.key);
 toast.success('API key created. Copy it now — it will not be shown again.');
 setNewKeyName('');
 setNewKeyDialogOpen(false);
 const keys = await api.apiKeys.list({ limit: 100 });
 setApiKeys(keys.data);
 } catch (err) {
 console.error(err);
 toast.error('Failed to create API key');
 } finally {
 setCreatingKey(false);
 }
 };

 const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

 const handleInviteMember = async (e?: React.FormEvent) => {
 if (e) e.preventDefault();
 const email = inviteEmail.trim();
 if (!email) {
 setInviteError('Email is required');
 return;
 }
 if (!isValidEmail(email)) {
 setInviteError('Enter a valid email address');
 return;
 }
 setInviteError(null);
 setInviting(true);
 try {
  const { data } = await api.invitations.create({ email, name: inviteName.trim() || undefined, role: inviteRole });
  const link = data.inviteLink || data.acceptUrl;
  if (link) setLastInviteLink({ invitationId: data.id, url: link });
  if (data.deliveryStatus === 'sent') {
  toast.success('Invitation sent to ' + email);
  } else if (data.deliveryStatus === 'configuration_error') {
  toast.error('Email delivery is not configured. The invitation was saved but was not sent.');
  } else {
  toast.error('Invitation could not be sent. Check your email configuration.');
  }
  setInviteDialogOpen(false);
  setInviteEmail('');
  setInviteName('');
  setInviteRole('member');
  await fetchInvitations();
 } catch (err: any) {
 const msg = err?.message || 'Failed to send invitation';
 setInviteError(msg);
 toast.error(msg);
 } finally {
 setInviting(false);
 }
 };

 const handleResendInvitation = async (inv: Invitation) => {
 setResendingId(inv.id);
 try {
  const { data } = await api.invitations.resend(inv.id);
  if (data.inviteLink) setLastInviteLink({ invitationId: inv.id, url: data.inviteLink });
  if (data.deliveryStatus === 'sent') {
  toast.success('Invitation resent to ' + inv.email);
  } else if (data.deliveryStatus === 'configuration_error') {
  toast.error('Email delivery is not configured. The invitation was updated but was not sent.');
  } else {
  toast.error('Invitation could not be sent. Check your email configuration.');
  }
  await fetchInvitations();
 } catch (err: any) {
 toast.error(err?.message || 'Failed to resend invitation');
 } finally {
 setResendingId(null);
 }
 };

 const handleRevokeInvitation = async (inv: Invitation) => {
 if (!(await confirm({
 title: `Revoke invitation to ${inv.email}?`,
 description: 'The recipient will no longer be able to use this invitation link.',
 confirmLabel: 'Revoke invitation',
 cancelLabel: 'Keep invitation',
 }))) return;
 setRevokingId(inv.id);
  try {
  await api.invitations.revoke(inv.id);
  toast.success('Invitation revoked');
  await fetchInvitations();
  } catch (err: any) {
  toast.error(err?.message || 'Failed to revoke invitation');
 } finally {
 setRevokingId(null);
 }
 };

 const handleCopyInviteLink = async (inv: Invitation) => {
  const url = lastInviteLink?.invitationId === inv.id ? lastInviteLink.url : '';
  if (!url) {
  toast.error('The secure invite link is only available immediately after sending or resending. Resend this invitation to generate a new link.');
  return;
  }
  try {
  await navigator.clipboard.writeText(url);
  setCopiedInviteId(inv.id);
  window.setTimeout(() => setCopiedInviteId(null), 1800);
  toast.success('Invite link copied to clipboard');
 } catch {
 toast.error('Could not access clipboard');
 }
 };

 function expiresInLabel(expiresAt: string): { label: string; expired: boolean } {
 const target = new Date(expiresAt).getTime();
 const diffMs = target - Date.now();
 if (diffMs <= 0) return { label: 'expired', expired: true };
 const days = Math.floor(diffMs / 86400000);
 const hours = Math.floor(diffMs / 3600000) % 24;
 if (days >= 1) return { label: 'in ' + days + ' day' + (days === 1 ? '' : 's'), expired: false };
 if (hours >= 1) return { label: 'in ' + hours + ' hour' + (hours === 1 ? '' : 's'), expired: false };
 const mins = Math.max(1, Math.floor(diffMs / 60000));
 return { label: 'in ' + mins + ' minute' + (mins === 1 ? '' : 's'), expired: false };
 }

 const handleRemoveMember = async (member: any) => {
 if (!(await confirm({
 title: `Remove ${member.name || member.email}?`,
 description: 'This removes their workspace access. You can invite them again later if needed.',
 confirmLabel: 'Remove member',
 cancelLabel: 'Keep member',
 }))) return;
 try {
 await api.team.remove(member.id);
 toast.success('Team member removed');
 setTeamMembers(prev => prev.filter(m => m.id !== member.id));
 } catch (err) {
 console.error(err);
 toast.error('Failed to remove team member');
 }
 };

const handleTransferOwnership = async (member: any) => {
 if (!(await confirm({
 title: `Transfer ownership to ${member.name || member.email}?`,
 description: 'You will become a member and lose owner permissions. This action is irreversible.',
 confirmLabel: 'Transfer ownership',
 cancelLabel: 'Cancel',
 }))) return;
 try {
 await api.team.transferOwnership(member.id);
 toast.success('Ownership transferred');
 fetchTeam();
 } catch (err: any) {
 console.error(err);
 toast.error(err?.message || 'Failed to transfer ownership');
 }
};

 const handleUpdatePayment = async () => {
 try {
 const { data } = await api.billing.createPortal();
 if (data?.url) window.location.href = data.url;
 } catch (err) {
 console.error(err);
 toast.error('Failed to open billing portal');
 }
 };

const handleUpgrade = async () => {
 try {
 const { data } = await api.billing.createCheckout({ priceId: 'price_pro_monthly' });
 if (data?.url) window.location.href = data.url;
 } catch (err) {
 console.error(err);
 toast.error('Failed to start checkout');
 }
};



const handleRevokeSession = async (sessionId: string) => {
 if (!(await confirm({
 title: 'Revoke this session?',
 description: 'That device will be signed out and must authenticate again to regain access.',
 confirmLabel: 'Revoke session',
 cancelLabel: 'Keep session',
 }))) return;
 try {
 await api.auth.revokeSession(sessionId);
 toast.success('Session revoked');
 fetchProfile();
 } catch (err) {
 console.error(err);
 toast.error('Failed to revoke session');
 }
};

const handleDeleteAccount = async () => {
 if (deletingAccount) return;
 if (deleteAccountConfirmation !== 'DELETE') {
 toast.error('Type DELETE to confirm account deletion');
 return;
 }
 setDeletingAccount(true);
 try {
 await api.auth.deleteAccount();
 toast.success('Your account has been deleted');
 window.location.assign('/auth/sign-in');
 } catch (err: any) {
 console.error(err);
 const msg = err?.message || '';
 if (msg.includes('last owner') || msg.includes('Transfer organization ownership')) {
 toast.error("You can't delete your account because you are the only owner of this organization. Transfer ownership to another member first, or delete the organization instead.");
 } else if (msg.includes('409') || msg.includes('Conflict')) {
 toast.error("You can't delete your account because you are the only owner of this organization. Transfer ownership to another member first, or delete the organization instead.");
 } else {
 toast.error('Unable to delete account');
 }
 } finally {
 setDeletingAccount(false);
 }
};

const handleDeleteOrg = async () => {
 if (!confirm('This will delete your entire organization and all its data. Type DELETE to confirm.')) {
 return;
 }
 const input = prompt('Type DELETE to confirm organization deletion:');
 if (input !== 'DELETE') {
 toast.error('Confirmation failed');
 return;
 }
 setDeletingOrg(true);
 try {
 await api.organizations.delete(org?.id || '');
 toast.success('Organization deleted');
 window.location.assign('/auth/sign-in');
 } catch (err: any) {
 console.error(err);
 toast.error(err?.message || 'Unable to delete organization');
 } finally {
 setDeletingOrg(false);
 }
};

const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
 e.preventDefault();
 const formData = new FormData(e.currentTarget);
 const currentPassword = formData.get('currentPassword') as string;
 const newPassword = formData.get('newPassword') as string;
 const confirmPassword = formData.get('confirmPassword') as string;

 if (newPassword !== confirmPassword) {
 toast.error('Passwords do not match');
 return;
 }

 if (newPassword.length < 8) {
 toast.error('Password must be at least 8 characters');
 return;
 }

 try {
 await api.auth.changePassword({ currentPassword, newPassword });
 toast.success('Password changed successfully');
 e.currentTarget.reset();
 } catch (err) {
 toast.error('Failed to change password');
 }
 };

 const isOrganizationPage = pathname === '/settings';
 const isApiKeysPage = pathname.startsWith('/settings/api-keys');
 const isTeamPage = pathname.startsWith('/settings/team');
 const isBillingPage = pathname.startsWith('/settings/billing');
 const isProfilePage = pathname.startsWith('/settings/profile');

 return (
 <div className="editorial-page animate-editorial-rise">
 <div className="mb-6">
 <h1 className="font-serif text-[clamp(2rem,4vw,3.1rem)] font-normal leading-[0.98] tracking-[-0.035em] text-ink">Settings</h1>
 <p className="mt-0.5 text-sm text-muted">Manage your organization and API access</p>
</div>

 <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
 <div className="lg:col-span-1">
 <nav className="grid grid-cols-2 gap-1 rounded-md border border-border bg-surface p-2 shadow-sm lg:block">
 {navItems.map((item, i) => {
 const Icon = item.icon;
 const isActive =
 (item.href === '/settings' && pathname === '/settings') ||
 (item.href === '/settings/api-keys' && pathname.startsWith('/settings/api-keys')) ||
 (item.href === '/settings/team' && pathname.startsWith('/settings/team')) ||
 (item.href === '/settings/billing' && pathname.startsWith('/settings/billing')) ||
 (item.href === '/settings/profile' && pathname.startsWith('/settings/profile'));

 return (
 <motion.a
 key={item.label}
 href={item.href}
 onClick={(e) => { e.preventDefault(); router(item.href); }}
 initial={{ opacity: 0, x: -8 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ delay: i * 0.03 }}
 className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${isActive ? 'bg-accent text-white shadow-sm' : 'text-muted hover:bg-surface-2 hover:text-ink'}`}
 >
 <Icon className="h-4 w-4" />
 {item.label}
</motion.a>
 );
 })}
</nav>
</div>

 <div className="space-y-5 lg:col-span-3">
 {isOrganizationPage && (
 <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-md border border-border bg-surface p-4 shadow-sm sm:p-6">
 <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
 <Building2 className="h-5 w-5 text-accent" /> Organization
</h2>
 {loading ? (
 <p className="mt-5 text-sm text-muted">Loading</p>
 ) : (
 <div className="mt-5 space-y-4">
 <div>
 <Label className="mb-1.5 block text-sm font-medium text-ink">Organization Name</Label>
 <Input value={org?.name || ''} readOnly aria-readonly="true" className="w-full max-w-md cursor-not-allowed bg-surface-2 text-muted" />
</div>
 <div>
 <Label className="mb-1.5 block text-sm font-medium text-ink">Organization Slug</Label>
 <Input value={org?.slug || ''} readOnly aria-readonly="true" className="w-full max-w-md cursor-not-allowed bg-surface-2 text-muted" />
 <p className="mt-1 text-xs text-muted">Used in API requests: api.axiom.dev/v1/orgs/{org?.slug || 'your-org'}</p>
</div>
</div>
 )}
 <div className="mt-6 border-t border-border pt-4">
 <p className="max-w-xl text-sm leading-6 text-muted">Organization name and slug are shown for reference. Updating organization details is not available in this workspace yet, so no changes can be saved from this page.</p>
 </div>
</motion.div>
 )}

 {isApiKeysPage && (
 <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-md border border-border bg-surface p-4 shadow-sm sm:p-6">
 <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
 <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
 <Key className="h-5 w-5 text-accent" /> API Keys
</h2>
 <Button variant="outline" onClick={() => setNewKeyDialogOpen(true)} className="w-full gap-2 sm:w-auto"><Plus className="h-4 w-4" />New Key</Button>
</div>
 {loading ? (
 <p className="mt-5 text-sm text-muted">Loading</p>
 ) : apiKeys.length === 0 ? (
 <div className="mt-5 flex flex-col items-center justify-center py-8 text-sm text-muted">
 <Key className="mb-2 h-8 w-8 opacity-30" />
 <p>No API keys yet</p>
</div>
 ) : (
 <div className="mt-5 space-y-3">
 {apiKeys.map((key, i) => (
 <div key={key.id} className="flex flex-col gap-3 rounded-md border border-border bg-surface p-3 transition-colors hover:bg-surface-2/50 sm:flex-row sm:items-center sm:justify-between">
 <div className="min-w-0">
 <p className="truncate text-sm font-medium text-ink">{key.name}</p>
 <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-muted">
 <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono">{key.prefix}</code>
 <span>Created: {new Date(key.createdAt).toLocaleDateString()}</span>
 {key.lastUsedAt && <span>Last used: {new Date(key.lastUsedAt).toLocaleDateString()}</span>}
 {key.revokedAt && <span className="text-red-500">Revoked</span>}
</div>
</div>
 <div className="flex flex-wrap items-center gap-2">
 <Button variant="ghost" size="sm" onClick={() => handleCopy(`${key.prefix}...`, i)} className="gap-1">
 {copiedIndex === i ? (<><Check className="mr-1 inline h-3.5 w-3.5" />Copied</>) : (<><Copy className="mr-1 inline h-3.5 w-3.5" />Copy</>)}
</Button>
 {!key.revokedAt && (
 <Button variant="ghost" size="sm" onClick={() => handleRevoke(key.id)} className="gap-1 text-red-600 hover:bg-red-50">
 <Trash2 className="h-3.5 w-3.5" />Revoke
</Button>
 )}
</div>
</div>
 ))}
</div>
 )}
 <Dialog open={newKeyDialogOpen} onOpenChange={setNewKeyDialogOpen}>
 <DialogContent className="sm:max-w-[500px]">
 <DialogHeader>
 <DialogTitle>Create API Key</DialogTitle>
 <DialogDescription>Give your API key a descriptive name. The key will only be shown once</DialogDescription>
</DialogHeader>
 <form onSubmit={handleCreateApiKey} className="space-y-4 p-4 sm:p-6">
 <div className="space-y-2">
 <Label htmlFor="key-name">Key Name</Label>
 <Input id="key-name" value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder="e.g., Production Server, CI/CD Pipeline" autoFocus />
</div>
 <DialogFooter className="flex justify-end space-x-3">
 <Button type="button" variant="outline" onClick={() => setNewKeyDialogOpen(false)} disabled={creatingKey}>Cancel</Button>
 <Button type="submit" disabled={creatingKey || !newKeyName.trim()}>
 {creatingKey ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Key'}
</Button>
</DialogFooter>
</form>
</DialogContent>
	</Dialog>
	<Dialog open={Boolean(newKeyValue)} onOpenChange={(open) => { if (!open) setNewKeyValue(null); }}>
	  <DialogContent className="sm:max-w-[560px]">
	    <DialogHeader>
	      <DialogTitle>Copy your API key now</DialogTitle>
	      <DialogDescription>This is the only time the full secret will be displayed. Store it in a secure password manager or secret vault.</DialogDescription>
	    </DialogHeader>
	    <div className="space-y-4 px-4 pb-4 sm:px-6 sm:pb-6">
	      <code className="block max-h-32 overflow-auto rounded-md border border-border bg-surface-2 p-3 font-mono text-xs leading-6 text-ink">{newKeyValue}</code>
	      <DialogFooter>
	        <Button variant="outline" onClick={() => setNewKeyValue(null)}>I stored it safely</Button>
	        <Button onClick={() => { if (newKeyValue) handleCopy(newKeyValue, -1); }} className="gap-2"><Copy className="h-4 w-4" />Copy key</Button>
	      </DialogFooter>
	    </div>
	  </DialogContent>
	</Dialog>
	</motion.div>
	)}

	 {isTeamPage && (
 <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-md border border-border bg-surface p-4 shadow-sm sm:p-6">
 <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
 <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
 <UsersIcon className="h-5 w-5 text-accent" /> Team Members
</h2>
 {canManageTeam && <Button onClick={() => setInviteDialogOpen(true)} className="w-full gap-2 sm:w-auto"><Plus className="h-4 w-4" />Invite Member</Button>}
</div>
 <p className="mt-4 text-sm text-muted">{canManageTeam ? 'Invite and manage team access. Roles are assigned through a secure invitation.' : 'View the members in your organization. Role changes are managed by owners and admins.'}</p>
 <div className="mt-6 space-y-6">
 <div>
 <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Active members ({teamMembers.length})</h3>
 {teamLoading ? (
 <div className="flex items-center justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
 ) : teamMembers.length === 0 ? (
 <div className="rounded-lg border border-dashed border-border bg-surface-2/30 py-6 text-center text-sm text-muted">
 <LucideUser className="mx-auto mb-1 h-6 w-6 opacity-40" />No members yet
</div>
 ) : (
 <div className="space-y-2">
 {teamMembers.map((member) => (
 <div key={member.id} className="flex flex-col gap-3 rounded-lg border border-surface-2 p-3 transition-colors hover:bg-surface-2/40 sm:flex-row sm:items-center sm:justify-between">
 <div className="flex min-w-0 items-center gap-3">
 <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2">
 <LucideUser className="h-4 w-4 text-accent" />
</div>
 <div className="min-w-0">
 <p className="truncate text-sm font-medium text-ink">{member.name || member.email}</p>
 <p className="truncate text-xs text-muted">{member.email}</p>
</div>
</div>
 <div className="flex flex-wrap items-center gap-2">
 <span className="rounded border border-border bg-surface-2 px-2 py-1 text-xs font-medium capitalize text-muted">{member.role?.toLowerCase?.() || 'member'}</span>
 {canManageTeam && user?.role === 'owner' && member.id !== user.id && member.role !== 'owner' && (
  <Button aria-label="Transfer ownership" variant="ghost" size="sm" onClick={() => handleTransferOwnership(member)} className="h-8 gap-1 px-2 text-xs text-accent hover:bg-accent/5">
   <Shield className="h-3.5 w-3.5" />Transfer Ownership
  </Button>
 )}
 {canManageTeam && <Button aria-label="Remove member" variant="ghost" size="sm" onClick={() => handleRemoveMember(member)} className="h-8 w-8 p-0 text-red-600 hover:bg-red-50">
 <Trash2 className="h-3.5 w-3.5" />
</Button>}
</div>
</div>
 ))}
</div>
 )}
</div>

 <div>
 <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Invitations ({invitations.length})</h3>
 {invitationsLoading ? (
 <div className="flex items-center justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
 ) : invitations.length === 0 ? (
 <div className="rounded-lg border border-dashed border-border bg-surface-2/30 py-6 text-center text-sm text-muted">
 <Mail className="mx-auto mb-1 h-6 w-6 opacity-40" />No invitations yet
</div>
 ) : (
 <div className="space-y-2">
 {invitations.map((inv) => {
 const exp = expiresInLabel(inv.expiresAt);
 const isActionable = inv.status === 'pending' && !exp.expired;
 const statusColor = {
 pending: 'bg-surface-2 text-accent',
 accepted: 'bg-emerald-50 text-emerald-700',
 expired: 'bg-red-50 text-red-700',
 revoked: 'bg-slate-100 text-slate-700',
 }[inv.status];
 const deliveryColor = {
 pending: 'bg-slate-100 text-slate-700',
 sent: 'bg-surface-2 text-accent',
 failed: 'bg-red-50 text-red-700',
 configuration_error: 'bg-red-50 text-red-700',
 }[inv.deliveryStatus];
 return (
 <div key={inv.id} className="flex flex-col gap-3 rounded-lg border border-surface-2 bg-surface p-3 sm:flex-row sm:items-center sm:justify-between">
 <div className="flex min-w-0 items-start gap-3">
 <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2">
 <Mail className="h-4 w-4 text-accent" />
</div>
 <div className="min-w-0 flex-1">
 <p className="truncate text-sm font-medium text-ink">{inv.email}</p>
 <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
 <span className="inline-flex items-center rounded-full bg-surface-2 px-2 py-0.5 font-medium capitalize text-ink/80">{inv.role}</span>
 <span>Invited by {inv.invitedBy?.name || inv.invitedBy?.email || 'unknown'}</span>
 <span>on {new Date(inv.createdAt).toLocaleDateString()}</span>
 <span>{inv.status === 'pending' ? `expires ${exp.label}` : `expires ${new Date(inv.expiresAt).toLocaleDateString()}`}</span>
 {inv.acceptedAt && <span>accepted {new Date(inv.acceptedAt).toLocaleDateString()} by {inv.acceptedBy?.name || inv.acceptedBy?.email || 'member'}</span>}
 {inv.revokedAt && <span>revoked {new Date(inv.revokedAt).toLocaleDateString()}</span>}
 </div>
 {inv.deliveryError && <p className="mt-1 text-xs text-red-600">Delivery: {inv.deliveryError}</p>}
</div>
</div>
 <div className="flex shrink-0 items-center gap-2">
 <span className={statusColor + ' inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium'}>
 {inv.status}
 </span>
 <span className={deliveryColor + ' inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium'}>
 email: {inv.deliveryStatus === 'configuration_error' ? 'not configured' : inv.deliveryStatus}
 </span>
 {isActionable && (
 <>
 <Button aria-label={'Copy invite link for ' + inv.email} variant="ghost" size="sm" onClick={() => handleCopyInviteLink(inv)} className="h-8 gap-1 px-2 text-xs">
 {copiedInviteId === inv.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
 {copiedInviteId === inv.id ? 'Copied' : 'Copy'}
</Button>
 <Button aria-label={'Resend invitation to ' + inv.email} variant="ghost" size="sm" onClick={() => handleResendInvitation(inv)} disabled={resendingId === inv.id} className="h-8 gap-1 px-2 text-xs">
 {resendingId === inv.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
 Resend
</Button>
 <Button aria-label={'Revoke invitation to ' + inv.email} variant="ghost" size="sm" onClick={() => handleRevokeInvitation(inv)} disabled={revokingId === inv.id} className="h-8 w-8 p-0 text-red-600 hover:bg-red-50">
 {revokingId === inv.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
</Button>
 </>
 )}
</div>
</div>
 );
 })}
</div>
 )}
</div>
</div>

 <Dialog open={inviteDialogOpen} onOpenChange={(open) => { if (!inviting) setInviteDialogOpen(open); }}>
 <DialogContent className="sm:max-w-[500px]">
 <DialogHeader>
 <DialogTitle>Invite Team Member</DialogTitle>
 <DialogDescription>Enter the email and role for the new team member</DialogDescription>
</DialogHeader>
 <form onSubmit={handleInviteMember} className="space-y-4 p-4 sm:p-6" noValidate>
 <div className="space-y-2">
 <Label htmlFor="invite-email">Email</Label>
 <Input id="invite-email" type="email" value={inviteEmail} onChange={e => { setInviteEmail(e.target.value); setInviteError(null); }} placeholder="colleague@example.com" required aria-invalid={!!inviteError || undefined} aria-describedby={inviteError ? 'invite-email-error' : undefined} />
 {inviteError && <p id="invite-email-error" className="text-xs text-red-600">{inviteError}</p>}
</div>
 <div className="space-y-2">
 <Label htmlFor="invite-name">Name (optional)</Label>
 <Input id="invite-name" value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="John Doe" />
</div>
 <div className="space-y-2">
 <Label htmlFor="invite-role">Role</Label>
 <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as string)}>
 <SelectTrigger id="invite-role"><SelectValue placeholder="Select role" /></SelectTrigger>
 <SelectContent>
 <SelectItem value="member">Member</SelectItem>
 <SelectItem value="admin">Admin</SelectItem>
</SelectContent>
</Select>
</div>
 <DialogFooter className="flex justify-end space-x-3">
 <Button type="button" variant="outline" onClick={() => setInviteDialogOpen(false)} disabled={inviting}>Cancel</Button>
 <Button type="submit" disabled={inviting || !isValidEmail(inviteEmail.trim())}>
 {inviting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending</>) : 'Send Invitation'}
</Button>
</DialogFooter>
</form>
</DialogContent>
</Dialog>
</motion.div>
 )}

 {isBillingPage && (
 <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-md border border-border bg-surface p-4 shadow-sm sm:p-6">
 <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
 <CreditCard className="h-5 w-5 text-accent" /> Billing
</h2>
 {billingLoading ? (
 <p className="mt-5 text-sm text-muted">Loading</p>
 ) : billing ? (
 <div className="mt-5 space-y-4">
 <div className="rounded-md border border-border bg-surface p-4">
 <h3 className="font-medium text-ink">Current Plan</h3>
 <p className="mt-1 text-sm text-muted">Pro Plan — $29/month</p>
 <p className="mt-2 text-xs text-muted">Renews on {billing.current_period_end ? new Date(billing.current_period_end * 1000).toLocaleDateString() : 'N/A'}</p>
</div>
 <div className="flex gap-2">
 <Button onClick={handleUpdatePayment} className="w-full gap-2 sm:w-auto"><CreditCard className="h-4 w-4" />Manage Subscription</Button>
</div>
</div>
 ) : (
 <div className="mt-5 space-y-4">
 <div className="rounded-md border border-border bg-surface p-4">
 <h3 className="font-medium text-ink">No active subscription</h3>
 <p className="mt-1 text-sm text-muted">Upgrade to Pro to unlock all features</p>
</div>
 <div className="flex gap-2">
 <Button onClick={handleUpgrade} className="w-full gap-2 sm:w-auto"><Plus className="h-4 w-4" />Upgrade to Pro</Button>
</div>
</div>
 )}
</motion.div>
 )}

 {isProfilePage && (
 <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-md border border-border bg-surface p-4 shadow-sm sm:p-6">
 <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
 <LucideUser className="h-5 w-5 text-accent" /> Profile
</h2>
 {profileLoading ? (
 <p className="mt-5 text-sm text-muted">Loading</p>
 ) : profile ? (
 <div className="mt-5 space-y-6">
 <div className="space-y-1.5">
 <Label>Full Name</Label>
 <Input value={profile.name} readOnly className="w-full max-w-md bg-surface-2" />
</div>
 <div className="space-y-1.5">
 <Label>Email</Label>
 <Input value={profile.email} type="email" disabled className="w-full max-w-md bg-surface-2" />
</div>
 <div className="space-y-1.5">
 <Label>Timezone</Label>
 <Select value={profile.timezone} disabled>
 <SelectTrigger className="w-full max-w-md bg-surface-2"><SelectValue placeholder="Select timezone" /></SelectTrigger>
 <SelectContent>
 <SelectItem value="utc">UTC</SelectItem>
 <SelectItem value="america/new_york">Eastern Time (US & Canada</SelectItem>
 <SelectItem value="america/los_angeles">Pacific Time (US & Canada</SelectItem>
 <SelectItem value="europe/london">London</SelectItem>
 <SelectItem value="europe/paris">Paris</SelectItem>
 <SelectItem value="asia/tokyo">Tokyo</SelectItem>
</SelectContent>
</Select>
</div>
 <p className="-mt-2 text-sm leading-6 text-muted">Profile identity details are managed through your identity provider and are read-only in this workspace.</p>
 <div className="space-y-1.5">
 <Label>Last Password Change</Label>
 <p className="text-sm text-muted">{profile.lastPasswordChange}</p>
</div>
 <div className="space-y-1.5">
 <Label>Two-Factor Authentication</Label>
 <div className="flex items-center gap-2">
 <input type="checkbox" defaultChecked={profile.twoFactorEnabled} className="h-4 w-4" disabled />
 <span className="text-sm text-muted">{profile.twoFactorEnabled ? 'Enabled' : 'Disabled'}</span>
</div>
</div>
 <div className="space-y-1.5">
 <Label>Active Sessions</Label>
 <div className="space-y-2">
 {profile.activeSessions.map((session: any, i: number) => (
 <div key={i} className="flex items-center justify-between rounded-lg border border-surface-2 p-3">
 <div className="flex items-center gap-3">
 <div className={`h-2.5 w-2.5 rounded-full ${session.current ? 'bg-emerald-500' : 'bg-gray-400'}`} />
 <div>
 <p className="text-sm font-medium text-ink">{session.location}</p>
 <p className="text-xs text-muted">{session.device} {session.current && '(Current)'}</p>
</div>
</div>
 {!session.current && (
 <Button variant="ghost" size="sm" onClick={() => handleRevokeSession(session.id)} className="text-red-600 hover:bg-red-50">
 <X className="h-3.5 w-3.5" />Revoke
</Button>
 )}
</div>
 ))}
</div>
</div>
 <div className="border-t border-border pt-4">
 <h4 className="mb-3 text-sm font-medium text-ink">Change Password</h4>
 <form onSubmit={handleChangePassword} className="space-y-3">
 <div className="space-y-1.5">
 <Label htmlFor="current-password">Current Password</Label>
 <Input id="current-password" type="password" name="currentPassword" required className="w-full max-w-md" />
</div>
 <div className="space-y-1.5">
 <Label htmlFor="new-password">New Password</Label>
 <Input id="new-password" type="password" name="newPassword" minLength={8} required className="w-full max-w-md" />
</div>
 <div className="space-y-1.5">
 <Label htmlFor="confirm-password">Confirm New Password</Label>
 <Input id="confirm-password" type="password" name="confirmPassword" required className="w-full max-w-md" />
</div>
 <Button type="submit" className="gap-2"><Lock className="h-4 w-4" />Change Password</Button>
 </form>
 </div>
 <div className="rounded-lg border border-red-200 bg-red-50/50 p-4">
 <h4 className="text-sm font-semibold text-red-800">Delete account</h4>
 <p className="mt-1 text-sm text-red-700">This permanently disables sign-in, revokes your active sessions and API keys that you created, and removes your account from active workspace access.</p>
 {user?.role === 'owner' && teamMembers.filter(m => m.role === 'owner').length === 1 ? (
   <div className="mt-3 space-y-2">
     <p className="text-sm text-red-700">You are the sole owner of this organization.</p>
     <div className="flex flex-col gap-2">
       <a href="/settings/team" className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline">
         Transfer ownership to another member <ArrowUpRight className="h-3.5 w-3.5" />
       </a>
       <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-100 hover:text-red-800" onClick={() => { setDeleteOrgDialogOpen(true); }}>
         <Trash2 className="mr-2 h-4 w-4" />Delete organization instead
       </Button>
     </div>
   </div>
 ) : (
   <Button variant="outline" className="mt-3 border-red-300 text-red-700 hover:bg-red-100 hover:text-red-800" onClick={() => { setDeleteAccountConfirmation(''); setDeleteAccountDialogOpen(true); }}>
   <Trash2 className="mr-2 h-4 w-4" />Delete account
   </Button>
 )}
 </div>
 <Dialog open={deleteAccountDialogOpen} onOpenChange={(open) => { if (!deletingAccount) setDeleteAccountDialogOpen(open); }}>
 <DialogContent className="sm:max-w-[480px]">
 <DialogHeader>
 <DialogTitle>Delete your account?</DialogTitle>
 <DialogDescription>This action is irreversible. Your active sessions and API keys you created will be revoked immediately.</DialogDescription>
 </DialogHeader>
 <div className="space-y-3 p-6">
 <Label htmlFor="delete-account-confirmation">Type <strong>DELETE</strong> to confirm</Label>
 <Input id="delete-account-confirmation" value={deleteAccountConfirmation} onChange={(event) => setDeleteAccountConfirmation(event.target.value)} placeholder="DELETE" autoComplete="off" />
 </div>
 <DialogFooter className="gap-2">
 <Button type="button" variant="outline" onClick={() => setDeleteAccountDialogOpen(false)} disabled={deletingAccount}>Cancel</Button>
 <Button type="button" className="bg-red-600 text-white hover:bg-red-700" onClick={handleDeleteAccount} disabled={deletingAccount || deleteAccountConfirmation !== 'DELETE'}>
 {deletingAccount ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}Delete account
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 <Dialog open={deleteOrgDialogOpen} onOpenChange={(open) => { if (!deletingOrg) setDeleteOrgDialogOpen(open); }}>
 <DialogContent className="sm:max-w-[480px]">
 <DialogHeader>
 <DialogTitle>Delete your organization?</DialogTitle>
 <DialogDescription>This action is irreversible. All organization data, team members, API keys, and policies will be permanently deleted.</DialogDescription>
 </DialogHeader>
 <div className="space-y-3 p-6">
 <Label htmlFor="delete-org-confirmation">Type <strong>DELETE</strong> to confirm</Label>
 <Input id="delete-org-confirmation" value={deleteOrgConfirmation} onChange={(event) => setDeleteOrgConfirmation(event.target.value)} placeholder="DELETE" autoComplete="off" />
 </div>
 <DialogFooter className="gap-2">
 <Button type="button" variant="outline" onClick={() => setDeleteOrgDialogOpen(false)} disabled={deletingOrg}>Cancel</Button>
 <Button type="button" className="bg-red-600 text-white hover:bg-red-700" onClick={handleDeleteOrg} disabled={deletingOrg || deleteOrgConfirmation !== 'DELETE'}>
 {deletingOrg ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}Delete organization
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </div>
 ) : (
 <p className="mt-5 text-sm text-muted">No profile data available</p>
 )}
</motion.div>
 )}
</div>
</div>
</div>
 );
}
