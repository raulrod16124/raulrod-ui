import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

/**
 * Internal context payload of {@link Dialog} (RRU-053), consumed by the slots.
 * The root is the ONLY provider; slots read `open`/`setOpen` for the
 * controlled/uncontrolled contract and the generated ids/ARIA relationships.
 * `contentId` is the `<Dialog.Content>` id (referenced by the trigger's
 * `aria-controls`); `labelId`/`descriptionId` exist only when the
 * `<Dialog.Title>` / `<Dialog.Description>` slots are present, so the `aria-labelledby`
 * / `aria-describedby` of the dialog are never empty (DoD #2, ADR-004 §Decision:
 * wiring by slot presence). Never styled and never part of the public API.
 * @internal not re-exported from the package root (frontera §24).
 */
export interface DialogContextValue {
  /** Whether the dialog is open (resolved by the root, controlled or not). */
  open: boolean;
  /** Opens/closes the dialog through the root (fires `onOpenChange`). */
  setOpen: (open: boolean) => void;
  /** Id of `<Dialog.Content>`, stamped on the panel and wired to the trigger's
   *  `aria-controls` (RRU-115: both ends of the relationship are owned by the
   *  root, so the reference always resolves to a real node while open). */
  contentId: string;
  /** `<Dialog.Title>` id, referenced by `aria-labelledby` (present only when the slot is). */
  labelId?: string;
  /** `<Dialog.Description>` id, referenced by `aria-describedby` (present only when the slot is). */
  descriptionId?: string;
}

/**
 * Props of {@link Dialog} (RRU-053), the composition root. Pure provider — it
 * renders no DOM of its own (composite API, guide §15 / ADR-004): the consumer
 * composes `Dialog.Trigger` + `Dialog.Content` (with `.Header/.Title/.Description/.Footer`)
 * as siblings and the root wires the open state, ids and ARIA between them.
 *
 * Controlled/uncontrolled live here (precedent RadioGroup):
 * ```
 * <Dialog open={open} onOpenChange={setOpen}>          // controlled
 * <Dialog defaultOpen>                                 // uncontrolled
 * ```
 */
export interface DialogProps {
  /** Controlled open state; when provided the dialog is controlled. */
  open?: boolean;
  /** Initial open state for the uncontrolled variant (default `false`). */
  defaultOpen?: boolean;
  /** Fired whenever open state changes (trigger click, Escape, backdrop). */
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

/** Props of the `<Dialog.Trigger>` slot: a real `<button>` with the dialog
 *  ARIA wiring forced after the spread (`aria-haspopup="dialog"`,
 *  `aria-expanded`, `aria-controls`) and a chained onClick that opens it while
 *  still calling the consumer's own `onClick`. */
export interface DialogTriggerProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {}

/** Props of the `<Dialog.Content>` slot: the `<div role="dialog">` rendered
 *  through a portal while open. Carries `aria-modal`, `aria-labelledby` /
 *  `aria-describedby` (derived from slot presence) and is `tabIndex={-1}`
 *  (receives the initial focus; ARIA APG modal-dialog pattern). The `id` is
 *  owned by the root (the trigger's `aria-controls` target, RRU-115) and forced
 *  after the spread, so an `id` passed here is ignored. */
export interface DialogContentProps extends HTMLAttributes<HTMLDivElement> {}

/** Props of the `<Dialog.Header>` slot: layout wrapper (column, gap) for the
 *  Title/Description. */
export interface DialogHeaderProps extends HTMLAttributes<HTMLDivElement> {}

/** Props of the `<Dialog.Title>` slot: an `<h2>` stamped with the
 *  `aria-labelledby` target id. Referenced by the dialog's `aria-labelledby`
 *  when the slot is present. */
export interface DialogTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

/** Props of the `<Dialog.Description>` slot: a `<p>` stamped with the
 *  `aria-describedby` target id. */
export interface DialogDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}

/** Props of the `<Dialog.Footer>` slot: layout wrapper (row, justify-end, gap)
 *  for the action buttons. */
export interface DialogFooterProps extends HTMLAttributes<HTMLDivElement> {}
