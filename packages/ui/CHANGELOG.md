# @raulrod/ui

## 1.1.0

### Minor Changes

- [#16](https://github.com/raulrod16124/raulrod-ui/pull/16) [`5020a02`](https://github.com/raulrod16124/raulrod-ui/commit/5020a0248e7e8ead71c210d45863578c3833a450) Thanks [@raulrod16124](https://github.com/raulrod16124)! - feat(ui): add typed `styles` and `classNames` escape hatches (RRU-147)

  - Add `styles?: Styles<"...">` to all public components that render DOM. The type is derived from the component's own CSS via `tools/derive-style-types.mjs`, so only tokens the component actually consumes are accepted.
  - Add `classNames?: { [slot]: string }` to compound components. The root distributes the classes to its public slots through the existing React context; internal `rr-*` selectors remain implementation details.
  - Add `mergeStyles` utility and preserve the merge order: component styles → `styles` → consumer `style` wins on collision.
  - Add representative stories (`Button.StylesOverride`, `FormField.ClassNamesOverride`, `Dialog.ClassNamesOverride`) and the "Cuándo sobrescribir" Storybook guide.
  - Update ADR-009 implementation notes and component-pattern.mdx §5.1 with the merge order and AA responsibility boundary.

### Patch Changes

- [#16](https://github.com/raulrod16124/raulrod-ui/pull/16) [`f60027f`](https://github.com/raulrod16124/raulrod-ui/commit/f60027f9b80ec7b37b93b1ac842d200ad21922e3) Thanks [@raulrod16124](https://github.com/raulrod16124)! - fix(ui): stop long button labels and layout primitives from overflowing (RRU-136)

  - Button: add `min-width: 0` and `overflow-wrap: anywhere` so an unbroken label (e.g., an id) wraps instead of pushing its row sideways at narrow widths.
  - IconButton: add default `size=md` geometry to the base class (width/height/padding) and keep `flex-shrink: 0`; document that `min-width: 0` is not added because `min-width: auto` already floors min-content for icon-only buttons. The parity between the base class and `--size-md` is now enforced by a contract test.
  - Inline/Stack: set `min-width: 0` to allow flex children to wrap/shrink inside constrained containers.
  - Add NarrowContainer helper to Storybook support and Responsive stories for Button, IconButton, Inline, Stack.
  - Add the literal↔token gate to css-contracts (width conditions must use breakpoint px literals derived from `@raulrod/tokens`, `@media` width only for dialog/toast, and `@container` requires a `container-type`).

- [#16](https://github.com/raulrod16124/raulrod-ui/pull/16) [`b54c77f`](https://github.com/raulrod16124/raulrod-ui/commit/b54c77f4d71da137b78ed0a0e7ec924ed74af6a5) Thanks [@raulrod16124](https://github.com/raulrod16124)! - fix(ui): bound floating overlays to the viewport so long content cannot open a panel wider or taller than the screen (RRU-137)

  - Popover, DropdownMenu and Tooltip: add `max-inline-size: min(calc(var(--rr-space-16) * 6), calc(100vw - 2 * var(--rr-space-4)))`, matching the existing `Toast` mold — the durable term caps a panel at 384px on desktop, the viewport term keeps `space-4` clear on each edge at 320px.
  - Add `box-sizing: border-box` to the three panel roots. This is load-bearing, not cosmetic: the package ships no `box-sizing` reset, so both clamps otherwise measure the content box and the padding lands outside the bound. Measured with the E2E at a 320×360 viewport — a panel 320px wide and 360px tall, flush with all four edges, and 416px on desktop instead of 384px — while every "fits the viewport" assertion still passed.
  - Popover and DropdownMenu: add `max-block-size: calc(100dvh - 2 * var(--rr-space-4))` and `overflow: auto`, so content taller than the screen scrolls instead of clipping. The menu's scrollport is keyboard-reachable because every item is a focusable `menuitem`.
  - Tooltip: add `overflow-wrap: anywhere` and deliberately **no** `max-block-size`/`overflow: auto`. The tooltip is not focusable and is not a focus trap, so a scrollport there would be content no keyboard user can reach; it wraps instead. This is the documented deviation from the card's DoD, enforced by the CSS contract test as well as documented.
  - Use `100dvh` rather than `100vh` for the block bound: a fixed overlay tracks the visual viewport. Recorded in ADR-008 so the Dialog/Toast family inherits the decision.
  - Add `blockOverflowPx` and `expectNothingClipped` E2E helpers. `overflowPx` measures the inline axis only, which reports zero for a panel whose text wraps at the clamp — the wrong axis would have called a clipping panel unclipped.
  - Add the bounded-panel contract to css-contracts (`BOUNDED_PANELS`), with negative probes for a missing bound, a bound that does not name the viewport, a clipping `overflow`, a missing block bound, a content-box clamp, and the scrollport the tooltip must not have.
  - Add a 500-character case per component to the playground and a geometric E2E spec at 320px and 1280px, plus `Responsive` stories for the three components. No public API change.

- [#16](https://github.com/raulrod16124/raulrod-ui/pull/16) [`a73bcc2`](https://github.com/raulrod16124/raulrod-ui/commit/a73bcc2b9fa359a860f9f12cb44f2398c961ba29) Thanks [@raulrod16124](https://github.com/raulrod16124)! - fix(ui): size the Select listbox to its trigger instead of to its content (RRU-138)

  - `Select.Content` now adopts the width of its trigger, up to 384px and never wider than the viewport minus 16px on each side. Before this, the panel was `position: fixed` with no width of its own, so it was shrink-to-fit: measured at a 320×360 viewport it opened 312px wide — wider than the 272px field under it, and wider than the 320px screen it was meant to fit — while every "fits the viewport" assertion still passed. The other three overlays are unchanged: they size to their content on purpose.
  - Add `box-sizing: border-box` to the listbox and to `.rr-select-item`. The panel's `box-sizing` is not inherited, so an item with `width: 100%` and `space-3` padding measured 24px wider than the box it had to fill and the listbox scrolled **sideways** to reach its options (`scrollWidth` 336 against a `clientWidth` of 312). The same missing reset made the block clamp measure the content box, so a panel declared `max-height: 320px` measured 328px.
  - Add `max-inline-size: min(calc(var(--rr-space-16) * 6), calc(100vw - 2 * var(--rr-space-4)))` and `max-block-size: calc(100dvh - 2 * var(--rr-space-4))` with `overflow: auto` to the listbox, following the RRU-137 `Toast` mold. The durable term is load-bearing here: matching a 1024px trigger would put twelve options on single short lines with the chevron stranded far from its labels. The scrollport is keyboard-reachable because the options own the roving tabindex.
  - Add `overflow-wrap: anywhere` to `.rr-select-item` (the RRU-136 long-label policy — a 40-character plan name costs two lines instead of a panel off the screen) and `min-width: 0` to `.rr-select-trigger`. The trigger's floor was measured rather than assumed: it is a `<button>`, not the `<input size=20>` the card assumed, and at 320px it already reaches the available width because `.rr-select-value` declares its own `min-width: 0`. The declaration is kept because it has no observable effect today and becomes load-bearing for raw text children.
  - Add an opt-in `matchAnchorWidth` to `usePopoverPosition`, which writes `inline-size` (not `min-inline-size`: the CSS minimum beats the clamp) before measuring the panel. `Select` is the only caller.
  - Extend the bounded-panel contract to the listbox, and add a contract for the two declarations no other gate would notice missing, with negative probes for both.
  - Add a twelve-option `Select` to the narrow playground section, four geometric E2E cases (320×360 and 1280×900: width match, wrapping, focus order through the scrollport, and the desktop cap), and a `Responsive` story. No public API change.

- [#16](https://github.com/raulrod16124/raulrod-ui/pull/16) [`c3a7155`](https://github.com/raulrod16124/raulrod-ui/commit/c3a7155cab4f0a963473a4980a6066be1557e565) Thanks [@raulrod16124](https://github.com/raulrod16124)! - fix(ui): keep Dialog and Toast inside the viewport they measure (RRU-139)

  - `Dialog.Content` is now bounded by the height the overlay actually leaves it: `max-block-size: calc(100dvh - 2 * var(--rr-space-6))`. Before this the cap said `calc(100vh - var(--rr-space-8))` — a different padding token, 32px against 24px, and only one side subtracted — so the cap and the overlay's gutter never agreed. Measured at a 320×360 viewport, a panel whose content exceeded the cap rendered **376px tall inside a 312px content box**: 32px of rounded border above and 32px below, off-screen, including part of the title. It did not shrink, because the overlay centres its content and an item taller than the line overflows equally on both sides. The cap is now `100dvh` rather than `100vh`, inherited from the RRU-137 ADR-008 addendum: a fixed overlay tracks the _visual_ viewport, so with the browser bar visible `vh` would let the panel hide under it.
  - Add `box-sizing: border-box` to `.rr-dialog-content`. Load-bearing rather than hygienic: the package ships no reset, so without it `max-block-size` measures the content box, the `space-6` padding lands outside the cap, and the border box comes out at `100dvh` — flush with the screen edges, the exact outcome the overlay's padding exists to prevent. Same reason RRU-137 put it on the floating panels and RRU-138 on `.rr-select-item`.
  - Add `flex-wrap: wrap` to `.rr-dialog-footer`. The card's premise that long actions overflow at 320px was measured and is **false** — `scrollWidth` minus `clientWidth` was exactly 0 — because RRU-136's `min-width: 0` and `overflow-wrap: anywhere` let the buttons shrink instead: three of them at ~65px wide and 96–114px tall, labels wrapped over three and four lines, on one row as tall as a paragraph. The buttons now keep their natural width (161–193px, one line each) and wrap onto as many rows as they need.
  - `Toast`'s stack is bounded in the **block** direction for the first time: `max-block-size: calc(100dvh - 2 * var(--rr-space-4))` with `overflow-y: auto`. Measured before this, one long notification rendered 422px tall in a 360px viewport with `overflow-y: visible`, so 78px of its description sat below the fold with no scrollport to reach it through. The scrollport is keyboard-reachable because every toast carries a focusable dismiss button, which is the same argument the `DropdownMenu` scrollport rests on.
  - Resolve the stack's inline axis with `inset` on both edges plus a durable `max-inline-size: calc(var(--rr-space-16) * 6)`, replacing `width: min(..., calc(100vw - 2 * var(--rr-space-4)))`. `100vw` includes the scrollbar while the `inset-inline-end` the stack is positioned against does not, so below 416px the two disagreed by ~15px. `margin-inline-start: auto` is what keeps the clamped card hugging the **end** edge: with both insets set and `width: auto` the box fills the space, and in LTR the leftover would otherwise go to the left. Desktop geometry is unchanged (384px wide, 16px from the right edge).
  - Extend the source-level contract to both panels with negative probes. It is a separate contract from the RRU-137 four, not a fifth entry: `Dialog`'s width is a centred grid item bounded by the overlay's padding rather than a `100vw` term, and `Toast` is the `inset` shape the existing rule would reject. The gate compares the cap against the gutter **in the same stylesheet**, so a cap written correctly against the wrong token is caught. The `100vw` reversion is the one mutation the E2E cannot see — headless Chromium reserves no scrollbar, so `innerWidth === clientWidth` — and reverting it leaves all seven specs green; the gate holds that one, the measurement holds the rest.
  - Add seven geometric E2E cases in `viewport-panels.spec.ts` (320×360 and 1280×900: the cap arithmetic, scrolling to the last action, footer rows, focus through the stack's scrollport, and the desktop card), an `animationsSettled` helper — `getBoundingClientRect` reports the _transformed_ box, and measuring during the entry animation read 305.76px for a 312px panel — a `Responsive` story for both components, and fixtures in the narrow playground section. No public API change.

- [#16](https://github.com/raulrod16124/raulrod-ui/pull/16) [`c94e02f`](https://github.com/raulrod16124/raulrod-ui/commit/c94e02fc11819cbea867525b6b56f3b583b19025) Thanks [@raulrod16124](https://github.com/raulrod16124)! - Make `Table` and `DataTable` responsive at narrow widths (RRU-140).

  - `Table` now declares `container-type: inline-size` and automatically drops to
    the `sm` density when its own wrapper is at most `breakpoint.sm` wide.
  - Long unbroken content in cells wraps via `overflow-wrap: anywhere`, so the
    horizontal scrollport is the table's own wrapper instead of the page.
  - `DataTable` no longer uses a breakpoint custom property as a `flex-basis`;
    the toolbar filter uses the literal `640px` and the pagination slot wraps.
  - A new playground E2E asserts no page overflow and a real sticky header in a
    bounded scrollport at 320px and 1280px.

- [#16](https://github.com/raulrod16124/raulrod-ui/pull/16) [`3ab21e7`](https://github.com/raulrod16124/raulrod-ui/commit/3ab21e7c3b9ace39c06e492d41c9304833091374) Thanks [@raulrod16124](https://github.com/raulrod16124)! - fix(ui): scroll the Pagination and Tabs rails when space is tight (RRU-141)

  - Pagination: add per-node modifiers `--prev`, `--next`, `--number` and collapse to previous/current/next inside a narrow container with `container-type: inline-size` and `@container (max-width: 640px)`. The DOM keeps every node (SSR/a11y structure is unchanged); only the visual rendering is suppressed.
  - Tabs: turn `.rr-tabs-list` into a horizontal scrollport with `overflow-x: auto` and `scroll-snap-type: inline proximity`; triggers snap to `start`. The existing `outline-offset: -2px` focus ring survives the clipping ancestor.
  - DataTable: add `flex: 1 1 auto` to `.rr-data-table__pagination`. Without it, `container-type: inline-size` on the composed `<nav>` collapses the pager to zero width because it is a flex item of `.rr-data-table__footer` with no flex-grow.
  - Add responsive-contract tests for both components, `Responsive` stories with `NarrowContainer`, a `navigation-section.tsx` playground fixture, and a geometric E2E spec at 320px and 1280px. The keyboard test asserts that arrowing past the fold keeps the focused tab inside the visible rail. No public API change.

- [#16](https://github.com/raulrod16124/raulrod-ui/pull/16) [`933cefe`](https://github.com/raulrod16124/raulrod-ui/commit/933cefe363132b3c574e6593fc51c2fb8fff421c) Thanks [@raulrod16124](https://github.com/raulrod16124)! - fix(ui): stop form controls from overflowing narrow rows (RRU-142)

  - Input: declare `min-width: 0` on `.rr-input` so the replaced element can shrink below the UA's intrinsic `size=20` floor when composed as a flex/grid item.
  - Textarea: declare `min-width: 0` on `.rr-textarea` and on `.rr-textarea-autosize`, covering both the bare control and the autosize grid wrapper.
  - Radio: make `.rr-radio-group--horizontal` wrap with `flex-wrap: wrap`, and let `.rr-radio-label` shrink with `min-width: 0` and break long words with `overflow-wrap: anywhere`.
  - FormField: declare `min-width: 0` on `.rr-form-field` and `.rr-form-field-control`, without adding `width: 100%` to avoid changing composition inside `Inline` rows. Width remains a consumer decision.
  - Add `Responsive` stories for Input, Textarea, Radio and FormField (which previously had no stories file). Document the current named-slot exports in `FormField.mdx` and note the missing dot-notation API as a future API-facing decision.
  - Add `*.responsive-contract.test.ts` source-level gates for all four components, plus a `form-responsive-section.tsx` playground fixture and a geometric E2E spec at 320px and 1280px. The E2E uses fixed 200px frames and asserts that inputs shrink below their intrinsic floor, textareas stay inside the frame, horizontal radio groups wrap, and FormField shrinks as a flex item. No public API change.

- [#16](https://github.com/raulrod16124/raulrod-ui/pull/16) [`ec1564f`](https://github.com/raulrod16124/raulrod-ui/commit/ec1564fc5f8e9a337c29aad8baeedc5a04e94410) Thanks [@raulrod16124](https://github.com/raulrod16124)! - fix(ui): keep long words inside narrow containers (RRU-143)

  - `Text`, `Heading`, `Badge` and `Switch.label` now declare `overflow-wrap: anywhere` so unbreakable tokens (URLs, ids, hashes) wrap instead of overflowing narrow containers.
  - `Switch.label` and `Badge` also declare `min-width: 0` so they can shrink as flex items without crushing their text.
  - Add `Responsive` stories for `Checkbox`, `Switch`, `VisuallyHidden` and `Portal`, and upgrade the existing thin `Responsive` stories of `Avatar`, `Badge`, `Skeleton`, `Progress`, `Text` and `Heading` to the NarrowContainer + `parameters.viewport` pattern.
  - Add `packages/ui/src/fluid-contract.test.ts`: a table-driven source-level gate that pins the six genuinely fluid components and the four fixes, plus ADR-005 negative probes.
  - Add `apps/playground/src/fluid-responsive-section.tsx` and `apps/playground/e2e/fluid-responsive.spec.ts` with geometric assertions at 320px and 1280px. No public API change.

## 1.0.1

### Patch Changes

- [#13](https://github.com/raulrod16124/raulrod-ui/pull/13) [`1ac7d69`](https://github.com/raulrod16124/raulrod-ui/commit/1ac7d699dba34decd324df635986b24c9011fb1a) Thanks [@raulrod16124](https://github.com/raulrod16124)! - `Table` no baja el contraste de su mensaje de error al pasar el puntero por encima (RRU-129).

  La fila de error se renderiza como un `<tr>` real dentro de `<tbody class="rr-table__body">`, así que la regla de hover de fila —que pinta `background.sunken`— le llegaba igual que a cualquier fila de datos. Medido, `text.danger` sobre ese fondo daba **4.26:1 en light**, por debajo del 4.5:1 que el texto necesita; en dark daba 4.68:1 y pasaba.

  El defecto llevaba tiempo invisible porque su causa no está en el CSS: la relación entre la celda de error y el hover de su fila vive en el JSX. Una gate que lee stylesheets no puede derivarla, y como la celda no pintaba superficie propia, además se medía contra el fondo de la página — donde ese rojo sí está autorizado. Estaba a la vez sin medir y sin ver.

  **Qué cambia.** La celda de error ahora pinta su propia superficie (`background.default`), de modo que el hover de fila ya no alcanza a su texto y el par pasa a ser `text.danger` sobre `background.default`, que es un par ya autorizado y verificado en los dos temas (4.83:1 light / 6.19:1 dark). No hay tokens nuevos y no hay ningún otro componente tocado.

  **Efecto visual.** La fila de error ya no se resalta al pasar por encima. Es intencionado: es un mensaje de estado, no una fila de datos, y el hover de fila está documentado como previsualización no interactiva. Las filas de datos siguen resaltándose igual.

  **Migration.** None. No cambia la API, ni el markup, ni los nombres de clase. El único cambio es el color de fondo de una celda de estado concreta.

## 1.0.0

### Major Changes

- [#11](https://github.com/raulrod16124/raulrod-ui/pull/11) [`ba0c98b`](https://github.com/raulrod16124/raulrod-ui/commit/ba0c98bb0a54b24d334d1b92fdef38df9f7e6f9f) Thanks [@raulrod16124](https://github.com/raulrod16124)! - `1.0.0`: the stable component surface. This release removes two type exports, corrects five components that failed a real contrast or keyboard measurement, and adds the gates that keep them corrected.

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

### Patch Changes

- Updated dependencies [[`ba0c98b`](https://github.com/raulrod16124/raulrod-ui/commit/ba0c98bb0a54b24d334d1b92fdef38df9f7e6f9f), [`ba0c98b`](https://github.com/raulrod16124/raulrod-ui/commit/ba0c98bb0a54b24d334d1b92fdef38df9f7e6f9f)]:
  - @raulrod/icons@1.0.0
  - @raulrod/tokens@1.0.0

## 0.1.2

### Patch Changes

- [#8](https://github.com/raulrod16124/raulrod-ui/pull/8) [`dc1c298`](https://github.com/raulrod16124/raulrod-ui/commit/dc1c298509317bf1705982443923d47c0a984630) Thanks [@raulrod16124](https://github.com/raulrod16124)! - Add README files to published packages and configure GitHub-linked changelogs.
- Updated dependencies [[`dc1c298`](https://github.com/raulrod16124/raulrod-ui/commit/dc1c298509317bf1705982443923d47c0a984630)]:
  - @raulrod/tokens@0.1.2
  - @raulrod/icons@0.1.2

## 0.1.1

### Patch Changes

- 9fb4f2e: Initial stable release
- Updated dependencies [9fb4f2e]
  - @raulrod/icons@0.1.1
  - @raulrod/tokens@0.1.1

## 0.1.0

### Minor Changes

- Initial publishable release setup with Changesets independent versioning

### Patch Changes

- Updated dependencies
  - @raulrod/tokens@0.1.0
  - @raulrod/icons@0.1.0
