import type { SwitchProps, SwitchSize } from "./Switch.types.js";

import { forwardRef } from "react";

import { cx } from "../utils/cx.js";
import { createVariants } from "../utils/variants.js";

/** Exhaustive axis maps (RRU-040 pattern): adding a `SwitchSize` member breaks
 *  compilation here until its suffix exists — and the authored CSS contract
 *  check fails until the matching `rr-switch--size-*` selector is written. */
const switchModifiers: Readonly<{
  size: Record<SwitchSize, string>;
}> = {
  size: {
    sm: "size-sm",
    md: "size-md",
    lg: "size-lg",
  },
};

const switchClasses = createVariants(switchModifiers);

/**
 * Native toggle switch (RRU-048, WAI-ARIA switch pattern). Renders a `<label>`
 * row wrapping a bare `<input type="checkbox" role="switch">` (native-first,
 * Checkbox/Radio precedent) plus an aria-hidden label span with `children`.
 * `role="switch"` + `aria-checked` from the checked state (DoD #1) and
 * Space/click toggling come from the native checkbox — no JS keyboard or ARIA
 * to fake; `:checked`/`:disabled` ride the native pseudo-classes.
 *
 * The track IS the input (`appearance: none`) and the knob is its `::after`
 * pseudo-element — decorative by construction, no extra a11y node. The label
 * row gives the implicit association ("label visible"), so `children` may be
 * wrapped in `<VisuallyHidden>` for an invisible-but-announced name (DoD).
 *
 * Form wiring (`id`, `aria-describedby`, `aria-errormessage`, `aria-invalid`)
 * is routed to the input — the real labeled control — so `FormField.Label`'s
 * `htmlFor` resolves and the ARIA announcement attaches to the switch itself;
 * the rest of the props spread onto the `<label>` root (className merge +
 * pass-through, pattern §2).
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  {
    checked,
    defaultChecked,
    onChange,
    name,
    value,
    disabled,
    required,
    id,
    "aria-describedby": ariaDescribedby,
    "aria-errormessage": ariaErrormessage,
    "aria-invalid": ariaInvalid,
    size,
    className,
    children,
    ...rest
  },
  ref,
) {
  return (
    <label
      {...rest}
      className={cx(
        "rr-switch",
        disabled && "rr-switch--disabled",
        switchClasses("rr-switch", { size }),
        className,
      )}
    >
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={onChange}
        name={name}
        value={value}
        disabled={disabled}
        required={required}
        id={id}
        aria-describedby={ariaDescribedby}
        aria-errormessage={ariaErrormessage}
        aria-invalid={ariaInvalid}
        ref={ref}
        className="rr-switch-input"
      />
      <span className="rr-switch-label">{children}</span>
    </label>
  );
});
Switch.displayName = "Switch";
