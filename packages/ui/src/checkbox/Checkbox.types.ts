import type { InputHTMLAttributes } from "react";

/**
 * Size axis of {@link Checkbox} (RRU-046). `md` is the default and lives in
 * the `.rr-checkbox` CSS base class (Stack.gap precedent,
 * component-pattern.mdx §4.1). Boxes are token-based on the space scale:
 * sm = 12px (`space-3`), md = 16px (`space-4`), lg = 20px (`space-5`) — same
 * token-only rule as Input/Textarea, whose additional `size` axes this
 * component mirrors for §15 axis uniformity.
 */
export type CheckboxSize = "sm" | "md" | "lg";

/**
 * Props of {@link Checkbox} (RRU-046): a native tri-state toggle. Always
 * renders `<input type="checkbox">` (single render, no polymorphism — the
 * semantics are native, precedent Input/Textarea). `type` is omitted because
 * it is never something else; the native `size` attribute (width-in-characters,
 * meaningless for a checkbox) is shadowed by the DS `size` axis just like Input.
 *
 * `indeterminate` is a DOM-property state on top of the natively checked state:
 * when `true` the component emits `aria-checked="mixed"` (the card's DoD #1)
 * and sets `node.indeterminate` through the ref so the browser reports and
 * renders the "partially checked" visual via the native `:indeterminate`
 * pseudo-class. It works with both controlled (`checked`) and uncontrolled
 * (`defaultChecked`) usage; a consumer implementing a tri-state parent composes
 * the value from the three native events.
 *
 * `id`, `name`, `value`, `checked`, `defaultChecked`, `onChange`, `disabled`,
 * ARIA and `data-*` pass through natively — so `<FormField.Control>` can spread
 * a {@link FormFieldControlProps} payload straight onto it
 * (`{(f) => <Checkbox {...f} />}`) and the `htmlFor`/`aria-describedby`/
 * `aria-errormessage` wiring lands on the real control.
 */
export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "size"
> {
  /** Marks the "partially checked" state: emits `aria-checked="mixed"` and
   *  drives the native `indeterminate` property/`:indeterminate` styling. */
  indeterminate?: boolean;
  /** Size axis; defaults to `md` via the CSS base class. */
  size?: CheckboxSize;
}
