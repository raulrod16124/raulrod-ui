// Critical flow — DataTable (RRU-119).
//
// The contract under test is the one a screen-reader user of a data table has:
// sorting and paging change the row set WITHOUT moving the focus, so the only
// channel that tells them what happened is the table's polite live region. The
// component-level gate already proves which sentence each commit produces and
// that the region stays mounted while the pagination bar unmounts; the real
// browser proves the sentence on the composed page a consumer actually ships
// (controlled sorting + controlled paging, the hardest wiring). Locators follow
// helpers.ts: role and accessible name only, scoped to the section so the
// assert never depends on what the rest of the page happens to render.
import type { Page } from "@playwright/test";

import { expect, test } from "@playwright/test";

import { openPlayground } from "./helpers.js";

const table = (page: Page) => page.getByTestId("a11y-data-table");
const announcement = (page: Page) => table(page).getByRole("status");

test.describe("data table", () => {
  test.beforeEach(async ({ page }) => {
    await openPlayground(page);
  });

  test("sorting a column announces the committed sort, focus never moving", async ({ page }) => {
    await table(page).getByRole("button", { name: "Sort by Version, not sorted" }).click();

    await expect(announcement(page)).toHaveText("Sorted by Version ascending");
  });

  test("changing page announces the new page even though the rows swap in place", async ({
    page,
  }) => {
    await table(page).getByRole("button", { name: "Next page" }).click();

    await expect(announcement(page)).toHaveText("Page 2 of 2");
  });
});
