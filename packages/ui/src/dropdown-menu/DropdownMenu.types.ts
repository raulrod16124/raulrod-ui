import type { PopoverPlacement } from "../utils/popover.js";
import type { ButtonHTMLAttributes, HTMLAttributes, MouseEvent, ReactNode, RefObject } from "react";

/** Public `placement` re-export under a DropdownMenu-coherent name (single
 *  source stays `PopoverPlacement` in `utils/popover.ts`, RRU-054). */
export type DropdownMenuPlacement = PopoverPlacement;

/**
 * Internal context payload shared by BOTH providers of the DropdownMenu
 * composite (RRU-055): `DropdownMenuContext` (the root) and
 * `DropdownMenuSubContext` (one per `<DropdownMenu.Sub>`). Same shape on
 * purpose — every level floats a `role="menu"` panel off its own trigger, so
 * the root slots and the sub slots consume an identical contract; what differs
 * is which nearest provider they read (root slots read the root context, the
 * sub slots the sub context). The trigger REF is OWNED by its provider (a ref
 * held through `useRef` in the provider component); the `<…Trigger>` slot only
 * registers its node through `setTriggerRef` (react-hooks/immutability, same
 * rationale as Popover/Dialog). `contentId` is the id of the matching
 * `<…Content>`, wired to the trigger's `aria-controls`. Never styled and never
 * part of the public API.
 * @internal not re-exported from the package root (frontera §24).
 */
export interface DropdownMenuContextValue {
  /** Whether this level's menu is open (root resolves controlled/uncontrolled;
   *  submenus are always uncontrolled). */
  open: boolean;
  /** Opens/closes this level (on the root it fires `onOpenChange`). */
  setOpen: (open: boolean) => void;
  /** Id of the level's `<…Content>`; wired to the trigger's `aria-controls`. */
  contentId: string;
  /** The level's trigger DOM node — the anchor the content floats to. */
  triggerRef: RefObject<HTMLButtonElement | null>;
  /** Registers the trigger node (owned by the provider, see above). */
  setTriggerRef: (node: HTMLButtonElement | null) => void;
}

/**
 * Props of {@link DropdownMenu} (RRU-055), the composition root. Pure provider —
 * it renders no DOM of its own (ADR-004): the consumer composes
 * `DropdownMenu.Trigger`, `DropdownMenu.Content` and the item/sub slots as
 * siblings and the root wires open state, ids, ARIA and the anchor between
 * them. Non-modal: no focus trap, no `aria-modal`, no scroll lock; Escape,
 * outside pointer-down, Tab and re-clicking the trigger close it.
 *
 * Controlled/uncontrolled live here (precedent RadioGroup / Dialog):
 * ```
 * <DropdownMenu open={open} onOpenChange={setOpen}>  // controlled
 * <DropdownMenu defaultOpen>                         // uncontrolled
 * ```
 */
export interface DropdownMenuProps {
  /** Controlled open state; when provided the dropdown is controlled. */
  open?: boolean;
  /** Initial open state for the uncontrolled variant (default `false`). */
  defaultOpen?: boolean;
  /** Fired whenever the root open state changes (trigger click, Escape,
   *  outside, item selection, Tab). */
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

/** Props of the `<DropdownMenu.Trigger>` slot: a real `<button>` (the menu
 *  button) with the menu ARIA wiring forced after the spread
 *  (`aria-haspopup="menu"`, `aria-expanded`, `aria-controls`) and a chained
 *  `onClick` that TOGGLES the menu while still calling the consumer's own
 *  `onClick`. Styled neutral by default (ADR-004): consumers wrap it in
 *  `Button`/`IconButton` when they want the toolbar look. */
export interface DropdownMenuTriggerProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "type"
> {}

/** Props of the `<DropdownMenu.Content>` slot: the `<div role="menu">` rendered
 *  through a portal while open, floated next to the trigger by the internal
 *  position hook (flip/overflow aware, DoD #1). Its children are the item/sub
 *  slots; roving focus + type-ahead are handled internally (RRU-055 DoD #2). */
export interface DropdownMenuContentProps extends HTMLAttributes<HTMLDivElement> {
  /** Side + alignment of the menu relative to the trigger (default
   *  `"bottom-start"`). Mirrors to the opposite side and clamps to the viewport
   *  when space runs out. */
  placement?: DropdownMenuPlacement;
}

/** Props of the `<DropdownMenu.Item>` slot: a real `<button role="menuitem">`
 *  (native-first, precedent Button/Radio/Switch) whose activation — click,
 *  Enter or Space — selects: it fires `onSelect` and then CLOSES the whole
 *  tree (root). `startIcon`/`endIcon` are rendered decoratively
 *  (`aria-hidden`) around the label, naming following Button (RRU-041). */
export interface DropdownMenuItemProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "type"
> {
  /** Fired on item activation (click/Enter/Space); the tree then closes. */
  onSelect?: (event: MouseEvent<HTMLButtonElement>) => void;
  /** Leading node shown before the label (decorative). */
  startIcon?: ReactNode;
  /** Trailing node shown after the label (decorative). */
  endIcon?: ReactNode;
}

/** Props of the `<DropdownMenu.Separator>` slot: `<div role="separator">`. */
export interface DropdownMenuSeparatorProps extends HTMLAttributes<HTMLDivElement> {}

/** Props of {@link DropdownMenuSub} (RRU-055): the sub-menu provider, a pure
 *  state holder — same provider-root exception as the DropdownMenu root (no
 *  DOM of its own). Holds the submenu's open state, content id and trigger
 *  ref; the consumer composes `SubTrigger` + `SubContent` inside it. */
export interface DropdownMenuSubProps {
  children?: ReactNode;
}

/** Props of the `<DropdownMenu.SubTrigger>` slot: the menu ITEM that owns a
 *  sub-menu — a real `<button role="menuitem">` with `aria-haspopup="menu"` +
 *  `aria-expanded` + `aria-controls`. ArrowRight or pointer-enter opens the
 *  sub-menu. Defaults `endIcon` to a `ChevronRight` affordance (ADR-004
 *  pre-set affordance, i.e. `rr-dropdown-trigger`-style hard-coded default). */
export interface DropdownMenuSubTriggerProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "type"
> {
  /** Leading node shown before the label (decorative). */
  startIcon?: ReactNode;
  /** Trailing node; defaults to a `ChevronRight` affordance. */
  endIcon?: ReactNode;
}

/** Props of the `<DropdownMenu.SubContent>` slot: the `<div role="menu">` of a
 *  sub-menu, portaled + floated beside its trigger (default `"right-start"`,
 *  flip to the left when short on space). Same panel look, keyboard and
 *  dismissal lifecycle as the root content, bound to the sub-level context. */
export interface DropdownMenuSubContentProps extends HTMLAttributes<HTMLDivElement> {
  /** Side + alignment of the sub-menu relative to its trigger (default
   *  `"right-start"`; flips/clamps like `.Content`). */
  placement?: DropdownMenuPlacement;
}
