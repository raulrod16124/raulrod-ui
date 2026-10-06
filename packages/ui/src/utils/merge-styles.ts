import type { CSSProperties } from "react";

/**
 * Merge consumer token overrides (`styles`) onto the native `style` prop.
 *
 * Order: component base style (none by default) → `styles` token map →
 * consumer `style` wins if a key collides. This keeps `styles` as a typed
 * shortcut for CSS variables while leaving the escape hatch of the raw
 * `style` prop intact.
 */
export function mergeStyles(
  overrides: Record<string, string> | undefined,
  base: CSSProperties | undefined,
): CSSProperties | undefined {
  if (overrides === undefined || Object.keys(overrides).length === 0) {
    return base;
  }

  if (base === undefined) {
    return overrides as CSSProperties;
  }

  return { ...base, ...overrides };
}
