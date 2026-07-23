export default function ResourcesPage() {
    return (
        <div className="p-8 gradient-mesh min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold gradient-text">Resources</h1>
                    <p style={{ color: 'var(--muted-foreground)' }}>Manage protected resources and access patterns</p>
                </div>
                <button className="btn-primary">
                    + Add Resource
                </button>
            </div>

            {/* Resource Types Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <ResourceTypeCard type="document" count={124} icon="📄" />
                <ResourceTypeCard type="database" count={8} icon="🗄️" />
                <ResourceTypeCard type="api" count={32} icon="🔌" />
                <ResourceTypeCard type="billing" count={4} icon="💳" />
            </div>

            {/* Resources Table */}
            <div className="card overflow-hidden p-0">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Resource Type</th>
                            <th>Resource ID</th>
                            <th>Owner</th>
                            <th>Actions Available</th>
                            <th>Access Requests (24h)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <ResourceRow
                            type="document"
                            id="report-q4-2024"
                            owner="user-123"
                            actions={['read', 'write', 'delete']}
                            requests={248}
                        />
                        <ResourceRow
                            type="database"
                            id="users"
                            owner="service-api"
                            actions={['read', 'write', 'admin']}
                            requests={1284}
                        />
                        <ResourceRow
                            type="api"
                            id="v1/evaluate"
                            owner="system"
                            actions={['call']}
                            requests={5672}
                        />
                        <ResourceRow
                            type="billing"
                            id="invoices"
                            owner="admin"
                            actions={['read', 'create', 'void']}
                            requests={42}
                        />
                        <ResourceRow
                            type="document"
                            id="contract-2024-001"
                            owner="user-456"
                            actions={['read']}
                            requests={12}
                        />
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between">
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    Showing 1-5 of 168 resources
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

function ResourceTypeCard({
    type,
    count,
    icon
}: {
    type: string;
    count: number;
    icon: string;
}) {
    return (
        <div className="card">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{type}</p>
                    <p className="text-2xl font-semibold mt-1" style={{ color: 'var(--foreground)' }}>{count}</p>
                </div>
                <span className="text-2xl">{icon}</span>
            </div>
        </div>
    );
}

function ResourceRow({
    type,
    id,
    owner,
    actions,
    requests,
}: {
    type: string;
    id: string;
    owner: string;
    actions: string[];
    requests: number;
}) {
    return (
        <tr>
            <td>
                <span
                    className="px-2 py-0.5 rounded text-xs font-medium"
                    style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
                >
                    {type}
                </span>
            </td>
            <td>
                <span className="font-medium" style={{ color: 'var(--foreground)' }}>{id}</span>
            </td>
            <td>
                <a
                    href={`/entities/${owner}`}
                    className="text-sm"
                    style={{ color: 'oklch(0.52 0.14 190)' }}
                >
                    {owner}
                </a>
            </td>
            <td>
                <div className="flex flex-wrap gap-1">
                    {actions.map((action) => (
                        <span
                            key={action}
                            className="px-1.5 py-0.5 rounded text-xs"
                            style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}
                        >
                            {action}
                        </span>
                    ))}
                </div>
            </td>
            <td>
                <span className="text-sm" style={{ color: 'var(--foreground)' }}>{requests.toLocaleString()}</span>
            </td>
        </tr>
    );
}
