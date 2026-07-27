"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";
import {
  ArrowUpRight,
  ShieldCheck,
  Layers,
  Gauge,
  KeyRound,
  Sparkles,
  Terminal,
  Check,
  Zap,
  LineChart,
  Lock,
  Activity,
  ArrowRight,
  Network,
  Users,
  Timer,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

/* ------------------------------------------------------------------ */
/*  Motion primitives                                                  */
/* ------------------------------------------------------------------ */

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const dur = 1400;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);
  return <span ref={ref}>{n.toLocaleString()}{suffix}</span>;
}

/* Section heading */
function SectionLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1 text-xs font-mono font-medium text-muted ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 20 });

  return (
    <main id="top" className="relative min-h-screen overflow-x-clip warm-mesh text-ink">
      {/* Scroll progress bar */}
      <motion.div
        style={{ scaleX: progress }}
        className="fixed left-0 right-0 top-0 z-[60] h-[2px] origin-left bg-gradient-to-r from-accent to-accent-2"
      />

      <Navbar />
      <Hero />
      <LogoMarquee />
      <Product />
      <PolicyPlayground />
      <Stats />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero                                                               */
/* ------------------------------------------------------------------ */

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  return (
    <section ref={ref} className="grain relative isolate overflow-hidden pt-28 pb-24 md:pt-36 md:pb-32">
      {/* Expanded background effects - warm gradient mesh */}
      <div className="pointer-events-none absolute inset-0 warm-mesh" />
      <div className="pointer-events-none absolute inset-0 grid-pattern opacity-[0.06]" />
      <div aria-hidden className="hero-glow-1 pointer-events-none absolute -left-32 -top-32 h-[700px] w-[700px] rounded-full blur-3xl" />
      <div aria-hidden className="hero-glow-2 pointer-events-none absolute -right-32 -top-16 h-[500px] w-[500px] rounded-full blur-3xl" />
      <div aria-hidden className="hero-glow-3 pointer-events-none absolute bottom-0 left-1/3 h-[400px] w-[400px] -translate-x-1/2 rounded-full blur-3xl" />

      {/* Animated gradient orbs */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="orb h-64 w-64 bg-accent/5 left-[10%] top-[15%]"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="orb h-48 w-48 bg-accent-2/4 right-[15%] top-[25%]"
      />
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        className="orb h-72 w-72 bg-accent-3/3 left-1/2 top-[40%] -translate-x-1/2"
      />

      {/* Right-side metrics card — anchors the layout */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute right-[3%] top-[12%] z-20 hidden w-[310px] rounded-2xl border border-border bg-white shadow-xl ring-1 ring-black/[0.02] md:block"
      >
        {/* Amber accent bar */}
        <div className="absolute -top-px left-6 right-6 h-[2px] rounded-full bg-gradient-to-r from-accent to-accent-2" />
        <div className="p-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">p99 latency</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100">
              <Zap className="h-3 w-3 text-emerald-600" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="font-mono text-[30px] font-bold leading-none tracking-tight text-ink">4.2</span>
            <span className="font-mono text-sm font-medium text-muted">ms</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-[12px] font-medium text-emerald-700">99.9th percentile</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
            <div>
              <div className="font-mono text-sm font-bold text-ink">12.8M</div>
              <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">decisions/day</div>
            </div>
            <div>
              <div className="font-mono text-sm font-bold text-ink">99.99%</div>
              <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">uptime</div>
            </div>
          </div>
        </div>
        {/* Live indicator */}
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50/80 px-3 py-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[11px] font-medium text-emerald-700">Currently processing</span>
          <span className="ml-auto font-mono text-[11px] font-medium text-emerald-600">2.4k req/s</span>
        </div>
      </motion.div>

      {/* Top-right floating decorative element */}
      <motion.div
        animate={{ y: [-8, 8, -8] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute right-[28%] top-[8%] z-10 hidden h-11 w-11 rounded-xl border border-accent/20 bg-accent/10 backdrop-blur-sm md:block"
      >
        <div className="flex h-full items-center justify-center">
          <ShieldCheck className="h-5 w-5 text-accent/60" />
        </div>
      </motion.div>

      <motion.div style={{ y, opacity }} className="relative mx-auto max-w-7xl px-6">
        <Reveal>
          <div className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-white shadow-sm">
            <span className="flex h-1.5 w-1.5 rounded-full bg-white/70" />
            v2.0 &middot; General Availability
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <h1 className="mt-8 max-w-4xl font-serif text-5xl leading-[0.95] tracking-tight md:text-[88px]">
            Authorization
            <br />
            <span className="text-muted/80">built&nbsp;for</span>
            <span className="bg-gradient-to-r from-accent via-amber-500 to-accent-2 bg-clip-text text-transparent">
              scale
            </span>
            <span className="text-accent">.</span>
          </h1>
        </Reveal>

        <Reveal delay={0.16}>
          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-muted">
            One policy layer for RBAC, ABAC, plan entitlements, and usage quotas.
            Ship access rules your team can actually reason about — with
            sub-millisecond decisions at any scale.
          </p>
        </Reveal>

        <Reveal delay={0.24}>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <a
              href="/auth/sign-up"
              className="group inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-accent/90 hover:shadow-md hover:-translate-y-0.5"
            >
              Start building free
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
            <a
              href="#docs"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-white/60 px-5 py-2.5 text-sm font-medium text-ink shadow-sm transition-all hover:border-ink/30 hover:bg-white"
            >
              Read the docs
              <Terminal className="h-4 w-4" />
            </a>
          </div>
        </Reveal>

        {/* Terminal card — more breathing room */}
        <Reveal delay={0.32}>
          <TerminalCard className="mt-16" />
        </Reveal>
      </motion.div>
    </section>
  );
}

function TerminalCard({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-border bg-white shadow-lg ${className}`}>
      <div className="flex items-center justify-between border-b border-border bg-surface-2 px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#d1d5db]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#d1d5db]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#d1d5db]" />
        </div>
        <div className="font-mono text-[11px] uppercase tracking-widest text-muted">
          axiom &middot; policy.ts
        </div>
        <div className="flex items-center gap-1 font-mono text-[11px] text-emerald-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          connected
        </div>
      </div>
      <pre className="overflow-x-auto p-6 font-mono text-[13px] leading-relaxed">
        <code>
          <span className="text-muted">{"//"} Compose one policy. Enforce it everywhere.</span>
          {"\n"}
          <span className="text-[#dc2626]">import</span>{" "}
          <span className="text-ink">{"{ Axiom }"}</span>{" "}
          <span className="text-[#dc2626]">from</span>{" "}
          <span className="text-accent">"@axiom/sdk"</span>
          {"\n\n"}
          <span className="text-[#dc2626]">const</span>{" "}
          <span className="text-ink">axiom</span>{" "}
          <span className="text-muted">=</span>{" "}
          <span className="text-[#dc2626]">new</span>{" "}
          <span className="text-ink">Axiom</span>({"{"}
          {"\n  "}
          <span className="text-ink">apiKey</span>:{" "}
          <span className="text-accent">"ax_live_..."</span>,
          {"\n"}{"}"})
          {"\n\n"}
          <span className="text-[#dc2626]">const</span>{" "}
          <span className="text-ink">decision</span>{" "}
          <span className="text-muted">=</span>{" "}
          <span className="text-[#dc2626]">await</span>{" "}
          <span className="text-ink">forge.can</span>({"{"}
          {"\n  "}
          <span className="text-ink">subject</span>:{" "}
          <span className="text-accent">"user_42"</span>,
          {"\n  "}
          <span className="text-ink">action</span>:{" "}
          <span className="text-accent">"invoice.export"</span>,
          {"\n  "}
          <span className="text-ink">resource</span>:{" "}
          <span className="text-ink">{"{ type: "}</span>
          <span className="text-accent">"invoice"</span>
          <span className="text-ink">{" }"}</span>,
          {"\n"}{"})"}
          {"\n\n"}
          <span className="text-muted">
            {"//"} {"→"} {"{ allow: true, latency: 0.42ms, reason: "}role:admin + quota_ok{" }"}
          </span>
          <span className="caret-blink ml-0.5 inline-block h-[1.1em] w-[7px] translate-y-[2px] bg-accent" />
        </code>
      </pre>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Logo Marquee                                                       */
/* ------------------------------------------------------------------ */

function LogoMarquee() {
  const logos = [
    "Northwind", "Lumen", "Payload", "Cinder", "Halcyon",
    "Meridian", "Kestrel", "Obsidian", "Foundry", "Parallax",
  ];
  return (
    <section className="border-y border-border bg-white/50 py-10">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <div className="mb-6 text-center font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
            Trusted by engineering teams shipping to millions
          </div>
        </Reveal>
        <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_15%,black_85%,transparent)]">
          <div className="flex w-max animate-marquee gap-16 pr-16">
            {[...logos, ...logos].map((l, i) => (
              <span key={i} className="font-serif text-2xl italic text-muted/60 whitespace-nowrap">
                {l}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Product / Bento                                                    */
/* ------------------------------------------------------------------ */

function Product() {
  return (
    <section id="product" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-end justify-between gap-8 flex-wrap">
          <Reveal>
            <div>
              <SectionLabel>01 — Product</SectionLabel>
              <h2 className="mt-3 max-w-2xl font-serif text-4xl leading-[1.02] tracking-tight md:text-5xl">
                One primitive.
                <br />
                <span className="bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-transparent">
                  Every
                </span>{" "}
                access question.
              </h2>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="max-w-sm text-sm leading-relaxed text-muted">
              Stop juggling four systems for permissions, features, and quotas.
              Model them once as policies; Axiom enforces them at the edge.
            </p>
          </Reveal>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-6 md:grid-rows-2">
          <BentoCard
            className="md:col-span-4"
            icon={ShieldCheck}
            title="Roles that respect your hierarchy"
            body="Model orgs, teams, workspaces, and delegates. Inherit permissions cleanly without a policy engine PhD."
            featured
          />
          <BentoCard
            className="md:col-span-2"
            icon={Layers}
            title="ABAC without regrets"
            body="Contextual rules on subject, resource, and environment — with typed attributes and a real testing harness."
          />
          <BentoCard
            className="md:col-span-2"
            icon={KeyRound}
            title="Entitlements tied to plans"
            body="Feature flags that follow the subscription — no drift between billing and app state."
          />
          <BentoCard
            className="md:col-span-2"
            icon={Gauge}
            title="Usage limits & quotas"
            body="Meter, throttle, and enforce. Real-time counters with soft/hard limit hooks."
          />
          <BentoCard
            className="md:col-span-2"
            icon={Activity}
            title="Every decision, auditable"
            body="Structured logs, replay, and blame — from a single console."
          />
        </div>
      </div>
    </section>
  );
}

function BentoCard({
  icon: Icon,
  title,
  body,
  className = "",
  featured = false,
}: {
  icon: typeof ShieldCheck;
  title: string;
  body: string;
  className?: string;
  featured?: boolean;
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      whileHover={{ y: -3 }}
      className={`group relative overflow-hidden rounded-2xl border border-border bg-white p-7 shadow-sm transition-all hover:shadow-md hover:border-accent/30 ${className}`}
    >
      {featured && (
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gradient-to-br from-accent/8 to-accent-2/8 blur-3xl" />
      )}
      <div className="relative flex h-full flex-col">
        <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-white text-accent shadow-sm">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="font-serif text-xl leading-tight tracking-tight md:text-2xl">
          {title}
        </h3>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
          {body}
        </p>
        <div className="mt-auto pt-6">
          <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-muted transition-colors group-hover:text-accent">
            Learn more <ArrowUpRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Policy Playground                                                  */
/* ------------------------------------------------------------------ */

function PolicyPlayground() {
  return (
    <section id="policies" className="relative border-y border-border bg-white/30 py-24 md:py-32">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Reveal>
            <SectionLabel>02 — Policies</SectionLabel>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-3 font-serif text-4xl leading-[1.02] tracking-tight md:text-5xl">
              Write policy the way
              <br />
              you{" "}
              <span className="bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-transparent">
                think
              </span>
              .
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-muted">
              A declarative policy language that reads like English and
              compiles to a decision graph. Preview effects instantly. Test
              them like code.
            </p>
          </Reveal>
          <ul className="mt-6 space-y-3">
            {[
              "Typed subjects, resources, and attributes",
              "Simulation & diff against production traffic",
              "Version-controlled — every change reviewable",
              "Native SDKs for TS, Go, Python, Rust",
            ].map((t, i) => (
              <Reveal key={t} delay={0.15 + i * 0.05}>
                <li className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-accent text-white shadow-sm">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <span>{t}</span>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-7">
          <Reveal delay={0.1}>
            <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-lg">
              <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                <div className="font-mono text-[11px] uppercase tracking-widest text-muted">
                  policies/invoice.af
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-600">
                  <Zap className="h-3 w-3" /> 12 tests &middot; passing
                </div>
              </div>
              <pre className="overflow-x-auto p-6 font-mono text-[13px] leading-relaxed">
                <code>
                  <span className="text-[#dc2626]">policy</span>{" "}
                  <span className="text-accent">"invoice.export"</span> {"{"}
                  {"\n  "}
                  <span className="text-[#dc2626]">allow</span> if
                  subject.role in [<span className="text-accent">"admin"</span>,{" "}
                  <span className="text-accent">"finance"</span>]
                  {"\n"}
                  {"\n  "}
                  <span className="text-[#dc2626]">allow</span> if
                  {"\n    "}
                  resource.owner_id == subject.id
                  {"\n    "}
                  <span className="text-muted">and</span> subject.plan
                  in [<span className="text-accent">"growth"</span>,{" "}
                  <span className="text-accent">"scale"</span>]
                  {"\n"}
                  {"\n  "}
                  <span className="text-[#dc2626]">deny</span> if
                  subject.trial_expired
                  {"\n  "}
                  <span className="text-[#dc2626]">limit</span>{" "}
                  <span className="text-accent">"exports/day"</span>{" "}
                  to <span className="text-ink">100</span> per subject
                  {"\n"}
                  {"}"}
                </code>
              </pre>
              <div className="grid grid-cols-3 divide-x divide-border border-t border-border text-center font-mono text-[11px]">
                <div className="px-3 py-3">
                  <div className="text-muted">DECISIONS/S</div>
                  <div className="mt-1 font-semibold text-ink">42,180</div>
                </div>
                <div className="px-3 py-3">
                  <div className="text-muted">P99 LATENCY</div>
                  <div className="mt-1 font-semibold text-emerald-600">0.9 ms</div>
                </div>
                <div className="px-3 py-3">
                  <div className="text-muted">CACHE HIT</div>
                  <div className="mt-1 font-semibold text-ink">98.7%</div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Stats                                                              */
/* ------------------------------------------------------------------ */

function Stats() {
  const items = [
    { v: 4_200_000_000, label: "Decisions / month", display: "4.2B", suffix: "+" },
    { v: 99, label: "P99 latency", display: "0.9", suffix: " ms" },
    { v: 340, label: "Teams shipping", display: "340", suffix: "+" },
    { v: 999, label: "Uptime", display: "99.9", suffix: "%" },
  ];
  return (
    <section className="relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <SectionLabel>03 — At scale</SectionLabel>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="mt-3 max-w-3xl font-serif text-4xl leading-[1.02] tracking-tight md:text-6xl">
            The math is
            <br />
            <span className="bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-transparent">
              boringly
            </span>{" "}
            good.
          </h2>
        </Reveal>
        <div className="mt-12 grid grid-cols-2 gap-y-12 md:grid-cols-4">
          {items.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08}>
              <div>
                <div className="font-serif text-4xl tracking-tight md:text-5xl">
                  {s.display}
                  <span className="text-accent">{s.suffix}</span>
                </div>
                <div className="mt-2 max-w-[160px] text-sm text-muted">{s.label}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Pricing                                                            */
/* ------------------------------------------------------------------ */

function Pricing() {
  const tiers = [
    {
      name: "Hobby",
      price: "Free",
      tag: "Weekend projects",
      features: [
        "10K decisions / mo",
        "Community SDKs",
        "1 project",
        "Community support",
      ],
      cta: "Start free",
      icon: Sparkles,
    },
    {
      name: "Growth",
      price: "$49",
      tag: "For shipping teams",
      features: [
        "5M decisions / mo",
        "Unlimited policies",
        "Audit log · 30d",
        "Slack support",
      ],
      cta: "Start 14-day trial",
      featured: true,
      icon: Zap,
    },
    {
      name: "Scale",
      price: "Custom",
      tag: "Regulated & enterprise",
      features: [
        "Dedicated region",
        "SOC 2 · ISO 27001",
        "SSO / SCIM",
        "24/7 on-call",
      ],
      cta: "Talk to sales",
      icon: ShieldCheck,
    },
  ];

  return (
    <section id="pricing" className="relative border-t border-border py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <SectionLabel>04 — Pricing</SectionLabel>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="mt-3 font-serif text-4xl leading-[1.02] tracking-tight md:text-5xl">
            Priced like{" "}
            <span className="bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-transparent">
              infra
            </span>
            . Not seats.
          </h2>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
          {tiers.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.08}>
              <motion.div
                whileHover={{ y: -3 }}
                className={`relative flex h-full flex-col rounded-2xl border p-7 shadow-sm transition-all ${
                  t.featured
                    ? "border-accent/40 bg-white shadow-md"
                    : "border-border bg-white hover:border-accent/20 hover:shadow-md"
                }`}
              >
                {t.featured && (
                  <div className="absolute -top-3 left-6 rounded-full bg-gradient-to-r from-accent to-accent-2 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-white shadow-sm">
                    Most teams
                  </div>
                )}
                <div className="flex items-baseline justify-between">
                  <h3 className="font-serif text-2xl">{t.name}</h3>
                  <t.icon className={`h-4 w-4 ${t.featured ? "text-accent" : "text-muted"}`} />
                </div>
                <div className="mt-1 text-xs text-muted">{t.tag}</div>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="font-serif text-5xl tracking-tight">{t.price}</span>
                  {t.price.startsWith("$") && <span className="text-sm text-muted">/mo</span>}
                </div>
                <ul className="mt-6 space-y-3">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted">
                      <Check className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-6">
                  <a
                    href="/auth/sign-up"
                    className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all ${
                      t.featured
                        ? "bg-accent text-white shadow-sm hover:bg-accent/90 hover:shadow-md"
                        : "border border-border bg-white text-ink hover:border-accent/30 hover:shadow-sm"
                    }`}
                  >
                    {t.cta}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  CTA                                                                */
/* ------------------------------------------------------------------ */

function CTA() {
  return (
    <section className="relative border-t border-border bg-white/50 py-24 md:py-32">
      <div aria-hidden className="pointer-events-none hero-glow-large absolute inset-x-0 top-1/2 -z-10 h-[400px] -translate-y-1/2 blur-3xl" />
      <div className="mx-auto max-w-4xl px-6 text-center">
        <Reveal>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/10 to-accent-2/10">
            <ShieldCheck className="h-7 w-7 text-accent" />
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <h2 className="mt-6 font-serif text-4xl leading-[1.05] tracking-tight md:text-6xl">
            Ready to ship access
            <br />
            <span className="bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-transparent">
              your team trusts
            </span>
            ?
          </h2>
        </Reveal>
        <Reveal delay={0.16}>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-muted">
            Start free, no credit card required. Get your first policy live
            in 10 minutes.
          </p>
        </Reveal>
        <Reveal delay={0.24}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="/auth/sign-up"
              className="group inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-accent/90 hover:shadow-md hover:-translate-y-0.5"
            >
              Start building free
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
            <a
              href="#docs"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-6 py-3 text-sm font-medium text-ink shadow-sm transition-all hover:border-ink/30 hover:shadow-md"
            >
              Talk to sales
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
