'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, FileText, Database, Server as ServerIcon, CreditCard, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { api, type Resource } from '@/lib/api';
import { ResourceForm } from '@/components/ResourceForm';

const resourceIcons: Record<string, { icon: typeof FileText; color: string; bg: string }> = {
  document: { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
  database: { icon: Database, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  api: { icon: ServerIcon, color: 'text-violet-500', bg: 'bg-violet-50' },
  billing: { icon: CreditCard, color: 'text-amber-500', bg: 'bg-amber-50' },
};

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editResource, setEditResource] = useState<Resource | null>(null);

  useEffect(() => {
    api.resources.list()
      .then(setResources)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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
    // Refetch resources
    api.resources.list().then(setResources).catch(console.error);
  };

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Resources</h1>
          <p className="mt-0.5 text-sm text-muted">Manage protected resources and access patterns</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-accent/90 hover:shadow-md" onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          Add Resource
        </button>
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

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted">Loading resources...</div>
        ) : resources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-sm text-muted">
            <FileText className="h-10 w-10 mb-3 opacity-30" />
            <p>No resources found</p>
          </div>
        ) : (
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
                  <td className="hidden px-4 py-3 text-sm text-muted md:table-cell">{r.createdAt}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="rounded-lg px-2 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent/5" onClick={() => handleEdit(r)}>
                        Edit
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
          {loading ? 'Loading...' : `Showing ${resources.length} resource${resources.length === 1 ? '' : 's'}`}
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
    <ResourceForm
      open={createOpen}
      onOpenChange={setCreateOpen}
      resource={editResource}
      onSuccess={handleSuccess}
    />
    </div>
  );
}
