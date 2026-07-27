"use client";

import { motion } from "framer-motion";
import { ShieldHalf, ArrowUpRight, Twitter, Github, Mail } from "lucide-react";

const columns = {
  Product: ["Overview", "Policies", "SDKs", "Changelog"],
  Company: ["About", "Careers", "Customers", "Press"],
  Resources: ["Documentation", "API Reference", "Status", "Security"],
  Legal: ["Privacy", "Terms", "DPA", "Cookies"],
};

const socialLinks = [
  { icon: Twitter, href: "#" },
  { icon: Github, href: "#" },
  { icon: Mail, href: "#" },
];

export function Footer() {
  return (
    <footer className="relative border-t border-border bg-white">
      <div className="mx-auto max-w-7xl px-6 pt-20 pb-10">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="font-serif text-5xl leading-[0.95] tracking-tight md:text-7xl"
            >
              Ship the right
              <br />
              <span className="bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-transparent">
                access
              </span>
              . Every time.
            </motion.h2>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-muted">
              Axiom is the authorization runtime engineers reach for
              when correctness matters. Sub-millisecond decisions at any
              scale.
            </p>
            <div className="mt-8 flex items-center gap-3">
              {socialLinks.map(({ icon: Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted transition-all hover:border-accent hover:text-accent hover:bg-accent/5"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 lg:col-span-7 lg:grid-cols-4">
            {Object.entries(columns).map(([title, items]) => (
              <div key={title}>
                <div className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-muted">
                  {title}
                </div>
                <ul className="space-y-2.5">
                  {items.map((it) => (
                    <li key={it}>
                      <a
                        href="#"
                        className="group inline-flex items-center gap-1 text-sm text-ink transition-colors hover:text-accent"
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

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 md:flex-row md:items-center">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-accent to-accent-2 text-white shadow-sm">
              <ShieldHalf className="h-3.5 w-3.5" />
            </div>
            <span className="font-mono text-xs text-muted">
              &copy; {new Date().getFullYear()} Axiom Labs &middot; v2.0
            </span>
          </div>
          <div className="font-mono text-xs text-muted">
            SOC 2 Type II &middot; ISO 27001 &middot; GDPR
          </div>
        </div>
      </div>
    </footer>
  );
}
