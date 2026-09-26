// Build-time CLI for the CSS emission of @raulrod/tokens (RRU-024, tracked in
// RRU-068).
//
// Deliberately thin: it resolves the compiled emitter and the token layers, then
// writes `dist/tokens.css`. All the logic and every invariant live in
// `src/css/emit-css.ts` (typed, unit-tested by `src/css/emit-css.test.ts`), so
// there is no untested JavaScript inside the build pipeline — the reason the
// previous `scripts/emit-css.mjs` was gitignored and the reason a clean checkout
// could not build this package at all.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { CssEmissionError, emitCss } from "../dist/css/emit-css.js";
import { component, primitives, semantic } from "../dist/index.js";

try {
  const { css, counts } = emitCss({ primitives, semantic, component });
  const outFile = join(dirname(fileURLToPath(import.meta.url)), "..", "dist", "tokens.css");
  writeFileSync(outFile, css);
  console.log(
    `Emitted dist/tokens.css: ${counts.primitives} primitives | ` +
      `${counts.semantics} semantics (${counts.themedColors} themed colors) | ` +
      `${counts.component} component tokens`,
  );
} catch (error) {
  if (error instanceof CssEmissionError) {
    console.error(error.message);
    process.exit(1);
  }
  throw error;
}
