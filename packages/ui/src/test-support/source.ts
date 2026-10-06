// The harness reads files from disk, so it needs Node types. They are
// requested HERE, per file, on purpose: `packages/ui/tsconfig.json` must
// not enable them globally, or every component in `src/` would silently
// accept Node globals (`process`, `Buffer`) in a browser-only library.
/// <reference types="node" />
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath, URL as NodeURL } from "node:url";

// `URL` here must be the node one: under happy-dom the global `URL` resolves
// relative paths against the document origin, so `new URL(path, import.meta.url)`
// would hand `readFile` an http:// URL.
const srcDir = fileURLToPath(new NodeURL("../", import.meta.url));

export function readSource(path: string): Promise<string> {
  return readFile(join(srcDir, path), "utf8");
}

/**
 * Top-level component directories: folders under `src/` that contain a
 * PascalCase `.tsx` implementation file. This is the shape the Playbook
 * §4 Paso 1 fixes for a component, and it is the same criterion
 * `check-demo-claims.mjs` uses to count "Components".
 *
 * Filesystem enumeration on purpose (same argument as `styles.test.ts`): a
 * hardcoded allowlist of the 28 components is the list someone forgets to
 * update, so a gate that uses this helper keeps covering new components
 * automatically.
 */
export async function listComponentDirectories(): Promise<string[]> {
  const entries = await readdir(srcDir, { withFileTypes: true });
  const dirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);

  const withComponent = await Promise.all(
    dirs.map(async (dir) => {
      const files = await readdir(join(srcDir, dir));
      return files.some((file) => /^[A-Z].*\.tsx$/.test(file)) ? dir : null;
    }),
  );

  return withComponent.filter((dir): dir is string => dir !== null).sort();
}

/**
 * Every file under `src/`, recursively, as `src/`-relative POSIX paths, sorted.
 *
 * Filesystem enumeration on purpose (same argument as `styles.test.ts`): a
 * hand-written list of the files a contract applies to drifts the first time
 * somebody adds a file, and it drifts silently — the contract keeps passing
 * while covering less. Callers decide what to include (the security contract
 * excludes tests, stories and the harness itself, RRU-102); this helper only
 * knows what is on disk.
 */
export async function listSourcePaths(): Promise<string[]> {
  async function walk(directory: string, prefix: string): Promise<string[]> {
    const entries = await readdir(join(srcDir, directory), { withFileTypes: true });
    const nested = await Promise.all(
      entries.map((entry) =>
        entry.isDirectory()
          ? walk(join(directory, entry.name), `${prefix}${entry.name}/`)
          : [`${prefix}${entry.name}`],
      ),
    );
    return nested.flat();
  }

  return (await walk("", "")).sort();
}
