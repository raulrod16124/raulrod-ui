// Internal dismissable-layer hook (RRU-052). Implements the classic overlay
// dismissal contract (guide §14: "outside interaction"): Escape and pointer
// interaction outside the layer close it. A tiny module-level registry of
// ACTIVE layers (ids, insertion order) is used ONLY to decide dismissal — the
// outermost/topmost active layer is the one that may dismiss, so stacked
// overlays (Tooltip over Dialog) close one level at a time without a global
// state manager (ADR-004, alternative D). The same registry doubles as the
// focus trap's view of "which portaled panels belong to my modal scope"
// (RRU-116): each trap pushes a modal context while active and every layer
// records the context that was topmost when it opened. Never exported from the
// package root (frontera §24); SSR-safe (effects only).
import type { RefObject } from "react";

import { useEffect, useRef } from "react";

export interface DismissableLayerOptions {
  /** The overlay's own DOM node; interactions within it are NOT outside. */
  nodeRef: RefObject<HTMLElement | null>;
  /** Additional nodes treated as INSIDE the layer for the outside-pointer
   *  check (e.g. a Popover's trigger: pointer-down there must NOT dismiss the
   *  layer — the trigger's own toggle owns the interaction). Only the pointer
   *  check is affected; Escape/topmost logic is unchanged. */
  extraInsideRefs?: Array<RefObject<HTMLElement | null>>;
  /** When true the layer is open/active and may dismiss. */
  active: boolean;
  /** Fired on Escape while this layer is the topmost active one. */
  onEscape?: () => void;
  /** Fired on any interaction (pointerdown) outside the layer. */
  onInteractOutside?: (event: Event) => void;
  /** Fired specifically when a pointer-down lands outside the layer. */
  onPointerDownOutside?: (event: Event) => void;
}

/** One active overlay: its DOM node (for focus-scope queries) and the modal
 *  context it was opened under (RRU-116). */
interface ActiveLayer {
  node: HTMLElement | null;
  context: symbol | null;
}

/** Active layers in activation order; the LAST one is the topmost layer. */
const activeLayers = new Map<symbol, ActiveLayer>();

/**
 * Stack of MODAL trap contexts (RRU-116). `useFocusTrap` pushes its own
 * context id while active and pops it on deactivate; every dismissable layer
 * activated while a context is topmost records that context, which lets a trap
 * know which portaled overlay panels belong to ITS modal scope (and only
 * theirs) when it computes the tabbable cycle — a nested Dialog records its
 * own context, so stacked modals never bleed into each other's trap.
 */
const modalContextStack: symbol[] = [];

/** The trapped container each open context belongs to (RRU-117). The trap hands
 *  its node over when it pushes the context, so anything that needs the modal
 *  SCOPE (the trap itself, focus restoration) can rebuild it without the trap
 *  having to expose anything. */
const modalContainers = new Map<symbol, HTMLElement>();

function registerLayer(id: symbol, node: HTMLElement | null): void {
  const context = modalContextStack[modalContextStack.length - 1] ?? null;
  activeLayers.set(id, { node, context });
}

function unregisterLayer(id: symbol): void {
  activeLayers.delete(id);
}

function isTopmostLayer(id: symbol): boolean {
  const layers = [...activeLayers.keys()];
  return layers[layers.length - 1] === id;
}

/** Opens a new modal context for a focus trap and returns its id. `container`
 *  is the node the trap keeps focus inside of, kept here so the modal scope can
 *  be rebuilt by any consumer of this registry (RRU-117). */
export function pushModalContext(container: HTMLElement): symbol {
  const context = Symbol("modal-context");
  modalContextStack.push(context);
  modalContainers.set(context, container);
  return context;
}

/** Closes a focus trap's modal context. */
export function popModalContext(context: symbol): void {
  const index = modalContextStack.lastIndexOf(context);
  if (index !== -1) modalContextStack.splice(index, 1);
  modalContainers.delete(context);
}

/** The DOM nodes of the overlay panels that opened under `context` and are
 *  still active — the portaled siblings a trap must include in its cycle. */
export function getActiveLayerNodesInContext(context: symbol): HTMLElement[] {
  const nodes: HTMLElement[] = [];
  for (const layer of activeLayers.values()) {
    if (layer.context === context && layer.node !== null) nodes.push(layer.node);
  }
  return nodes;
}

/**
 * The focus scope of the TOPMOST open modal trap: its container plus the
 * portaled panels of the layers that opened under it, in the same
 * tabbable-order union the trap itself uses (RRU-116). Empty when no trap is
 * active, and a context whose container is already detached is treated as
 * absent — that happens exactly when the modal that owned it is closing, and a
 * detached node is not a scope anything can be focused into.
 *
 * Consumers: the focus trap (its Tab cycle) and `useFocusReturn` (RRU-117 — the
 * focus restored on close must not land behind a modal that is still open).
 * This is what makes "focus never leaves the modal scope" an invariant of the
 * infrastructure instead of a coincidence per overlay.
 */
export function getTopmostModalScopeNodes(): HTMLElement[] {
  const top = modalContextStack[modalContextStack.length - 1];
  if (top === undefined) return [];
  const container = modalContainers.get(top);
  if (container === undefined || !container.isConnected) return [];
  return [container, ...getActiveLayerNodesInContext(top)].filter((node) => node.isConnected);
}

/**
 * Wires Escape + outside-pointer dismissal while `active`. The latest callbacks
 * are mirrored into refs by a dedicated effect (react-hooks/refs: never update
 * refs during render) so the listener effect only re-binds on the `active`
 * transition and re-renders never touch the dirty rebound path. All DOM access
 * happens inside effects → SSR-safe.
 */
export function useDismissableLayer({
  nodeRef,
  extraInsideRefs,
  active,
  onEscape,
  onInteractOutside,
  onPointerDownOutside,
}: DismissableLayerOptions): void {
  const onEscapeRef = useRef(onEscape);
  const onInteractOutsideRef = useRef(onInteractOutside);
  const onPointerDownOutsideRef = useRef(onPointerDownOutside);
  const extraInsideRefsRef = useRef(extraInsideRefs);

  // Latest-callback mirror: runs after every render, before any listener
  // effect of the same commit, so the refs always hold the current callbacks.
  useEffect(() => {
    onEscapeRef.current = onEscape;
    onInteractOutsideRef.current = onInteractOutside;
    onPointerDownOutsideRef.current = onPointerDownOutside;
    extraInsideRefsRef.current = extraInsideRefs;
  });

  useEffect(() => {
    if (!active) return;
    const id = Symbol("dismissable-layer");
    registerLayer(id, nodeRef.current);

    const isPointerOnOwnNode = (event: Event): boolean => {
      const target = event.target;
      if (!(target instanceof Node)) return false;
      const node = nodeRef.current;
      if (node !== null && node.contains(target)) return true;
      return (extraInsideRefsRef.current ?? []).some(
        (ref) => ref.current !== null && ref.current.contains(target),
      );
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== "Escape") return;
      if (!isTopmostLayer(id)) return;
      // Consume the event explicitly so the topmost overlay is the only one
      // that reacts, and so browser defaults / ancestor listeners cannot
      // re-trigger dismissal or scroll. Coherent with useFocusTrap, which
      // also registers its keydown listener in capture phase.
      event.preventDefault();
      event.stopPropagation();
      onEscapeRef.current?.();
    };

    const handlePointerDown = (event: Event): void => {
      if (!isTopmostLayer(id)) return;
      if (isPointerOnOwnNode(event)) return;
      onPointerDownOutsideRef.current?.(event);
      onInteractOutsideRef.current?.(event);
    };

    // Capture phase, same as useFocusTrap, so overlay infrastructure always
    // wins over consumer listeners and the order does not depend on mount
    // order when multiple layers/traps are alive.
    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("pointerdown", handlePointerDown, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("pointerdown", handlePointerDown, true);
      unregisterLayer(id);
    };
  }, [active, nodeRef]);
}
