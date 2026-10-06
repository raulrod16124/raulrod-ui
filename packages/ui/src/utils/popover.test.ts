// Pure geometry spec for the popover positioner (RRU-054, DoD #1 — "no
// overflow del viewport: flip/overflow"). No DOM: synthetic rects feed
// computePopoverPosition and the assertions pin the flip/align-fallback/clamp
// contract. The integration of this math with the real DOM (measure + inline
// style) lives in Popover.test.tsx.
//
// RRU-137 adds the panel's viewport bound (Popover.css: max-inline-size/
// max-block-size) to that contract, and this file says which half it can prove.
// The ORDER — stylesheet applied, THEN measured — is a browser fact: happy-dom
// has no layout, so `getBoundingClientRect()` returns zeros here and no
// assertion in this file could tell the two orders apart. That half is proven
// where a layout engine exists, in `apps/playground/e2e/overlays-narrow.spec.ts`.
// What lives here is the geometry each order implies, so the invariants stay
// pinned even though the DOM half cannot be:
//   - a panel ALREADY clamped by CSS fits and is left untouched by `clamp`;
//   - a panel wider than the viewport still gets its leading edge pinned, which
//     is now the DEFENSIVE path, reachable only if a consumer overrides
//     `max-inline-size` through `style` or a stylesheet.
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

describe("computePopoverPosition — the panel is bounded by CSS, not by the clamp (RRU-137)", () => {
  it("leaves a panel that already fits the viewport exactly where it asked to be", () => {
    // The state RRU-137 makes NORMAL. `max-inline-size` resolves against the
    // viewport, so the rect `use-popover-position.ts` measures is already bounded
    // (320 - 2*space-4 = 288 here, and `MARGIN` is this spec's own 8), `fitsFully`
    // accepts it, and `clamp` is never reached. This is the assertion that says
    // the clamp is NOT the mechanism holding the panel on screen: the stylesheet
    // is, and the positioner's job is to stop interfering with it.
    expect(
      position(
        { left: 16, top: 100, width: 100, height: 40 },
        { width: 288, height: 60 },
        "bottom-start",
      ),
    ).toEqual({
      left: 16, // the requested edge, untouched: 16 + 288 = 304 <= 320 - 8
      top: 148,
    });
  });

  it("lands a screen-tall panel inside the viewport instead of under the fold", () => {
    // The other axis, same argument. `max-block-size: calc(100dvh - 2*space-4)`
    // is 480 - 32 = 448 here, so a panel filling its scrollport is still a panel
    // whose bottom edge the positioner has to place: neither side fits (448 > the
    // space above or below any anchor), and 24 + 448 = 472 is exactly
    // `480 - margin`. The scrollport doing the rest is Popover.css's job; this
    // pins the half that is geometry.
    expect(
      position(
        { left: 0, top: 10, width: 100, height: 20 },
        { width: 288, height: 448 },
        "bottom-start",
      ),
    ).toEqual({ left: 8, top: 24 });
  });

  it("still pins the leading edge of a panel a consumer made unbounded", () => {
    // The DEFENSIVE path, and the one the old test described as the normal case.
    // It stays reachable because `style` is the consumer's escape hatch (EPIC 13
    // formalises it): someone who sets `maxInlineSize` inline, or ships a
    // stylesheet that wins the cascade, hands the positioner a 400px panel in a
    // 320px viewport. The positioner cannot shrink it — it only moves `left`/`top`
    // — so the guarantee it can still make is the one it has always made.
    const pos = position(
      { left: 0, top: 0, width: 100, height: 40 },
      { width: 400, height: 60 },
      "bottom-start",
    );
    expect(pos.left).toBe(MARGIN);
    expect(pos.top).toBe(48);
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
    // Kept, and renamed by its card: since RRU-137 the CSS bounds the panel, so
    // this rect is only reachable if the consumer overrides `max-inline-size`
    // (the defensive case is asserted with that framing above). It is not
    // deleted, because deleting it would drop the last coverage of `clamp`'s
    // hard guarantee — a guard that is unreachable in this repo is still the
    // thing that saves a consumer who overrides it.
    const pos = position(
      { left: 0, top: 0, width: 100, height: 40 },
      { width: 400, height: 60 },
      "bottom-start",
    );
    expect(pos.left).toBe(MARGIN);
    expect(pos.top).toBe(48);
  });
});
