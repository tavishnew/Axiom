'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlaskConical, Send, Shield, ShieldOff, Copy, CheckCircle, XCircle, Search, ChevronDown, User, Server, Key, FileText, Database } from 'lucide-react';
import { api, type Entity, type Resource } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function TestConsolePage() {
  const [entityId, setEntityId] = useState('');
  const [entityType, setEntityType] = useState('user');
  const [entityAttrs, setEntityAttrs] = useState('{"plan": "pro", "role": "member"}');
  const [action, setAction] = useState('read');
  const [resourceType, setResourceType] = useState('document');
  const [resourceId, setResourceId] = useState('');
  const [result, setResult] = useState<null | {
    decision: 'allow' | 'deny';
    reason: string;
    matchedPolicy?: string;
    latencyMs: number;
  }>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Autocomplete data
  const [entities, setEntities] = useState<Entity[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [showEntityDropdown, setShowEntityDropdown] = useState(false);
  const [showResourceDropdown, setShowResourceDropdown] = useState(false);
  const [entitySearch, setEntitySearch] = useState('');
  const [resourceSearch, setResourceSearch] = useState('');

  // Fetch entities and resources for autocomplete
  useEffect(() => {
    api.entities.list({ limit: 100 }).then(res => setEntities(res.data)).catch(console.error);
    api.resources.list({ limit: 100 }).then(res => setResources(res.data)).catch(console.error);
  }, []);

  const filteredEntities = entities.filter(e =>
    e.id.toLowerCase().includes(entitySearch.toLowerCase()) ||
    e.externalId.toLowerCase().includes(entitySearch.toLowerCase()) ||
    e.type.toLowerCase().includes(entitySearch.toLowerCase())
  );

  const filteredResources = resources.filter(r =>
    r.name.toLowerCase().includes(resourceSearch.toLowerCase()) ||
    r.type.toLowerCase().includes(resourceSearch.toLowerCase()) ||
    (r.description || '').toLowerCase().includes(resourceSearch.toLowerCase())
  );

  const handleTest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    let parsedAttrs: Record<string, unknown> = {};
    try {
      parsedAttrs = entityAttrs ? JSON.parse(entityAttrs) : {};
    } catch {
      setError('Invalid JSON in attributes field');
      setLoading(false);
      return;
    }

    try {
      const res = await api.decisions.evaluate({
        entity: { id: entityId, type: entityType, attributes: parsedAttrs },
        action,
        resource: { type: resourceType, id: resourceId || undefined },
      });
      setResult({
        decision: res.decision as 'allow' | 'deny',
        reason: res.reason,
        matchedPolicy: res.matchedPolicy,
        latencyMs: res.latencyMs,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    }
    setLoading(false);
  };

  const selectEntity = (entity: Entity) => {
    setEntityId(entity.id);
    setEntityType(entity.type);
    setEntityAttrs(JSON.stringify(entity.attributes, null, 2));
    setShowEntityDropdown(false);
    setEntitySearch('');
  };

  const selectResource = (resource: Resource) => {
    setResourceType(resource.type);
    setResourceId(resource.name);
    setShowResourceDropdown(false);
    setResourceSearch('');
  };

  const entityTypeIcons = {
    user: { icon: User, bg: 'bg-surface-2', color: 'text-accent' },
    service: { icon: Server, bg: 'bg-emerald-50', color: 'text-emerald-600' },
    api_key: { icon: Key, bg: 'bg-surface-2', color: 'text-accent' },
  };

  const resourceTypeIcons = {
    document: { icon: FileText, bg: 'bg-surface-2', color: 'text-accent' },
    database: { icon: Database, bg: 'bg-emerald-50', color: 'text-emerald-600' },
    api: { icon: Server, bg: 'bg-surface-2', color: 'text-accent' },
    billing: { icon: FileText, bg: 'bg-surface-2', color: 'text-accent' },
  };

  return (
    <div className="editorial-page animate-editorial-rise">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-serif text-[clamp(2rem,4vw,3.1rem)] font-normal leading-[0.98] tracking-[-0.035em] text-ink">Test Console</h1>
        <p className="mt-0.5 text-sm text-muted">Test your policies against the live evaluation engine</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Input Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-md border border-border bg-surface p-6 shadow-[0_16px_32px_-26px_rgba(29,26,24,0.44)]"
        >
          <div className="flex items-center gap-2 mb-6">
            <FlaskConical className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-ink">Request</h2>
          </div>

          <form onSubmit={handleTest} className="space-y-5">
            {/* Entity Section */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Entity</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <label className="block text-xs font-medium text-muted mb-1">ID</label>
                  <div className="relative">
                    <Input
                      type="text"
                      value={entityId}
                      onChange={e => { setEntityId(e.target.value); setEntitySearch(e.target.value); setShowEntityDropdown(true); }}
                      onFocus={() => setShowEntityDropdown(true)}
                      onBlur={() => setTimeout(() => setShowEntityDropdown(false), 200)}
                      placeholder="Select or type entity ID"
                      className="w-full"
                    />
                    {showEntityDropdown && filteredEntities.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 rounded-md border border-border bg-surface shadow-lg z-10 max-h-60 overflow-y-auto">
                        {filteredEntities.map(entity => {
                          const cfg = entityTypeIcons[entity.type as keyof typeof entityTypeIcons] || entityTypeIcons.user;
                          const Icon = cfg.icon;
                          return (
                            <button
                              key={entity.id}
                              type="button"
                              onClick={() => selectEntity(entity)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-surface-2 transition-colors"
                            >
                              <div className={`flex h-6 w-6 items-center justify-center rounded ${cfg.bg}`}>
                                <Icon className={`h-3 w-3 ${cfg.color}`} />
                              </div>
                              <div className="flex-1 text-left">
                                <p className="text-sm font-medium text-ink">{entity.id}</p>
                                <p className="text-xs text-muted capitalize">{entity.type}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Type</label>
                  <select
                    value={entityType}
                    onChange={e => setEntityType(e.target.value)}
                    className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
                  >
                    <option value="user">User</option>
                    <option value="service">Service</option>
                    <option value="api_key">API Key</option>
                  </select>
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-xs font-medium text-muted mb-1">Attributes (JSON)</label>
                <textarea
                  value={entityAttrs}
                  onChange={e => setEntityAttrs(e.target.value)}
                  rows={3}
                  className="w-full font-mono text-sm rounded-md border border-border bg-surface px-3 py-2"
                />
              </div>
            </div>

            {/* Action */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Action</h3>
              <select
                value={action}
                onChange={e => setAction(e.target.value)}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
              >
                <option value="read">read</option>
                <option value="write">write</option>
                <option value="delete">delete</option>
                <option value="admin">admin</option>
              </select>
            </div>

            {/* Resource */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Resource</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <label className="block text-xs font-medium text-muted mb-1">Type</label>
                  <div className="relative">
                    <Input
                      type="text"
                      value={resourceType}
                      onChange={e => { setResourceType(e.target.value); setResourceSearch(e.target.value); setShowResourceDropdown(true); }}
                      onFocus={() => setShowResourceDropdown(true)}
                      onBlur={() => setTimeout(() => setShowResourceDropdown(false), 200)}
                      placeholder="Select or type resource type"
                      className="w-full"
                    />
                    {showResourceDropdown && filteredResources.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 rounded-md border border-border bg-surface shadow-lg z-10 max-h-60 overflow-y-auto">
                        {filteredResources.map(resource => {
                          const cfg = resourceTypeIcons[resource.type as keyof typeof resourceTypeIcons] || { icon: FileText, bg: 'bg-gray-50', color: 'text-gray-600' };
                          const Icon = cfg.icon;
                          return (
                            <button
                              key={resource.id}
                              type="button"
                              onClick={() => selectResource(resource)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-surface-2 transition-colors"
                            >
                              <div className={`flex h-6 w-6 items-center justify-center rounded ${cfg.bg}`}>
                                <Icon className={`h-3 w-3 ${cfg.color}`} />
                              </div>
                              <div className="flex-1 text-left">
                                <p className="text-sm font-medium text-ink">{resource.name}</p>
                                <p className="text-xs text-muted">{resource.type}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">ID (optional)</label>
                  <Input
                    type="text"
                    value={resourceId}
                    onChange={e => setResourceId(e.target.value)}
                    placeholder="Resource ID"
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 border border-red-200">
                {error}
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-sm font-medium text-white shadow-sm hover:bg-accent/90 hover:shadow-md disabled:opacity-50"
            >
              {loading ? 'Checking...' : (
                <>
                  <Send className="h-4 w-4" />
                  Check Access
                </>
              )}
            </Button>
          </form>
        </motion.div>

        {/* Result */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-md border border-border bg-surface p-6 shadow-[0_16px_32px_-26px_rgba(29,26,24,0.44)]"
        >
          <div className="flex items-center gap-2 mb-6">
            <Shield className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-ink">Result</h2>
          </div>

          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-16 text-muted"
              >
                <FlaskConical className="h-12 w-12 mb-4 opacity-30" />
                <p className="text-sm">Run a test to see the result</p>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-5"
              >
                {/* Decision Badge */}
                <div className="flex justify-center py-8">
                  <div className={`inline-flex items-center gap-2.5 rounded-2xl px-6 py-3 ${
                    result.decision === 'allow'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-red-50 text-red-700'
                  }`}>
                    {result.decision === 'allow' ? (
                      <><CheckCircle className="h-6 w-6" /> ALLOW</>
                    ) : (
                      <><XCircle className="h-6 w-6" /> DENY</>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-4 rounded-xl bg-surface-2 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted">Reason</p>
                      <p className="mt-0.5 text-sm text-ink">{result.reason}</p>
                    </div>
                    <span className="rounded-full bg-surface px-2 py-0.5 font-mono text-xs text-muted">
                      {result.latencyMs}ms
                    </span>
                  </div>
                  {result.matchedPolicy && (
                    <div>
                      <p className="text-xs font-medium text-muted">Matched Policy</p>
                      <a href={`/policies/${result.matchedPolicy}`} className="mt-0.5 inline-block text-sm text-accent hover:underline">
                        {result.matchedPolicy}
                      </a>
                    </div>
                  )}
                </div>

                {/* Code Example */}
                <div>
                  <p className="text-xs font-medium text-muted mb-1">SDK Code</p>
                  <div className="rounded-lg border border-border bg-[#f5f7fb] p-3">
                    <pre className="font-mono text-xs leading-relaxed text-ink overflow-x-auto">{`const allowed = await axiom.can({
  entity: { id: '${entityId}', type: '${entityType}', attributes: ${entityAttrs} },
  action: '${action}',
  resource: { type: '${resourceType}', id: '${resourceId}' },
});
// Result: ${result.decision}`}</pre>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 gap-1 text-xs text-muted hover:text-accent"
                    onClick={() => {
                      const code = `const allowed = await axiom.can({
  entity: { id: '${entityId}', type: '${entityType}', attributes: ${entityAttrs} },
  action: '${action}',
  resource: { type: '${resourceType}', id: '${resourceId}' },
});
// Result: ${result.decision}`;
                      navigator.clipboard.writeText(code);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                      toast.success("Copied to clipboard");
                    }}
                  >
                    <Copy className="h-3 w-3" />
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}