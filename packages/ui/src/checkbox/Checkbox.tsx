import type { CheckboxProps, CheckboxSize } from "./Checkbox.types.js";

import { forwardRef } from "react";

import { cx } from "../utils/cx.js";
import { createVariants } from "../utils/variants.js";

/** Exhaustive axis maps (RRU-040 pattern): adding a `CheckboxSize` member
 *  breaks compilation here until its suffix exists — and the authored CSS
 *  contract check fails until the matching `rr-checkbox--size-*` selector is
 *  written. */
const checkboxModifiers: Readonly<{
  size: Record<CheckboxSize, string>;
}> = {
  size: {
    sm: "size-sm",
    md: "size-md",
    lg: "size-lg",
  },
};

const checkboxClasses = createVariants(checkboxModifiers);

/**
 * Native tri-state checkbox (RRU-046). Renders a single `<input type="checkbox">`
 * (Input/Textarea precedent) so all native behavior — Space/click toggling,
 * `checked`/`defaultChecked`, `:checked`/`:indeterminate` pseudo-classes,
 * `disabled`, pass-through events and A11y — comes for free and
 * FormField (RRU-044) wiring lands on the real control via the spread.
 *
 * `indeterminate` bridges the ARIA contract to the native DOM state (DoD #1):
 * the rendered attribute is `aria-checked="mixed"` (SSR-observable), and a
 * merged callback ref sets the native `indeterminate` property (no attribute
 * exists for it) so the browser paints the dash and announces tri-state. This
 * is SSR-safe: the property write is client-only, the attribute is serialized,
 * so server and client markup always match.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { indeterminate, size, className, "aria-checked": ariaChecked, ...props },
  ref,
) {
  return (
    <input
      type="checkbox"
      {...props}
      ref={(node) => {
        if (node) node.indeterminate = indeterminate === true;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      }}
      aria-checked={indeterminate ? "mixed" : ariaChecked}
      className={cx("rr-checkbox", checkboxClasses("rr-checkbox", { size }), className)}
    />
  );
});
Checkbox.displayName = "Checkbox";
