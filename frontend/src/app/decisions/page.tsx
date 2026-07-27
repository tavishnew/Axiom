'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Download, ChevronLeft, ChevronRight, Shield, ShieldOff, MoreHorizontal } from 'lucide-react';
import { api, type DecisionLog } from '@/lib/api';

export default function DecisionsPage() {
  const [decisions, setDecisions] = useState<DecisionLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.decisions.list(50)
      .then(setDecisions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalDecisions = decisions.length;
  const allowed = decisions.filter(d => d.decision === 'allow').length;
  const denied = decisions.filter(d => d.decision === 'deny').length;
  const avgLatency = decisions.length > 0
    ? (decisions.reduce((sum, d) => sum + d.latencyMs, 0) / decisions.length).toFixed(1)
    : '0';

  const stats = [
    { title: 'Total Decisions', value: totalDecisions.toLocaleString(), change: '', trend: 'up' as const },
    { title: 'Allowed', value: allowed.toLocaleString(), change: totalDecisions > 0 ? `${((allowed / totalDecisions) * 100).toFixed(1)}%` : '0%', trend: 'up' as const },
    { title: 'Denied', value: denied.toLocaleString(), change: totalDecisions > 0 ? `${((denied / totalDecisions) * 100).toFixed(1)}%` : '0%', trend: 'down' as const },
    { title: 'Avg Latency', value: `${avgLatency}ms`, change: '', trend: 'down' as const },
  ];

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Decisions</h1>
          <p className="mt-0.5 text-sm text-muted">View and analyze authorization decisions</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-ink shadow-sm transition-all hover:bg-surface-2 hover:shadow-md">
          <Download className="h-4 w-4" />
          Export
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 rounded-xl border border-border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input type="text" placeholder="Search by entity, resource, or request ID..." className="w-full pl-9" />
          </div>
          <select className="w-full sm:w-32">
            <option value="">All Outcomes</option>
            <option value="allow">Allow</option>
            <option value="deny">Deny</option>
          </select>
          <select className="w-full sm:w-40">
            <option value="">All time</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-xl border border-border bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-medium text-muted">{s.title}</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-ink">{s.value}</span>
              <span className={`text-xs font-medium ${
                s.trend === 'up' ? 'text-emerald-600' : 'text-[--ember]'
              }`}>
                {s.change}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted">Loading decisions...</div>
        ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface-2">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Timestamp</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Entity</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted md:table-cell">Action</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted md:table-cell">Resource</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Decision</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted lg:table-cell">Reason</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">Latency</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {decisions.map((d, i) => (
              <motion.tr
                key={d.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="transition-colors hover:bg-surface-2/50"
              >
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-muted">{d.createdAt}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-ink">{d.entityId}</span>
                    <span className="text-xs text-muted">({d.entityType})</span>
                  </div>
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs text-muted">{d.action}</code>
                </td>
                <td className="hidden px-4 py-3 text-sm text-muted md:table-cell">
                  <span className="font-medium text-ink">{d.resourceType}</span>
                  {d.resourceId && <span className="text-muted">/{d.resourceId}</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={d.decision === 'allow' ? 'badge-allow' : 'badge-deny'}>
                    {d.decision === 'allow' ? (
                      <><Shield className="h-3 w-3 mr-0.5 inline" /> Allow</>
                    ) : (
                      <><ShieldOff className="h-3 w-3 mr-0.5 inline" /> Deny</>
                    )}
                  </span>
                </td>
                <td className="hidden px-4 py-3 lg:table-cell">
                  <span className="text-xs text-muted max-w-[200px] truncate inline-block">{d.reason}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-mono text-sm text-muted">{d.latencyMs}ms</span>
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
          {loading ? 'Loading...' : `Showing ${decisions.length} decisions`}
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
