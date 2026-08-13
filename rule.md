# Axiom — Editorial Design Rules

These are the non-negotiable rules for implementing the redesign. When a page-level preference conflicts with a rule, the rule wins.

## Identity

1. Axiom is a high-trust authorization workbench. The interface must feel precise, calm, and authored—not playful, glossy, or generic.
2. Use a light paper-first theme. Dark mode is out of scope for this redesign.
3. Make the product recognizable through typography, rules, spacing, and oxblood/moss semantics.
4. Do not imitate a generic AI dashboard, crypto console, neon developer tool, or template marketplace.

## Color

5. Do not use generic blue, purple, or orange as product colors.
6. Use oxblood for primary emphasis and moss for positive operational state.
7. Use clay only for pending/neutral attention; it must not become a second primary accent.
8. Never use a rainbow of colors to classify entities, resources, or actions.
9. Never communicate allowed, denied, pending, or permission state with color alone.
10. No gradient backgrounds, gradient borders, glow halos, mesh fields, or large decorative orbs in the authenticated product.
11. Keep page background and ordinary surfaces warm and light; do not use pure white panels everywhere.
12. Use color to clarify hierarchy or state, never to compensate for weak hierarchy.

## Typography

13. Use one display serif, one interface sans, and one technical monospace role.
14. Use the display face for meaningfully editorial moments, not every heading.
15. Use monospace only for IDs, timestamps, actions, JSON, code, keys, and latency.
16. Do not use uppercase text for long sentences.
17. Do not make every label bold, tracked, or tiny.
18. Never reduce essential copy to low-contrast tertiary text.

## Layout and surfaces

19. Prefer ruled sections, record rows, drawers, and clear whitespace over repeated rounded cards.
20. A panel needs a structural reason to exist. Do not wrap every statistic or paragraph in a card.
21. Use modest corner radii. Do not default every element to `rounded-xl`.
22. Do not use shadows on ordinary page sections. Reserve elevation for dialogs, drawers, menus, and other floating layers.
23. Keep the page title and its primary action visually close.
24. Keep dense operational data scannable. Do not use oversized marketing spacing inside tables or logs.
25. Use asymmetry intentionally, but never at the expense of reading order or keyboard order.
26. Keep long prose and forms within a readable measure.

## Navigation

27. Navigation labels must describe user intent and remain understandable when icons are removed.
28. The active route needs a non-color cue such as a rule, weight, or position change.
29. Collapsed and mobile navigation must remain fully keyboard accessible.
30. Never hide the current organization, account context, or sign-out path behind an unlabeled icon.

## Components

31. Use the installed shadcn/Radix primitives for dialogs, drawers, menus, popovers, tabs, fields, and focus management.
32. Use `lucide-react` for product icons; do not mix icon families.
33. Use `framer-motion` for shared state transitions, not for decoration.
34. Use `recharts` only when a chart conveys an actionable comparison or trend.
35. Do not bring in React Bits or Aceternity UI defaults without adapting them to the Axiom token system and removing their generic effects.
36. Prefer semantic component names such as `RecordRow`, `StatusMark`, `PageHeader`, `DetailDrawer`, and `SectionLabel`.
37. A custom component must preserve the existing API and auth behavior; visual refactoring must not silently change data semantics.

## Data integrity and trust

38. Never show a success toast for an action that was not persisted.
39. Never fabricate metrics, activity, policy results, or availability to make a page look finished.
40. Never expose secrets or raw invitation/API-key tokens in ordinary UI.
41. Destructive actions require an accessible alert dialog with the object name and consequence.
42. Errors need a recovery action or an explanation of what the user can do next.
43. Loading, empty, filtered-empty, error, forbidden, and success are different states and need different copy.
44. Preserve entered form data after a recoverable error.
45. Keep authorization outcomes and audit evidence attributable: show actor, target, policy, reason, and time when available.

## Motion

46. Use short, calm transitions for page entry, list reveal, drawers, and result changes.
47. Do not use infinite animation in dashboards, tables, logs, settings, or forms.
48. Do not animate a control in a way that delays clicking, typing, submitting, or reading.
49. Do not use pulsing dots, floating blobs, rotating icons, parallax, or marquee text as a substitute for product feedback.
50. Honor `prefers-reduced-motion: reduce` and remove repeated or transform-heavy motion.
51. Motion should explain where content came from, what changed, or what completed.

## Forms and feedback

52. Labels must be visible; placeholders are not labels.
53. Use sentence case and tell the user what a field means, not what the database calls it.
54. Inline validation is primary. Toasts may confirm or summarize, but must not carry the only error detail.
55. Keep primary submit actions visually distinct from cancel and destructive actions.
56. Make copy, reveal, revoke, assign, and remove outcomes explicit.
57. Keep focus visible and focus trapped in modal contexts.

## Responsive and accessibility

58. Design mobile navigation as a sheet, not a shrunken desktop sidebar.
59. Convert data tables into labeled record rows when comparison is no longer readable.
60. Do not rely on hover to reveal essential actions on touch devices.
61. Icon-only buttons require accessible names and tooltips.
62. Test keyboard order, focus visibility, text zoom, contrast, and narrow widths before signoff.
63. Do not use a status color with insufficient contrast against its wash.
64. Maintain logical heading order and landmark structure on every route.

## Anti-generic review

65. Remove any element that could be copied into an unrelated SaaS template without changing its meaning.
66. If a visual uses a gradient, glow, floating orb, arbitrary stat card, or decorative dashboard illustration, justify it in terms of Axiom’s authorization story—or remove it.
67. If two pages solve different user tasks but have identical composition, differentiate their information hierarchy, not merely their accent color.
68. Prefer a specific label, record, example, or explanation over decorative copy.
69. Every screen should have one memorable authored detail: a marginal note, a clear decision sentence, a strong rule, a contextual status line, or a concise technical annotation.
70. The final test is not “does it look polished?” It is “can an operator understand what happened, what matters, and what they can safely do next?”