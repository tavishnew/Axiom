import { Sidebar } from "@/components/sidebar";
import { motion } from "framer-motion";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <main className="ml-64 flex-1">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
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
