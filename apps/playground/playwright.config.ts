// Playwright config of the playground (RRU-069).
//
// The suite runs against `vite preview`, i.e. against the BUILT app, never
// against the dev server: the whole point of the flows below is to prove what a
// consumer gets from the published artifacts (ESM `dist/`, the emitted
// stylesheets, the token CSS), and a dev server would happily serve sources and
// hide a broken build. Turbo makes `build` a dependency of `test:e2e`, so the
// artifact under test is always the current one.
//
// Chromium only, on purpose: every flow here is native DOM + ARIA + keyboard
// behaviour, identical across the three engines, and one browser keeps the job
// inside a couple of minutes. `projects` is the extension point when a
// real-browser difference has to be proven (WebKit focus, for instance).
/// <reference types="node" />
import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  // Specs are independent (each one drives the whole page from a clean load), so
  // running them in parallel is safe and keeps the job short.
  fullyParallel: true,
  // Locators that pass 15 of 16 times are worse than a red build: they train
  // everyone to re-run. `forbidOnly` makes a stray `test.only` fail CI instead
  // of silently shrinking the suite.
  forbidOnly: Boolean(process.env.CI),
  // One retry, CI only. A retry is a diagnostic tool here (the trace of the
  // failed attempt is kept), not a way to paper over a real race.
  retries: process.env.CI ? 1 : 0,
  // Overlays move focus, trap Tab and lock scrolling; a single worker removes
  // the machine-level timing pressure from that interaction.
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    // `on-first-retry` is the useful setting: a passing run stays cheap and a
    // failing one comes with DOM snapshots, console errors and the timeline.
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // No port or host flags: `vite.config.ts` owns both, so the address the suite
    // waits for and the address the server binds can never drift apart.
    command: "pnpm exec vite preview",
    url: BASE_URL,
    // A leftover server from a previous local run is fine to reuse; in CI the
    // process must be the one this command starts.
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
