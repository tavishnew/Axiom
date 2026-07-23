export default function EntitiesPage() {
    return (
        <div className="p-8 gradient-mesh min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold gradient-text">Entities</h1>
                    <p style={{ color: 'var(--muted-foreground)' }}>Manage users, services, and API keys</p>
                </div>
                <button className="btn-primary">
                    + Add Entity
                </button>
            </div>

            {/* Filters */}
            <div className="card mb-6">
                <div className="flex items-center space-x-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search entities..."
                            className="w-full"
                        />
                    </div>
                    <select className="w-32">
                        <option value="">All Types</option>
                        <option value="user">User</option>
                        <option value="service">Service</option>
                        <option value="api_key">API Key</option>
                    </select>
                </div>
            </div>

            {/* Entities Table */}
            <div className="card overflow-hidden p-0">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Entity ID</th>
                            <th>Type</th>
                            <th>Attributes</th>
                            <th>Last Active</th>
                            <th>Decisions (24h)</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <EntityRow
                            id="user-123"
                            type="user"
                            attributes={{ plan: 'pro', role: 'admin' }}
                            lastActive="2024-12-29 18:45:12"
                            decisions={248}
                        />
                        <EntityRow
                            id="user-456"
                            type="user"
                            attributes={{ plan: 'free', role: 'member' }}
                            lastActive="2024-12-29 18:40:00"
                            decisions={42}
                        />
                        <EntityRow
                            id="service-api"
                            type="service"
                            attributes={{ environment: 'production' }}
                            lastActive="2024-12-29 18:44:32"
                            decisions={1284}
                        />
                        <EntityRow
                            id="api-key-prod-1"
                            type="api_key"
                            attributes={{ scope: 'read-write' }}
                            lastActive="2024-12-29 18:43:55"
                            decisions={567}
                        />
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between">
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    Showing 1-4 of 4 entities
                </p>
                <div className="flex space-x-2">
                    <button className="btn-secondary" disabled>
                        Previous
                    </button>
                    <button className="btn-secondary" disabled>
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}

function EntityRow({
    id,
    type,
    attributes,
    lastActive,
    decisions,
}: {
    id: string;
    type: string;
    attributes: Record<string, string>;
    lastActive: string;
    decisions: number;
}) {
    return (
        <tr>
            <td>
                <span className="font-medium" style={{ color: 'var(--foreground)' }}>{id}</span>
            </td>
            <td>
                <span
                    className="px-2 py-0.5 rounded text-xs font-medium"
                    style={{
                        background: type === 'user' ? 'oklch(0.93 0.04 200)' :
                            type === 'service' ? 'oklch(0.93 0.15 145)' :
                                'oklch(0.93 0.10 60)',
                        color: type === 'user' ? 'oklch(0.32 0.08 190)' :
                            type === 'service' ? 'oklch(0.35 0.15 145)' :
                                'oklch(0.40 0.15 60)'
                    }}
                >
                    {type}
                </span>
            </td>
            <td>
                <div className="flex flex-wrap gap-1">
                    {Object.entries(attributes).map(([key, value]) => (
                        <span
                            key={key}
                            className="px-1.5 py-0.5 rounded text-xs font-mono"
                            style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
                        >
                            {key}={value}
                        </span>
                    ))}
                </div>
            </td>
            <td>
                <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{lastActive}</span>
            </td>
            <td>
                <span className="text-sm" style={{ color: 'var(--foreground)' }}>{decisions.toLocaleString()}</span>
            </td>
            <td>
                <div className="flex space-x-2">
                    <a
                        href={`/entities/${id}`}
                        className="text-sm"
                        style={{ color: 'oklch(0.52 0.14 190)' }}
                    >
                        View
                    </a>
                    <button
                        className="text-sm"
                        style={{ color: 'var(--muted-foreground)' }}
                    >
                        Permissions
                    </button>
                </div>
            </td>
        </tr>
    );
}
