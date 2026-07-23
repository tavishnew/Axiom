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
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

/* ------------------------------------------------------------------ */
/*  Reusable motion primitives                                         */
/* ------------------------------------------------------------------ */

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

function Reveal({
    children,
    delay = 0,
    className,
}: {
    children: React.ReactNode;
    delay?: number;
    className?: string;
}) {
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

/* Animated counter used in Stats */
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
    return (
        <span ref={ref}>
            {n.toLocaleString()}
            {suffix}
        </span>
    );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
    const { scrollYProgress } = useScroll();
    const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 20 });

    return (
        <main id="top" className="relative min-h-screen overflow-x-clip bg-[--bg] text-[--ink]">
            {/* Scroll progress bar */}
            <motion.div
                style={{ scaleX: progress }}
                className="fixed left-0 right-0 top-0 z-[60] h-[2px] origin-left bg-[--accent]"
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
/*  Hero                                                                */
/* ------------------------------------------------------------------ */

function Hero() {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
    const y = useTransform(scrollYProgress, [0, 1], [0, 160]);
    const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

    return (
        <section ref={ref} className="grain relative isolate pt-32 pb-24 md:pt-40 md:pb-32">
            <div className="pointer-events-none absolute inset-0 grid-lines opacity-60" />
            <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-[520px] w-[520px] -translate-x-1/2 rounded-full blur-3xl"
                style={{
                    background:
                        "radial-gradient(circle, rgba(198,242,78,0.18), rgba(198,242,78,0) 60%)",
                }}
            />

            <motion.div style={{ y, opacity }} className="relative mx-auto max-w-7xl px-6">
                <Reveal>
                    <div className="inline-flex items-center gap-2 rounded-full border border-[--border] bg-[--surface]/60 px-3 py-1.5 text-xs text-[--muted] backdrop-blur">
                        <span className="h-1.5 w-1.5 rounded-full bg-[--accent]" />
                        <span className="font-mono uppercase tracking-[0.14em]">
                            v1.0 · General Availability
                        </span>
                    </div>
                </Reveal>

                <Reveal delay={0.08}>
                    <h1 className="mt-8 max-w-5xl font-serif text-[56px] leading-[0.95] tracking-tight md:text-[104px]">
                        Authorization,
                        <br />
                        <span className="text-[--muted]">axiomatic</span>
                        <span className="text-[--accent]">.</span>
                    </h1>
                </Reveal>

                <Reveal delay={0.16}>
                    <p className="mt-8 max-w-xl text-lg leading-relaxed text-[--muted]">
                        One policy layer for RBAC, ABAC, plan entitlements, and usage quotas.
                        Ship access rules your team can actually reason about — with
                        sub-millisecond decisions at any scale.
                    </p>
                </Reveal>

                <Reveal delay={0.24}>
                    <div className="mt-10 flex flex-wrap items-center gap-3">
                        <a
                            href="/auth/sign-up"
                            className="group inline-flex items-center gap-2 rounded-full bg-[--accent] px-5 py-3 text-sm font-medium text-[--accent-ink] transition-all hover:-translate-y-0.5 hover:glow-lime"
                        >
                            Start building free
                            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </a>
                        <a
                            href="#docs"
                            className="inline-flex items-center gap-2 rounded-full border border-[--border] bg-[--surface]/40 px-5 py-3 text-sm text-[--ink] backdrop-blur transition-colors hover:border-[--ink]/40"
                        >
                            <Terminal className="h-4 w-4" /> Read the docs
                        </a>
                    </div>
                </Reveal>

                {/* Terminal card */}
                <Reveal delay={0.32}>
                    <TerminalCard className="mt-16" />
                </Reveal>
            </motion.div>
        </section>
    );
}

function TerminalCard({ className = "" }: { className?: string }) {
    return (
        <div
            className={`relative overflow-hidden rounded-2xl border border-[--border] bg-[--surface] shadow-2xl ${className}`}
        >
            <div className="flex items-center justify-between border-b border-[--border] bg-[--surface-2] px-4 py-2.5">
                <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#3a3f4c]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#3a3f4c]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#3a3f4c]" />
                </div>
                <div className="font-mono text-[11px] uppercase tracking-widest text-[--muted]">
                    axiom · policy.ts
                </div>
                <div className="font-mono text-[11px] text-[--accent]">● connected</div>
            </div>
            <pre className="overflow-x-auto p-6 font-mono text-[13.5px] leading-relaxed">
                <code>
                    <span className="text-[--muted]">// Compose one policy. Enforce it everywhere.</span>
                    {"\n"}
                    <span className="text-[--ember]">import</span>{" "}
                    <span className="text-[--ink]">{"{ axiom }"}</span>{" "}
                    <span className="text-[--ember]">from</span>{" "}
                    <span className="text-[--accent]">'@axiom/sdk'</span>
                    {"\n\n"}
                    <span className="text-[--ember]">const</span>{" "}
                    <span className="text-[--ink]">decision</span>{" "}
                    <span className="text-[--muted]">=</span>{" "}
                    <span className="text-[--ember]">await</span>{" "}
                    <span className="text-[--ink]">axiom.check</span>({"{"}
                    {"\n  "}
                    <span className="text-[--ink]">subject</span>:{" "}
                    <span className="text-[--accent]">'user_42'</span>,
                    {"\n  "}
                    <span className="text-[--ink]">action</span>:{" "}
                    <span className="text-[--accent]">'invoice.export'</span>,
                    {"\n  "}
                    <span className="text-[--ink]">resource</span>:{" "}
                    <span className="text-[--ink]">{"{ type: "}</span>
                    <span className="text-[--accent]">'invoice'</span>
                    <span className="text-[--ink]">, id: </span>
                    <span className="text-[--accent]">'inv_9021'</span>
                    <span className="text-[--ink]">{" }"}</span>,
                    {"\n  "}
                    <span className="text-[--ink]">context</span>:{" "}
                    <span className="text-[--ink]">{"{ plan: "}</span>
                    <span className="text-[--accent]">'growth'</span>
                    <span className="text-[--ink]">{" }"}</span>,
                    {"\n"}
                    {"})"}
                    {"\n\n"}
                    <span className="text-[--muted]">
                        {"// → { allow: true, latency: 0.42ms, reason: 'role:admin + quota_ok' }"}
                    </span>
                    <span className="caret ml-0.5 inline-block h-[1em] w-[7px] translate-y-0.5 bg-[--accent] align-middle" />
                </code>
            </pre>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Logo Marquee                                                        */
/* ------------------------------------------------------------------ */

function LogoMarquee() {
    const logos = [
        "Northwind", "Lumen", "Payload", "Cinder", "Halcyon",
        "Meridian", "Kestrel", "Obsidian", "Foundry", "Parallax",
    ];
    return (
        <section className="border-y border-[--border] bg-[--surface]/40 py-10">
            <div className="mx-auto max-w-7xl px-6">
                <div className="mb-6 text-center font-mono text-[11px] uppercase tracking-[0.24em] text-[--muted]">
                    Trusted by engineering teams shipping to millions
                </div>
                <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_15%,black_85%,transparent)]">
                    <div className="flex w-max animate-marquee gap-16 pr-16">
                        {[...logos, ...logos].map((l, i) => (
                            <span
                                key={i}
                                className="font-serif text-2xl italic text-[--muted]/80 whitespace-nowrap"
                            >
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
/*  Product / Bento                                                     */
/* ------------------------------------------------------------------ */

function Product() {
    return (
        <section id="product" className="relative py-32">
            <div className="mx-auto max-w-7xl px-6">
                <div className="flex items-end justify-between gap-8 flex-wrap">
                    <Reveal>
                        <div>
                            <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-[--muted]">
                                01 — Product
                            </div>
                            <h2 className="mt-3 max-w-2xl font-serif text-5xl leading-[1.02] tracking-tight md:text-6xl">
                                One primitive.
                                <br />
                                <em className="text-[--accent]">Every</em> access question.
                            </h2>
                        </div>
                    </Reveal>
                    <Reveal delay={0.1}>
                        <p className="max-w-sm text-[--muted]">
                            Stop juggling four systems for permissions, features, and quotas.
                            Model them once as policies; Axiom enforces them at the edge.
                        </p>
                    </Reveal>
                </div>

                <div className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-6 md:grid-rows-2">
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
                        icon={LineChart}
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
            whileHover={{ y: -4 }}
            className={`group relative overflow-hidden rounded-2xl border border-[--border] bg-[--surface] p-7 transition-colors hover:border-[--ink]/30 ${className}`}
        >
            {featured && (
                <div
                    aria-hidden
                    className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-40 blur-3xl"
                    style={{
                        background:
                            "radial-gradient(circle, rgba(198,242,78,0.35), transparent 60%)",
                    }}
                />
            )}
            <div className="relative flex h-full flex-col">
                <div className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[--border] bg-[--surface-2] text-[--accent]">
                    <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-serif text-2xl leading-tight tracking-tight md:text-3xl">
                    {title}
                </h3>
                <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[--muted]">
                    {body}
                </p>
                <div className="mt-auto pt-8">
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.18em] text-[--muted] transition-colors group-hover:text-[--accent]">
                        Learn more <ArrowUpRight className="h-3 w-3" />
                    </span>
                </div>
            </div>
        </motion.div>
    );
}

/* ------------------------------------------------------------------ */
/*  Policy Playground (split section)                                   */
/* ------------------------------------------------------------------ */

function PolicyPlayground() {
    return (
        <section id="policies" className="relative border-y border-[--border] bg-[--surface]/40 py-32">
            <div className="mx-auto grid max-w-7xl grid-cols-1 gap-16 px-6 lg:grid-cols-12">
                <div className="lg:col-span-5">
                    <Reveal>
                        <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-[--muted]">
                            02 — Policies
                        </div>
                    </Reveal>
                    <Reveal delay={0.05}>
                        <h2 className="mt-3 font-serif text-5xl leading-[1.02] tracking-tight md:text-6xl">
                            Write policy the way
                            <br />
                            you <em className="text-[--accent]">think</em>.
                        </h2>
                    </Reveal>
                    <Reveal delay={0.1}>
                        <p className="mt-6 max-w-md text-[--muted]">
                            A declarative policy language that reads like English and
                            compiles to a decision graph. Preview effects instantly. Test
                            them like code.
                        </p>
                    </Reveal>
                    <ul className="mt-8 space-y-3">
                        {[
                            "Typed subjects, resources, and attributes",
                            "Simulation & diff against production traffic",
                            "Version-controlled — every change reviewable",
                            "Native SDKs for TS, Go, Python, Rust",
                        ].map((t, i) => (
                            <Reveal key={t} delay={0.15 + i * 0.05}>
                                <li className="flex items-start gap-3 text-[15px]">
                                    <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-[--accent] text-[--accent-ink]">
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
                        <div className="overflow-hidden rounded-2xl border border-[--border] bg-[--bg] shadow-2xl">
                            <div className="flex items-center justify-between border-b border-[--border] px-4 py-2.5">
                                <div className="font-mono text-[11px] uppercase tracking-widest text-[--muted]">
                                    policies/invoice.axm
                                </div>
                                <div className="flex items-center gap-1.5 font-mono text-[11px] text-[--accent]">
                                    <Zap className="h-3 w-3" /> 12 tests · passing
                                </div>
                            </div>
                            <pre className="overflow-x-auto p-6 font-mono text-[13.5px] leading-relaxed">
                                <code>
                                    <span className="text-[--muted]">policy</span>{" "}
                                    <span className="text-[--accent]">"invoice.export"</span>{" "}
                                    {"{"}
                                    {"\n  "}
                                    <span className="text-[--ember]">allow</span> if
                                    subject.role in {"["}
                                    <span className="text-[--accent]">"admin"</span>,{" "}
                                    <span className="text-[--accent]">"finance"</span>
                                    {"]"}
                                    {"\n"}
                                    {"\n  "}
                                    <span className="text-[--ember]">allow</span> if
                                    {"\n    "}
                                    resource.owner_id == subject.id
                                    {"\n    "}
                                    <span className="text-[--muted]">and</span> subject.plan
                                    in [<span className="text-[--accent]">"growth"</span>,{" "}
                                    <span className="text-[--accent]">"scale"</span>]
                                    {"\n"}
                                    {"\n  "}
                                    <span className="text-[--ember]">deny</span> if
                                    subject.trial_expired
                                    {"\n  "}
                                    <span className="text-[--ember]">limit</span>{" "}
                                    <span className="text-[--accent]">"exports/day"</span>{" "}
                                    to <span className="text-[--ink]">100</span> per subject
                                    {"\n"}
                                    {"}"}
                                </code>
                            </pre>
                            <div className="grid grid-cols-3 divide-x divide-[--border] border-t border-[--border] text-center font-mono text-[11px]">
                                <div className="px-3 py-3">
                                    <div className="text-[--muted]">DECISIONS/S</div>
                                    <div className="mt-1 text-[--ink]">42,180</div>
                                </div>
                                <div className="px-3 py-3">
                                    <div className="text-[--muted]">P99 LATENCY</div>
                                    <div className="mt-1 text-[--accent]">0.9 ms</div>
                                </div>
                                <div className="px-3 py-3">
                                    <div className="text-[--muted]">CACHE HIT</div>
                                    <div className="mt-1 text-[--ink]">98.7%</div>
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
/*  Stats                                                                */
/* ------------------------------------------------------------------ */

function Stats() {
    const items = [
        { v: 4_200_000_000, label: "Decisions / month", suffix: "" },
        { v: 99, label: "P99 latency (ms)", suffix: "·9" },
        { v: 340, label: "Teams shipping on Axiom", suffix: "+" },
        { v: 999, label: "Uptime (three-nines +)", suffix: "%" },
    ];
    return (
        <section className="relative py-32">
            <div className="mx-auto max-w-7xl px-6">
                <Reveal>
                    <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-[--muted]">
                        03 — At scale
                    </div>
                </Reveal>
                <Reveal delay={0.05}>
                    <h2 className="mt-3 max-w-3xl font-serif text-5xl leading-[1.02] tracking-tight md:text-7xl">
                        The math is
                        <br />
                        <em className="text-[--accent]">boringly</em> good.
                    </h2>
                </Reveal>
                <div className="mt-16 grid grid-cols-2 gap-y-12 md:grid-cols-4">
                    {items.map((s, i) => (
                        <Reveal key={s.label} delay={i * 0.08}>
                            <div>
                                <div className="font-serif text-5xl tracking-tight md:text-6xl">
                                    <Counter to={s.v > 100000 ? Math.round(s.v / 1_000_000) : s.v} />
                                    <span className="text-[--accent]">
                                        {s.v > 100000 ? "M" : ""}
                                        {s.suffix}
                                    </span>
                                </div>
                                <div className="mt-3 max-w-[180px] text-sm text-[--muted]">
                                    {s.label}
                                </div>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ------------------------------------------------------------------ */
/*  Pricing                                                              */
/* ------------------------------------------------------------------ */

function Pricing() {
    const tiers = [
        {
            name: "Hobby",
            price: "Free",
            tag: "Weekend projects",
            features: ["10K decisions / mo", "Community SDKs", "1 project", "Community support"],
            cta: "Start free",
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
        },
    ];
    return (
        <section id="pricing" className="relative border-t border-[--border] py-32">
            <div className="mx-auto max-w-7xl px-6">
                <Reveal>
                    <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-[--muted]">
                        04 — Pricing
                    </div>
                </Reveal>
                <Reveal delay={0.05}>
                    <h2 className="mt-3 font-serif text-5xl leading-[1.02] tracking-tight md:text-6xl">
                        Priced like <em className="text-[--accent]">infra</em>. Not seats.
                    </h2>
                </Reveal>
                <div className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-3">
                    {tiers.map((t, i) => (
                        <Reveal key={t.name} delay={i * 0.08}>
                            <motion.div
                                whileHover={{ y: -4 }}
                                className={`relative flex h-full flex-col rounded-2xl border p-8 transition-colors ${
                                    t.featured
                                        ? "border-[--accent] bg-[--surface]"
                                        : "border-[--border] bg-[--surface]/60 hover:border-[--ink]/30"
                                }`}
                            >
                                {t.featured && (
                                    <div className="absolute -top-3 left-8 rounded-full bg-[--accent] px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-[--accent-ink]">
                                        Most teams
                                    </div>
                                )}
                                <div className="flex items-baseline justify-between">
                                    <h3 className="font-serif text-3xl">{t.name}</h3>
                                    <Sparkles
                                        className={`h-4 w-4 ${
                                            t.featured ? "text-[--accent]" : "text-[--muted]"
                                        }`}
                                    />
                                </div>
                                <div className="mt-1 text-sm text-[--muted]">{t.tag}</div>
                                <div className="mt-8 flex items-baseline gap-1">
                                    <span className="font-serif text-6xl tracking-tight">
                                        {t.price}
                                    </span>
                                    {t.price.startsWith("$") && (
                                        <span className="text-[--muted]">/ mo</span>
                                    )}
                                </div>
                                <ul className="mt-8 space-y-3">
                                    {t.features.map((f) => (
                                        <li key={f} className="flex items-start gap-2.5 text-sm">
                                            <Check
                                                className="mt-0.5 h-4 w-4 shrink-0 text-[--accent]"
                                                strokeWidth={2.5}
                                            />
                                            <span>{f}</span>
                                        </li>
                                    ))}
                                </ul>
                                <a
                                    href={t.name === "Scale" ? "#contact" : "/auth/sign-up"}
                                    className={`mt-10 inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium transition-transform hover:-translate-y-0.5 ${
                                        t.featured
                                            ? "bg-[--accent] text-[--accent-ink]"
                                            : "border border-[--border] text-[--ink] hover:border-[--ink]/40"
                                    }`}
                                >
                                    {t.cta} <ArrowUpRight className="h-4 w-4" />
                                </a>
                            </motion.div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ------------------------------------------------------------------ */
/*  CTA                                                                  */
/* ------------------------------------------------------------------ */

function CTA() {
    return (
        <section id="contact" className="relative overflow-hidden py-32">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 h-[400px] -translate-y-1/2 opacity-60 blur-3xl"
                style={{
                    background:
                        "radial-gradient(50% 60% at 50% 50%, rgba(198,242,78,0.20), transparent 70%)",
                }}
            />
            <div className="mx-auto max-w-4xl px-6 text-center">
                <Reveal>
                    <div className="inline-flex items-center gap-2 rounded-full border border-[--border] bg-[--surface]/60 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-[--muted]">
                        <Lock className="h-3 w-3 text-[--accent]" /> Free while you build
                    </div>
                </Reveal>
                <Reveal delay={0.06}>
                    <h2 className="mt-6 font-serif text-6xl leading-[0.98] tracking-tight md:text-8xl">
                        Get authorization
                        <br />
                        <em className="text-[--accent]">right</em>. Once.
                    </h2>
                </Reveal>
                <Reveal delay={0.12}>
                    <p className="mx-auto mt-6 max-w-lg text-[--muted]">
                        Ten minutes to your first decision. No credit card. No sales call.
                    </p>
                </Reveal>
                <Reveal delay={0.18}>
                    <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                        <a
                            href="/auth/sign-up"
                            className="group inline-flex items-center gap-2 rounded-full bg-[--accent] px-6 py-3.5 font-medium text-[--accent-ink] transition-all hover:-translate-y-0.5 hover:glow-lime"
                        >
                            Start free
                            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </a>
                        <a
                            href="#docs"
                            className="inline-flex items-center gap-2 rounded-full border border-[--border] px-6 py-3.5 text-[--ink] transition-colors hover:border-[--ink]/40"
                        >
                            <Terminal className="h-4 w-4" /> View documentation
                        </a>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}
