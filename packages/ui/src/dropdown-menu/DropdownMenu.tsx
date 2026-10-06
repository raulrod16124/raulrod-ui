import type {
  DropdownMenuContentProps,
  DropdownMenuContextValue,
  DropdownMenuItemProps,
  DropdownMenuProps,
  DropdownMenuSeparatorProps,
  DropdownMenuSubContentProps,
  DropdownMenuSubProps,
  DropdownMenuSubTriggerProps,
  DropdownMenuTriggerProps,
} from "./DropdownMenu.types.js";

import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { ChevronRight } from "@raulrod/icons";

import { Portal } from "../portal/index.js";
import { cx } from "../utils/cx.js";
import { useDismissableLayer } from "../utils/dismissable-layer.js";
import { useFocusReturn } from "../utils/focus-return.js";
import { mergeRefs } from "../utils/merge-refs.js";
import { useId } from "../utils/use-id.js";
import {
  focusFirstMenuItem,
  focusLastMenuItem,
  useMenuKeyboard,
} from "../utils/use-menu-keyboard.js";
import { usePopoverPosition } from "../utils/use-popover-position.js";

/**
 * DropdownMenu: menu button built on the shared overlay primitives,
 * the positioner and the composite API (guide §14/§15,
 * ADR-004). The root is a PURE provider — no DOM of its own (same documented
 * exception as Popover/Dialog): `DropdownMenu.Trigger` is the menu button,
 * `DropdownMenu.Content` portals the `role="menu"` panel to `document.body`
 * and owns the open/dismiss/focus/keyboard lifecycle.
 *
 * Two provider layers, SAME context shape (DropdownMenu.types.ts): the root
 * context (open/contentId/triggerRef) and one sub context per
 * `<DropdownMenu.Sub>`. Root slots read the root context, sub slots the sub
 * context. A Sub is always a child of the (root or parent) `.Content`, so when
 * the tree closes the Sub unmounts with it — fresh closed state on the next
 * open, no cross-level state reset needed (SS §33).
 *
 * A11y by construction (DoD #2, WAI-ARIA Menu/Menu Button): the trigger is
 * `aria-haspopup="menu"` + `aria-expanded` + `aria-controls` and toggles on
 * click; the panel is `<div role="menu">` with `[role="menuitem"]` BUTTON
 * items. Disabled items use `aria-disabled` (APG) so they stay in the
 * accessibility tree and are announced as unavailable, while activation is
 * guarded so click/Enter/Space do nothing. Roving tabindex + type-ahead +
 * initial focus on the first enabled item, ArrowUp/Down with wrap over
 * disabled items, Home/End, ArrowLeft (sub level only), Tab closes the tree
 * and Escape/outside pointer-down/re-click dismiss through the topmost-aware
 * dismissable layer (§14): one level per interaction. Closing restores
 * focus to the triggering element (focus-return, nesting-correct via
 * per-instance capture).
 *
 * Non-modal by design (like Popover): no focus trap, no `aria-modal`, no
 * scroll lock — Tab freely leaves the panel.
 */

export function DropdownMenu({
  open,
  defaultOpen = false,
  onOpenChange,
  classNames,
  children,
}: DropdownMenuProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const controlled = open !== undefined;
  const isOpen = controlled ? open : uncontrolledOpen;

  const setOpen = (next: boolean): void => {
    if (!controlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  const contentId = useId("rr-dropdown");

  // The anchor lives on the Trigger. The REF stays OWNED by the root: the
  // Trigger registers its node through `setTriggerRef`, and `.Content` reads it
  // to measure the anchor — the two slots never meet in the DOM, only via the
  // provider (Popover/Dialog precedent; react-hooks/immutability).
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const setTriggerRef = (node: HTMLButtonElement | null): void => {
    triggerRef.current = node;
  };

  const focusLastOnOpenRef = useRef(false);
  const getFocusLastOnOpen = useCallback((): boolean => focusLastOnOpenRef.current, []);
  const setFocusLastOnOpen = useCallback((value: boolean): void => {
    focusLastOnOpenRef.current = value;
  }, []);

  const dropdown: DropdownMenuContextValue = {
    open: isOpen,
    setOpen,
    contentId,
    triggerRef,
    setTriggerRef,
    getFocusLastOnOpen,
    setFocusLastOnOpen,
    classNames,
  };

  return <DropdownMenuContext.Provider value={dropdown}>{children}</DropdownMenuContext.Provider>;
}
DropdownMenu.displayName = "DropdownMenu";

/** `DropdownMenu.Trigger` slot: the menu `<button>` that toggles the menu. The
 *  ARIA wiring is forced after the spread so the consumer cannot break it; the
 *  consumer's `onClick` is chained after the toggle. Its DOM node registers in
 *  the context as the anchor (`triggerRef`) and is counted INSIDE the
 *  dismissable layer, so a re-click closes instead of double-firing. */
export const DropdownMenuTrigger = forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  function DropdownMenuTrigger({ className, onClick, onKeyDown, children, ...props }, ref) {
    const dropdown = useDropdownMenuContext();
    return (
      <button
        {...props}
        ref={mergeRefs((node) => {
          dropdown.setTriggerRef(node);
        }, ref)}
        type="button"
        aria-haspopup="menu"
        aria-expanded={dropdown.open}
        aria-controls={dropdown.contentId}
        className={cx("rr-dropdown-trigger", dropdown.classNames?.trigger, className)}
        onClick={(event) => {
          dropdown.setOpen(!dropdown.open);
          onClick?.(event);
        }}
        onKeyDown={(event) => {
          if (dropdown.open) {
            onKeyDown?.(event);
            return;
          }
          switch (event.key) {
            case "ArrowDown":
            case "ArrowUp":
              event.preventDefault();
              event.stopPropagation();
              event.nativeEvent.stopImmediatePropagation();
              dropdown.setFocusLastOnOpen(event.key === "ArrowUp");
              dropdown.setOpen(true);
              break;
            default:
              break;
          }
          onKeyDown?.(event);
        }}
      >
        {children}
      </button>
    );
  },
);
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

/** `DropdownMenu.Content` slot: portals the `role="menu"` panel while open,
 *  floats it next to the trigger (`usePopoverPosition`, flip/overflow aware —
 *  DoD #1) and owns the overlay lifecycle: focus return, initial focus on the
 *  FIRST ENABLED item (APG), dismissal (Escape + outside pointer-down, trigger
 *  inside so re-clicks toggle) and the roving-focus/type-ahead keyboard
 *  (`useMenuKeyboard`). Renders `null` (and runs its hooks inactive) while
 *  closed → SSR-safe, identical first markup. */
export const DropdownMenuContent = forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  function DropdownMenuContent({ className, placement = "bottom-start", children, ...props }, ref) {
    const dropdown = useDropdownMenuContext();
    const panelRef = useRef<HTMLDivElement>(null);

    useFocusReturn({ active: dropdown.open, fallbackRef: dropdown.triggerRef });
    useDismissableLayer({
      nodeRef: panelRef,
      extraInsideRefs: [dropdown.triggerRef],
      active: dropdown.open,
      onEscape: () => dropdown.setOpen(false),
      onPointerDownOutside: () => dropdown.setOpen(false),
    });
    usePopoverPosition({
      anchorRef: dropdown.triggerRef,
      panelRef,
      placement,
      active: dropdown.open,
    });
    useMenuKeyboard({
      menuRef: panelRef,
      active: dropdown.open,
      onCloseMenu: () => dropdown.setOpen(false),
    });

    // Initial focus (APG: first enabled item). `useMenuKeyboard` roving writes
    // `tabIndex=0` on it during the same commit via keydown, but the FIRST
    // focus must be moved programmatically once. ArrowUp from the trigger opens
    // and focuses the LAST enabled item instead.
    const { open, getFocusLastOnOpen, setFocusLastOnOpen } = dropdown;
    useEffect(() => {
      if (!open) return;
      const focus = getFocusLastOnOpen() ? focusLastMenuItem : focusFirstMenuItem;
      focus(panelRef.current);
      setFocusLastOnOpen(false);
    }, [open, getFocusLastOnOpen, setFocusLastOnOpen]);

    if (!dropdown.open) return null;

    return (
      <Portal>
        <div
          {...props}
          ref={mergeRefs(panelRef, ref)}
          id={dropdown.contentId}
          role="menu"
          className={cx("rr-dropdown-menu", dropdown.classNames?.content, className)}
        >
          {children}
        </div>
      </Portal>
    );
  },
);
DropdownMenuContent.displayName = "DropdownMenuContent";

/** `DropdownMenu.Item` slot: a real `<button role="menuitem">`. Disabled
 *  items emit `aria-disabled` (APG) instead of the native `disabled`
 *  attribute, so they remain in the accessibility tree while being
 *  non-actionable. Activation — click, Enter or Space — fires `onSelect` and
 *  then closes the WHOLE tree only when the item is enabled; the root
 *  focus-return lands back on the menu button. Roving focus is managed by the
 *  parent panel: all items start `tabIndex={-1}` and the focused one carries
 *  `tabIndex={0}`. */
export const DropdownMenuItem = forwardRef<HTMLButtonElement, DropdownMenuItemProps>(
  function DropdownMenuItem(
    { className, disabled, onSelect, startIcon, endIcon, children, ...props },
    ref,
  ) {
    const dropdown = useDropdownMenuContext();
    return (
      <button
        {...props}
        ref={ref}
        type="button"
        role="menuitem"
        tabIndex={-1}
        aria-disabled={disabled || undefined}
        className={cx(
          "rr-dropdown-item",
          disabled && "rr-dropdown-item--disabled",
          dropdown.classNames?.item,
          className,
        )}
        onClick={(event) => {
          if (disabled) {
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          onSelect?.(event);
          dropdown.setOpen(false);
        }}
      >
        {startIcon !== undefined && (
          <span className="rr-dropdown-item__icon" aria-hidden="true">
            {startIcon}
          </span>
        )}
        <span className="rr-dropdown-item__label">{children}</span>
        {endIcon !== undefined && (
          <span className="rr-dropdown-item__icon" aria-hidden="true">
            {endIcon}
          </span>
        )}
      </button>
    );
  },
);
DropdownMenuItem.displayName = "DropdownMenuItem";

/** `DropdownMenu.Separator` slot: `<div role="separator">` between groups. */
export const DropdownMenuSeparator = forwardRef<HTMLDivElement, DropdownMenuSeparatorProps>(
  function DropdownMenuSeparator({ className, ...props }, ref) {
    const dropdown = useDropdownMenuContext();
    return (
      <div
        {...props}
        ref={ref}
        role="separator"
        className={cx("rr-dropdown-separator", dropdown.classNames?.separator, className)}
      />
    );
  },
);
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

/** `DropdownMenu.Sub` slot: a pure provider (no DOM, same exception as the
 *  root) holding ONE sub-menu level's open state, content id and trigger ref.
 *  The sub context lands between the root provider and the sub slots; Sub only
 *  renders a subtree so the slots stay siblings. State needs no reset on root
 *  close: a Sub is mounted INSIDE the parent `.Content`, which returns `null`
 *  when the tree closes — the Sub unmounts and remounts fresh. */
export function DropdownMenuSub({ children }: DropdownMenuSubProps) {
  const dropdown = useDropdownMenuContext();
  const [open, setOpen] = useState(false);

  const contentId = useId("rr-dropdown-sub");
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const setTriggerRef = (node: HTMLButtonElement | null): void => {
    triggerRef.current = node;
  };

  const focusLastOnOpenRef = useRef(false);
  const getFocusLastOnOpen = useCallback((): boolean => focusLastOnOpenRef.current, []);
  const setFocusLastOnOpen = useCallback((value: boolean): void => {
    focusLastOnOpenRef.current = value;
  }, []);

  const sub: DropdownMenuContextValue = {
    open,
    setOpen,
    contentId,
    triggerRef,
    setTriggerRef,
    getFocusLastOnOpen,
    setFocusLastOnOpen,
    classNames: dropdown.classNames,
  };

  return <DropdownMenuSubContext.Provider value={sub}>{children}</DropdownMenuSubContext.Provider>;
}
DropdownMenuSub.displayName = "DropdownMenuSub";

/** `DropdownMenu.SubTrigger` slot: the menu item that owns a sub-menu — a real
 *  `<button role="menuitem">` with `aria-haspopup="menu"` + `aria-expanded` +
 *  `aria-controls` (forced after the spread). ArrowRight (its own handler — the
 *  parent panel's keyboard hook deliberately leaves it alone) or pointer-enter
 *  opens the sub-menu; the sub-content's focus effect then lands on its first
 *  enabled item. Defaults `endIcon` to the `ChevronRight` affordance so the
 *  expanded-submenu cue exists without consumer effort. A disabled sub-trigger
 *  emits `aria-disabled` and ignores both opening gestures, matching the APG
 *  expectation that disabled menuitems are discoverable but non-actionable. */
export const DropdownMenuSubTrigger = forwardRef<HTMLButtonElement, DropdownMenuSubTriggerProps>(
  function DropdownMenuSubTrigger(
    { className, disabled, onKeyDown, startIcon, endIcon, children, ...props },
    ref,
  ) {
    const sub = useDropdownMenuSubContext();
    return (
      <button
        {...props}
        ref={mergeRefs((node) => {
          sub.setTriggerRef(node);
        }, ref)}
        type="button"
        role="menuitem"
        tabIndex={-1}
        aria-haspopup="menu"
        aria-expanded={sub.open}
        aria-controls={sub.contentId}
        aria-disabled={disabled || undefined}
        className={cx(
          "rr-dropdown-item",
          disabled && "rr-dropdown-item--disabled",
          sub.classNames?.subTrigger,
          className,
        )}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight" && !disabled) {
            event.preventDefault();
            sub.setOpen(true);
          }
          onKeyDown?.(event);
        }}
        onPointerEnter={() => {
          if (!disabled) sub.setOpen(true);
        }}
      >
        {startIcon !== undefined && (
          <span className="rr-dropdown-item__icon" aria-hidden="true">
            {startIcon}
          </span>
        )}
        <span className="rr-dropdown-item__label">{children}</span>
        <span className="rr-dropdown-item__icon" aria-hidden="true">
          {endIcon ?? <ChevronRight />}
        </span>
      </button>
    );
  },
);
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger";

/** `DropdownMenu.SubContent` slot: the `role="menu"` panel of a sub-menu,
 *  portaled + floated beside the sub-trigger (default `"right-start"`, flip to
 *  the left when short on space — DoD #1). Same lifecycle as the root content
 *  but bound to the SUB context: focus return to the sub-trigger, dismissal
 *  against the sub panel (one level per interaction, topmost-aware), focus on
 *  the first enabled sub-item, ArrowLeft closes THIS level only, and Tab closes
 *  the whole tree through the root context. */
export const DropdownMenuSubContent = forwardRef<HTMLDivElement, DropdownMenuSubContentProps>(
  function DropdownMenuSubContent(
    { className, placement = "right-start", children, ...props },
    ref,
  ) {
    const sub = useDropdownMenuSubContext();
    const dropdown = useDropdownMenuContext();
    const panelRef = useRef<HTMLDivElement>(null);

    useFocusReturn({ active: sub.open, fallbackRef: sub.triggerRef });
    useDismissableLayer({
      nodeRef: panelRef,
      extraInsideRefs: [sub.triggerRef],
      active: sub.open,
      onEscape: () => sub.setOpen(false),
      onPointerDownOutside: () => sub.setOpen(false),
    });
    usePopoverPosition({
      anchorRef: sub.triggerRef,
      panelRef,
      placement,
      margin: 4,
      active: sub.open,
    });
    useMenuKeyboard({
      menuRef: panelRef,
      active: sub.open,
      onCloseSubmenu: () => sub.setOpen(false),
      onCloseMenu: () => dropdown.setOpen(false),
    });

    useEffect(() => {
      if (sub.open) focusFirstMenuItem(panelRef.current);
    }, [sub.open]);

    if (!sub.open) return null;

    return (
      <Portal>
        <div
          {...props}
          ref={mergeRefs(panelRef, ref)}
          id={sub.contentId}
          role="menu"
          className={cx("rr-dropdown-menu", sub.classNames?.subContent, className)}
        >
          {children}
        </div>
      </Portal>
    );
  },
);
DropdownMenuSubContent.displayName = "DropdownMenuSubContent";

// Slots mounted as properties of the root (ADR-004 §Decision mecánica):
// `<DropdownMenu.Trigger>`, `.Content`, `.Item`, `.Separator`, `.Sub`,
// `.SubTrigger`, `.SubContent`.
DropdownMenu.Trigger = DropdownMenuTrigger;
DropdownMenu.Content = DropdownMenuContent;
DropdownMenu.Item = DropdownMenuItem;
DropdownMenu.Separator = DropdownMenuSeparator;
DropdownMenu.Sub = DropdownMenuSub;
DropdownMenu.SubTrigger = DropdownMenuSubTrigger;
DropdownMenu.SubContent = DropdownMenuSubContent;

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(null);
DropdownMenuContext.displayName = "DropdownMenuContext";

const DropdownMenuSubContext = createContext<DropdownMenuContextValue | null>(null);
DropdownMenuSubContext.displayName = "DropdownMenuSubContext";

function useDropdownMenuContext(): DropdownMenuContextValue {
  const context = useContext(DropdownMenuContext);
  if (!context) {
    throw new Error("DropdownMenu slots must be used within a <DropdownMenu> root");
  }
  return context;
}

function useDropdownMenuSubContext(): DropdownMenuContextValue {
  const context = useContext(DropdownMenuSubContext);
  if (!context) {
    throw new Error("DropdownMenu sub slots must be used within a <DropdownMenu.Sub>");
  }
  return context;
}
