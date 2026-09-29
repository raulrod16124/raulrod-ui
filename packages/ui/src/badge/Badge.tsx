import type { BadgeProps, BadgeVariant } from "./Badge.types.js";

import { forwardRef } from "react";

import { cx } from "../utils/cx.js";
import { createVariants } from "../utils/variants.js";

/** Exhaustive axis maps (RRU-040 pattern): adding a `BadgeVariant` member
 *  breaks compilation here until its suffix exists — and the authored CSS
 *  contract check fails until the matching `rr-badge--*` selector is written. */
const badgeModifiers: Readonly<{
  variant: Record<BadgeVariant, string>;
}> = {
  variant: {
    neutral: "neutral",
    success: "success",
    warning: "warning",
    destructive: "destructive",
    info: "info",
  },
};

const badgeClasses = createVariants(badgeModifiers);

/**
 * Status indicator (RRU-049). Renders a static inline `<span>` (semantic text,
 * non-interactive: no focus, no keyboard, no ARIA — the content IS the label)
 * with a semantic status background + text read from the alert tint tokens
 * (color.md §5.3/§6.1). `variant` defaults to `neutral` (reuses
 * `color.background.sunken` + `color.text.muted`, AA verified) in JS; styling
 * lives entirely in `Badge.css` (`rr-*` classes over CSS custom properties,
 * ADR-003). There is no `size` axis (card scope, §9).
 *
 * The tint backgrounds in dark theme flip to the dark tint step (e.g.
 * `green-950`) — theme changes the value, never the intent (§9/decisión #4).
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { variant = "neutral", className, children, ...props },
  ref,
) {
  return (
    <span
      {...props}
      ref={ref}
      className={cx("rr-badge", badgeClasses("rr-badge", { variant }), className)}
    >
      {children}
    </span>
  );
});
Badge.displayName = "Badge";
