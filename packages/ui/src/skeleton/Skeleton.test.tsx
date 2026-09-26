// Behavioral spec for Skeleton (RRU-062, tracked in RRU-068).
// A skeleton is a decorative placeholder, so the spec asserts both halves of
// that decision: it carries no semantics of its own (no role, no ARIA, not
// focusable) and its shimmer is built from motion tokens that a
// `prefers-reduced-motion` block neutralizes through the documented token.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Skeleton } from "../index.js";
import { expectTokenLineage, readComponentCss, stripCssComments } from "../test-support/css.js";

describe("Skeleton rendered markup", () => {
  it("defaults to the rectangle variant", () => {
    expect(renderToStaticMarkup(<Skeleton />)).toBe(
      '<span class="rr-skeleton rr-skeleton--rectangle"></span>',
    );
  });

  it('emits the circle modifier for variant="circle"', () => {
    expect(renderToStaticMarkup(<Skeleton variant="circle" />)).toBe(
      '<span class="rr-skeleton rr-skeleton--circle"></span>',
    );
  });

  it("merges className, preserves pass-through attributes and children", () => {
    expect(
      renderToStaticMarkup(<Skeleton className="probe" title="t" data-x="1" id="s" aria-hidden />),
    ).toBe(
      '<span title="t" data-x="1" id="s" aria-hidden="true" class="rr-skeleton rr-skeleton--rectangle probe"></span>',
    );
    expect(renderToStaticMarkup(<Skeleton>{"…"}</Skeleton>)).toBe(
      '<span class="rr-skeleton rr-skeleton--rectangle">…</span>',
    );
  });

  it("carries no semantics of its own", () => {
    const markup = renderToStaticMarkup(<Skeleton />);

    expect(markup).not.toMatch(/role=/);
    expect(markup).not.toMatch(/aria-/);
    expect(markup).not.toMatch(/tabindex/);
    expect(markup).not.toMatch(/disabled|onclick|onkeydown/i);
  });

  it("stays a forwardRef with a displayName for dev tooling", () => {
    expect(Skeleton.$$typeof).toBe(Symbol.for("react.forward_ref"));
    expect(Skeleton.displayName).toBe("Skeleton");
  });
});

describe("Skeleton authored CSS contract", () => {
  it("builds the base block from tokens only", async () => {
    const base =
      /\.rr-skeleton\s*\{([^}]*)\}/.exec(await readComponentCss("skeleton/Skeleton.css"))?.[1] ??
      "";

    expect(base).toMatch(/display:\s*block/);
    expect(base).toMatch(/position:\s*relative/);
    expect(base).toMatch(/overflow:\s*hidden/);
    expect(base).toMatch(/width:\s*100%/);
    expect(base).toMatch(/height:\s*var\(--rr-space-4\)/);
    expect(base).toMatch(/background-color:\s*var\(--rr-color-background-sunken\)/);
    expect(base).toMatch(/border-radius:\s*var\(--rr-radius-sm\)/);
  });

  it("sweeps the shimmer band with the motion tokens, off-screen at both ends", async () => {
    const css = await readComponentCss("skeleton/Skeleton.css");
    const shimmer = /\.rr-skeleton::after\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";

    expect(shimmer).toMatch(/content:\s*""/);
    expect(shimmer).toMatch(/inset:\s*0/);
    expect(shimmer).toMatch(/linear-gradient\(/);
    expect(shimmer).toMatch(/var\(--rr-color-background-default\)/);
    expect(shimmer).toMatch(/translateX\(-100%\)/);
    expect(shimmer).toMatch(
      /animation:\s*rr-skeleton-shimmer\s+var\(--rr-motion-duration-slow\)\s+var\(--rr-motion-easing-standard\)\s+infinite/,
    );
    expect(css).toMatch(/to\s*\{\s*transform:\s*translateX\(100%\);\s*\}/);
  });

  it("kills the animation under prefers-reduced-motion with the reduced token", async () => {
    const css = await readComponentCss("skeleton/Skeleton.css");
    const reduceBlock =
      /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";

    expect(reduceBlock).toMatch(
      /\.rr-skeleton::after\s*\{\s*animation-name:\s*var\(--rr-motion-behavior-reduced\);/,
    );
  });

  it("squares the circle variant on the space scale", async () => {
    const circle =
      /\.rr-skeleton--circle\s*\{([^}]*)\}/.exec(
        await readComponentCss("skeleton/Skeleton.css"),
      )?.[1] ?? "";

    expect(circle).toMatch(/width:\s*var\(--rr-space-8\)/);
    expect(circle).toMatch(/height:\s*var\(--rr-space-8\)/);
    expect(circle).toMatch(/border-radius:\s*var\(--rr-radius-full\)/);
  });

  it("holds the token-only, no-interaction rule", async () => {
    const css = stripCssComments(await readComponentCss("skeleton/Skeleton.css"));

    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/\d+px\b/);
    expect(css, "the placeholder animates, it does not transition").not.toMatch(/transition/);
    expect(css).not.toMatch(/:(hover|focus|active|disabled)\s*\{/);
  });

  it("only consumes tokens that @raulrod/tokens defines", async () => {
    await expectTokenLineage(await readComponentCss("skeleton/Skeleton.css"));
  });
});
