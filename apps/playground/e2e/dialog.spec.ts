// Critical flow 1 — Dialog (RRU-069).
//
// The contract under test is what a modal dialog owes its user: it opens, takes
// focus, holds it, blocks the page behind it, closes on Escape and gives the
// focus back. Each of those is an accessibility promise, so each is asserted as
// a promise (who has focus, what stays reachable) and never as a styling detail.
import type { Page } from "@playwright/test";

import { expect, test } from "@playwright/test";

import { activeElement, openPlayground } from "./helpers.js";

const dialog = (page: Page) => page.getByRole("dialog");

// What a user can reach with Tab inside the panel. Derived from the DOM instead
// of from a list of `data-testid`s: a control without a testid is still part of
// the cycle, and a hardcoded list would silently under-count it and make the trap
// look broken (or, worse, pass for the wrong reason).
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

test.describe("dialog", () => {
  test.beforeEach(async ({ page }) => {
    await openPlayground(page);
  });

  test("opens from the trigger, takes focus and locks the page behind it", async ({ page }) => {
    const trigger = page.getByTestId("dialog-trigger");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    await trigger.click();

    const panel = dialog(page);
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAttribute("aria-modal", "true");
    await expect(panel).toHaveAttribute("aria-labelledby", /.+/);
    await expect(page.getByRole("heading", { name: "Invite teammates" })).toBeVisible();

    // Focus moves INTO the dialog, otherwise a keyboard user keeps tabbing
    // through the page underneath while the dialog looks open.
    const focused = await activeElement(page);
    expect(focused?.tag).toBe("div");
    expect(await panel.evaluate((node) => node.contains(node.ownerDocument.activeElement))).toBe(
      true,
    );

    // The page behind must not scroll while a modal is up.
    await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
  });

  test("traps Tab inside the dialog and wraps around", async ({ page }) => {
    await page.getByTestId("dialog-trigger").click();
    const panel = dialog(page);
    await expect(panel).toBeVisible();

    const focusables = panel.locator(FOCUSABLE);
    const count = await focusables.count();
    expect(count).toBeGreaterThan(1);

    await focusables.first().focus();

    // Walk one full cycle, remembering where the focus lands at every step.
    const cycle = [await activeElement(page)];
    for (let index = 0; index < count; index += 1) {
      await page.keyboard.press("Tab");
      cycle.push(await activeElement(page));
    }

    // As many Tabs as there are controls brings the focus back to where it
    // started: the trap wraps instead of escaping to the browser UI or to the
    // page behind the modal.
    expect(cycle[count]).toEqual(cycle[0]);
    // Every stop of the cycle is a DIFFERENT control of the panel: a repeated
    // element would mean a control is skipped, and a control outside the panel
    // would mean the focus escaped mid-cycle.
    expect(new Set(cycle.map((stop) => JSON.stringify(stop))).size).toBe(count);
  });

  test("closes on Escape and returns the focus to the trigger", async ({ page }) => {
    const trigger = page.getByTestId("dialog-trigger");
    await trigger.click();
    await expect(dialog(page)).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(dialog(page)).toBeHidden();
    // Losing the focus to <body> after closing is the classic overlay bug: the
    // next Tab would restart from the top of the document.
    expect((await activeElement(page))?.testId).toBe("dialog-trigger");
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  });

  test("closes with a footer action and with a press outside the panel", async ({ page }) => {
    await page.getByTestId("dialog-trigger").click();
    await expect(dialog(page)).toBeVisible();

    await page.getByTestId("dialog-close").click();
    await expect(dialog(page)).toBeHidden();

    // Reopen through the controlled root, then dismiss the way a mouse user
    // does: pressing the dimmed area outside the panel.
    await page.getByTestId("dialog-trigger").click();
    await expect(dialog(page)).toBeVisible();

    await page.mouse.click(4, 4);
    await expect(dialog(page)).toBeHidden();
  });

  test("opens from a menu item and survives a full close cycle", async ({ page }) => {
    await page.getByTestId("menu-trigger").click();
    await page.getByRole("menuitem", { name: "More" }).hover();
    // The submenu is addressed by what is inside it: a positional locator such as
    // `.last()` silently re-points at the root menu the moment the submenu goes
    // away, and a test that then asserts "hidden" on the root would pass for the
    // wrong reason.
    const submenu = page.getByRole("menu").filter({ hasText: "Delete project…" });
    await expect(submenu).toBeVisible();

    await page.getByRole("menuitem", { name: "Delete project…" }).click();

    // The whole menu tree is gone and the modal is the only layer left.
    await expect(submenu).toBeHidden();
    await expect(dialog(page)).toBeVisible();
    await expect(page.getByTestId("last-action")).toHaveText("Last action: delete-requested");
    // The menu restores the focus to its trigger when it closes; the dialog that
    // opened in the same commit must win, or the user is left focused behind a
    // modal.
    expect(
      await dialog(page).evaluate((node) => node.contains(node.ownerDocument.activeElement)),
    ).toBe(true);

    await page.getByTestId("dialog-confirm").click();
    await expect(dialog(page)).toBeHidden();
  });
});
