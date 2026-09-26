// Critical flow 3 — form submit (RRU-069).
//
// The design system ships no validation, so what this flow protects is the
// INTEGRATION contract a consumer depends on: rendering the error slot is what
// turns the field invalid (`aria-invalid` + `aria-errormessage` pointing at a
// real node) and announces the message, and a successful submit has to be
// perceivable. Both are easy to get silently wrong from the app side, which is
// exactly why they belong to an E2E suite and not to a unit test of the form.
import type { Page } from "@playwright/test";

import { expect, test } from "@playwright/test";

import { openPlayground } from "./helpers.js";

/** The toast stack, by its own landmark. `ToastProvider` gives it a labelled
 *  region, which is the only unambiguous way to say "the notification" when
 *  other components on the page also own live regions. */
const notifications = (page: Page) => page.getByRole("region", { name: "Notifications" });

test.describe("form", () => {
  test.beforeEach(async ({ page }) => {
    await openPlayground(page);
  });

  test("rejects an invalid email and wires the error to the control", async ({ page }) => {
    const email = page.getByLabel("Email");

    await email.fill("not-an-email");
    await page.getByTestId("submit").click();

    const error = page.getByTestId("email-error");
    await expect(error).toBeVisible();
    // `role="alert"` is what makes a screen reader say it without moving focus.
    await expect(error).toHaveAttribute("role", "alert");
    await expect(email).toHaveAttribute("aria-invalid", "true");
    // The reference has to resolve: an `aria-errormessage` pointing nowhere is
    // worse than no attribute at all. Asserting the id exists first also keeps
    // the comparison below honest — `null === null` would pass otherwise.
    const errorId = await error.getAttribute("id");
    expect(errorId).not.toBeNull();
    await expect(email).toHaveAttribute("aria-errormessage", errorId ?? "");

    // A native submit would have reloaded the page and lost the state.
    await expect(page.getByTestId("form-state")).toContainText("email=not-an-email");
  });

  test("clears the error and announces a successful submit", async ({ page }) => {
    await page.getByLabel("Email").fill("ada@example.com");
    await page.getByTestId("submit").click();

    await expect(page.getByTestId("email-error")).toBeHidden();
    await expect(page.getByLabel("Email")).not.toHaveAttribute("aria-invalid", "true");

    // Scoped to the notifications region: `Select` also renders a `role="status"`
    // live region, so a bare `getByRole("status")` is ambiguous and would either
    // fail on strict mode or (worse) assert on the select instead of the toast.
    const toast = notifications(page).getByRole("status");
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("Workspace created");
    await expect(toast).toContainText("ada@example.com");
  });

  test("dismisses the toast on its own and can be closed by hand", async ({ page }) => {
    await page.getByLabel("Email").fill("grace@example.com");
    await page.getByTestId("submit").click();

    const toast = notifications(page).getByRole("status");
    await expect(toast).toBeVisible();

    // The close button is reachable by name, not by position.
    await toast.getByRole("button", { name: "Dismiss" }).click();
    await expect(toast).toBeHidden();
  });

  test("toggles the native controls from the keyboard", async ({ page }) => {
    const terms = page.getByTestId("terms");
    await terms.focus();
    await page.keyboard.press("Space");
    await expect(terms).toBeChecked();

    const beta = page.getByRole("switch", { name: "Beta channel" });
    await beta.focus();
    await expect(beta).not.toBeChecked();
    await page.keyboard.press("Space");
    await expect(beta).toBeChecked();
    await expect(page.getByTestId("form-state")).toContainText("beta=on");
  });

  test("keeps the label, description and control associated", async ({ page }) => {
    const email = page.getByLabel("Email");
    await expect(email).toHaveAttribute("id", "playground-email");
    await expect(email).toHaveAttribute("aria-describedby", "playground-email-description");
    await expect(page.getByText("We never share your email.")).toBeVisible();
  });
});
