// Responsive behaviour of Table and DataTable (RRU-140).
//
// Unlike the dead spec it replaces, this one runs inside the playground E2E
// project (`apps/playground/playwright.config.ts`) against the built app, not
// against a Storybook URL that `vite preview` does not serve. Assertions are
// geometric: the table family must not push the page sideways, the horizontal
// scrollport must exist, and a sticky header inside a bounded scrollport must
// actually stick. No `rr-*` class names are asserted (`helpers.ts` rule 3).
import type { Browser, Page } from "@playwright/test";

import { expect, test } from "@playwright/test";

import { fitsWithin, openPlayground, overflowPx } from "./helpers.js";

const NARROW = 320;
const WIDE = 1280;

async function openAtWidth(browser: Browser, width: number): Promise<Page> {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await context.newPage();
  await openPlayground(page);
  return page;
}

/** The wrapper that owns the horizontal scrollport — the table's parent. */
async function tableWrapper(page: Page) {
  const table = page.getByTestId("a11y-table").getByRole("table");
  await expect(table).toBeVisible();
  return table.locator("..");
}

test.describe("table family responsive (RRU-140)", () => {
  test("Table at 320px scrolls horizontally without overflowing its section", async ({
    browser,
  }) => {
    const page = await openAtWidth(browser, NARROW);
    const section = page.getByTestId("a11y-table");
    await expect(section).toBeVisible();

    // The table family must not be the reason the page scrolls sideways.
    await fitsWithin(section);

    // And the table wrapper must expose a horizontal scrollport, because the
    // columns do not fit a 320px viewport.
    const wrapper = await tableWrapper(page);
    expect(
      await overflowPx(wrapper),
      "table wrapper must have a horizontal scrollport",
    ).toBeGreaterThan(0);
  });

  test("sticky header sticks inside the bounded playground scrollport", async ({ browser }) => {
    const page = await openAtWidth(browser, NARROW);
    const section = page.getByTestId("a11y-table");
    const table = section.getByRole("table");
    const wrapper = await tableWrapper(page);

    // The consumer-bounded scrollport must be vertically scrollable, otherwise
    // the sticky header has nothing to stick to.
    const hasVerticalScroll = await wrapper.evaluate(
      (node) => node.scrollHeight > node.clientHeight,
    );
    expect(hasVerticalScroll, "bounded scrollport must have vertical overflow").toBe(true);

    // Scroll the wrapper down and read the header position relative to the
    // wrapper. A non-sticky header would move up with the body; a sticky one
    // stays at the top of the scrollport.
    const header = table.getByRole("columnheader").first();
    await wrapper.evaluate((node) => node.scrollTo({ top: 80 }));

    const offset = await page.evaluate(
      ([headerElement, wrapperElement]) => {
        const headerRect = (headerElement as HTMLElement).getBoundingClientRect();
        const wrapperRect = (wrapperElement as HTMLElement).getBoundingClientRect();
        return headerRect.top - wrapperRect.top;
      },
      [await header.elementHandle(), await wrapper.elementHandle()] as const,
    );

    expect(offset).toBeLessThanOrEqual(1);
  });

  test("DataTable at 320px fits within its section", async ({ browser }) => {
    const page = await openAtWidth(browser, NARROW);
    const section = page.getByTestId("a11y-data-table");
    await expect(section).toBeVisible();
    await fitsWithin(section);
  });

  test("Table also fits at desktop width", async ({ browser }) => {
    const page = await openAtWidth(browser, WIDE);
    const section = page.getByTestId("a11y-table");
    await expect(section).toBeVisible();
    await fitsWithin(section);
  });
});
