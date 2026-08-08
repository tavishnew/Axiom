'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, FileText, Database, Server as ServerIcon, CreditCard, X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { api, type Resource, type PaginatedResponse } from '@/lib/api';
import { ResourceForm } from '@/components/ResourceForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TableSkeleton, ResourceTableSkeleton } from '@/components/ui/table-skeleton';
import { toast } from 'sonner';

const resourceIcons: Record<string, { icon: typeof FileText; color: string; bg: string }> = {
  document: { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
  database: { icon: Database, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  api: { icon: ServerIcon, color: 'text-violet-500', bg: 'bg-violet-50' },
  billing: { icon: CreditCard, color: 'text-amber-500', bg: 'bg-amber-50' },
};

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false });

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Create/Edit form
  const [createOpen, setCreateOpen] = useState(false);
  const [editResource, setEditResource] = useState<Resource | null>(null);

  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.resources.list({
        page: pagination.page,
        limit: pagination.limit,
        q: search,
        type: typeFilter,
      });
      setResources(res.data);
      setPagination(res.pagination);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load resources');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, typeFilter]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const typeCounts: Record<string, number> = {};
  resources.forEach(r => {
    typeCounts[r.type] = (typeCounts[r.type] || 0) + 1;
  });

  const handleCreate = () => {
    setEditResource(null);
    setCreateOpen(true);
  };

  const handleEdit = (resource: Resource) => {
    setEditResource(resource);
    setCreateOpen(true);
  };

  const handleSuccess = () => {
    setCreateOpen(false);
    setEditResource(null);
    fetchResources();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this resource?')) return;
    try {
      await api.resources.delete(id);
      toast.success('Resource deleted');
      fetchResources();
    } catch (err) {
      toast.error('Failed to delete resource');
    }
  };

  const hasFilters = search || typeFilter;

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Resources</h1>
          <p className="mt-0.5 text-sm text-muted">Manage protected resources and access patterns</p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Resource
        </Button>
      </div>

      {/* Resource type cards */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {Object.entries(resourceIcons).map(([type, config], i) => {
          const Icon = config.icon;
          const count = typeCounts[type] || 0;
          return (
            <motion.div
              key={type}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-xl border border-border bg-white p-4 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted uppercase tracking-wider">{type}</p>
                  <p className="mt-1 text-2xl font-bold text-ink">{count}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${config.bg}`}>
                  <Icon className={`h-5 w-5 ${config.color}`} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="mb-4 rounded-xl border border-border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              type="text"
              placeholder="Search resources by name, type, or description..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={e => { setTypeFilter(e); setPagination(p => ({ ...p, page: 1 })); }}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              <SelectItem value="document">Document</SelectItem>
              <SelectItem value="database">Database</SelectItem>
              <SelectItem value="api">API</SelectItem>
              <SelectItem value="billing">Billing</SelectItem>
              <SelectItem value="storage">Storage</SelectItem>
              <SelectItem value="compute">Compute</SelectItem>
              <SelectItem value="network">Network</SelectItem>
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setTypeFilter(''); setPagination(p => ({ ...p, page: 1 })); }} className="gap-1">
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        {loading ? (
          <ResourceTableSkeleton />
        ) : resources.length === 0 ? (
          <ResourceTableSkeleton />
        ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-2">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Name</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted md:table-cell">Description</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted md:table-cell">Created</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {resources.map((r, i) => {
                  const typeDef = resourceIcons[r.type] || { icon: FileText, color: 'text-gray-500', bg: 'bg-gray-50' };
                  const Icon = typeDef.icon;
                  return (
                    <motion.tr
                      key={r.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="transition-colors hover:bg-surface-2/50"
                    >
                      <td className="px-4 py-3">
                        <div className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${typeDef.bg} ${typeDef.color}`}>
                          <Icon className="h-3 w-3" />
                          {r.type}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-ink">{r.name}</td>
                      <td className="hidden px-4 py-3 text-sm text-muted md:table-cell">{r.description || '—'}</td>
                      <td className="hidden px-4 py-3 text-sm text-muted md:table-cell">{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(r)} className="gap-1 text-accent hover:bg-accent/5">
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)} className="gap-1 text-red-600 hover:bg-red-50">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="border-t border-border px-4 py-3 flex items-center justify-between">
            <p className="text-xs text-muted">
              Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} resource{pagination.total === 1 ? '' : 's'}
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

      <ResourceForm
        open={createOpen}
        onOpenChange={setCreateOpen}
        resource={editResource}
        onSuccess={handleSuccess}
      />
    </div>
  );
}