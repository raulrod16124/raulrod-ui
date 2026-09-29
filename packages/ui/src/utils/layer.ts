// Semantic z-index layer helper (RRU-052). Consumes the `z.*` tokens emitted
// as CSS custom properties `--rr-z-{base|overlay|modal|toast}` (RRU-023/024)
// and turns a `ZIndex` label into the token reference overlays must use.
// Internal module: never exported from the package root (frontera §24).
//
// Layering contract (RRU-023): base(0) < overlay(100) < modal(200) < toast(300).
// Stacking is resolved by LOCAL composition per the semantic scale — each
// overlay opts into its level with its own token — not by a global manager
// (ADR-004, alternative D). Overlaying two modals means each child uses its
// own `z.modal` var and its stacking wins within the same context, matching
// how the token scale is consumed by SSR-safe composition.
import type { ZIndex } from "@raulrod/tokens";

/** The four semantic layers in stacking order (token label → emitted var). */
export const LAYER_ORDER: readonly ZIndex[] = [
  "z.base",
  "z.overlay",
  "z.modal",
  "z.toast",
] as const;

/**
 * Returns the CSS custom property reference for the given semantic layer,
 * e.g. `z.modal` → `var(--rr-z-modal)`. Components use this in their
 * `rr-*` stylesheet (no inline styles, ADR-003), so stacking stays driven by
 * the single token source of truth.
 */
export function resolveLayerVar(layer: ZIndex): string {
  return `var(--rr-${layer.replace(".", "-")})`;
}
