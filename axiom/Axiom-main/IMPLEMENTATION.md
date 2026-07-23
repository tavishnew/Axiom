# Axiom — Rebrand & Landing Page Redesign

> Rebrand of **AccessForge / Permix** → **Axiom**.
> Tagline: *Authorization, axiomatic.*

This document describes the visual identity, tokens, component structure,
motion system, and file-by-file changes shipped in this archive.

---

## 1. Brand

| | |
|---|---|
| **Name** | Axiom |
| **Wordmark** | `Axiom.` — Instrument Serif, the trailing `.` in `--accent` lime |
| **Voice** | Confident, engineering-first, dry. Short sentences. Italics for emphasis. |
| **Tagline** | Authorization, axiomatic. |
| **Product one-liner** | The authorization runtime for modern SaaS — RBAC, ABAC, entitlements, and quotas as one composable policy layer. |

---

## 2. Color System

Dark-first, warm-noir palette with an electric-lime signature. Deliberately
avoids the generic AI purple/emerald/indigo look.

| Token | Value | Purpose |
|---|---|---|
| `--bg` | `#0A0B0D` | Page background (near-black, warm) |
| `--surface` | `#101218` | Cards, panels |
| `--surface-2` | `#171A22` | Nested surfaces, code chrome |
| `--border` | `#262A35` | Hairlines, dividers |
| `--ink` | `#F4F3EE` | Primary text (warm off-white) |
| `--muted` | `#8A8FA0` | Secondary text |
| `--accent` | `#C6F24E` | Electric lime — CTAs, focus, signature |
| `--accent-ink` | `#0A0B0D` | Text/icon color that sits on `--accent` |
| `--ember` | `#FF8A5B` | Secondary accent, keywords in code |

Tokens are declared in `apps/dashboard/src/app/globals.css` under `:root`
and exposed to Tailwind v4 via `@theme inline` as `--color-*` aliases.

---

## 3. Typography

Loaded via Google Fonts in `apps/dashboard/src/app/layout.tsx`.

| Role | Family | Notes |
|---|---|---|
| Display | **Instrument Serif** | Headings, wordmark, editorial pull-quotes. Italic used for emphasis words (`axiomatic`, `right`, `every`). |
| UI / Body | **Geist** | 300–700. All UI copy. |
| Code / Eyebrow | **Geist Mono** | Uppercase micro-labels (`01 — Product`), terminal, stat readouts. |

Type scale is deliberately dramatic: heros at 96–104px on desktop, tight
tracking (`-0.02em` via `tracking-tight`), 0.95 line-height.

---

## 4. Motion System

All motion via **framer-motion** (already a dependency).

* **Reveal on enter** — `fadeUp` variant (opacity 0 → 1, y 24 → 0) with
  `viewport={{ once: true, margin: "-80px" }}`, staggered per section via
  a `delay` prop on the `<Reveal>` primitive.
* **Scroll-linked hero parallax** — `useScroll` scoped to the hero,
  `useTransform` drives `y` (0 → 160px) and `opacity` (1 → 0) so the hero
  drifts and dissolves as you scroll past it.
* **Scroll progress bar** — top-of-page `useSpring(scrollYProgress)`
  scales an origin-left lime bar.
* **Marquee** — pure CSS `@keyframes marquee` translating `-50%` over 40s
  with duplicated content and a soft-edged mask.
* **Animated counters** — custom `<Counter>` uses `useInView` + a `raf`
  cubic-ease-out ramp for stat numbers.
* **Micro-interactions** — cards `whileHover={{ y: -4 }}`, buttons
  `hover:-translate-y-0.5`, blinking terminal caret via CSS keyframes.

---

## 5. Landing Page Structure

Route: `apps/dashboard/src/app/landing/page.tsx`

```
Navbar (fixed, blurs on scroll)
├── Hero
│   ├── Availability chip (v1.0 · GA)
│   ├── H1 — "Authorization, axiomatic."
│   ├── Sub + CTAs (Start building free / Read the docs)
│   └── Terminal card — @axiom/sdk usage example
├── LogoMarquee — trust strip
├── Product — bento grid (5 cards, 1 featured spanning 4 cols)
├── PolicyPlayground — split section, policy DSL card + stats readout
├── Stats — 4 animated counters
├── Pricing — Hobby / Growth (featured) / Scale
├── CTA — big serif headline with radial lime glow
└── Footer — oversized wordmark + 4 link columns
```

All sections use the `<Reveal>` primitive; nothing pops in without
staggered choreography.

---

## 6. Files Changed

| File | Change |
|---|---|
| `apps/dashboard/src/app/layout.tsx` | Rebrand metadata, load Instrument Serif + Geist + Geist Mono, force `dark` class |
| `apps/dashboard/src/app/globals.css` | Full token rewrite (dark-first, lime accent), grain / grid-lines / marquee / caret utilities |
| `apps/dashboard/src/app/landing/page.tsx` | Complete redesign — hero parallax, bento, policy DSL card, animated stats, editorial CTA |
| `apps/dashboard/src/components/Navbar.tsx` | New wordmark, dark blur-on-scroll nav, updated nav items |
| `apps/dashboard/src/components/Footer.tsx` | Oversized serif headline, 4-column link grid, mono legal strip |

No dependencies were added or removed. The rebrand uses only what the
project already ships: `framer-motion`, `lucide-react`, `tailwindcss@4`.

---

## 7. Component & Library References

The design intentionally follows the aesthetic language of the libraries
you called out — while staying pure Tailwind + framer-motion so nothing
new needs to be installed.

* **shadcn/ui** — token approach (CSS variables mapped through
  `@theme inline`) and card composition idioms.
* **21st.dev / React Bits** — hero parallax, animated counters,
  logo marquee, scroll progress bar patterns.
* **lucide-react** — every icon (`ShieldCheck`, `Layers`, `Gauge`,
  `KeyRound`, `Terminal`, `Sparkles`, `Zap`, `Lock`, `LineChart`,
  `Check`, `ArrowUpRight`, `Menu`, `X`, `Github`, `Twitter`, `Mail`).
* **framer-motion** — every animation (see §4).
* **Dribbble references** — editorial serif + mono pairing, oversized
  footer wordmark, warm-noir surfaces with a single saturated accent.

If you want to bring in the actual **shadcn/ui** primitives later, run
`npx shadcn@latest init` in `apps/dashboard/` — the tokens in
`globals.css` are already shadcn-compatible (same `--*` / `@theme inline`
shape).

---

## 8. Running It

```bash
bun install
bun dev --filter @accessforge/dashboard
# then open http://localhost:3000/landing
```

> Note on package names: the workspace scope is still `@accessforge/*`
> internally to avoid touching every `package.json` and lockfile entry.
> When you're ready to fully rename the scope to `@axiom/*`, do it as a
> single search-and-replace across `package.json` files + `bun.lockb`
> and rerun `bun install`.

---

## 9. What to Tweak Next

1. **Real SDK snippet** — the terminal card is illustrative. Swap in the
   actual `@axiom/sdk` (or current `@accessforge/sdk`) call once the API
   surface is finalized.
2. **Policy DSL** — the `.axm` sample is a visual mock. If you build a
   real DSL, hook it up to a Monaco/CodeMirror embed with live
   evaluation against a sandbox worker.
3. **Case studies** — replace `LogoMarquee` names with real customers.
4. **Docs link** — wire `#docs` to `apps/docs`.
5. **OG image** — add `apps/dashboard/public/og.png` (1200×630) with the
   `Axiom.` wordmark on `--bg` and reference it in `layout.tsx`
   `openGraph.images`.
