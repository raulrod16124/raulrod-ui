// Component tokens: added ONLY when a real component needs them (RRU-026).
// Naming: dot-separated `component.variant.property(.state)` (taxonomy.ts
// ComponentKey, min 3 segments). Values MUST reference an existing semantic
// `color.*` token — the layer never reads a primitive or a raw hex (token-set
// rule: components consume semantics, token-taxonomy.md §1/§2). Emission turns
// each ref into a `var(--rr-…)` alias (RRU-024/emit-css.mjs), so theming
// (light/dark) stays in the semantic layer and per-component override works.
//
// Scope today: `button.primary.{background,hover}` — exactly the states backed
// by a real semantic (`color.action.primary.background(.hover)`, RRU-021). No
// speculative tokens: `button.primary.background.disabled` is deferred to RRU-041
// (no semantic disabled value yet, and creating one without a consuming component
// would be the speculative layer §9 forbids; WCAG 1.4.3 exempts disabled controls
// from contrast). `button.secondary.*`, `button.destructive.*`, `dropdown.*`, …
// only when their component uses them.
import type { semantic } from "./semantic.js";
import type { ComponentKey } from "./taxonomy.js";

/** Semantic color intents (`color.*`), the only values an atomic component token
 *  may reference — enforced at compile time via `satisfies` below. */
type SemanticColorKey = Extract<keyof typeof semantic, `color.${string}`>;

export const component = {
  "button.primary.background": "color.action.primary.background",
  "button.primary.background.hover": "color.action.primary.background.hover",
} as const satisfies Record<ComponentKey, SemanticColorKey>;
