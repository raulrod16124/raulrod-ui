// Behavioral spec for Stack (RRU-031, tracked in RRU-068).
// Behavior over implementation (ADR-005): what the consumer observes is the
// emitted markup (tags, modifier classes, `cx` merge, prop spread) plus the
// authored CSS contract — a modifier selector must exist for every value the
// public types allow, and every `var(--rr-*)` must come from the tokens package.
import type { Spacing } from "@raulrod/tokens";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { primitives } from "@raulrod/tokens";

import { expectTokenLineage, readComponentCss } from "../test-support/css.js";

import { Stack } from "./index.js";

/** Every `Spacing` step the public `gap` prop accepts, derived from the tokens. */
const gaps = Object.keys(primitives).filter((key) => key.startsWith("space-")) as Spacing[];
const aligns = ["start", "center", "end", "stretch", "baseline"] as const;
const justifies = ["start", "center", "end", "between", "around", "evenly"] as const;

describe("Stack rendered markup", () => {
  it("renders a plain div with the base class and preserves children", () => {
    expect(renderToStaticMarkup(<Stack>A{"B"}</Stack>)).toBe('<div class="rr-stack">AB</div>');
  });

  it.each(gaps)('gap="%s" emits its modifier (the default gap lives in CSS)', (gap) => {
    expect(renderToStaticMarkup(<Stack gap={gap}>x</Stack>)).toBe(
      `<div class="rr-stack rr-stack--gap-${gap.slice(6)}">x</div>`,
    );
  });

  it.each(aligns)('align="%s" emits its modifier', (align) => {
    expect(renderToStaticMarkup(<Stack align={align} />)).toBe(
      `<div class="rr-stack rr-stack--align-${align}"></div>`,
    );
  });

  it.each(justifies)('justify="%s" emits its modifier', (justify) => {
    expect(renderToStaticMarkup(<Stack justify={justify} />)).toBe(
      `<div class="rr-stack rr-stack--justify-${justify}"></div>`,
    );
  });

  it("wrap emits its modifier, and wrap={false} emits nothing", () => {
    expect(renderToStaticMarkup(<Stack wrap>x</Stack>)).toBe(
      '<div class="rr-stack rr-stack--wrap">x</div>',
    );
    expect(renderToStaticMarkup(<Stack wrap={false}>x</Stack>)).toBe(
      '<div class="rr-stack">x</div>',
    );
  });

  it("emits combined modifiers in a stable order (gap, align, justify, wrap)", () => {
    expect(
      renderToStaticMarkup(
        <Stack gap="space-6" align="center" justify="between" wrap>
          x
        </Stack>,
      ),
    ).toBe(
      '<div class="rr-stack rr-stack--gap-6 rr-stack--align-center rr-stack--justify-between rr-stack--wrap">x</div>',
    );
  });

  it("appends the consumer className and spreads pass-through props", () => {
    expect(renderToStaticMarkup(<Stack className="custom outer">x</Stack>)).toBe(
      '<div class="rr-stack custom outer">x</div>',
    );
    expect(
      renderToStaticMarkup(
        <Stack className="custom" id="list" data-role="toolbar" title="toolbar">
          x
        </Stack>,
      ),
    ).toBe('<div id="list" data-role="toolbar" title="toolbar" class="rr-stack custom">x</div>');
  });
});

describe("Stack authored CSS contract", () => {
  it("is a flex column whose default gap is the space-4 token", async () => {
    const css = await readComponentCss("stack/Stack.css");

    expect(css).toMatch(/\.rr-stack\s*\{[^}]*display:\s*flex/);
    expect(css).toMatch(/\.rr-stack\s*\{[^}]*flex-direction:\s*column/);
    expect(css).toMatch(/\.rr-stack\s*\{[^}]*gap:\s*var\(--rr-space-4\)/);
  });

  it("declares a modifier for every gap/align/justify value of the public API", async () => {
    const css = await readComponentCss("stack/Stack.css");

    for (const gap of gaps) {
      const step = gap.slice(6);
      expect(css, `gap modifier ${gap}`).toMatch(
        new RegExp(`\\.rr-stack--gap-${step}\\s*\\{[^}]*gap:\\s*var\\(--rr-space-${step}\\)`),
      );
    }
    for (const align of aligns) {
      expect(css, `align ${align}`).toMatch(new RegExp(`\\.rr-stack--align-${align}`));
    }
    for (const justify of justifies) {
      expect(css, `justify ${justify}`).toMatch(new RegExp(`\\.rr-stack--justify-${justify}`));
    }
    expect(css).toMatch(/\.rr-stack--wrap\s*\{[^}]*flex-wrap:\s*wrap/);
  });

  it("only consumes tokens that @raulrod/tokens defines", async () => {
    const css = await readComponentCss("stack/Stack.css");
    await expectTokenLineage(css);
  });
});
