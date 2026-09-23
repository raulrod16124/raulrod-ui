// Shared typography modifier helpers for Text/Heading (RRU-032). Internal
// module: not exported from the package root (docs/typescript.md §4).
// `size`/`weight`/`color` are typed against the token unions (RRU-025) through
// exhaustive Records, so adding a font.*/color.text.* token to
// `@raulrod/tokens` breaks compilation here until the matching `rr-*--*`
// modifier exists in the CSS files — fail loud instead of silently falling
// back to a default style.
import type { ColorText, FontWeight, TypeScale } from "@raulrod/tokens";

import { cx } from "./cx.js";

/** Root class names the helper can decorate (one per typography component). */
export type TypographyRoot = "rr-text" | "rr-heading";

const sizeModifiers: Record<TypeScale, string> = {
  "font.size.2xs": "size-2xs",
  "font.size.xs": "size-xs",
  "font.size.sm": "size-sm",
  "font.size.base": "size-base",
  "font.size.lg": "size-lg",
  "font.size.xl": "size-xl",
  "font.size.2xl": "size-2xl",
  "font.size.3xl": "size-3xl",
  "font.size.4xl": "size-4xl",
  "font.size.5xl": "size-5xl",
};

const weightModifiers: Record<FontWeight, string> = {
  "font.weight.regular": "weight-regular",
  "font.weight.medium": "weight-medium",
  "font.weight.semibold": "weight-semibold",
  "font.weight.bold": "weight-bold",
};

const colorModifiers: Record<ColorText, string> = {
  "color.text.primary": "color-primary",
  "color.text.muted": "color-muted",
  "color.text.inverse": "color-inverse",
};

/** Typography modifier props shared by Text and Heading (RRU-032 API surface). */
export interface TypographyModifiers {
  /** Font size, typed against the `TypeScale` token union. */
  size?: TypeScale;
  /** Font weight, typed against the `FontWeight` token union. */
  weight?: FontWeight;
  /** Text color, typed against the `ColorText` token union. */
  color?: ColorText;
}

/** Joins the `rr-*` modifier classes for a typography component. */
export function typographyClasses(root: TypographyRoot, modifiers: TypographyModifiers): string {
  const { size, weight, color } = modifiers;
  return cx(
    size !== undefined && `${root}--${sizeModifiers[size]}`,
    weight !== undefined && `${root}--${weightModifiers[weight]}`,
    color !== undefined && `${root}--${colorModifiers[color]}`,
  );
}
