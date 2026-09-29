// Vitest setup for @raulrod/ui (RRU-068). Loaded via `setupFiles` in
// `vitest.config.ts`; it is the single place where the harness is wired.
//
// 1. jest-dom matchers (`.toBeInTheDocument()`, `.toHaveClass()`, …) extend
//    Vitest's `expect` with the canonical DOM assertions.
// 2. jest-axe `toHaveNoViolations` extends `expect` so every component spec can
//    assert automated a11y (Playbook §4 Paso 4, DoD of RRU-068). jest-axe is
//    used directly instead of a third-party wrapper: the card names it, and the
//    public `toHaveNoViolations` export is framework-agnostic.
// 3. React 19 testing mode, so DOM events dispatched outside React (the overlay
//    specs model key/pointer sequences) run under a testing-mode `act` without
//    the "not configured to support act" warning.
// 4. Explicit `cleanup` between tests: the suite runs with `globals: false`, so
//    Testing Library's automatic cleanup (which hooks the global `afterEach`)
//    is not installed, and unmounting between tests is what keeps portals,
//    focus traps and timers from leaking into the next case.
import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { toHaveNoViolations } from "jest-axe";
import { afterEach, expect } from "vitest";

// `toHaveNoViolations` is a 0-arg matcher whose subject is the axe result set,
// so it satisfies Vitest's `MatchersObject` once the ambient declaration is
// spread (see `jest-axe.d.ts`).
expect.extend({ ...toHaveNoViolations });

afterEach(() => {
  cleanup();
});

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
