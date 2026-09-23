import type { FlexAlign, FlexJustify } from "../utils/flex.js";
import type { Spacing } from "@raulrod/tokens";
import type { HTMLAttributes } from "react";

/**
 * Props of {@link Stack}: a vertical (`column`) flex container for laying out
 * children with token-typed spacing (RRU-031). Extends the native `div`
 * attributes, so `className`, `style`, ARIA and events pass through untouched;
 * the component merges `className` with its own `rr-stack` classes via `cx`.
 *
 * No `as`/polymorphic prop in the MVP (closed decision, RRU-031): wrap the
 * Stack in the semantic element you need (`<nav>`, `<ul>`, …).
 */
export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  /** Gap between children, typed against the `Spacing` token union.
   *  Defaults to `space-4` (16px) via the base class in `Stack.css`. */
  gap?: Spacing;
  /** Cross-axis alignment (`align-items`). */
  align?: FlexAlign;
  /** Main-axis distribution (`justify-content`; vertical for a column). */
  justify?: FlexJustify;
  /** Allows items to wrap onto a new line (`flex-wrap`). */
  wrap?: boolean;
}
