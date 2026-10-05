import type { VisuallyHiddenProps } from "./VisuallyHidden.types.js";

import { forwardRef } from "react";

import { cx } from "../utils/cx.js";

/**
 * Accessibility primitive that keeps content present for assistive
 * technology while hiding it visually (sr-only technique): no layout impact,
 * no focus/pointer interception, and the content stays in the accessibility
 * tree — unlike `display: none` / `visibility: hidden`. Used by IconButton,
 * FormField, Switch, etc. for accessible labels and skip-link utilities.
 *
 * No polymorphic `as` prop in the MVP (closed decision): for a skip
 * link, wrap the anchor inside the component —
 * `<VisuallyHidden focusable><a href="#main">Skip to main</a></VisuallyHidden>`
 * — the `focusable` variant reveals the text when a descendant is focused
 * (`:focus-within`, `VisuallyHidden.css`).
 */
export const VisuallyHidden = forwardRef<HTMLSpanElement, VisuallyHiddenProps>(
  function VisuallyHidden({ focusable = false, className, ...props }, ref) {
    return (
      <span
        {...props}
        ref={ref}
        className={cx(
          "rr-visually-hidden",
          focusable && "rr-visually-hidden--focusable",
          className,
        )}
      />
    );
  },
);
VisuallyHidden.displayName = "VisuallyHidden";
