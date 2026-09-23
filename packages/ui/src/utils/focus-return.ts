// Internal focus-restoration hook (RRU-052). Remembers which element had focus
// when an overlay activates and returns focus to it on deactivate/unmount
// (guide §14: "focus restoration"). SSR-safe: DOM access lives in effects only.
import { useEffect } from "react";

import { isFocusableElement } from "./focusable.js";

export interface FocusReturnOptions {
  /** When true the hook captures the current focused element to restore later. */
  active: boolean;
}

/**
 * Captures `document.activeElement` on the `false → true` transition and
 * restores focus to it on `true → false` or unmount. The effect-keyed-on
 * `active` pattern makes the capture/restore a single transition: the cleanup
 * of the "true" effect runs exactly when `active` flips to false or the hook
 * unmounts, so re-renders never steal focus. If the captured element is gone
 * or no longer focusable (e.g. the trigger was conditionally removed), focus
 * falls back to `document.body` so the browser does not tab into the void.
 *
 * Per-instance storage keeps nesting correct: each overlay restores to its own
 * trigger, so closing the inner overlay returns to the outer one's content and
 * closing the outer one returns to the original trigger (no global stack —
 * ADR-004, alternative D).
 */
export function useFocusReturn({ active }: FocusReturnOptions): void {
  useEffect(() => {
    if (!active) return;

    const previous = document.activeElement;

    return () => {
      if (previous instanceof HTMLElement && previous.isConnected && isFocusableElement(previous)) {
        previous.focus();
      } else {
        document.body.focus();
      }
    };
  }, [active]);
}
