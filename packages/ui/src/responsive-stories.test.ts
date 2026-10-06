// Responsive story matrix gate (RRU-145).
//
// The Playbook §4 Paso 5 and the guide §861 require every component to expose
// a `Responsive` story. A convention that is not checked is a convention that
// disappears silently, so this spec enumerates the same component directories
// the demo gate counts and asserts that each ships a `.stories.tsx` exporting a
// story named `Responsive`. Both sides of the contract are read from the
// filesystem: no hand-written list of 28 components to forget.
/// <reference types="node" />
import { describe, expect, it } from "vitest";

import { listComponentDirectories, listSourcePaths, readSource } from "./test-support/source.js";

const RESPONSIVE_EXPORT_RE = /^export\s+const\s+Responsive\b/m;

describe("story matrix: every component exposes a Responsive story", () => {
  it("every component directory ships a Responsive story", async () => {
    const dirs = await listComponentDirectories();
    const allFiles = await listSourcePaths();

    expect(dirs.length, "expected at least one component directory").toBeGreaterThan(0);

    const missing: string[] = [];
    const malformed: string[] = [];

    for (const dir of dirs) {
      const stories = allFiles.filter(
        (file) => file.startsWith(`${dir}/`) && file.endsWith(".stories.tsx"),
      );

      if (stories.length === 0) {
        missing.push(dir);
        continue;
      }

      const storyFile = stories[0]!;
      const source = await readSource(storyFile);
      if (!RESPONSIVE_EXPORT_RE.test(source)) {
        malformed.push(dir);
      }
    }

    expect(
      missing,
      `component director${missing.length === 1 ? "y is" : "ies are"} missing a .stories.tsx file`,
    ).toEqual([]);

    expect(
      malformed,
      `component director${malformed.length === 1 ? "y does" : "ies do"} not export a Responsive story (guide §861)`,
    ).toEqual([]);
  });
});
