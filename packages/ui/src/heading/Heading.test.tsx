// Behavioral spec for Heading (RRU-032, tracked in RRU-068).
// The level hierarchy is the point of the card: `as` must pick both the tag and
// a monotonic visual size (h1 largest … h6 smallest) with a correct `h2` default,
// so the page is accessible by construction. Also pins the authored CSS contract:
// the base rule carries the heading role weight and must NOT hardcode a
// font-size (that would fight the level modifiers).
import type { HeadingLevel } from "./Heading.types.js";
import type { ColorText } from "@raulrod/tokens";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { expectTokenLineage, readComponentCss, stripCssComments } from "../test-support/css.js";

import { Heading } from "./index.js";

const levels: HeadingLevel[] = ["h1", "h2", "h3", "h4", "h5", "h6"];
/** Monotonic hierarchy the card requires: the size token shrinks with the level. */
const levelSizes = ["4xl", "3xl", "2xl", "xl", "lg", "base"];
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

/** Last segment of a dotted token path: `color.text.muted` -> `muted`. */
const tokenName = (token: string): string => token.slice(token.lastIndexOf(".") + 1);

describe("Heading rendered markup", () => {
  it("renders an h2 with the matching size modifier by default", () => {
    expect(renderToStaticMarkup(<Heading>Title</Heading>)).toBe(
      '<h2 class="rr-heading rr-heading--size-3xl">Title</h2>',
    );
  });

  it.each(levels.map((level, index) => [level, levelSizes[index]] as const))(
    'as="%s" renders that tag with the %s size modifier',
    (level, size) => {
      expect(renderToStaticMarkup(<Heading as={level}>x</Heading>)).toBe(
        `<${level} class="rr-heading rr-heading--size-${size}">x</${level}>`,
      );
    },
  );

  it.each(colors)('color="%s" emits its modifier without losing the level size', (color) => {
    expect(
      renderToStaticMarkup(
        <Heading as="h3" color={color}>
          x
        </Heading>,
      ),
    ).toBe(
      `<h3 class="rr-heading rr-heading--size-2xl rr-heading--color-${tokenName(color)}">x</h3>`,
    );
  });

  it("appends the consumer className and spreads pass-through props", () => {
    expect(
      renderToStaticMarkup(
        <Heading className="custom" id="hero" aria-level={3}>
          x
        </Heading>,
      ),
    ).toBe('<h2 id="hero" aria-level="3" class="rr-heading rr-heading--size-3xl custom">x</h2>');
  });
});

describe("Heading authored CSS contract", () => {
  it("leaves the font size to the level modifiers", async () => {
    const css = stripCssComments(await readComponentCss("heading/Heading.css"));

    expect(css).toMatch(/\.rr-heading\s*\{[^}]*font-weight:\s*var\(--rr-font-weight-semibold\)/);
    expect(css).not.toMatch(/\.rr-heading\s*\{[^}]*font-size:/);
  });

  it("declares a modifier for every heading level and every text color", async () => {
    const css = await readComponentCss("heading/Heading.css");

    for (const size of levelSizes) {
      expect(css, `size ${size}`).toMatch(
        new RegExp(
          `\\.rr-heading--size-${size}\\s*\\{[^}]*font-size:\\s*var\\(--rr-font-size-${size}\\)`,
        ),
      );
    }
    for (const color of colors) {
      const short = tokenName(color);
      expect(css, `color ${color}`).toMatch(
        new RegExp(
          `\\.rr-heading--color-${short}\\s*\\{[^}]*color:\\s*var\\(--rr-color-text-${short}\\)`,
        ),
      );
    }
  });

  it("only consumes tokens that @raulrod/tokens defines", async () => {
    await expectTokenLineage(await readComponentCss("heading/Heading.css"));
  });
});
