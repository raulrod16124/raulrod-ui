// Internal focus-trap hook (RRU-052). Keeps keyboard focus inside a container
// while active, cycling Tab/Shift+Tab with wrap-around (guide §14: "focus
// trap"). Classified as private infrastructure — the public API stays styled
// (ADR-004, alternative C). SSR-safe: touches the DOM only inside effects.
import type { RefObject } from "react";

import { useEffect } from "react";

import { getFocusableElements } from "./focusable.js";

export interface FocusTrapOptions {
  /** The overlay container whose focus is trapped while `active`. */
  container: RefObject<HTMLElement | null>;
  /** When true, Tab/Shift+Tab cannot leave `container`. */
  active: boolean;
}

/**
 * Traps keyboard focus inside `container` while `active`, cycling
 * Tab/Shift+Tab over the focusable descendants with wrap-around. Only Tab is
 * intercepted: Escape/outside interaction belong to the dismissable layer.
 * Initial focus placement is NOT this hook's job — the overlay (Dialog, …)
 * decides where focus lands on open (RRU-053). Requested in a capture-phase
 * document listener so it wins over any consumer listener.
 */
export function useFocusTrap({ container, active }: FocusTrapOptions): void {
  useEffect(() => {
    if (!active) return;
    const node = container.current;
    if (!node) return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== "Tab") return;

      const focusable = getFocusableElements(node);
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
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [active, container]);
}
