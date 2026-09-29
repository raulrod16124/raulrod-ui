import type { TextareaProps, TextareaSize } from "./Textarea.types.js";

import { forwardRef, useState } from "react";

import { cx } from "../utils/cx.js";
import { createVariants } from "../utils/variants.js";

/** Exhaustive axis maps (RRU-040 pattern): adding a `TextareaSize` member
 *  breaks compilation here until its suffix exists — and the authored CSS
 *  contract check fails until the matching `rr-textarea--size-*` selector is
 *  written. */
const textareaModifiers: Readonly<{
  size: Record<TextareaSize, string>;
}> = {
  size: {
    sm: "size-sm",
    md: "size-md",
    lg: "size-lg",
  },
};

const textareaClasses = createVariants(textareaModifiers);

/**
 * Multiline text field (RRU-045). Renders a `<textarea>`; `size` defaults to
 * `md` in the CSS base class (component-pattern.mdx §4.1). The invalid state
 * is driven by the native `aria-invalid` attribute — no prop, no dual
 * activation path (RRU-043 decision): pass `aria-invalid` and the
 * `.rr-textarea[aria-invalid="true"]` rule applies the danger border.
 * Styling lives entirely in `Textarea.css` (`rr-*` classes over CSS custom
 * properties, ADR-003); the resting border uses `color.border.strong` because
 * §6.2 of color.md forbids `border.default` on interactive control boundaries.
 *
 * `autoResize` renders the control inside a `div.rr-textarea-autosize`
 * CSS-grid whose hidden mirror echoes the current value (seeded from
 * `value`/`defaultValue`, zero-width space when empty) so the field height
 * follows its content. `id`/ARIA/`className` stay on the interactive
 * `<textarea>`; the wrapper is purely presentational. The mirror re-syncs on
 * input via internal state + `onChange` chaining (consumer handler still fires
 * untouched); runtime coverage of the dynamic path lands with Vitest (RRU-068).
 *
 * Native `name`/`rows`/`cols`/`value`/`onChange`/`placeholder`/`disabled`/
 * `maxLength`/ARIA pass through; `className` is merged via `cx`.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { autoResize, size, className, ...props },
  ref,
) {
  const [mirrorValue, setMirrorValue] = useState(() => props.value ?? props.defaultValue ?? "");

  if (autoResize) {
    return (
      <div className="rr-textarea-autosize">
        <textarea
          {...props}
          ref={ref}
          onChange={(event) => {
            setMirrorValue(event.currentTarget.value);
            props.onChange?.(event);
          }}
          className={cx("rr-textarea", textareaClasses("rr-textarea", { size }), className)}
        />
        <span
          aria-hidden="true"
          className={cx("rr-textarea-autosize__mirror", textareaClasses("rr-textarea", { size }))}
        >
          {mirrorValue === "" || mirrorValue == null ? "\u200b" : mirrorValue}
        </span>
      </div>
    );
  }

  return (
    <textarea
      {...props}
      ref={ref}
      className={cx("rr-textarea", textareaClasses("rr-textarea", { size }), className)}
    />
  );
});
Textarea.displayName = "Textarea";
