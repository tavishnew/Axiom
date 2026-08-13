'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ClipboardList, Filter, X } from 'lucide-react';
import { api, type AuditLog } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const initialPagination = { page: 1, limit: 25, total: 0, totalPages: 0, hasNext: false, hasPrev: false };

function humanizeAction(action: string) {
  return action.split('.').map((part) => part.replace(/_/g, ' ')).join(' · ');
}

function actorLabel(log: AuditLog) {
  return log.actor.name || log.actor.email || log.actorId;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(initialPagination);
  const [action, setAction] = useState('');
  const [targetType, setTargetType] = useState('');
  const [actorId, setActorId] = useState('');

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.auditLogs.list({
        page: pagination.page,
        limit: pagination.limit,
        action: action || undefined,
        targetType: targetType || undefined,
        actorId: actorId || undefined,
      });
      setLogs(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error(error);
      toast.error('Unable to load audit logs. Only organization owners can view this history.');
    } finally {
      setLoading(false);
    }
  }, [action, actorId, pagination.limit, pagination.page, targetType]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const hasFilters = Boolean(action || targetType || actorId);
  const resetFilters = () => {
    setAction('');
    setTargetType('');
    setActorId('');
    setPagination((current) => ({ ...current, page: 1 }));
  };

  return (
    <div className="editorial-page animate-editorial-rise">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-accent" />
            <h1 className="font-serif text-[clamp(2rem,4vw,3.1rem)] font-normal leading-[0.98] tracking-[-0.035em] text-ink">Audit log</h1>
          </div>
          <p className="mt-1 text-sm text-muted">Organization activity history for security and operational review.</p>
        </div>
        <div className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-muted shadow-sm">
          {pagination.total.toLocaleString()} recorded events
        </div>
      </div>

      <section className="mb-4 rounded-md border border-border bg-surface p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-ink">
          <Filter className="h-4 w-4 text-muted" />
          Filters
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            value={action}
            onChange={(event) => { setAction(event.target.value); setPagination((current) => ({ ...current, page: 1 })); }}
            placeholder="Action, e.g. policy.created"
            aria-label="Filter by action"
          />
          <Input
            value={targetType}
            onChange={(event) => { setTargetType(event.target.value); setPagination((current) => ({ ...current, page: 1 })); }}
            placeholder="Target type, e.g. member"
            aria-label="Filter by target type"
          />
          <Input
            value={actorId}
            onChange={(event) => { setActorId(event.target.value); setPagination((current) => ({ ...current, page: 1 })); }}
            placeholder="Actor ID"
            aria-label="Filter by actor ID"
          />
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => { setPagination((current) => ({ ...current, page: 1 })); loadLogs(); }} disabled={loading}>
              Apply filters
            </Button>
            {hasFilters && (
              <Button variant="outline" onClick={resetFilters} className="gap-1">
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-border bg-surface shadow-[0_14px_28px_-24px_rgba(29,26,24,0.4)]">
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">When</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Actor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Action</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Target</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td colSpan={5} className="px-4 py-5"><div className="h-4 w-full rounded bg-surface-2" /></td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted">
                    {hasFilters ? 'No audit events match these filters.' : 'No audit events have been recorded yet.'}
                  </td>
                </tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="transition-colors hover:bg-surface-2/50">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-ink">{actorLabel(log)}</p>
                    {log.actor.email && log.actor.name && <p className="mt-0.5 text-xs text-muted">{log.actor.email}</p>}
                  </td>
                  <td className="px-4 py-3"><code className="rounded bg-surface-2 px-2 py-1 text-xs text-ink">{humanizeAction(log.action)}</code></td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium capitalize text-ink">{log.targetType.replace(/_/g, ' ')}</p>
                    <p className="max-w-[190px] truncate font-mono text-xs text-muted" title={log.targetId}>{log.targetId}</p>
                  </td>
                  <td className="max-w-[260px] px-4 py-3">
                    <p className="truncate font-mono text-xs text-muted" title={JSON.stringify(log.metadata)}>{Object.keys(log.metadata).length ? JSON.stringify(log.metadata) : '—'}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">
            {pagination.total === 0 ? 'No events' : `Showing ${(pagination.page - 1) * pagination.limit + 1}–${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total} events`}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPagination((current) => ({ ...current, page: current.page - 1 }))} disabled={!pagination.hasPrev || loading}>
              <ChevronLeft className="mr-1 h-3.5 w-3.5" /> Previous
            </Button>
            <span className="text-xs text-muted">Page {pagination.page} of {pagination.totalPages || 1}</span>
            <Button variant="outline" size="sm" onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))} disabled={!pagination.hasNext || loading}>
              Next <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
