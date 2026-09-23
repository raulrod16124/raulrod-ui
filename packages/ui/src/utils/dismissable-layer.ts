// Internal dismissable-layer hook (RRU-052). Implements the classic overlay
// dismissal contract (guide §14: "outside interaction"): Escape and pointer
// interaction outside the layer close it. A tiny module-level registry of
// ACTIVE layers (ids, insertion order) is used ONLY to decide dismissal — the
// outermost/topmost active layer is the one that may dismiss, so stacked
// overlays (Tooltip over Dialog) close one level at a time without a global
// state manager (ADR-004, alternative D). Never exported from the package
// root (frontera §24); SSR-safe (effects only).
import type { RefObject } from "react";

import { useEffect, useRef } from "react";

export interface DismissableLayerOptions {
  /** The overlay's own DOM node; interactions within it are NOT outside. */
  nodeRef: RefObject<HTMLElement | null>;
  /** When true the layer is open/active and may dismiss. */
  active: boolean;
  /** Fired on Escape while this layer is the topmost active one. */
  onEscape?: () => void;
  /** Fired on any interaction (pointerdown) outside the layer. */
  onInteractOutside?: (event: Event) => void;
  /** Fired specifically when a pointer-down lands outside the layer. */
  onPointerDownOutside?: (event: Event) => void;
}

/** Active layer ids in activation order; the LAST one is the topmost layer. */
const activeLayers = new Set<symbol>();

function registerLayer(id: symbol): void {
  activeLayers.add(id);
}

function unregisterLayer(id: symbol): void {
  activeLayers.delete(id);
}

function isTopmostLayer(id: symbol): boolean {
  const layers = [...activeLayers];
  return layers[layers.length - 1] === id;
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
  active,
  onEscape,
  onInteractOutside,
  onPointerDownOutside,
}: DismissableLayerOptions): void {
  const onEscapeRef = useRef(onEscape);
  const onInteractOutsideRef = useRef(onInteractOutside);
  const onPointerDownOutsideRef = useRef(onPointerDownOutside);

  // Latest-callback mirror: runs after every render, before any listener
  // effect of the same commit, so the refs always hold the current callbacks.
  useEffect(() => {
    onEscapeRef.current = onEscape;
    onInteractOutsideRef.current = onInteractOutside;
    onPointerDownOutsideRef.current = onPointerDownOutside;
  });

  useEffect(() => {
    if (!active) return;
    const id = Symbol("dismissable-layer");
    registerLayer(id);

    const isPointerOnOwnNode = (event: Event): boolean => {
      const target = event.target;
      const node = nodeRef.current;
      return target instanceof Node && node !== null && node.contains(target);
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== "Escape") return;
      if (!isTopmostLayer(id)) return;
      onEscapeRef.current?.();
    };

    const handlePointerDown = (event: Event): void => {
      if (!isTopmostLayer(id)) return;
      if (isPointerOnOwnNode(event)) return;
      onPointerDownOutsideRef.current?.(event);
      onInteractOutsideRef.current?.(event);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown, true);
      unregisterLayer(id);
    };
  }, [active, nodeRef]);
}
