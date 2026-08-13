import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { motion, useReducedMotion } from 'framer-motion';

const SIDEBAR_STORAGE_KEY = 'axiom.sidebar.collapsed';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true');
  }, []);

  const handleCollapsedChange = (nextCollapsed: boolean) => {
    setCollapsed(nextCollapsed);
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(nextCollapsed));
  };

  return (
    <div className="min-h-screen bg-bg warm-mesh">
      <Sidebar
        collapsed={collapsed}
        onCollapsedChange={handleCollapsedChange}
        mobileOpen={mobileOpen}
        onMobileOpenChange={setMobileOpen}
      />
      <main className={`min-h-screen transition-[margin] duration-300 [transition-timing-function:var(--ease-out)] ${collapsed ? 'md:ml-20' : 'md:ml-64'} pt-16 md:pt-0`}>
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.23, 1, 0.32, 1] }}
          className="min-h-screen"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}

export function withDashboard<P extends object>(Component: React.ComponentType<P>) {
  return function Wrapped(props: P) {
    return (
      <DashboardLayout>
        <Component {...props} />
      </DashboardLayout>
    );
  };
}
