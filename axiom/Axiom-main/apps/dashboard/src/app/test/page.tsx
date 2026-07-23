'use client';

import { useState } from 'react';

export default function TestConsolePage() {
    const [result, setResult] = useState<null | {
        decision: 'allow' | 'deny';
        reason: string;
        matchedPolicy: string | null;
        latencyMs: number;
    }>(null);

    const [loading, setLoading] = useState(false);

    const handleTest = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));

        setResult({
            decision: 'allow',
            reason: 'Matched policy: allow-pro-features',
            matchedPolicy: 'allow-pro-features',
            latencyMs: 4.2,
        });

        setLoading(false);
    };

    return (
        <div className="p-8 gradient-mesh min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold gradient-text">Test Console</h1>
                <p style={{ color: 'var(--muted-foreground)' }}>Test your policies without making real API calls</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Input Form */}
                <div className="card glow-hover">
                    <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Request</h2>

                    <form onSubmit={handleTest} className="space-y-6">
                        {/* Entity Section */}
                        <div>
                            <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>Entity</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>ID</label>
                                    <input
                                        type="text"
                                        defaultValue="user-123"
                                        className="w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Type</label>
                                    <select className="w-full">
                                        <option>user</option>
                                        <option>service</option>
                                        <option>api_key</option>
                                    </select>
                                </div>
                            </div>
                            <div className="mt-2">
                                <label className="block text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Attributes (JSON)</label>
                                <textarea
                                    defaultValue='{"plan": "pro", "role": "member"}'
                                    rows={2}
                                    className="w-full font-mono text-sm"
                                />
                            </div>
                        </div>

                        {/* Action Section */}
                        <div>
                            <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>Action</h3>
                            <select className="w-full">
                                <option>read</option>
                                <option>write</option>
                                <option>delete</option>
                                <option>admin</option>
                            </select>
                        </div>

                        {/* Resource Section */}
                        <div>
                            <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>Resource</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Type</label>
                                    <input
                                        type="text"
                                        defaultValue="document"
                                        className="w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>ID (optional)</label>
                                    <input
                                        type="text"
                                        defaultValue="doc-456"
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary"
                        >
                            {loading ? 'Checking...' : '🧪 Check Access'}
                        </button>
                    </form>
                </div>

                {/* Result Panel */}
                <div className="card glow-hover">
                    <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Result</h2>

                    {!result ? (
                        <div className="text-center py-12" style={{ color: 'var(--muted-foreground)' }}>
                            <p className="text-4xl mb-4">🧪</p>
                            <p>Run a test to see the result</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Decision Badge */}
                            <div className="text-center py-8 rounded-lg" style={{ background: 'var(--muted)' }}>
                                <div
                                    className="inline-flex items-center px-6 py-3 rounded-full text-lg font-bold"
                                    style={{
                                        background: result.decision === 'allow'
                                            ? 'oklch(0.93 0.15 145)'
                                            : 'oklch(0.93 0.10 25)',
                                        color: result.decision === 'allow'
                                            ? 'oklch(0.35 0.15 145)'
                                            : 'oklch(0.45 0.20 25)'
                                    }}
                                >
                                    {result.decision === 'allow' ? '✅' : '❌'} {result.decision.toUpperCase()}
                                </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Reason</label>
                                    <p className="text-sm" style={{ color: 'var(--foreground)' }}>{result.reason}</p>
                                </div>

                                {result.matchedPolicy && (
                                    <div>
                                        <label className="block text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Matched Policy</label>
                                        <a
                                            href={`/policies/${result.matchedPolicy}`}
                                            className="text-sm"
                                            style={{ color: 'oklch(0.52 0.14 190)' }}
                                        >
                                            {result.matchedPolicy}
                                        </a>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Latency</label>
                                    <p className="text-sm" style={{ color: 'var(--foreground)' }}>{result.latencyMs}ms</p>
                                </div>
                            </div>

                            {/* Code Example */}
                            <div>
                                <label className="block text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>SDK Code</label>
                                <div className="code-block">
                                    <pre>{`const allowed = await accessForge.can({
  entity: { id: 'user-123', type: 'user', attributes: { plan: 'pro' } },
  action: 'read',
  resource: { type: 'document', id: 'doc-456' },
});
// Result: ${result.decision}`}</pre>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
