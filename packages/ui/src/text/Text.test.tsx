// Behavioral spec for Text (RRU-032, tracked in RRU-068).
// Asserts the rendered span, one modifier per TypeScale/FontWeight/ColorText
// value, the `cx` merge and prop spread, plus the authored CSS contract:
// modifiers for every value of the three unions and token-only declarations.
import type { ColorText, FontWeight, TypeScale } from "@raulrod/tokens";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { expectTokenLineage, readComponentCss } from "../test-support/css.js";

import { Text } from "./index.js";

const sizes: TypeScale[] = [
  "font.size.2xs",
  "font.size.xs",
  "font.size.sm",
  "font.size.base",
  "font.size.lg",
  "font.size.xl",
  "font.size.2xl",
  "font.size.3xl",
  "font.size.4xl",
  "font.size.5xl",
];
const weights: FontWeight[] = [
  "font.weight.regular",
  "font.weight.medium",
  "font.weight.semibold",
  "font.weight.bold",
];
const colors: ColorText[] = [
  "color.text.primary",
  "color.text.muted",
  "color.text.inverse",
  "color.text.danger",
  "color.text.success",
  "color.text.warning",
  "color.text.info",
  "color.text.destructive",
];

/** Last segment of a dotted token path: `font.size.lg` -> `lg`. */
const tokenName = (token: string): string => token.slice(token.lastIndexOf(".") + 1);

describe("Text rendered markup", () => {
  it("renders a span with the base class and preserves children", () => {
    expect(renderToStaticMarkup(<Text>Hello</Text>)).toBe('<span class="rr-text">Hello</span>');
  });

  it.each(sizes)('size="%s" emits its modifier', (size) => {
    expect(renderToStaticMarkup(<Text size={size}>x</Text>)).toBe(
      `<span class="rr-text rr-text--size-${tokenName(size)}">x</span>`,
    );
  });

  it.each(weights)('weight="%s" emits its modifier', (weight) => {
    expect(renderToStaticMarkup(<Text weight={weight}>x</Text>)).toBe(
      `<span class="rr-text rr-text--weight-${tokenName(weight)}">x</span>`,
    );
  });

  it.each(colors)('color="%s" emits its modifier', (color) => {
    expect(renderToStaticMarkup(<Text color={color}>x</Text>)).toBe(
      `<span class="rr-text rr-text--color-${tokenName(color)}">x</span>`,
    );
  });

  it("emits combined modifiers in a stable order (size, weight, color)", () => {
    expect(
      renderToStaticMarkup(
        <Text size="font.size.lg" weight="font.weight.medium" color="color.text.muted">
          x
        </Text>,
      ),
    ).toBe(
      '<span class="rr-text rr-text--size-lg rr-text--weight-medium rr-text--color-muted">x</span>',
    );
  });

  it("appends the consumer className and spreads pass-through props", () => {
    expect(renderToStaticMarkup(<Text className="custom">x</Text>)).toBe(
      '<span class="rr-text custom">x</span>',
    );
    expect(
      renderToStaticMarkup(
        <Text title="tooltip" data-kind="meta">
          x
        </Text>,
      ),
    ).toBe('<span title="tooltip" data-kind="meta" class="rr-text">x</span>');
  });
});

describe("Text authored CSS contract", () => {
  it("derives the base rule from the body role tokens", async () => {
    const css = await readComponentCss("text/Text.css");

    expect(css).toMatch(/\.rr-text\s*\{[^}]*font-family:\s*var\(--rr-font-family-sans\)/);
    expect(css).toMatch(/\.rr-text\s*\{[^}]*font-size:\s*var\(--rr-font-size-base\)/);
    expect(css).toMatch(/\.rr-text\s*\{[^}]*font-weight:\s*var\(--rr-font-weight-regular\)/);
    expect(css).toMatch(/\.rr-text\s*\{[^}]*color:\s*var\(--rr-color-text-primary\)/);
  });

  it("declares a modifier for every size/weight/color of the public API", async () => {
    const css = await readComponentCss("text/Text.css");

    for (const size of sizes) {
      const short = tokenName(size);
      expect(css, `size ${size}`).toMatch(
        new RegExp(
          `\\.rr-text--size-${short}\\s*\\{[^}]*font-size:\\s*var\\(--rr-font-size-${short}\\)`,
        ),
      );
    }
    for (const weight of weights) {
      const short = tokenName(weight);
      expect(css, `weight ${weight}`).toMatch(
        new RegExp(
          `\\.rr-text--weight-${short}\\s*\\{[^}]*font-weight:\\s*var\\(--rr-font-weight-${short}\\)`,
        ),
      );
    }
    for (const color of colors) {
      const short = tokenName(color);
      expect(css, `color ${color}`).toMatch(
        new RegExp(
          `\\.rr-text--color-${short}\\s*\\{[^}]*color:\\s*var\\(--rr-color-text-${short}\\)`,
        ),
      );
    }
  });

  it("only consumes tokens that @raulrod/tokens defines", async () => {
    await expectTokenLineage(await readComponentCss("text/Text.css"));
  });
});
