// Playground-wide responsive contract (RRU-144).
//
// The component families of EPIC-12 already have their own narrow-width specs.
// What is still missing is proof that the *whole* playground page — the shell,
// the families and the new responsive showcase — does not overflow horizontally
// at 320px and 1280px. This spec is intentionally driven by the project's
// default viewport so the suite can assert both widths without duplicating work:
// the mobile project runs it at 320px and the desktop project runs it at 1280px.
//
// Geometry is read, not named: no `rr-*` classes are asserted (helpers.ts rule 3).
// The only classes touched are app-level `pg-*` handles for nodes that have no
// accessible identity of their own.
import type { Locator, Page } from "@playwright/test";

import { expect, test } from "@playwright/test";

import { fitsWithin, openPlayground, overflowPx } from "./helpers.js";

/** Width at which the playground reduces shell padding. Matches `--rr-breakpoint-sm`. */
const NARROW_MAX = 640;

function viewportWidth(page: Page): number {
  const size = page.viewportSize();
  expect(size, "the project must set a viewport").not.toBeNull();
  return size!.width;
}

function isNarrow(page: Page): boolean {
  return viewportWidth(page) <= NARROW_MAX;
}

/** Numeric pixel value of a computed style length (e.g. "12px" -> 12). */
async function computedPixel(locator: Locator, property: string): Promise<number> {
  const raw = await locator.evaluate(
    (node, prop) => getComputedStyle(node).getPropertyValue(prop),
    property,
  );
  return Number.parseFloat(raw);
}

/**
 * Sections that are real consumer surfaces and must not overflow horizontally.
 *
 * `Layout primitives` and `Fluid responsive` are intentionally left out: they
 * are EPIC-12 probes that demonstrate intentional overflow (a crowded icon row
 * that must stay square, and raw spans that prove `overflow-wrap` is not
 * vacuous). Their own specs cover those contracts; this one covers the families
 * a consumer would actually ship.
 */
const SURFACE_SECTIONS = [
  "Overlays",
  "Form",
  "A11y review",
  "Consumer contract",
  "Navigation",
  "Form responsive",
  "Responsive",
] as const;

test.describe("responsive shell", () => {
  test("every consumer-facing family section fits horizontally within the viewport", async ({
    page,
  }) => {
    await openPlayground(page);

    for (const name of SURFACE_SECTIONS) {
      const section = page.getByRole("region", { name, exact: true });
      await expect(section, `section "${name}" must be rendered`).toBeVisible();
      await fitsWithin(section);
    }
  });

  test("the responsive showcase frames fit their section and their content fits the frame", async ({
    page,
  }) => {
    await openPlayground(page);
    const showcase = page.locator("#responsive-section");
    await expect(showcase).toBeVisible();
    await fitsWithin(showcase);

    for (const width of [320, 375, 768]) {
      const frame = showcase.getByTestId(`responsive-frame-${width}`);
      await expect(frame).toBeVisible();
      await fitsWithin(frame);
      expect(
        await overflowPx(frame),
        `frame ${width}px content must not overflow`,
      ).toBeLessThanOrEqual(1);
    }
  });

  test("shell padding is reduced on narrow viewports", async ({ page }) => {
    await openPlayground(page);
    const shell = page.locator(".pg-shell").first();
    const paddingInline = await computedPixel(shell, "padding-inline");

    if (isNarrow(page)) {
      expect(paddingInline, "narrow shell padding must be space-4 (16px)").toBe(16);
    } else {
      expect(paddingInline, "wide shell padding must be space-6 (24px)").toBe(24);
    }
  });

  test("the form submit row fits within the form at the project width", async ({ page }) => {
    await openPlayground(page);
    const row = page.getByTestId("form-submit-row");
    await expect(row).toBeVisible();
    await fitsWithin(row);
  });
});
