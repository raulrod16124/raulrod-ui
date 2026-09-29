// Critical flow 5 — overlays interacting with each other (RRU-069).
//
// This is the flow no component test can cover: two overlays alive at the same
// time. The system's contract is that the STACK behaves — only the topmost layer
// may consume a dismissal, focus returns to the control that opened the child,
// and the page scroll lock is released only when the LAST overlay closes
// (reference-counted, `utils/scroll-lock.ts`). Getting that wrong is what makes
// real applications feel broken: a dialog that closes when you dismiss a select
// inside it, or a page that stays frozen after everything is closed.
import type { Page } from "@playwright/test";

import { expect, test } from "@playwright/test";

import { activeElement, openPlayground } from "./helpers.js";

/** The dialog and the popover it contains both carry `role="dialog"`, so the
 *  suite addresses them by their own controls instead of by position. */
function dialogPanel(page: Page) {
  return page.getByRole("dialog").filter({ hasText: "Invite teammates" });
}

function nestedPopover(page: Page) {
  return page.getByRole("dialog").filter({ hasText: "Nested popover" });
}

async function openDialogWithNestedPopover(page: Page) {
  await page.getByTestId("dialog-trigger").click();
  await expect(dialogPanel(page)).toBeVisible();
  await page.getByTestId("dialog-popover-trigger").click();
  await expect(nestedPopover(page)).toBeVisible();
}

test.describe("overlay stack", () => {
  test.beforeEach(async ({ page }) => {
    await openPlayground(page);
  });

  test("one Escape closes the topmost overlay only", async ({ page }) => {
    await openDialogWithNestedPopover(page);

    await page.keyboard.press("Escape");
    await expect(nestedPopover(page)).toBeHidden();
    // The dialog underneath must survive: dismissing a child must not take the
    // modal (and everything the user typed in it) with it.
    await expect(dialogPanel(page)).toBeVisible();
    await expect(page.locator("body")).toHaveCSS("overflow", "hidden");

    await page.keyboard.press("Escape");
    await expect(dialogPanel(page)).toBeHidden();
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  });

  test("focus returns to the control that opened the child overlay", async ({ page }) => {
    await openDialogWithNestedPopover(page);

    await page.keyboard.press("Escape");

    await expect(nestedPopover(page)).toBeHidden();
    expect((await activeElement(page))?.testId).toBe("dialog-popover-trigger");
  });

  test("a select inside the dialog is dismissed before the dialog is", async ({ page }) => {
    await page.getByTestId("dialog-trigger").click();
    await expect(dialogPanel(page)).toBeVisible();

    await page.getByTestId("dialog-select-trigger").click();
    await expect(page.getByRole("listbox")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("listbox")).toBeHidden();
    await expect(dialogPanel(page)).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialogPanel(page)).toBeHidden();
  });

  test("a press outside a non-modal overlay closes only that overlay", async ({ page }) => {
    await page.getByTestId("popover-trigger").click();
    await expect(page.getByRole("dialog").filter({ hasText: "Only starred" })).toBeVisible();

    await page.mouse.click(4, 4);

    await expect(page.getByRole("dialog").filter({ hasText: "Only starred" })).toBeHidden();
    // A non-modal popover must not leave the page frozen.
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  });

  test("Escape closes one level of a submenu at a time", async ({ page }) => {
    await page.getByTestId("menu-trigger").click();
    const root = page.getByRole("menu").first();
    await expect(root).toBeVisible();

    await page.getByRole("menuitem", { name: "More" }).hover();
    // The submenu is identified by its own content, never by position: as soon
    // as it closes, a positional locator (`.last()`) re-resolves to the root
    // menu that is still open, and the assertion would be checking the wrong
    // element.
    const sub = page.getByRole("menu").filter({ hasText: "Archive" });
    await expect(sub).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(sub).toBeHidden();
    await expect(root).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(root).toBeHidden();
  });

  test("a menu item fires its action and closes the whole tree", async ({ page }) => {
    await page.getByTestId("menu-trigger").click();
    await page.getByRole("menuitem", { name: "Duplicate" }).click();

    await expect(page.getByRole("menu")).toBeHidden();
    await expect(page.getByTestId("last-action")).toHaveText("Last action: duplicate");
    // The focus goes back to the trigger that opened the menu.
    expect((await activeElement(page))?.testId).toBe("menu-trigger");
  });

  test("a tooltip opens on keyboard focus without delay", async ({ page }) => {
    await page.getByRole("button", { name: "Tooltip anchor" }).focus();

    // No hover, no timer: focusing is enough, so the tooltip is usable without a
    // pointer. `content` is the accessible content of the `role="tooltip"`.
    const tooltip = page.getByRole("tooltip");
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toHaveText("Opens the confirmation dialog");
  });
});
