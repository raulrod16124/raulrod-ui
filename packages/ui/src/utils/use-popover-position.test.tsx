// The DOM half of the positioner: what the hook WRITES on the panel (RRU-138).
//
// `popover.test.ts` owns the pure geometry and says plainly that it cannot prove
// the ORDER — stylesheet applied, THEN measured — because happy-dom has no layout
// engine and every `getBoundingClientRect()` returns zeros. This file stubs the
// two rects the hook reads, which is exactly enough to pin the two claims that
// live here:
//
//  1. `matchAnchorWidth` is opt-in. Three of the four overlays share this hook
//     and all three are shrink-to-fit panels (a popover sized to its prose, a
//     tooltip sized to its sentence). If the hook wrote an inline width
//     unconditionally, every one of them would silently become as wide as its
//     trigger. The default-off case is the assertion that protects them.
//  2. The width is written BEFORE the panel is measured. The panel's rect is the
//     input to the flip and the clamp, so a width applied after that measurement
//     would place a panel the browser has already sized — the panel would be
//     positioned for a width it no longer has. The stub below reports the inline
//     size it saw when it was asked, which is what makes the ORDER observable in
//     an environment that has no layout: move the write below the read and
//     `inlineSizeAtRead` comes back empty.
//
// Whether the numbers come out right in real pixels — is the listbox the width
// of its trigger, does it stay inside the viewport — belongs to the E2E, which
// has a layout engine: `apps/playground/e2e/overlays-narrow.spec.ts`.
import type { RefObject } from "react";

import { render } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it } from "vitest";

import { usePopoverPosition } from "./use-popover-position.js";

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** One measurement the hook took, and what the node's inline size was at the time. */
interface Reading {
  readonly target: "anchor" | "panel";
  readonly inlineSizeAtRead: string;
}

/**
 * Stubs `getBoundingClientRect` and records every read.
 *
 * `honourInlineSize` is what makes this a stand-in for a layout engine rather
 * than a constant: a browser that has just been told `inline-size: 272px` returns
 * a 272px-wide rect, and that is the behaviour the hook's write-then-read order
 * depends on.
 */
function stubRect(
  node: HTMLElement,
  target: "anchor" | "panel",
  rect: () => Rect,
  readings: Reading[],
  honourInlineSize: boolean,
): void {
  node.getBoundingClientRect = (): DOMRect => {
    const inlineSize = node.style.inlineSize;
    readings.push({ target, inlineSizeAtRead: inlineSize });
    const base = rect();
    const width =
      honourInlineSize && inlineSize !== "" ? Number.parseFloat(inlineSize) : base.width;
    return {
      ...base,
      width,
      right: base.left + width,
      bottom: base.top + base.height,
      x: base.left,
      y: base.top,
      toJSON: () => ({}),
    } as DOMRect;
  };
}

/** The anchor geometry a narrow viewport produces: a 272px field on screen. */
const ANCHOR_RECT = { left: 24, top: 100, width: 272, height: 42 };
/** The listbox as the stylesheet leaves it: shrink-to-fit, no width of its own. */
const PANEL_RECT = { left: -9999, top: -9999, width: 312, height: 400 };

function Harness({
  readings,
  matchAnchorWidth,
  active = true,
  anchorRect = () => ANCHOR_RECT,
}: {
  readings: Reading[];
  matchAnchorWidth?: boolean;
  active?: boolean;
  anchorRect?: () => Rect;
}) {
  const anchorRef: RefObject<HTMLButtonElement | null> = useRef(null);
  const panelRef: RefObject<HTMLDivElement | null> = useRef(null);

  usePopoverPosition({
    anchorRef,
    panelRef,
    placement: "bottom-start",
    active,
    ...(matchAnchorWidth === undefined ? {} : { matchAnchorWidth }),
  });

  return (
    <>
      <button
        ref={(node) => {
          anchorRef.current = node;
          if (node !== null) stubRect(node, "anchor", anchorRect, readings, false);
        }}
        type="button"
      >
        trigger
      </button>
      <div
        ref={(node) => {
          panelRef.current = node;
          if (node !== null) stubRect(node, "panel", () => PANEL_RECT, readings, true);
        }}
        role="listbox"
      />
    </>
  );
}

const panel = (): HTMLElement => {
  const found = document.querySelector<HTMLElement>('[role="listbox"]');
  if (found === null) throw new Error("the panel must be mounted");
  return found;
};

describe("usePopoverPosition — matchAnchorWidth (RRU-138)", () => {
  it("gives the panel the anchor's inline size when asked to match it", () => {
    const readings: Reading[] = [];
    render(<Harness readings={readings} matchAnchorWidth />);

    expect(panel().style.inlineSize).toBe(`${ANCHOR_RECT.width}px`);
  });

  it("measures the panel AFTER writing that width, not before", () => {
    // The claim is about order, and order is the one thing a comment cannot
    // pin: `computePopoverPosition` flips and clamps with the panel's rect, so a
    // width written after the read would leave the panel positioned for a size it
    // no longer has. The stub records the inline size it was handed, which is
    // empty if the two lines are swapped.
    const readings: Reading[] = [];
    render(<Harness readings={readings} matchAnchorWidth />);

    expect(readings.map((reading) => reading.target)).toEqual(["anchor", "panel"]);
    expect(readings[1]?.inlineSizeAtRead).toBe(`${ANCHOR_RECT.width}px`);
  });

  it("writes no width at all by default, so the shrink-to-fit overlays keep theirs", () => {
    // The regression this guards is invisible to any consumer of Select: a popover
    // sized to its prose and a tooltip sized to its sentence would both become as
    // wide as their trigger the moment this defaulted to `true`.
    const readings: Reading[] = [];
    render(<Harness readings={readings} />);

    expect(panel().style.inlineSize).toBe("");
    expect(readings[1]?.inlineSizeAtRead).toBe("");
  });

  it("re-reads the width when the window resizes, so the panel keeps tracking the field", () => {
    // Open-time sync is not a contract: a user rotating a phone, or a sidebar
    // opening, changes the field's width while the listbox is still mounted.
    // Without the resize re-snap the panel would keep the width it was given.
    let width = 272;
    const readings: Reading[] = [];
    render(
      <Harness
        readings={readings}
        matchAnchorWidth
        anchorRect={() => ({ ...ANCHOR_RECT, width })}
      />,
    );
    expect(panel().style.inlineSize).toBe("272px");

    width = 180;
    window.dispatchEvent(new Event("resize"));

    expect(panel().style.inlineSize).toBe("180px");
  });

  it("touches nothing while inactive, so a closed overlay leaves no inline width behind", () => {
    const readings: Reading[] = [];
    render(<Harness readings={readings} active={false} matchAnchorWidth />);

    expect(readings).toEqual([]);
    expect(panel().style.inlineSize).toBe("");
  });
});
