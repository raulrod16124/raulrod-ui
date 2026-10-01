// Copies the authored stylesheets of @raulrod/ui into `dist/` after `tsc`, so
// the package ships CSS at all (RRU-069).
//
// Why a build step: the components never import their own stylesheet (`tsc`
// erases nothing — it simply has no opinion about non-TS inputs, and a CSS
// `import` in the TSX would break the `sideEffects: false` tree-shaking promise
// of ADR-007). RRU-091 exposes this artifact as `@raulrod/ui/styles.css`;
// the relative layout inside `dist/` must still mirror `src/` so the barrel's
// `@import` specifiers resolve from the subpath entry point.
//
// The whole `src/**/*.css` tree is mirrored instead of only the barrel, because
// the barrel's own `@import "./button/Button.css"` specifiers are RELATIVE:
// preserving the directory layout is what lets the same barrel work verbatim
// from `dist/`. Which stylesheets must be reachable is a contract, not a build
// decision, so it lives in `src/styles.test.ts`; this file only moves files.
import { access, copyFile, mkdir, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = join(root, "src");
const distDir = join(root, "dist");

/**
 * Recursively copies the style artifacts of `from` into `to`, mirroring the
 * tree. Copies `.css` files and `.css.d.ts` ambient declaration files (the
 * latter give TypeScript consumers types for the public subpath exports like
 * `@raulrod/ui/styles.css` without extra config).
 */
async function copyStyleTree(from, to) {
  const entries = await readdir(from, { withFileTypes: true });
  let copied = 0;

  for (const entry of entries) {
    const source = join(from, entry.name);
    const target = join(to, entry.name);

    if (entry.isDirectory()) {
      // A directory is created only when it actually holds a style artifact.
      // `mkdir` here unconditionally left an EMPTY `dist/` directory behind for
      // every folder in `src/` that has no stylesheet — including
      // `storybook-support/`, which `tsconfig.build.json` deliberately keeps out
      // of the build. The empty directory is not in the published tarball, but
      // it makes `dist/` disagree with the shipped set, which is the kind of
      // discrepancy a consumer debugging a missing file will lose an hour to
      // (RRU-103).
      // No `mkdir` needed here: copying a file below this point already creates
      // `target` via `mkdir(dirname(target))`.
      copied += await copyStyleTree(source, target);
    } else if (entry.name.endsWith(".css") || entry.name.endsWith(".css.d.ts")) {
      await mkdir(dirname(target), { recursive: true });
      await copyFile(source, target);
      copied += 1;
    }
  }

  return copied;
}

try {
  // A build that "succeeded" without the public stylesheet is worse than a
  // failing one: the consumer gets an unstyled system and no signal at all.
  await access(join(srcDir, "styles.css"));

  const copied = await copyStyleTree(srcDir, distDir);
  if (copied === 0) {
    throw new Error("no stylesheet found in src/ — the public stylesheet would ship empty");
  }

  console.log(`Copied ${copied} stylesheets to dist (entry: dist/styles.css)`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
