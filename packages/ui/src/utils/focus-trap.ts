// Internal focus-trap hook (RRU-052). Keeps keyboard focus inside a container
// while active, cycling Tab/Shift+Tab with wrap-around (guide §14: "focus
// trap"). Classified as private infrastructure — the public API stays styled
// (ADR-004, alternative C). SSR-safe: touches the DOM only inside effects.
import type { RefObject } from "react";

import { useEffect } from "react";

import {
  getActiveLayerNodesInContext,
  popModalContext,
  pushModalContext,
} from "./dismissable-layer.js";
import { getFocusableElementsInDocumentOrder } from "./focusable.js";

export interface FocusTrapOptions {
  /** The overlay container whose focus is trapped while `active`. */
  container: RefObject<HTMLElement | null>;
  /** When true, Tab/Shift+Tab cannot leave `container`. */
  active: boolean;
}

/**
 * Traps keyboard focus inside the modal scope while `active`, cycling
 * Tab/Shift+Tab over the tab-order union (document order) of the container's
 * subtree and the portaled panels of the overlays that opened under this trap
 * (RRU-116), with wrap-around. The scope is not just `container`: panels of
 * nested overlays (a Select/Popover opened from inside a Dialog) mount on
 * `document.body` via Portal, so a subtree query alone would drop them and Tab
 * would skip them (or wrap over a wrong list). Each trap pushes its OWN modal
 * context (`dismissable-layer`), so a nested overlay belongs to the trap that
 * was topmost when it opened and stacked modals never bleed into one another.
 * Only Tab is intercepted: Escape/outside interaction belong to the dismissable
 * layer. Initial focus placement is NOT this hook's job — the overlay (Dialog,
 * …) decides where focus lands on open (RRU-053). Requested in a
 * capture-phase document listener so it wins over any consumer listener.
 */
export function useFocusTrap({ container, active }: FocusTrapOptions): void {
  useEffect(() => {
    if (!active) return;
    const node = container.current;
    if (!node) return;

    const context = pushModalContext();

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== "Tab") return;

      const focusable = getFocusableElementsInDocumentOrder([
        node,
        ...getActiveLayerNodesInContext(context),
      ]);
      if (focusable.length === 0) {
        // Nothing inside to receive Tab: swallow it so focus cannot leak out.
        event.preventDefault();
        return;
      }

      const current = document.activeElement;
      const currentElement = current instanceof HTMLElement ? current : null;
      const currentIndex =
        currentElement && focusable.includes(currentElement)
          ? focusable.indexOf(currentElement)
          : -1;

      let next: HTMLElement | undefined;
      if (event.shiftKey) {
        next = currentIndex <= 0 ? focusable[focusable.length - 1] : focusable[currentIndex - 1];
      } else {
        next =
          currentIndex === -1 || currentIndex === focusable.length - 1
            ? focusable[0]
            : focusable[currentIndex + 1];
      }

      event.preventDefault();
      next?.focus();
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      popModalContext(context);
    };
  }, [active, container]);
}
