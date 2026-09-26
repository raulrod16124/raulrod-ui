import { defineConfig, mergeConfig } from "vitest/config";

import preset from "../../vitest.preset.mjs";

// Per-package additions on top of the shared harness (RRU-068, root
// `vitest.preset.mts`): components need a DOM, plus the Testing Library +
// jest-dom + jest-axe setup. `happy-dom` stays the environment (adopted in
// RRU-052, already green for the overlay specs) — no canvas/CSS layout is needed
// for focus, keyboard and ARIA assertions.
export default mergeConfig(
  preset,
  defineConfig({
    test: {
      environment: "happy-dom",
      setupFiles: ["./src/test-support/setup.ts"],
    },
  }),
);
