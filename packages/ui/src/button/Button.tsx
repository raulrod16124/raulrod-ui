import type { ButtonProps, ButtonSize, ButtonVariant } from "./Button.types.js";
import type { Ref } from "react";

import { forwardRef } from "react";

import { Loader2 } from "@raulrod/icons";

import { cx } from "../utils/cx.js";
import { createVariants } from "../utils/variants.js";

/** Exhaustive axis maps (RRU-040 pattern): adding a `ButtonVariant`/`ButtonSize`
 *  member breaks compilation here until its suffix exists — and the authored
 *  CSS contract check fails until the matching `rr-*--*` selector is written. */
const buttonModifiers: Readonly<{
  variant: Record<ButtonVariant, string>;
  size: Record<ButtonSize, string>;
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

const buttonClasses = createVariants(buttonModifiers);

/**
 * Action control (RRU-041). Renders a `<button>`, or an `<a>` when `href` is
 * present (bounded polymorphism — same accepted pattern as Heading's `as`;
 * without `href` it is never a link, DoD #2). `loading` shows the spinner,
 * sets `aria-busy` and disables interaction natively (`disabled`) or via
 * `aria-disabled` + click guard on the anchor render (DoD #1). `variant`
 * defaults to `primary` in JS; `size` defaults to `md` in CSS
 * (component-pattern.mdx §4.1). Styling lives entirely in `Button.css`
 * (`rr-*` classes over CSS custom properties, ADR-003).
 *
 * The ref is typed for the primary render (`HTMLButtonElement`) so the common
 * `useRef<HTMLButtonElement>` works without variance friction; the anchor
 * branch carries the single justified cast (typescript.md §6).
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size,
    loading = false,
    startIcon,
    endIcon,
    className,
    children,
    disabled,
    href,
    target,
    rel,
    type,
    onClick,
    ...props
  },
  ref,
) {
  // Interaction guard shared by both renders: native `disabled` on the
  // button, `aria-disabled` + preventDefault on the anchor.
  const inert = loading || disabled === true;
  const classes = cx(
    "rr-button",
    buttonClasses("rr-button", { variant, size }),
    loading === true && "rr-button--loading",
    className,
  );

  // The label stays in the DOM while loading so the accessible name does not
  // disappear; the spinner is decorative (`aria-hidden`), the state itself is
  // announced via `aria-busy`.
  const content = (
    <>
      {loading === true && (
        <span className="rr-button__spinner" aria-hidden="true">
          <Loader2 />
        </span>
      )}
      {startIcon !== undefined && (
        <span className="rr-button__icon" aria-hidden="true">
          {startIcon}
        </span>
      )}
      {children}
      {endIcon !== undefined && (
        <span className="rr-button__icon" aria-hidden="true">
          {endIcon}
        </span>
      )}
    </>
  );

  if (href !== undefined) {
    return (
      <a
        {...props}
        // SAFE: the runtime element here is an `<a>`; `HTMLAnchorElement` and
        // `HTMLButtonElement` are unrelated, so the union/ref would otherwise
        // be invariance-incompatible (typescript.md §6 — single justified
        // cast of this component).
        ref={ref as Ref<HTMLAnchorElement>}
        href={href}
        target={target}
        rel={rel}
        aria-busy={loading || undefined}
        aria-disabled={inert || undefined}
        className={classes}
        onClick={(event) => {
          if (inert) event.preventDefault();
          onClick?.(event);
        }}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      {...props}
      ref={ref}
      type={type}
      disabled={disabled === true || loading}
      aria-busy={loading || undefined}
      className={classes}
      onClick={onClick}
    >
      {content}
    </button>
  );
});
Button.displayName = "Button";
