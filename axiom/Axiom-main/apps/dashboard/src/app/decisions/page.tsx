export default function DecisionsPage() {
    return (
        <div className="p-8 gradient-mesh min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold gradient-text">Decisions</h1>
                    <p style={{ color: 'var(--muted-foreground)' }}>View and analyze authorization decisions</p>
                </div>
                <div className="flex space-x-2">
                    <button className="btn-secondary">
                        Export
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="card mb-6">
                <div className="flex items-center space-x-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search by entity, resource, or request ID..."
                            className="w-full"
                        />
                    </div>
                    <select className="w-32">
                        <option value="">All Outcomes</option>
                        <option value="allow">Allow</option>
                        <option value="deny">Deny</option>
                    </select>
                    <select className="w-40">
                        <option value="">Last 24 hours</option>
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                    </select>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <StatCard title="Total Decisions" value="12,847" />
                <StatCard title="Allowed" value="12,091" change="94.1%" />
                <StatCard title="Denied" value="756" change="5.9%" />
                <StatCard title="Avg Latency" value="4.2ms" />
            </div>

            {/* Decisions Table */}
            <div className="card overflow-hidden p-0">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>Entity</th>
                            <th>Action</th>
                            <th>Resource</th>
                            <th>Decision</th>
                            <th>Policy</th>
                            <th>Latency</th>
                        </tr>
                    </thead>
                    <tbody>
                        <DecisionRow
                            timestamp="2024-12-29 18:45:12"
                            entityId="user-123"
                            entityType="user"
                            action="read"
                            resourceType="document"
                            resourceId="doc-456"
                            decision="allow"
                            policy="allow-pro-features"
                            latencyMs={4.2}
                        />
                        <DecisionRow
                            timestamp="2024-12-29 18:44:58"
                            entityId="user-456"
                            entityType="user"
                            action="delete"
                            resourceType="user"
                            resourceId="admin"
                            decision="deny"
                            policy="deny-admin-delete"
                            latencyMs={3.8}
                        />
                        <DecisionRow
                            timestamp="2024-12-29 18:44:32"
                            entityId="service-api"
                            entityType="service"
                            action="write"
                            resourceType="database"
                            resourceId="users"
                            decision="allow"
                            policy="allow-service-write"
                            latencyMs={5.1}
                        />
                        <DecisionRow
                            timestamp="2024-12-29 18:43:55"
                            entityId="user-789"
                            entityType="user"
                            action="admin"
                            resourceType="billing"
                            resourceId="invoices"
                            decision="deny"
                            policy="default-deny"
                            latencyMs={2.9}
                        />
                        <DecisionRow
                            timestamp="2024-12-29 18:43:21"
                            entityId="user-123"
                            entityType="user"
                            action="read"
                            resourceType="report"
                            resourceId="q4-2024"
                            decision="allow"
                            policy="allow-pro-features"
                            latencyMs={4.5}
                        />
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between">
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    Showing 1-5 of 12,847 decisions
                </p>
                <div className="flex space-x-2">
                    <button className="btn-secondary" disabled>
                        Previous
                    </button>
                    <button className="btn-secondary">
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, change }: { title: string; value: string; change?: string }) {
    return (
        <div className="card">
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{title}</p>
            <p className="text-2xl font-semibold mt-1" style={{ color: 'var(--foreground)' }}>{value}</p>
            {change && (
                <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{change}</p>
            )}
        </div>
    );
}

function DecisionRow({
    timestamp,
    entityId,
    entityType,
    action,
    resourceType,
    resourceId,
    decision,
    policy,
    latencyMs,
}: {
    timestamp: string;
    entityId: string;
    entityType: string;
    action: string;
    resourceType: string;
    resourceId: string;
    decision: 'allow' | 'deny';
    policy: string;
    latencyMs: number;
}) {
    return (
        <tr>
            <td>
                <span className="text-xs font-mono" style={{ color: 'var(--muted-foreground)' }}>
                    {timestamp}
                </span>
            </td>
            <td>
                <div>
                    <span className="font-medium" style={{ color: 'var(--foreground)' }}>{entityId}</span>
                    <span className="text-xs ml-1" style={{ color: 'var(--muted-foreground)' }}>({entityType})</span>
                </div>
            </td>
            <td>
                <span
                    className="px-2 py-0.5 rounded text-xs font-medium"
                    style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
                >
                    {action}
                </span>
            </td>
            <td>
                <div>
                    <span style={{ color: 'var(--foreground)' }}>{resourceType}</span>
                    <span className="text-xs ml-1" style={{ color: 'var(--muted-foreground)' }}>/{resourceId}</span>
                </div>
            </td>
            <td>
                <span className={decision === 'allow' ? 'badge-allow' : 'badge-deny'}>
                    {decision}
                </span>
            </td>
            <td>
                <a
                    href={`/policies/${policy}`}
                    className="text-sm"
                    style={{ color: 'oklch(0.52 0.14 190)' }}
                >
                    {policy}
                </a>
            </td>
            <td>
                <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    {latencyMs}ms
                </span>
            </td>
        </tr>
    );
}
