"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleCheck,
  FileSearch,
  Gauge,
  Network,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";

const transition = { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const };

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "right";
};

/**
 * Starts visible, then settles into place when observed. This deliberately
 * avoids an opacity-zero initial state so a slow observer can never recreate
 * the earlier blank-page failure.
 */
function Reveal({ children, className, delay = 0, direction = "up" }: RevealProps) {
  const reduceMotion = useReducedMotion();
  const offset = direction === "right" ? 18 : 14;
  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : direction === "right" ? { opacity: 1, x: offset } : { opacity: 1, y: offset }}
      whileInView={reduceMotion ? undefined : { opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ ...transition, delay }}
    >
      {children}
    </motion.div>
  );
}

function SectionLabel({ number, children }: { number: string; children: React.ReactNode }) {
  return (
    <p className="mb-5 flex items-center gap-3 font-mono text-[11px] font-semibold uppercase tracking-[0.13em] text-muted">
      <span className="h-px w-7 bg-accent" aria-hidden />
      <span>{number}</span>
      <span className="text-ink">{children}</span>
    </p>
  );
}

function EditorialLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="group inline-flex items-center gap-2 text-sm font-semibold text-ink underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-accent hover:text-accent cursor-pointer">
      {children}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
    </a>
  );
}

/** Decorative motion only: the reading content remains visible from first paint. */
function HeroMotionField() {
  const reduceMotion = useReducedMotion();
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 top-0 overflow-hidden">
      <motion.div
        className="absolute left-0 top-[18%] h-px w-[34%] origin-left bg-accent/70"
        initial={reduceMotion ? false : { opacity: 0.45, scaleX: 0.25 }}
        animate={{ opacity: 0.7, scaleX: 1 }}
        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.div
        className="absolute bottom-[16%] right-[7%] h-16 w-16 border border-accent/30"
        initial={reduceMotion ? false : { opacity: 0.55, y: 10, rotate: -3 }}
        animate={{ opacity: 0.85, y: 0, rotate: 0 }}
        transition={{ duration: 0.65, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.div
        className="absolute right-[12%] top-[16%] h-2 w-2 rounded-full bg-accent"
        initial={reduceMotion ? false : { opacity: 0.4, scale: 0.7 }}
        animate={{ opacity: 1, scale: [0.7, 1.25, 1] }}
        transition={{ duration: 0.55, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

function EvaluationArtifact() {
  const [evaluated, setEvaluated] = useState(false);
  const reduceMotion = useReducedMotion();

  return (
    <aside aria-label="Illustrative policy evaluation" className="border-y border-line-strong bg-paper-raised">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          <Terminal className="h-3.5 w-3.5 text-accent" aria-hidden />
          Evaluation record
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted">Illustrative</span>
      </div>
      <div className="p-5">
        <p className="font-serif text-[1.75rem] leading-none tracking-[-0.035em] text-ink">Can Mira export invoice #284?</p>
        <dl className="mt-6 divide-y divide-line border-y border-line text-sm">
          <div className="grid grid-cols-[5.75rem_1fr] gap-3 py-3">
            <dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted">Subject</dt>
            <dd className="text-ink">Mira Chen <span className="font-mono text-xs text-muted">· finance</span></dd>
          </div>
          <div className="grid grid-cols-[5.75rem_1fr] gap-3 py-3">
            <dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted">Resource</dt>
            <dd className="text-ink">Invoice <span className="font-mono text-xs text-muted">· inv_284</span></dd>
          </div>
          <div className="grid grid-cols-[5.75rem_1fr] gap-3 py-3">
            <dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted">Policy</dt>
            <dd className="font-mono text-xs text-ink">invoice.export</dd>
          </div>
        </dl>
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={evaluated ? "allow" : "ready"}
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
            transition={transition}
            className={evaluated ? "mt-5 border-l-2 border-moss bg-moss-wash px-4 py-3" : "mt-5 border-l-2 border-line-strong bg-paper-tint px-4 py-3"}
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              {evaluated ? <CircleCheck className="h-4 w-4 text-moss" aria-hidden /> : <Gauge className="h-4 w-4 text-muted" aria-hidden />}
              {evaluated ? "Allowed" : "Ready to evaluate"}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {evaluated ? "Matched finance export rule; account is within its daily quota." : "Run the labelled sample to inspect the decision evidence."}
            </p>
          </motion.div>
        </AnimatePresence>
        <motion.button
          type="button"
          onClick={() => setEvaluated(true)}
          disabled={evaluated}
          whileHover={evaluated || reduceMotion ? undefined : { y: -2 }}
          whileTap={evaluated || reduceMotion ? undefined : { scale: 0.98 }}
          transition={transition}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-sm border border-ink px-3 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-accent hover:bg-oxblood-wash disabled:cursor-default disabled:border-line disabled:text-muted"
        >
          {evaluated ? <><Check className="h-4 w-4 text-moss" aria-hidden /> Example evaluated</> : <><ChevronRight className="h-4 w-4" aria-hidden /> Run example</>}
        </motion.button>
      </div>
    </aside>
  );
}

function PolicySpecimen() {
  return (
      <motion.div whileHover={{ y: -3 }} transition={transition} className="border border-line bg-paper-raised cursor-pointer">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          <FileSearch className="h-3.5 w-3.5 text-accent" aria-hidden />
          Policy specimen
        </div>
        <span className="font-mono text-[10px] text-muted">policies/invoice.policy</span>
      </div>
      <pre className="overflow-x-auto p-5 font-mono text-[12px] leading-7 text-ink"><code><span className="text-accent">policy</span> "invoice.export" {'{'}{"\n"}  <span className="text-moss">allow</span> if subject.role in ["finance", "admin"]{"\n"}  <span className="text-moss">allow</span> if resource.owner_id == subject.id{"\n"}  <span className="text-accent">limit</span> "exports/day" to 100 per subject{"\n"}{'}'}</code></pre>
      <div className="grid border-t border-line text-xs sm:grid-cols-3">
        <div className="border-b border-line px-5 py-3 sm:border-b-0 sm:border-r"><span className="block font-mono text-[10px] uppercase tracking-[0.1em] text-muted">Intent</span><span className="mt-1 block text-ink">Protect invoice exports</span></div>
        <div className="border-b border-line px-5 py-3 sm:border-b-0 sm:border-r"><span className="block font-mono text-[10px] uppercase tracking-[0.1em] text-muted">Scope</span><span className="mt-1 block text-ink">Finance workspace</span></div>
        <div className="px-5 py-3"><span className="block font-mono text-[10px] uppercase tracking-[0.1em] text-muted">Evidence</span><span className="mt-1 block text-ink">Reason included</span></div>
      </div>
    </motion.div>
  );
}

const systemSteps = [
  { icon: Network, title: "Describe the relationship", body: "Record who is asking, what they are trying to do, and the resource in context." },
  { icon: ShieldCheck, title: "Evaluate one policy layer", body: "Keep roles, conditions, plan entitlements, and quotas legible in the same decision." },
  { icon: FileSearch, title: "Keep the evidence", body: "Capture the outcome, matching policy, reason, actor, target, and time as a reviewable record." },
];

export default function LandingPage() {
  return (
    <main id="top" className="min-h-screen overflow-x-hidden bg-bg text-ink">
      <Navbar />

      <section className="relative mx-auto max-w-[1440px] overflow-hidden border-x border-line px-5 sm:px-8 lg:px-10">
        <HeroMotionField />
        <div className="relative grid gap-8 border-b border-line-strong py-12 lg:min-h-[calc(100svh-4.5rem)] lg:grid-cols-12 lg:items-center lg:gap-10 lg:py-10 xl:gap-12">
          <Reveal className="lg:col-span-7 xl:col-span-7">
            <SectionLabel number="01">Authorization, made legible</SectionLabel>
            <h1 className="max-w-3xl font-serif text-[clamp(3.25rem,5.2vw,5.8rem)] leading-[0.88] tracking-[-0.055em] text-ink">
              Every access decision deserves a reason.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-muted lg:mt-7 sm:text-lg">
              Axiom is the authorization workbench for teams who need access rules to be understandable before they are fast. Write the policy, evaluate the request, and keep the evidence together.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4 lg:mt-8">
              <motion.a
                href="/auth/sign-up"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={transition}
                className="inline-flex items-center gap-2 rounded-sm bg-accent px-4 py-3 text-sm font-semibold text-accent-ink shadow-[0_10px_24px_-16px_rgba(47,96,74,0.58)] hover:bg-accent-2 cursor-pointer"
              >
                Enter the console <ArrowRight className="h-4 w-4" aria-hidden />
              </motion.a>
              <EditorialLink href="#documentation">Read the system</EditorialLink>
            </div>
            <p className="mt-7 max-w-xl border-l-2 border-accent pl-4 text-sm leading-6 text-muted lg:mt-8">
              <span className="font-semibold text-ink">A note on speed:</span> Axiom makes the explanation a first-class result, not an afterthought attached to a pass or fail.
            </p>
          </Reveal>
          <Reveal direction="right" delay={0.1} className="lg:col-span-5 xl:col-start-9 xl:col-span-4">
            <motion.div whileHover={{ y: -3 }} transition={transition}>
              <EvaluationArtifact />
            </motion.div>
          </Reveal>
        </div>
      </section>

      <section id="system" className="mx-auto max-w-[1440px] border-x border-line px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <SectionLabel number="02">Read the system</SectionLabel>
            <h2 className="font-serif text-5xl leading-[0.92] tracking-[-0.045em] sm:text-6xl">One record, from request to evidence.</h2>
          </Reveal>
          <Reveal direction="right" delay={0.06} className="lg:col-span-8 lg:pt-10">
            <div className="divide-y divide-line border-y border-line">
              {systemSteps.map(({ icon: Icon, title, body }, index) => (
                <motion.article
                  key={title}
                  initial={{ opacity: 1, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  whileHover={{ x: 5 }}
                  transition={{ ...transition, delay: index * 0.06 }}
                  className="grid gap-4 py-6 sm:grid-cols-[3rem_1fr_auto] sm:items-start"
                >
                  <span className="flex h-9 w-9 items-center justify-center border border-line text-accent"><Icon className="h-4 w-4" aria-hidden /></span>
                  <div>
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">0{index + 1}</p>
                    <h3 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-ink">{title}</h3>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-muted">{body}</p>
                  </div>
                  <ChevronRight className="mt-2 hidden h-4 w-4 text-muted sm:block" aria-hidden />
                </motion.article>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section id="policy" className="border-y border-line-strong bg-paper-tint">
        <div className="mx-auto max-w-[1440px] border-x border-line px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            <Reveal className="lg:col-span-5">
              <SectionLabel number="03">Policy, without fog</SectionLabel>
              <h2 className="font-serif text-5xl leading-[0.92] tracking-[-0.045em] sm:text-6xl">Write the rule your team can review.</h2>
              <p className="mt-6 max-w-lg text-sm leading-7 text-muted">A policy should make its intent clear to the person approving it and its conditions exact to the system enforcing it. The same record can carry both.</p>
              <ul className="mt-8 space-y-3 border-t border-line pt-6 text-sm text-ink">
                {["Roles and conditions in one decision", "Plain-language intent beside technical detail", "A consequence that can be evaluated before release"].map((item) => (
                  <li key={item} className="flex gap-3"><Check className="mt-0.5 h-4 w-4 shrink-0 text-moss" aria-hidden />{item}</li>
                ))}
              </ul>
            </Reveal>
            <Reveal direction="right" delay={0.08} className="lg:col-span-7 lg:pt-8"><PolicySpecimen /></Reveal>
          </div>
        </div>
      </section>

      <section id="evidence" className="mx-auto max-w-[1440px] border-x border-line px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
          <Reveal className="flex flex-col justify-between gap-6 border-b border-line-strong pb-7 sm:flex-row sm:items-end">
          <div>
            <SectionLabel number="04">Evidence, not theatre</SectionLabel>
            <h2 className="font-serif text-5xl leading-[0.92] tracking-[-0.045em] sm:text-6xl">Make every outcome reviewable.</h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-muted">A clearly labelled sample of the record Axiom keeps for a decision. Production records should always reflect real data.</p>
          </Reveal>
          <div className="mt-8 divide-y divide-line border-y border-line">
          <Reveal className="grid gap-3 py-4 text-sm sm:grid-cols-[8rem_1fr_9rem] sm:items-center">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">Outcome</span>
            <span className="flex items-center gap-2 font-semibold text-ink"><CircleCheck className="h-4 w-4 text-moss" aria-hidden />Allowed — finance export rule</span>
            <span className="font-mono text-xs text-muted">example record</span>
          </Reveal>
          <Reveal delay={0.05} className="grid gap-3 py-4 text-sm sm:grid-cols-[8rem_1fr_9rem] sm:items-center">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">Reason</span>
            <span className="text-ink">Role matched and daily export quota remains available.</span>
            <span className="font-mono text-xs text-muted">policy trace</span>
          </Reveal>
          <Reveal delay={0.1} className="grid gap-3 py-4 text-sm sm:grid-cols-[8rem_1fr_9rem] sm:items-center">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">Review</span>
            <span className="text-ink">Actor, resource, policy, timestamp, and decision stay attributable.</span>
            <span className="font-mono text-xs text-muted">audit-ready</span>
          </Reveal>
          </div>
      </section>

      <section id="documentation" className="border-y border-line-strong bg-oxblood text-paper-raised">
        <Reveal className="mx-auto grid max-w-[1440px] gap-8 border-x border-white/25 px-5 py-14 sm:px-8 lg:grid-cols-12 lg:px-10 lg:py-20">
          <div className="lg:col-span-8">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.13em] text-paper-raised/70">The Axiom Ledger</p>
            <h2 className="mt-5 max-w-4xl font-serif text-5xl leading-[0.92] tracking-[-0.045em] sm:text-6xl">Build access your team can explain tomorrow.</h2>
          </div>
          <div className="flex items-end lg:col-span-4 lg:justify-end">
            <a href="/auth/sign-up" className="inline-flex items-center gap-2 rounded-sm bg-paper-raised px-4 py-3 text-sm font-semibold text-oxblood hover:bg-paper-tint cursor-pointer">
              Start with a policy <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
          </div>
        </Reveal>
      </section>

      <footer className="mx-auto max-w-[1440px] border-x border-line px-5 py-8 sm:px-8 lg:px-10">
        <div className="flex flex-col justify-between gap-4 text-sm sm:flex-row sm:items-center">
          <p className="font-serif text-2xl tracking-[-0.035em] text-ink">Axiom<span className="text-accent">.</span></p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-muted">
            <a href="#system" className="hover:text-ink cursor-pointer">System</a>
            <a href="#policy" className="hover:text-ink cursor-pointer">Policy</a>
            <a href="#evidence" className="hover:text-ink cursor-pointer">Evidence</a>
            <a href="/auth/sign-in" className="hover:text-ink cursor-pointer">Sign in</a>
          </div>
          <p className="font-mono text-[11px] text-muted">Authorization, in the open.</p>
        </div>
      </footer>
    </main>
  );
}
