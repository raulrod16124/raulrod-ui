import type { RadioSize, RadioGroupContextValue } from "./Radio.types.js";
import type { RadioGroupProps, RadioGroupOrientation } from "./RadioGroup.types.js";

import { createContext, forwardRef, useState } from "react";

import { cx } from "../utils/cx.js";
import { useId } from "../utils/use-id.js";
import { createVariants } from "../utils/variants.js";

/**
 * Internal context of {@link RadioGroup} (RRU-047); consumed by {@link Radio}.
 * The default (no provider) keeps `Radio` SSR-safe and standalone — no `name`,
 * no selection — so the pattern's className-merge/ref checks hold for a lone
 * option; real form semantics always come from inside a group.
 * @internal not part of the public API (not re-exported from the barrel).
 */
export const RadioGroupContext = createContext<RadioGroupContextValue>({
  onSelect: () => {},
  disabled: false,
  controlled: false,
});
RadioGroupContext.displayName = "RadioGroupContext";

/** Exhaustive axis maps (RRU-040 pattern) for the group's layout axis. */
const radioGroupModifiers: Readonly<{
  orientation: Record<RadioGroupOrientation, string>;
}> = {
  orientation: {
    vertical: "vertical",
    horizontal: "horizontal",
  },
};

const radioGroupClasses = createVariants(radioGroupModifiers);

/**
 * Radio group (RRU-047): `<div role="radiogroup">` + a context wiring every
 * `Radio` into one selectable set. `value`/`defaultValue`/`onValueChange` give
 * the controlled/uncontrolled contract; the shared auto-generated `name` is
 * what makes the NATIVE arrow-key navigation and roving focus work (DoD #1) —
 * a group of `<input type="radio">` inputs with the same name is the browser's
 * roving-tabindex pattern, so no keyboard JS, fake `role` or hand-rolled
 * `tabIndex` management is needed and form submission shares the group name.
 *
 * `disabled` and `size` are group-level defaults distributed through the
 * context (each `Radio` may override); `orientation` is the only CSS axis
 * (`vertical` default / `horizontal`). `aria-invalid="true"` on the group
 * drives the danger border on every option via a descendant CSS rule, matching
 * the Input/Checkbox `aria-invalid` wiring so FormField (RRU-044) can spread
 * its `{id, aria-describedby, aria-errormessage, aria-invalid}` payload
 * straight onto the group.
 */
export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(function RadioGroup(
  {
    value,
    defaultValue,
    onValueChange,
    name,
    disabled,
    size,
    orientation = "vertical",
    className,
    children,
    ...rest
  },
  ref,
) {
  const generatedName = useId("rr-radio-group");
  const [uncontrolledValue, setUncontrolledValue] = useState<string | undefined>(defaultValue);
  const controlled = value !== undefined;
  const currentValue = controlled ? value : uncontrolledValue;

  const group: RadioGroupContextValue = {
    name: name ?? generatedName,
    value: currentValue,
    onSelect: (next) => {
      if (!controlled) setUncontrolledValue(next);
      onValueChange?.(next);
    },
    disabled: disabled ?? false,
    size,
    controlled,
  };

  return (
    <div
      role="radiogroup"
      {...rest}
      ref={ref}
      className={cx(
        "rr-radio-group",
        radioGroupClasses("rr-radio-group", { orientation }),
        className,
      )}
    >
      <RadioGroupContext.Provider value={group}>{children}</RadioGroupContext.Provider>
    </div>
  );
});
RadioGroup.displayName = "RadioGroup";
