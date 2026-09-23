// Shared flex layout helpers for Stack/Inline (RRU-031). Internal module: not
// exported from the package root (docs/typescript.md §4). `gap` is typed
// against the `Spacing` token union (RRU-025) through an exhaustive
// `Record`, so adding a spacing step to `@raulrod/tokens` breaks compilation
// here until the matching `rr-*-gap-*` modifier exists in the CSS files —
// fail loud instead of silently falling back to the default gap. `align`/
// `justify` values are CSS layout keywords, not design values: they have no
// token counterpart by design (ADR-003 / RRU-031 notes). The axis maps and the
// derived props type follow the base component pattern (RRU-040): variants are
// built through `createVariants` and `VariantProps` from `utils/variants`.
import type { Spacing } from "@raulrod/tokens";

import { cx } from "./cx.js";
import { createVariants, type VariantProps } from "./variants.js";

/** Cross-axis alignment (`align-items`) shared by both layout primitives. */
export type FlexAlign = "start" | "center" | "end" | "stretch" | "baseline";

/** Main-axis distribution (`justify-content`) shared by both layout primitives. */
export type FlexJustify = "start" | "center" | "end" | "between" | "around" | "evenly";

/** Root class names the helper can decorate (one per layout primitive). */
export type FlexRoot = "rr-stack" | "rr-inline";

const gapModifiers: Record<Spacing, string> = {
  "space-0": "gap-0",
  "space-1": "gap-1",
  "space-2": "gap-2",
  "space-3": "gap-3",
  "space-4": "gap-4",
  "space-5": "gap-5",
  "space-6": "gap-6",
  "space-8": "gap-8",
  "space-10": "gap-10",
  "space-12": "gap-12",
  "space-16": "gap-16",
};

const alignModifiers: Record<FlexAlign, string> = {
  start: "align-start",
  center: "align-center",
  end: "align-end",
  stretch: "align-stretch",
  baseline: "align-baseline",
};

const justifyModifiers: Record<FlexJustify, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
  evenly: "justify-evenly",
};

const flexModifiers: Readonly<{
  gap: Record<Spacing, string>;
  align: Record<FlexAlign, string>;
  justify: Record<FlexJustify, string>;
}> = {
  gap: gapModifiers,
  align: alignModifiers,
  justify: justifyModifiers,
};

/** Layout modifier props shared by Stack and Inline (RRU-031 API surface).
 *  The three token-typed axes are derived from the maps (`VariantProps<typeof
 *  flexModifiers>`); `wrap` is a boolean flag handled as an explicit `cx`
 *  condition, outside the variant helper (RRU-040 convention). */
export type FlexModifiers = VariantProps<typeof flexModifiers> & { wrap?: boolean };

const flexVariantClasses = createVariants(flexModifiers);

/** Joins the `rr-*` modifier classes for a flex layout primitive. */
export function flexClasses(root: FlexRoot, modifiers: FlexModifiers): string {
  const { wrap, ...variantProps } = modifiers;
  return cx(flexVariantClasses(root, variantProps), wrap === true && `${root}--wrap`);
}
