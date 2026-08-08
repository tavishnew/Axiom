'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Shield, ShieldOff, MoreHorizontal, ChevronLeft, ChevronRight, X, Filter, Trash2 } from 'lucide-react';
import { api, type Policy, type PaginatedResponse } from '@/lib/api';
import PolicyForm from '@/components/PolicyForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TableSkeleton, PolicyTableSkeleton } from '@/components/ui/table-skeleton';
import { toast } from 'sonner';

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

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPagination(p => ({ ...p, page: 1 }));
  };

  const handleEffectFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEffectFilter(e.target.value);
    setPagination(p => ({ ...p, page: 1 }));
  };

  const handleActiveFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setActiveFilter(e.target.value);
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

  const hasFilters = search || effectFilter || activeFilter;

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Policies</h1>
          <p className="mt-0.5 text-sm text-muted">Manage your access control policies</p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Policy
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 rounded-xl border border-border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              type="text"
              placeholder="Search policies by name or description..."
              value={search}
              onChange={handleSearch}
              className="pl-9"
            />
          </div>
          <Select value={effectFilter} onValueChange={(value: string) => { setEffectFilter(value); setPagination(p => ({ ...p, page: 1 })); }}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="All Effects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Effects</SelectItem>
              <SelectItem value="allow">Allow</SelectItem>
              <SelectItem value="deny">Deny</SelectItem>
            </SelectContent>
          </Select>
          <Select value={activeFilter} onValueChange={(value: string) => { setActiveFilter(value); setPagination(p => ({ ...p, page: 1 })); }}>
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
            <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setEffectFilter(''); setActiveFilter(''); setPagination(p => ({ ...p, page: 1 })); }} className="gap-1">
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        {loading ? (
          <PolicyTableSkeleton />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-surface-2">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted cursor-pointer hover:text-ink" onClick={() => handleSort('name')}>
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted cursor-pointer hover:text-ink" onClick={() => handleSort('effect')}>
                      Effect
                    </th>
                    <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted md:table-cell cursor-pointer hover:text-ink" onClick={() => handleSort('priority')}>
                      Priority
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted cursor-pointer hover:text-ink" onClick={() => handleSort('active')}>
                      Status
                    </th>
                    <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted md:table-cell cursor-pointer hover:text-ink" onClick={() => handleSort('version')}>
                      Version
                    </th>
                    <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted md:table-cell cursor-pointer hover:text-ink" onClick={() => handleSort('createdAt')}>
                      Created
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {policies.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted">
                        {hasFilters ? 'No policies match your filters' : 'No policies yet. Create your first policy to get started.'}
                      </td>
                    </tr>
                  ) : (
                    policies.map((p, i) => (
                      <motion.tr
                        key={p.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="transition-colors hover:bg-surface-2/50"
                      >
                        <td className="px-4 py-3">
                          <div>
                            <span className="font-medium text-accent hover:underline text-sm cursor-pointer" onClick={() => handleEdit(p)}>
                              {p.name}
                            </span>
                            {p.description && (
                              <p className="mt-0.5 max-w-xs truncate text-xs text-muted hover:text-ink">{p.description}</p>
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
                        <td className="hidden px-4 py-3 md:table-cell">
                          <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs text-ink">{p.priority}</code>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            p.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-800'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${p.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            {p.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="hidden px-4 py-3 text-sm md:table-cell">v{p.version}</td>
                        <td className="hidden px-4 py-3 text-sm md:table-cell">{new Date(p.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(p)} className="gap-1 text-accent hover:bg-accent/5">
                              Edit
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)} className="gap-1 text-red-600 hover:bg-red-50">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="border-t border-border px-4 py-3 flex items-center justify-between">
              <p className="text-xs text-muted">
                Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} polic{pagination.total === 1 ? 'y' : 'ies'}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                  disabled={!pagination.hasPrev || loading}
                >
                  <ChevronLeft className="h-3 w-3" />
                  Previous
                </Button>
                <span className="flex items-center px-3 text-xs text-muted">
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

      {/* Policy Form */}
      <PolicyForm
        open={formOpen}
        onOpenChange={setFormOpen}
        policy={editPolicy}
        onSuccess={handleSuccess}
      />
    </div>
  );
}