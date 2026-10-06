// Contract of the `styles` prop introduced by ADR-009 / RRU-146, amended
// post-1.1.0 (see ADR-009): the prop accepts the `--rr-*` tokens the
// component's own CSS consumes **and** standard CSS properties — the runtime
// always spread both (mergeStyles does no filtering), so the type matches
// reality instead of gatekeeping DX. A `--rr-*` key the component does not
// consume is still rejected: it is in neither half of the intersection.
//
// This spec keeps two directions of that contract honest:
//
//   1. The generated file `style-tokens.generated.ts` is the compile-time source
//      of truth for the token half of the type. It must match the CSS on disk;
//      if it drifts, the error message tells the reviewer to run
//      `pnpm derive:styles`.
//   2. The type must accept a real token and a standard CSS property, and
//      reject a key the component does not consume. Because these failures are
//      type-level, the instrument is `pnpm typecheck`: `@ts-expect-error`
//      suppresses the error today; if the type ever loosens or tightens the
//      wrong way, tsc fails with "Unused '@ts-expect-error' directive". The
//      runtime `expect` only keeps the values referenced.
import { describe, expect, it } from "vitest";

import { styleTokens, type Styles } from "./style-tokens.generated.js";
import { listComponentStylePaths, readComponentCss, tokenVarsUsed } from "./test-support/css.js";

describe("styles type contract (RRU-146)", () => {
  it("derives the token union from each authored component CSS", async () => {
    const paths = await listComponentStylePaths();
    expect(paths.length, "there must be authored component stylesheets").toBeGreaterThan(0);

    const mismatches: string[] = [];
    let totalTokens = 0;

    for (const path of paths) {
      const dir = path.split("/")[0];
      const generated = styleTokens[dir as keyof typeof styleTokens];

      if (generated === undefined) {
        mismatches.push(`${dir}: no generated entry — run \`pnpm derive:styles\``);
        continue;
      }

      const css = await readComponentCss(path);
      const actual = [...tokenVarsUsed(css)].sort();
      const expected = [...generated].sort();

      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        mismatches.push(
          `${dir}: generated ${JSON.stringify(expected)}, but CSS has ${JSON.stringify(actual)} — run \`pnpm derive:styles\``,
        );
      }

      totalTokens += actual.length;
    }

    expect(mismatches, "style-tokens.generated.ts is stale or missing entries").toEqual([]);
    expect(
      totalTokens,
      "at least one --rr-* token must be consumed across components",
    ).toBeGreaterThan(0);
  });

  it("does not keep generated entries for removed stylesheets", async () => {
    const paths = await listComponentStylePaths();
    const cssDirs = new Set(paths.map((path) => path.split("/")[0]));
    const genDirs = Object.keys(styleTokens);
    const orphaned = genDirs.filter((dir) => !cssDirs.has(dir));

    expect(orphaned, "generated entries without a matching CSS file").toEqual([]);
  });

  it("keeps the styles type narrow to real tokens and open to CSS properties", () => {
    // Vacuity guard: if Button somehow consumed zero tokens, the negative probes
    // below would pass for the wrong reason.
    expect(
      styleTokens.button.length,
      "Button must consume at least one token for the probe to mean anything",
    ).toBeGreaterThan(0);

    // A token Button actually consumes must compile without suppression.
    const _validToken = { [styleTokens.button[0]]: "red" } satisfies Styles<"button">;

    // A standard CSS property compiles (ADR-009 amendment) — string and number
    // value forms, with the style-prop merge order unchanged.
    const _validCss = { color: "red", opacity: 0.5 } satisfies Styles<"button">;

    // @ts-expect-error -- `--rr-not-consumed-by-button` is not a token Button consumes.
    const _badToken = { "--rr-not-consumed-by-button": "red" } satisfies Styles<"button">;

    // @ts-expect-error -- `color` takes a color, not a number.
    const _badValue = { color: 12 } satisfies Styles<"button">;

    expect([_validToken, _validCss, _badToken, _badValue]).toHaveLength(4);
  });
});
