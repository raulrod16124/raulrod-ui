// Contract of the token-level `styles` prop introduced by ADR-009 / RRU-146.
//
// ADR-003 says the consumer overrides variables, not internals. ADR-009 says the
// `styles` prop is a typed instance-level shortcut for exactly that: the keys it
// accepts are the `--rr-*` tokens the component's own CSS already consumes, no
// more and no less. That makes the prop a contract, not a CSS-in-JS escape.
//
// This spec keeps two directions of that contract honest:
//
//   1. The generated file `style-tokens.generated.ts` is the compile-time source
//      of truth for the type. It must match the CSS on disk; if it drifts, the
//      error message tells the reviewer to run `pnpm derive:styles`.
//   2. The type must reject a key the component does not consume and an
//      arbitrary CSS property. Because these failures are type-level, the
//      instrument is `pnpm typecheck`: `@ts-expect-error` suppresses the error
//      today; if the type ever loosens, tsc fails with "Unused '@ts-expect-error'
//      directive". The runtime `expect` only keeps the values referenced.
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

  it("keeps the styles type narrow to real tokens", () => {
    // Vacuity guard: if Button somehow consumed zero tokens, the negative probes
    // below would pass for the wrong reason.
    expect(
      styleTokens.button.length,
      "Button must consume at least one token for the probe to mean anything",
    ).toBeGreaterThan(0);

    // A token Button actually consumes must compile without suppression.
    const _valid = { [styleTokens.button[0]]: "red" } satisfies Styles<"button">;

    // @ts-expect-error -- `--rr-not-consumed-by-button` is not a token Button consumes.
    const _badToken = { "--rr-not-consumed-by-button": "red" } satisfies Styles<"button">;

    // @ts-expect-error -- `color` is a CSS property, not a component token.
    const _badProperty = { color: "red" } satisfies Styles<"button">;

    expect([_valid, _badToken, _badProperty]).toHaveLength(3);
  });
});
