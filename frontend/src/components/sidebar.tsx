'use client';

import { useLocation } from 'wouter';
import {
  LayoutDashboard,
  Shield,
  Users,
  FolderKanban,
  ClipboardList,
  FlaskConical,
  Settings,
  ShieldHalf,
  ChevronRight,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Policies', href: '/policies', icon: Shield },
  { name: 'Entities', href: '/entities', icon: Users },
  { name: 'Resources', href: '/resources', icon: FolderKanban },
  { name: 'Decisions', href: '/decisions', icon: ClipboardList },
  { name: 'Test Console', href: '/test', icon: FlaskConical },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const [pathname] = useLocation();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <div className="fixed left-0 top-0 z-30 flex h-full w-64 flex-col border-r border-[--sidebar-border] bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-[--sidebar-border] px-5">
        <a href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-2 text-white shadow-sm">
            <ShieldHalf className="h-4 w-4" />
          </div>
          <span className="font-tight text-lg font-semibold tracking-tight text-ink">
            Axiom<span className="text-accent">.</span>
          </span>
        </a>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <li key={item.name}>
                <a
                  href={item.href}
                  className={`group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    active
                      ? 'bg-accent text-white shadow-sm'
                      : 'text-muted hover:bg-surface-2 hover:text-ink'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${active ? 'text-white' : 'text-muted'}`} />
                    {item.name}
                  </div>
                  {active && <ChevronRight className="h-3.5 w-3.5" />}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User section */}
      <div className="border-t border-[--sidebar-border] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-2 text-xs font-bold text-white shadow-sm">
            AD
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-ink">Admin User</p>
            <p className="truncate text-xs text-muted">admin@axiom.dev</p>
          </div>
        </div>
      </div>
    </div>
  );
}
