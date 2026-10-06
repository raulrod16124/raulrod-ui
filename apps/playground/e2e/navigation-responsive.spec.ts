// Responsive behaviour of the navigation family: Pagination and Tabs (RRU-141).
//
// Both are horizontal rails. Pagination collapses to prev/current/next inside
// a narrow container; Tabs becomes a horizontal scrollport. Assertions are
// geometric and role-based — no `rr-*` class names (`helpers.ts` rule 3).
import type { Browser, Page } from "@playwright/test";

import { expect, test } from "@playwright/test";

import { activeElement, boxOf, fitsWithin, openPlayground, overflowPx } from "./helpers.js";

const NARROW = 320;
const WIDE = 1280;

async function openAtWidth(browser: Browser, width: number): Promise<Page> {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await context.newPage();
  await openPlayground(page);
  return page;
}

/** A threshold tall enough to catch a collapsed-to-zero rail, small enough to
 *  stay well below the 104px floor of the compact pager. */
const PAGER_MIN_WIDTH = 80;

test.describe("navigation family responsive (RRU-141)", () => {
  test("Pagination at 320px collapses to one row and three visible controls", async ({
    browser,
  }) => {
    const page = await openAtWidth(browser, NARROW);
    const section = page.getByTestId("responsive-pagination");
    await expect(section).toBeVisible();

    // The section must not push the page sideways.
    await fitsWithin(section);

    const nav = section.getByRole("navigation", { name: "Paged results" });
    await expect(nav).toBeVisible();
    const navBox = await boxOf(nav);
    expect(navBox.height).toBeLessThanOrEqual(40);

    // Only previous, current and next are visible. `display: none` removes the
    // other page buttons from the accessibility tree, so counting roles is
    // equivalent to counting visible controls.
    const pageButtons = section.getByRole("button", { name: /Go to page/ });
    await expect(pageButtons).toHaveCount(1);
    await expect(section.getByRole("button", { name: "Previous page" })).toBeVisible();
    await expect(section.getByRole("button", { name: "Next page" })).toBeVisible();
  });

  test("Pagination at 1280px shows the full bar inside its section", async ({ browser }) => {
    const page = await openAtWidth(browser, WIDE);
    const section = page.getByTestId("responsive-pagination");
    await expect(section).toBeVisible();
    await fitsWithin(section);

    // The windowed bar shows the five page-number buttons: first, window of
    // three around the current page, and last (the two ellipsis are spans).
    const pageButtons = section.getByRole("button", { name: /Go to page/ });
    await expect(pageButtons).toHaveCount(5);
  });

  test("Tabs at 320px becomes a horizontal scrollport without overflowing the page", async ({
    browser,
  }) => {
    const page = await openAtWidth(browser, NARROW);
    const section = page.getByTestId("responsive-tabs");
    await expect(section).toBeVisible();
    await fitsWithin(section);

    const tablist = section.getByRole("tablist", { name: "Wide tab set" });
    await expect(tablist).toBeVisible();

    // The rail owns a horizontal scrollport: content is wider than the box.
    expect(await overflowPx(tablist), "tab rail must scroll horizontally").toBeGreaterThan(0);
  });

  test("Tabs keyboard scrolling keeps the focused tab inside the visible rail", async ({
    browser,
  }) => {
    const page = await openAtWidth(browser, NARROW);
    const section = page.getByTestId("responsive-tabs");
    const tablist = section.getByRole("tablist", { name: "Wide tab set" });

    // Focus the first tab and arrow right past the fold.
    await section.getByRole("tab", { name: "Tab 1" }).focus();
    for (let i = 0; i < 5; i += 1) {
      await page.keyboard.press("ArrowRight");
    }

    const focus = await activeElement(page);
    expect(focus).not.toBeNull();
    expect(focus?.role).toBe("tab");
    expect(focus?.text).toBe("Tab 6");

    // Geometry: the focused tab must be inside the rail's visible box.
    const railBox = await boxOf(tablist);
    const tabBox = await boxOf(section.getByRole("tab", { name: "Tab 6" }));
    expect(tabBox.x).toBeGreaterThanOrEqual(railBox.x - 1);
    expect(tabBox.x + tabBox.width).toBeLessThanOrEqual(railBox.x + railBox.width + 1);

    // And the rail has actually scrolled.
    const scrollLeft = await tablist.evaluate((node) => node.scrollLeft);
    expect(scrollLeft).toBeGreaterThan(0);
  });

  test("Tabs at 1280px fits without a scrollport", async ({ browser }) => {
    const page = await openAtWidth(browser, WIDE);
    const section = page.getByTestId("responsive-tabs");
    await expect(section).toBeVisible();
    await fitsWithin(section);

    const tablist = section.getByRole("tablist", { name: "Wide tab set" });
    expect(await overflowPx(tablist), "eight tabs fit at desktop width").toBeLessThanOrEqual(1);
  });

  test("the DataTable pager is still reachable at 320px (container-type regression probe)", async ({
    browser,
  }) => {
    const page = await openAtWidth(browser, NARROW);
    const section = page.getByTestId("a11y-data-table");
    await expect(section).toBeVisible();

    // The composed pagination inside DataTable must not collapse to zero width
    // when `.rr-pagination` declares `container-type: inline-size` while being
    // a flex item of `.rr-data-table__footer`.
    const pager = section.getByRole("navigation").first();
    await expect(pager).toBeVisible();
    const box = await boxOf(pager);
    expect(box.width, "composed pager must keep its intrinsic width").toBeGreaterThanOrEqual(
      PAGER_MIN_WIDTH,
    );
  });
});
