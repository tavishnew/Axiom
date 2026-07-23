"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

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
            className={cn(
                "fixed inset-x-0 top-0 z-50 transition-all duration-300",
                scrolled
                    ? "border-b border-[--border] bg-[--bg]/70 backdrop-blur-xl"
                    : "border-b border-transparent"
            )}
        >
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                <a href="#top" className="group flex items-center gap-2.5">
                    <span className="grid h-7 w-7 place-items-center rounded-md bg-[--accent] text-[--accent-ink] font-serif text-lg leading-none">
                        a
                    </span>
                    <span className="font-serif text-[22px] leading-none tracking-tight">
                        Axiom<span className="text-[--accent]">.</span>
                    </span>
                </a>

                <div className="hidden items-center gap-8 md:flex">
                    {nav.map((n) => (
                        <a
                            key={n.name}
                            href={n.href}
                            className="text-sm text-[--muted] transition-colors hover:text-[--ink]"
                        >
                            {n.name}
                        </a>
                    ))}
                </div>

                <div className="hidden items-center gap-3 md:flex">
                    <a
                        href="/auth/sign-in"
                        className="text-sm text-[--muted] transition-colors hover:text-[--ink]"
                    >
                        Sign in
                    </a>
                    <a
                        href="/auth/sign-up"
                        className="group inline-flex items-center gap-1.5 rounded-full bg-[--accent] px-4 py-2 text-sm font-medium text-[--accent-ink] transition-transform hover:-translate-y-0.5"
                    >
                        Start free
                        <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
                </div>

                <button
                    aria-label="Toggle menu"
                    onClick={() => setOpen((v) => !v)}
                    className="rounded-md p-2 text-[--ink] md:hidden"
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
                        className="overflow-hidden border-t border-[--border] bg-[--bg] md:hidden"
                    >
                        <div className="space-y-1 px-6 py-4">
                            {nav.map((n) => (
                                <a
                                    key={n.name}
                                    href={n.href}
                                    onClick={() => setOpen(false)}
                                    className="block py-2 text-[--muted] hover:text-[--ink]"
                                >
                                    {n.name}
                                </a>
                            ))}
                            <a
                                href="/auth/sign-up"
                                className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-[--accent] px-4 py-2.5 font-medium text-[--accent-ink]"
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
