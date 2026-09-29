import { defineConfig } from "vitest/config";

// Shared test harness for every workspace package (RRU-068).
//
// Single source of truth for the parts that must not drift per package:
//   - the repo writes TS imports with explicit `.js` extensions (moduleResolution
//     bundler, RRU-011), so Vite needs `extensionAlias` to resolve them to the
//     TypeScript sources;
//   - specs live next to the code they cover, per the Playbook §4 Paso 1
//     convention (`<Pascal>.test.tsx` inside `src/<kebab-case>/`);
//   - every suite reports unhandled rejections, so an async leak in a component
//     fails the gate instead of warning silently.
//
// Packages merge their own additions (environment, setup files) on top:
// `packages/ui` adds happy-dom + Testing Library/jest-dom/jest-axe,
// `packages/tokens` runs on plain node (no DOM needed for the token contracts).
//
// NOTE: this file lives at the repo root, outside every package, so it is NOT
// part of `$TURBO_DEFAULT$` inputs. It is listed in `turbo.json`
// `globalDependencies` to invalidate the task cache when it changes (same class
// of bug as the `emit-css.mjs` input fixed in RRU-024).
export default defineConfig({
  resolve: {
    extensionAlias: {
      ".js": [".ts", ".tsx"],
    },
  },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    // Call history of `vi.fn()` is reset between tests so a mock can never leak
    // assertions across cases (implementations set with `mockImplementation` are
    // preserved).
    clearMocks: true,
  },
});
