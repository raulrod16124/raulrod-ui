import type { RadioProps, RadioSize } from "./Radio.types.js";

import { forwardRef, useContext } from "react";

import { cx } from "../utils/cx.js";
import { createVariants } from "../utils/variants.js";

import { RadioGroupContext } from "./RadioGroup.js";

/** Exhaustive axis maps (RRU-040 pattern): adding a `RadioSize` member breaks
 *  compilation here until its suffix exists — and the authored CSS contract
 *  check fails until the matching `rr-radio--size-*` selector is written. */
const radioModifiers: Readonly<{
  size: Record<RadioSize, string>;
}> = {
  size: {
    sm: "size-sm",
    md: "size-md",
    lg: "size-lg",
  },
};

const radioClasses = createVariants(radioModifiers);

/**
 * Single native radio option (RRU-047). Renders a `<label>` row wrapping a
 * bare `<input type="radio">` (Input/Textarea/Checkbox precedent) so the
 * native semantics come for free: `role="radio"` + `aria-checked` from the
 * input, implicit label association (whole row clickable, DoD "labels
 * asociados"), Space/click selection, form participation and, when grouped by
 * a shared `name` (RadioGroup context), the browser's own arrow-key navigation
 * with roving focus (DoD #1) — no JS keyboard handling, no ARIA to fake.
 *
 * `name`/`checked`/`defaultChecked`/`onChange` come from the group context:
 * the option reports its own `value` through the group's selection handler.
 * The visual states ride the native pseudo-classes (`:checked`, `:disabled`);
 * no state classes in the markup except `rr-radio--disabled` (Boolean flag
 * outside the variant maps, component-pattern.mdx §4.1) which mutes the label
 * and turns the row cursor.
 */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { value, disabled, size, className, children, ...rest },
  ref,
) {
  const group = useContext(RadioGroupContext);
  const isDisabled = disabled || group.disabled;
  const resolvedSize = size ?? group.size;

  return (
    <label
      {...rest}
      className={cx(
        "rr-radio",
        isDisabled && "rr-radio--disabled",
        radioClasses("rr-radio", { size: resolvedSize }),
        className,
      )}
    >
      <input
        type="radio"
        name={group.name}
        value={value}
        checked={group.controlled ? value === group.value : undefined}
        defaultChecked={group.controlled ? undefined : value === group.value}
        onChange={() => group.onSelect(value)}
        disabled={isDisabled}
        ref={ref}
        className="rr-radio-input"
      />
      <span aria-hidden="true" className="rr-radio-indicator" />
      <span className="rr-radio-label">{children}</span>
    </label>
  );
});
Radio.displayName = "Radio";
