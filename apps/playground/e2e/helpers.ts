// Shared helpers for the E2E suite (RRU-069).
//
// Three rules shape this file:
//
//  1. LOCATORS ARE WRITTEN THE WAY A USER FINDS THINGS. Role, name and visible
//     text only. `data-testid` exists here and in the app, but only for nodes
//     that have no accessible identity of their own (a row of icon buttons, a
//     state readout). Asserting on `rr-*` class names would couple the suite to
//     the design system's internals: renaming a class would break tests that
//     were proving behaviour, not styling.
//  2. NO ARBITRARY WAITS. Every wait is a condition (`toBeVisible`, `toHaveCSS`)
//     that auto-retries, so a slow run is a slow run and a broken run is red.
//  3. WIDTH IS ASSERTED BY MEASURING, NEVER BY NAMING (RRU-136, ADR-008).
//     EPIC-12 adds internal modifiers that a width behaviour is decided by, so a
//     suite that read their names would be asserting on the design system's
//     internals — the same coupling rule 1 exists to prevent, one layer down.
//     `fitsWithin` and `boxOf` below read GEOMETRY instead: the assertion fails
//     if the layout is wrong, and survives the rename.
import type { Locator, Page } from "@playwright/test";

import { expect } from "@playwright/test";

/** Loads the playground and waits for React to have painted something real. */
export async function openPlayground(page: Page): Promise<void> {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "RaulRod UI" })).toBeVisible();
}

/** The element that currently has focus, described well enough to assert on. */
export function activeElement(page: Page) {
  return page.evaluate(() => {
    const active = document.activeElement;
    if (active === null) return null;
    return {
      tag: active.tagName.toLowerCase(),
      testId: active.getAttribute("data-testid"),
      text: (active.textContent ?? "").trim(),
      role: active.getAttribute("role"),
    };
  });
}

/** A measured rectangle, with the null case spelled out rather than coerced. */
export interface Box {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * The rendered rectangle of an element, measured in CSS pixels.
 *
 * `boundingBox()` already measures, so this adds nothing but a type; it exists so
 * the specs below read as arithmetic instead of nullable access chains.
 */
export async function boxOf(locator: Locator): Promise<Box> {
  const box = await locator.boundingBox();
  expect(box, "the element must be laid out to have a box").not.toBeNull();
  return box as Box;
}

/**
 * Asserts an element does not overflow its own box: its content fits the width
 * the layout gives it.
 *
 * `scrollWidth > clientWidth` is the horizontal half of the same idea, and unlike
 * `boundingBox()` it also catches content that overflows invisibly — which is the
 * failure this suite exists to catch, since an overflowing box pushes the rest of
 * the page sideways instead of reporting itself.
 */
export async function fitsWithin(locator: Locator): Promise<void> {
  const overflow = await locator.evaluate((node) => node.scrollWidth - node.clientWidth);
  expect(overflow, "the element must not overflow its own width").toBeLessThanOrEqual(1);
}

/**
 * How many CSS pixels of content stick out past the element's own width.
 *
 * The counterpart to `fitsWithin`, for the one case where overflowing is the
 * DOCUMENTED behaviour: a row of fixed-size icon buttons that refuses to squeeze
 * spills on purpose. A test needs to prove the spill really happened (otherwise
 * "the squares survived" would pass on a row that fitted), and it must measure the
 * CONTENT rather than the box — the box is clamped by the parent either way.
 */
export async function overflowPx(locator: Locator): Promise<number> {
  return locator.evaluate((node) => node.scrollWidth - node.clientWidth);
}

/**
 * How many CSS pixels of content stick out past the element's own height.
 *
 * Added in RRU-137, and the reason it exists rather than reusing `overflowPx`: that
 * helper measures the INLINE axis, because RRU-136's documented overflow is a row
 * of icon buttons that spills sideways. The overlays bounded by this epic overflow
 * on the OTHER axis instead — prose taller than `max-block-size` scrolls
 * vertically, and the inline axis measures exactly zero because the text wraps at
 * the clamp. Reading the wrong axis would have reported "no overflow" for a panel
 * that was demonstrably clipped, which is the failure mode a helper named
 * `overflowPx` invites.
 */
export async function blockOverflowPx(locator: Locator): Promise<number> {
  return locator.evaluate((node) => node.scrollHeight - node.clientHeight);
}

/**
 * Asserts an element's content is fully rendered: nothing is clipped and there is
 * no scrollport to reach it through.
 *
 * The mirror image of `blockOverflowPx > 0`. RRU-137 needs both claims about the
 * same panel — the popover MAY scroll, the tooltip MUST NOT — and only the second
 * one proves the deviation is real: a tooltip with `max-block-size` and
 * `overflow: auto` would report itself visible and inside the viewport while the
 * tail of its text sat in a scrollport nothing can focus.
 */
export async function expectNothingClipped(locator: Locator): Promise<void> {
  const overflow = await blockOverflowPx(locator);
  expect(overflow, "the element's content must be fully rendered, not clipped").toBeLessThanOrEqual(
    1,
  );
}

/**
 * Asserts every element a locator resolves to is as wide as it is tall.
 *
 * Used for the square sizes, where a rectangle is the defect: an icon button that
 * gives up its width to `flex-shrink` while its height stays fixed still reports
 * as present, visible and clickable, so nothing else in the suite would notice.
 */
export async function expectSquareBoxes(locator: Locator): Promise<void> {
  const boxes = await locator.evaluateAll((nodes) =>
    nodes.map((node) => {
      const rect = node.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    }),
  );

  expect(boxes.length).toBeGreaterThan(0);
  for (const [index, box] of boxes.entries()) {
    // One tenth of a pixel of slack: sub-pixel layout rounding is not a defect,
    // but a 2px difference is a square that stopped being one.
    expect(
      Math.abs(box.width - box.height),
      `box ${index} is ${box.width}×${box.height}, which is not a square`,
    ).toBeLessThanOrEqual(0.1);
  }
}
