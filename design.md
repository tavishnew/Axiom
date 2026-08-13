# Axiom — Editorial Interface Redesign

> Documentation-only design handoff for the uploaded Axiom snapshot.
> This package does not modify the application. It defines the visual system and interaction direction for Manus to integrate into the existing `frontend/src` codebase.

## 1. Product identity

Axiom is an authorization workbench for teams that need to make access decisions legible, reviewable, and dependable. It should feel like a well-edited technical journal crossed with a control room: precise enough for security work, but human enough to invite daily use.

The redesign is called **The Axiom Ledger**. The visual language is light, paper-like, typographic, and quietly assertive. It uses editorial hierarchy, ruled divisions, marginal labels, and purposeful color instead of generic dashboard cards, glossy gradients, or decorative “AI” effects.

### Experience principles

1. **Make authorization understandable.** Every policy, decision, entity, and audit event should read like a traceable record.
2. **Make the important thing obvious.** Use hierarchy and composition before color or decoration.
3. **Make the product memorable.** A restrained oxblood-and-moss palette, a distinctive serif display face, and ledger-like rules should be recognizable after the tab is closed.
4. **Make trust visible.** Loading, empty, error, permission, and saved states must be explicit. Never imply that an action succeeded when the backend did not persist it.
5. **Make motion explain change.** Motion should show causality, reveal context, or confirm an action—not fill empty space.

## 2. Current snapshot audit

The audit was performed against the uploaded project snapshot, especially `frontend/src/app`, `frontend/src/components`, `frontend/src/index.css`, and `frontend/src/app/globals.css`.

| Priority | Finding | Design correction |
|---|---|---|
| P0 | `globals.css` defines a dark “warm noir + electric lime” system while `index.css` defines a light amber system. Both describe Axiom tokens, creating a split visual source of truth. | Keep one light token layer. Remove duplicate dark tokens and alias all components to the same semantic variables. |
| P0 | The interface uses ad hoc `blue-*`, `violet-*`, `orange/amber-*`, `emerald-*`, and red utility colors across the dashboard and test console. | Replace product color roles with oxblood, moss, parchment, ink, and clearly named semantic states. |
| P1 | Most authenticated pages repeat the same `rounded-xl border bg-white p-* shadow-sm` panel pattern. | Use ruled editorial sections, flat paper surfaces, split headers, tables, drawers, and only occasional elevated overlays. |
| P1 | Landing visuals use mesh gradients, grid patterns, floating gradient orbs, grain, gradient borders, and multiple accent hues. This reads as a familiar AI/SaaS template. | Retain only a very quiet paper texture if needed. Use typography, rules, diagrams, and one restrained accent instead of glow effects. |
| P1 | Typography is described inconsistently across the two CSS files: Inter, Inter Tight, Instrument Serif, Geist, and Geist Mono all appear in the token story. | Choose one editorial display face, one interface sans, and one technical mono. |
| P1 | Motion exists on the landing, dashboard, settings, invitation, and test console, but not as a shared interaction system. CRUD pages can feel static while marketing pages feel over-decorated. | Add shared motion tokens for page entry, list reveal, drawer transitions, save confirmation, and reduced-motion behavior. |
| P1 | Destructive entity deletion uses a browser `window.confirm`, which breaks the visual language and weakens the confirmation moment. | Use the existing alert-dialog primitive with a clear consequence, object name, and cancel-first layout. |
| P1 | Settings contains an organization save path that currently reports “saved” while noting that the backend endpoint is still needed. | Never show a success toast for a non-persisted action. Render the control as read-only or show an explicit “not yet connected” state until wired. |
| P2 | IDs, metadata, action names, and API-oriented labels compete with human-readable context in logs and tables. | Use editorial labels, progressive disclosure, copy affordances, and monospace only for values that benefit from it. |
| P2 | Auth and recovery pages are visually separated from the product identity and rely on generic centered forms. | Treat auth as the opening page of the same publication: same masthead, type, rules, and product promise. |
| P2 | Mobile navigation and dense tables need a stronger small-screen strategy than shrinking desktop layouts. | Use a full-height mobile sheet, stacked record rows, horizontal overflow only for genuinely tabular data, and persistent primary actions. |

## 3. Light editorial palette

Do not use generic blue, purple, or orange as product colors. The palette should feel like ink, paper, archival red, and field notes.

### Core tokens

| Token | Value | Use |
|---|---|---|
| `--paper` | `#F7F5EF` | Application background; warm but not beige-heavy |
| `--paper-raised` | `#FCFBF8` | Reading surfaces, forms, drawers |
| `--paper-tint` | `#EEEEE7` | Quiet grouping, skeletons, selected row backgrounds |
| `--ink` | `#202622` | Main text, headings, high-confidence data |
| `--ink-soft` | `#5D6860` | Supporting copy and secondary metadata |
| `--ink-faint` | `#899189` | Placeholder, tertiary labels; never for essential text |
| `--line` | `#D7DCD4` | Rules, table dividers, field borders |
| `--line-strong` | `#AAB4AA` | Active dividers and section boundaries |
| `--oxblood` | `#8B2635` | Primary action, active navigation, important decision state |
| `--oxblood-deep` | `#641B27` | Hover/pressed primary action, high-contrast display accents |
| `--oxblood-wash` | `#F2E5E7` | Selected state, soft warning, quiet emphasis |
| `--moss` | `#4E6B58` | Allowed/success state, secondary action, health indicator |
| `--moss-wash` | `#E7EEE8` | Soft success background |
| `--clay` | `#7A6350` | Pending/neutral attention state; use sparingly |
| `--clay-wash` | `#EFEAE4` | Soft pending background |
| `--danger` | `#9D2939` | Destructive action and denied state; distinguish with icon/text |

### Color rules

- Use `--oxblood` for one primary action per context, not every button.
- Use `--moss` for positive outcomes only. Do not use it as a decorative accent.
- Never communicate status with color alone. Pair it with a label, icon, or text.
- Avoid gradients in the product shell and data UI. A very subtle tonal wash is acceptable for a marketing hero only if it remains paper-like.
- Avoid pure white page backgrounds and gray-on-gray interfaces. The contrast should be warm paper against ink.
- Verify all text and controls against WCAG AA. `--ink-faint` is not allowed for body copy, labels, or status text.

## 4. Typography

Use a three-role type system:

| Role | Preferred face | Use |
|---|---|---|
| Display | `Newsreader` | Landing headlines, page titles, empty-state statements, invitation moments |
| Interface | `DM Sans` | Navigation, buttons, labels, forms, table text, supporting copy |
| Technical | `IBM Plex Mono` | IDs, policy conditions, API keys, timestamps, SDK snippets, latency |

If these fonts cannot be self-hosted, use the equivalent fallback stacks:

- Display: `Georgia, "Times New Roman", serif`
- Interface: `ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`
- Technical: `ui-monospace, "SFMono-Regular", Menlo, monospace`

### Type behavior

- Page titles: display face, 38–56px on desktop, 30–36px on mobile, tight but not compressed.
- Section titles: interface face, 16–20px, medium or semibold.
- Eyebrows: interface face, 10–11px, uppercase, 0.12em tracking, ink-soft.
- Body: interface face, 14–16px, 1.5–1.65 line height.
- Data: interface face for meaning, technical face for machine values.
- Do not use bold weight everywhere. Let size, rule position, and whitespace create hierarchy.
- Never use a display serif for long tables or dense forms.

## 5. Layout language

- Use a 12-column editorial grid on desktop with a readable content measure. Do not stretch forms or prose across the full viewport.
- Keep the workspace shell quiet: narrow navigation rail, top context line, and an open reading canvas.
- Prefer asymmetric compositions: a strong title column with a wider record/table column.
- Use 1px rules and section labels to separate content. A divider should explain a relationship.
- Keep radii modest: 4–8px for controls and 10–12px only for dialogs or floating surfaces.
- Remove decorative drop shadows from ordinary panels. Use a shadow only to indicate elevation above the page, such as a dialog, command menu, or mobile sheet.
- Keep primary actions visible near the page title. Do not hide a create action at the bottom of a long page.
- Use generous vertical rhythm around headings, but optimize tables and logs for scanability.
- A “card” must have a reason to be a card: containment, action grouping, or comparison. Do not wrap every block in a rounded rectangle.

## 6. Shared interface vocabulary

### App shell

- Wordmark is typographic: `Axiom` in display type with a small oxblood period or rule.
- Replace the gradient shield tile with a simple mark: a vertical rule, small square, or open “A” glyph. It should work in one color.
- Navigation is grouped by intent: **Overview**, **Control**, **Evidence**, **Workspace**.
- Active navigation uses an oxblood left rule and ink text, not a colored pill.
- Collapsed navigation must retain tooltips and visible keyboard focus.
- On mobile, open navigation in a full-height sheet with the current section and a clear close control.

### Page header

Every authenticated page follows:

1. Eyebrow / section label.
2. Editorial page title.
3. One-sentence explanation in ink-soft.
4. Primary action or contextual control aligned to the title.
5. Optional status line with last updated / organization / environment.

### Data records

- Use a record row with a leading semantic mark, human-readable title, secondary metadata, and a right-aligned action.
- Keep IDs and timestamps in `IBM Plex Mono`.
- Reveal long metadata and JSON in a drawer or expandable detail row, not in a cramped table cell.
- Use `Badge` for semantic status only, not as decoration.

### Forms and dialogs

- Prefer a drawer for create/edit flows when the user needs list context.
- Use a dialog for destructive confirmation, short assignment tasks, and small settings changes.
- Group fields by the decision the user is making, not by backend table structure.
- Show validation beside the field and preserve entered data.
- Use `AlertDialog` for deletion and revocation; do not use browser dialogs.

## 7. Page-by-page redesign

### `/` and `/landing` — Axiom front page

The landing page is the product’s editorial cover, not a collection of floating SaaS widgets.

- Lead with a sharp promise about explainable authorization and fast decisions.
- Use a typographic hero with one live-looking but clearly labeled evaluation example.
- Build proof through a few carefully typeset metrics and a compact policy-to-decision story.
- Show a code specimen as an artifact with annotations, not as a neon terminal card.
- Use a restrained “read the system” narrative that links policies, entities, resources, decisions, and evidence.
- Keep the CTA pair clear: enter the console and read the documentation.
- Replace grid/orb/mesh decoration with rules, annotations, a small diagram, and one oxblood accent.
- Motion: headline line reveal, diagram path draw, metric count-up only when meaningful, and subtle hover underline transitions.

### `/auth/sign-in`, `/auth/sign-up`, `/auth/forgot-password`, `/auth/reset-password`

- Keep the same Axiom masthead and editorial tokens as the landing page.
- Use a split composition on desktop: product promise or security note on one side, form on the other. Collapse to a focused single column on mobile.
- Make the current step obvious without adding a multi-step progress widget.
- Use sentence-case labels, clear helper text, and a visible password recovery path.
- Keep errors inline and specific. Do not rely on toast-only feedback for form errors.
- Use an oxblood primary submit control and a quiet text link for secondary navigation.
- Motion: form entrance once, field-level error emphasis, success transition into the next route. Respect reduced motion.

### `/invite/:token`

- Treat an invitation as a personal handoff, not an error state.
- Make the inviting organization, recipient email, role, expiry, and next action easy to verify.
- Keep revoked, expired, loading, accepting, success, and error states visually related.
- Use the display face for the state headline and a clear next step for every terminal state.
- Do not expose raw tokens. Use a copyable invitation or organization detail only when it is safe and useful.

### `/dashboard`

The dashboard is the daily “state of the system” page.

- Replace four equal stat cards with a typographic overview: system status, decision volume, evaluation latency, and recent change.
- Make “what needs attention” more prominent than vanity metrics.
- Present quick actions as a compact index of next moves, not four colorful tiles.
- Give recent activity a clear narrative order and link each event to its source record.
- Use a small trend visualization only when the API data supports a useful comparison.
- Empty state should guide setup in dependency order: resource → entity → policy → evaluation.

### `/policies`

- Make the policy list read like a register: policy name, intent, priority, scope, status, last change.
- Use one consistent semantic mark for allow/deny/default behavior.
- Make version history and conditions easy to inspect without turning the list into a wall of JSON.
- Create/edit flows should use a drawer with a readable condition builder, examples, and a visible evaluation consequence.
- On save, show version created and timestamp; do not merely show a generic toast.

### `/entities`

- Distinguish people, services, and API keys through icon + label + type, not unrelated colors.
- Make the entity identifier and human name visually primary; use machine IDs as secondary technical metadata.
- Policy assignment should feel like a deliberate relationship: show assigned policies, effective priority, and a clear add/remove action.
- Deletion must use `AlertDialog`, include the entity name, and explain what assignments or access may be affected.
- Search and type filter should remain visible on desktop and become a compact filter sheet on mobile.

### `/resources`

- Treat resources as protected surfaces in a catalog, with type, owner/context, and policies affecting access.
- Use the same record grammar as entities, but with a clearer noun phrase and lifecycle label.
- Resource forms should show examples of resource type and ID format.
- Keep delete/revoke actions visually separated from ordinary edit actions.

### `/decisions`

- This is the operational evidence view. Prioritize outcome, latency, actor, resource, and policy in that order.
- Use a filter bar with persistent applied-filter summary and a clear reset action.
- Allowed and denied states use oxblood/moss semantics plus text and icon.
- Long reasons should expand inline or in a detail drawer. Never truncate the only explanation of a deny.
- Export should communicate range, filter scope, and completion state.
- Use a quiet sparkline or distribution summary only if it helps operators see a pattern.

### `/audit-logs`

- Make the log feel like a chronological record: date grouping, actor, action, target, and metadata.
- Use monospace for action names, IDs, and timestamps; use normal type for human names.
- Provide a detail drawer for metadata instead of making raw JSON the primary reading experience.
- Empty, filtered-empty, and loading states need distinct copy.
- Filters should be deep-linkable if the current routing model supports it.

### `/test`

- Name the page “Evaluate a request” in the visible UI while retaining the route.
- Present the input as a readable request sentence: “Can [entity] [action] [resource]?”
- Keep context fields available without making the user build a JSON payload by hand.
- The result needs a strong outcome header, matched policy, reason, latency, and a copyable SDK example.
- Animate the result as a state transition from request to decision. Do not continuously animate the result.
- Preserve the last request locally only if product requirements and privacy rules allow it; never persist secrets.

### `/settings`

- Use the same editorial record grammar for organization, API keys, team, billing, and profile.
- Make the settings index readable and keep the active section visible on mobile.
- API keys need a one-time reveal/copy moment, explicit last-used metadata, and a destructive revoke confirmation.
- Team management must clearly distinguish what owners/admins can do from what members can view.
- Billing actions should look like external transitions and explain where the user is going.
- Organization fields must be honest about persistence: do not render a success state when the backend update is not implemented.

### Not found and system errors

- Use a short editorial statement, a helpful explanation, and one recovery action.
- Keep errors calm and direct. Avoid mascot illustrations, novelty copy, or decorative animations.
- Preserve the Axiom masthead and light paper background so the user never feels dropped into a different product.

## 8. Motion system

Use `framer-motion` through a small shared set of variants. Do not invent a new transition on every page.

| Motion | Default | Use |
|---|---|---|
| Page reveal | opacity 0 → 1, y 8 → 0, 220–320ms | Route content entering |
| Staggered records | 24–40ms child delay, max 6 items | First visible list rows only |
| Drawer | x 24 → 0 or opacity + scale 0.98 → 1, 220ms | Create/edit/detail context |
| Result change | opacity + y 6, 180–240ms | Evaluation result or async status |
| Confirmation | subtle scale/opacity, 160ms | Save, revoke, copy, or assignment |
| Hover | color/rule/underline, 120–160ms | Links, rows, controls |

Motion rules:

- Animate layout changes, not decoration.
- No infinite floating orbs, pulsing badges, rotating icons, or autoplay marquees in the authenticated workspace.
- Use `whileInView` only for marketing narrative content and provide a reduced-motion path.
- Respect `prefers-reduced-motion: reduce`: remove transforms and repeated animation, keep instant state changes.
- Never delay a primary action behind an animation.

## 9. Iconography

Use the existing `lucide-react` library. Icons are supporting punctuation, not illustrations.

- Use one icon per action or status, normally 16–18px in interface controls.
- Keep stroke weight consistent.
- Pair icon-only buttons with a tooltip and accessible label.
- Prefer familiar symbols: ShieldCheck, Users, Database, KeyRound, FileClock, FlaskConical, Settings2, ChevronRight, Copy, Trash2.
- Do not use icons to introduce unrelated color categories.

## 10. Definition of done for the redesign

The redesign is complete when:

- All pages share one light token system and typography system.
- No product UI relies on generic blue, purple, or orange utility colors.
- Ordinary data surfaces no longer all look like identical rounded cards.
- Every primary create/edit/delete/test/invite action has a clear real state.
- Loading, empty, error, permission, success, and reduced-motion states are designed.
- The landing and auth surfaces feel like the same product as the workspace.
- Desktop, tablet, and mobile layouts are intentional rather than scaled-down desktop.
- A keyboard-only user can navigate the shell, forms, dialogs, tables, and drawers.
- The implementation uses the existing shadcn/Radix components, `framer-motion`, `lucide-react`, and `recharts` where appropriate instead of adding a second component language.