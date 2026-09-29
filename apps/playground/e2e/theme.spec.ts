// Critical flow 4 — theme switching (RRU-069).
//
// Theming is the one flow that cannot be asserted in jsdom: the whole contract
// lives in the emitted custom properties and in the cascade, so it needs a real
// engine. What is protected here is the three-state model of RRU-024 — system,
// explicit light, explicit dark — plus the precedence between an explicit
// attribute and the OS preference, which regresses silently because the page
// still "works" in one theme.
//
// No token value is hardcoded in this file: the assertions compare what the
// cascade PRODUCES in two situations, so a palette change (RRU-021/049) does not
// turn this spec into a second source of truth.
import type { Browser, BrowserContextOptions, Page } from "@playwright/test";

import { expect, test } from "@playwright/test";

import { openPlayground } from "./helpers.js";

interface SurfaceColors {
  background: string;
  color: string;
}

/** The colors a human perceives on the page, not the attribute that requested
 *  them: an implementation that set `data-theme` without emitting different
 *  values would pass a weaker test. */
async function surfaceColors(page: Page): Promise<SurfaceColors> {
  return page.evaluate(() => {
    const body = getComputedStyle(document.body);
    return { background: body.backgroundColor, color: body.color };
  });
}

/** The page under a given OS preference — that is how "system" is expressed.
 *  The context is not closed on purpose: the `browser` fixture tears the whole
 *  browser down at the end of the test, and an extra `close()` would only add a
 *  second teardown path to reason about. */
async function openWithPreference(browser: Browser, options: BrowserContextOptions): Promise<Page> {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  await openPlayground(page);
  return page;
}

test.describe("theme", () => {
  test("follows the OS preference while no theme is chosen", async ({ browser }) => {
    const darkPage = await openWithPreference(browser, { colorScheme: "dark" });
    const lightPage = await openWithPreference(browser, { colorScheme: "light" });

    // No attribute at all is the "system" state: the tokens' media query decides
    // and the app must not fake it with an explicit value.
    await expect(darkPage.locator("html")).not.toHaveAttribute("data-theme", /.*/);
    await expect(darkPage.getByTestId("theme-system")).toHaveAttribute("aria-pressed", "true");
    await expect(lightPage.locator("html")).not.toHaveAttribute("data-theme", /.*/);

    const dark = await surfaceColors(darkPage);
    const light = await surfaceColors(lightPage);
    expect(dark.background).not.toBe(light.background);
    expect(dark.color).not.toBe(light.color);
  });

  test("flips between light and dark through the switcher", async ({ page }) => {
    await openPlayground(page);
    const light = await surfaceColors(page);

    await page.getByTestId("theme-dark").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.getByTestId("theme-dark")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("theme-light")).toHaveAttribute("aria-pressed", "false");
    expect((await surfaceColors(page)).background).not.toBe(light.background);

    await page.getByTestId("theme-light").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect.poll(() => surfaceColors(page)).toEqual(light);
  });

  test("an explicit theme wins over the OS preference", async ({ browser }) => {
    const darkSystem = await openWithPreference(browser, { colorScheme: "dark" });
    const lightSystem = await openWithPreference(browser, { colorScheme: "light" });

    // What each preference produces on its own: the target of both overrides.
    const darkColors = await surfaceColors(darkSystem);
    const lightColors = await surfaceColors(lightSystem);

    // Light chosen on a dark OS must render exactly what a light OS renders.
    await darkSystem.getByTestId("theme-light").click();
    await expect(darkSystem.locator("html")).toHaveAttribute("data-theme", "light");
    expect(await surfaceColors(darkSystem)).toEqual(lightColors);

    // Dark chosen on a light OS must render exactly what a dark OS renders.
    await lightSystem.getByTestId("theme-dark").click();
    await expect(lightSystem.locator("html")).toHaveAttribute("data-theme", "dark");
    expect(await surfaceColors(lightSystem)).toEqual(darkColors);
  });

  test("back to system REMOVES the attribute instead of adding a fourth value", async ({
    browser,
  }) => {
    const page = await openWithPreference(browser, { colorScheme: "dark" });
    const asSystem = await surfaceColors(page);

    await page.getByTestId("theme-light").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    await page.getByTestId("theme-system").click();
    // `data-theme="system"` would be a state the emitted CSS does not know, and
    // the page would keep the previous colors.
    await expect(page.locator("html")).not.toHaveAttribute("data-theme", /.*/);
    expect(await surfaceColors(page)).toEqual(asSystem);
  });

  test("applies the stored theme before React paints, with no flash", async ({ browser }) => {
    const page = await openWithPreference(browser, { colorScheme: "light" });

    await page.getByTestId("theme-dark").click();
    const chosen = await surfaceColors(page);

    await page.reload();

    // The attribute is written by the blocking script in <head>, so it is
    // already there when the document is interactive and the switcher reads the
    // same persisted choice — markup and DOM can never disagree.
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.getByTestId("theme-dark")).toHaveAttribute("aria-pressed", "true");
    expect(await surfaceColors(page)).toEqual(chosen);
  });

  // The full reduced-motion sweep across every component is RRU-072's job; this
  // is the regression guard for the part of it that a consumer can observe on
  // the very first overlay: the dialog is animated in its normal state.
  test("drops the dialog animation when the user asks for reduced motion", async ({ browser }) => {
    // The backdrop is `aria-hidden` decoration with no accessible identity, so
    // its class is the only handle a test can have on it.
    const backdrop = ".rr-dialog-backdrop";

    const reduced = await openWithPreference(browser, { reducedMotion: "reduce" });
    await reduced.getByTestId("dialog-trigger").click();
    await expect(reduced.getByRole("dialog")).toBeVisible();
    expect(await reduced.locator(backdrop).evaluate((n) => getComputedStyle(n).animationName)).toBe(
      "none",
    );

    const normal = await openWithPreference(browser, { reducedMotion: "no-preference" });
    await normal.getByTestId("dialog-trigger").click();
    await expect(normal.getByRole("dialog")).toBeVisible();
    expect(await normal.locator(backdrop).evaluate((n) => getComputedStyle(n).animationName)).toBe(
      "rr-dialog-backdrop-in",
    );
  });
});
