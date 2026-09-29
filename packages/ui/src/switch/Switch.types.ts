import type { InputHTMLAttributes, LabelHTMLAttributes } from "react";

/**
 * Size axis of {@link Switch} (RRU-048). `md` is the default and lives in the
 * `.rr-switch-input` CSS base class (Stack.gap precedent,
 * component-pattern.mdx §4.1). Tracks are token-based on the space scale
 * with a fixed mechanics frame: sm = 32×16px (`space-8`×`space-4`), md =
 * 40×20px (`space-10`×`space-5`), lg = 48×24px (`space-12`×`space-6`) — the
 * same token-only rule as the five preceding controls, mirrored for §15 axis
 * uniformity.
 */
export type SwitchSize = "sm" | "md" | "lg";

/**
 * Props of {@link Switch} (RRU-048), a native toggle switch. Renders a
 * `<label>` row (the visible `children` become the accessible name through the
 * native implicit association — DoD "label visible o VisuallyHidden"; wrap
 * `children` in `<VisuallyHidden>` for an invisible but announced label)
 * wrapping a bare `<input type="checkbox" role="switch">`.
 *
 * `role="switch"` + `aria-checked` from the checked state and Space/click
 * toggling are NATIVE to the checkbox (check-pattern + WAI-ARIA switch
 * pattern): no JS keyboard or ARIA wiring. `checked`/`defaultChecked`/
 * `onChange`/`name`/`value`/`disabled`/`required` are the native pass-through
 * so controlled and uncontrolled usage both work.
 *
 * Form wiring is routed to the REAL labeled control: `id`,
 * `aria-describedby`, `aria-errormessage` and `aria-invalid` land on the
 * `<input>`, so `FormField.Label`'s `htmlFor` resolves and the description /
 * error announcement attaches to the switch itself (a documented deviation
 * from Radio, whose group is a `div` with no single labeled control). The
 * remaining props (pass-through `title`, `data-*`, ARIA pointing at the row,
 * `className`) land on the `<label>` root; the forwarded `ref` targets the
 * `<input>` — the focusable control consumers want to query/focus.
 */
export interface SwitchProps extends Omit<
  LabelHTMLAttributes<HTMLLabelElement>,
  "htmlFor" | "onChange"
> {
  /** Controlled: `true` renders the switch on (`checked` native attribute). */
  checked?: boolean;
  /** Uncontrolled: initial on/off seed (`defaultChecked` native attribute). */
  defaultChecked?: boolean;
  /** Native change handler, fired on click / Space / label click. */
  onChange?: InputHTMLAttributes<HTMLInputElement>["onChange"];
  /** Form identity passed through to the input. */
  name?: string;
  /** Control value passed through to the input. */
  value?: InputHTMLAttributes<HTMLInputElement>["value"];
  /** Disables the switch (native) and mutes the row (`rr-switch--disabled`). */
  disabled?: boolean;
  /** Required flag passed through to the input (form A11y). */
  required?: boolean;
  /** Routed to the input so `FormField.Label#htmlFor` resolves. */
  id?: string;
  /** Routed to the input (description announcement, FormField wiring). */
  "aria-describedby"?: string;
  /** Routed to the input (error announcement, FormField wiring). */
  "aria-errormessage"?: string;
  /** Routed to the input; `[aria-invalid="true"]` paints the danger border. */
  "aria-invalid"?: boolean;
  /** Size axis; defaults to `md` via the CSS base class. */
  size?: SwitchSize;
}
