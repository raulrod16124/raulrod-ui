// Pure geometry spec for the popover positioner (RRU-054, DoD #1 — "no
// overflow del viewport: flip/overflow"). No DOM: synthetic rects feed
// computePopoverPosition and the assertions pin the flip/align-fallback/clamp
// contract. The integration of this math with the real DOM (measure + inline
// style) lives in Popover.test.tsx.
import type { PopoverPlacement } from "./popover.js";

import { describe, expect, it } from "vitest";

import { computePopoverPosition } from "./popover.js";

const VIEWPORT = { left: 0, top: 0, width: 320, height: 480 };
const MARGIN = 8;

function position(
  anchor: { left: number; top: number; width: number; height: number },
  panel: { width: number; height: number },
  placement: PopoverPlacement,
) {
  // panel left/top are irrelevant (unmeasured until mounted), pass zeros.
  return computePopoverPosition({
    anchorRect: { left: anchor.left, top: anchor.top, width: anchor.width, height: anchor.height },
    popoverRect: { left: 0, top: 0, width: panel.width, height: panel.height },
    viewportRect: VIEWPORT,
    placement,
    margin: MARGIN,
  });
}

describe("computePopoverPosition — placement", () => {
  it("places centered below the anchor when it fits (bottom)", () => {
    expect(
      position(
        { left: 80, top: 100, width: 120, height: 40 },
        { width: 160, height: 80 },
        "bottom",
      ),
    ).toEqual({
      left: 60,
      top: 148,
    });
  });

  it("aligns start and end on the bottom side", () => {
    expect(
      position(
        { left: 20, top: 100, width: 120, height: 40 },
        { width: 160, height: 80 },
        "bottom-start",
      ),
    ).toEqual({ left: 20, top: 148 });
    expect(
      position(
        { left: 100, top: 100, width: 200, height: 40 },
        { width: 80, height: 60 },
        "bottom-end",
      ),
    ).toEqual({ left: 220, top: 148 });
  });

  it("places on the left/right sides (centered on the anchor height)", () => {
    // Anchor left enough for "right" to fit fully inside the viewport.
    expect(
      position({ left: 60, top: 100, width: 80, height: 40 }, { width: 120, height: 60 }, "right"),
    ).toEqual({
      left: 148,
      top: 90,
    });
    // Anchor right enough for "left" to fit fully inside the viewport.
    expect(
      position({ left: 200, top: 100, width: 80, height: 40 }, { width: 120, height: 60 }, "left"),
    ).toEqual({
      left: 72,
      top: 90,
    });
  });

  it("aligns start/end on the horizontal sides (menu submenus, RRU-055)", () => {
    // right-start: the submenu column is flush with the trigger, top-aligned.
    expect(
      position(
        { left: 10, top: 30, width: 120, height: 80 },
        { width: 120, height: 60 },
        "right-start",
      ),
    ).toEqual({ left: 138, top: 30 });
    // right-end: the panel's bottom edge aligns with the trigger's.
    expect(
      position(
        { left: 10, top: 30, width: 120, height: 80 },
        { width: 120, height: 60 },
        "right-end",
      ),
    ).toEqual({ left: 138, top: 50 });
    // right-start on the right viewport edge flips side → left-start.
    expect(
      position(
        { left: 200, top: 20, width: 80, height: 40 },
        { width: 120, height: 60 },
        "right-start",
      ),
    ).toEqual({ left: 72, top: 20 });
  });
});

describe("computePopoverPosition — flip (DoD #1)", () => {
  it("flips bottom → top when there is no room below", () => {
    // Anchor near the bottom edge: below would overflow, above fits.
    expect(
      position(
        { left: 80, top: 400, width: 120, height: 40 },
        { width: 160, height: 80 },
        "bottom",
      ),
    ).toEqual({
      left: 60,
      top: 312,
    });
  });

  it("flips top → bottom when there is no room above", () => {
    expect(
      position(
        { left: 80, top: 4, width: 120, height: 40 },
        { width: 160, height: 80 },
        "top-start",
      ),
    ).toEqual({
      left: 80,
      top: 52, // anchor.bottom(44) + margin(8)
    });
  });

  it("flips right → left on the viewport edge", () => {
    expect(
      position({ left: 200, top: 100, width: 80, height: 40 }, { width: 120, height: 60 }, "right"),
    ).toEqual({
      left: 72,
      top: 90,
    });
  });

  it("keeps the requested side when the opposite does NOT fit either (panel taller than viewport)", () => {
    // Panel 560 tall barely taller than the 480 viewport: neither side fits;
    // the requested bottom side is preserved and the leading edge is clamped.
    const pos = position(
      { left: 80, top: 100, width: 120, height: 40 },
      { width: 160, height: 560 },
      "bottom",
    );
    expect(pos.top).toBe(MARGIN); // clamped to the top margin — leading edge visible
    expect(pos.left).toBe(60);
  });
});

describe("computePopoverPosition — align fallback + clamp", () => {
  it("mirrors a start-aligned panel that would overflow the right edge (align fallback)", () => {
    // start (-20 over the right edge) and end (-180) both stick out → the
    // final clamp pins the leading edge to the margin.
    expect(
      position(
        { left: 20, top: 100, width: 120, height: 40 },
        { width: 320, height: 80 },
        "bottom-start",
      ),
    ).toEqual({
      left: 8, // 320-wide panel in a 320-wide viewport → clamped to the margin
      top: 148,
    });
  });

  it("clamps to the viewport margin when centered alignment overflows", () => {
    const pos = position(
      { left: 0, top: 100, width: 100, height: 40 },
      { width: 320, height: 60 },
      "bottom",
    );
    expect(pos.left).toBe(MARGIN);
    expect(pos.top).toBe(148);
  });

  it("never leaves the viewport even when the panel is wider than the viewport", () => {
    const pos = position(
      { left: 0, top: 0, width: 100, height: 40 },
      { width: 400, height: 60 },
      "bottom-start",
    );
    expect(pos.left).toBe(MARGIN);
    expect(pos.top).toBe(48);
  });
});
