import type { InlineProps } from "./Inline.types.js";

import { forwardRef } from "react";

import { cx } from "../utils/cx.js";
import { flexClasses } from "../utils/flex.js";
import { mergeStyles } from "../utils/merge-styles.js";

/**
 * Horizontal (`flex-direction: row`) layout primitive with token-typed
 * `gap`. Renders a plain `div`; wrap it in the semantic element
 * your content needs. Styling lives entirely in `Inline.css` (`rr-*` classes
 * over CSS custom properties, ADR-003).
 */
export const Inline = forwardRef<HTMLDivElement, InlineProps>(function Inline(
  { gap, align, justify, wrap, className, style, styles, ...props },
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
      style={mergeStyles(styles, style)}
    />
  );
});
Inline.displayName = "Inline";
