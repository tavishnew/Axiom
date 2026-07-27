'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, User, Server, Key, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { api, type Entity } from '@/lib/api';
import { EntityForm } from '@/components/EntityForm';

const typeConfig: Record<string, { icon: typeof User; bg: string; text: string }> = {
  user: { icon: User, bg: 'bg-blue-50', text: 'text-blue-700' },
  service: { icon: Server, bg: 'bg-emerald-50', text: 'text-emerald-700' },
  api_key: { icon: Key, bg: 'bg-amber-50', text: 'text-amber-700' },
};

export default function EntitiesPage() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editEntity, setEditEntity] = useState<Entity | null>(null);

  useEffect(() => {
    api.entities.list()
      .then(setEntities)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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
    // Refetch entities
    api.entities.list().then(setEntities).catch(console.error);
  };

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Entities</h1>
          <p className="mt-0.5 text-sm text-muted">Manage users, services, and API keys</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-accent/90 hover:shadow-md" onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          Add Entity
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 rounded-xl border border-border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input type="text" placeholder="Search entities..." className="w-full pl-9" />
          </div>
          <select className="w-full sm:w-36">
            <option value="">All Types</option>
            <option value="user">User</option>
            <option value="service">Service</option>
            <option value="api_key">API Key</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted">Loading entities...</div>
        ) : entities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-sm text-muted">
            <User className="h-10 w-10 mb-3 opacity-30" />
            <p>No entities found</p>
          </div>
        ) : (
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
                  <td className="hidden px-4 py-3 text-sm text-muted md:table-cell">{e.createdAt}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="rounded-lg px-2 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent/5">
                        View
                      </button>
                      <button className="rounded-lg p-1 text-muted transition-colors hover:bg-surface-2">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-muted">
          {loading ? 'Loading...' : `Showing ${entities.length} entit${entities.length === 1 ? 'y' : 'ies'}`}
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
    <EntityForm
      open={createOpen}
      onOpenChange={setCreateOpen}
      entity={editEntity}
      onSuccess={handleSuccess}
    />
    </div>
  );
}
