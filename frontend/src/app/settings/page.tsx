'use client';

import { useLocation, Link } from 'wouter';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Copy, Trash2, Plus, Building2, Key, Users as UsersIcon, CreditCard, User, Check, RefreshCw } from 'lucide-react';
import { api, type Organization, type ApiKey } from '@/lib/api';

const navItems = [
  { href: '/settings', label: 'Organization', icon: Building2 },
  { href: '/settings/api-keys', label: 'API Keys', icon: Key },
  { href: '/settings/team', label: 'Team Members', icon: UsersIcon },
  { href: '/settings/billing', label: 'Billing', icon: CreditCard },
  { href: '/settings/profile', label: 'Profile', icon: User },
];

export default function SettingsPage() {
  const { pathname } = useLocation();
  const [org, setOrg] = useState<Organization | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    // Only load data for the organization tab, as other tabs may need different data
    if (pathname === '/settings' || pathname.startsWith('/settings/api-keys')) {
      Promise.all([
        api.organizations.list().then(orgs => orgs[0] || null),
        api.apiKeys.list(),
      ])
        .then(([org, keys]) => {
          setOrg(org);
          setApiKeys(keys);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [pathname]);

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch { /* ignore */ }
  };

  const handleRevoke = async (id: string) => {
    if (!window.confirm('Are you sure you want to revoke this API key?')) return;
    try {
      await api.apiKeys.delete(id);
      // Refetch API keys
      const keys = await api.apiKeys.list();
      setApiKeys(keys);
    } catch (err) {
      // In a real app, you'd show a toast/error message
      console.error('Failed to revoke API key:', err);
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
                    router.push(item.href);
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
                    <label className="block text-sm font-medium text-ink mb-1.5">
                      Organization Name
                    </label>
                    <input type="text" defaultValue={org?.name || 'Your Org'} className="w-full max-w-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">
                      Organization Slug
                    </label>
                    <input type="text" defaultValue={org?.slug || 'your-org'} className="w-full max-w-md" />
                    <p className="mt-1 text-xs text-muted">
                      Used in API requests: api.axiom.dev/v1/orgs/{org?.slug || 'your-org'}
                    </p>
                  </div>
                </div>
                )}
                <div className="mt-6 pt-4 border-t border-border">
                  <button className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-accent/90 hover:shadow-md">
                    Save Changes
                  </button>
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
                  <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-1.5 text-sm font-medium text-ink shadow-sm transition-all hover:bg-surface-2">
                    <Plus className="h-4 w-4" />
                    New Key
                  </button>
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
                          <span>Created: {key.createdAt}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopy(key.prefix, i)}
                          className="rounded-lg px-2 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent/5"
                        >
                          {copiedIndex === i ? (
                            <><Check className="h-3.5 w-3.5 inline mr-1" /> Copied</>
                          ) : (
                            <><Copy className="h-3.5 w-3.5 inline mr-1" /> Copy</>
                          )}
                        </button>
                        <button
                          onClick={() => handleRevoke(key.id)}
                          className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                        >
                          Revoke
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </motion.div>
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
                <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
                  <UsersIcon className="h-5 w-5 text-accent" />
                  Team Members
                </h2>
                <p className="mt-4 text-sm text-muted">
                  Manage team members and their roles within your organization
                </p>
                <div className="mt-6">
                  <div className="space-y-4">
                    {/* Placeholder team members - in a real app, this would come from an API */}
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-surface-2">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-ink">Team Member {i}</p>
                            <p className="text-xs text-muted">member{i}@example.com</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-500">Member</span>
                          <button className="text-muted hover:text-ink underline">
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 pt-4 border-t border-border">
                    <button className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-accent/90 hover:shadow-md">
                      <Plus className="h-4 w-4" />
                      Invite Member
                    </button>
                  </div>
                </div>
              </motion.div>
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
                  Billing & Subscription
                </h2>
                <div className="mt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-medium text-ink mb-2">Current Plan</h3>
                      <p className="text-sm text-muted">Professional</p>
                      <p className="mt-2 text-xs text-muted">
                        $29/month billed annually ($348/year)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-muted">Next billing date:</p>
                      <p className="font-medium text-ink">Jan 15, 2025</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-border">
                    <h3 className="text-lg font-medium text-ink mb-2">Usage This Month</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted">API Requests</p>
                        <p class="text-2xl font-bold text-ink">12,450</p>
                        <p class="text-xs text-muted">of 100,000 included</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">Active Entities</p>
                        <p class="text-2xl font-bold text-ink">42</p>
                        <p class="text-xs text-muted">of 1,000 included</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <button className="w-full inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-accent/90 hover:shadow-md">
                      <RefreshCw className="h-4 w-4" />
                      Update Payment Method
                    </button>
                  </div>
                </div>
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
                  <User className="h-5 w-5 text-accent" />
                  Profile
                </h2>
                <div className="mt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-medium text-ink mb-2">Account Information</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-ink">Full Name</label>
                          <input type="text" defaultValue="John Doe" className="w-full max-w-md" />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-ink">Email Address</label>
                          <input type="email" defaultValue="john@example.com" className="w-full max-w-md" />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-ink">Time Zone</label>
                          <select className="w-full max-w-md">
                            <option value="utc">UTC</option>
                            <option value="est">Eastern Standard Time</option>
                            <option value="pst">Pacific Standard Time</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-ink mb-2">Security</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-ink">Last Password Change</label>
                          <p className="text-sm text-muted">Jan 10, 2025</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-ink">Two-Factor Authentication</label>
                          <div className="flex items-center gap-2">
                            <input type="checkbox" defaultChecked={true} className="h-4 w-4" />
                            <span className="text-sm text-muted">Enabled</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-ink">Active Sessions</label>
                          <p className="text-sm text-muted">2 active (New York, London)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-border">
                    <button className="w-full inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-accent/90 hover:shadow-md">
                      Save Changes
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
