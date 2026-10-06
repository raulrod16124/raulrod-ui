import type { Styles } from "../style-tokens.generated.js";
import type { ColorText, FontWeight, TypeScale } from "@raulrod/tokens";
import type { HTMLAttributes } from "react";

/**
 * Props of {@link Text}: a `span` styled from typography tokens.
 * Extends the native `span` attributes, so `className`, `style`, ARIA and
 * events pass through untouched; the component merges `className` with its
 * own `rr-text` classes via `cx`. Defaults (via `Text.css`): `font.size.base`,
 * `font.weight.regular`, `color.text.primary`, `font.leading.normal`.
 *
 * No `as`/polymorphic prop in the MVP (closed decision): render a
 * Text inside the semantic element you need (`<p>`, `<label>`, …).
 */
export interface TextProps extends HTMLAttributes<HTMLSpanElement> {
  /** Font size from the `TypeScale` token union. */
  size?: TypeScale;
  /** Font weight from the `FontWeight` token union. */
  weight?: FontWeight;
  /** Text color from the `ColorText` token union (theme-aware). */
  color?: ColorText;
  /** Token overrides for this component instance. Keys are the CSS tokens the component consumes. */
  styles?: Styles<"text">;
}
