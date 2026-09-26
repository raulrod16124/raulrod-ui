// Contract of the public stylesheet barrel, `src/styles.css` (RRU-069).
//
// The package never imports its own CSS from the components (`sideEffects:
// false`, ADR-007), so this barrel is the ONLY way the styles reach a
// consumer. That makes the barrel a promise — "import one file and the system
// is styled" — and this spec is what keeps it true:
//
//   1. every authored component stylesheet is reachable from the barrel
//      (a new component that forgets it ships unstyled);
//   2. the barrel imports nothing that does not exist (a stale entry breaks the
//      whole import, since the browser drops the rest of the sheet);
//
// Both directions are asserted against the FILESYSTEM enumeration rather than a
// duplicated list in the spec, so neither side can drift unnoticed.
import { describe, expect, it } from "vitest";

import {
  listComponentStylePaths,
  readComponentCss,
  readStyleBarrel,
  styleImports,
} from "./test-support/css.js";

describe("public stylesheet barrel (src/styles.css)", () => {
  it("imports every authored component stylesheet exactly once", async () => {
    const authored = await listComponentStylePaths();
    expect(authored.length).toBeGreaterThan(0);

    const imported = styleImports(await readStyleBarrel()).map((specifier) =>
      specifier.replace(/^\.\//, ""),
    );

    expect([...imported].sort()).toEqual(authored);
  });

  it("imports nothing that does not exist", async () => {
    const imported = styleImports(await readStyleBarrel());

    for (const specifier of imported) {
      const path = specifier.replace(/^\.\//, "");
      await expect(readComponentCss(path), `${specifier} must exist`).resolves.toBeTypeOf("string");
    }
  });
});
