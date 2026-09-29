import type { RadioSize } from "./Radio.types.js";
import type { HTMLAttributes } from "react";

/** Layout axis of {@link RadioGroup} (RRU-047): options are stacked by default
 *  (`vertical`) or laid out in a row (`horizontal`). The default lives in the
 *  JS (precedent Button `variant` / Heading `level`), so the
 *  `rr-radio-group--vertical` modifier is always emitted — same pattern as the
 *  variant axes. */
export type RadioGroupOrientation = "vertical" | "horizontal";

/**
 * Props of {@link RadioGroup} (RRU-047), the composition root of a radio
 * group. Renders `<div role="radiogroup">` (WAI-ARIA radio-group pattern) and
 * distributes the group's wiring to every descendant {@link Radio} through a
 * context: a shared `name` (generated via `useId` unless provided), the
 * selected `value`, the selection callback and group defaults (`disabled`,
 * `size`).
 *
 * `value`/`defaultValue`/`onValueChange` mirror the native
 * controlled/uncontrolled contract of the options: with `value` the group is
 * controlled (each option renders `checked`); without it the seed comes from
 * `defaultValue` (options render `defaultChecked`, hydration-safe). Arrow-key
 * navigation and roving focus (DoD #1) are NATIVE: every option shares the
 * group's `name`, so the browser roves focus and selects as it navigates — no
 * keyboard handlers, no faked ARIA. The group name is also the form submission
 * name.
 *
 * `id`, `title`, `data-*` and ARIA (`aria-labelledby` for the group name,
 * `aria-describedby`/`aria-errormessage`/`aria-invalid` from a FormField
 * spread) pass through onto the group element; `aria-invalid="true"`
 * propagates the danger border to every option via a descendant rule.
 */
export interface RadioGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** Controlled selected value; the option with this `value` renders
   *  `checked`. */
  value?: string;
  /** Uncontrolled seed for the initially selected option. */
  defaultValue?: string;
  /** Called whenever a (new) option is selected — from arrow navigation or
   *  `change`. */
  onValueChange?: (value: string) => void;
  /** Shared form/group `name`. Auto-generated per group when omitted so two
   *  groups never share a name (arrow keys stay scoped). */
  name?: string;
  /** Disables every option of the group. */
  disabled?: boolean;
  /** Group-level size default for the options; each `Radio` may override. */
  size?: RadioSize;
  /** Layout axis; defaults to `vertical`. */
  orientation?: RadioGroupOrientation;
}
