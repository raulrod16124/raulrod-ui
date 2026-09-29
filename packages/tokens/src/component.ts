// Component tokens: added ONLY when a real component needs them (RRU-026).
// Naming: dot-separated `component.variant.property(.state)` (taxonomy.ts
// ComponentKey, min 3 segments). Values MUST reference an existing semantic
// `color.*` token — the layer never reads a primitive or a raw hex (token-set
// rule: components consume semantics, token-taxonomy.md §1/§2). Emission turns
// each ref into a `var(--rr-…)` alias (RRU-024/emit-css.mjs), so theming
// (light/dark) stays in the semantic layer and per-component override works.
// Two component tokens may NEVER share the same semantic target: an alias
// always stays a real consumed state (check-contrast.mjs de-duplication rule).
//
// Scope today: the Button states its consuming component actually paints
// (RRU-041). `button.primary.background.disabled` keeps the RRU-026 promise —
// its semantic (`color.action.disabled.background`) was created in this card
// together with the real palette; only primary gets a disabled alias (other
// variants read the semantic directly in Button.css — a shared target would
// break the de-duplication rule). outline/ghost/link variants likewise read
// semantics directly (`color.border.*`, `color.text.*`, `color.action.*`) and
// own no aliases: no distinct semantics exist for them yet, and inventing
// per-variant semantics nobody else consumes would be the speculative layer
// §9 forbids. Add keys here when a variant gains a state worth overriding.
import type { semantic } from "./semantic.js";
import type { ComponentKey } from "./taxonomy.js";

/** Semantic color intents (`color.*`), the only values an atomic component token
 *  may reference — enforced at compile time via `satisfies` below. */
type SemanticColorKey = Extract<keyof typeof semantic, `color.${string}`>;

export const component = {
  "button.primary.background": "color.action.primary.background",
  "button.primary.background.hover": "color.action.primary.background.hover",
  "button.primary.background.active": "color.action.primary.background.active",
  "button.primary.background.disabled": "color.action.disabled.background",
  "button.primary.text": "color.action.primary.text",
  "button.secondary.background": "color.action.secondary.background",
  "button.secondary.background.hover": "color.action.secondary.background.hover",
  "button.secondary.text": "color.action.secondary.text",
  "button.destructive.background": "color.action.destructive.background",
  "button.destructive.background.hover": "color.action.destructive.background.hover",
  "button.destructive.text": "color.action.destructive.text",
} as const satisfies Record<ComponentKey, SemanticColorKey>;
