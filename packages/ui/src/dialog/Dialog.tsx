import type {
  DialogContentProps,
  DialogContextValue,
  DialogDescriptionProps,
  DialogFooterProps,
  DialogHeaderProps,
  DialogProps,
  DialogTitleProps,
  DialogTriggerProps,
} from "./Dialog.types.js";
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
import { useFocusTrap } from "../utils/focus-trap.js";
import { mergeRefs } from "../utils/merge-refs.js";
import { useScrollLock } from "../utils/scroll-lock.js";
import { useId } from "../utils/use-id.js";

/**
 * Dialog (RRU-053): modal overlay built on the shared overlay primitives
 * (RRU-052) and the composite API (guide §15, ADR-004). The root is a PURE
 * provider — it renders no DOM of its own (documented exception to the
 * ref-rendering convention: there is no element to attach a ref to, so it is
 * not a `forwardRef`); `Dialog.Content` is the element that opens, portals to
 * `document.body`, applies scroll-lock + focus-trap + focus-return +
 * dismissable-layer and renders the dialog panel.
 *
 * A11y by construction (DoD #2, ADR-004): the root walks the children tree for
 * the Title/Description slots and derives `aria-labelledby`/`aria-describedby`
 * from their PRESENCE — never an empty reference. The trigger gets
 * `aria-haspopup="dialog"` + `aria-expanded` + `aria-controls` pointing at the
 * content id, and the panel STAMPS that same id (RRU-115: an `aria-controls`
 * whose target does not exist is an idref the consumer cannot resolve — same
 * wiring Popover/Select/DropdownMenu already had). When open, focus lands on the
 * panel (`tabIndex={-1}`, ARIA APG modal-dialog) and is trapped; Escape, backdrop
 * pointer-down and the Close button dismiss; closing restores focus to the
 * trigger (DoD #1).
 */

export function Dialog({ open, defaultOpen = false, onOpenChange, children }: DialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const controlled = open !== undefined;
  const isOpen = controlled ? open : uncontrolledOpen;

  const setOpen = (next: boolean): void => {
    if (!controlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  const contentId = useId("rr-dialog");
  const [hasTitle, hasDescription] = collectSlots(children);
  const labelId = hasTitle ? `${contentId}-title` : undefined;
  const descriptionId = hasDescription ? `${contentId}-description` : undefined;

  const dialog: DialogContextValue = {
    open: isOpen,
    setOpen,
    contentId,
    ...(labelId !== undefined && { labelId }),
    ...(descriptionId !== undefined && { descriptionId }),
  };

  return <DialogContext.Provider value={dialog}>{children}</DialogContext.Provider>;
}
Dialog.displayName = "Dialog";

/** `Dialog.Trigger` slot: the `<button>` that opens the dialog. The dialog
 *  ARIA wiring is forced after the spread so the consumer cannot break it;
 *  the consumer's `onClick` is chained after the open call. */
export const DialogTrigger = forwardRef<HTMLButtonElement, DialogTriggerProps>(
  function DialogTrigger({ className, onClick, children, ...props }, ref) {
    const dialog = useDialogContext();
    return (
      <button
        {...props}
        ref={ref}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={dialog.open}
        aria-controls={dialog.contentId}
        className={cx("rr-dialog-trigger", className)}
        onClick={(event) => {
          dialog.setOpen(true);
          onClick?.(event);
        }}
      >
        {children}
      </button>
    );
  },
);
DialogTrigger.displayName = "DialogTrigger";

/** `Dialog.Content` slot: portals the overlay to `document.body` while open
 *  and renders `<div role="dialog" aria-modal="true">`. Owns the overlay
 *  lifecycle — focus trap (over overlay node), scroll lock, focus return and
 *  dismissal (Escape + outside/backdrop pointer-down, both topmost-aware). The
 *  internal `panelRef` (the dismissable node, excluding the backdrop) is merged
 *  with the consumer's forwarded ref on the dialog element. The panel's `id` is
 *  the `contentId` of the root, forced AFTER the spread (RRU-115) so the
 *  consumer cannot leave the trigger's `aria-controls` pointing at a node that
 *  does not exist; a consumer-supplied `id` is therefore ignored. `tabIndex={-1}`
 *  makes the panel the initial-focus target (ARIA APG). Renders `null`
 *  (and runs the hooks inactive) while closed → SSR-safe, same first markup. */
export const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(function DialogContent(
  { className, children, ...props },
  ref,
) {
  const dialog = useDialogContext();
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useFocusTrap({ container: overlayRef, active: dialog.open });
  useFocusReturn({ active: dialog.open });
  useScrollLock({ active: dialog.open });
  useDismissableLayer({
    nodeRef: panelRef,
    active: dialog.open,
    onEscape: () => dialog.setOpen(false),
    onPointerDownOutside: () => dialog.setOpen(false),
  });

  // Initial focus: on the panel, once the trap is active (effect order above).
  useEffect(() => {
    if (dialog.open) panelRef.current?.focus();
  }, [dialog.open]);

  if (!dialog.open) return null;

  return (
    <Portal>
      <div ref={overlayRef} className="rr-dialog">
        <div className="rr-dialog-backdrop" aria-hidden="true" />
        <div
          {...props}
          ref={mergeRefs(panelRef, ref)}
          id={dialog.contentId}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          aria-labelledby={dialog.labelId}
          aria-describedby={dialog.descriptionId}
          className={cx("rr-dialog-content", className)}
        >
          {children}
        </div>
      </div>
    </Portal>
  );
});
DialogContent.displayName = "DialogContent";

/** `Dialog.Header` slot: layout wrapper (column + gap) for Title/Description. */
export const DialogHeader = forwardRef<HTMLDivElement, DialogHeaderProps>(function DialogHeader(
  { className, ...props },
  ref,
) {
  return <div {...props} ref={ref} className={cx("rr-dialog-header", className)} />;
});
DialogHeader.displayName = "DialogHeader";

/** `Dialog.Title` slot: the `<h2>` referenced by the dialog's
 *  `aria-labelledby` (the id is stamped only when this slot exists — DoD #2). */
export const DialogTitle = forwardRef<HTMLHeadingElement, DialogTitleProps>(function DialogTitle(
  { className, children, ...props },
  ref,
) {
  const dialog = useDialogContext();
  return (
    <h2 {...props} ref={ref} id={dialog.labelId} className={cx("rr-dialog-title", className)}>
      {children}
    </h2>
  );
});
DialogTitle.displayName = "DialogTitle";

/** `Dialog.Description` slot: a `<p>` referenced by the dialog's
 *  `aria-describedby` (id stamped only when the slot exists). */
export const DialogDescription = forwardRef<HTMLParagraphElement, DialogDescriptionProps>(
  function DialogDescription({ className, ...props }, ref) {
    const dialog = useDialogContext();
    return (
      <p
        {...props}
        ref={ref}
        id={dialog.descriptionId}
        className={cx("rr-dialog-description", className)}
      />
    );
  },
);
DialogDescription.displayName = "DialogDescription";

/** `Dialog.Footer` slot: layout wrapper (row, justify-end + gap) for actions. */
export const DialogFooter = forwardRef<HTMLDivElement, DialogFooterProps>(function DialogFooter(
  { className, ...props },
  ref,
) {
  return <div {...props} ref={ref} className={cx("rr-dialog-footer", className)} />;
});
DialogFooter.displayName = "DialogFooter";

// Slots mounted as properties of the root (ADR-004 §Decision mecánica):
// `<Dialog.Trigger>`, `<Dialog.Content>`, …
Dialog.Trigger = DialogTrigger;
Dialog.Content = DialogContent;
Dialog.Header = DialogHeader;
Dialog.Title = DialogTitle;
Dialog.Description = DialogDescription;
Dialog.Footer = DialogFooter;

const DialogContext = createContext<DialogContextValue | null>(null);
DialogContext.displayName = "DialogContext";

function useDialogContext(): DialogContextValue {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("Dialog slots must be used within a <Dialog> root");
  }
  return context;
}

/** Composition root slot-detection (ADR-004, precedent FormField `collectSlots`):
 *  walks the children tree (recursively honoring arrays, fragments and
 *  conditional expressions) looking for the Title/Description slots. Their
 *  PRESENCE activates the `aria-labelledby`/`aria-describedby` wiring; absent
 *  slots mean no idref at all (axe-safe). Render-phase + side-effect free →
 *  identical markup on server and client. */
function collectSlots(children: ReactNode): [boolean, boolean] {
  let title = false;
  let description = false;

  const walk = (node: ReactNode): void => {
    Children.forEach(node, (child) => {
      if (!isValidElement(child)) return;
      if (child.type === DialogTitle) {
        title = true;
      } else if (child.type === DialogDescription) {
        description = true;
      }
      const nested = (child.props as { children?: ReactNode }).children;
      if (nested !== undefined) walk(nested);
    });
  };

  walk(children);
  return [title, description];
}
