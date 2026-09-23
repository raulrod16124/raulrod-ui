import type { HTMLAttributes } from "react";

/**
 * Props of {@link VisuallyHidden}: a `span` that stays readable by screen
 * readers while being visually hidden (sr-only technique, RRU-033). Extends
 * the native `span` attributes, so `className`, `style`, ARIA and events pass
 * through untouched; the component merges `className` with its own
 * `rr-visually-hidden` classes via `cx`.
 *
 * No `as`/polymorphic prop in the MVP (closed decision, RRU-031): for a skip
 * link, wrap the component in the anchor —
 * `<a href="#main"><VisuallyHidden focusable>Skip to main</VisuallyHidden></a>`
 * — the `focusable` variant reveals the text once focus lands on (or inside)
 * it (`:focus` / `:active` / `:focus-within`, `VisuallyHidden.css`, WCAG G1).
 */
export interface VisuallyHiddenProps extends HTMLAttributes<HTMLSpanElement> {
  /** When `true`, the element stays visually hidden while unfocused and
   *  reveals itself as soon as it (or a focused child) receives focus, for
   *  skip-link utilities. Defaults to `false`. */
  focusable?: boolean;
}
