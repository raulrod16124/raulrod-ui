import type {
  PopoverContentProps,
  PopoverContextValue,
  PopoverProps,
  PopoverTitleProps,
  PopoverTriggerProps,
} from "./Popover.types.js";
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

import { Portal } from "../portal/index.js";
import { cx } from "../utils/cx.js";
import { useDismissableLayer } from "../utils/dismissable-layer.js";
import { useFocusReturn } from "../utils/focus-return.js";
import { getFocusableElements } from "../utils/focusable.js";
import { mergeRefs } from "../utils/merge-refs.js";
import { useId } from "../utils/use-id.js";
import { usePopoverPosition } from "../utils/use-popover-position.js";

/**
 * Popover (RRU-054): non-modal floating overlay built on the shared overlay
 * primitives (RRU-052) and the composite API (guide §14/§15, ADR-004). The
 * root is a PURE provider — no DOM of its own (documented exception to the
 * ref-rendering convention, same as Dialog): `Popover.Trigger` is the floating
 * anchor button and `Popover.Content` portals to `document.body`, positions
 * itself next to the anchor (never overflowing the viewport — DoD #1) and owns
 * the dismiss/focus lifecycle.
 *
 * A11y by construction: the trigger carries `aria-haspopup="dialog"` +
 * `aria-expanded` + `aria-controls` and TOGGLES on click; the content is
 * `<div role="dialog">` WITHOUT `aria-modal` (non-modal): Tab freely exits the
 * panel, Escape / outside pointer-down / re-clicking the trigger close it, and
 * closing restores focus to the trigger (focus-return). Initial focus goes to
 * the first focusable child, falling back to the panel itself. `Popover.Title`
 * stamps `aria-labelledby` only when present (never an empty idref).
 */

export function Popover({ open, defaultOpen = false, onOpenChange, children }: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const controlled = open !== undefined;
  const isOpen = controlled ? open : uncontrolledOpen;

  const setOpen = (next: boolean): void => {
    if (!controlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  const contentId = useId("rr-popover");
  const hasTitle = collectSlots(children);
  const labelId = hasTitle ? `${contentId}-title` : undefined;

  // The anchor lives on the Trigger (a sibling rendered by the consumer). The
  // REF stays owned by the root; the Trigger registers its node through
  // `setTriggerRef`, and `.Content` reads `triggerRef` to measure it — the two
  // slots never meet in the DOM, they meet only via the provider. Refs are
  // client-only → this stays SSR-safe. Writing `.current` here is fine: the
  // ref comes straight from this component's `useRef` (the immutability rule
  // only guards objects read back from hooks).
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const setTriggerRef = (node: HTMLButtonElement | null): void => {
    triggerRef.current = node;
  };

  const popover: PopoverContextValue = {
    open: isOpen,
    setOpen,
    contentId,
    triggerRef,
    setTriggerRef,
    ...(labelId !== undefined && { labelId }),
  };

  return <PopoverContext.Provider value={popover}>{children}</PopoverContext.Provider>;
}
Popover.displayName = "Popover";

/** `Popover.Trigger` slot: the anchor `<button>` that toggles the popover. The
 *  ARIA wiring is forced after the spread so the consumer cannot break it; the
 *  consumer's `onClick` is chained after the toggle. Its DOM node registers in
 *  the context as the anchor (`triggerRef`) and is also counted as INSIDE the
 *  dismissable layer, so a re-click closes instead of double-firing. */
export const PopoverTrigger = forwardRef<HTMLButtonElement, PopoverTriggerProps>(
  function PopoverTrigger({ className, onClick, children, ...props }, ref) {
    const popover = usePopoverContext();
    return (
      <button
        {...props}
        ref={mergeRefs((node) => {
          popover.setTriggerRef(node);
        }, ref)}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={popover.open}
        aria-controls={popover.contentId}
        className={cx("rr-popover-trigger", className)}
        onClick={(event) => {
          popover.setOpen(!popover.open);
          onClick?.(event);
        }}
      >
        {children}
      </button>
    );
  },
);
PopoverTrigger.displayName = "PopoverTrigger";

/** `Popover.Content` slot: portals the panel to `document.body` while open,
 *  floats it next to the trigger (`usePopoverPosition` — flip/overflow aware)
 *  and renders `<div role="dialog">` (non-modal). Owns the overlay lifecycle:
 *  focus return (`useFocusReturn`), initial focus (first focusable, else the
 *  panel) and dismissal (`useDismissableLayer`: Escape + outside pointer-down,
 *  with the trigger as an inside node so re-clicks toggle). NO focus trap and
 *  NO scroll lock by design — the popover is non-modal. The internal
 *  `panelRef` (measured + dismissed) is merged with the consumer's forwarded
 *  ref. Renders `null` (and runs the hooks inactive) while closed → SSR-safe. */
export const PopoverContent = forwardRef<HTMLDivElement, PopoverContentProps>(
  function PopoverContent({ className, placement = "bottom", children, ...props }, ref) {
    const popover = usePopoverContext();
    const panelRef = useRef<HTMLDivElement>(null);

    useFocusReturn({ active: popover.open });
    useDismissableLayer({
      nodeRef: panelRef,
      extraInsideRefs: [popover.triggerRef],
      active: popover.open,
      onEscape: () => popover.setOpen(false),
      onPointerDownOutside: () => popover.setOpen(false),
    });
    usePopoverPosition({
      anchorRef: popover.triggerRef,
      panelRef,
      placement,
      active: popover.open,
    });

    // Initial focus (guide §14): first focusable child, else the panel itself
    // (ARIA APG non-modal dialog). `preventScroll` avoids a jump.
    useEffect(() => {
      if (!popover.open) return;
      const node = panelRef.current;
      if (!node) return;
      const first = getFocusableElements(node)[0];
      (first ?? node).focus({ preventScroll: true });
    }, [popover.open]);

    if (!popover.open) return null;

    return (
      <Portal>
        <div
          {...props}
          ref={mergeRefs(panelRef, ref)}
          id={popover.contentId}
          role="dialog"
          tabIndex={-1}
          aria-labelledby={popover.labelId}
          className={cx("rr-popover-content", className)}
        >
          {children}
        </div>
      </Portal>
    );
  },
);
PopoverContent.displayName = "PopoverContent";

/** `Popover.Title` slot: the `<h2>` referenced by the dialog's
 *  `aria-labelledby` (id stamped only when the slot exists — the popover's
 *  accessible-name mechanism). */
export const PopoverTitle = forwardRef<HTMLHeadingElement, PopoverTitleProps>(function PopoverTitle(
  { className, children, ...props },
  ref,
) {
  const popover = usePopoverContext();
  return (
    <h2 {...props} ref={ref} id={popover.labelId} className={cx("rr-popover-title", className)}>
      {children}
    </h2>
  );
});
PopoverTitle.displayName = "PopoverTitle";

// Slots mounted as properties of the root (ADR-004 §Decision mecánica):
// `<Popover.Trigger>`, `<Popover.Content>`, `<Popover.Title>`.
Popover.Trigger = PopoverTrigger;
Popover.Content = PopoverContent;
Popover.Title = PopoverTitle;

const PopoverContext = createContext<PopoverContextValue | null>(null);
PopoverContext.displayName = "PopoverContext";

function usePopoverContext(): PopoverContextValue {
  const context = useContext(PopoverContext);
  if (!context) {
    throw new Error("Popover slots must be used within a <Popover> root");
  }
  return context;
}

/** Composition root slot-detection (ADR-004, precedent Dialog `collectSlots`):
 *  walks the children tree (recursively honoring arrays, fragments and
 *  conditional expressions) looking for the Title slot. Its PRESENCE activates
 *  `aria-labelledby`; absent → no idref at all (axe-safe). Render-phase +
 *  side-effect free → identical markup on server and client. */
function collectSlots(children: ReactNode): boolean {
  let title = false;

  const walk = (node: ReactNode): void => {
    Children.forEach(node, (child) => {
      if (!isValidElement(child)) return;
      if (child.type === PopoverTitle) {
        title = true;
      }
      const nested = (child.props as { children?: ReactNode }).children;
      if (nested !== undefined) walk(nested);
    });
  };

  walk(children);
  return title;
}
