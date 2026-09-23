import type { InputHTMLAttributes } from "react";

/**
 * Size axis of {@link Input} (RRU-043). `md` is the default and lives in the
 * `.rr-input` CSS base class (Stack.gap precedent, component-pattern.mdx §4.1).
 * Padding/font follow Button per size (RRU-041) so fields and buttons align in
 * the same toolbar: heights 24/34/46px (leading-none + same paddings,
 * IconButton precedent RRU-042).
 */
export type InputSize = "sm" | "md" | "lg";

/**
 * Props of {@link Input} (RRU-043): the base single-line text field. Always
 * renders an `<input>` (no `as`/prefix/suffix — those are closed out of the
 * MVP by the card). `invalid` is NOT a prop: the invalid state is driven by
 * the native `aria-invalid` attribute, which passes through the spread and is
 * styled by `.rr-input[aria-invalid="true"]` in `Input.css` (decision
 * 2026-09-23, RRU-043). FormField (RRU-044) will set it when composing.
 *
 * Deliberately extends `InputHTMLAttributes<HTMLInputElement>` (single render)
 * with the native `size` attribute OMITTED: the numeric width-in-characters
 * is shadowed by the DS `size` axis (uniform `variant`/`size` naming, §15).
 * Control the width via CSS/className instead.
 *
 * `type`, `name`, `value`, `onChange`, `placeholder`, `disabled`, ARIA and
 * `data-*` pass through natively; `className` is merged via `cx`.
 */
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Size axis; defaults to `md` via the CSS base class. */
  size?: InputSize;
}
