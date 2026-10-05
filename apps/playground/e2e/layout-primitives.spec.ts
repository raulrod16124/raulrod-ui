// Layout primitives at a narrow width (RRU-136, EPIC-12).
//
// Everything here is asserted by GEOMETRY, never by an `rr-*` class name
// (`helpers.ts` rule 3). That is not a style preference: this card fixes
// `min-width: 0`, `overflow-wrap: anywhere` and `flex-shrink: 0` on four
// components, and every one of them is invisible to the DOM. There is no
// attribute to read and no text to match — an overflowing box still renders, is
// still clickable, and still reports itself as visible. Measuring is the only
// way to see the defect, and it is also the only assertion that survives the
// internal modifiers the rest of EPIC-12 is about to add.
//
// The width is a second browser CONTEXT rather than a second Playwright project:
// RRU-144 owns adding the mobile project, and `theme.spec.ts` already sets the
// precedent for driving one spec at a non-default viewport without touching
// `playwright.config.ts`. Nothing is loaded twice — the whole page is loaded
// once per width, and each assertion is scoped to the fixture it belongs to.
import type { Browser, Page } from "@playwright/test";

import { expect, test } from "@playwright/test";

import { boxOf, expectSquareBoxes, fitsWithin, openPlayground, overflowPx } from "./helpers.js";

/** The narrow viewport EPIC-12 measures at: the iPhone SE class width. */
const NARROW = 320;

/** A wide desktop viewport, so every claim below is also checked at the other end. */
const WIDE = 1280;

/** Loads the playground once at an explicit viewport width. */
async function openAtWidth(browser: Browser, width: number): Promise<Page> {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await context.newPage();
  await openPlayground(page);
  return page;
}

test.describe("layout primitives at a narrow width", () => {
  test("a label with no spaces wraps instead of overflowing its row", async ({ browser }) => {
    const page = await openAtWidth(browser, NARROW);

    // Located by the accessible name, because that is what a user reads and what
    // a screen reader announces. The id is the whole point: no spaces, so nothing
    // in it can be a soft wrap opportunity.
    const label = page.getByRole("button", { name: "rr-7f3a91c2e5b84d0f6a1b2c3d4e5f60718" });
    await expect(label).toBeVisible();

    // The row asks for `wrap`, so it reflows and stays inside its own box.
    await fitsWithin(page.getByTestId("narrow-wrap-row"));

    // And the label itself never becomes wider than the viewport: this is the
    // assertion that fails if `min-width: 0` or `overflow-wrap: anywhere` is
    // ever removed, and it is the one that cannot be satisfied by luck.
    const box = await boxOf(label);
    expect(box.width).toBeLessThanOrEqual(NARROW);
  });

  test("the wrapped label keeps its full accessible name", async ({ browser }) => {
    const page = await openAtWidth(browser, NARROW);

    // Wrapping is a RENDERING decision, never a truncation one. Whatever the
    // width does to the painted label, the name a screen reader gets is the
    // whole string — an ellipsis here would be a silent shortening of the
    // accessible name, which is worse than the overflow it would have fixed.
    await expect(
      page.getByRole("button", { name: "rr-7f3a91c2e5b84d0f6a1b2c3d4e5f60718" }),
    ).toHaveAccessibleName("rr-7f3a91c2e5b84d0f6a1b2c3d4e5f60718");
  });

  test("a crowded row of icon buttons stays square instead of squashing", async ({ browser }) => {
    const page = await openAtWidth(browser, NARROW);

    // Located by name, one assertion over all eight: the contract is per-control,
    // and every control in the row is subject to it. Scoped to the row, because
    // the mixed toolbar below reuses the name "Delete item" on purpose.
    const icons = page.getByTestId("narrow-icon-row").getByRole("button", { name: /item$/ });
    await expect(icons).toHaveCount(8);

    // The defect this guards is invisible to every other assertion in the suite:
    // a squeezed icon button is still present, visible, enabled and focusable,
    // with its full accessible name intact. Only the geometry is wrong.
    await expectSquareBoxes(icons);

    // This asserts the CONTRACT (the squares survive) and deliberately not the
    // mechanism. Deleting `flex-shrink: 0` does not make this test go red, and
    // that is a measured fact worth keeping: a flex item's `min-width: auto`
    // floors it at its min-content size, and an icon-only button's min-content
    // width is exactly its own 34px, so the floor already protects the square
    // today. The declaration is what stops the protection depending on that
    // coincidence, and the authored-CSS test is where IT is asserted. A spec
    // rewritten to go red on that mutation would have to assert an internal
    // modifier name, which is the coupling this file refuses (helpers.ts rule 3).
  });

  test("a mixed toolbar keeps the button and the icon button at one height", async ({
    browser,
  }) => {
    const page = await openAtWidth(browser, NARROW);

    // The reason IconButton sizes fix BOTH axes (IconButton.css): a mixed
    // toolbar is only aligned while both controls resolve to the same height.
    const toolbar = page.getByTestId("narrow-toolbar-row");
    const [save] = await Promise.all([toolbar.getByRole("button", { name: "Save" }).boundingBox()]);
    const icon = await boxOf(toolbar.getByRole("button", { name: "Delete item" }));

    expect(save).not.toBeNull();
    expect(Math.abs((save?.height ?? 0) - icon.height)).toBeLessThanOrEqual(0.5);
  });

  test("the crowded row really is crowded at 320px, and stays reachable", async ({ browser }) => {
    const page = await openAtWidth(browser, NARROW);

    // The fixture-validity guard for the test above. Without it, "the icon
    // buttons are square" could pass on a row that fits comfortably, having
    // proved nothing. Eight 34px squares plus seven 8px gaps need 328px inside a
    // row that is about 272px wide, so the CONTENT must exceed the box:
    // `scrollWidth > clientWidth`. The row's own width is NOT the measure — it is
    // constrained by its parent either way, and asserting on it would pass
    // whether or not anything was crowded.
    const rows = page.getByTestId(/^narrow-.*-row$/);
    await expect(rows).toHaveCount(3);

    const iconRow = page.getByTestId("narrow-icon-row");
    await expect(iconRow).toBeVisible();
    expect(
      await overflowPx(iconRow),
      "the icon row must genuinely overflow at 320px",
    ).toBeGreaterThan(0);

    // Overfilling the row is acceptable; making its controls unreachable is not.
    // Overflow is painted outside the box, so the last control still has to be
    // on screen and still has to have a real size to click.
    const last = await boxOf(iconRow.getByRole("button", { name: "Print item" }));
    expect(last.width).toBeGreaterThan(0);
    expect(last.height).toBeGreaterThan(0);
  });

  test("every claim above also holds at 1280px", async ({ browser }) => {
    const page = await openAtWidth(browser, WIDE);

    // The other end of the width range, because a narrow-width fix that quietly
    // changes desktop behaviour is the regression this epic cannot afford: the
    // row must still fit at desktop width, and the icon buttons must still be
    // squares.
    await fitsWithin(page.getByTestId("narrow-wrap-row"));
    await expectSquareBoxes(page.getByTestId("narrow-icon-row").getByRole("button"));
  });
});
