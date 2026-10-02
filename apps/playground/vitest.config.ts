import { defineConfig, mergeConfig } from "vitest/config";

import preset from "../../vitest.preset.mjs";

// Per-app additions on top of the shared harness (RRU-068, root
// `vitest.preset.mts`).
//
// The playground has no DOM specs: its behaviour is already covered by the
// Playwright suite (RRU-069), which drives a real browser. What this app needs
// to gate is a CONTRACT OVER TEXT — that the snippets the README publishes still
// compile against the public API, and that every entrypoint the packages
// declare public is actually consumed by a consumer app. Reading files needs no
// DOM, so `node` is the honest environment (`packages/tokens`, precedent).
//
// The preset's `include` is `src/**/*.test.{ts,tsx}`, which deliberately does
// NOT match `e2e/*.spec.ts`: Vitest never loads the Playwright suite.
export default mergeConfig(
  preset,
  defineConfig({
    test: {
      environment: "node",
    },
  }),
);
