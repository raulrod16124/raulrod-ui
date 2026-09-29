// A minimal CSS reader for the a11y contracts of RRU-072 (reduced motion and
// contrast).
//
// It exists for the same reason `css.ts` reads stylesheets as TEXT: the promises
// being checked are about what the SOURCE says, not about what one DOM
// environment computes. A real cascade needs layout, a real stylesheet cascade
// and a real paint — none of which a happy-dom test can provide — but "does
// every `transition` of a movement property have a reduced-motion escape" and
// "which color does this rule paint over which background" are decidable by
// reading, and decidable for ALL states at once instead of only the ones a
// fixture happens to render.
//
// It is deliberately NOT a CSS engine. The rules it models are the ones the DS
// itself uses (ADR-003: no CSS-in-JS, `rr-*` classes, tokens only), so an
// unparseable construct has to be a loud error rather than a silent skip: a
// parser that quietly drops a rule would make the gate lie about coverage.
// <reference types="node" />
import { readFile } from "node:fs/promises";
import { isAbsolute, join } from "node:path";
import { fileURLToPath, URL as NodeURL } from "node:url";

const srcDir = fileURLToPath(new NodeURL("../", import.meta.url));

export interface CssDeclaration {
  /** Lowercased property name, e.g. `background-color`. */
  readonly property: string;
  /** Whitespace-collapsed value, e.g. `1px solid var(--rr-color-border-strong)`. */
  readonly value: string;
  /** 1-indexed line in the source file, for a failure a human can jump to. */
  readonly line: number;
}

export interface CssRule {
  /** `src/`-relative path of the file, e.g. `button/Button.css`. */
  readonly file: string;
  /** The selector list, whitespace-normalized and split. */
  readonly selectors: readonly string[];
  /** Enclosing at-rule prelude (`@media (...)`), or `null` at the top level. */
  readonly media: string | null;
  /** Enclosing `@keyframes` name when this rule is a frame, else `null`. */
  readonly keyframes: string | null;
  readonly declarations: readonly CssDeclaration[];
}

/**
 * Blank out comments while KEEPING every offset and newline, so line numbers
 * stay true after the parse.
 */
function blankComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, " "));
}

/** Collapses whitespace so a multi-line value compares and prints as one line. */
function collapse(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/** `.a  >  .b` and `.a > .b` are the same selector; make them compare equal. */
function normalizeSelector(selector: string): string {
  return collapse(selector).replace(/\s*([>+~])\s*/g, " $1 ");
}

/**
 * The theme names this media query is about, or `null` when it says nothing
 * about them. `prefers-reduced-motion: reduce` → `["reduced-motion"]`.
 */
export function mediaFeatures(media: string | null): string[] {
  if (media === null) return [];
  return [...media.matchAll(/\(\s*([a-z-]+)\s*:/g)].flatMap((match) => match[1] ?? []);
}

/** True when the rule only applies to users who asked for reduced motion. */
export function isReducedMotion(media: string | null): boolean {
  return mediaFeatures(media).includes("prefers-reduced-motion");
}

function lineStarts(css: string): number[] {
  const starts = [0];
  for (let index = 0; index < css.length; index += 1) {
    if (css[index] === "\n") starts.push(index + 1);
  }
  return starts;
}

function parseDeclarations(body: string, bodyOffset: number, starts: number[]): CssDeclaration[] {
  const declarations: CssDeclaration[] = [];
  let depth = 0;
  let segmentStart = 0;

  const push = (segment: string) => {
    const colon = segment.indexOf(":");
    if (colon === -1) return;
    const property = collapse(segment.slice(0, colon)).toLowerCase();
    const value = collapse(segment.slice(colon + 1));
    if (property === "" || value === "") return;
    declarations.push({
      property,
      value,
      line: lineOf(starts, bodyOffset + segmentStart),
    });
  };

  for (let index = 0; index < body.length; index += 1) {
    const character = body[index];
    if (character === "(") depth += 1;
    else if (character === ")") depth -= 1;
    else if (character === ";" && depth === 0) {
      push(body.slice(segmentStart, index));
      segmentStart = index + 1;
    }
  }
  push(body.slice(segmentStart));

  return declarations;
}

function lineOf(starts: number[], offset: number): number {
  let low = 0;
  let high = starts.length - 1;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if ((starts[mid] ?? 0) <= offset) low = mid;
    else high = mid - 1;
  }
  return low + 1;
}

interface Context {
  readonly media: string | null;
  readonly keyframes: string | null;
}

function scan(
  css: string,
  body: string,
  bodyOffset: number,
  starts: number[],
  file: string,
  context: Context,
  rules: CssRule[],
): void {
  let index = 0;
  while (index < body.length) {
    const brace = body.indexOf("{", index);
    const semicolon = body.indexOf(";", index);
    if (brace === -1) break;
    if (semicolon !== -1 && semicolon < brace) {
      index = semicolon + 1;
      continue;
    }

    const prelude = collapse(body.slice(index, brace));
    let depth = 1;
    let cursor = brace + 1;
    while (cursor < body.length && depth > 0) {
      const character = body[cursor];
      if (character === "{") depth += 1;
      else if (character === "}") depth -= 1;
      cursor += 1;
    }
    const inner = body.slice(brace + 1, cursor - 1);
    const innerOffset = bodyOffset + brace + 1;

    if (prelude.startsWith("@")) {
      const name = /^@([a-z-]+)/.exec(prelude)?.[1] ?? "";
      if (name === "media" || name === "supports" || name === "layer" || name === "container") {
        scan(css, inner, innerOffset, starts, file, { ...context, media: prelude }, rules);
      } else if (name === "keyframes") {
        const keyframes = prelude.slice(prelude.indexOf("keyframes") + "keyframes".length).trim();
        scan(css, inner, innerOffset, starts, file, { ...context, keyframes }, rules);
      }
      // Any other at-rule (`@import`, `@font-face`, `@page`, `@supports` with a
      // `;` prelude) paints nothing a contract can judge.
    } else if (prelude !== "") {
      rules.push({
        file,
        selectors: prelude.split(",").map(normalizeSelector).filter(Boolean),
        media: context.media,
        keyframes: context.keyframes,
        declarations: parseDeclarations(inner, innerOffset, starts),
      });
    }

    index = cursor;
  }
}

/**
 * Every style rule of a stylesheet, in source order, with its context.
 *
 * `path` is `src/`-relative, as `listComponentStylePaths` yields it. An absolute
 * path is read as given, which is what lets the negative probes audit a
 * stylesheet written to a temp directory instead of polluting `src/` with
 * fixtures that exist only to prove the gate can fail.
 */
export async function parseCssRules(path: string): Promise<CssRule[]> {
  const source = await readFile(isAbsolute(path) ? path : join(srcDir, path), "utf8");
  const css = blankComments(source);
  const rules: CssRule[] = [];
  scan(css, css, 0, lineStarts(css), path, { media: null, keyframes: null }, rules);
  return rules;
}

/** `button/Button.css:34` — the location a failure message should point at. */
export function at(rule: CssRule, line: number | undefined = undefined): string {
  return `${rule.file}:${line ?? rule.declarations[0]?.line ?? 1}`;
}

/** The first declaration of a property, or `undefined`. */
export function declaration(rule: CssRule, property: string): CssDeclaration | undefined {
  return rule.declarations.find((entry) => entry.property === property);
}

/**
 * The LAST declaration of a property — source order decides, as in the cascade.
 * A hand-rolled reverse scan rather than `Array.prototype.findLast`, because the
 * package targets ES2022 (`lib` has no ES2023) and the answer has to be the
 * cascade's, not "the first one that happens to match".
 */
export function lastDeclaration(rule: CssRule, property: string): CssDeclaration | undefined {
  const { declarations } = rule;
  for (let index = declarations.length - 1; index >= 0; index -= 1) {
    const entry = declarations[index];
    if (entry?.property === property) return entry;
  }
  return undefined;
}

/** The `var(--rr-…)` names a value references, de-duplicated, in order. */
export function tokenNames(value: string): string[] {
  return [...value.matchAll(/var\((--rr-[a-z0-9-]+)\)/g)].flatMap((match) => match[1] ?? []);
}

/** The BEM block a selector belongs to: `.rr-table__row:hover` → `rr-table`. */
export function blockOf(selector: string): string | undefined {
  const first = selector.split(/[\s>+~]/).filter(Boolean)[0] ?? "";
  return /^(\.[a-z0-9-]+?)(?:__|--|$)/.exec(first)?.[1];
}

/**
 * The selector a rule targets, with every state and modifier stripped:
 * `.rr-button--secondary:hover` → `.rr-button--secondary`.
 *
 * This is the unit the contracts reason about, because it is the unit the
 * browser does: `:hover`, `[aria-expanded="true"]` and `:focus-visible` are the
 * SAME element in different states, so their foregrounds and backgrounds belong
 * to one paint contract, not to three.
 */
export function baseSelector(selector: string): string {
  const withoutPseudo = selector.replace(/::?[a-z-]+(\([^)]*\))?/g, "");
  return collapse(withoutPseudo).replace(/\s+/g, " ");
}
