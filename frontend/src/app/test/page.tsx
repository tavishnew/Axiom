'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlaskConical, Send, Shield, ShieldOff, Copy, CheckCircle, XCircle } from 'lucide-react';
import { api } from '@/lib/api';

export default function TestConsolePage() {
  const [entityId, setEntityId] = useState('user-123');
  const [entityType, setEntityType] = useState('user');
  const [entityAttrs, setEntityAttrs] = useState('{"plan": "pro", "role": "member"}');
  const [action, setAction] = useState('read');
  const [resourceType, setResourceType] = useState('document');
  const [resourceId, setResourceId] = useState('doc-456');
  const [result, setResult] = useState<null | {
    decision: 'allow' | 'deny';
    reason: string;
    matchedPolicy?: string;
    latencyMs: number;
  }>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">Test Console</h1>
        <p className="mt-0.5 text-sm text-muted">Test your policies against the live evaluation engine</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Input Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-xl border border-border bg-white p-6 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-6">
            <FlaskConical className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-ink">Request</h2>
          </div>

          <form onSubmit={handleTest} className="space-y-5">
            {/* Entity Section */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Entity</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">ID</label>
                  <input type="text" value={entityId} onChange={e => setEntityId(e.target.value)} className="w-full" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Type</label>
                  <select value={entityType} onChange={e => setEntityType(e.target.value)} className="w-full">
                    <option value="user">user</option>
                    <option value="service">service</option>
                    <option value="api_key">api_key</option>
                  </select>
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-xs font-medium text-muted mb-1">Attributes (JSON)</label>
                <textarea
                  value={entityAttrs}
                  onChange={e => setEntityAttrs(e.target.value)}
                  rows={2}
                  className="w-full font-mono text-sm"
                />
              </div>
            </div>

            {/* Action */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Action</h3>
              <select value={action} onChange={e => setAction(e.target.value)} className="w-full">
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
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Type</label>
                  <input type="text" value={resourceType} onChange={e => setResourceType(e.target.value)} className="w-full" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">ID (optional)</label>
                  <input type="text" value={resourceId} onChange={e => setResourceId(e.target.value)} className="w-full" />
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 border border-red-200">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-accent/90 hover:shadow-md disabled:opacity-50"
            >
              {loading ? (
                <>Checking...</>
              ) : (
                <><Send className="h-4 w-4" /> Check Access</>
              )}
            </button>
          </form>
        </motion.div>

        {/* Result */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-xl border border-border bg-white p-6 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-6">
            <Shield className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-ink">Result</h2>
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
                  <div>
                    <p className="text-xs font-medium text-muted mb-1">Matched Policy</p>
                    <p className="text-sm text-ink">{result.matchedPolicy || 'None'}</p>
                  </div>
                </div>

                {/* Code Example */}
                <div>
                  <p className="text-xs font-medium text-muted mb-1">SDK Code</p>
                  <div className="rounded-lg border border-border bg-[#f5f7fb] p-3">
                    <pre className="font-mono text-xs leading-relaxed text-ink">{`const allowed = await axiom.can({
  entity: { id: '${entityId}', type: '${entityType}', attributes: ${entityAttrs} },
  action: '${action}',
  resource: { type: '${resourceType}', id: '${resourceId}' },
});
// Result: ${result.decision}`}</pre>
                  </div>
                  <button className="mt-2 inline-flex items-center gap-1 text-xs text-muted hover:text-accent">
                    <Copy className="h-3 w-3" /> Copy
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
