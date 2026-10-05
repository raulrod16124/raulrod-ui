// The two panels whose coordinate space IS the viewport (RRU-139, EPIC-12).
//
// `overlays-narrow.spec.ts` proved that the floating panels — popover, tooltip,
// menu, listbox — are bounded by their stylesheet. Dialog and Toast are the
// documented exception of ADR-008: they are `position: fixed` over the whole
// screen, so `@media` is reserved for exactly them and no container query can
// reach inside. That exception is also why their geometry was the last thing
// EPIC 12 had to fix, and it is why the defects below are not "responsive
// polish": each one puts content physically outside the screen, with no
// scrollport to reach it through, and every assertion the suite already had
// still passed.
//
// Both defects were MEASURED before the fix, at 320×360, because the numbers
// are the reason the fixes have the shape they do:
//
//  - DIALOG. The overlay reserves `space-6` on every side, so the height a panel
//    may occupy is the viewport minus exactly that padding: `100dvh - 2 × 24` =
//    312px. The cap said `calc(100vh - var(--rr-space-8))` — a different padding
//    token, 32px against 24px — so the two numbers never agreed. Measured before
//    the fix: a panel whose content exceeded the cap rendered **376px tall inside
//    a 312px content box**. It did not shrink, because the overlay centres its
//    content with `justify-content: center`, and an item taller than the line
//    overflows EQUALLY on both sides: 32px of rounded corner above, 32px below,
//    plus the title. Measured after: exactly 312px, inset 24px from both edges.
//    `box-sizing: border-box` is load-bearing in that sentence — without it the
//    cap measures the CONTENT box, the padding lands outside it, and the border
//    box is `100dvh` tall: flush with the screen edges, which is the whole thing
//    the overlay's padding exists to prevent. Same reason RRU-137 put it on the
//    floating panels and RRU-138 on `.rr-select-item`.
//
//  - DIALOG FOOTER. The card's DoD says long-labelled actions "se salen" at 320px.
//    Measured, they do not: with `flex-wrap: nowrap` the three buttons *shrank*,
//    because RRU-136 gave `Button` `min-width: 0` and `overflow-wrap: anywhere`.
//    The measured result is worse-looking and a different bug — three buttons
//    crushed to ~65px wide and 96–114px tall each, with their labels wrapped over
//    three and four lines, on a single row that is as tall as a paragraph. So the
//    assertion below is measured on ROWS, not on overflow: `overflowPx` was
//    **exactly zero** before the fix, and a test written against the card's wording
//    would have passed on the defect. With `flex-wrap: wrap` the same three
//    buttons lay out at 161–193px wide, one line each, on three rows.
//
//  - TOAST. Nothing bounded the STACK in the block axis; only its width was. One
//    long toast measured **422px tall in a 360px viewport** with `overflow-y:
//    visible`, so 78px of the description sat below the fold and there was no
//    scrollport to scroll — the content was not clipped in the sense of losing a
//    few pixels, it was unreachable.
//
// What this file does NOT claim about the Toast: that its old `100vw` was
// measurable. It is a real defect — `100vw` includes the scrollbar while
// `inset-inline-end` is measured against the viewport that does not, so below
// 416px the stack was sized against a box ~15px wider than the one it is
// positioned in — but headless Chromium reports `innerWidth === clientWidth`, so
// no scrollbar is reserved there and the wrong width happens to equal the right
// one. That defect is therefore pinned by `css-contracts.test.ts`, which reads
// the stylesheet, and the geometry here is pinned by measurement. Two kinds of
// evidence for two kinds of claim, neither standing in for the other.
//
// The width is a second browser CONTEXT rather than a second Playwright project:
// RRU-144 owns the mobile project, and `overlays-narrow.spec.ts` sets the
// precedent for driving a spec at a non-default viewport without touching the
// config.
import type { Browser, Locator, Page } from "@playwright/test";

import { expect, test } from "@playwright/test";

import {
  activeElement,
  animationsSettled,
  blockOverflowPx,
  boxOf,
  expectNothingClipped,
  overflowPx,
} from "./helpers.js";

/** The narrow viewport EPIC-12 measures at: the iPhone SE class width. */
const NARROW = 320;
/**
 * A viewport height chosen by MEASUREMENT, not by taste — the same argument
 * RRU-137 makes, and the same number.
 *
 * `320 × 900` would be comfortable and would prove nothing: the tall Dialog
 * fixture renders 2469px of content and the long Toast 430px, but at 900px tall
 * the Dialog's cap (`100dvh - 48px` = 852px) and the Toast's (`100dvh - 32px` =
 * 868px) both sit ABOVE their content for the Toast and below it for the Dialog,
 * so every "it fits" assertion passes vacuously and "it scrolls" would report
 * `0`. At 360px both caps genuinely engage and there is real overflow to scroll.
 * Read off a `getBoundingClientRect` of the open panels, which is the only way to
 * know.
 */
const NARROW_HEIGHT = 360;
/** A wide desktop viewport, so every claim below is also checked at the other end. */
const WIDE = 1280;
/** The `space-6` the Dialog overlay reserves on every side: 24px. */
const DIALOG_GUTTER = 24;
/** The `space-4` the Toast stack is inset by: 16px. */
const TOAST_GUTTER = 16;
/** The durable Toast card width: 6 × `space-16`. */
const TOAST_CARD = 384;

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

/** The Dialog fixture, located the way a user finds it. */
function narrowDialog(page: Page): Locator {
  return page.getByRole("dialog").filter({ hasText: "Review the billing change" });
}

/**
 * Opens the Dialog fixture and waits for its entry animation to finish.
 *
 * Not a convenience: `getBoundingClientRect()` reports the TRANSFORMED box, so
 * every geometry assertion below would otherwise measure `0.98 ×` the layout and
 * fail by 6px on the width and 5px on the height. `animationsSettled` is why the
 * numbers in this file are the ones the stylesheet writes.
 */
async function openNarrowDialog(page: Page): Promise<Locator> {
  await page.getByTestId("narrow-dialog-trigger").click();
  const panel = narrowDialog(page);
  await expect(panel).toBeVisible();
  await animationsSettled(panel);
  return panel;
}

/** The Toast stack: the live region, not an individual toast inside it. */
function toastStack(page: Page): Locator {
  return page.getByRole("region", { name: "Notifications" });
}

/**
 * The toast that renders at the BOTTOM of the stack, found by its own text.
 *
 * By name rather than by `.nth(1)`: the stack orders newest-first, so the toast
 * raised first is the one furthest down, and that index is a fact about the
 * render order that a future change could quietly reverse. This toast is the
 * subject of the scrollport tests because it is the only one whose dismiss button
 * opens below the fold.
 */
function oldestToast(page: Page): Locator {
  return toastStack(page)
    .getByRole("alert")
    .filter({ hasText: "Card details still need a review" });
}

test.describe("the Dialog measured against the viewport", () => {
  test("a dialog taller than the screen keeps its chrome inside it and scrolls", async ({
    browser,
  }) => {
    const page = await openAtViewport(browser, NARROW, NARROW_HEIGHT);
    const panel = await openNarrowDialog(page);

    // The half that was false before the card. `expectInsideViewport` alone
    // passed on the defect, because the overflowing half was BELOW the fold: an
    // element positioned off the bottom of the screen still reports a box, and
    // `toBeVisible` only asks whether it has a non-empty box.
    await expectInsideViewport(panel, { width: NARROW, height: NARROW_HEIGHT });

    // The exact height is the whole claim, because "inside the viewport" and
    // "flush with the screen edges" are both true at 360px and only one of them
    // is the contract. The overlay reserves `space-6` per side; the panel must
    // fill that content box and no more. Mutation-checked both directions:
    // dropping `box-sizing: border-box` from the panel root reports 360 here — a
    // panel flush with both edges, the pre-fix 376px defect in its purest form —
    // and changing `space-6` in the OVERLAY's padding to any other token reddens
    // this while every "fits the viewport" assertion above stays green. That gap
    // is the reason the number is measured instead of inferred.
    expect((await boxOf(panel)).height).toBeCloseTo(NARROW_HEIGHT - 2 * DIALOG_GUTTER, 0);

    // And the panel genuinely exceeds that clamp, so the bound is the stylesheet's
    // and not a coincidence of the fixture: 6 × ~370px of prose in a 312px box.
    // Without this, a viewport tall enough for the content to fit would make the
    // scrollport assertions below pass on a panel that never scrolled.
    expect(
      await blockOverflowPx(panel),
      "the dialog content must genuinely be taller than its clamp",
    ).toBeGreaterThan(0);
  });

  test("the clamped dialog scrolls to its last action and keeps the text", async ({ browser }) => {
    const page = await openAtViewport(browser, NARROW, NARROW_HEIGHT);
    const panel = await openNarrowDialog(page);

    // The tail of the content is only reachable through the scrollport. This is
    // the assertion that catches `max-block-size` WITHOUT `overflow: auto`: the
    // last footer button would sit clipped below the panel's own border and stay
    // unreachable while the panel still reported itself visible and inside the
    // viewport. It only means anything because the test above proved there is
    // overflow to scroll.
    await panel.evaluate((node) => {
      node.scrollTop = node.scrollHeight;
    });
    expect(
      await panel.evaluate((node) => node.scrollTop),
      "the dialog must actually scroll, not merely have somewhere to scroll to",
    ).toBeGreaterThan(0);
    await expect(page.getByTestId("narrow-dialog-confirm")).toBeInViewport();
    await expect(panel).toHaveText(/proration appears as a credit on the following one/);
  });

  test("three long-labelled footer actions wrap onto rows instead of being crushed", async ({
    browser,
  }) => {
    const page = await openAtViewport(browser, NARROW, NARROW_HEIGHT);
    const panel = await openNarrowDialog(page);

    const footer = page.getByTestId("narrow-dialog-cancel").locator("..");
    const buttons = [
      page.getByTestId("narrow-dialog-cancel"),
      page.getByTestId("narrow-dialog-schedule"),
      page.getByTestId("narrow-dialog-confirm"),
    ];

    // The claim is ROWS, and this is the test that had to be written against the
    // measurement rather than against the card. The DoD predicts the buttons
    // overflow the 320px screen; measured, `overflowPx` was exactly 0 before the
    // fix — `flex-wrap: nowrap` plus RRU-136's `min-width: 0` made them shrink
    // instead, to ~65px wide and 96–114px tall, labels wrapped over three and
    // four lines. An assertion about overflow would have passed on that.
    //
    // So: how many distinct rows the buttons' top edges land on. Mutation-checked
    // — deleting the single `flex-wrap: wrap` line collapses all three onto one
    // row and this reports 1.
    const rows = await footer.evaluate(
      (node) =>
        new Set(
          [...node.querySelectorAll("button")].map((button) =>
            Math.round((button as HTMLElement).getBoundingClientRect().top),
          ),
        ).size,
    );
    expect(rows, "the three actions must not share a single row at this width").toBeGreaterThan(1);

    // Which is only a real improvement if the buttons stopped shrinking. Each one
    // now keeps its natural width, so its label fits on ONE line: measured 34px
    // tall against 96–114px before. Compared against the footer's own height
    // rather than a magic number — a button on the last row is exactly one line
    // tall, and the footer is taller than that because it holds more than one row.
    const buttonBoxes = await Promise.all(buttons.map((button) => boxOf(button)));
    const footerBox = await boxOf(footer);
    for (const [index, box] of buttonBoxes.entries()) {
      expect(box.height, `button ${index} wraps its label onto more than one line`).toBeLessThan(
        footerBox.height,
      );
    }

    // And every button is inside the footer that lays them out — the axis the
    // DoD named, now that wrapping makes it the one that could plausibly fail.
    // One pixel of slack: sub-pixel layout rounding is not a defect, and a
    // flex line that lands 0.4px past the content edge is the same finding
    // `fitsWithin` already reports as acceptable.
    const footerRight = footerBox.x + footerBox.width;
    for (const [index, button] of buttons.entries()) {
      const box = await boxOf(button);
      expect(
        box.x + box.width,
        `button ${index} ends ${box.x + box.width - footerRight}px past the footer's right edge`,
      ).toBeLessThanOrEqual(footerRight + 1);
      expect(
        box.x,
        `button ${index} starts ${footerBox.x - box.x}px left of the footer`,
      ).toBeGreaterThanOrEqual(footerBox.x - 1);
    }
    expect(
      await overflowPx(footer),
      "the footer must not scroll sideways to reach its actions",
    ).toBe(0);

    // A wrapped footer must not have pushed the panel's own bound out: the two
    // fixes are independent lines and this is what holds them together.
    await expectInsideViewport(panel, { width: NARROW, height: NARROW_HEIGHT });
  });

  test("the Dialog bound also holds at 1280px", async ({ browser }) => {
    const page = await openAtViewport(browser, WIDE);

    // The other end of the range, because a narrow-viewport fix that quietly
    // changes desktop behaviour is the regression this epic cannot afford. Here
    // the durable `28rem` cap wins rather than the viewport term, and the fixture
    // is still taller than the cap — so this exercises the `dvh` half on a
    // viewport where there is room to be wrong about it.
    await page.getByTestId("narrow-dialog-trigger").click();
    const panel = narrowDialog(page);
    await expect(panel).toBeVisible();
    await animationsSettled(panel);

    await expectInsideViewport(panel, { width: WIDE, height: 900 });
    expect((await boxOf(panel)).width).toBeCloseTo(448, 0);
    expect((await boxOf(panel)).height).toBeCloseTo(900 - 2 * DIALOG_GUTTER, 0);

    // The block bound is still the stylesheet's here, and this is the assertion
    // that says so without guessing: the panel is clamped at exactly 852px while
    // its own content measures 1483px (six paragraphs of prose at 400px of text
    // width). An earlier draft of this test asserted the panel "fits without
    // scrolling" at desktop — it never did, and the assertion was wrong rather
    // than the bound. Measuring the overflow is the honest version, and it still
    // separates "clamped by CSS" from "the fixture happened to fit": at 900px the
    // 852px cap is 631px short of the content, so it demonstrably engaged.
    expect(
      await blockOverflowPx(panel),
      "the 852px cap must engage on this fixture even at desktop width",
    ).toBeGreaterThan(0);

    // The axis this fixture never overflows on, which the wrapping footer depends
    // on: at the `28rem` cap the three actions fit on one row, so nothing spills
    // sideways and the panel does not have to scroll in the inline direction.
    expect(await overflowPx(panel), "the dialog must not scroll sideways at desktop width").toBe(0);
  });
});

test.describe("the Toast stack measured against the viewport", () => {
  /** Raises the pair of long toasts from the fixture and waits for them to land. */
  async function raiseToasts(page: Page): Promise<Locator> {
    await page.getByTestId("narrow-toast-trigger").click();
    const stack = toastStack(page);
    await expect(stack.getByRole("status")).toBeVisible();
    await expect(stack.getByRole("alert")).toBeVisible();
    // Each card slides in, and `subtree: true` is what covers that: the box being
    // bounded here is the stack, and the animations are on its children.
    await animationsSettled(stack);
    return stack;
  }

  test("a stack of long toasts stays inside the viewport and scrolls", async ({ browser }) => {
    const page = await openAtViewport(browser, NARROW, NARROW_HEIGHT);
    const stack = await raiseToasts(page);

    await expectInsideViewport(stack, { width: NARROW, height: NARROW_HEIGHT });

    // The exact height, and the reason it is `space-4` and not `space-6`: the
    // stack is inset by `space-4` and must keep the same gutter at the bottom, so
    // the bound is `100dvh - 2 × 16` = 328px. Measured before the fix: 422px in a
    // 360px viewport, i.e. 78px below the fold. The value is measured rather than
    // inferred from `expectInsideViewport` because before the fix the stack did
    // NOT overflow the viewport in the direction that helper checks — it was the
    // BOTTOM edge that missed, and only by asserting the number do we know the
    // cap engaged at all.
    expect((await boxOf(stack)).height).toBeCloseTo(NARROW_HEIGHT - 2 * TOAST_GUTTER, 0);

    // And the stack really is over its bound, so the scrollport below is doing
    // work: two 422px cards in a 328px column.
    expect(
      await blockOverflowPx(stack),
      "the toast stack must genuinely be taller than its bound",
    ).toBeGreaterThan(0);

    // Scrolling to the end brings the tail of the OLDER toast's description into
    // view — content that was below the fold on every axis at open, and the
    // reason the fixture raises two long cards rather than one. This is the
    // assertion that catches a `max-block-size` without `overflow-y: auto`: the
    // tail would be clipped and unreachable while the stack still reported itself
    // visible and inside the viewport.
    //
    // The TAIL, deliberately, and not the toast's dismiss button. Scrolling to the
    // very bottom of a 852px column in a 328px scrollport pushes the older card's
    // own dismiss button 69px ABOVE the viewport — a taller card than the
    // scrollport, so its header ends up off-screen at maximum scroll. That is not
    // a defect (the button is reachable at any intermediate scroll, which is what
    // the focus test below does), but it does mean "scroll to the bottom, expect
    // the header" asserts the wrong thing.
    await stack.evaluate((node) => {
      node.scrollTop = node.scrollHeight;
    });
    expect(
      await stack.evaluate((node) => node.scrollTop),
      "the stack must actually scroll, not merely have somewhere to scroll to",
    ).toBeGreaterThan(0);
    await expect(
      oldestToast(page).getByText(/seats added after the invoice was issued are billed pro rata/),
    ).toBeInViewport();
  });

  test("the scrollport is reachable by focus, with no pointer involved", async ({ browser }) => {
    const page = await openAtViewport(browser, NARROW, NARROW_HEIGHT);
    const stack = await raiseToasts(page);

    // The keyboard claim, and the one that would catch a cap without a scrollport
    // in its most convincing form: a toast whose tail is cut off still passes every
    // geometry assertion in the test above. Every toast carries a focusable
    // dismiss button, so tabbing moves focus through the stack and the browser
    // scrolls each focused control into view inside its scrollable ancestor — the
    // same argument RRU-137 makes for the DropdownMenu scrollport, which is why
    // this bound is allowed to scroll where the tooltip's is not.
    const dismiss = oldestToast(page).getByRole("button", { name: "Dismiss" });

    // Off-screen when it opens. Asserted first so the test cannot pass by
    // accident on a viewport where it was never below the fold — and so a change
    // that made the whole stack fit would fail here instead of quietly turning the
    // reachability claim into a geometry one.
    await expect(dismiss).not.toBeInViewport();

    await dismiss.focus();
    await expect(dismiss).toBeFocused();
    await expect(dismiss).toBeInViewport();

    // Focus reached it rather than the browser merely scrolling: the control that
    // holds focus is the one that is now on screen, which is what makes this a
    // reachability claim and not a geometry one.
    expect((await activeElement(page))?.tag).toBe("button");
    await expect(oldestToast(page)).toHaveText(
      /proration appears as a credit on the following one/,
    );
  });

  test("the stack is still a right-aligned 384px card at 1280px", async ({ browser }) => {
    const page = await openAtViewport(browser, WIDE);
    const stack = await raiseToasts(page);

    await expectInsideViewport(stack, { width: WIDE, height: 900 });

    // The durable term, and the other half of the bound: at this width the stack
    // is capped by DESIGN at 6 × `space-16` = 384px, not by the screen. A
    // 320px-only test never executes it.
    const box = await boxOf(stack);
    expect(box.width).toBeCloseTo(TOAST_CARD, 0);

    // Still hugging the END edge, which is the contract the old `width` +
    // `inset-inline-end` pair used to express and which replacing `width` with
    // two `inset`s could have quietly lost: with both insets set and `width: auto`
    // the box fills the space, and in LTR the free space would otherwise go to
    // the left. Mutation-checked — dropping the single `margin-inline-start: auto`
    // line moves this box to x = 16.
    expect(box.x + box.width, "the card must keep its 16px gutter from the right edge").toBeCloseTo(
      WIDE - TOAST_GUTTER,
      0,
    );

    // Two toasts of ~430px and ~120px do not fit an 868px column, so the block
    // bound stays disengaged at desktop — kept explicitly, because "the stack
    // scrolls" written only for the narrow width would leave this unchecked.
    expect(
      await blockOverflowPx(stack),
      "two toasts must fit a 900px-tall viewport without scrolling",
    ).toBeLessThanOrEqual(1);
    await expectNothingClipped(stack);
  });
});
