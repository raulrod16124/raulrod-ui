import type { HeadingLevel, HeadingProps } from "./Heading.types.js";
import type { TypeScale } from "@raulrod/tokens";

import { createElement, forwardRef } from "react";

import { cx } from "../utils/cx.js";
import { typographyClasses } from "../utils/typography.js";

/** Default font size per heading level (docs/typography.md §4: monotonic
 *  hierarchy, all values from the `TypeScale` token union). */
const sizeByLevel: Record<HeadingLevel, TypeScale> = {
  h1: "font.size.4xl",
  h2: "font.size.3xl",
  h3: "font.size.2xl",
  h4: "font.size.xl",
  h5: "font.size.lg",
  h6: "font.size.base",
};

/**
 * Headline primitive (RRU-032) rendering `h1`–`h6` with a correct hierarchy by
 * default: the visual size derives from the rendered tag (`as`, default `h2`).
 * Styled entirely from `font.*` and `color.text.*` tokens (`Heading.css`),
 * never arbitrary values (docs/typography.md §1, ADR-003).
 */
export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(function Heading(
  { as = "h2", color, className, ...props },
  ref,
) {
  return createElement(as, {
    ...props,
    ref,
    className: cx(
      "rr-heading",
      typographyClasses("rr-heading", { size: sizeByLevel[as], color }),
      className,
    ),
  });
});
Heading.displayName = "Heading";
