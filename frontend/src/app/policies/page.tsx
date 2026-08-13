'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Shield, ShieldOff, ChevronLeft, ChevronRight, X, Trash2 } from 'lucide-react';
import { api, type Policy } from '@/lib/api';
import PolicyForm from '@/components/PolicyForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PolicyTableSkeleton } from '@/components/ui/table-skeleton';
import { toast } from 'sonner';

// --- Constants ---
const CARD_SHELL = 'rounded-xl border border-border bg-white p-3 shadow-sm sm:p-4';
const TABLE_HEADER_CELL = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted cursor-pointer hover:text-ink';
const BADGE_BASE = 'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium';
const ICON_BUTTON = 'gap-1';
const PAGE_SIZE = 20;

// --- Sub-components ---

// Header: page title + create button
function PageHeader({ onCreate }: { onCreate: () => void }) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" data-testid="policies-header">
      <div>
        <h1 className="text-2xl font-bold text-ink">Policies</h1>
        <p className="mt-0.5 text-sm text-muted">Manage your access control policies</p>
      </div>
      <Button onClick={onCreate} className="w-full gap-2 sm:w-auto" data-testid="create-policy-btn">
        <Plus className="h-4 w-4" />
        Create Policy
      </Button>
    </header>
  );
}

// FilterBar: search + effect + status filters + clear
function FilterBar({
  search, onSearchChange,
  effectFilter, onEffectChange,
  activeFilter, onActiveChange,
  hasFilters, onClear,
}: {
  search: string; onSearchChange: (v: string) => void;
  effectFilter: string; onEffectChange: (v: string) => void;
  activeFilter: string; onActiveChange: (v: string) => void;
  hasFilters: boolean; onClear: () => void;
}) {
  return (
    <section className={CARD_SHELL} data-testid="policies-filters">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            type="text"
            placeholder="Search policies by name or description..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
            data-testid="policy-search"
          />
        </div>
        <Select value={effectFilter} onValueChange={onEffectChange}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="All Effects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Effects</SelectItem>
            <SelectItem value="allow">Allow</SelectItem>
            <SelectItem value="deny">Deny</SelectItem>
          </SelectContent>
        </Select>
        <Select value={activeFilter} onValueChange={onActiveChange}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Status</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onClear} className={ICON_BUTTON} data-testid="clear-filters">
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>
    </section>
  );
}

// PolicyRow: single table row with actions
function PolicyRow({ policy, index, onEdit, onDelete }: { policy: Policy; index: number; onEdit: (p: Policy) => void; onDelete: (id: string) => void }) {
  return (
    <motion.tr
      key={policy.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="transition-colors hover:bg-surface-2/50"
    >
      <td className="px-4 py-3">
        <div>
          <span className="font-medium text-accent hover:underline text-sm cursor-pointer" onClick={() => onEdit(policy)}>
            {policy.name}
          </span>
          {policy.description && (
            <p className="mt-0.5 max-w-xs truncate text-xs text-muted hover:text-ink">{policy.description}</p>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={policy.effect === 'allow' ? 'badge-allow' : 'badge-deny'}>
          {policy.effect === 'allow' ? (
            <><Shield className="h-3 w-3 mr-1 inline" /> Allow</>
          ) : (
            <><ShieldOff className="h-3 w-3 mr-1 inline" /> Deny</>
          )}
        </span>
      </td>
      <td className="hidden px-4 py-3 md:table-cell">
        <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs text-ink">{policy.priority}</code>
      </td>
      <td className="px-4 py-3">
        <span className={`${BADGE_BASE} ${policy.active ? 'bg-emerald-50 text-emerald-900' : 'bg-slate-100 text-slate-900'}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${policy.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          {policy.active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="hidden px-4 py-3 text-sm md:table-cell">v{policy.version}</td>
      <td className="hidden px-4 py-3 text-sm md:table-cell">{new Date(policy.createdAt).toLocaleDateString()}</td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => onEdit(policy)} className={`${ICON_BUTTON} text-accent hover:bg-accent/5`} data-testid={`edit-policy-${policy.id}`}>
            Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(policy.id)} className={`${ICON_BUTTON} text-red-600 hover:bg-red-50`} data-testid={`delete-policy-${policy.id}`}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </td>
    </motion.tr>
  );
}

// EmptyState: no policies or no matches
function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <tr>
      <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted">
        {hasFilters ? 'No policies match your filters' : 'No policies yet. Create your first policy to get started.'}
      </td>
    </tr>
  );
}

// TableHeader: sortable column headers
function TableHeader({ onSort }: { onSort: (field: string) => void }) {
  return (
    <thead>
      <tr className="border-b border-border bg-surface-2">
        <th className={TABLE_HEADER_CELL} onClick={() => onSort('name')}>Name</th>
        <th className={TABLE_HEADER_CELL} onClick={() => onSort('effect')}>Effect</th>
        <th className={`hidden ${TABLE_HEADER_CELL} md:table-cell`} onClick={() => onSort('priority')}>Priority</th>
        <th className={TABLE_HEADER_CELL} onClick={() => onSort('active')}>Status</th>
        <th className={`hidden ${TABLE_HEADER_CELL} md:table-cell`} onClick={() => onSort('version')}>Version</th>
        <th className={`hidden ${TABLE_HEADER_CELL} md:table-cell`} onClick={() => onSort('createdAt')}>Created</th>
        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">Actions</th>
      </tr>
    </thead>
  );
}

// PaginationControls: prev/next + page info
function PaginationControls({ pagination, loading, onPageChange }: { pagination: any; loading: boolean; onPageChange: (page: number) => void }) {
  return (
    <footer className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between" data-testid="policies-pagination">
      <p className="text-xs text-muted">
        Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} polic{pagination.total === 1 ? 'y' : 'ies'}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={!pagination.hasPrev || loading}
          data-testid="prev-page"
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
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={!pagination.hasNext || loading}
          data-testid="next-page"
        >
          Next <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
    </footer>
  );
}

// PolicyTable: wraps table + skeleton + pagination
function PolicyTable({ policies, loading, pagination, onSort, onEdit, onDelete, hasFilters, onPageChange }: {
  policies: Policy[];
  loading: boolean;
  pagination: any;
  onSort: (field: string) => void;
  onEdit: (p: Policy) => void;
  onDelete: (id: string) => void;
  hasFilters: boolean;
  onPageChange: (page: number) => void;
}) {
  if (loading) return <PolicyTableSkeleton />;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm" data-testid="policies-table">
      <div className="overflow-x-auto">
        <table className="min-w-[680px] w-full">
          <TableHeader onSort={onSort} />
          <tbody className="divide-y divide-border">
            {policies.length === 0 ? (
              <EmptyState hasFilters={hasFilters} />
            ) : (
              policies.map((p, i) => (
                <PolicyRow key={p.id} policy={p} index={i} onEdit={onEdit} onDelete={onDelete} />
              ))
            )}
          </tbody>
        </table>
      </div>
      <PaginationControls pagination={pagination} loading={loading} onPageChange={onPageChange} />
    </div>
  );
}

// --- Main Component ---

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false });

  // Filters
  const [search, setSearch] = useState('');
  const [effectFilter, setEffectFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [sortBy, setSortBy] = useState('priority');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Form dialog
  const [formOpen, setFormOpen] = useState(false);
  const [editPolicy, setEditPolicy] = useState<Policy | null>(null);

  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.policies.list({
        page: pagination.page,
        limit: pagination.limit,
        q: search,
        effect: effectFilter,
        active: activeFilter,
        sortBy,
        sortOrder,
      });
      setPolicies(res.data);
      setPagination(res.pagination);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load policies');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, effectFilter, activeFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPagination(p => ({ ...p, page: 1 }));
  };

  const handleEffectChange = (value: string) => {
    setEffectFilter(value);
    setPagination(p => ({ ...p, page: 1 }));
  };

  const handleActiveChange = (value: string) => {
    setActiveFilter(value);
    setPagination(p => ({ ...p, page: 1 }));
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleCreate = () => {
    setEditPolicy(null);
    setFormOpen(true);
  };

  const handleEdit = (policy: Policy) => {
    setEditPolicy(policy);
    setFormOpen(true);
  };

  const handleSuccess = () => {
    setFormOpen(false);
    setEditPolicy(null);
    fetchPolicies();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this policy?')) return;
    try {
      await api.policies.delete(id);
      toast.success('Policy deleted');
      fetchPolicies();
    } catch (err) {
      toast.error('Failed to delete policy');
    }
  };

  const handlePageChange = (page: number) => {
    setPagination(p => ({ ...p, page }));
  };

  const hasFilters = Boolean(search || effectFilter || activeFilter);

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <PageHeader onCreate={handleCreate} />
      <FilterBar
        search={search} onSearchChange={handleSearch}
        effectFilter={effectFilter} onEffectChange={handleEffectChange}
        activeFilter={activeFilter} onActiveChange={handleActiveChange}
        hasFilters={hasFilters} onClear={() => { setSearch(''); setEffectFilter(''); setActiveFilter(''); setPagination(p => ({ ...p, page: 1 })); }}
      />
      <PolicyTable
        policies={policies}
        loading={loading}
        pagination={pagination}
        onSort={handleSort}
        onEdit={handleEdit}
        onDelete={handleDelete}
        hasFilters={hasFilters}
        onPageChange={handlePageChange}
      />
      <PolicyForm
        open={formOpen}
        onOpenChange={setFormOpen}
        policy={editPolicy}
        onSuccess={handleSuccess}
      />
    </div>
  );
}