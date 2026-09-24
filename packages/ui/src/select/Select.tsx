import type {
  SelectContentProps,
  SelectContextValue,
  SelectGroupProps,
  SelectIconProps,
  SelectItemProps,
  SelectLabelProps,
  SelectProps,
  SelectTriggerProps,
  SelectValueProps,
} from "./Select.types.js";
import type { ReactNode } from "react";

import {
  Children,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { ChevronDown } from "@raulrod/icons";

import { Portal } from "../portal/index.js";
import { cx } from "../utils/cx.js";
import { useDismissableLayer } from "../utils/dismissable-layer.js";
import { useFocusReturn } from "../utils/focus-return.js";
import { mergeRefs } from "../utils/merge-refs.js";
import { useId } from "../utils/use-id.js";
import { focusSelectedOption, useListboxKeyboard } from "../utils/use-listbox-keyboard.js";
import { usePopoverPosition } from "../utils/use-popover-position.js";
import { VisuallyHidden } from "../visually-hidden/index.js";

/**
 * Select (RRU-057): read-only combobox (field look) built on the shared overlay
 * primitives (RRU-052), the positioner (RRU-054), the listbox keyboard
 * (RRU-057) and the composite API (guide §14/§15, ADR-004). The root is a PURE
 * provider — no DOM of its own (same documented exception as
 * Popover/DropdownMenu): `Select.Trigger` is the field `<button>` and
 * `Select.Content` portals the `role="listbox"` panel to `document.body`.
 *
 * API (RRU-057): `value`/`defaultValue`/`onValueChange` (RadioGroup precedent,
 * RRU-047) + `open`/`defaultOpen`/`onOpenChange` (Popover precedent). Search is
 * deferred (closed decision): type-ahead only.
 *
 * A11y by construction (DoD #2, WAI-ARIA read-only Combobox / Listbox-Select):
 * the trigger is `role="combobox"` + `aria-haspopup="listbox"` + `aria-expanded`
 * + `aria-controls` and selects by COMMIT (Enter/Space/click select AND close —
 * `aria-selected` never chases focus); the panel is `<div role="listbox">` with
 * `[role="option"]` items using a roving tabindex, `aria-selected` only on the
 * selected option and `aria-disabled="true"` on disabled options (never
 * focusable — WCAG). ArrowUp/Down wrap and skip disabled, Home/End, type-ahead
 * (~500ms buffer), Escape/outside pointer-down/re-click dismiss through the
 * topmost-aware dismissable layer (§14), Tab closes (no preventDefault), and
 * closing restores focus to the trigger (focus-return). Initial focus goes to
 * the SELECTED option, else the first enabled one (APG). Selection changes are
 * announced through a `role="status" aria-live="polite"` region inside the
 * trigger (DoD announcements) — the trigger text itself is the selected label,
 * naturally the accessible name.
 *
 * Non-modal by design (like Popover): no focus trap, no `aria-modal`, no scroll
 * lock.
 *
 * MVP limitation (documented, RRU-057): no hidden `input`/native `name` — the
 * value never participates in a form submission.
 */

export function Select({
  open,
  defaultOpen = false,
  onOpenChange,
  value,
  defaultValue,
  onValueChange,
  children,
}: SelectProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const controlledOpen = open !== undefined;
  const isOpen = controlledOpen ? open : uncontrolledOpen;

  const [uncontrolledValue, setUncontrolledValue] = useState<string | undefined>(defaultValue);
  const controlledValue = value !== undefined;
  const selectedValue = controlledValue ? value : uncontrolledValue;

  const setOpen = (next: boolean): void => {
    if (!controlledOpen) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  const contentId = useId("rr-select");

  // The anchor lives on the Trigger; the REF stays OWNED by the root (Popover
  // precedent — the slots meet only via the provider; react-hooks/refs).
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const setTriggerRef = (node: HTMLButtonElement | null): void => {
    triggerRef.current = node;
  };

  // Render-phase, side-effect free label map (Popover `collectSlots` precedent)
  // → `.Value` and the live-region announcement never depend on the DOM and
  // the markup is identical on server and client.
  const items = collectItems(children);
  const selectedLabel = selectedValue !== undefined ? items.get(selectedValue) : undefined;
  const hasSelection = selectedLabel !== undefined;

  const select = (next: string): void => {
    // select() also fires on the same-value reopen; the guard keeps the
    // contract "onValueChange fires only when the value actually changes".
    if (next !== selectedValue) {
      if (!controlledValue) setUncontrolledValue(next);
      onValueChange?.(next);
    }
    setOpen(false);
  };

  const selectContext: SelectContextValue = {
    open: isOpen,
    setOpen,
    contentId,
    triggerRef,
    setTriggerRef,
    selectedValue,
    hasSelection,
    selectedLabel,
    select,
  };

  return <SelectContext.Provider value={selectContext}>{children}</SelectContext.Provider>;
}
Select.displayName = "Select";

/** `Select.Trigger` slot: the field-look `<button role="combobox">` (read-only)
 *  that toggles the listbox. The ARIA wiring + `type="button"` are forced
 *  after the spread so the consumer cannot break them; the consumer's onClick
 *  is chained after the toggle. Its DOM node registers in the context as the
 *  anchor (inside the dismissable layer, so a re-click closes). A
 *  `role="status"` live region IS part of the slot: it announces the selection
 *  to assistive technology (DoD), transparent to the layout via
 *  `VisuallyHidden`. */
export const SelectTrigger = forwardRef<HTMLButtonElement, SelectTriggerProps>(
  function SelectTrigger({ className, size = "md", onClick, children, ...props }, ref) {
    const select = useSelectContext();
    return (
      <button
        {...props}
        ref={mergeRefs((node) => {
          select.setTriggerRef(node);
        }, ref)}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={select.open}
        aria-controls={select.contentId}
        className={cx("rr-select-trigger", `rr-select-trigger--${size}`, className)}
        onClick={(event) => {
          select.setOpen(!select.open);
          onClick?.(event);
        }}
      >
        {children}
        <VisuallyHidden role="status" aria-live="polite">
          {select.selectedLabel}
        </VisuallyHidden>
      </button>
    );
  },
);
SelectTrigger.displayName = "SelectTrigger";

/** `Select.Value` slot: renders the SELECTED label when there is one, else its
 *  children — the placeholder (muted). The text is the trigger's accessible
 *  name, so the combobox name tracks the selection. */
export const SelectValue = forwardRef<HTMLSpanElement, SelectValueProps>(function SelectValue(
  { className, children, ...props },
  ref,
) {
  const select = useSelectContext();
  return (
    <span
      {...props}
      ref={ref}
      className={cx(
        "rr-select-value",
        !select.hasSelection && "rr-select-value--placeholder",
        className,
      )}
    >
      {select.hasSelection ? select.selectedLabel : children}
    </span>
  );
});
SelectValue.displayName = "SelectValue";

/** `Select.Icon` slot: the chevron affordance. Aria-hidden by construction
 *  (the indicator never leaks into the combobox name). `children` fall back to
 *  a `ChevronDown` indicator (SubTrigger precedent) — the cue exists without
 *  consumer effort. */
export const SelectIcon = forwardRef<HTMLSpanElement, SelectIconProps>(function SelectIcon(
  { className, children, ...props },
  ref,
) {
  return (
    <span {...props} ref={ref} aria-hidden="true" className={cx("rr-select-icon", className)}>
      {children ?? <ChevronDown />}
    </span>
  );
});
SelectIcon.displayName = "SelectIcon";

/** `Select.Content` slot: portals the `role="listbox"` panel while open, floats
 *  it next to the trigger (`usePopoverPosition`, flip/overflow aware — DoD #1)
 *  and owns the lifecycle: focus return, initial focus on the SELECTED option
 *  (else first enabled, APG), dismissal (Escape + outside pointer-down, trigger
 *  inside so re-clicks toggle) and the roving-focus/type-ahead keyboard
 *  (`useListboxKeyboard`, commit-on-activation). Renders `null` (and runs its
 *  hooks inactive) while closed → SSR-safe, identical first markup. */
export const SelectContent = forwardRef<HTMLDivElement, SelectContentProps>(function SelectContent(
  { className, placement = "bottom-start", children, ...props },
  ref,
) {
  const select = useSelectContext();
  const panelRef = useRef<HTMLDivElement>(null);

  useFocusReturn({ active: select.open });
  useDismissableLayer({
    nodeRef: panelRef,
    extraInsideRefs: [select.triggerRef],
    active: select.open,
    onEscape: () => select.setOpen(false),
    onPointerDownOutside: () => select.setOpen(false),
  });
  usePopoverPosition({
    anchorRef: select.triggerRef,
    panelRef,
    placement,
    active: select.open,
  });
  useListboxKeyboard({
    listboxRef: panelRef,
    active: select.open,
    selectedValue: select.selectedValue,
    onSelectItem: select.select,
    onCloseListbox: () => select.setOpen(false),
  });

  // Initial focus (APG: the selected option, else the first enabled). The
  // roving write (`tabIndex=0` + focus) happens once per open.
  useEffect(() => {
    if (select.open) focusSelectedOption(panelRef.current, select.selectedValue);
  }, [select.open, select.selectedValue]);

  if (!select.open) return null;

  return (
    <Portal>
      <div
        {...props}
        ref={mergeRefs(panelRef, ref)}
        id={select.contentId}
        role="listbox"
        className={cx("rr-select-listbox", className)}
      >
        {children}
      </div>
    </Portal>
  );
});
SelectContent.displayName = "SelectContent";

/** `Select.Item` slot: one `role="option"` — a `<div>` (the listbox owns the
 *  keyboard, so no forced tab stop; the roving tabindex lives on the panel).
 *  Carries the consumer's `value` in `data-value` (read at keydown/click
 *  time), renders `aria-selected` ONLY when actually selected and
 *  `aria-disabled="true"` + the disabled modifier when disabled. Clicking an
 *  enabled option selects AND closes (commit); disabled options swallow the
 *  click (never focusable, never fire `onValueChange`). */
export const SelectItem = forwardRef<HTMLDivElement, SelectItemProps>(function SelectItem(
  { className, value, disabled = false, onClick, children, ...props },
  ref,
) {
  const select = useSelectContext();
  const selected = select.selectedValue === value;
  // Keyboard activation (Enter/Space) lives at the LISTBOX level
  // (`useListboxKeyboard`, WAI-ARIA listbox roving pattern): the option is
  // keyboard-operable through its parent panel, so the click-only rule fires a
  // false positive on this element. Scoped to this option only.
  /* eslint-disable jsx-a11y/click-events-have-key-events */
  return (
    <div
      {...props}
      ref={ref}
      role="option"
      tabIndex={-1}
      data-value={value}
      aria-selected={selected}
      aria-disabled={disabled}
      className={cx("rr-select-item", disabled && "rr-select-item--disabled", className)}
      onClick={(event) => {
        if (disabled) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        select.select(value);
        onClick?.(event);
      }}
    >
      {children}
    </div>
  );
  /* eslint-enable jsx-a11y/click-events-have-key-events */
});
SelectItem.displayName = "SelectItem";

/** `Select.Group` slot: `<div role="group">` for a labeled cluster. The group
 *  wrapper carries no keyboard semantics — only its options are focusable. */
export const SelectGroup = forwardRef<HTMLDivElement, SelectGroupProps>(function SelectGroup(
  { className, children, ...props },
  ref,
) {
  return (
    <div {...props} ref={ref} role="group" className={cx("rr-select-group", className)}>
      {children}
    </div>
  );
});
SelectGroup.displayName = "SelectGroup";

/** `Select.Label` slot: the group label cell. NOT an option — skipped by the
 *  keyboard hook (`role="option"` selector). */
export const SelectLabel = forwardRef<HTMLDivElement, SelectLabelProps>(function SelectLabel(
  { className, children, ...props },
  ref,
) {
  return (
    <div {...props} ref={ref} className={cx("rr-select-group-label", className)}>
      {children}
    </div>
  );
});
SelectLabel.displayName = "SelectLabel";

// Slots mounted as properties of the root (ADR-004 §Decision mecánica):
// `<Select.Trigger>`, `.Value`, `.Icon`, `.Content`, `.Item`, `.Group`,
// `.Label`.
Select.Trigger = SelectTrigger;
Select.Value = SelectValue;
Select.Icon = SelectIcon;
Select.Content = SelectContent;
Select.Item = SelectItem;
Select.Group = SelectGroup;
Select.Label = SelectLabel;

const SelectContext = createContext<SelectContextValue | null>(null);
SelectContext.displayName = "SelectContext";

function useSelectContext(): SelectContextValue {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error("Select slots must be used within a <Select> root");
  }
  return context;
}

/** Composition root slot-detection (ADR-004, Popover `collectSlots` precedent):
 *  walks the children tree (recursively honoring arrays, fragments and
 *  conditional expressions) collecting `value → label` from every
 *  `<Select.Item>`. Render-phase + side-effect free → identical on server and
 *  client. The label comes from the item's DOM text (displayed + type-ahead
 *  matching source stay in sync by construction). */
function collectItems(children: ReactNode): Map<string, string> {
  const items = new Map<string, string>();

  const walk = (node: ReactNode): void => {
    Children.forEach(node, (child) => {
      if (!isValidElement(child)) return;
      if (child.type === SelectItem) {
        const props = child.props as { value?: string; children?: ReactNode };
        if (props.value !== undefined) items.set(props.value, textFromChildren(props.children));
      }
      const nested = (child.props as { children?: ReactNode }).children;
      if (nested !== undefined) walk(nested);
    });
  };

  walk(children);
  return items;
}

/** Flattens a ReactNode to its visible text (labels, icons' aria-labels) —
 *  recursively, mirroring the DOM `textContent`. Trims, so placeholder padding
 *  never leaks into the label/live-region text. */
function textFromChildren(node: ReactNode): string {
  let out = "";
  Children.forEach(node, (child) => {
    if (typeof child === "string" || typeof child === "number") {
      out += child;
      return;
    }
    if (isValidElement(child)) {
      const nested = (child.props as { children?: ReactNode }).children;
      if (nested !== undefined) out += textFromChildren(nested);
    }
  });
  return out.trim();
}
