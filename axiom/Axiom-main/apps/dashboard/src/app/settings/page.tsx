export default function SettingsPage() {
    return (
        <div className="p-8 gradient-mesh min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold gradient-text">Settings</h1>
                <p style={{ color: 'var(--muted-foreground)' }}>Manage your organization and API access</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sidebar Navigation */}
                <div className="lg:col-span-1">
                    <nav className="space-y-1">
                        <SettingsNavItem href="/settings" label="Organization" active />
                        <SettingsNavItem href="/settings/api-keys" label="API Keys" />
                        <SettingsNavItem href="/settings/team" label="Team Members" />
                        <SettingsNavItem href="/settings/billing" label="Billing" />
                        <SettingsNavItem href="/settings/profile" label="Profile" />
                    </nav>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Organization Settings */}
                    <div className="card">
                        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Organization</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                                    Organization Name
                                </label>
                                <input
                                    type="text"
                                    defaultValue="Acme Corp"
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                                    Organization Slug
                                </label>
                                <input
                                    type="text"
                                    defaultValue="acme-corp"
                                    className="w-full"
                                />
                                <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                                    Used in API requests: api.accessforge.io/v1/orgs/acme-corp
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                            <button className="btn-primary">
                                Save Changes
                            </button>
                        </div>
                    </div>

                    {/* API Keys Section */}
                    <div className="card">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>API Keys</h2>
                            <button className="btn-secondary">
                                + Generate New Key
                            </button>
                        </div>

                        <div className="space-y-3">
                            <ApiKeyRow
                                name="Production API Key"
                                keyPrefix="pk_live_..."
                                lastUsed="2 minutes ago"
                                created="Dec 15, 2024"
                            />
                            <ApiKeyRow
                                name="Development API Key"
                                keyPrefix="pk_test_..."
                                lastUsed="5 hours ago"
                                created="Dec 10, 2024"
                            />
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="card" style={{ borderColor: 'oklch(0.65 0.20 25)' }}>
                        <h2 className="text-lg font-semibold mb-4" style={{ color: 'oklch(0.55 0.20 25)' }}>
                            Danger Zone
                        </h2>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium" style={{ color: 'var(--foreground)' }}>Delete Organization</p>
                                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                                    Permanently delete this organization and all its data
                                </p>
                            </div>
                            <button
                                className="px-4 py-2 rounded text-sm font-medium"
                                style={{
                                    background: 'oklch(0.55 0.20 25)',
                                    color: 'white'
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SettingsNavItem({
    href,
    label,
    active = false
}: {
    href: string;
    label: string;
    active?: boolean;
}) {
    return (
        <a
            href={href}
            className="block px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
                background: active ? 'var(--accent)' : 'transparent',
                color: active ? 'var(--accent-foreground)' : 'var(--muted-foreground)',
            }}
        >
            {label}
        </a>
    );
}

function ApiKeyRow({
    name,
    keyPrefix,
    lastUsed,
    created,
}: {
    name: string;
    keyPrefix: string;
    lastUsed: string;
    created: string;
}) {
    return (
        <div
            className="flex items-center justify-between py-3 border-b last:border-0"
            style={{ borderColor: 'var(--border)' }}
        >
            <div>
                <p className="font-medium" style={{ color: 'var(--foreground)' }}>{name}</p>
                <div className="flex items-center space-x-4 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    <span className="font-mono">{keyPrefix}</span>
                    <span>Last used: {lastUsed}</span>
                    <span>Created: {created}</span>
                </div>
            </div>
            <div className="flex space-x-2">
                <button
                    className="text-sm"
                    style={{ color: 'oklch(0.52 0.14 190)' }}
                >
                    Copy
                </button>
                <button
                    className="text-sm"
                    style={{ color: 'oklch(0.55 0.20 25)' }}
                >
                    Revoke
                </button>
            </div>
        </div>
    );
}
