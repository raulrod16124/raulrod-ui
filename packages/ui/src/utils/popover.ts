// Internal popover positioning geometry (RRU-054). Pure DOM-measurement-free
// math: given the anchor/panel/viewport rects and a placement, decide where the
// panel should live so it NEVER overflows the viewport (card DoD #1):
//   1. FLIP — if the panel does not fit on the requested side (main axis),
//      move it to the opposite side when that one fits.
//   2. ALIGN-FALLBACK — on the cross axis, try the requested alignment, then
//      its mirror; the first candidate that keeps the panel fully inside the
//      viewport wins.
//   3. CLAMP — final hard clamp to the viewport inset by `margin`, so even when
//      no placement fits (panel larger than the viewport) the panel's leading
//      edge stays visible.
// Kept framework-free (no React) and unit-testable with synthetic rects
// (`popover.test.ts`); the measurement + application lives in
// `use-popover-position.ts`. Zero deps (decision of session RRU-054). Internal
// module: never exported from the package root (frontera §24).
export type PopoverSide = "top" | "right" | "bottom" | "left";

export type PopoverAlign = "start" | "center" | "end";

/** Public `placement` union (re-exported by `Popover.types` / the root
 *  `index.ts`): side + optional start/end alignment. The MVP dropped arrow
 *  support, but start/end on the horizontal sides are needed anyway for
 *  menus (RRU-055 submenus open `right-start` and flip to `left-start`). */
export type PopoverPlacement =
  | "top"
  | "top-start"
  | "top-end"
  | "bottom"
  | "bottom-start"
  | "bottom-end"
  | "left"
  | "right"
  | "left-start"
  | "left-end"
  | "right-start"
  | "right-end";

/** Axis-aligned rectangle (viewport-relative). */
export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface PopoverGeometryOptions {
  /** The trigger/anchor rect (viewport-relative, from `getBoundingClientRect`). */
  anchorRect: Rect;
  /** The panel rect — only `width`/`height` are consumed. */
  popoverRect: Rect;
  /** The visible viewport. Called with `{left:0, top:0, width, height}`. */
  viewportRect: Rect;
  placement: PopoverPlacement;
  /** Gap between anchor and panel (px). Caller supplies the token-derived
   *  value (`--rr-space-2` → 8). */
  margin: number;
}

export interface PopoverPosition {
  left: number;
  top: number;
}

interface PlacementSpec {
  side: PopoverSide;
  align: PopoverAlign;
}

function oppositeSide(side: PopoverSide): PopoverSide {
  switch (side) {
    case "top":
      return "bottom";
    case "bottom":
      return "top";
    case "right":
      return "left";
    case "left":
      return "right";
  }
}

function parsePlacement(placement: PopoverPlacement): PlacementSpec {
  switch (placement) {
    case "top-start":
      return { side: "top", align: "start" };
    case "top-end":
      return { side: "top", align: "end" };
    case "bottom-start":
      return { side: "bottom", align: "start" };
    case "bottom-end":
      return { side: "bottom", align: "end" };
    case "left-start":
      return { side: "left", align: "start" };
    case "left-end":
      return { side: "left", align: "end" };
    case "right-start":
      return { side: "right", align: "start" };
    case "right-end":
      return { side: "right", align: "end" };
    case "top":
      return { side: "top", align: "center" };
    case "bottom":
      return { side: "bottom", align: "center" };
    case "left":
      return { side: "left", align: "center" };
    case "right":
      return { side: "right", align: "center" };
  }
}

/** Whether the panel (main-axis extent only) fits on `side` inside the
 *  viewport, leaving `margin` on both edges. */
function fitsOnMainAxis(
  anchorRect: Rect,
  popoverRect: Rect,
  viewportRect: Rect,
  side: PopoverSide,
  margin: number,
): boolean {
  const viewportRight = viewportRect.left + viewportRect.width;
  const viewportBottom = viewportRect.top + viewportRect.height;
  switch (side) {
    case "bottom":
      return (
        anchorRect.top + anchorRect.height + margin + popoverRect.height <= viewportBottom - margin
      );
    case "top":
      return anchorRect.top - margin - popoverRect.height >= viewportRect.top + margin;
    case "right":
      return (
        anchorRect.left + anchorRect.width + margin + popoverRect.width <= viewportRight - margin
      );
    case "left":
      return anchorRect.left - margin - popoverRect.width >= viewportRect.left + margin;
  }
}

/** Cross-axis origin (the `left` for horizontal sides, `top` for vertical). */
function crossOrigin(
  start: number,
  extent: number,
  panelExtent: number,
  align: PopoverAlign,
): number {
  switch (align) {
    case "start":
      return start;
    case "end":
      return start + extent - panelExtent;
    case "center":
      return start + (extent - panelExtent) / 2;
  }
}

/** The panel's top-left corner on `side` with `align`, without any fitting. */
function basePosition(
  anchorRect: Rect,
  popoverRect: Rect,
  side: PopoverSide,
  align: PopoverAlign,
  margin: number,
): PopoverPosition {
  if (side === "bottom" || side === "top") {
    const left = crossOrigin(anchorRect.left, anchorRect.width, popoverRect.width, align);
    const top =
      side === "bottom"
        ? anchorRect.top + anchorRect.height + margin
        : anchorRect.top - margin - popoverRect.height;
    return { left, top };
  }
  const top = crossOrigin(anchorRect.top, anchorRect.height, popoverRect.height, align);
  const left =
    side === "right"
      ? anchorRect.left + anchorRect.width + margin
      : anchorRect.left - margin - popoverRect.width;
  return { left, top };
}

/** Whether the whole panel fits inside the viewport with `margin` inset. */
function fitsFully(
  position: PopoverPosition,
  popoverRect: Rect,
  viewportRect: Rect,
  margin: number,
): boolean {
  const right = viewportRect.left + viewportRect.width;
  const bottom = viewportRect.top + viewportRect.height;
  return (
    position.left >= viewportRect.left + margin &&
    position.top >= viewportRect.top + margin &&
    position.left + popoverRect.width <= right - margin &&
    position.top + popoverRect.height <= bottom - margin
  );
}

function clamp(
  position: PopoverPosition,
  popoverRect: Rect,
  viewportRect: Rect,
  margin: number,
): PopoverPosition {
  const right = viewportRect.left + viewportRect.width;
  const bottom = viewportRect.top + viewportRect.height;
  const left = Math.max(
    viewportRect.left + margin,
    Math.min(position.left, right - margin - popoverRect.width),
  );
  const top = Math.max(
    viewportRect.top + margin,
    Math.min(position.top, bottom - margin - popoverRect.height),
  );
  return { left, top };
}

/**
 * Computes the panel position for the given placement, flipping side and
 * aligning to fit the viewport (see module docs). The panel's leading edge is
 * always kept at least `margin` px inside the viewport.
 */
export function computePopoverPosition({
  anchorRect,
  popoverRect,
  viewportRect,
  placement,
  margin,
}: PopoverGeometryOptions): PopoverPosition {
  const { side, align } = parsePlacement(placement);

  let sideCandidates: PopoverSide[];
  if (fitsOnMainAxis(anchorRect, popoverRect, viewportRect, side, margin)) {
    sideCandidates = [side];
  } else {
    const opposite = oppositeSide(side);
    // Prefer the requested side; flip only when the opposite one actually fits
    // (a panel taller than the viewport keeps its original orientation, then
    // the final clamp keeps its leading edge visible).
    sideCandidates = [side, opposite];
  }

  const alignCandidates: PopoverAlign[] =
    align === "center" ? ["center"] : [align, oppositeAlign(align)];

  for (const candidate of sideCandidates) {
    for (const alignCandidate of alignCandidates) {
      const position = basePosition(anchorRect, popoverRect, candidate, alignCandidate, margin);
      if (fitsFully(position, popoverRect, viewportRect, margin)) return position;
    }
  }

  // No candidate fits fully (panel larger than the viewport): use the requested
  // side/align unfitted, then clamp.
  return clamp(
    basePosition(anchorRect, popoverRect, side, align, margin),
    popoverRect,
    viewportRect,
    margin,
  );
}

function oppositeAlign(align: PopoverAlign): PopoverAlign {
  switch (align) {
    case "start":
      return "end";
    case "end":
      return "start";
    case "center":
      return "center";
  }
}
