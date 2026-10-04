# @raulrod/ui

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
