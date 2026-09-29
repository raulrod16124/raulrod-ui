import type { InputProps, InputSize } from "./Input.types.js";

import { forwardRef } from "react";

import { cx } from "../utils/cx.js";
import { createVariants } from "../utils/variants.js";

/** Exhaustive axis maps (RRU-040 pattern): adding an `InputSize` member breaks
 *  compilation here until its suffix exists — and the authored CSS contract
 *  check fails until the matching `rr-input--size-*` selector is written. */
const inputModifiers: Readonly<{
  size: Record<InputSize, string>;
}> = {
  size: {
    sm: "size-sm",
    md: "size-md",
    lg: "size-lg",
  },
};

const inputClasses = createVariants(inputModifiers);

/**
 * Base single-line text field (RRU-043). Renders an `<input>`; `size` defaults
 * to `md` in the CSS base class (component-pattern.mdx §4.1). The invalid
 * state is driven by the native `aria-invalid` attribute — no prop, no dual
 * activation path (RRU-043 decision): pass `aria-invalid` and the
 * `.rr-input[aria-invalid="true"]` rule applies the danger border. Styling
 * lives entirely in `Input.css` (`rr-*` classes over CSS custom properties,
 * ADR-003); the resting border uses `color.border.strong` because §6.2 of
 * color.md forbids `border.default` on interactive control boundaries.
 *
 * Native `type`/`name`/`value`/`onChange`/`placeholder`/`disabled`/ARIA pass
 * through; `className` is merged via `cx`.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { size, className, ...props },
  ref,
) {
  return (
    <input
      {...props}
      ref={ref}
      className={cx("rr-input", inputClasses("rr-input", { size }), className)}
    />
  );
});
Input.displayName = "Input";
