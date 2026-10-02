---
"@raulrod/ui": major
---

`1.0.0`: the stable component surface. This release removes two type exports, corrects five components that failed a real contrast or keyboard measurement, and adds the gates that keep them corrected.

**Breaking — two internal context types are no longer exported.** `PopoverContextValue` and `TableContextValue` were re-exported from their component barrels, so `import type { PopoverContextValue } from "@raulrod/ui"` compiled even though both are documented as internal. They are gone from the public entry point. If you were reaching for either, use the supported props types — `Popover`'s and `Table`'s public prop types — which is what the internal types were describing anyway. Nothing changes at runtime.

**Accessibility corrections, each one measured rather than eyeballed.** The contrast gate judges every pair a component paints against what sits behind it, and these were the failures it found:

- **Links in `Button` and `IconButton` variants.** Painted with the primary action's _fill_ token, a token authorized at 3:1 as a control boundary. Link text needs 4.5:1 and measured 3.32:1 at rest in dark, falling to 2.56:1 on hover (2.33:1 against a custom `surface`). They now use `color.link.text` / `color.link.text.hover` (RRU-126).
- **`secondary` on `Button` and `IconButton`, and the `Table` frame.** Edged with `color.border.default`, which measures 1.46:1 against the page — for `secondary` that outline is the entire affordance, and it was effectively invisible. They now use `color.border.strong` (RRU-127). The hairlines _between_ rows stay on `border.default` on purpose: a 1px separator inside a table is decorative, not a boundary.
- **Checked `Checkbox`, `Radio` and `Switch`.** The selected edge used the selected fill's own token, so in dark it fell to 2.56:1 on hover against the page. The fill and the boundary are now separate tokens (`color.border.primary*`) (RRU-128).
- **`Tabs`.** The roving tab stop was computed per trigger as `isSelected || (!stopTaken && isFirstEnabled)` — not a partition, since with `activity` selected, `activity` satisfied the first clause and the first enabled tab satisfied the second. Both carried `tabIndex={0}`, so Tab walked the tabs one at a time instead of landing on the selected one. The root now resolves the stop once (RRU-130).

**Behaviour and security, non-breaking.** `Button` with `target="_blank"` (or `_parent`/`_top`/a named target) now defaults `rel` to `"noopener noreferrer"` instead of requiring the consumer to remember it — passing `rel` still wins, `rel=""` included. `Select` resolves only the _selected_ item's label rather than every item's.

**The public frontier is now derived instead of agreed on.** The two types above leaked because the frontier was described in three places that agreed only by hand: the `exports` maps that decide what resolves, an allowlist in the ESLint config, and the barrels themselves. Each of those is now derived or enforced: `pnpm lint` derives the app-facing import allowlist from the `exports` maps, so a subpath becomes legal when it is declared and illegal when it is not, with no edit to the config; a contract enumerates `apps/*` from the filesystem, checks that every `exports` target exists in `dist/` and stays inside it, and fails if any symbol marked `@internal` is re-exported by a barrel. Storybook-only scaffolding is out of the build.

**Package metadata.** This release is the first that says who owns the code and under what terms: the published manifest now carries `license: "MIT"` (matching the LICENSE at the repository root), a `repository` link pointing at this package's folder, a `homepage`, and a `bugs` tracker — and the license text itself ships inside the tarball, where a consumer unpacking it can read it. Before this, the registry rendered the license of all three packages as `UNKNOWN` and linked to no source, because npm includes a LICENSE only where the file exists and this repository kept its only copy at the root.

**Migration.**

1. If you imported `PopoverContextValue` or `TableContextValue`, switch to the components' public props types.
2. Expect the visual corrections above if you pinned those exact colors: link blue, `secondary` borders, the `Table` frame, and the checked edge of `Checkbox`/`Radio`/`Switch` are now darker in light mode and lighter in dark. This is the fix, not a regression — the previous values failed 3:1 against the page.
