// Internal scroll-lock hook (RRU-052). Prevents the page behind an open
// overlay from scrolling (guide §14: "scroll lock"), restoring the original
// body overflow when the last lock is released. SSR-safe: DOM access only
// inside effects.
import { useEffect } from "react";

export interface ScrollLockOptions {
  /** When true the document body scroll is locked. */
  active: boolean;
}

/**
 * Reference-counted lock: module-level counter so stacked overlays (Dialog
 * over Dialog) each lock once and the original `overflow` (e.g. a consumer's
 * `auto`) is restored only when the LAST lock releases. This is CSS-state
 * hygiene, not a manager (ADR-004, alternative D) — no consumer-visible state
 * and no correlation between layers; each active hook just increments/decrements.
 */
let lockCount = 0;
let originalOverflow = "";
let hasRecordedOriginal = false;

export function useScrollLock({ active }: ScrollLockOptions): void {
  useEffect(() => {
    if (!active) return;

    const body = document.body;
    if (!hasRecordedOriginal) {
      originalOverflow = body.style.overflow;
      hasRecordedOriginal = true;
    }
    body.style.overflow = "hidden";
    lockCount += 1;

    return () => {
      lockCount -= 1;
      if (lockCount === 0) {
        body.style.overflow = originalOverflow;
        hasRecordedOriginal = false;
      }
    };
  }, [active]);
}
