# Axiom — Manus Integration Guidelines

## Purpose

Use this document to integrate the editorial redesign into the existing Axiom frontend without changing product behavior or inventing new domains. The uploaded source is a React/Vite app under `frontend/src` with wouter routes, shadcn/Radix UI primitives, `framer-motion`, `lucide-react`, and `recharts`.

The target is a real, responsive, light-theme product—not a static visual pass. Keep the existing API client, auth flow, query behavior, and CRUD semantics intact unless a rule below explicitly calls out a trust or state issue.

## 1. Integration order

### Phase A — establish the visual foundation

1. Create one source of truth for tokens. Resolve the conflict between `frontend/src/app/globals.css` and `frontend/src/index.css`; do not maintain a second dark palette in parallel.
2. Add the display, interface, and technical font roles from `design.md`. Prefer self-hosted font files for production; use documented fallbacks when a font cannot be bundled.
3. Define semantic tokens for paper, ink, line, oxblood, moss, clay, danger, and their washes.
4. Add shared motion variants and a reduced-motion helper.
5. Normalize base controls, focus rings, selection color, scrollbar, and text rendering.

### Phase B — rebuild the shared shell

Update:

- `frontend/src/components/DashboardLayout.tsx`
- `frontend/src/components/sidebar.tsx`
- `frontend/src/components/Navbar.tsx`
- `frontend/src/components/Footer.tsx`
- shared UI primitives under `frontend/src/components/ui`

The shell should be finished before page-by-page styling. It establishes the visual contract for every route:

- light paper background;
- typographic Axiom masthead;
- grouped navigation with active oxblood rule;
- accessible collapse and mobile sheet behavior;
- consistent page entrance motion;
- no gradients, glow tiles, or generic colored icon squares.

### Phase C — migrate the product pages

Migrate in this order:

1. `/dashboard`
2. `/policies`
3. `/entities`
4. `/resources`
5. `/decisions`
6. `/audit-logs`
7. `/test`
8. `/settings`
9. `/auth/*`, `/invite/:token`, and not-found
10. `/` and `/landing`

This order puts the shared product surface first and prevents the marketing page from becoming a separate visual language.

### Phase D — state and quality pass

For every route, verify:

- initial loading;
- successful data;
- empty data;
- filtered-empty data;
- API error;
- permission-restricted controls;
- form validation;
- save success;
- save failure;
- destructive confirmation;
- mobile layout;
- keyboard focus;
- reduced motion.

## 2. Library usage

### Use what is already installed

- **shadcn/Radix primitives**: dialogs, alert dialogs, drawers, popovers, selects, tabs, tooltips, tables, labels, inputs, and accessible focus behavior.
- **`framer-motion`**: shared page, list, drawer, and result transitions defined in `design.md`.
- **`lucide-react`**: consistent line icons only.
- **`recharts`**: restrained charts on dashboard or decisions only when the data supports a meaningful operational comparison.
- **Tailwind utilities**: layout and token application, with semantic classes preferred over raw color utilities.

React Bits or Aceternity UI may be considered only if a component fills a real interaction gap and can be adapted to the Axiom tokens. Do not import their default visual language, gradient backgrounds, cursor effects, or showcase animations.

### Component rule

Before writing a new component:

1. Check whether an existing shadcn/Radix primitive already solves the behavior.
2. Check whether the shared Axiom component vocabulary in `design.md` solves the presentation.
3. Add a custom component only when it expresses a repeated product pattern.
4. Keep data-fetching and mutation logic in the existing page/API patterns; do not move behavior into decorative components.

## 3. Token migration map

Replace scattered utility colors with semantic roles:

| Existing pattern | Replace with |
|---|---|
| `bg-blue-*`, `text-blue-*` | `--moss-wash` / `--moss` only when the meaning is positive or operational |
| `bg-violet-*`, `text-violet-*` | `--paper-tint` for grouping; `--oxblood-wash` for selected emphasis |
| `bg-amber-*`, `text-amber-*`, `bg-orange-*` | `--clay-wash` / `--clay` for pending or neutral attention |
| `bg-emerald-*`, `text-emerald-*` | `--moss-wash` / `--moss` for allowed, healthy, or successful states |
| `bg-red-*`, `text-red-*` | `--oxblood-wash` / `--danger` for denied or destructive states |
| `bg-gradient-to-*` in product UI | flat semantic surface plus a rule or type accent |
| `shadow-sm` on every panel | no shadow; use `border`/`line` and spacing |
| `rounded-xl` on every panel | 4–8px controls, flat ruled sections, 10–12px only for floating surfaces |

Do not leave old tokens as silent fallbacks. A partial migration will recreate the same inconsistency.

## 4. Page integration checklist

### Dashboard

- Replace equal stat cards with an editorial overview and attention-first activity.
- Keep API-backed values and existing links.
- Use `recharts` only for a real trend or distribution; never add fake data to make the page look complete.
- Animate only the first visible records and the transition of updated values.

### Policies, entities, and resources

- Preserve create/edit/delete and assignment behavior.
- Use drawers for create/edit and alert dialogs for destructive actions.
- Keep search, filter, pagination, and loading states in the same position across these register pages.
- Make the primary record label human-readable and the ID secondary.
- Replace browser confirmation with `AlertDialog`.

### Decisions and audit logs

- Keep filters, pagination, export, and API-backed results.
- Make the first column the operational outcome or event, not an arbitrary identifier.
- Use a detail drawer or expandable row for long reason/metadata content.
- Provide a visible applied-filter summary and a reset action.

### Test console

- Preserve the live evaluation request and result APIs.
- Reframe the input as a readable request sentence while keeping the underlying fields.
- Make `allowed`/`denied`, matched policy, reason, and latency obvious.
- Animate only the result transition; do not loop attention-grabbing effects.
- Keep SDK code copyable and visually separate from the decision explanation.

### Settings

- Preserve organization, API key, team, billing, and profile behavior.
- Distinguish view-only member states from owner/admin controls.
- Keep the one-time API key reveal/copy flow explicit.
- Do not display “saved” for organization changes until the backend update exists. Use a disabled/read-only treatment or a clearly labeled unavailable state.

### Auth and invitation

- Preserve session, invite token, password reset, and role logic.
- Use the same masthead, display type, paper background, and focus treatment.
- Keep error copy inline and accessible.
- Give every terminal invite state one specific recovery path.

### Landing

- Preserve real links and real claims.
- Remove or substantially reduce mesh backgrounds, floating orbs, large glows, grid overlays, and multi-accent gradients.
- Use a small number of real product examples and API-backed claims only if they are accurate.
- Make the page feel editorial through type, annotation, rules, and sequencing—not through a template-like effects layer.

## 5. Interaction and motion implementation

Create shared variants rather than page-specific animation objects:

- `pageEnter`: opacity + small vertical reveal;
- `recordList`: stagger only the initial viewport;
- `drawerEnter`: short horizontal reveal;
- `resultSwap`: short opacity/vertical transition;
- `toastConfirm`: concise confirmation, never the sole error channel.

Implementation requirements:

- respect `prefers-reduced-motion`;
- do not animate height from unknown content when it causes layout jump;
- do not use infinite animation in authenticated data surfaces;
- keep button feedback immediate;
- never use motion to hide latency or an error;
- keep focus in a dialog/drawer until it closes;
- preserve scroll position when a drawer opens.

## 6. Responsive behavior

### Desktop

- Keep a narrow persistent navigation and a generous reading canvas.
- Use an editorial grid, not a full-width collection of cards.
- Keep page title and primary action in the same visual band.

### Tablet

- Allow the navigation to collapse without losing labels through tooltips.
- Convert two-column forms to one column before fields become cramped.
- Keep filters available as a compact horizontal group or popover.

### Mobile

- Use a full-height navigation sheet with a visible close button.
- Stack page title, description, and primary action.
- Turn record tables into labeled rows; only allow horizontal scrolling for truly comparative data.
- Keep filter controls in a sheet or disclosure.
- Make drawers nearly full width with adequate side padding.
- Keep destructive actions away from the primary thumb path.

## 7. Accessibility requirements

- All interactive elements need visible `:focus-visible` styling.
- Icon-only controls need an accessible name and tooltip.
- Dialogs and drawers need title, description, focus management, escape behavior, and a clear close control.
- Do not use color alone for allowed/denied/pending.
- Status text must be readable at normal zoom and high contrast.
- Form errors must be associated with their field and announced when appropriate.
- Tables need appropriate headers and a mobile alternative.
- Respect keyboard navigation for sidebar, tabs, selects, menus, filters, and pagination.
- Respect reduced motion and avoid flashing or rapidly changing indicators.
- Test at 200% zoom and at narrow mobile widths.

## 8. Content and copy

Use clear, operational language:

- “Evaluate a request” instead of “Test Console”.
- “Decision history” when the user is reading authorization outcomes.
- “Activity record” or “Audit log” when the user is reading organization changes.
- “Policy register” only when context makes the term obvious.
- Explain consequences: “Removing this assignment may deny future requests for this entity.”

Avoid:

- fake urgency;
- “magic”, “seamless”, “revolutionary”, “AI-powered” filler;
- unexplained backend nouns;
- success language for optimistic or unimplemented actions;
- error messages that only say “Something went wrong”.

## 9. Integration acceptance checklist

Before handing the redesign back:

- [ ] One light token system is used everywhere.
- [ ] No raw `blue`, `violet`, `orange`, or gradient product styling remains.
- [ ] `DashboardLayout`, sidebar, navbar, auth layout, dialogs, and tables share the same visual language.
- [ ] All existing routes and primary actions still work.
- [ ] Browser confirms have been replaced by accessible alert dialogs.
- [ ] Unimplemented persistence does not report success.
- [ ] Every page has loading, empty, error, and permission states.
- [ ] Motion is shared, restrained, and reduced-motion safe.
- [ ] Mobile navigation and dense records are intentionally designed.
- [ ] Keyboard, contrast, focus, and zoom checks pass.
- [ ] No fake records, fake metrics, or invented backend behavior were added.