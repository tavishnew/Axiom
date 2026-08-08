'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, User, Server, Key, Shield, X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { api, type Entity, type Policy, type PaginatedResponse } from '@/lib/api';
import { EntityForm } from '@/components/EntityForm';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TableSkeleton, EntityTableSkeleton } from '@/components/ui/table-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const typeConfig: Record<string, { icon: typeof User; bg: string; text: string }> = {
  user: { icon: User, bg: 'bg-blue-50', text: 'text-blue-700' },
  service: { icon: Server, bg: 'bg-emerald-50', text: 'text-emerald-700' },
  api_key: { icon: Key, bg: 'bg-amber-50', text: 'text-amber-700' },
};

export default function EntitiesPage() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false });

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Create/Edit form
  const [createOpen, setCreateOpen] = useState(false);
  const [editEntity, setEditEntity] = useState<Entity | null>(null);

  // Policy assignments state
  const [policyDialogOpen, setPolicyDialogOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [assignedPolicies, setAssignedPolicies] = useState<{ entityId: string; policyId: string }[]>([]);
  const [availablePolicies, setAvailablePolicies] = useState<Policy[]>([]);
  const [policiesLoading, setPoliciesLoading] = useState(false);
  const [searchPolicy, setSearchPolicy] = useState('');

  const fetchEntities = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.entities.list({
        page: pagination.page,
        limit: pagination.limit,
        q: search,
        type: typeFilter,
      });
      setEntities(res.data);
      setPagination(res.pagination);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load entities');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, typeFilter]);

  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  const handleCreate = () => {
    setEditEntity(null);
    setCreateOpen(true);
  };

  const handleEdit = (entity: Entity) => {
    setEditEntity(entity);
    setCreateOpen(true);
  };

  const handleSuccess = () => {
    setCreateOpen(false);
    setEditEntity(null);
    fetchEntities();
  };

  const openPolicyDialog = async (entity: Entity) => {
    setSelectedEntity(entity);
    setPolicyDialogOpen(true);
    await loadPolicyData(entity.id);
  };

  const loadPolicyData = async (entityId: string) => {
    setPoliciesLoading(true);
    try {
      const [assigned, allPolicies] = await Promise.all([
        api.policyAssignments.list(entityId),
        api.policies.list({ limit: 100 }),
      ]);
      setAssignedPolicies(assigned);
      setAvailablePolicies(allPolicies.data);
    } catch (err) {
      console.error('Failed to load policies:', err);
      toast.error('Failed to load policy data');
    } finally {
      setPoliciesLoading(false);
    }
  };

  const handleAssignPolicy = async (policyId: string) => {
    if (!selectedEntity) return;
    try {
      await api.policyAssignments.create(selectedEntity.id, policyId);
      toast.success('Policy assigned successfully');
      await loadPolicyData(selectedEntity.id);
    } catch (err) {
      toast.error('Failed to assign policy');
    }
  };

  const handleRemovePolicy = async (policyId: string) => {
    if (!selectedEntity) return;
    try {
      await api.policyAssignments.delete(selectedEntity.id, policyId);
      toast.success('Policy removed successfully');
      await loadPolicyData(selectedEntity.id);
    } catch (err) {
      toast.error('Failed to remove policy');
    }
  };

  const handleDeleteEntity = async (id: string) => {
    if (!window.confirm('Delete this entity?')) return;
    try {
      await api.entities.delete(id);
      toast.success('Entity deleted');
      fetchEntities();
    } catch (err) {
      toast.error('Failed to delete entity');
    }
  };

  const filteredPolicies = availablePolicies.filter(p =>
    p.name.toLowerCase().includes(searchPolicy.toLowerCase()) ||
    p.id.toLowerCase().includes(searchPolicy.toLowerCase())
  );

  const isPolicyAssigned = (policyId: string) =>
    assignedPolicies.some(a => a.policyId === policyId);

  const hasFilters = search || typeFilter;

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Entities</h1>
          <p className="mt-0.5 text-sm text-muted">Manage users, services, and API keys</p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Entity
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 rounded-xl border border-border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              type="text"
              placeholder="Search entities by ID or type..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={e => { setTypeFilter(e); setPagination(p => ({ ...p, page: 1 })); }}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="service">Service</SelectItem>
              <SelectItem value="api_key">API Key</SelectItem>
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
          <EntityTableSkeleton />
        ) : entities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-sm text-muted">
            <User className="h-10 w-10 mb-3 opacity-30" />
            <p>{hasFilters ? 'No entities match your filters' : 'No entities found. Add your first entity to get started.'}</p>
          </div>
        ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-2">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Entity ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Type</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted md:table-cell">External ID</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted md:table-cell">Attributes</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted md:table-cell">Created</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {entities.map((e, i) => {
                  const config = typeConfig[e.type] || typeConfig['user'];
                  const Icon = config.icon;
                  return (
                    <motion.tr
                      key={e.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="transition-colors hover:bg-surface-2/50"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${config.bg}`}>
                            <Icon className={`h-4 w-4 ${config.text}`} />
                          </div>
                          <span className="text-sm font-medium text-ink">{e.id}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${config.bg} ${config.text}`}>
                          {e.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 text-sm text-muted md:table-cell">{e.externalId}</td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {e.attributes && Object.entries(e.attributes).map(([key, value]) => (
                            <code key={key} className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-muted">
                              {key}={String(value)}
                            </code>
                          ))}
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 text-sm text-muted md:table-cell">{new Date(e.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => openPolicyDialog(e)} className="gap-1">
                            <Shield className="h-3 w-3" />
                            Policies
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(e)} className="gap-1 text-accent hover:bg-accent/5">
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteEntity(e.id)} className="gap-1 text-red-600 hover:bg-red-50">
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
              Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entit{pagination.total === 1 ? 'y' : 'ies'}
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

      {/* Policy Assignment Dialog */}
      <Dialog open={policyDialogOpen} onOpenChange={setPolicyDialogOpen}>
        <DialogContent className="sm:max-w-[700px] w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Policies for {selectedEntity?.id}</DialogTitle>
            <DialogDescription>
              Assign or remove policies for this entity. Assigned policies take effect during evaluation.
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-6">
            {/* Assigned Policies */}
            <div>
              <h3 className="text-sm font-medium text-ink mb-3">Assigned Policies ({assignedPolicies.length})</h3>
              {assignedPolicies.length === 0 ? (
                <p className="text-sm text-muted py-4">No policies assigned. Entity inherits org-wide policies.</p>
              ) : (
                <div className="space-y-2">
                  {assignedPolicies.map((a) => {
                    const policy = availablePolicies.find(p => p.id === a.policyId);
                    return (
                      <div key={a.policyId} className="flex items-center justify-between rounded-lg border border-border bg-white p-3">
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${
                            policy?.effect === 'allow' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {policy?.effect || 'allow'}
                          </span>
                          <span className="text-sm font-medium text-ink">{policy?.name || a.policyId}</span>
                          <span className="text-xs text-muted">Priority: {policy?.priority || 0}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePolicy(a.policyId)}
                          disabled={policiesLoading}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <hr className="border-border" />

            {/* Available Policies */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-ink">Available Policies</h3>
                <Input
                  placeholder="Search policies..."
                  value={searchPolicy}
                  onChange={e => setSearchPolicy(e.target.value)}
                  className="w-64"
                />
              </div>
              {policiesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              ) : filteredPolicies.length === 0 ? (
                <p className="text-sm text-muted py-4">No policies available</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {filteredPolicies.map((p) => {
                    const assigned = isPolicyAssigned(p.id);
                    return (
                      <div key={p.id} className="flex items-center justify-between rounded-lg border border-border bg-white p-3 transition-colors hover:bg-surface-2/50">
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${
                            p.effect === 'allow' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {p.effect}
                          </span>
                          <span className="text-sm font-medium text-ink">{p.name}</span>
                          <span className="text-xs text-muted">Priority: {p.priority}</span>
                        </div>
                        {assigned ? (
                          <span className="text-xs text-muted">Already assigned</span>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleAssignPolicy(p.id)}
                            disabled={policiesLoading}
                            className="gap-1"
                          >
                            <Plus className="h-3 w-3" />
                            Assign
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => setPolicyDialogOpen(false)} className="px-4 py-2">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EntityForm
        open={createOpen}
        onOpenChange={setCreateOpen}
        entity={editEntity}
        onSuccess={handleSuccess}
      />
    </div>
  );
}