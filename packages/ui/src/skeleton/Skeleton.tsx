import type { SkeletonProps, SkeletonVariant } from "./Skeleton.types.js";

import { forwardRef } from "react";

import { cx } from "../utils/cx.js";
import { createVariants } from "../utils/variants.js";

/** Exhaustive axis maps (RRU-040 pattern): adding a `SkeletonVariant` member
 *  breaks compilation here until its suffix exists — and the authored CSS
 *  contract check fails until the matching `rr-skeleton--*` selector is
 *  written. */
const skeletonModifiers: Readonly<{
  variant: Record<SkeletonVariant, string>;
}> = {
  variant: {
    rectangle: "rectangle",
    circle: "circle",
  },
};

const skeletonClasses = createVariants(skeletonModifiers);

/**
 * Loading placeholder (RRU-062). Renders a static, non-interactive `<span>`
 * (Badge precedent) that shimmers while content loads: a token-governed block
 * filled with `color.background.sunken` over which a `::after` band of
 * `color.background.default` sweeps on a `motion.duration.slow` loop — killed
 * entirely under `prefers-reduced-motion` (DoD #1, RRU-024 contract). No
 * ARIA: the placeholder is decorative; the loading state is announced by the
 * composing container (`aria-busy`, shared states RRU-067) or `Progress`
 * (RRU-063). Styling lives entirely in `Skeleton.css` (`rr-*` classes over CSS
 * custom properties, ADR-003).
 */
export const Skeleton = forwardRef<HTMLSpanElement, SkeletonProps>(function Skeleton(
  { variant = "rectangle", className, ...props },
  ref,
) {
  return (
    <span
      {...props}
      ref={ref}
      className={cx("rr-skeleton", skeletonClasses("rr-skeleton", { variant }), className)}
    />
  );
});
Skeleton.displayName = "Skeleton";
