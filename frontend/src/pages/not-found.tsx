import { motion } from 'framer-motion';
import { ShieldOff, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-bg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mx-4 max-w-md text-center"
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/10 to-accent-2/10">
          <ShieldOff className="h-8 w-8 text-accent" />
        </div>
        <h1 className="mb-2 font-serif text-5xl font-bold text-ink">
          404
        </h1>
        <p className="mb-8 text-sm text-muted">
          This page doesn't exist. Maybe it was firewalled?
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-accent/90 hover:shadow-md"
        >
          <ArrowLeft className="h-4 w-4" />
          Go home
        </a>
      </motion.div>
    </div>
  );
}
