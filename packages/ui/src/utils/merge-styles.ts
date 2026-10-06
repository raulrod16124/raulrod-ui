import type { CSSProperties } from "react";

/**
 * Merge `styles` under the consumer's native `style` prop.
 *
 * Call sites pass `mergeStyles(styles, style)`. Order: component base style
 * (none by default) → `styles` → consumer `style` last, so `style` wins if a
 * key collides — the same rule as `cx` and the consumer's `className`
 * (component-pattern.mdx §5.1).
 *
 * `styles` carries two key families (ADR-009 amendment): the component's own
 * `--rr-*` tokens and standard CSS properties (`color`, `zIndex`, …). Both are
 * plain keys in a style object, so the merge is a spread — no filtering, no
 * runtime validation; the gate is the `Styles` type.
 */
export function mergeStyles(
  styles: CSSProperties | undefined,
  style: CSSProperties | undefined,
): CSSProperties | undefined {
  if (styles === undefined || Object.keys(styles).length === 0) {
    return style;
  }

  if (style === undefined) {
    return styles;
  }

  return { ...styles, ...style };
}
