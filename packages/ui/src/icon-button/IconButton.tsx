import type { IconButtonProps, IconButtonSize, IconButtonVariant } from "./IconButton.types.js";

import { forwardRef } from "react";

import { Loader2 } from "@raulrod/icons";

import { cx } from "../utils/cx.js";
import { createVariants } from "../utils/variants.js";

/** Exhaustive axis maps (RRU-040 pattern): same guarantee as Button — adding
 *  a `IconButtonVariant`/`IconButtonSize` member breaks compilation here until
 *  its suffix exists, and the authored CSS contract check (check-icon-button.mjs)
 *  fails until the matching `rr-*--*` selector is written. */
const iconButtonModifiers: Readonly<{
  variant: Record<IconButtonVariant, string>;
  size: Record<IconButtonSize, string>;
}> = {
  variant: {
    primary: "primary",
    secondary: "secondary",
    outline: "outline",
    ghost: "ghost",
    destructive: "destructive",
    link: "link",
  },
  size: {
    sm: "size-sm",
    md: "size-md",
    lg: "size-lg",
  },
};

const iconButtonClasses = createVariants(iconButtonModifiers);

/**
 * Compact icon-only action control (RRU-042). Always renders a `<button>`; the
 * icon (usually from `@raulrod/icons`) is passed as `children` and wrapped in
 * an `aria-hidden` span — the accessible name comes exclusively from the
 * required `label` prop, rendered as `aria-label` (DoD #1, ADR-007): no hidden
 * text, no duplicated SVG label. No tooltip in the MVP (closed decision — see
 * RRU-056); the accessible name is the labelling channel.
 *
 * `loading` swaps the icon for the spinner and disables the control natively,
 * keeping `aria-label` intact (state announced via `aria-busy`). `variant`
 * defaults to `primary` in JS (Heading `as` precedent); `size` defaults to
 * `md` in CSS, and every size squares the control to Button's height so both
 * kinds of action align in a toolbar (IconButton.css sizing note).
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, variant = "primary", size, loading = false, disabled, className, children, ...props },
  ref,
) {
  const classes = cx(
    "rr-icon-button",
    iconButtonClasses("rr-icon-button", { variant, size }),
    loading === true && "rr-icon-button--loading",
    className,
  );

  return (
    <button
      {...props}
      ref={ref}
      aria-label={label}
      aria-busy={loading || undefined}
      disabled={disabled === true || loading}
      className={classes}
    >
      {loading === true ? (
        <span className="rr-icon-button__spinner" aria-hidden="true">
          <Loader2 />
        </span>
      ) : (
        <span className="rr-icon-button__icon" aria-hidden="true">
          {children}
        </span>
      )}
    </button>
  );
});
IconButton.displayName = "IconButton";
