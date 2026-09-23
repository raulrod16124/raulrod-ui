import { defineConfig } from "vitest/config";

// Minimal Vitest harness adopted on RRU-052 to verify the shared overlay
// infrastructure (focus trap/return, dismissable layer, scroll lock) against a
// real DOM. `happy-dom` keeps the environment lightweight — no canvas/CSS
// layout needed for focus/keyboard/scroll tests. RRU-068 will formalize the
// repo-wide config and migrate the `check-*.mjs` chain; until then this file
// stays package-local.
export default defineConfig({
  resolve: {
    // The repo writes TS imports with `.js` extensions (moduleResolution:
    // bundler, RRU-011). Vite/Vitest must resolve those to the `.ts` sources.
    extensionAlias: {
      ".js": [".ts", ".tsx"],
    },
  },
  test: {
    environment: "happy-dom",
    setupFiles: ["vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
