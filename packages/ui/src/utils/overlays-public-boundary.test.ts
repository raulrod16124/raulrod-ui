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
  // DropdownMenu (RRU-055): two internal providers (root + sub) plus the
  // keyboard internals — all private, same rule as the reset of the overlays.
  "DropdownMenuContext",
  "DropdownMenuSubContext",
  "useDropdownMenuContext",
  "useDropdownMenuSubContext",
  "useMenuKeyboard",
  "focusFirstMenuItem",
  "firstEnabledIndex",
  "lastEnabledIndex",
  "nextItemIndex",
  "prevItemIndex",
  "typeaheadIndex",
  // Select (RRU-057): its own context + the listbox keyboard internals — same
  // rule as the rest of the overlay composites.
  "SelectContext",
  "useSelectContext",
  "useListboxKeyboard",
  "focusSelectedOption",
  // Tabs (RRU-058): its own context — same rule.
  "TabsContext",
  "useTabsContext",
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
