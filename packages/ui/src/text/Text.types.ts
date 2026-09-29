import type { ColorText, FontWeight, TypeScale } from "@raulrod/tokens";
import type { HTMLAttributes } from "react";

/**
 * Props of {@link Text} (RRU-032): a `span` styled from typography tokens.
 * Extends the native `span` attributes, so `className`, `style`, ARIA and
 * events pass through untouched; the component merges `className` with its
 * own `rr-text` classes via `cx`. Defaults (via `Text.css`): `font.size.base`,
 * `font.weight.regular`, `color.text.primary`, `font.leading.normal`.
 *
 * No `as`/polymorphic prop in the MVP (closed decision, RRU-031): render a
 * Text inside the semantic element you need (`<p>`, `<label>`, …).
 */
export interface TextProps extends HTMLAttributes<HTMLSpanElement> {
  /** Font size from the `TypeScale` token union. */
  size?: TypeScale;
  /** Font weight from the `FontWeight` token union. */
  weight?: FontWeight;
  /** Text color from the `ColorText` token union (theme-aware). */
  color?: ColorText;
}
