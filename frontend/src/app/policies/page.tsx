'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Shield, ShieldOff, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { api, type Policy } from '@/lib/api';
import PolicyForm from '@/components/PolicyForm';

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.policies.list()
      .then(setPolicies)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Policies</h1>
          <p className="mt-0.5 text-sm text-muted">Manage your access control policies</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-accent/90 hover:shadow-md">
          <Plus className="h-4 w-4" />
          Create Policy
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 rounded-xl border border-border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input type="text" placeholder="Search policies..." className="w-full pl-9" />
          </div>
          <select className="w-full sm:w-36">
            <option value="">All Effects</option>
            <option value="allow">Allow</option>
            <option value="deny">Deny</option>
          </select>
          <select className="w-full sm:w-36">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted">Loading policies...</div>
        ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface-2">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Effect</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted md:table-cell">Conditions</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted md:table-cell">Priority</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Status</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted md:table-cell">Version</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {policies.map((p, i) => (
              <motion.tr
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="transition-colors hover:bg-surface-2/50"
              >
                <td className="px-4 py-3">
                  <div>
                    <a href={`/policies/${p.id}`} className="font-medium text-accent hover:underline text-sm">
                      {p.name}
                    </a>
                    {p.description && (
                      <p className="mt-0.5 max-w-xs truncate text-xs text-muted">{p.description}</p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={p.effect === 'allow' ? 'badge-allow' : 'badge-deny'}>
                    {p.effect === 'allow' ? (
                      <><Shield className="h-3 w-3 mr-1 inline" /> Allow</>
                    ) : (
                      <><ShieldOff className="h-3 w-3 mr-1 inline" /> Deny</>
                    )}
                  </span>
                </td>
                <td className="hidden px-4 py-3 text-sm text-muted md:table-cell">
                  {Array.isArray(p.conditions) ? p.conditions.length : 0} condition{p.conditions && p.conditions.length !== 1 ? 's' : ''}
                </td>
                <td className="hidden px-4 py-3 text-sm text-muted md:table-cell">
                  <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs">{p.priority}</code>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    p.active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${p.active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                    {p.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="hidden px-4 py-3 text-sm text-muted md:table-cell">v{p.version}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="rounded-lg px-2 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent/5">
                      Edit
                    </button>
                    <button className="rounded-lg p-1 text-muted transition-colors hover:bg-surface-2">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-muted">
          {loading ? 'Loading...' : `Showing ${policies.length} polic${policies.length === 1 ? 'y' : 'ies'}`}
        </p>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-muted shadow-sm transition-colors hover:bg-surface-2 disabled:opacity-50" disabled>
            <ChevronLeft className="h-3 w-3" /> Previous
          </button>
          <button className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-muted shadow-sm transition-colors hover:bg-surface-2 disabled:opacity-50" disabled>
            Next <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
