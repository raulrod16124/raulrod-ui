import type { TextProps } from "./Text.types.js";

import { forwardRef } from "react";

import { cx } from "../utils/cx.js";
import { typographyClasses } from "../utils/typography.js";

/**
 * Typographic primitive (RRU-032) rendering a `span`. Styled entirely from
 * `font.*` and `color.text.*` tokens (`Text.css`), never arbitrary values
 * (docs/typography.md §1, ADR-003). No polymorphic `as` prop in the MVP
 * (closed decision, RRU-031): wrap the Text in the semantic element your
 * content needs (`<p>`, `<label>`, …).
 */
export const Text = forwardRef<HTMLSpanElement, TextProps>(function Text(
  { size, weight, color, className, ...props },
  ref,
) {
  return (
    <span
      {...props}
      ref={ref}
      className={cx("rr-text", typographyClasses("rr-text", { size, weight, color }), className)}
    />
  );
});
Text.displayName = "Text";
