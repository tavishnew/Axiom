'use client';

import { useLocation } from 'wouter';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Copy, Trash2, Plus, Building2, Key, Users as UsersIcon, CreditCard, User as LucideUser, Check, RefreshCw, Loader2, Mail, Lock, Shield, X } from 'lucide-react';
import { api, type Organization, type ApiKey, type Session } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const navItems = [
 { href: '/settings', label: 'Organization', icon: Building2 },
 { href: '/settings/api-keys', label: 'API Keys', icon: Key },
 { href: '/settings/team', label: 'Team Members', icon: UsersIcon },
 { href: '/settings/billing', label: 'Billing', icon: CreditCard },
 { href: '/settings/profile', label: 'Profile', icon: LucideUser },
];

export default function SettingsPage() {
 const [pathname, router] = useLocation();
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

 // Billing state
 const [billing, setBilling] = useState<any>(null);
 const [billingLoading, setBillingLoading] = useState(false);

 // Profile state
 const [profile, setProfile] = useState<any>(null);
 const [profileLoading, setProfileLoading] = useState(false);

 // Dialog states
 const [newKeyDialogOpen, setNewKeyDialogOpen] = useState(false);
 const [newKeyName, setNewKeyName] = useState('');
 const [creatingKey, setCreatingKey] = useState(false);

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
 location: 'Unknown', // Would need geoIP in real impl
 device: 'Current session',
 current: true,
 }));
 // The current session should be first; others marked as not current
 if (sessions.length > 0) {
 sessions[0].current = true;
 sessions.slice(1).forEach(s => s.current = false);
 }
 setProfile({
 name: user.name,
 email: user.email,
 timezone: 'utc', // Profile doesn't have timezone yet
 lastPasswordChange: user.updatedAt?.split('T')[0] || '2025-01-10',
 twoFactorEnabled: false, // Would need 2FA table
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
 if (pathname.startsWith('/settings/team')) fetchTeam();
 }, [pathname, fetchTeam]);

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
 if (!window.confirm('Are you sure you want to revoke this API key?')) return;
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
 toast.success('API key created! Save it now - you won\'t see it again.');
 // Show the raw key in a toast/alert since it's only returned once
 alert(`Your new API key:\n\n${key.key}\n\nSave this securely.`);
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

 const handleSaveOrg = async () => {
 if (!org) return;
 try {
 // await api.organizations.update(org.id, { name: org.name, slug: org.slug });
 toast.success('Organization saved (backend update endpoint needed)');
 } catch (err) {
 toast.error('Failed to save organization');
 }
 };

 const handleInviteMember = async () => {
 if (!inviteEmail.trim()) return;
 setInviting(true);
 try {
 await api.team.invite({ email: inviteEmail.trim(), name: inviteName.trim() || undefined, role: inviteRole });
 toast.success('Invitation sent');
 setInviteDialogOpen(false);
 setInviteEmail('');
 setInviteName('');
 setInviteRole('member');
 fetchTeam();
 } catch (err) {
 console.error(err);
 toast.error('Failed to send invitation');
 } finally {
 setInviting(false);
 }
 };

 const handleRemoveMember = async (member: any) => {
 if (!window.confirm(`Remove ${member.name || member.email} from the team?`)) return;
 try {
 await api.team.remove(member.id);
 toast.success('Team member removed');
 setTeamMembers(prev => prev.filter(m => m.id !== member.id));
 } catch (err) {
 console.error(err);
 toast.error('Failed to remove team member');
 }
 };

 const handleUpdateMemberRole = async (member: any, role: string) => {
 try {
 await api.team.update(member.id, { role });
 toast.success('Role updated');
 setTeamMembers(prev => prev.map(m => m.id === member.id ? { ...m, role } : m));
 } catch (err) {
 console.error(err);
 toast.error('Failed to update role');
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

 const handleSaveProfile = () => {
 toast.info('Profile save - backend endpoint needed');
 };

const handleRevokeSession = async (sessionId: string) => {
 if (!window.confirm('Revoke this session?')) return;
 try {
 await api.auth.revokeSession(sessionId);
 toast.success('Session revoked');
 fetchProfile();
 } catch (err) {
 console.error(err);
 toast.error('Failed to revoke session');
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
 console.error(err);
 toast.error('Failed to change password');
 }
 };

 // Determine which section to show based on pathname
 const isOrganizationPage = pathname === '/settings';
 const isApiKeysPage = pathname.startsWith('/settings/api-keys');
 const isTeamPage = pathname.startsWith('/settings/team');
 const isBillingPage = pathname.startsWith('/settings/billing');
 const isProfilePage = pathname.startsWith('/settings/profile');

 return (
 <div className="p-6 md:p-8">
 {/* Header */}
 <div className="mb-6">
 <h1 className="text-2xl font-bold text-ink">Settings</h1>
 <p className="mt-0.5 text-sm text-muted">Manage your organization and API access</p>
 </div>

 <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
 {/* Sidebar Navigation */}
 <div className="lg:col-span-1">
 <nav className="rounded-xl border border-border bg-white p-2 shadow-sm">
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
 onClick={(e) => {
 e.preventDefault();
 router(item.href);
 }}
 initial={{ opacity: 0, x: -8 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ delay: i * 0.03 }}
 className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
 isActive
 ? 'bg-accent text-white shadow-sm'
 : 'text-muted hover:bg-surface-2 hover:text-ink'
 }`}
 >
 <Icon className="h-4 w-4" />
 {item.label}
 </motion.a>
 );
 })}
 </nav>
 </div>

 {/* Main Content */}
 <div className="space-y-5 lg:col-span-3">
 {isOrganizationPage && (
 <>
 {/* Organization */}
 <motion.div
 initial={{ opacity: 0, y: 12 }}
 animate={{ opacity: 1, y: 0 }}
 className="rounded-xl border border-border bg-white p-6 shadow-sm"
 >
 <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
 <Building2 className="h-5 w-5 text-accent" />
 Organization
 </h2>
 {loading ? (
 <p className="mt-5 text-sm text-muted">Loading...</p>
 ) : (
 <div className="mt-5 space-y-4">
 <div>
 <Label className="block text-sm font-medium text-ink mb-1.5">
 Organization Name
 </Label>
 <Input
 value={org?.name || ''}
 onChange={e => setOrg(o => o ? { ...o, name: e.target.value } : null)}
 className="w-full max-w-md"
 />
 </div>
 <div>
 <Label className="block text-sm font-medium text-ink mb-1.5">
 Organization Slug
 </Label>
 <Input
 value={org?.slug || ''}
 onChange={e => setOrg(o => o ? { ...o, slug: e.target.value } : null)}
 className="w-full max-w-md"
 />
 <p className="mt-1 text-xs text-muted">
 Used in API requests: api.axiom.dev/v1/orgs/{org?.slug || 'your-org'}
 </p>
 </div>
 </div>
 )}
 <div className="mt-6 pt-4 border-t border-border">
 <Button onClick={handleSaveOrg} className="px-4 py-2" disabled={loading}>
 {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
 </Button>
 </div>
 </motion.div>
 </>
 )}

 {isApiKeysPage && (
 <>
 {/* API Keys */}
 <motion.div
 initial={{ opacity: 0, y: 12 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.05 }}
 className="rounded-xl border border-border bg-white p-6 shadow-sm"
 >
 <div className="flex items-center justify-between">
 <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
 <Key className="h-5 w-5 text-accent" />
 API Keys
 </h2>
 <Button variant="outline" onClick={() => setNewKeyDialogOpen(true)} className="gap-2">
 <Plus className="h-4 w-4" />
 New Key
 </Button>
 </div>
 {loading ? (
 <p className="mt-5 text-sm text-muted">Loading...</p>
 ) : apiKeys.length === 0 ? (
 <div className="mt-5 flex flex-col items-center justify-center py-8 text-sm text-muted">
 <Key className="h-8 w-8 mb-2 opacity-30" />
 <p>No API keys yet</p>
 </div>
 ) : (
 <div className="mt-5 space-y-3">
 {apiKeys.map((key, i) => (
 <div key={key.id} className="flex items-center justify-between rounded-lg border border-border bg-white p-3 transition-colors hover:bg-surface-2/50">
 <div>
 <p className="text-sm font-medium text-ink">{key.name}</p>
 <div className="mt-0.5 flex items-center gap-3 text-xs text-muted">
 <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono">{key.prefix}...</code>
 <span>Created: {new Date(key.createdAt).toLocaleDateString()}</span>
 {key.lastUsedAt && <span>Last used: {new Date(key.lastUsedAt).toLocaleDateString()}</span>}
 {key.revokedAt && <span className="text-red-500">Revoked</span>}
 </div>
 </div>
 <div className="flex items-center gap-2">
 <Button
 variant="ghost"
 size="sm"
 onClick={() => handleCopy(`${key.prefix}...`, i)}
 className="gap-1"
 >
 {copiedIndex === i ? (
 <>
 <Check className="h-3.5 w-3.5 inline mr-1" />
 Copied
 </>
 ) : (
 <>
 <Copy className="h-3.5 w-3.5 inline mr-1" />
 Copy
 </>
 )}
 </Button>
 {!key.revokedAt && (
 <Button
 variant="ghost"
 size="sm"
 onClick={() => handleRevoke(key.id)}
 className="gap-1 text-red-600 hover:bg-red-50"
 >
 <Trash2 className="h-3.5 w-3.5" />
 Revoke
 </Button>
 )}
 </div>
 </div>
 ))}
 </div>
 )}
 </motion.div>

 {/* New API Key Dialog */}
 <Dialog open={newKeyDialogOpen} onOpenChange={setNewKeyDialogOpen}>
 <DialogContent className="sm:max-w-[500px]">
 <DialogHeader>
 <DialogTitle>Create API Key</DialogTitle>
 <DialogDescription>
 Give your API key a descriptive name. The key will only be shown once.
 </DialogDescription>
 </DialogHeader>
 <form onSubmit={handleCreateApiKey} className="p-6 space-y-4">
 <div className="space-y-2">
 <Label htmlFor="key-name">Key Name</Label>
 <Input
 id="key-name"
 value={newKeyName}
 onChange={e => setNewKeyName(e.target.value)}
 placeholder="e.g., Production Server, CI/CD Pipeline"
 autoFocus
 />
 </div>
 <DialogFooter className="flex justify-end space-x-3">
 <Button type="button" variant="outline" onClick={() => setNewKeyDialogOpen(false)} disabled={creatingKey}>
 Cancel
 </Button>
 <Button type="submit" disabled={creatingKey || !newKeyName.trim()}>
 {creatingKey ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Key'}
 </Button>
 </DialogFooter>
 </form>
 </DialogContent>
 </Dialog>
 </>
 )}

 {isTeamPage && (
 <>
 {/* Team Members */}
 <motion.div
 initial={{ opacity: 0, y: 12 }}
 animate={{ opacity: 1, y: 0 }}
 className="rounded-xl border border-border bg-white p-6 shadow-sm"
 >
 <div className="flex items-center justify-between">
 <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
 <UsersIcon className="h-5 w-5 text-accent" />
 Team Members
 </h2>
 <Button onClick={() => setInviteDialogOpen(true)} className="gap-2">
 <Plus className="h-4 w-4" />
 Invite Member
 </Button>
 </div>
 <p className="mt-4 text-sm text-muted">
 Manage team members and their roles within your organization
 </p>
 <div className="mt-6">
 {teamLoading ? (
 <div className="flex items-center justify-center py-8">
 <Loader2 className="h-8 w-8 animate-spin text-accent" />
 </div>
 ) : (
 <div className="space-y-4">
 {teamMembers.map((member, i) => (
 <div key={member.id} className="flex items-center justify-between p-4 rounded-lg border border-surface-2">
 <div className="flex items-center gap-3">
 <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
 <LucideUser className="h-5 w-5 text-blue-600" />
 </div>
 <div>
 <p className="font-medium text-ink">{member.name || member.email}</p>
 <p className="text-xs text-muted">{member.email}</p>
 </div>
 </div>
 <div className="flex items-center gap-2 text-xs">
 <select
 value={member.role?.toLowerCase?.() || 'member'}
 onChange={e => handleUpdateMemberRole(member, e.target.value)}
 className="rounded border border-border bg-white px-2 py-1 text-xs"
 >
 <option value="owner">Owner</option>
 <option value="admin">Admin</option>
 <option value="member">Member</option>
 </select>
 <Button variant="ghost" size="sm" onClick={() => handleRemoveMember(member)} className="text-red-600 hover:bg-red-50">
 <Trash2 className="h-3.5 w-3.5" />
 Remove
 </Button>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 </motion.div>

 {/* Invite Member Dialog */}
 <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
 <DialogContent className="sm:max-w-[500px]">
 <DialogHeader>
 <DialogTitle>Invite Team Member</DialogTitle>
 <DialogDescription>
 Enter the email and role for the new team member.
 </DialogDescription>
 </DialogHeader>
 <form onSubmit={handleInviteMember} className="p-6 space-y-4">
 <div className="space-y-2">
 <Label htmlFor="invite-email">Email</Label>
 <Input id="invite-email" type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@example.com" required />
 </div>
 <div className="space-y-2">
 <Label htmlFor="invite-name">Name (optional)</Label>
 <Input id="invite-name" value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="John Doe" />
 </div>
 <div className="space-y-2">
 <Label htmlFor="invite-role">Role</Label>
 <Select value={inviteRole} onValueChange={e => setInviteRole(e)}>
 <SelectTrigger id="invite-role">
 <SelectValue placeholder="Select role" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="member">Member</SelectItem>
 <SelectItem value="admin">Admin</SelectItem>
 </SelectContent>
 </Select>
 </div>
 <DialogFooter className="flex justify-end space-x-3">
 <Button type="button" variant="outline" onClick={() => setInviteDialogOpen(false)} disabled={inviting}>
 Cancel
 </Button>
 <Button type="submit" disabled={inviting || !inviteEmail.trim()}>
 {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Invitation'}
 </Button>
 </DialogFooter>
 </form>
 </DialogContent>
 </Dialog>
 </>
 )}

 {isBillingPage && (
 <>
 {/* Billing */}
 <motion.div
 initial={{ opacity: 0, y: 12 }}
 animate={{ opacity: 1, y: 0 }}
 className="rounded-xl border border-border bg-white p-6 shadow-sm"
 >
 <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
 <CreditCard className="h-5 w-5 text-accent" />
 Billing
 </h2>
 {billingLoading ? (
 <p className="mt-5 text-sm text-muted">Loading...</p>
 ) : billing ? (
 <div className="mt-5 space-y-4">
 <div className="rounded-lg border border-border bg-white p-4">
 <h3 className="font-medium text-ink">Current Plan</h3>
 <p className="mt-1 text-sm text-muted">Pro Plan — $29/month</p>
 <p className="mt-2 text-xs text-muted">
 Renews on {billing.current_period_end ? new Date(billing.current_period_end * 1000).toLocaleDateString() : 'N/A'}
 </p>
 </div>
 <div className="flex gap-2">
 <Button onClick={handleUpdatePayment} className="gap-2">
 <CreditCard className="h-4 w-4" />
 Manage Subscription
 </Button>
 </div>
 </div>
 ) : (
 <div className="mt-5 space-y-4">
 <div className="rounded-lg border border-border bg-white p-4">
 <h3 className="font-medium text-ink">No active subscription</h3>
 <p className="mt-1 text-sm text-muted">Upgrade to Pro to unlock all features</p>
 </div>
 <div className="flex gap-2">
 <Button onClick={handleUpgrade} className="gap-2">
 <Plus className="h-4 w-4" />
 Upgrade to Pro
 </Button>
 </div>
 </div>
 )}
 </motion.div>
 </>
 )}

 {isProfilePage && (
 <>
 {/* Profile */}
 <motion.div
 initial={{ opacity: 0, y: 12 }}
 animate={{ opacity: 1, y: 0 }}
 className="rounded-xl border border-border bg-white p-6 shadow-sm"
 >
 <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
 <LucideUser className="h-5 w-5 text-accent" />
 Profile
 </h2>
 {profileLoading ? (
 <p className="mt-5 text-sm text-muted">Loading...</p>
 ) : profile ? (
 <div className="mt-5 space-y-6">
 <div className="space-y-1.5">
 <Label>Full Name</Label>
 <Input value={profile.name} onChange={e => setProfile((p: typeof profile) => ({ ...p, name: e.target.value }))} className="w-full max-w-md" />
 </div>
 <div className="space-y-1.5">
 <Label>Email</Label>
 <Input value={profile.email} type="email" disabled className="w-full max-w-md bg-surface-2" />
 </div>
 <div className="space-y-1.5">
 <Label>Timezone</Label>
 <Select value={profile.timezone} onValueChange={e => setProfile((p: typeof profile) => ({ ...p, timezone: e }))}>
 <SelectTrigger className="w-full max-w-md">
 <SelectValue placeholder="Select timezone" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="utc">UTC</SelectItem>
 <SelectItem value="america/new_york">Eastern Time (US & Canada)</SelectItem>
 <SelectItem value="america/los_angeles">Pacific Time (US & Canada)</SelectItem>
 <SelectItem value="europe/london">London</SelectItem>
 <SelectItem value="europe/paris">Paris</SelectItem>
 <SelectItem value="asia/tokyo">Tokyo</SelectItem>
 </SelectContent>
 </Select>
 </div>
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
 <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-surface-2">
 <div className="flex items-center gap-3">
 <div className={`h-2.5 w-2.5 rounded-full ${session.current ? 'bg-emerald-500' : 'bg-gray-400'}`} />
 <div>
 <p className="text-sm font-medium text-ink">{session.location}</p>
 <p className="text-xs text-muted">{session.device} {session.current && '(Current)'}</p>
 </div>
 </div>
 {!session.current && (
 <Button variant="ghost" size="sm" onClick={() => handleRevokeSession(session.id)} className="text-red-600 hover:bg-red-50">
 <X className="h-3.5 w-3.5" />
 Revoke
 </Button>
 )}
 </div>
 ))}
 </div>
 </div>
 <div className="pt-4 border-t border-border">
 <h4 className="text-sm font-medium text-ink mb-3">Change Password</h4>
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
 <Button type="submit" className="gap-2">
 <Lock className="h-4 w-4" />
 Change Password
 </Button>
 </form>
 </div>
 </div>
 ) : (
 <p className="mt-5 text-sm text-muted">No profile data available</p>
 )}
 </motion.div>
 </>
 )}
 </div>
 </div>
 </div>
);
}