// Contract of the CSS emission (RRU-024, tracked in RRU-068).
//
// `emitCss` is pure, so the emitted stylesheet is asserted as a string against
// the real token layers, and deliberately broken layers are fed to prove the
// build-time invariants still fail (the emitter is what guards `pnpm build`, so
// a silent pass here would be a real regression).
import type { TokenLayers } from "../taxonomy.js";

import { describe, expect, it } from "vitest";

import { component, primitives, semantic } from "../index.js";

import { CssEmissionError, cssVarName, emitCss } from "./emit-css.js";

const layers: TokenLayers = { primitives, semantic, component };
const { css, counts } = emitCss(layers);

/** How many times `--rr-<key>` is declared in the emitted stylesheet. */
function declarationsOf(key: string): number {
  return css.split(`${cssVarName(key)}:`).length - 1;
}

describe("emitted tokens.css (real token layers)", () => {
  it("emits every primitive exactly once, inside :root", () => {
    for (const key of Object.keys(primitives)) {
      expect(declarationsOf(key), `primitive "${key}"`).toBe(1);
    }
    expect(counts.primitives).toBe(Object.keys(primitives).length);
  });

  it("emits theme-agnostic semantic scalars once in :root", () => {
    for (const [key, value] of Object.entries(semantic)) {
      if (typeof value === "object") continue;
      const expected = key === "motion.behavior.default" ? 2 : 1;
      expect(declarationsOf(key), `semantic "${key}"`).toBe(expected);
    }
  });

  it("emits every color pair as light default + two dark blocks (attribute and system)", () => {
    const colorKeys = Object.entries(semantic)
      .filter(([, value]) => typeof value === "object")
      .map(([key]) => key);
    expect(colorKeys.length).toBe(counts.themedColors);
    for (const key of colorKeys) {
      expect(declarationsOf(key), `color pair "${key}"`).toBe(3);
    }
  });

  it("declares the theme blocks with the right scoping and color-scheme", () => {
    expect(css).toContain(":root {");
    expect(css).toContain("color-scheme: light;");
    expect(css).toContain('[data-theme="dark"] {');
    expect(css).toContain("color-scheme: dark;");
    // System preference only applies when no explicit theme attribute exists, and
    // an explicit light theme wins over a dark system (RRU-024).
    expect(css).toContain("@media (prefers-color-scheme: dark) {");
    expect(css).toContain(':root:not([data-theme="light"]) {');
  });

  it("flips motion.behavior.default to the reduced value under prefers-reduced-motion", () => {
    expect(css).toContain("@media (prefers-reduced-motion: reduce) {");
    expect(css).toContain(`${cssVarName("motion.behavior.default")}: none;`);
    expect(semantic["motion.behavior.reduced"]).toBe("none");
  });

  it("emits component tokens as var() aliases to semantic color tokens, once each", () => {
    expect(counts.component).toBe(Object.keys(component).length);
    for (const [key, ref] of Object.entries(component)) {
      expect(declarationsOf(key), `component "${key}"`).toBe(1);
      expect(css).toContain(`${cssVarName(key)}: var(${cssVarName(ref)});`);
    }
  });

  it("emits only well-formed custom property names and values", () => {
    const declarations = [...css.matchAll(/(--rr-[a-z0-9-]+):\s*([^;]+);/g)];
    expect(declarations.length).toBeGreaterThan(0);
    for (const [, name, value] of declarations) {
      expect(name).toMatch(/^--rr-[a-z0-9-]+$/);
      expect(value).not.toMatch(/undefined|NaN|[{}]/);
    }
  });

  it("has balanced braces", () => {
    expect(css.split("{")).toHaveLength(css.split("}").length);
  });

  it("points at the single source of truth and the theming guide", () => {
    expect(css.startsWith("/* @raulrod/tokens")).toBe(true);
    expect(css).toContain("packages/tokens/src/{primitives,semantic,component}.ts");
  });
});

describe("cssVarName", () => {
  it("converts dot-separated keys to the rr- prefixed kebab custom property", () => {
    expect(cssVarName("color.text.primary")).toBe("--rr-color-text-primary");
    expect(cssVarName("space-4")).toBe("--rr-space-4");
  });
});

describe("emission invariants reject broken layers", () => {
  const valid: TokenLayers = {
    primitives: { "gray-0": "#ffffff" },
    semantic: { "motion.behavior.default": "auto", "motion.behavior.reduced": "none" },
    component: {},
  };

  it("rejects an empty value", () => {
    expect(() => emitCss({ ...valid, primitives: { "gray-0": "" } })).toThrow(
      /emits an empty value/,
    );
  });

  it("rejects a broken value (undefined/NaN)", () => {
    expect(() => emitCss({ ...valid, primitives: { "gray-0": "undefined" } })).toThrow(
      /broken value/,
    );
  });

  it("rejects a value with illegal CSS characters (declaration injection)", () => {
    expect(() => emitCss({ ...valid, primitives: { "gray-0": "#fff; color: red" } })).toThrow(
      /illegal CSS characters/,
    );
  });

  it("rejects a component alias pointing at an unknown semantic", () => {
    expect(() =>
      emitCss({ ...valid, component: { "button.primary.background": "color.action.missing" } }),
    ).toThrow(/references unknown semantic/);
  });

  it("rejects a component alias pointing at a non-color semantic", () => {
    expect(() =>
      emitCss({ ...valid, component: { "button.primary.background": "motion.behavior.default" } }),
    ).toThrow(/must reference a color\.\* semantic/);
  });

  it("rejects a missing motion.behavior.reduced (the reduced-motion flip has no value)", () => {
    expect(() => emitCss({ ...valid, semantic: { "motion.behavior.default": "auto" } })).toThrow(
      /missing scalar semantic "motion.behavior.reduced"/,
    );
  });

  it("reports every problem at once instead of only the first", () => {
    try {
      emitCss({ ...valid, primitives: { "gray-0": "", "gray-1": "NaN" } });
      expect.unreachable("emitCss should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(CssEmissionError);
      expect((error as CssEmissionError).problems.length).toBeGreaterThanOrEqual(2);
    }
  });
});
