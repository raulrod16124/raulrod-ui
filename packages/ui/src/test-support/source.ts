// The harness reads files from disk, so it needs Node types. They are
// requested HERE, per file, on purpose: `packages/ui/tsconfig.json` must
// not enable them globally, or every component in `src/` would silently
// accept Node globals (`process`, `Buffer`) in a browser-only library.
/// <reference types="node" />
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath, URL as NodeURL } from "node:url";

// `URL` here must be the node one: under happy-dom the global `URL` resolves
// relative paths against the document origin, so `new URL(path, import.meta.url)`
// would hand `readFile` an http:// URL.
const srcDir = fileURLToPath(new NodeURL("../", import.meta.url));

export function readSource(path: string): Promise<string> {
  return readFile(join(srcDir, path), "utf8");
}
