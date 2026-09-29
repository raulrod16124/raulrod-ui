import type { TextareaHTMLAttributes } from "react";

/**
 * Size axis of {@link Textarea}. `md` is the default and lives in the
 * `.rr-textarea` CSS base class (Stack.gap precedent, component-pattern.mdx
 * §4.1). Padding/font follow Input per size so multiline fields stay
 * aligned with single-line fields and buttons in the same row.
 */
export type TextareaSize = "sm" | "md" | "lg";

/**
 * Props of {@link Textarea}: the multiline text field, reusing the
 * Input pattern. Always renders a `<textarea>` (no `as`/prefix or
 * suffix — those are closed out of the MVP). `invalid` is NOT a prop: the
 * invalid state is driven by the native `aria-invalid` attribute, which passes
 * through the spread and is styled by `.rr-textarea[aria-invalid="true"]` in
 * `Textarea.css` (single activation path decision). FormField
 * sets it when composing.
 *
 * `autoResize` wraps the control in a CSS-grid with a hidden mirror node that
 * echoes the current value (seeded from `value`/`defaultValue`) so the field
 * grows with its content. The dynamic re-sync on input is wired via internal
 * state + `onChange` chaining; full runtime coverage lands with Vitest later.
 * `className` is merged via `cx`.
 *
 * Deliberately extends `TextareaHTMLAttributes<HTMLTextAreaElement>` (single
 * render) with `size` omitted: the field's width is described with the native
 * `cols`/`rows` and CSS, while the uniform DS `size` axis (variant/size naming,
 * §15) controls height/typography consistent with Input.
 */
export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> {
  /** Size axis; defaults to `md` via the CSS base class. */
  size?: TextareaSize;
  /** Auto-grow the field with its content via a hidden CSS-grid mirror. */
  autoResize?: boolean;
}
