// Responsive behaviour of the fluid family: ten components the board claimed
// were already fluid (RRU-143).
//
// Four of them were not. Assertions are geometric and role-based; the fixture
// uses fixed 200px frames and a clipped frame for Portal. No `rr-*` class names
// are asserted (helpers.ts rule 3).
import type { Browser, Page } from "@playwright/test";

import { expect, test } from "@playwright/test";

import { boxOf, fitsWithin, openPlayground, overflowPx } from "./helpers.js";

const NARROW = 320;
const WIDE = 1280;

async function openAtWidth(browser: Browser, width: number): Promise<Page> {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await context.newPage();
  await openPlayground(page);
  return page;
}

test.describe("fluid family responsive (RRU-143)", () => {
  test("Checkbox stays square and inside a narrow frame", async ({ browser }) => {
    const page = await openAtWidth(browser, NARROW);
    const section = page.getByTestId("responsive-checkbox-row");
    await expect(section).toBeVisible();
    await fitsWithin(section);

    const frame = section.getByTestId("responsive-checkbox-frame");
    expect(await overflowPx(frame), "frame content must not overflow").toBeLessThanOrEqual(1);

    const checkboxes = frame.getByRole("checkbox");
    const count = await checkboxes.count();
    expect(count, "three checkbox sizes are rendered").toBe(3);

    const widths: number[] = [];
    for (let i = 0; i < count; i += 1) {
      const box = await boxOf(checkboxes.nth(i));
      expect(
        Math.abs(box.width - box.height),
        `checkbox ${i} is ${box.width}×${box.height}, not square`,
      ).toBeLessThanOrEqual(0.1);
      widths.push(box.width);
    }
    widths.sort((a, b) => a - b);
    expect(widths[0], "sm checkbox is the smallest").toBeLessThan(widths[1]!);
    expect(widths[1], "md checkbox is between sm and lg").toBeLessThan(widths[2]!);
    expect(widths[2], "lg checkbox fits inside a 200px frame").toBeLessThanOrEqual(24);
  });

  test("Switch label wraps instead of pushing the track out", async ({ browser }) => {
    const page = await openAtWidth(browser, NARROW);
    const section = page.getByTestId("responsive-switch-row");
    await expect(section).toBeVisible();
    await fitsWithin(section);

    const frame = section.getByTestId("responsive-switch-frame");
    expect(await overflowPx(frame), "frame content must not overflow").toBeLessThanOrEqual(1);

    const sw = frame.getByRole("switch");
    const box = await boxOf(sw);
    expect(box.width, "switch must fit inside the 200px frame").toBeLessThanOrEqual(200);
  });

  test("Avatar stays square and inside a narrow frame", async ({ browser }) => {
    const page = await openAtWidth(browser, NARROW);
    const section = page.getByTestId("responsive-avatar-row");
    await expect(section).toBeVisible();
    await fitsWithin(section);

    const frame = section.getByTestId("responsive-avatar-frame");
    expect(await overflowPx(frame), "frame content must not overflow").toBeLessThanOrEqual(1);

    const avatar = frame.getByRole("img");
    const box = await boxOf(avatar);
    expect(Math.abs(box.width - box.height), "avatar must stay square").toBeLessThanOrEqual(0.1);
    expect(box.width, "avatar width must be its token size").toBeCloseTo(40, 0);
  });

  test("Badge wraps long unbreakable content", async ({ browser }) => {
    const page = await openAtWidth(browser, NARROW);
    const section = page.getByTestId("responsive-badge-row");
    await expect(section).toBeVisible();
    await fitsWithin(section);

    const frame = section.getByTestId("responsive-badge-frame");
    expect(await overflowPx(frame), "frame content must not overflow").toBeLessThanOrEqual(1);
  });

  test("Skeleton fills the width of its narrow frame", async ({ browser }) => {
    const page = await openAtWidth(browser, NARROW);
    const section = page.getByTestId("responsive-skeleton-row");
    await expect(section).toBeVisible();
    await fitsWithin(section);

    const frame = section.getByTestId("responsive-skeleton-frame");
    expect(await overflowPx(frame), "frame content must not overflow").toBeLessThanOrEqual(1);

    const skeleton = frame.getByTestId("responsive-skeleton-target").locator("> *").first();
    const skeletonBox = await boxOf(skeleton);
    const frameBox = await boxOf(frame);
    expect(skeletonBox.width, "skeleton must fill the frame content width").toBeCloseTo(
      frameBox.width - 2 * 8 - 2 * 1,
      0,
    );
  });

  test("Progress fills the width of its narrow frame", async ({ browser }) => {
    const page = await openAtWidth(browser, NARROW);
    const section = page.getByTestId("responsive-progress-row");
    await expect(section).toBeVisible();
    await fitsWithin(section);

    const frame = section.getByTestId("responsive-progress-frame");
    expect(await overflowPx(frame), "frame content must not overflow").toBeLessThanOrEqual(1);

    const progress = frame.getByRole("progressbar");
    const progressBox = await boxOf(progress);
    const frameBox = await boxOf(frame);
    expect(progressBox.width, "progress must fill the frame content width").toBeCloseTo(
      frameBox.width - 2 * 8 - 2 * 1,
      0,
    );
  });

  test("Text breaks long words and the raw span proves the fixture", async ({ browser }) => {
    const page = await openAtWidth(browser, NARROW);
    const section = page.getByTestId("responsive-text-row");
    await expect(section).toBeVisible();

    const frame = section.getByTestId("responsive-text-frame");
    expect(await overflowPx(frame), "Text frame must not overflow").toBeLessThanOrEqual(1);

    const rawFrame = section.getByTestId("responsive-text-raw-frame");
    expect(
      await overflowPx(rawFrame),
      "raw span frame must overflow to prove the fixture",
    ).toBeGreaterThan(0);
  });

  test("Heading breaks long words and the raw span proves the fixture", async ({ browser }) => {
    const page = await openAtWidth(browser, NARROW);
    const section = page.getByTestId("responsive-heading-row");
    await expect(section).toBeVisible();

    const frame = section.getByTestId("responsive-heading-frame");
    expect(await overflowPx(frame), "Heading frame must not overflow").toBeLessThanOrEqual(1);

    const rawFrame = section.getByTestId("responsive-heading-raw-frame");
    expect(
      await overflowPx(rawFrame),
      "raw span frame must overflow to prove the fixture",
    ).toBeGreaterThan(0);
  });

  test("VisuallyHidden leaves zero layout footprint", async ({ browser }) => {
    const page = await openAtWidth(browser, NARROW);
    await page.evaluate(() => {
      const active = document.activeElement;
      if (active instanceof HTMLElement) {
        active.blur();
      }
    });

    const section = page.getByTestId("responsive-visually-hidden-row");
    await expect(section).toBeVisible();
    await fitsWithin(section);

    const frame = section.getByTestId("responsive-visually-hidden-frame");
    expect(await overflowPx(frame), "frame content must not overflow").toBeLessThanOrEqual(1);

    const link = section.getByRole("link", {
      name: /Skip to fluid section/,
    });
    await expect(link).toHaveCount(1);
  });

  test("Portal escapes an overflow:hidden ancestor", async ({ browser }) => {
    const page = await openAtWidth(browser, NARROW);
    const section = page.getByTestId("responsive-portal-row");
    await expect(section).toBeVisible();
    await fitsWithin(section);

    const frame = section.getByTestId("responsive-portal-frame");
    const frameBox = await boxOf(frame);

    const button = page.getByRole("button", { name: "Portalled action" });
    await expect(button).toBeVisible();
    const buttonBox = await boxOf(button);

    expect(
      buttonBox.x + buttonBox.width,
      "portalled button must stay inside the 320px viewport",
    ).toBeLessThanOrEqual(NARROW);
    expect(
      buttonBox.y,
      "portalled button must render outside the clipped frame",
    ).toBeGreaterThanOrEqual(frameBox.y + frameBox.height - 1);
  });

  test("all fluid family probes fit at desktop width", async ({ browser }) => {
    const page = await openAtWidth(browser, WIDE);
    const testIds = [
      "responsive-checkbox-row",
      "responsive-switch-row",
      "responsive-avatar-row",
      "responsive-badge-row",
      "responsive-skeleton-row",
      "responsive-progress-row",
      "responsive-text-row",
      "responsive-heading-row",
      "responsive-visually-hidden-row",
      "responsive-portal-row",
    ];
    for (const testId of testIds) {
      const section = page.getByTestId(testId);
      await expect(section, `${testId} visible at 1280px`).toBeVisible();
      await fitsWithin(section);
    }
  });
});
