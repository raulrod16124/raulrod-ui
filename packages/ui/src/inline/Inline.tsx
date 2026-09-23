import type { InlineProps } from "./Inline.types.js";

import { forwardRef } from "react";

import { cx } from "../utils/cx.js";
import { flexClasses } from "../utils/flex.js";

/**
 * Horizontal (`flex-direction: row`) layout primitive with token-typed
 * `gap` (RRU-031). Renders a plain `div`; wrap it in the semantic element
 * your content needs. Styling lives entirely in `Inline.css` (`rr-*` classes
 * over CSS custom properties, ADR-003).
 */
export const Inline = forwardRef<HTMLDivElement, InlineProps>(function Inline(
  { gap, align, justify, wrap, className, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      className={cx(
        "rr-inline",
        flexClasses("rr-inline", { gap, align, justify, wrap }),
        className,
      )}
    />
  );
});
Inline.displayName = "Inline";
