export default function PoliciesPage() {
    return (
        <div className="p-8 gradient-mesh min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold gradient-text">Policies</h1>
                    <p style={{ color: 'var(--muted-foreground)' }}>Manage your access control policies</p>
                </div>
                <a href="/policies/new" className="btn-primary">
                    + Create Policy
                </a>
            </div>

            {/* Filters */}
            <div className="card mb-6">
                <div className="flex items-center space-x-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search policies..."
                            className="w-full"
                        />
                    </div>
                    <select className="w-32">
                        <option value="">All Effects</option>
                        <option value="allow">Allow</option>
                        <option value="deny">Deny</option>
                    </select>
                    <select className="w-32">
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            </div>

            {/* Policies Table */}
            <div className="card overflow-hidden p-0">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Effect</th>
                            <th>Conditions</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Matches (24h)</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <PolicyTableRow
                            id="pol_1"
                            name="allow-pro-features"
                            description="Allow pro/enterprise plans to access premium features"
                            effect="allow"
                            conditionsCount={2}
                            priority={100}
                            active={true}
                            matches={248}
                        />
                        <PolicyTableRow
                            id="pol_2"
                            name="deny-free-export"
                            description="Deny free plan access to export feature"
                            effect="deny"
                            conditionsCount={3}
                            priority={90}
                            active={true}
                            matches={42}
                        />
                        <PolicyTableRow
                            id="pol_3"
                            name="allow-admin-all"
                            description="Allow admin role full access to all resources"
                            effect="allow"
                            conditionsCount={1}
                            priority={200}
                            active={true}
                            matches={156}
                        />
                        <PolicyTableRow
                            id="pol_4"
                            name="rate-limit-exceeded"
                            description="Deny when API rate limit is exceeded"
                            effect="deny"
                            conditionsCount={2}
                            priority={999}
                            active={true}
                            matches={12}
                        />
                        <PolicyTableRow
                            id="pol_5"
                            name="allow-read-public"
                            description="Allow all users to read public resources"
                            effect="allow"
                            conditionsCount={2}
                            priority={10}
                            active={false}
                            matches={0}
                        />
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between">
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    Showing 1-5 of 5 policies
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

function PolicyTableRow({
    id,
    name,
    description,
    effect,
    conditionsCount,
    priority,
    active,
    matches,
}: {
    id: string;
    name: string;
    description: string;
    effect: 'allow' | 'deny';
    conditionsCount: number;
    priority: number;
    active: boolean;
    matches: number;
}) {
    return (
        <tr>
            <td>
                <div>
                    <a
                        href={`/policies/${id}`}
                        className="font-medium"
                        style={{ color: 'oklch(0.52 0.14 190)' }}
                    >
                        {name}
                    </a>
                    <p className="text-xs max-w-xs truncate" style={{ color: 'var(--muted-foreground)' }}>{description}</p>
                </div>
            </td>
            <td>
                <span className={effect === 'allow' ? 'badge-allow' : 'badge-deny'}>
                    {effect}
                </span>
            </td>
            <td style={{ color: 'var(--muted-foreground)' }}>
                {conditionsCount} condition{conditionsCount !== 1 ? 's' : ''}
            </td>
            <td style={{ color: 'var(--muted-foreground)' }}>
                {priority}
            </td>
            <td>
                <span
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    style={{
                        background: active ? 'oklch(0.93 0.15 145)' : 'var(--muted)',
                        color: active ? 'oklch(0.35 0.15 145)' : 'var(--muted-foreground)'
                    }}
                >
                    {active ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td style={{ color: 'var(--muted-foreground)' }}>
                {matches.toLocaleString()}
            </td>
            <td>
                <div className="flex space-x-2">
                    <button
                        className="text-sm font-medium"
                        style={{ color: 'oklch(0.52 0.14 190)' }}
                    >
                        Edit
                    </button>
                    <button
                        className="text-sm"
                        style={{ color: 'var(--muted-foreground)' }}
                    >
                        {active ? 'Deactivate' : 'Activate'}
                    </button>
                </div>
            </td>
        </tr>
    );
}
