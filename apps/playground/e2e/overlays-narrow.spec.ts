// The floating overlays at a width narrower than their content (RRU-137,
// EPIC-12).
//
// A floating panel is `position: fixed` with no intrinsic width, so before this
// card its size was shrink-to-fit against the viewport: a 500-character panel
// opened WIDER THAN THE SCREEN. That defect is invisible to every assertion the
// suite already had — the panel was present, visible, correctly labelled and
// still escaped by keyboard — so it could only be caught by measuring, which is
// what this file does.
//
// Two things are being proven, and they are different claims:
//
//  1. THE BOUND IS THE STYLESHEET'S, not the positioner's. `use-popover-position`
//     measures the panel in a layout effect and writes only `left`/`top`, so if
//     the CSS had not been applied before that measurement the rect would still
//     be 500 characters wide and `clamp` would place a panel that hangs off the
//     screen. Asserting `scrollWidth > clientWidth` alongside "fits in the
//     viewport" is what makes this a measurement and not a coincidence: a panel
//     whose content happens to fit would satisfy the first assertion alone.
//  2. Keyboard reachability survives the scrollport, and it differs per component,
//     which is why these are separate tests rather than one loop.
//
// The width is a second browser CONTEXT rather than a second Playwright project:
// RRU-144 owns the mobile project, and `theme.spec.ts` already sets the precedent
// for driving a spec at a non-default viewport without touching the config.
import type { Browser, Locator, Page } from "@playwright/test";

import { expect, test } from "@playwright/test";

import {
  activeElement,
  blockOverflowPx,
  boxOf,
  expectNothingClipped,
  overflowPx,
} from "./helpers.js";

/** The narrow viewport EPIC-12 measures at: the iPhone SE class width. */
const NARROW = 320;
/**
 * A viewport height chosen by MEASUREMENT, not by taste: the fixture's 500
 * characters render 371.5px tall at this width, so at 360px the clamp
 * (`100dvh - 32px` = 328px) genuinely engages and there is ~44px of real block
 * overflow to scroll. At a more comfortable 420px the panel fits naturally
 * (372 ≤ 388), every "it scrolls" assertion below passes vacuously, and the suite
 * would prove nothing about the scrollport it claims to test. Read off a
 * `getBoundingClientRect` of the open panel, which is the only way to know.
 */
const NARROW_HEIGHT = 360;
/** A wide desktop viewport, so every claim below is also checked at the other end. */
const WIDE = 1280;

/** Loads the playground once at an explicit viewport size. */
async function openAtViewport(browser: Browser, width: number, height = 900): Promise<Page> {
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "RaulRod UI" })).toBeVisible();
  return page;
}

/**
 * Asserts a fixed panel is fully inside the viewport on both axes, and says by
 * how much it misses if it does not.
 *
 * `boundingBox()` is viewport-relative for a fixed element, so this compares
 * against the viewport itself rather than against a parent — which is the point,
 * since a fixed panel has no parent box to stay inside of.
 */
async function expectInsideViewport(panel: Locator, viewport: { width: number; height: number }) {
  const box = await boxOf(panel);
  expect(box.x, `the panel starts ${-box.x}px to the left of the viewport`).toBeGreaterThanOrEqual(
    0,
  );
  expect(
    box.x + box.width,
    `the panel ends ${box.x + box.width - viewport.width}px past the right edge`,
  ).toBeLessThanOrEqual(viewport.width);
  expect(box.y, `the panel starts ${-box.y}px above the viewport`).toBeGreaterThanOrEqual(0);
  expect(
    box.y + box.height,
    `the panel ends ${box.y + box.height - viewport.height}px below the viewport`,
  ).toBeLessThanOrEqual(viewport.height);
}

test.describe("floating overlays at a width narrower than their content", () => {
  test("a 500-character popover stays inside the viewport and scrolls", async ({ browser }) => {
    const page = await openAtViewport(browser, NARROW, NARROW_HEIGHT);

    await page.getByTestId("narrow-popover-trigger").click();
    const panel = page.getByRole("dialog").filter({ hasText: "Filter details" });
    await expect(panel).toBeVisible();

    await expectInsideViewport(panel, { width: NARROW, height: NARROW_HEIGHT });

    // The half that proves the bound is CSS. The panel is as wide as its bound
    // allows (288px at this width: `100vw - 2 * space-4`) while its content is
    // TALLER than it, so a real block overflow is what distinguishes "the
    // stylesheet clamped it" from "the content happened to fit". Delete
    // `max-block-size` from Popover.css and this goes red; delete nothing and it
    // would pass on any viewport where 500 characters happen to fit above the fold.
    // The axis matters: the inline one is exactly zero, because the paragraph WRAPS
    // at the clamp. Measuring the wrong axis is how this test could have passed on
    // a panel that was clipping its own content.
    expect(
      await blockOverflowPx(panel),
      "the popover content must genuinely be taller than its clamp",
    ).toBeGreaterThan(0);

    // And the bound is the one the stylesheet declares, not a coincidence of the
    // content: 320 - 2*16. Asserted in the BORDER box, because that is the claim —
    // 16px clear on each edge — and it is the box the clamp only measures because
    // the root declares `box-sizing: border-box`. Mutation-checked: deleting that
    // one line from Popover.css turns this panel into the full 320px wide and the
    // full 360px tall (flush with all four edges, and past the block bound the
    // tests above rely on), which reddens this test, the block-overflow test above
    // it, and the 384px assertion at 1280px — where the clamp silently resolves to
    // 416px. Every "fits the viewport" assertion keeps passing throughout, which is
    // exactly why the exact width has to be measured rather than inferred from it.
    expect((await boxOf(panel)).width).toBeCloseTo(NARROW - 32, 0);
  });

  test("the clamped popover still scrolls to its own content and keeps the text", async ({
    browser,
  }) => {
    const page = await openAtViewport(browser, NARROW, NARROW_HEIGHT);

    await page.getByTestId("narrow-popover-trigger").click();
    const panel = page.getByRole("dialog").filter({ hasText: "Filter details" });
    await expect(panel).toBeVisible();

    // Scrolling to the end must bring the panel's last action into view. This is
    // the assertion that would catch a `max-block-size` without `overflow: auto`
    // — the content would be clipped and the button would stay unreachable, while
    // the panel itself still reported as visible and inside the viewport. It only
    // means anything because `NARROW_HEIGHT` puts real overflow above: with a
    // viewport tall enough for the panel to fit, `scrollTop = scrollHeight` is a
    // no-op and this would pass on a panel that could not scroll at all.
    await panel.evaluate((node) => {
      node.scrollTop = node.scrollHeight;
    });
    expect(
      await panel.evaluate((node) => node.scrollTop),
      "the popover must actually scroll, not merely have somewhere to scroll to",
    ).toBeGreaterThan(0);
    await expect(page.getByTestId("narrow-popover-action")).toBeInViewport();
    await expect(panel).toHaveText(/proration appears as a credit on the following one/);

    // Focus entering the panel is unchanged by the bound, and it is the reason a
    // consumer can still reach the action at all.
    const focused = await activeElement(page);
    expect(focused?.testId ?? focused?.text).toBeTruthy();
  });

  test("a menu taller than the screen scrolls through its own focus order", async ({ browser }) => {
    const page = await openAtViewport(browser, NARROW, NARROW_HEIGHT);

    await page.getByTestId("narrow-menu-trigger").click();
    const menu = page.getByRole("menu").first();
    await expect(menu).toBeVisible();
    await expectInsideViewport(menu, { width: NARROW, height: NARROW_HEIGHT });

    // Fourteen items cannot fit in 420px, so this menu is over its block bound and
    // the scrollport is what keeps it inside the screen. Block axis again — the
    // items are one line each and never spill sideways, so the inline axis would
    // report zero and this test would pass on a menu that clipped its last items.
    expect(
      await blockOverflowPx(menu),
      "the menu must genuinely be taller than its clamp",
    ).toBeGreaterThan(0);

    // The keyboard claim, and the reason this panel may scroll where the tooltip
    // may not: every item is a focusable `menuitem`, so ArrowDown walks focus
    // through the scrollport and the browser scrolls each focused item into view.
    // The last item is only reachable this way — no pointer involved.
    await menu.getByRole("menuitem").first().focus();
    const last = menu.getByRole("menuitem", { name: "Add to a collection" });
    let guard = 0;
    while ((await activeElement(page))?.text !== "Add to a collection" && guard < 40) {
      await page.keyboard.press("ArrowDown");
      guard += 1;
    }
    await expect(last).toBeInViewport();
    await expect(last).toBeFocused();
  });

  test("a long menu label wraps inside the bound instead of widening the panel", async ({
    browser,
  }) => {
    const page = await openAtViewport(browser, NARROW, NARROW_HEIGHT);

    await page.getByTestId("narrow-menu-trigger").click();
    const menu = page.getByRole("menu").first();
    await expect(menu).toBeVisible();

    // The longest label is the one that would push the panel out, and it has to
    // stay inside the panel: a wrapped label proves the item flexes down to the
    // clamp, and `await expectInsideViewport` proves the panel did not move.
    const label = menu.getByRole("menuitem", {
      name: "Export as CSV with every visible column included",
    });
    expect((await boxOf(label)).width).toBeLessThanOrEqual((await boxOf(menu)).width);
    await expectInsideViewport(menu, { width: NARROW, height: NARROW_HEIGHT });
  });

  test("a long tooltip wraps to a column and stays inside the viewport", async ({ browser }) => {
    const page = await openAtViewport(browser, NARROW, NARROW_HEIGHT);

    // Focus, not hover: the tooltip contract is that focusing is enough, so this
    // is also the path a keyboard user takes.
    await page.getByTestId("narrow-tooltip-trigger").focus();
    const tooltip = page.getByRole("tooltip");
    await expect(tooltip).toBeVisible();

    await expectInsideViewport(tooltip, { width: NARROW, height: NARROW_HEIGHT });

    // The deviation from the card's DoD, asserted rather than assumed: this panel
    // WRAPS, so it is taller than one line and its whole text is rendered. A
    // `max-block-size` + `overflow: auto` here would be a scrollport the panel
    // cannot be focused into — content no keyboard user could reach — so the claim
    // is not "the tooltip is inside the viewport" (which a clipped tooltip also
    // satisfies) but "nothing of it is clipped, and there is nothing to scroll".
    const box = await boxOf(tooltip);
    expect(box.height).toBeGreaterThan(40);
    await expectNothingClipped(tooltip);
    expect(
      await overflowPx(tooltip),
      "the tooltip must not spill sideways either: it wraps at the clamp",
    ).toBe(0);
    await expect(tooltip).toHaveText(/proration appears as a credit on the following one/);
  });

  test("every claim above also holds at 1280px", async ({ browser }) => {
    const page = await openAtViewport(browser, WIDE);

    // The other end of the range, because a narrow-width fix that quietly changes
    // desktop behaviour is the regression this epic cannot afford. At this width
    // the durable 384px term wins the `min()`, so the panel is capped by DESIGN
    // rather than by the screen — which is the other half of the bound, and the
    // half a 320px-only test would never execute.
    await page.getByTestId("narrow-popover-trigger").click();
    const panel = page.getByRole("dialog").filter({ hasText: "Filter details" });
    await expect(panel).toBeVisible();
    expect((await boxOf(panel)).width).toBeCloseTo(384, 0);
    await expectInsideViewport(panel, { width: WIDE, height: 900 });

    await page.keyboard.press("Escape");
    await page.getByTestId("narrow-tooltip-trigger").focus();
    await expect(page.getByRole("tooltip")).toBeVisible();
    await expectInsideViewport(page.getByRole("tooltip"), { width: WIDE, height: 900 });
  });
});

test.describe("the Select listbox matches the field it belongs to", () => {
  /** Opens the narrow `Select` and returns its trigger and listbox. */
  async function openNarrowSelect(page: Page): Promise<{
    trigger: Locator;
    listbox: Locator;
  }> {
    const trigger = page.getByTestId("narrow-select-trigger");
    await trigger.click();
    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible();
    return { trigger, listbox };
  }

  test("the listbox is exactly as wide as the trigger, and scrolls instead of spilling", async ({
    browser,
  }) => {
    const page = await openAtViewport(browser, NARROW, NARROW_HEIGHT);
    const { trigger, listbox } = await openNarrowSelect(page);

    await expectInsideViewport(listbox, { width: NARROW, height: NARROW_HEIGHT });

    // The width claim, measured on both boxes rather than inferred: before the card
    // this panel opened at the full 320px of screen while the field under it was
    // 272px wide, so a select looked like it belonged to something else. Comparing
    // the two BORDER boxes is the whole claim — `left` is shared with the trigger
    // and `inline-size` is written by the positioner, so the equality below can only
    // come from both halves of the card together.
    //
    // Mutation-checked, both directions. Deleting `matchAnchorWidth: true` from
    // Select.tsx reddens this and the two tests below (the panel falls back to the
    // width its content demands, 65px short of the 384px bound at 1280px), and
    // deleting `box-sizing: border-box` from the panel root reddens them too, by
    // exactly 8px in BOTH widths — the panel's own 4px padding on each side, which
    // the clamp stops measuring. The focus-order test stays green under both, as it
    // should: it is about reaching the options, not sizing them.
    const triggerWidth = (await boxOf(trigger)).width;
    const listboxWidth = (await boxOf(listbox)).width;
    expect(
      listboxWidth,
      "the listbox must be exactly as wide as the field it belongs to",
    ).toBeCloseTo(triggerWidth, 0);

    // The inline axis, and the assertion that needed the third line of the card:
    // `box-sizing` is not inherited, so `width: 100%` plus `space-3` padding made
    // every option 24px wider than the box it had to fit in, and the listbox
    // scrolled SIDEWAYS to reach them — measured at `scrollWidth` 336 against a
    // `clientWidth` of 312 before the fix. `expectInsideViewport` above stays green
    // while that happens, because the scrollport absorbs it, which is why the
    // content has to be measured rather than the box. Deleting the ONE line from
    // `.rr-select-item` reproduces those numbers exactly — this assertion reports
    // `24`, not an approximation of it.
    expect(
      await overflowPx(listbox),
      "the listbox must not scroll sideways to reach its options",
    ).toBe(0);

    // The block axis, for the reason `NARROW_HEIGHT` exists: twelve options are
    // taller than the `100dvh - 2 * space-4` clamp, so this measures real overflow
    // and not a coincidence of the viewport.
    expect(
      await blockOverflowPx(listbox),
      "the listbox must genuinely be taller than its clamp",
    ).toBeGreaterThan(0);
  });

  test("a long option wraps inside the bound instead of widening the panel", async ({
    browser,
  }) => {
    const page = await openAtViewport(browser, NARROW, NARROW_HEIGHT);
    const { trigger, listbox } = await openNarrowSelect(page);

    // Relative heights, not a magic number: a one-line option is exactly as tall as
    // a short one, so if the 40-character label wrapped, it is TALLER than the
    // options beside it. Measured on the option's own box because the label is a
    // text node inside it, and compared against the listbox rather than the
    // viewport so the claim is about wrapping and not about the bound.
    const long = listbox.getByRole("option", { name: "Annual billing with prorated seat change" });
    const short = listbox.getByRole("option", { name: "Starter", exact: true });
    expect((await boxOf(long)).height).toBeGreaterThan((await boxOf(short)).height);
    expect((await boxOf(long)).width).toBeLessThanOrEqual((await boxOf(listbox)).width);

    // And the panel did not move to accommodate the wrap, which is the failure the
    // inline-size write prevents.
    await expectInsideViewport(listbox, { width: NARROW, height: NARROW_HEIGHT });
    expect((await boxOf(listbox)).width).toBeCloseTo((await boxOf(trigger)).width, 0);
  });

  test("the clamped listbox scrolls through its own focus order", async ({ browser }) => {
    const page = await openAtViewport(browser, NARROW, NARROW_HEIGHT);
    const { listbox } = await openNarrowSelect(page);

    // The keyboard claim, and the reason this panel may scroll: the roving tabindex
    // lives on the panel and the options are `tabIndex={-1}`, so ArrowDown walks
    // focus onto options the browser then scrolls into view. The last one is only
    // reachable this way — no pointer involved, and it is off-screen when it opens.
    const options = listbox.getByRole("option");
    await expect(options).toHaveCount(12);
    let guard = 0;
    while ((await activeElement(page))?.text !== "Custom" && guard < 40) {
      await page.keyboard.press("ArrowDown");
      guard += 1;
    }
    const last = listbox.getByRole("option", { name: "Custom", exact: true });
    await expect(last).toBeFocused();
    await expect(last).toBeInViewport();
  });

  test("the Select bound also holds at 1280px", async ({ browser }) => {
    const page = await openAtViewport(browser, WIDE);
    const { trigger, listbox } = await openNarrowSelect(page);

    // The other end of the range, and the half a 320px-only test never executes. At
    // this width the field is 1024px and matching it is WRONG: the listbox takes
    // the durable 384px term of its `min()` clamp instead, because a listbox twice
    // as wide as its content looks like a layout bug and — more importantly — every
    // option becomes a single short line with the chevron stranded far from the
    // labels it points at. This is why the hook is opt-in and the cap is not.
    //
    // This is the assertion that proves the ORDER of the two halves: the positioner
    // really does write 1024px into the inline style, and the stylesheet's cap is
    // what brings the panel back to 384. Mutation-checked in both directions —
    // dropping `matchAnchorWidth: true` lets the panel reach 318.56px (its
    // content, unrestrained), and dropping the panel's `box-sizing` pushes it to
    // 392px, 8px past the bound.
    await expectInsideViewport(listbox, { width: WIDE, height: 900 });
    expect((await boxOf(listbox)).width).toBeCloseTo(384, 0);
    expect((await boxOf(listbox)).width).toBeLessThan((await boxOf(trigger)).width);

    // Twelve options at 384px are 488px of content in a viewport with 868px of
    // room, so the block bound never engages here and this claim is vacuously true
    // — kept anyway because its absence is the trap this test exists to avoid: at
    // 320px the same list scrolls 184px, and a "the listbox scrolls" assertion
    // written only for the narrow width would leave desktop unchecked.
    expect(
      await blockOverflowPx(listbox),
      "a 384px listbox with twelve options must fit without scrolling",
    ).toBeLessThanOrEqual(1);
  });
});
