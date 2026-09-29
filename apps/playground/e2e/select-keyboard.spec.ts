// Critical flow 2 — Select driven by keyboard only (RRU-069).
//
// A listbox is the component where a mouse demo proves nothing: the whole value
// of `Select` is that a keyboard user can reach the options, hear what is
// selected and commit a choice without a pointer. So this spec never clicks an
// option — every interaction is a key press, and the assertions are the ARIA
// state a screen reader would read out.
import type { Page } from "@playwright/test";

import { expect, test } from "@playwright/test";

import { activeElement, openPlayground } from "./helpers.js";

function trigger(page: Page) {
  return page.getByTestId("plan-trigger");
}

function listbox(page: Page) {
  return page.getByRole("listbox");
}

test.describe("select (keyboard only)", () => {
  test.beforeEach(async ({ page }) => {
    await openPlayground(page);
    await trigger(page).focus();
  });

  test("opens with Enter and reports its state to assistive tech", async ({ page }) => {
    await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
    await expect(trigger(page)).toHaveAttribute("aria-haspopup", "listbox");

    await page.keyboard.press("Enter");

    await expect(listbox(page)).toBeVisible();
    await expect(trigger(page)).toHaveAttribute("aria-expanded", "true");
    // The panel is wired to the trigger, not merely rendered somewhere.
    const controls = await trigger(page).getAttribute("aria-controls");
    await expect(listbox(page)).toHaveAttribute("id", controls ?? "");
  });

  test("moves the roving focus with the arrow keys and wraps around", async ({ page }) => {
    await page.keyboard.press("Enter");
    await expect(listbox(page)).toBeVisible();

    const options = page.locator('[role="option"]');
    await expect(options).toHaveCount(3);

    // Focus starts on the first option, then walks down and wraps back up.
    expect((await activeElement(page))?.text).toBe("Hobby");

    await page.keyboard.press("ArrowDown");
    expect((await activeElement(page))?.text).toBe("Team");

    await page.keyboard.press("ArrowDown");
    expect((await activeElement(page))?.text).toBe("Enterprise");

    await page.keyboard.press("ArrowDown");
    expect((await activeElement(page))?.text).toBe("Hobby");

    await page.keyboard.press("ArrowUp");
    expect((await activeElement(page))?.text).toBe("Enterprise");

    await page.keyboard.press("Home");
    expect((await activeElement(page))?.text).toBe("Hobby");

    await page.keyboard.press("End");
    expect((await activeElement(page))?.text).toBe("Enterprise");
  });

  test("never lands on a disabled option and skips it with the arrow keys", async ({ page }) => {
    await page.getByTestId("dialog-trigger").click();
    await page.getByTestId("dialog-select-trigger").focus();
    await page.keyboard.press("Enter");

    await expect(listbox(page)).toBeVisible();
    const lisbon = page.locator('[role="option"][data-value="lisbon"]');
    await expect(lisbon).toHaveAttribute("aria-disabled", "true");

    // Opening focuses the first ENABLED option.
    expect((await activeElement(page))?.text).toBe("Berlin");

    // "Lisbon" sits between Oaxaca and Tbilisi, so walking down must jump over
    // it: a roving tabindex that stops on a disabled option is a keyboard trap.
    await page.keyboard.press("ArrowDown");
    expect((await activeElement(page))?.text).toBe("Oaxaca");
    await page.keyboard.press("ArrowDown");
    expect((await activeElement(page))?.text).toBe("Tbilisi");
  });

  test("commits with Enter, closes, and announces the selection", async ({ page }) => {
    await page.keyboard.press("Enter");
    await expect(listbox(page)).toBeVisible();

    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");

    await expect(listbox(page)).toBeHidden();
    await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
    await expect(trigger(page)).toContainText("Team");
    await expect(page.getByTestId("form-state")).toContainText("plan=team");

    // The selection is announced through a polite live region next to the
    // trigger, and the option keeps `aria-selected` for the next open.
    await expect(trigger(page).locator('[role="status"]')).toHaveText("Team");

    await page.keyboard.press("Enter");
    await expect(listbox(page)).toBeVisible();
    await expect(page.locator('[role="option"][data-value="team"]')).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("finds an option by typing its first letters", async ({ page }) => {
    await page.keyboard.press("Enter");
    await expect(listbox(page)).toBeVisible();

    await page.keyboard.press("e");
    expect((await activeElement(page))?.text).toBe("Enterprise");
  });

  test("closes on Escape without changing the selection", async ({ page }) => {
    await page.keyboard.press("Enter");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(trigger(page)).toContainText("Team");

    await page.keyboard.press("Enter");
    await expect(listbox(page)).toBeVisible();
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("Escape");

    await expect(listbox(page)).toBeHidden();
    await expect(trigger(page)).toContainText("Team");
    expect((await activeElement(page))?.testId).toBe("plan-trigger");
  });
});
