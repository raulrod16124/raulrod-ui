---
"@raulrod/ui": patch
---

Keep two internal context types out of the public entry point, and enforce the public API frontier with gates instead of review.

`PopoverContextValue` and `TableContextValue` were re-exported from their component barrels, so a consumer could `import type { PopoverContextValue } from "@raulrod/ui"` and depend on a type documented as internal. Both are removed. **This narrows the type surface**: if you reached for those types, `Popover`'s and `Table`'s public props types are the supported way, and nothing at runtime changes.

The reason they leaked is that the frontier was described in three places that agreed only by hand: the `exports` maps that decide what resolves, an allowlist in the ESLint config, and the barrels themselves. Now `pnpm lint` derives the app-facing allowlist from the `exports` maps (so a new public subpath becomes legal when it is declared and illegal when it is undeclared, with no edit to the config), and a new contract enumerates `apps/*` from the filesystem, checks that every `exports` target exists in `dist/` and stays inside it, and fails if any symbol marked `@internal` is re-exported by a barrel. The Storybook-only scaffolding is also out of the build.
