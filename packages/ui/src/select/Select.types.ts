import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

/** Trigger height axis (RRU-057): mirrors the field look of {@link Input}
 *  (RRU-046) — `sm` 24px / `md` 34px / `lg` 46px. The default lives in the JS
 *  (precedent Button `variant`, Heading `level`), so the
 *  `rr-select-trigger--md` modifier is always emitted. */
export type SelectSize = "sm" | "md" | "lg";

/** Floating placement of the listbox panel (a subset of {@link PopoverPlacement}
 *  — the combobox only ever opens up or down, aligned to the field). Defaults
 *  to `bottom-start`. */
export type SelectPlacement =
  "top-start" | "top" | "top-end" | "bottom-start" | "bottom" | "bottom-end";

/**
 * Props of {@link Select} (RRU-057), the COMPOSITION ROOT of the read-only
 * combobox, per the composite API (guide §14/§15, ADR-004). Like {@link Icon
 * (RRU-035)} a pure provider: no DOM of its own (documented exception), the
 * slots carry the DOM.
 *
 * Acts as a CONTROLLED component when `value` is provided (classic controlled
 * pattern on the new-style), and UNCONTROLLED otherwise, seeded by
 * `defaultValue` — the value/onValueChange contract mirrors
 * {@link RadioGroup} (RRU-047). `open`/`defaultOpen`/`onOpenChange` mirror
 * {@link Popover} (RRU-054).
 *
 * WAI-ARIA: the trigger renders `<button role="combobox">` (read-only) with
 * `aria-haspopup="listbox"` + `aria-expanded` + `aria-controls`; the panel is a
 * `role="listbox"` whose `[role="option"]` items use a roving tabindex,
 * `aria-selected` ONLY on the currently selected option (never following
 * focus), `aria-disabled="true"` for disabled options and commit-on-activation
 * (Enter/Space/click selects AND closes). DOM is read at keydown time
 * (RRU-057) → SSR-safe; initial focus goes to the selected option, else the
 * first enabled one (ARIA APG, RRU-057). The selection is announced through a
 * `role="status"`/`aria-live="polite"` region (DoD #61 id, DoD #62 title).
 *
 * MVP limitation (documented, RRU-057): a hidden `input`/native `name` is NOT
 * rendered, so the value never participates in a form submission — the
 * component is OUTPUT-friendly, not INPUT-heavy. Search/filter was deferred
 * (closed decision); only type-ahead is supported in the MVP.
 */
export interface SelectProps {
  /** The composite tree, rendered by the consumer:
   *  `<Select.Trigger><Select.Value /></Select.Trigger>` followed by a
   *  `<Select.Content>` with `<Select.Item>`/`<Select.Group>`+`<Select.Label>`. */
  children?: ReactNode;
  /** Controlled selected value; the item with this `value` is selected. */
  value?: string;
  /** Uncontrolled seed for the initially selected value. */
  defaultValue?: string;
  /** Called when the selection changes — commit by the user (popup open), or
   *  by the value wiring only when the value actually changes. */
  onValueChange?: (value: string) => void;
  /** Controlled open state of the popup. */
  open?: boolean;
  /** Uncontrolled seed for the initial open state (default `false`). */
  defaultOpen?: boolean;
  /** Called whenever the popup open state changes. */
  onOpenChange?: (open: boolean) => void;
}

/** Context flowing from the {@link Select} root to every slot (ADR-004):
 *  the open/selection state, the selection callback and the trigger registration
 *  + the shared content id. Internal — never part of the public API. */
export interface SelectContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  contentId: string;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  setTriggerRef: (node: HTMLButtonElement | null) => void;
  selectedValue?: string;
  hasSelection: boolean;
  selectedLabel?: string;
  select: (value: string) => void;
}

/**
 * Props of {@link Select.Trigger} slot (RRU-057): the read-only combobox
 * `<button>` — field look, ARIA contract `role="combobox"` +
 * `aria-haspopup="listbox"` + `aria-expanded` + `aria-controls`, `type="button"`
 * forced after the spread (consumer cannot break it), the whole wiring overridable
 * only by the documented Opt-In. Size defaults to `md`. `id`, `title`, `data-*`
 * and `aria-*` pass through.
 */
export interface SelectTriggerProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  /** Trigger height axis. Defaults to `md`. */
  size?: SelectSize;
}

/**
 * Props of {@link Select.Value} slot (RRU-057): renders the SELECTED item's
 * label when there is one, else its children — the placeholder. The trigger
 * text is naturally its accessible name. `id`/`data-*` pass through onto the
 * `<span>`.
 */
export interface SelectValueProps extends HTMLAttributes<HTMLSpanElement> {
  /** Placeholder shown while nothing is selected (or the selected value has no
   *  matching item). */
  children?: ReactNode;
}

/**
 * Props of {@link Select.Icon} slot (RRU-057): the chevron indicator.
 * `Click`/`type`-safe by construction — `aria-hidden="true"` for the indicator
 * (the trigger name never leaks), the consumer may render any icon or
 * element as the child (default `ChevronDown`). `id`/`data-*` pass through
 * onto the `<span>`.
 */
export interface SelectIconProps extends HTMLAttributes<HTMLSpanElement> {}

/**
 * Props of {@link Select.Content} slot (RRU-057): the floating `role="listbox"`
 * popup. Portals to `document.body` while open, positions itself with
 * `usePopoverPosition` (default `bottom-start`, flip/overflow aware), owns the
 * overlay lifecycle (NO focus trap / NO scroll lock — non-modal by design) and
 * returns `null` pre-hydration and when closed (SSR-safe). `placement`,
 * `id`, `data-*` and the consumer's `className` merge pass through.
 */
export interface SelectContentProps extends HTMLAttributes<HTMLDivElement> {
  /** Floating placement of the listbox. Defaults to `bottom-start`. */
  placement?: SelectPlacement;
  /** Grouping of the options inside the listbox. */
  children?: ReactNode;
}

/**
 * Props of {@link Select.Item} slot (RRU-057): one `role="option"`. The item
 * carries the consumer's own `value` in a `data-value` attribute (read at
 * keydown/click time), renders `aria-selected` ONLY when actually selected,
 * `aria-disabled="true"` + `.rr-select-item--disabled` when disabled, and on
 * selection asks the root to select + close. `id`/`data-*` pass through.
 */
export interface SelectItemProps extends Omit<HTMLAttributes<HTMLDivElement>, "value"> {
  /** The value this option selects. */
  value: string;
  /** Disabled options are never focusable and never selectable (WCAG). */
  disabled?: boolean;
  /** The visible label of the option. Defaults to the option's text content
   *  (used for type-ahead and for the `.Value` label). */
  children?: ReactNode;
}

/**
 * Props of {@link Select.Group} slot (RRU-057): an `role="group"` wrapper for
 * a labeled cluster of options. `id`/`data-*` pass through.
 */
export interface SelectGroupProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

/**
 * Props of {@link Select.Label} slot (RRU-057): the group label cell. It is
 * NOT an option — it never takes roving focus and is skipped by the keyboard
 * hook (`[role="option"]` selector); it stays readable to assistive
 * technology, so the group context is announced on option focus.
 */
export interface SelectLabelProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}
