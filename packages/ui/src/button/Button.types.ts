import type { HTMLAttributes, ReactNode } from "react";

/**
 * Visual variant of {@link Button}. A local union, not derived from
 * `component.ts`: the component layer has no keys for the
 * outline/ghost/link families and deriving the variant from tokens would force
 * exactly the speculative layer §9 forbids (component-pattern.mdx §8).
 */
export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive" | "link";

/**
 * Size axis of {@link Button}. `md` is the default and lives in the
 * `.rr-button` CSS base class (Stack.gap precedent, component-pattern.mdx §4.1)
 * — no default is applied in JS for this axis.
 */
export type ButtonSize = "sm" | "md" | "lg";

/**
 * Props of {@link Button}: primary action control rendering a
 * `<button>`, or an `<a>` when `href` is present (the DoD's bounded
 * polymorphism — the same accepted pattern as Heading's `as`, no generic
 * `as`/`asChild`).
 *
 * Extends `HTMLAttributes<HTMLElement>` instead of
 * `ButtonHTMLAttributes<HTMLButtonElement>` because the element varies: every
 * handler typed against `HTMLButtonElement` would be contravariance-incompatible
 * with `<a>` (`HTMLButtonElement` and `HTMLAnchorElement` are unrelated), which
 * would force `as` casts in the implementation (session note,
 * typescript.md §3). The useful button-specific attributes are re-declared
 * explicitly (`type`, `disabled`); exotic form-association attributes
 * (`form`, `formAction`, `value`) are out of MVP scope (revisit in the future).
 *
 * `className`, `style`, ARIA, events and `data-*` pass through untouched; the
 * component merges `className` with its own `rr-*` classes via `cx`.
 */
export interface ButtonProps extends HTMLAttributes<HTMLElement> {
  /** Visual variant; defaults to `primary` (JS default, Heading `as` precedent). */
  variant?: ButtonVariant;
  /** Size axis; defaults to `md` via the CSS base class. */
  size?: ButtonSize;
  /** Shows the spinner, sets `aria-busy` and disables interaction (DoD #1). */
  loading?: boolean;
  /** Disables the control. On the `<a>` render there is no native `disabled`
   *  attribute, so it translates to `aria-disabled` + navigation guard. */
  disabled?: boolean;
  /**
   * Presence of `href` switches the render from `<button>` to `<a>` (DoD #2):
   * without `href` it is never a link.
   *
   * Forwarded to the `<a>` verbatim: the library does NOT sanitize or rewrite
   * consumer URLs (SECURITY.md §Content and URLs — it would break `data:`, `blob:`
   * and relative URLs and buy a false sense of safety). Validate untrusted
   * input where it enters your application.
   */
  href?: string;
  /** Anchor-only: `target` attribute (ignored by the `<button>` render). */
  target?: string;
  /**
   * Anchor-only: `rel` attribute (ignored by the `<button>` render).
   *
   * Defaults to `"noopener noreferrer"` when `target` opens another browsing
   * context (anything but `_self`) and this prop is omitted — RRU-102. The
   * opened document would otherwise keep a `window.opener` handle to this page
   * and read its URL from the `Referer` header. Passing `rel` overrides the
   * default, `rel=""` included.
   */
  rel?: string;
  /** `<button>` type; defaults to the native `submit` when omitted. */
  type?: "submit" | "reset" | "button";
  /** Leading node, rendered decoratively (`aria-hidden`) next to the label. */
  startIcon?: ReactNode;
  /** Trailing node, rendered decoratively (`aria-hidden`) next to the label. */
  endIcon?: ReactNode;
}
