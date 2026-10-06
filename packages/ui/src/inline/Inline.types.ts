import type { Styles } from "../style-tokens.generated.js";
import type { FlexAlign, FlexJustify } from "../utils/flex.js";
import type { Spacing } from "@raulrod/tokens";
import type { HTMLAttributes } from "react";

/**
 * Props of {@link Inline}: a horizontal (`row`) flex container for laying out
 * children inline with token-typed spacing. Extends the native
 * `div` attributes, so `className`, `style`, ARIA and events pass through
 * untouched; the component merges `className` with its own `rr-inline`
 * classes via `cx`.
 *
 * No `as`/polymorphic prop in the MVP (closed decision): wrap the
 * Inline in the semantic element you need (`<nav>`, `<ul>`, …).
 */
export interface InlineProps extends HTMLAttributes<HTMLDivElement> {
  /** Gap between children, typed against the `Spacing` token union.
   *  Defaults to `space-4` (16px) via the base class in `Inline.css`. */
  gap?: Spacing;
  /** Cross-axis alignment (`align-items`; vertical for a row). */
  align?: FlexAlign;
  /** Main-axis distribution (`justify-content`). */
  justify?: FlexJustify;
  /** Allows items to wrap onto a new line (`flex-wrap`). */
  wrap?: boolean;
  /** Token overrides for this component instance. Keys are the CSS tokens the component consumes. */
  styles?: Styles<"inline">;
}
