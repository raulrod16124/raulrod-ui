import type { StackProps } from "./Stack.types.js";

import { forwardRef } from "react";

import { cx } from "../utils/cx.js";
import { flexClasses } from "../utils/flex.js";

/**
 * Vertical (`flex-direction: column`) layout primitive with token-typed
 * `gap` (RRU-031). Renders a plain `div`; wrap it in the semantic element
 * your content needs. Styling lives entirely in `Stack.css` (`rr-*` classes
 * over CSS custom properties, ADR-003).
 */
export const Stack = forwardRef<HTMLDivElement, StackProps>(function Stack(
  { gap, align, justify, wrap, className, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      className={cx("rr-stack", flexClasses("rr-stack", { gap, align, justify, wrap }), className)}
    />
  );
});
Stack.displayName = "Stack";
