// Responsive behaviour of the form family: Input, Textarea, Radio and FormField
// (RRU-142).
//
// Assertions are geometric and role-based. The playground fixture uses fixed
// 200px frames and nowrap Inline rows so the E2E can prove that the components
// shrink or wrap, not overflow. No `rr-*` class names are asserted
// (`helpers.ts` rule 3).
import type { Browser, Locator, Page } from "@playwright/test";

import { expect, test } from "@playwright/test";

import { boxOf, fitsWithin, openPlayground, overflowPx } from "./helpers.js";

const NARROW = 320;
const WIDE = 1280;

/** Replaced text controls share a UA intrinsic width floor of roughly 177px
 *  content (size=20 / cols=20). The fix is proven when the rendered width is
 *  clearly below that floor. */
const INPUT_INTRINSIC_FLOOR = 175;

async function openAtWidth(browser: Browser, width: number): Promise<Page> {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await context.newPage();
  await openPlayground(page);
  return page;
}

async function distinctRows(locator: Locator): Promise<number> {
  return locator.evaluate(
    (node) =>
      new Set(
        [...node.querySelectorAll('input[type="radio"]')].map((radio) =>
          Math.round((radio as HTMLElement).getBoundingClientRect().top),
        ),
      ).size,
  );
}

test.describe("form family responsive (RRU-142)", () => {
  test("Input shrinks below its intrinsic UA width inside a narrow frame", async ({ browser }) => {
    const page = await openAtWidth(browser, NARROW);
    const section = page.getByTestId("responsive-input-row");
    await expect(section).toBeVisible();
    await fitsWithin(section);

    const frame = section.getByTestId("responsive-input-frame");
    expect(await overflowPx(frame), "frame content must not overflow").toBeLessThanOrEqual(1);

    const input = section.getByRole("textbox");
    const box = await boxOf(input);
    expect(box.width, "input must shrink below its intrinsic UA floor").toBeLessThan(
      INPUT_INTRINSIC_FLOOR,
    );
  });

  test("Textarea stays inside its narrow frame", async ({ browser }) => {
    const page = await openAtWidth(browser, NARROW);
    const section = page.getByTestId("responsive-textarea-row");
    await expect(section).toBeVisible();
    await fitsWithin(section);

    const frame = section.getByTestId("responsive-textarea-frame");
    expect(await overflowPx(frame), "frame content must not overflow").toBeLessThanOrEqual(1);

    const textarea = section.getByRole("textbox");
    const box = await boxOf(textarea);
    const frameBox = await boxOf(frame);
    expect(box.width, "textarea must not be wider than its frame").toBeLessThanOrEqual(
      frameBox.width,
    );
  });

  test("Radio horizontal group wraps onto multiple rows instead of overflowing", async ({
    browser,
  }) => {
    const page = await openAtWidth(browser, NARROW);
    const section = page.getByTestId("responsive-radio-row");
    await expect(section).toBeVisible();
    await fitsWithin(section);

    const frame = section.getByTestId("responsive-radio-frame");
    expect(await overflowPx(frame), "frame content must not overflow").toBeLessThanOrEqual(1);

    const rows = await distinctRows(frame);
    expect(rows, "five options must wrap onto more than one row").toBeGreaterThan(1);

    const frameBox = await boxOf(frame);
    const radios = frame.getByRole("radio");
    const count = await radios.count();
    for (let i = 0; i < count; i += 1) {
      const box = await boxOf(radios.nth(i));
      expect(
        box.x,
        `radio ${i} starts ${frameBox.x - box.x}px left of the frame`,
      ).toBeGreaterThanOrEqual(frameBox.x - 1);
      expect(
        box.x + box.width,
        `radio ${i} ends ${box.x + box.width - (frameBox.x + frameBox.width)}px past the frame`,
      ).toBeLessThanOrEqual(frameBox.x + frameBox.width + 1);
    }
  });

  test("FormField shrinks as a flex item in a narrow row", async ({ browser }) => {
    const page = await openAtWidth(browser, NARROW);
    const section = page.getByTestId("responsive-form-field-row");
    await expect(section).toBeVisible();
    await fitsWithin(section);

    const frame = section.getByTestId("responsive-form-field-frame");
    expect(await overflowPx(frame), "frame content must not overflow").toBeLessThanOrEqual(1);

    const input = section.getByRole("textbox");
    const box = await boxOf(input);
    expect(box.width, "field control must shrink below its intrinsic UA floor").toBeLessThan(
      INPUT_INTRINSIC_FLOOR,
    );
  });

  test("all form family probes fit at desktop width", async ({ browser }) => {
    const page = await openAtWidth(browser, WIDE);

    for (const testId of [
      "responsive-input-row",
      "responsive-textarea-row",
      "responsive-radio-row",
      "responsive-form-field-row",
    ]) {
      const section = page.getByTestId(testId);
      await expect(section).toBeVisible();
      await fitsWithin(section);
    }
  });
});
