'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Download, ChevronLeft, ChevronRight, Shield, ShieldOff, X, Filter } from 'lucide-react';
import { api, type DecisionLog, type PaginatedResponse } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TableSkeleton, DecisionTableSkeleton } from '@/components/ui/table-skeleton';
import { toast } from 'sonner';

export default function DecisionsPage() {
  const [decisions, setDecisions] = useState<DecisionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0, hasNext: false, hasPrev: false });

  // Filters
  const [search, setSearch] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [timeFilter, setTimeFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchDecisions = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
        q: search,
        decision: outcomeFilter,
        entityId: entityFilter,
        sortBy,
        sortOrder,
      };
      if (timeFilter) {
        const now = new Date();
        if (timeFilter === '24h') params.since = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        else if (timeFilter === '7d') params.since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        else if (timeFilter === '30d') params.since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      }
      const res = await api.decisions.list(params);
      setDecisions(res.data);
      setPagination(res.pagination);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load decisions');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, outcomeFilter, entityFilter, timeFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchDecisions();
  }, [fetchDecisions]);

  // Computed stats from current page data (or could fetch total stats separately)
  const totalDecisions = decisions.length;
  const allowed = decisions.filter(d => d.decision === 'allow').length;
  const denied = decisions.filter(d => d.decision === 'deny').length;
  const avgLatency = decisions.length > 0
    ? (decisions.reduce((sum, d) => sum + d.latencyMs, 0) / decisions.length).toFixed(1)
    : '0';

  const stats = [
    { title: 'Total Decisions (page)', value: totalDecisions.toLocaleString(), change: '', trend: 'up' as const },
    { title: 'Allowed', value: allowed.toLocaleString(), change: totalDecisions > 0 ? `${((allowed / totalDecisions) * 100).toFixed(1)}%` : '0%', trend: 'up' as const },
    { title: 'Denied', value: denied.toLocaleString(), change: totalDecisions > 0 ? `${((denied / totalDecisions) * 100).toFixed(1)}%` : '0%', trend: 'down' as const },
    { title: 'Avg Latency', value: `${avgLatency}ms`, change: '', trend: 'down' as const },
  ];

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const hasFilters = search || outcomeFilter || entityFilter || timeFilter;

  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Decisions</h1>
          <p className="mt-0.5 text-sm text-muted">View and analyze authorization decisions</p>
        </div>
        <Button variant="outline" className="w-full gap-2 sm:w-auto" onClick={() => toast.info('Export coming soon')}>
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 rounded-xl border border-border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              type="text"
              placeholder="Search by entity, resource, or request ID..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
              className="pl-9"
            />
          </div>
          <Select value={outcomeFilter} onValueChange={e => { setOutcomeFilter(e); setPagination(p => ({ ...p, page: 1 })); }}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="All Outcomes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Outcomes</SelectItem>
              <SelectItem value="allow">Allow</SelectItem>
              <SelectItem value="deny">Deny</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="text"
            placeholder="Entity ID"
            value={entityFilter}
            onChange={e => { setEntityFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            className="w-full sm:w-40"
          />
          <Select value={timeFilter} onValueChange={e => { setTimeFilter(e); setPagination(p => ({ ...p, page: 1 })); }}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="All time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All time</SelectItem>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setOutcomeFilter(''); setEntityFilter(''); setTimeFilter(''); setPagination(p => ({ ...p, page: 1 })); }} className="gap-1">
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
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
          <DecisionTableSkeleton />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-[680px] w-full">
                <thead>
                  <tr className="border-b border-border bg-surface-2">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted cursor-pointer hover:text-ink" onClick={() => handleSort('createdAt')}>
                      Timestamp
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted cursor-pointer hover:text-ink" onClick={() => handleSort('entityId')}>
                      Entity
                    </th>
                    <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted md:table-cell cursor-pointer hover:text-ink" onClick={() => handleSort('action')}>
                      Action
                    </th>
                    <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted md:table-cell cursor-pointer hover:text-ink" onClick={() => handleSort('resourceType')}>
                      Resource
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted cursor-pointer hover:text-ink" onClick={() => handleSort('decision')}>
                      Decision
                    </th>
                    <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted lg:table-cell">Reason</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted cursor-pointer hover:text-ink" onClick={() => handleSort('latencyMs')}>
                      Latency
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {decisions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted">
                        {hasFilters ? 'No decisions match your filters' : 'No decisions recorded yet'}
                      </td>
                    </tr>
                  ) : (
                    decisions.map((d, i) => (
                      <motion.tr
                        key={d.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="transition-colors hover:bg-surface-2/50"
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-muted">{new Date(d.createdAt).toLocaleString()}</span>
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
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted">
                Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} decisions
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                  disabled={!pagination.hasPrev || loading}
                >
                  <ChevronLeft className="h-3 w-3" />
                  Previous
                </Button>
                <span className="order-first flex w-full items-center text-xs text-muted sm:order-none sm:w-auto sm:px-3">
                  Page {pagination.page} of {pagination.totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                  disabled={!pagination.hasNext || loading}
                >
                  Next <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}