import type { ColorText } from "@raulrod/tokens";
import type { HTMLAttributes } from "react";

/** Heading levels supported by {@link Heading} (RRU-032). */
export type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

/**
 * Props of {@link Heading} (RRU-032): a headline `h1`–`h6` whose visual size
 * derives from the rendered level (`as`, default `h2`) — correct hierarchy by
 * default (DoD RRU-032). Extends the native heading attributes, so
 * `className`, `style`, ARIA and events pass through untouched; the component
 * merges `className` with its own `rr-heading` classes via `cx`.
 *
 * `as` is intentionally limited to the six heading tags (the one accepted
 * polymorphism in the MVP, required by this card; RRU-031); No generic
 * `asChild`/polymorphic support.
 */
export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  /** Rendered heading level; also drives the default font size (h1 largest,
   *  h6 smallest). Defaults to `h2`. */
  as?: HeadingLevel;
  /** Text color from the `ColorText` token union (theme-aware). */
  color?: ColorText;
}
