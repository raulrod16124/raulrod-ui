import type { PopoverPlacement } from "../utils/popover.js";
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

/** Public `placement` re-export (single source in `utils/popover.ts`). */
export type { PopoverPlacement } from "../utils/popover.js";

/**
 * Internal context payload of {@link Popover} (RRU-054), consumed by the
 * slots. The root is the ONLY provider; slots read `open`/`setOpen` for the
 * controlled/uncontrolled contract and the generated ids for the ARIA
 * relationships. The anchor REF stays OWNED by the root (a ref held through
 * `useRef` in the provider); the `<Popover.Trigger>` only registers its node
 * through `setTriggerRef`, so no slot ever mutates an object read from a hook
 * (react-hooks/immutability — the trigger is a separate sibling from the
 * content that consumes the node, so it cannot be threaded by a simple
 * merged-forwarded-ref). `.Content` reads `triggerRef` — the anchor its
 * position hook floats to (popover.ts / use-popover-position.js). `contentId`
 * is the `<Popover.Content>` id (referenced by the trigger's
 * `aria-controls`); `labelId` exists only when the `<Popover.Title>` slot is
 * present, so `aria-labelledby` is never empty (WCAG 4.1.2, axe
 * `aria-dialog-name`). Never styled and never part of the public API.
 * @internal not re-exported from the package root (frontera §24).
 */
export interface PopoverContextValue {
  /** Whether the popover is open (resolved by the root, controlled or not). */
  open: boolean;
  /** Opens/closes the popover through the root (fires `onOpenChange`). */
  setOpen: (open: boolean) => void;
  /** Id of `<Popover.Content>`; wired to the trigger's `aria-controls`. */
  contentId: string;
  /** `<Popover.Title>` id, referenced by `aria-labelledby` (only when present). */
  labelId?: string;
  /** The `<Popover.Trigger>` DOM node — the anchor the content floats to. */
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  /** Registers the `<Popover.Trigger>` node (owned by the root, see above). */
  setTriggerRef: (node: HTMLButtonElement | null) => void;
}

/**
 * Props of {@link Popover} (RRU-054), the composition root. Pure provider — it
 * renders no DOM of its own (ADR-004): the consumer composes
 * `Popover.Trigger` + `Popover.Content` (optionally `Popover.Title`) as
 * siblings and the root wires open state, ids, ARIA and the anchor between
 * them.
 *
 * Non-modal by design (unlike Dialog, RRU-053): no focus trap, no
 * `aria-modal`, no scroll lock — Tab freely leaves the panel; Escape, outside
 * pointer-down and re-clicking the trigger close it.
 *
 * Controlled/uncontrolled live here (precedent RadioGroup / Dialog):
 * ```
 * <Popover open={open} onOpenChange={setOpen}>     // controlled
 * <Popover defaultOpen>                            // uncontrolled
 * ```
 */
export interface PopoverProps {
  /** Controlled open state; when provided the popover is controlled. */
  open?: boolean;
  /** Initial open state for the uncontrolled variant (default `false`). */
  defaultOpen?: boolean;
  /** Fired whenever open state changes (trigger click, Escape, outside). */
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

/** Props of the `<Popover.Trigger>` slot: a real `<button>` (the floating
 *  anchor) with the popover ARIA wiring forced after the spread
 *  (`aria-haspopup="dialog"`, `aria-expanded`, `aria-controls`) and a chained
 *  `onClick` that TOGGLES the popover while still calling the consumer's own
 *  `onClick`. Styled neutral by default (ADR-004): consumers wrap it in
 *  `Button`/`IconButton` when they want the toolbar look. */
export interface PopoverTriggerProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "type"
> {}

/** Props of the `<Popover.Content>` slot: the `<div role="dialog">` rendered
 *  through a portal while open, floated next to the trigger by the internal
 *  position hook (never overflows the viewport — flip/overflow, DoD #1).
 *  Carries `aria-labelledby` (derived from `.Title` presence) and is
 *  `tabIndex={-1}` when it ends up holding the initial focus. */
export interface PopoverContentProps extends HTMLAttributes<HTMLDivElement> {
  /** Side + alignment of the popover relative to the trigger (default
   *  `"bottom"`, centered). Mirrors to the opposite side and clamps to the
   *  viewport when space runs out. */
  placement?: PopoverPlacement;
}

/** Props of the `<Popover.Title>` slot: an `<h2>` stamped with the
 *  `aria-labelledby` target id, referenced by the dialog's `aria-labelledby`
 *  when the slot is present (the accessible-name mechanism of the popover). */
export interface PopoverTitleProps extends HTMLAttributes<HTMLHeadingElement> {}
