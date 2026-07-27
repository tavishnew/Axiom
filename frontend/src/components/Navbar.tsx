"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowUpRight, ShieldHalf } from "lucide-react";

const nav = [
  { name: "Product", href: "#product" },
  { name: "Policies", href: "#policies" },
  { name: "Pricing", href: "#pricing" },
  { name: "Docs", href: "#docs" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-border bg-white/80 backdrop-blur-xl shadow-sm"
          : "border-b border-transparent bg-white/60 backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <a href="#top" className="group flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-2 text-white shadow-sm">
            <ShieldHalf className="h-4 w-4" />
          </div>
          <span className="font-tight text-xl font-semibold tracking-tight text-ink">
            Axiom<span className="text-accent">.</span>
          </span>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {nav.map((n) => (
            <a
              key={n.name}
              href={n.href}
              className="text-sm font-medium text-muted transition-colors hover:text-ink"
            >
              {n.name}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <a
            href="/auth/sign-in"
            className="text-sm font-medium text-muted transition-colors hover:text-ink"
          >
            Sign in
          </a>
          <a
            href="/auth/sign-up"
            className="group inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-accent/90 hover:shadow-md hover:-translate-y-0.5"
          >
            Start free
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>

        <button
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className="rounded-md p-2 text-ink md:hidden hover:bg-surface-2"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border bg-white md:hidden"
          >
            <div className="space-y-1 px-6 py-4">
              {nav.map((n) => (
                <a
                  key={n.name}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="block py-2 text-sm font-medium text-muted hover:text-ink"
                >
                  {n.name}
                </a>
              ))}
              <a
                href="/auth/sign-up"
                onClick={() => setOpen(false)}
                className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-accent px-4 py-2.5 font-medium text-white"
              >
                Start free
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
