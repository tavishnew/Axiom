"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Github, Twitter, Mail } from "lucide-react";

const columns = {
    Product: ["Overview", "Policies", "SDKs", "Changelog"],
    Company: ["About", "Careers", "Customers", "Press"],
    Resources: ["Documentation", "API Reference", "Status", "Security"],
    Legal: ["Privacy", "Terms", "DPA", "Cookies"],
};

export function Footer() {
    return (
        <footer className="relative border-t border-[--border] bg-[--bg]">
            <div className="mx-auto max-w-7xl px-6 pt-20 pb-10">
                <div className="grid gap-12 lg:grid-cols-12">
                    <div className="lg:col-span-5">
                        <motion.h2
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-80px" }}
                            transition={{ duration: 0.8 }}
                            className="font-serif text-6xl leading-[0.95] tracking-tight md:text-8xl"
                        >
                            Ship the right
                            <br />
                            <em className="text-[--accent]">access</em>. Every time.
                        </motion.h2>
                        <p className="mt-6 max-w-md text-[--muted]">
                            Axiom is the authorization runtime engineers reach for when correctness matters.
                        </p>
                        <div className="mt-8 flex items-center gap-3">
                            {[Github, Twitter, Mail].map((Icon, i) => (
                                <a
                                    key={i}
                                    href="#"
                                    className="grid h-10 w-10 place-items-center rounded-full border border-[--border] text-[--muted] transition-colors hover:border-[--accent] hover:text-[--accent]"
                                >
                                    <Icon className="h-4 w-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 lg:col-span-7 lg:grid-cols-4">
                        {Object.entries(columns).map(([title, items]) => (
                            <div key={title}>
                                <div className="mb-4 text-xs uppercase tracking-[0.18em] text-[--muted]">
                                    {title}
                                </div>
                                <ul className="space-y-2.5">
                                    {items.map((it) => (
                                        <li key={it}>
                                            <a
                                                href="#"
                                                className="group inline-flex items-center gap-1 text-sm text-[--ink] transition-colors hover:text-[--accent]"
                                            >
                                                {it}
                                                <ArrowUpRight className="h-3 w-3 opacity-0 transition-all group-hover:opacity-100" />
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-20 flex flex-col items-start justify-between gap-4 border-t border-[--border] pt-6 md:flex-row md:items-center">
                    <div className="flex items-center gap-2">
                        <span className="grid h-6 w-6 place-items-center rounded-md bg-[--accent] font-serif text-sm text-[--accent-ink]">
                            a
                        </span>
                        <span className="font-mono text-xs text-[--muted]">
                            © {new Date().getFullYear()} Axiom Labs · v1.0
                        </span>
                    </div>
                    <div className="font-mono text-xs text-[--muted]">
                        SOC 2 Type II · ISO 27001 · GDPR
                    </div>
                </div>
            </div>
        </footer>
    );
}
