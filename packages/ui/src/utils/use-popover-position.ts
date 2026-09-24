// Internal popover position-tracking hook (RRU-054). Runs the pure geometry of
// `computePopoverPosition` (popover.ts) against the REAL anchor/panel DOM nodes
// and writes the resulting `left`/`top` imperatively on the panel — deliberate
// choice: coordinates are frame/layout data, not React state, so the hook
// avoids a re-render per scroll/resize and sidesteps the
// `react-hooks/set-state-in-effect` gate (RRU-034 finding). The panel's CSS
// starts it at `left/top: -9999px` (offscreen but measurable, `getBoundingClientRect`
// still returns its real width/height); the layout effect snaps it into place
// synchronously BEFORE paint, so there is no visible jump. Re-snaps on window
// resize and any scroll (capture phase — catches nested containers too, scroll
// does not bubble). SSR-safe: all DOM access lives in the effect. Internal
// module: never exported from the package root (frontera §24).
import type { PopoverPlacement } from "./popover.js";
import type { RefObject } from "react";

import { useLayoutEffect } from "react";

import { computePopoverPosition } from "./popover.js";

export interface UsePopoverPositionOptions {
  /** The trigger/anchor element that positions the panel. */
  anchorRef: RefObject<HTMLElement | null>;
  /** The panel element the hook positions (via inline `left`/`top`). */
  panelRef: RefObject<HTMLElement | null>;
  /** Side + alignment of the panel relative to the anchor. */
  placement: PopoverPlacement;
  /** Gap between anchor and panel in px (token value, default `space-2`=8). */
  margin?: number;
  /** Whether the panel is mounted/may dismiss at present. */
  active: boolean;
}

export function usePopoverPosition({
  anchorRef,
  panelRef,
  placement,
  margin = 8,
  active,
}: UsePopoverPositionOptions): void {
  useLayoutEffect(() => {
    if (!active) return;
    const panel = panelRef.current;
    const anchor = anchorRef.current;
    if (!panel || !anchor) return;

    const snap = (): void => {
      const position = computePopoverPosition({
        anchorRect: anchor.getBoundingClientRect(),
        popoverRect: panel.getBoundingClientRect(),
        viewportRect: {
          left: 0,
          top: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        },
        placement,
        margin,
      });
      panel.style.left = `${position.left}px`;
      panel.style.top = `${position.top}px`;
    };

    // Runs after the panel has been committed (Portal children included) and
    // before paint — positions without a visible flash.
    snap();
    window.addEventListener("resize", snap);
    window.addEventListener("scroll", snap, true);

    return () => {
      window.removeEventListener("resize", snap);
      window.removeEventListener("scroll", snap, true);
    };
  }, [active, anchorRef, panelRef, placement, margin]);
}
