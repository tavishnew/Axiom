"use client";

import { useLocation } from "wouter";
import {
  ClipboardList,
  FileClock,
  FlaskConical,
  FolderKanban,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useAuth } from "@/lib/auth.tsx";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type SidebarProps = {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
};

type NavigationItem = { name: string; href: string; icon: typeof LayoutDashboard };

const navigationGroups: Array<{ label: string; items: NavigationItem[] }> = [
  { label: "Overview", items: [{ name: "Dashboard", href: "/dashboard", icon: LayoutDashboard }] },
  {
    label: "Control",
    items: [
      { name: "Policies", href: "/policies", icon: ShieldCheck },
      { name: "Entities", href: "/entities", icon: Users },
      { name: "Resources", href: "/resources", icon: FolderKanban },
    ],
  },
  {
    label: "Evidence",
    items: [
      { name: "Decisions", href: "/decisions", icon: ClipboardList },
      { name: "Audit log", href: "/audit-logs", icon: FileClock },
      { name: "Evaluate a request", href: "/test", icon: FlaskConical },
    ],
  },
  { label: "Workspace", items: [{ name: "Settings", href: "/settings", icon: Settings }] },
];

function initials(name?: string, email?: string) {
  const source = (name || email || "Axiom user").trim();
  return source.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

function Wordmark({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <a href="/" aria-label="Axiom home" title={collapsed ? "Axiom home" : undefined} className="inline-flex items-center gap-3 rounded-sm text-ink">
      <span aria-hidden className="h-6 w-[3px] shrink-0 bg-accent" />
      {!collapsed && <span className="font-serif text-2xl tracking-[-0.045em]">Axiom<span className="text-accent">.</span></span>}
    </a>
  );
}

function NavigationContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const [pathname] = useLocation();
  const { user } = useAuth();
  const isActive = (href: string) => pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  const userName = user?.name || "Axiom user";
  const userEmail = user?.email || "";

  return (
    <>
      <nav aria-label="Workspace navigation" className={collapsed ? "flex-1 overflow-y-auto px-2 py-5" : "flex-1 overflow-y-auto px-3 py-5"}>
        {navigationGroups.map((group, groupIndex) => (
          <section key={group.label} aria-label={group.label} className={groupIndex === 0 ? "" : "mt-6"}>
            {!collapsed && <p className="mb-2 px-3 font-mono text-[10px] font-semibold uppercase tracking-[0.13em] text-muted">{group.label}</p>}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      onClick={onNavigate}
                      title={collapsed ? item.name : undefined}
                      aria-current={active ? "page" : undefined}
                      className={`group relative flex min-h-10 items-center text-sm font-medium transition-colors ${collapsed ? "justify-center rounded-sm px-2" : "gap-3 px-3"} ${active ? "bg-oxblood-wash text-ink" : "text-muted hover:bg-paper-tint hover:text-ink"}`}
                    >
                      {active && <span aria-hidden className="absolute inset-y-1 left-0 w-[2px] bg-accent" />}
                      <Icon className={`h-4 w-4 shrink-0 ${active ? "text-accent" : "text-muted group-hover:text-ink"}`} aria-hidden />
                      {!collapsed && <span className="min-w-0 truncate">{item.name}</span>}
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </nav>

      <div className={collapsed ? "border-t border-line p-3" : "border-t border-line p-4"}>
        <a href="/settings" className={collapsed ? "flex items-center justify-center rounded-sm p-1 hover:bg-paper-tint" : "flex items-center gap-3 rounded-sm p-1 hover:bg-paper-tint"} title={collapsed ? `${userName}${userEmail ? ` · ${userEmail}` : ""}` : undefined}>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-line-strong bg-paper-raised font-mono text-[10px] font-semibold text-ink">{initials(userName, userEmail)}</span>
          {!collapsed && <span className="min-w-0"><span className="block truncate text-sm font-medium text-ink">{userName}</span><span className="block truncate text-xs text-muted">{userEmail || "Workspace settings"}</span></span>}
        </a>
      </div>
    </>
  );
}

export function Sidebar({ collapsed, onCollapsedChange, mobileOpen, onMobileOpenChange }: SidebarProps) {
  return (
    <>
      <button type="button" onClick={() => onMobileOpenChange(true)} aria-label="Open workspace navigation" aria-expanded={mobileOpen} className="fixed left-4 top-3 z-30 inline-flex h-10 w-10 items-center justify-center rounded-sm border border-line bg-paper-raised text-ink hover:border-line-strong hover:bg-paper-tint md:hidden">
        <Menu className="h-5 w-5" aria-hidden />
      </button>

      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="left" className="flex w-full max-w-none flex-col border-r border-line bg-bg p-0 sm:max-w-sm" aria-describedby="workspace-navigation-description">
          <SheetHeader className="border-b border-line-strong px-5 py-5 text-left">
            <Wordmark />
            <SheetTitle className="sr-only">Workspace navigation</SheetTitle>
            <SheetDescription id="workspace-navigation-description" className="mt-3 text-left text-sm text-muted">Move between your authorization records and workspace controls.</SheetDescription>
          </SheetHeader>
          <NavigationContent collapsed={false} onNavigate={() => onMobileOpenChange(false)} />
        </SheetContent>
      </Sheet>

      <aside aria-label="Desktop workspace navigation" className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-line bg-paper-raised transition-[width] duration-200 [transition-timing-function:var(--ease-out)] md:flex ${collapsed ? "w-20" : "w-64"}`}>
        <div className={collapsed ? "flex h-16 items-center justify-between border-b border-line-strong px-3" : "flex h-16 items-center justify-between border-b border-line-strong px-5"}>
          <Wordmark collapsed={collapsed} />
          <button type="button" onClick={() => onCollapsedChange(!collapsed)} aria-label={collapsed ? "Expand workspace navigation" : "Collapse workspace navigation"} title={collapsed ? "Expand navigation" : "Collapse navigation"} className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-transparent text-muted hover:border-line hover:bg-paper-tint hover:text-ink">
            {collapsed ? <PanelLeftOpen className="h-4 w-4" aria-hidden /> : <PanelLeftClose className="h-4 w-4" aria-hidden />}
          </button>
        </div>
        <NavigationContent collapsed={collapsed} />
      </aside>
    </>
  );
}
