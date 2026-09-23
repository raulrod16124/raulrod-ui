import type { ButtonHTMLAttributes } from "react";

/**
 * Visual variant of {@link IconButton} (RRU-042). Local union mirroring
 * Button's set (RRU-041, user decision: full parity), not derived from
 * `component.ts` (RRU-026): the component layer owns no keys for the
 * outline/ghost/link families and deriving would force speculative tokens
 * (component-pattern.mdx §8).
 */
export type IconButtonVariant =
  "primary" | "secondary" | "outline" | "ghost" | "destructive" | "link";

/**
 * Size axis of {@link IconButton} (RRU-042). `md` is the default and lives in
 * the `.rr-icon-button` CSS base class (Stack.gap precedent,
 * component-pattern.mdx §4.1) — no default is applied in JS for this axis.
 * Each size squares the control to Button's height (sm=24/md=34/lg=46), so
 * icon-only and labeled buttons align in the same toolbar.
 */
export type IconButtonSize = "sm" | "md" | "lg";

/**
 * Props of {@link IconButton} (RRU-042): compact icon-only action control.
 * Always renders a `<button>` (no `as`/`href` polymorphism — that bounded
 * polymorphism is Button's DoD; IconButton's is icon-only semantics).
 *
 * Requires an accessible name via the `label` prop — omitted, TypeScript
 * fails at compile time (DoD #1). `label` is rendered as `aria-label` on the
 * button; `children` is the decorative icon (usually from `@raulrod/icons`)
 * and is wrapped in an `aria-hidden` span so the accessible name is never
 * duplicated inside the SVG (ADR-007 a11y convention).
 *
 * Extends `ButtonHTMLAttributes<HTMLButtonElement>` (the only render, unlike
 * Button) so `type`, `disabled`, virtual props and `aria-*` pass through
 * natively; `className` is merged via `cx`.
 */
export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible name (required — compile-time TS error if omitted, DoD #1).
   *  Rendered as `aria-label`; the icon in `children` stays decorative. */
  label: string;
  /** Visual variant; defaults to `primary` (JS default, Heading `as` precedent). */
  variant?: IconButtonVariant;
  /** Size axis; defaults to `md` via the CSS base class. */
  size?: IconButtonSize;
  /** Shows the spinner in place of the icon, sets `aria-busy` and disables
   *  the control natively (state announced, SR DoD). The accessible name is
   *  retained while loading. */
  loading?: boolean;
}
