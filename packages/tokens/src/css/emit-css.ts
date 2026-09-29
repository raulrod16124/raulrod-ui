// CSS custom properties emission for @raulrod/tokens (RRU-024, tracked in
// RRU-068).
//
// Pure function: token layers in, stylesheet text out. The CLI wrapper lives in
// `tools/emit-css.mjs` and only writes the file, so the emission contract is
// unit-testable and typechecked instead of hiding logic in a build script.
//
// Emitted structure (`dist/tokens.css`):
//   - primitives static in `:root` (`--rr-<kebab-key>`);
//   - theme-agnostic semantic scalars static in `:root`;
//   - component layer as `var(--rr-…)` aliases in `:root` (theming stays in the
//     semantic layer, RRU-026);
//   - semantic `color.*` pairs as light defaults in `:root`, dark overrides in
//     `[data-theme="dark"]` and in `@media (prefers-color-scheme: dark)` scoped
//     to `:root:not([data-theme="light"])` (no attribute → system preference,
//     explicit light wins over a dark system);
//   - `motion.behavior.default` flipped under `@media (prefers-reduced-motion:
//     reduce)`.
//
// Every invariant is checked before returning; a violation throws
// `CssEmissionError` with the full list, so a broken emission can never be
// written to disk. Guide: docs/theming.md.
import type { SemanticColorPair, SemanticLayerValue, TokenLayers } from "../taxonomy.js";

/** Counts of what was emitted, used for the build log and the tests. */
export interface EmittedCssCounts {
  readonly primitives: number;
  readonly semantics: number;
  readonly themedColors: number;
  readonly component: number;
}

/** Emitted stylesheet plus the counts of what it contains. */
export interface EmittedCss {
  readonly css: string;
  readonly counts: EmittedCssCounts;
}

/** Aggregates every emission problem so one run reports all of them, not just the first. */
export class CssEmissionError extends Error {
  readonly problems: readonly string[];

  constructor(problems: readonly string[]) {
    super(`CSS emission failed:\n${problems.map((problem) => `  - ${problem}`).join("\n")}`);
    this.name = "CssEmissionError";
    this.problems = problems;
  }
}

/** Custom property name for a token key: `rr-` prefix + kebab (decisión #1). */
export function cssVarName(key: string): string {
  return `--rr-${key.replaceAll(".", "-")}`;
}

const VAR_NAME_RE = /^--rr-[a-z0-9-]+$/;
// Numeric semantic domains whose token unit is px (typography.md, RRU-023);
// every other number (weight/leading/z) is unitless.
const PX_PREFIXES = ["font.size.", "breakpoint."];
// Tokens legitimately declared more than once: color pairs (root + 2 dark
// blocks) and motion.behavior.default (root + reduced-motion flip).
const DARK_VAR_OCCURRENCES = 3;
const DEFAULT_BEHAVIOR_OCCURRENCES = 2;

function isThemePair(value: SemanticLayerValue): value is SemanticColorPair {
  return typeof value === "object" && value !== null && "light" in value && "dark" in value;
}

function toCssValue(key: string, value: string | number): string {
  if (typeof value === "number") {
    return PX_PREFIXES.some((prefix) => key.startsWith(prefix)) ? `${value}px` : String(value);
  }
  return value;
}

const indent2 = (line: string): string => `  ${line}`;
const indent4 = (line: string): string => `    ${line}`;

/**
 * Renders the whole `tokens.css` for the given layers.
 *
 * @throws {CssEmissionError} when any naming, value-shape, lineage, count or
 * structure invariant is violated.
 */
export function emitCss(layers: TokenLayers): EmittedCss {
  const { primitives, semantic, component } = layers;
  const problems: string[] = [];

  const declaration = (key: string, value: string | number): string => {
    const name = cssVarName(key);
    if (!VAR_NAME_RE.test(name))
      problems.push(`invalid custom property name derived from "${key}": ${name}`);
    const cssValue = toCssValue(key, value);
    if (cssValue.length === 0) problems.push(`"${key}" emits an empty value`);
    if (/undefined|NaN/.test(cssValue)) problems.push(`"${key}" emits a broken value: ${cssValue}`);
    if (/[;{}]/.test(cssValue)) {
      problems.push(`"${key}" emits a value with illegal CSS characters: ${cssValue}`);
    }
    return `${name}: ${cssValue};`;
  };

  // --- Partition the single source into emission groups ---------------------
  const primitiveDecls = Object.entries(primitives).map(([key, value]) => declaration(key, value));

  const staticSemantic: string[] = [];
  const darkColorSemantic: string[] = [];
  const lightColorSemantic: string[] = [];
  for (const [key, value] of Object.entries(semantic)) {
    if (isThemePair(value)) {
      lightColorSemantic.push(declaration(key, value.light));
      darkColorSemantic.push(declaration(key, value.dark));
    } else {
      staticSemantic.push(declaration(key, value));
    }
  }

  // Component layer (RRU-026): each ref becomes a `var(--rr-…)` alias declared
  // once in `:root`, so nothing is duplicated in the dark blocks.
  const componentDecls: string[] = [];
  for (const [key, ref] of Object.entries(component)) {
    if (!(ref in semantic)) {
      problems.push(`component token "${key}" references unknown semantic "${ref}"`);
      continue;
    }
    if (!ref.startsWith("color.")) {
      problems.push(`component token "${key}" must reference a color.* semantic, got "${ref}"`);
      continue;
    }
    componentDecls.push(declaration(key, `var(${cssVarName(ref)})`));
  }

  // --- Assemble the stylesheet ----------------------------------------------
  const rootLines = [
    ":root {",
    indent2("color-scheme: light;"),
    "",
    indent2("/* Primitives (static, theme-agnostic) */"),
    ...primitiveDecls.map(indent2),
  ];
  if (staticSemantic.length > 0) {
    rootLines.push(
      "",
      indent2("/* Semantic — theme-agnostic scalars */"),
      ...staticSemantic.map(indent2),
    );
  }
  if (componentDecls.length > 0) {
    rootLines.push(
      "",
      indent2("/* Component — semantic color refs (var() aliases) */"),
      ...componentDecls.map(indent2),
    );
  }
  if (lightColorSemantic.length > 0) {
    rootLines.push(
      "",
      indent2("/* Semantic — color tokens (light defaults) */"),
      ...lightColorSemantic.map(indent2),
    );
  }
  rootLines.push("}");

  const darkAttrLines = [
    '[data-theme="dark"] {',
    indent2("color-scheme: dark;"),
    ...darkColorSemantic.map(indent2),
    "}",
  ];

  const darkMediaLines = [
    "@media (prefers-color-scheme: dark) {",
    indent2(':root:not([data-theme="light"]) {'),
    indent4("color-scheme: dark;"),
    ...darkColorSemantic.map(indent4),
    indent2("}"),
    "}",
  ];

  const reducedMotion = semantic["motion.behavior.reduced"];
  const reducedMotionValue =
    typeof reducedMotion === "string" || typeof reducedMotion === "number"
      ? reducedMotion
      : undefined;
  if (reducedMotionValue === undefined) {
    problems.push(
      'missing scalar semantic "motion.behavior.reduced" required by the reduced-motion block',
    );
  }
  const reducedMotionLines = [
    "@media (prefers-reduced-motion: reduce) {",
    indent2(":root {"),
    indent4(
      `${cssVarName("motion.behavior.default")}: ${
        reducedMotionValue === undefined
          ? ""
          : toCssValue("motion.behavior.reduced", reducedMotionValue)
      };`,
    ),
    indent2("}"),
    "}",
  ];

  const css = [
    "/* @raulrod/tokens — generated by tools/emit-css.mjs. Do not edit.\n" +
      " * Source of truth: packages/tokens/src/{primitives,semantic,component}.ts\n" +
      " * Guide: docs/theming.md (RRU-024). */",
    rootLines.join("\n"),
    darkAttrLines.join("\n"),
    darkMediaLines.join("\n"),
    reducedMotionLines.join("\n"),
  ].join("\n\n");

  // --- Post-generation invariants -------------------------------------------
  const occurrences = (name: string): number => css.split(`${name}:`).length - 1;

  for (const key of Object.keys(primitives)) {
    const count = occurrences(cssVarName(key));
    if (count !== 1) problems.push(`primitive "${key}" declared ${count}× (expected 1)`);
  }
  for (const [key, value] of Object.entries(semantic)) {
    const expected = isThemePair(value)
      ? DARK_VAR_OCCURRENCES
      : key === "motion.behavior.default"
        ? DEFAULT_BEHAVIOR_OCCURRENCES
        : 1;
    const count = occurrences(cssVarName(key));
    if (count !== expected) {
      problems.push(`semantic "${key}" declared ${count}× (expected ${expected})`);
    }
  }
  for (const key of Object.keys(component)) {
    const count = occurrences(cssVarName(key));
    if (count !== 1)
      problems.push(`component token "${key}" declared ${count}× (expected 1 alias in :root)`);
  }

  const opens = (css.match(/\{/g) ?? []).length;
  const closes = (css.match(/\}/g) ?? []).length;
  if (opens !== closes) problems.push(`unbalanced braces: ${opens} "{" vs ${closes} "}"`);
  for (const marker of [
    '[data-theme="dark"]',
    "@media (prefers-color-scheme: dark)",
    "@media (prefers-reduced-motion: reduce)",
    ':root:not([data-theme="light"])',
    "color-scheme: light",
    "color-scheme: dark",
  ]) {
    if (!css.includes(marker)) problems.push(`missing required structure: ${marker}`);
  }

  if (problems.length > 0) throw new CssEmissionError(problems);

  return {
    css,
    counts: {
      primitives: Object.keys(primitives).length,
      semantics: Object.keys(semantic).length,
      themedColors: lightColorSemantic.length,
      component: Object.keys(component).length,
    },
  };
}
