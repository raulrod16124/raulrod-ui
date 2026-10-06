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
//
// RRU-138 added the opt-in `matchAnchorWidth`, which also writes `inline-size`:
// one line, and the only JS in EPIC-12 (ADR-008 addendum). It lives here rather
// than in `Select` because this hook already owns the measure-before-paint cycle,
// so the width is applied on the same frame the position is computed from.
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
  /**
   * Whether the panel takes the anchor's inline size (RRU-138). `false` by
   * default, and that default is load-bearing: the four overlays share this hook
   * and three of them are shrink-to-fit panels (a popover sized to its prose, a
   * tooltip sized to its sentence). Only `Select` opts in, because a listbox that
   * is not the width of its own field reads as a different control.
   */
  matchAnchorWidth?: boolean;
}

export function usePopoverPosition({
  anchorRef,
  panelRef,
  placement,
  margin = 8,
  active,
  matchAnchorWidth = false,
}: UsePopoverPositionOptions): void {
  useLayoutEffect(() => {
    if (!active) return;
    const panel = panelRef.current;
    const anchor = anchorRef.current;
    if (!panel || !anchor) return;

    const snap = (): void => {
      const anchorRect = anchor.getBoundingClientRect();
      // Written BEFORE the panel is measured, and that order is the whole point:
      // `computePopoverPosition` flips and clamps against the panel's rect, so a
      // width applied after that measurement would place a panel the browser has
      // already sized. One forced reflow per snap, on a frame that was going to
      // be painted anyway (RRU-138).
      //
      // `inline-size`, not `min-inline-size`: a minimum is what the card's first
      // draft asked for, and CSS resolves min over max, so a field wider than the
      // stylesheet's own clamp would push the panel back off screen — the exact
      // defect this exists to remove. As a width, `max-inline-size` keeps winning.
      if (matchAnchorWidth) panel.style.inlineSize = `${anchorRect.width}px`;
      const position = computePopoverPosition({
        anchorRect,
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
  }, [active, anchorRef, panelRef, placement, margin, matchAnchorWidth]);
}
