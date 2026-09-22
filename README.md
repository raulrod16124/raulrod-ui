# RaulRod UI

Design System for reusable, accessible, and composable UI.

RaulRod UI is the shared UI infrastructure for Raúl's personal projects. It provides a stable public API, design tokens, light/dark theming, and accessibility built into the design, so each consumer project starts from the same solid base instead of copying and pasting UI code.

> **Status:** in active development. The structure below is the target for the MVP; only part of it is implemented so far. The packages are not published yet — see the [Roadmap](#roadmap).

## Packages

| Package           | Role                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------- |
| `@raulrod/ui`     | Public React components (main library entry).                                                                 |
| `@raulrod/tokens` | Design tokens: color, typography, spacing, radius, shadow, motion, z-index, breakpoints, and semantic tokens. |
| `@raulrod/icons`  | Icons: full re-export of `lucide-react`; re-exposed by `@raulrod/ui`.                                         |

## Requirements

- React `>= 18.2.0` as a peer dependency (compatible with React 19).
- Node.js 24 LTS (Active LTS, "Krypton", supported until Apr 2028) + pnpm. Use `nvm install 24 && nvm use` (see [`.nvmrc`](./.nvmrc)).

## Installation

No registry release exists yet; the first published version is planned (`v1.0.0`, see roadmap — Packaging & releases).

```bash
pnpm add @raulrod/ui @raulrod/tokens @raulrod/icons
```

Import the system stylesheet once, then use the public API:

```tsx
import { Button, Dialog, ChevronDown } from "@raulrod/ui";
import "@raulrod/ui/styles.css";
```

## Usage

```tsx
<Button variant="primary" startIcon={<ChevronDown />}>
  Open dialog
</Button>
```

## Planned MVP components

| Area         | Components                                                                     |
| ------------ | ------------------------------------------------------------------------------ |
| Foundations  | `Stack`, `Inline`, `Text`, `Heading`, `VisuallyHidden`, `Portal`               |
| Form         | `Input`, `FormField`, `Textarea`, `Checkbox`, `RadioGroup`, `Switch`, `Select` |
| Feedback     | `Badge`, `Avatar`, `Skeleton`, `Progress`, `Toast`                             |
| Overlays     | `Dialog`, `Popover`, `DropdownMenu`, `Tooltip`, `Tabs`                         |
| Data display | `Pagination`, `Table`, `DataTable`                                             |

## Design principles

- **Accessibility first** — keyboard, focus, and screen-reader support as part of the design.
- **Tokens over hardcoded values** — CSS + CSS variables; no CSS-in-JS; `rr-*` class names.
- **Composition over configuration** — composable public APIs over prop explosions.
- **Public API over internals** — consumers never reach implementation internals.
- **TypeScript strict** — useful public types and errors that guide the consumer.

## Roadmap

1. **Phase 0 — Product definition** (code-pegs product doc; in progress)
2. **Phase 1 — Monorepo + tooling** (pnpm workspace, Turborepo, strict TS, ESLint, CI)
3. **Phase 2 — Design tokens + theming** (light/dark, CSS custom properties)
4. **Phase 3 — Foundations / primitives**
5. **Phase 4 — Core components**
6. **Phase 5 — Complex interactive components** (overlays, keyboard navigation, focus management)
7. **Phase 6 — Data display**
8. **Phase 7 — Testing + accessibility** (unit, component, E2E; manual a11y review)
9. **Phase 8 — Storybook + documentation + DX**
10. **Phase 9 — Packaging + releases** (ESM, types, Changesets, publish)
11. **Phase 10 — Performance + hardening**
12. **Phase 11 — Portfolio / production demo**

## Resources

- **Architecture Decision Records** — planned at `docs/decisions/` as the project advances.
- The build guide, product definition, and the work-board live in the internal `docs/` folder.

## License

[MIT](LICENSE)
