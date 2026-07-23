'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Policies', href: '/policies', icon: ShieldIcon },
    { name: 'Entities', href: '/entities', icon: UsersIcon },
    { name: 'Resources', href: '/resources', icon: FolderIcon },
    { name: 'Decisions', href: '/decisions', icon: ClipboardIcon },
    { name: 'Test Console', href: '/test', icon: BeakerIcon },
    { name: 'Settings', href: '/settings', icon: CogIcon },
];

function HomeIcon({ className }: { className?: string; style?: React.CSSProperties }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
    );
}

function ShieldIcon({ className }: { className?: string; style?: React.CSSProperties }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
    );
}

function UsersIcon({ className }: { className?: string; style?: React.CSSProperties }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    );
}

function FolderIcon({ className }: { className?: string; style?: React.CSSProperties }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
    );
}

function ClipboardIcon({ className }: { className?: string; style?: React.CSSProperties }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
    );
}

function BeakerIcon({ className }: { className?: string; style?: React.CSSProperties }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
    );
}

function CogIcon({ className }: { className?: string; style?: React.CSSProperties }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    );
}

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div
            className="fixed left-0 top-0 h-full w-64 border-r"
            style={{
                background: 'var(--sidebar)',
                borderColor: 'var(--sidebar-border)'
            }}
        >
            {/* Logo */}
            <div
                className="flex items-center h-16 px-6 border-b"
                style={{ borderColor: 'var(--sidebar-border)' }}
            >
                <div className="flex items-center space-x-3">
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{
                            background: 'linear-gradient(135deg, oklch(0.50 0.16 150), oklch(0.40 0.14 150))'
                        }}
                    >
                        <span className="text-white font-bold text-lg">A</span>
                    </div>
                    <span
                        className="text-xl font-semibold gradient-text"
                        style={{
                            background: 'linear-gradient(135deg, oklch(0.50 0.16 150), oklch(0.45 0.14 160))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}
                    >
                        AccessForge
                    </span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="mt-6 px-3">
                <ul className="space-y-1">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/' && pathname.startsWith(item.href));

                        return (
                            <li key={item.name}>
                                <Link
                                    href={item.href}
                                    className="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200"
                                    style={{
                                        background: isActive ? 'var(--sidebar-accent)' : 'transparent',
                                        color: isActive ? 'var(--sidebar-primary)' : 'var(--sidebar-foreground)',
                                    }}
                                >
                                    <item.icon
                                        className="w-5 h-5 mr-3"
                                        style={{
                                            color: isActive ? 'oklch(0.50 0.16 150)' : 'var(--muted-foreground)'
                                        }}
                                    />
                                    {item.name}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* User section */}
            <div
                className="absolute bottom-0 left-0 right-0 p-4 border-t"
                style={{ borderColor: 'var(--sidebar-border)' }}
            >
                <div className="flex items-center">
                    <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{
                            background: 'linear-gradient(135deg, oklch(0.50 0.16 150), oklch(0.40 0.14 150))'
                        }}
                    >
                        <span className="text-sm font-medium text-white">AD</span>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Admin User</p>
                        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>admin@demo.com</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
