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
  "getFocusableElementsInDocumentOrder",
  "getTopmostModalScopeNodes",
  "pushModalContext",
  "popModalContext",
  "getActiveLayerNodesInContext",
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
  // Toast (RRU-059): the provider context is internal — consumers only see
  // the public `useToast` hook (which reads it); the context object itself
  // must never leak (frontera §24, same rule as the overlays).
  "ToastContext",
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

  // The assertion above is blind to types: a TYPE has no runtime value, so
  // `publicEntries[name]` is `undefined` whether or not the barrel exports it.
  // Two of the leaks this task closed (`PopoverContextValue`, `TableContextValue`)
  // were invisible to that loop, so naming them in a runtime list would have
  // been decorative — a second assertion that passes either way.
  //
  // `pnpm typecheck` is the instrument here. `@ts-expect-error` suppresses "no
  // exported member" today; if a name ever becomes exported the suppression
  // stops suppressing anything and tsc fails with "Unused '@ts-expect-error'
  // directive" — so the leak makes the probe itself the failure. The `expect`
  // below carries no weight of its own; it only keeps the array referenced, and
  // its count is the number of names under watch.
  it("keeps the internal context types unreachable from the public entry", () => {
    const unreachable = [
      // @ts-expect-error — `DialogContextValue` is internal: not public API.
      () => undefined as unknown as Public.DialogContextValue,
      // @ts-expect-error — `PopoverContextValue` is internal: not public API.
      () => undefined as unknown as Public.PopoverContextValue,
      // @ts-expect-error — `DropdownMenuContextValue` is internal: not public API.
      () => undefined as unknown as Public.DropdownMenuContextValue,
      // @ts-expect-error — `FormFieldContextValue` is internal: not public API.
      () => undefined as unknown as Public.FormFieldContextValue,
      // @ts-expect-error — `RadioGroupContextValue` is internal: not public API.
      () => undefined as unknown as Public.RadioGroupContextValue,
      // @ts-expect-error — `TableContextValue` is internal: not public API.
      () => undefined as unknown as Public.TableContextValue,
    ];

    expect(unreachable).toHaveLength(6);
  });
});
