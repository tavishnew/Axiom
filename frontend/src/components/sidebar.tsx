'use client';

import { useLocation } from 'wouter';
import {
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  FlaskConical,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Shield,
  ShieldHalf,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth.tsx';

type SidebarProps = {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
};

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Policies', href: '/policies', icon: Shield },
  { name: 'Entities', href: '/entities', icon: Users },
  { name: 'Resources', href: '/resources', icon: FolderKanban },
  { name: 'Decisions', href: '/decisions', icon: ClipboardList },
  { name: 'Audit Log', href: '/audit-logs', icon: ClipboardList },
  { name: 'Test Console', href: '/test', icon: FlaskConical },
  { name: 'Settings', href: '/settings', icon: Settings },
];

function initials(name?: string, email?: string) {
  const source = (name || email || 'Axiom User').trim();
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function NavigationContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const [pathname] = useLocation();
  const { user } = useAuth();
  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
  const userName = user?.name || 'Axiom user';
  const userEmail = user?.email || '';

  return (
    <>
      <nav aria-label="Primary navigation" className={`flex-1 overflow-y-auto ${collapsed ? 'px-2 py-4' : 'px-3 py-4'}`}>
        <ul className="space-y-1">
          {navigation.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <a
                  href={item.href}
                  onClick={onNavigate}
                  title={collapsed ? item.name : undefined}
                  aria-current={active ? 'page' : undefined}
                  className={`group flex h-10 items-center rounded-lg text-sm font-medium transition-all ${
                    collapsed ? 'justify-center px-2' : 'justify-between px-3'
                  } ${active ? 'bg-accent text-white shadow-sm' : 'text-muted hover:bg-surface-2 hover:text-ink'}`}
                >
                  <span className={`flex min-w-0 items-center ${collapsed ? '' : 'gap-3'}`}>
                    <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-white' : 'text-muted group-hover:text-ink'}`} />
                    {!collapsed && <span className="truncate">{item.name}</span>}
                  </span>
                  {!collapsed && active && <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={`border-t border-[--sidebar-border] ${collapsed ? 'p-3' : 'p-4'}`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`} title={collapsed ? `${userName}${userEmail ? ` · ${userEmail}` : ''}` : undefined}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-2 text-xs font-bold text-white shadow-sm">
            {initials(userName, userEmail)}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{userName}</p>
              {userEmail && <p className="truncate text-xs text-muted">{userEmail}</p>}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export function Sidebar({ collapsed, onCollapsedChange, mobileOpen, onMobileOpenChange }: SidebarProps) {
  return (
    <>
      <button
        type="button"
        onClick={() => onMobileOpenChange(true)}
        aria-label="Open navigation"
        aria-expanded={mobileOpen}
        className="fixed left-4 top-4 z-30 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-white text-ink shadow-sm transition-colors hover:bg-surface-2 md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          onClick={() => onMobileOpenChange(false)}
          className="fixed inset-0 z-30 bg-ink/35 backdrop-blur-[1px] md:hidden"
        />
      )}

      <aside
        aria-label="Mobile navigation"
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-[--sidebar-border] bg-white shadow-xl transition-transform duration-300 md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-[--sidebar-border] px-5">
          <a href="/" onClick={() => onMobileOpenChange(false)} className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-2 text-white shadow-sm">
              <ShieldHalf className="h-4 w-4" />
            </div>
            <span className="font-tight text-lg font-semibold tracking-tight text-ink">Axiom<span className="text-accent">.</span></span>
          </a>
          <button type="button" onClick={() => onMobileOpenChange(false)} aria-label="Close navigation" className="rounded-md p-2 text-muted transition-colors hover:bg-surface-2 hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>
        <NavigationContent collapsed={false} onNavigate={() => onMobileOpenChange(false)} />
      </aside>

      <aside
        aria-label="Desktop navigation"
        className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-[--sidebar-border] bg-white transition-[width] duration-300 ease-out md:flex ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className={`flex h-16 items-center border-b border-[--sidebar-border] ${collapsed ? 'justify-between px-3' : 'justify-between px-5'}`}>
          <a href="/" className={`flex items-center ${collapsed ? '' : 'gap-2.5'}`} title={collapsed ? 'Axiom home' : undefined}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-2 text-white shadow-sm">
              <ShieldHalf className="h-4 w-4" />
            </div>
            {!collapsed && <span className="font-tight text-lg font-semibold tracking-tight text-ink">Axiom<span className="text-accent">.</span></span>}
          </a>
          <button
            type="button"
            onClick={() => onCollapsedChange(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`flex items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-ink ${collapsed ? 'h-8 w-8' : 'p-2'}`}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        <NavigationContent collapsed={collapsed} />
      </aside>
    </>
  );
}
