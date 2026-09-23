// Shared flex layout helpers for Stack/Inline (RRU-031). Internal module: not
// exported from the package root (docs/typescript.md §4). `gap` is typed
// against the `Spacing` token union (RRU-025) through an exhaustive
// `Record`, so adding a spacing step to `@raulrod/tokens` breaks compilation
// here until the matching `rr-*-gap-*` modifier exists in the CSS files —
// fail loud instead of silently falling back to the default gap. `align`/
// `justify` values are CSS layout keywords, not design values: they have no
// token counterpart by design (ADR-003 / RRU-031 notes).
import type { Spacing } from "@raulrod/tokens";

import { cx } from "./cx.js";

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

/** Layout modifier props shared by Stack and Inline (RRU-031 API surface). */
export interface FlexModifiers {
  gap?: Spacing;
  align?: FlexAlign;
  justify?: FlexJustify;
  wrap?: boolean;
}

/** Joins the `rr-*` modifier classes for a flex layout primitive. */
export function flexClasses(root: FlexRoot, modifiers: FlexModifiers): string {
  const { gap, align, justify, wrap } = modifiers;
  return cx(
    gap !== undefined && `${root}--${gapModifiers[gap]}`,
    align !== undefined && `${root}--${alignModifiers[align]}`,
    justify !== undefined && `${root}--${justifyModifiers[justify]}`,
    wrap === true && `${root}--wrap`,
  );
}
