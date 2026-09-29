import type { LabelHTMLAttributes } from "react";

/**
 * Size axis of {@link Radio} (RRU-047). `md` is the default and lives in the
 * `.rr-radio-input` CSS base class (Stack.gap precedent,
 * component-pattern.mdx §4.1). Dots are token-based on the space scale:
 * sm = 12px (`space-3`), md = 16px (`space-4`), lg = 20px (`space-5`) — the
 * same token-only rule as Checkbox/Input/Textarea, mirrored for §15 axis
 * uniformity. A `RadioGroup` can distribute `size` via context as a group
 * default; each `Radio` may override it locally.
 */
export type RadioSize = "sm" | "md" | "lg";

/**
 * Props of {@link Radio} (RRU-047), a single native radio option. Renders a
 * `<label>` row (the visible `children` become the accessible label through the
 * native implicit association — DoD "labels asociados") wrapping a bare
 * `<input type="radio">`, an aria-hidden indicator and the label text.
 *
 * `value` is REQUIRED: it is the option's identity — what a wrapping
 * `RadioGroup.value`/`onValueChange` reports. `name`, `checked`/`defaultChecked`
 * and `onChange` are OMITTED: they belong to the group (name) or are derived
 * from the group's selected value (checked/onChange), so a consumer cannot wire
 * conflicting values that would desync the group contract.
 *
 * Pass-through props (`id`, `title`, `data-*`, ARIA) land on the `<label>` row
 * (outer element convention); the forwarded `ref` targets the native `<input>`
 * — the focusable control consumers want to query/focus. `disabled` accepts a
 * local value that is OR-ed with the group's `disabled` (a disabled group
 * disables every option regardless). `size` falls back to the group's `size`
 * when the radio has none.
 */
export interface RadioProps extends Omit<
  LabelHTMLAttributes<HTMLLabelElement>,
  "htmlFor" | "disabled"
> {
  /** Required option identity, reported by the group's `onValueChange`. */
  value: string;
  /** Local disabled override; the group's `disabled` is OR-ed in. */
  disabled?: boolean;
  /** Size axis; defaults to `md` via the CSS base class. */
  size?: RadioSize;
}

/**
 * Internal context payload of {@link RadioGroup} (RRU-047): the single source
 * of name/value wiring every {@link Radio} consumes. `name` is either the
 * consumer-provided name or a `useId`-generated one — all radios of the group
 * share it so the native same-name arrow-key navigation / roving focus (DoD
 * #1) and form submission grouping work without any JS. `controlled` tells the
 * radios whether to drive `checked` (controlled `value`) or `defaultChecked`
 * (uncontrolled `defaultValue`).
 * @internal not part of the public API (not re-exported from the barrel).
 */
export interface RadioGroupContextValue {
  /** Shared `name` attribute of every option of the group. */
  name?: string;
  /** Currently selected value of the group. */
  value?: string;
  /** Selects a value: updates internal state (uncontrolled) and/or notifies
   *  `onValueChange` (controlled). */
  onSelect: (value: string) => void;
  /** Group-level disabled flag, OR-ed into every option. */
  disabled: boolean;
  /** Group-level size default, overridable per option. */
  size?: RadioSize;
  /** `true` when the group is controlled (`value` provided). */
  controlled: boolean;
}
