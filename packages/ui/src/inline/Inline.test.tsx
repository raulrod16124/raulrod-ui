// Behavioral spec for Inline (RRU-031, tracked in RRU-068).
// Mirrors Stack: the public `gap`/`align`/`justify`/`wrap` matrix, the `cx`
// merge with the consumer className, prop spread, and the authored CSS contract
// that every value of those unions has a modifier and only tokens are read.
import type { Spacing } from "@raulrod/tokens";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { primitives } from "@raulrod/tokens";

import { expectTokenLineage, readComponentCss } from "../test-support/css.js";

import { Inline } from "./index.js";

/** Every `Spacing` step the public `gap` prop accepts, derived from the tokens. */
const gaps = Object.keys(primitives).filter((key) => key.startsWith("space-")) as Spacing[];
const aligns = ["start", "center", "end", "stretch", "baseline"] as const;
const justifies = ["start", "center", "end", "between", "around", "evenly"] as const;

describe("Inline rendered markup", () => {
  it("renders a plain div with the base class and preserves children", () => {
    expect(renderToStaticMarkup(<Inline>Hello</Inline>)).toBe('<div class="rr-inline">Hello</div>');
  });

  it.each(gaps)('gap="%s" emits its modifier (the default gap lives in CSS)', (gap) => {
    expect(renderToStaticMarkup(<Inline gap={gap}>x</Inline>)).toBe(
      `<div class="rr-inline rr-inline--gap-${gap.slice(6)}">x</div>`,
    );
  });

  it.each(aligns)('align="%s" emits its modifier', (align) => {
    expect(renderToStaticMarkup(<Inline align={align} />)).toBe(
      `<div class="rr-inline rr-inline--align-${align}"></div>`,
    );
  });

  it.each(justifies)('justify="%s" emits its modifier', (justify) => {
    expect(renderToStaticMarkup(<Inline justify={justify} />)).toBe(
      `<div class="rr-inline rr-inline--justify-${justify}"></div>`,
    );
  });

  it("emits the wrap modifier only when wrapping is requested", () => {
    expect(renderToStaticMarkup(<Inline wrap>x</Inline>)).toBe(
      '<div class="rr-inline rr-inline--wrap">x</div>',
    );
    expect(renderToStaticMarkup(<Inline wrap={false}>x</Inline>)).toBe(
      '<div class="rr-inline">x</div>',
    );
  });

  it("emits combined modifiers in a stable order (gap, align, justify, wrap)", () => {
    expect(
      renderToStaticMarkup(
        <Inline gap="space-6" align="center" justify="between" wrap>
          x
        </Inline>,
      ),
    ).toBe(
      '<div class="rr-inline rr-inline--gap-6 rr-inline--align-center rr-inline--justify-between rr-inline--wrap">x</div>',
    );
  });

  it("appends the consumer className and spreads pass-through props", () => {
    expect(renderToStaticMarkup(<Inline className="custom outer">x</Inline>)).toBe(
      '<div class="rr-inline custom outer">x</div>',
    );
    expect(
      renderToStaticMarkup(
        <Inline className="custom" id="row" data-role="toolbar" title="toolbar">
          x
        </Inline>,
      ),
    ).toBe('<div id="row" data-role="toolbar" title="toolbar" class="rr-inline custom">x</div>');
  });
});

describe("Inline authored CSS contract", () => {
  it("is a flex row whose default gap is the space-4 token", async () => {
    const css = await readComponentCss("inline/Inline.css");

    expect(css).toMatch(/\.rr-inline\s*\{[^}]*display:\s*flex/);
    expect(css).toMatch(/\.rr-inline\s*\{[^}]*flex-direction:\s*row/);
    expect(css).toMatch(/\.rr-inline\s*\{[^}]*gap:\s*var\(--rr-space-4\)/);
  });

  it("declares a modifier for every gap/align/justify value of the public API", async () => {
    const css = await readComponentCss("inline/Inline.css");

    for (const gap of gaps) {
      const step = gap.slice(6);
      expect(css, `gap modifier ${gap}`).toMatch(
        new RegExp(`\\.rr-inline--gap-${step}\\s*\\{[^}]*gap:\\s*var\\(--rr-space-${step}\\)`),
      );
    }
    for (const align of aligns) {
      expect(css, `align ${align}`).toMatch(new RegExp(`\\.rr-inline--align-${align}`));
    }
    for (const justify of justifies) {
      expect(css, `justify ${justify}`).toMatch(new RegExp(`\\.rr-inline--justify-${justify}`));
    }
    expect(css).toMatch(/\.rr-inline--wrap\s*\{[^}]*flex-wrap:\s*wrap/);
  });

  it("only consumes tokens that @raulrod/tokens defines", async () => {
    await expectTokenLineage(await readComponentCss("inline/Inline.css"));
  });
});
