"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ClipboardList,
  FileClock,
  FlaskConical,
  FolderKanban,
  ShieldCheck,
  Users,
} from "lucide-react";
import { api } from "@/lib/api";

type SummaryItem = { label: string; value: number; note: string };

type RecentDecision = {
  id: string;
  decision: "allow" | "deny" | string;
  entityId: string;
  resourceType: string;
  action: string;
  createdAt: string;
};

const nextMoves = [
  { title: "Register a resource", detail: "Describe the protected surface first.", href: "/resources", icon: FolderKanban },
  { title: "Add an entity", detail: "Record the person or service requesting access.", href: "/entities", icon: Users },
  { title: "Write a policy", detail: "State the relationship and its consequence.", href: "/policies", icon: ShieldCheck },
  { title: "Evaluate a request", detail: "Inspect a decision before relying on it.", href: "/test", icon: FlaskConical },
];

export default function DashboardPage() {
  const reduceMotion = useReducedMotion();
  const motionTransition = { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const };
  const [summary, setSummary] = useState<SummaryItem[]>([
    { label: "Policies", value: 0, note: "Rules in this workspace" },
    { label: "Entities", value: 0, note: "People and services" },
    { label: "Resources", value: 0, note: "Protected surfaces" },
    { label: "Decisions", value: 0, note: "Recorded evaluation history" },
  ]);
  const [recentDecisions, setRecentDecisions] = useState<RecentDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    const loadDashboard = async () => {
      try {
        const [policies, entities, resources, decisions] = await Promise.all([
          api.policies.list({ limit: 1 }),
          api.entities.list({ limit: 1 }),
          api.resources.list({ limit: 1 }),
          api.decisions.list({ limit: 5, sortBy: "createdAt", sortOrder: "desc" }),
        ]);
        if (!current) return;
        setSummary([
          { label: "Policies", value: policies.pagination.total, note: "Rules in this workspace" },
          { label: "Entities", value: entities.pagination.total, note: "People and services" },
          { label: "Resources", value: resources.pagination.total, note: "Protected surfaces" },
          { label: "Decisions", value: decisions.pagination.total, note: "Recorded evaluation history" },
        ]);
        setRecentDecisions(decisions.data as RecentDecision[]);
      } catch (cause) {
        console.error("Failed to load dashboard:", cause);
        if (current) setError("The system overview could not be loaded. Refresh the page to try again.");
      } finally {
        if (current) setLoading(false);
      }
    };
    loadDashboard();
    return () => { current = false; };
  }, []);

  return (
    <motion.div
      className="editorial-page"
      initial={reduceMotion ? false : { opacity: 1, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={motionTransition}
    >
      <header className="editorial-masthead flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="editorial-eyebrow">Overview / Workspace record</p>
          <h1 className="editorial-title">State of the system</h1>
          <p className="editorial-dek">A concise account of the authorization records available in this workspace. Counts reflect the current API response, not a marketing metric.</p>
        </div>
        <motion.button
          type="button"
          onClick={() => { window.location.href = "/test"; }}
          whileHover={reduceMotion ? undefined : { y: -2 }}
          whileTap={reduceMotion ? undefined : { scale: 0.98 }}
          transition={motionTransition}
          className="inline-flex items-center justify-center gap-2 rounded-sm bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink hover:bg-accent-2 cursor-pointer"
        >
          <FlaskConical className="h-4 w-4" aria-hidden /> Evaluate a request
        </motion.button>
      </header>

      {error && (
        <section role="alert" className="mb-8 border-l-2 border-danger bg-danger-wash px-4 py-3 text-sm text-ink">
          <p className="font-semibold">Overview unavailable</p>
          <p className="mt-1 text-muted">{error}</p>
        </section>
      )}

      <section aria-labelledby="system-summary-heading">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="system-summary-heading" className="font-serif text-3xl tracking-[-0.03em] text-ink">System index</h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.11em] text-muted">Live workspace totals</span>
        </div>
        <dl className="grid divide-y divide-line border-y border-line sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          {summary.map((item, index) => (
            <motion.div
              key={item.label}
              initial={reduceMotion ? false : { opacity: 1, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...motionTransition, delay: index * 0.05 }}
              whileHover={reduceMotion ? undefined : { y: -2 }}
              className="px-4 py-5 first:pl-0 sm:first:pl-0 sm:last:pr-0"
            >
              <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">{item.label}</dt>
              <dd className="mt-2 font-serif text-4xl leading-none tracking-[-0.04em] text-ink" aria-live="polite">{loading ? "—" : item.value.toLocaleString()}</dd>
              <p className="mt-2 text-xs leading-5 text-muted">{item.note}</p>
            </motion.div>
          ))}
        </dl>
      </section>

      <div className="mt-10 grid gap-10 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section aria-labelledby="next-move-heading">
          <div className="flex items-end justify-between border-b border-line-strong pb-4">
            <div>
              <p className="editorial-eyebrow">Guided setup</p>
              <h2 id="next-move-heading" className="font-serif text-3xl tracking-[-0.03em] text-ink">What to do next</h2>
            </div>
            <span className="font-mono text-[10px] text-muted">In dependency order</span>
          </div>
          <div className="divide-y divide-line border-b border-line">
            {nextMoves.map(({ title, detail, href, icon: Icon }, index) => (
              <motion.a
                key={href}
                href={href}
                whileHover={reduceMotion ? undefined : { x: 4 }}
                whileTap={reduceMotion ? undefined : { scale: 0.995 }}
                transition={motionTransition}
                className="group grid grid-cols-[2rem_1fr_auto] gap-3 py-4 hover:bg-paper-tint cursor-pointer"
              >
                <span className="flex h-8 w-8 items-center justify-center border border-line text-accent"><Icon className="h-4 w-4" aria-hidden /></span>
                <span><span className="block text-sm font-semibold text-ink">{index + 1}. {title}</span><span className="mt-1 block text-xs leading-5 text-muted">{detail}</span></span>
                <ArrowRight className="mt-2 h-4 w-4 text-muted transition-transform group-hover:translate-x-1 group-hover:text-accent" aria-hidden />
              </motion.a>
            ))}
          </div>
        </section>

        <section aria-labelledby="recent-decisions-heading">
          <div className="flex items-end justify-between border-b border-line-strong pb-4">
            <div>
              <p className="editorial-eyebrow">Evidence</p>
              <h2 id="recent-decisions-heading" className="font-serif text-3xl tracking-[-0.03em] text-ink">Recent decisions</h2>
            </div>
            <a href="/decisions" className="text-sm font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:text-accent hover:decoration-accent cursor-pointer">View all</a>
          </div>
          {loading ? (
            <div className="space-y-3 border-b border-line py-5" aria-label="Loading recent decisions">
              {[1, 2, 3].map((line) => <div key={line} className="h-12 bg-paper-tint" />)}
            </div>
          ) : recentDecisions.length === 0 ? (
            <div className="border-b border-line py-10 text-center">
              <ClipboardList className="mx-auto h-6 w-6 text-muted" aria-hidden />
              <p className="mt-3 font-serif text-2xl text-ink">No evidence yet.</p>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">Evaluate a request after creating a resource, entity, and policy. The resulting record will appear here.</p>
              <a href="/test" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent underline underline-offset-4 cursor-pointer">Evaluate a request <ArrowRight className="h-4 w-4" aria-hidden /></a>
            </div>
          ) : (
            <div className="divide-y divide-line border-b border-line">
              {recentDecisions.map((decision) => {
                const allowed = decision.decision === "allow";
                return (
                  <motion.a
                    key={decision.id}
                    href="/decisions"
                    whileHover={reduceMotion ? undefined : { x: 3 }}
                    transition={motionTransition}
                    className="grid gap-2 py-4 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-4 hover:bg-paper-tint cursor-pointer"
                  >
                    <span className={allowed ? "inline-flex w-fit items-center gap-1.5 border-l-2 border-moss bg-moss-wash px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-moss" : "inline-flex w-fit items-center gap-1.5 border-l-2 border-danger bg-danger-wash px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-danger"}>{allowed ? "Allowed" : "Denied"}</span>
                    <span><span className="block truncate text-sm font-semibold text-ink">{decision.entityId} <span className="text-muted">→</span> {decision.resourceType}</span><span className="mt-1 block font-mono text-[11px] text-muted">{decision.action}</span></span>
                    <span className="font-mono text-[10px] text-muted">{new Date(decision.createdAt).toLocaleString()}</span>
                  </motion.a>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <footer className="mt-10 flex items-center gap-2 border-t border-line pt-4 text-xs text-muted"><FileClock className="h-3.5 w-3.5" aria-hidden /> Counts and evidence update when the page is reloaded.</footer>
    </motion.div>
  );
}
