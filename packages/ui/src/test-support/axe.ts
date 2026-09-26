// Automated a11y helpers (RRU-068, DoD #2: "jest-axe disponible en los tests de
// componentes").
//
// The `toHaveNoViolations` matcher is installed globally in `setup.ts`, so a
// spec can always assert `expect(await axe(container)).toHaveNoViolations()`.
// This module adds the DS-specific policy on top of the raw runner:
//
//   - `color-contrast` is disabled. axe-core needs real layout to resolve
//     foreground/background colors, and no JSDOM-like environment can provide
//     it, so the rule can only ever return `incomplete` here. Contrast is not
//     left untested: the authorized token pairs are enforced by the
//     `@raulrod/tokens` gate (RRU-021, WCAG formula) and by the final QA pass
//     (RRU-072). Keeping the rule on would produce a green suite full of
//     meaningless "incomplete" noise, or worse, false confidence.
//   - `region` is disabled for partial fragments: a spec that renders a single
//     control is not required to wrap it in a landmark (the consumer's page
//     does that). Specs that assert a full page composition should not opt out.
import type { AxeResults, RunOptions } from "axe-core";

import { axe } from "jest-axe";

const DEFAULT_AXE_OPTIONS: RunOptions = {
  rules: {
    "color-contrast": { enabled: false },
    region: { enabled: false },
  },
};

/** Runs axe with the DS rule policy over an element (defaults to the whole document). */
export function auditA11y(target: Element = document.body): Promise<AxeResults> {
  return axe(target, DEFAULT_AXE_OPTIONS);
}
