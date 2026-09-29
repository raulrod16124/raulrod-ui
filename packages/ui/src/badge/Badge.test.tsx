// Behavioral spec for Badge (RRU-049, tracked in RRU-068).
// Badge is a static, non-interactive indicator, so the spec is mostly about what
// it must NOT do: no interaction states, no border, no motion in the CSS, and
// no dedicated tokens for the neutral variant (token-taxonomy §1). The status
// variants must consume the tint pairs the tokens gate already contrast-checked.
import type { BadgeVariant } from "./Badge.types.js";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Badge } from "../index.js";
import { expectTokenLineage, readComponentCss, stripCssComments } from "../test-support/css.js";

const variants: BadgeVariant[] = ["neutral", "success", "warning", "destructive", "info"];

describe("Badge rendered markup", () => {
  it("renders a plain span defaulting to the neutral variant", () => {
    expect(renderToStaticMarkup(<Badge>beta</Badge>)).toBe(
      '<span class="rr-badge rr-badge--neutral">beta</span>',
    );
  });

  it.each(variants)('variant="%s" emits its modifier', (variant) => {
    expect(renderToStaticMarkup(<Badge variant={variant}>x</Badge>)).toBe(
      `<span class="rr-badge rr-badge--${variant}">x</span>`,
    );
  });

  it("merges className and preserves pass-through attributes", () => {
    expect(
      renderToStaticMarkup(
        <Badge className="probe" id="b" title="t" data-x="1" aria-label="status">
          live
        </Badge>,
      ),
    ).toBe(
      '<span id="b" title="t" data-x="1" aria-label="status" class="rr-badge rr-badge--neutral probe">live</span>',
    );
  });

  it("stays a forwardRef with a displayName for dev tooling", () => {
    expect(Badge.$$typeof).toBe(Symbol.for("react.forward_ref"));
    expect(Badge.displayName).toBe("Badge");
  });
});

describe("Badge authored CSS contract", () => {
  it("is pure token geometry: pill, scale padding and the compact label", async () => {
    const css = await readComponentCss("badge/Badge.css");

    expect(css).toMatch(/\.rr-badge\s*\{[^}]*border-radius:\s*var\(--rr-radius-full\)/);
    expect(css).toMatch(/\.rr-badge\s*\{[^}]*padding:\s*var\(--rr-space-1\) var\(--rr-space-2\)/);
    expect(css).toMatch(/\.rr-badge\s*\{[^}]*font-size:\s*var\(--rr-font-size-2xs\)/);
    expect(css).toMatch(/\.rr-badge\s*\{[^}]*font-weight:\s*var\(--rr-font-weight-semibold\)/);
  });

  it("reuses the sunken + muted pair for neutral instead of new tokens", async () => {
    const css = await readComponentCss("badge/Badge.css");

    expect(css).toMatch(
      /\.rr-badge--neutral\s*\{[^}]*background:\s*var\(--rr-color-background-sunken\)/,
    );
    expect(css).toMatch(/\.rr-badge--neutral\s*\{[^}]*color:\s*var\(--rr-color-text-muted\)/);
  });

  it("reads the tint pair of every status variant", async () => {
    const css = await readComponentCss("badge/Badge.css");

    for (const variant of variants.filter((value) => value !== "neutral")) {
      expect(css, `${variant} background`).toMatch(
        new RegExp(
          `\\.rr-badge--${variant}\\s*\\{[^}]*background:\\s*var\\(--rr-color-background-${variant}\\)`,
        ),
      );
      expect(css, `${variant} text`).toMatch(
        new RegExp(
          `\\.rr-badge--${variant}\\s*\\{[^}]*color:\\s*var\\(--rr-color-text-${variant}\\)`,
        ),
      );
    }
  });

  it("affords no interaction: no states, no border, no motion", async () => {
    const css = stripCssComments(await readComponentCss("badge/Badge.css"));

    expect(css, "a static indicator must not afford interaction").not.toMatch(
      /:(hover|focus|active|disabled)\s*\{/,
    );
    expect(css).not.toMatch(/\bborder-(?!radius)[a-z-]*\s*:/);
    expect(css).not.toMatch(/\bborder\s*:/);
    expect(css).not.toMatch(/transition/);
  });

  it("only consumes tokens that @raulrod/tokens defines", async () => {
    await expectTokenLineage(await readComponentCss("badge/Badge.css"));
  });
});
