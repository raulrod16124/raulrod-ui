import { defineConfig, mergeConfig } from "vitest/config";

import preset from "../../vitest.preset.mjs";

// Per-package additions on top of the shared harness (RRU-068, root
// `vitest.preset.mts`): the token contracts (naming, lineage, value shapes and
// AA contrast) are pure data, so no DOM is required — `node` environment.
export default mergeConfig(
  preset,
  defineConfig({
    test: {
      environment: "node",
    },
  }),
);
