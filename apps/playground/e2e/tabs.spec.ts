// Critical flow — Tabs (RRU-118).
//
// The contract under test is the one a keyboard user of a tab set has: entering
// a tab panel that holds nothing focusable (text only), and leaving the region
// again in document order. That is the case the component-level gate cannot
// prove on its own — happy-dom's sequential navigation does not honour the
// `hidden` attribute of an inactive panel, so the mixed widget the playground
// ships (text-only panel + a panel with controls) is only modellable in a real
// browser. Every assertion is about WHO HAS THE FOCUS, never about a class or a
// style: the ring that makes the stop visible is a CSS concern, the reachable
// stop is the promise.
import type { Page } from "@playwright/test";

import { expect, test } from "@playwright/test";

import { activeElement, openPlayground } from "./helpers.js";

const tablist = (page: Page) => page.getByRole("tablist", { name: "Documentation" });
const tab = (page: Page, name: string) => tablist(page).getByRole("tab", { name });

/** Whether the element with the focus still lives inside the Tabs widget. A Tab
 *  that leaks focus into the panel is the promise; a Tab that escapes the region
 *  is the boundary — neither is asserted through a `data-testid` on a sibling
 *  control, so this does not hardcode what the page happens to render next. */
function focusIsInsideTabs(page: Page): Promise<boolean> {
  return page.evaluate(() => document.activeElement?.closest('[data-testid="a11y-tabs"]') !== null);
}

test.describe("tabs", () => {
  test.beforeEach(async ({ page }) => {
    await openPlayground(page);
  });

  test("a text-only panel is a tab stop and yields the focus back to the page", async ({
    page,
  }) => {
    await tab(page, "Overview").focus();

    // The bug (RRU-118): the active panel contained no focusable element, so Tab
    // used to walk straight over it and out of the widget.
    await page.keyboard.press("Tab");
    expect(await activeElement(page)).toMatchObject({ role: "tabpanel" });
    expect(await focusIsInsideTabs(page)).toBe(true);

    // Leaving the region still works — the panel is the LAST stop of the widget,
    // not a trap, and it did not swallow the key.
    await page.keyboard.press("Tab");
    expect(await focusIsInsideTabs(page)).toBe(false);
    expect((await activeElement(page))?.role).not.toBe("tabpanel");
  });

  test("a panel with controls takes the stop first, then hands over to its own content", async ({
    page,
  }) => {
    await tab(page, "Overview").focus();
    // Automatic activation: the arrow selects the panel, so its content and its
    // focusability change before the next Tab.
    await page.keyboard.press("ArrowRight");
    await expect(tab(page, "Usage")).toHaveAttribute("aria-selected", "true");

    await page.keyboard.press("Tab");
    expect(await activeElement(page)).toMatchObject({ role: "tabpanel" });
    expect(await focusIsInsideTabs(page)).toBe(true);

    // Document order inside the panel: its button, then its link, then out.
    // `tag`, not `role`: `activeElement` reads the ATTRIBUTE, and a native
    // <button>/<a> has an implicit role but no `role` attribute.
    await page.keyboard.press("Tab");
    expect(await activeElement(page)).toMatchObject({
      tag: "button",
      text: "Read the guide",
    });

    await page.keyboard.press("Tab");
    expect(await activeElement(page)).toMatchObject({
      tag: "a",
      text: "Back to the section title",
    });

    await page.keyboard.press("Tab");
    expect(await focusIsInsideTabs(page)).toBe(false);
  });

  test("the stop follows the selection: the panel that got hidden is not reachable", async ({
    page,
  }) => {
    await tab(page, "Overview").focus();
    await page.keyboard.press("ArrowRight");
    await expect(tab(page, "Usage")).toHaveAttribute("aria-selected", "true");

    // The "Overview" panel is now `hidden`; the focus must land in the panel that
    // is on screen, not in the one that was left behind.
    await page.keyboard.press("Tab");
    const focus = await activeElement(page);
    expect(focus?.role).toBe("tabpanel");
    expect(focus?.text).toContain("Read the guide");
    expect(focus?.text).not.toContain("This panel contains text only");
  });
});
