import type { HTMLAttributes } from "react";

/**
 * Visual variant of {@link Badge} (RRU-049). A local union, not derived from
 * `component.ts` (RRU-026): the component layer has no keys for the status
 * tint families and deriving the variant from tokens would force exactly the
 * speculative layer §9 forbids (component-pattern.mdx §8, ButtonVariant
 * precedent).
 *
 * `neutral` is the default and reuses the existing `color.background.sunken` +
 * `color.text.muted` pair (AA verified, color.md §6.1); the four status
 * variants consume the alert tint tokens deferred from RRU-021
 * (`color.background.*` + `color.text.*`, color.md §5.3/§6.1). The red variant
 * is `destructive`, coherent with Button and with the tint token naming —
 * "danger" only exists as the bright error text (`color.text.danger`, RRU-044),
 * not as a tint family.
 */
export type BadgeVariant = "neutral" | "success" | "warning" | "destructive" | "info";

/**
 * Props of {@link Badge} (RRU-049): a static, non-interactive status
 * indicator rendered as an inline `<span>` (semantic text — nothing to focus,
 * no ARIA required). `variant` defaults to `neutral` in JS (Button `variant`
 * precedent); there is deliberately no `size` axis — the card only asks for
 * semantic variants and §9 forbids speculative features; if a real need
 * appears (e.g. in Table cells, RRU-065) it is added backward-compatibly in a
 * minor.
 *
 * `className`, `style`, ARIA, events and `data-*` pass through untouched; the
 * component merges `className` with its own `rr-*` classes via `cx`.
 */
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Semantic variant; defaults to `neutral` (JS default, Button precedent). */
  variant?: BadgeVariant;
}
