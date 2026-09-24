// Public-frontier guard for the overlay infrastructure (RRU-052, DoD #3): the
// shared hooks + z-index layer helper are INTERNAL (ADR-004 alternative C,
// frontera §24) and must not leak into the public API. Behavioral check on the
// real entry point: import the public module and assert the internals are NOT
// part of it. If someone re-exports an internal, the cast below finds the
// function and the assertion fails — fail-loud on the frontier.
import { describe, expect, it } from "vitest";

import * as Public from "../index.js";

const INTERNAL_EXPORTS = [
  "useFocusTrap",
  "useFocusReturn",
  "useDismissableLayer",
  "useScrollLock",
  "resolveLayerVar",
  "LAYER_ORDER",
  "getFocusableElements",
  "isFocusableElement",
  "mergeRefs",
  "computePopoverPosition",
  "usePopoverPosition",
  // Dialog (RRU-053): single context per composite, never public (ADR-004).
  "DialogContext",
  // Popover (RRU-054): same rule as Dialog.
  "PopoverContext",
  "usePopoverContext",
] as const;

describe("overlay infrastructure is private (DoD #3)", () => {
  it("is not exported from the public entry point", () => {
    // Cast only for the assertion: reading a member we KNOW is absent would be a
    // type error otherwise (docs/typescript.md — `as` justified by the test intent).
    const publicEntries = Public as unknown as Record<string, unknown>;

    for (const name of INTERNAL_EXPORTS) {
      expect(
        publicEntries[name],
        `public entry must not export internal \`${name}\``,
      ).toBeUndefined();
    }
  });
});
