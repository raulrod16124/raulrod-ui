// Shared CSS-contract helpers for the component specs (RRU-068).
//
// Every component stylesheet must consume `@raulrod/tokens` and nothing else
// (Playbook §4 Paso 3: "SOLO tokens CSS variables, prohibido valores
// arbitrarios"). Before RRU-068 that rule was asserted by 16 copies of the same
// block inside the local `check-*.mjs` scripts; here it lives once.
//
// The authored stylesheet is read as TEXT on purpose: these are static
// contracts (which token a rule reads, source order of `:hover` vs
// `:disabled`, presence of a `prefers-reduced-motion` block) that no computed
// style in a test DOM could prove, and reading the source keeps the assertion
// independent of the CSS pipeline (ADR-003).
// The harness reads files from disk, so it needs Node types. They are
// requested HERE, per file, on purpose: `packages/ui/tsconfig.json` must
// not enable them globally, or every component in `src/` would silently
// accept Node globals (`process`, `Buffer`) in a browser-only library.
/// <reference types="node" />
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath, URL as NodeURL } from "node:url";

import { expect } from "vitest";

/**
 * These suites run in a happy-dom environment, whose global `URL` resolves
 * relative paths against the document base (`http://localhost:3000/`) instead of
 * the `file:` module URL — so `new URL(cssPath, import.meta.url)` silently yields
 * an `http:` URL that `node:fs` refuses to read. Resolving against node:url's own
 * `URL` implementation sidesteps the DOM globals entirely.
 */
const srcDir = fileURLToPath(new NodeURL("../", import.meta.url));

/**
 * Reads a stylesheet by its path relative to `src/`, e.g.
 * `readComponentCss("button/Button.css")`.
 */
export function readComponentCss(path: string): Promise<string> {
  return readFile(join(srcDir, path), "utf8");
}

/** Strips CSS comments so prose in a header cannot satisfy a negative assertion. */
export function stripCssComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

/** Every `--rr-*` custom property referenced by a stylesheet, de-duplicated. */
export function tokenVarsUsed(css: string): string[] {
  const used = [...css.matchAll(/var\((--rr-[a-z0-9-]+)\)/g)].flatMap((match) => match[1] ?? []);
  return [...new Set(used)];
}

let tokensCssPromise: Promise<string> | undefined;

/**
 * `dist/tokens.css` from `@raulrod/tokens`, the single emitted artifact that
 * defines every custom property (RRU-024). Cached per test file: it is produced
 * by the upstream `build` (turbo `test` dependsOn `^build`) and cannot change
 * during a run.
 */
export function readTokensCss(): Promise<string> {
  tokensCssPromise ??= readFile(join(srcDir, "../../tokens/dist/tokens.css"), "utf8");
  return tokensCssPromise ?? Promise.reject(new Error("tokens.css cache was cleared mid-run"));
}

/**
 * Asserts that every `--rr-*` property a stylesheet references is defined by the
 * tokens package: the gate that catches typos and removed tokens at build time
 * instead of at runtime in a consuming app.
 */
export async function expectTokenLineage(css: string): Promise<number> {
  const tokensCss = await readTokensCss();
  const variables = tokenVarsUsed(css);

  expect(variables.length, "stylesheet must reference at least one token").toBeGreaterThan(0);

  const undefinedVars = variables.filter((variable) => !tokensCss.includes(`${variable}:`));
  expect(
    undefinedVars,
    `tokens not defined in @raulrod/tokens: ${undefinedVars.join(", ")}`,
  ).toEqual([]);

  return variables.length;
}
