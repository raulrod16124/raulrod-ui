// Shared variant-map pattern for components (RRU-040). Internal module: not
// exported from the package root (docs/typescript.md §4). Codifies the base
// component convention of the design system (docs/component-pattern.mdx):
// variant-like axes (`variant`, `size`, `gap`, `color`, …) are typed unions
// (token-derived when one exists, RRU-025) and mapped to `rr-*` modifier
// suffixes through exhaustive `Record<Union, string>` maps. The maps are the
// single source for the derived `VariantProps<M>` type, so nothing is
// duplicated by hand. Adding a union member breaks compilation here until the
// map entry exists — and the authored CSS contract check (playbook §4) fails
// until the matching `rr-*--*` modifier selector is authored — fail loud
// instead of silently falling back to a default style. Deliberately minimal:
// NO compound variants, defaults or conditionals — those are the prop-explosion
// and cva features the convention excludes (RRU-040 / component-pattern.mdx);
// defaults live in CSS base classes, boolean flags are explicit `cx` conditions
// outside this helper (precedents: `wrap` in flex, `focusable` in
// VisuallyHidden).
import type { CxValue } from "./cx.js";

import { cx } from "./cx.js";

/** Axis maps of a component: key = axis prop name, value = exhaustive
 *  `Record<Union, suffix>` mapping each union member to the `rr-*` modifier
 *  suffix it produces (e.g. `{ sm: "size-sm" }` → `rr-button--size-sm`). */
export type VariantMaps = Record<string, Readonly<Record<string, string>>>;

/** Public variant props of a component, derived from its axis maps: one
 *  optional prop per axis, typed as the union of that axis' map keys. */
export type VariantProps<M extends VariantMaps> = {
  [K in keyof M]?: Extract<keyof M[K], string>;
};

/**
 * Creates a class-name builder for the given axis maps. The returned builder
 * joins the `rr-*` modifier classes that correspond to the provided values,
 * in the insertion order of the maps, dropping `undefined` axes. `root` is the
 * component's base class (`rr-button`, `rr-stack`, …) and is expected to be a
 * per-component constant at the call site.
 */
export function createVariants<const M extends VariantMaps>(
  maps: M,
): (root: string, props: VariantProps<M>) => string {
  return (root, props) => {
    const classes: CxValue[] = [];
    for (const [axis, map] of Object.entries(maps)) {
      // SAFE: `axis` is produced by `Object.entries` over the same `maps`, so
      // reading `props[axis]` only reaches declared axes; the cast re-widens a
      // correlated lookup TypeScript cannot track across `Object.entries`.
      const value = (props as Record<string, string | undefined>)[axis];
      if (value !== undefined) classes.push(`${root}--${map[value]}`);
    }
    return cx(...classes);
  };
}
