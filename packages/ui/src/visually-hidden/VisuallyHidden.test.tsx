// Behavioral spec for VisuallyHidden (RRU-033, tracked in RRU-068).
// The a11y contract is the substance of the card, and it lives in CSS:
// the base rule must keep the content in the accessibility tree (never
// `display: none` / `visibility: hidden`), and the `--focusable` variant must
// reveal itself on :focus/:active/:focus-within so skip links work (WCAG G1).
// Zero design tokens: this is a11y geometry, not theming.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { readComponentCss, tokenVarsUsed } from "../test-support/css.js";

import { VisuallyHidden } from "./index.js";

describe("VisuallyHidden rendered markup", () => {
  it("renders a span with the base class and preserves children", () => {
    expect(renderToStaticMarkup(<VisuallyHidden>Loading</VisuallyHidden>)).toBe(
      '<span class="rr-visually-hidden">Loading</span>',
    );
    expect(renderToStaticMarkup(<VisuallyHidden>A{"B"}</VisuallyHidden>)).toBe(
      '<span class="rr-visually-hidden">AB</span>',
    );
  });

  it("adds the focusable modifier only when focusable is true", () => {
    expect(renderToStaticMarkup(<VisuallyHidden focusable>Skip to main</VisuallyHidden>)).toBe(
      '<span class="rr-visually-hidden rr-visually-hidden--focusable">Skip to main</span>',
    );
    expect(renderToStaticMarkup(<VisuallyHidden focusable={false}>x</VisuallyHidden>)).toBe(
      '<span class="rr-visually-hidden">x</span>',
    );
    expect(
      renderToStaticMarkup(
        <VisuallyHidden focusable className="custom">
          x
        </VisuallyHidden>,
      ),
    ).toBe('<span class="rr-visually-hidden rr-visually-hidden--focusable custom">x</span>');
  });

  it("appends the consumer className and spreads pass-through props (incl. ARIA)", () => {
    expect(renderToStaticMarkup(<VisuallyHidden className="custom">x</VisuallyHidden>)).toBe(
      '<span class="rr-visually-hidden custom">x</span>',
    );
    expect(
      renderToStaticMarkup(
        <VisuallyHidden className="custom" id="skip" data-kind="sr" title="skip link">
          x
        </VisuallyHidden>,
      ),
    ).toBe(
      '<span id="skip" data-kind="sr" title="skip link" class="rr-visually-hidden custom">x</span>',
    );
    expect(
      renderToStaticMarkup(
        <VisuallyHidden aria-hidden="true" role="status">
          x
        </VisuallyHidden>,
      ),
    ).toBe('<span aria-hidden="true" role="status" class="rr-visually-hidden">x</span>');
  });

  it("exposes a displayName for dev tooling", () => {
    expect(VisuallyHidden.displayName).toBe("VisuallyHidden");
  });
});

describe("VisuallyHidden authored CSS a11y contract", () => {
  it("clips the content instead of removing it from the a11y tree", async () => {
    const css = await readComponentCss("visually-hidden/VisuallyHidden.css");

    expect(css).toMatch(/\.rr-visually-hidden\s*\{[^}]*position:\s*absolute/);
    expect(css).toMatch(/\.rr-visually-hidden\s*\{[^}]*width:\s*1px/);
    expect(css).toMatch(/\.rr-visually-hidden\s*\{[^}]*height:\s*1px/);
    expect(css).toMatch(/\.rr-visually-hidden\s*\{[^}]*overflow:\s*hidden/);
    expect(css).toMatch(/\.rr-visually-hidden\s*\{[^}]*clip:\s*rect/);
    expect(css, "display:none would drop the text from the a11y tree").not.toMatch(
      /\.rr-visually-hidden\s*\{[^}]*display:\s*none/,
    );
    expect(css, "visibility:hidden would make the element unfocusable").not.toMatch(
      /\.rr-visually-hidden\s*\{[^}]*visibility:\s*hidden/,
    );
  });

  it("reveals the focusable variant on :focus, :active and :focus-within", async () => {
    const css = await readComponentCss("visually-hidden/VisuallyHidden.css");
    const reveal = css.match(/\.rr-visually-hidden--focusable:focus,[\s\S]*?\{([\s\S]*?)\n\}/)?.[1];

    expect(reveal, "the :focus/:active/:focus-within reveal block must exist").toBeDefined();
    expect(css).toMatch(/\.rr-visually-hidden--focusable:focus,/);
    expect(css).toMatch(/\.rr-visually-hidden--focusable:active,/);
    expect(css).toMatch(/\.rr-visually-hidden--focusable:focus-within\s*\{/);
    expect(reveal).toMatch(/position:\s*static/);
    expect(reveal).toMatch(/width:\s*auto/);
    expect(reveal).toMatch(/clip:\s*auto/);
    expect(reveal).toMatch(/overflow:\s*visible/);
  });

  it("consumes no design tokens (a11y geometry exception)", async () => {
    expect(tokenVarsUsed(await readComponentCss("visually-hidden/VisuallyHidden.css"))).toEqual([]);
  });
});
