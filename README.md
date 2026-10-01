<p align="center">
  <img src=".github/assets/logo.png" alt="RaulRod UI logo" width="160" />
</p>

<h1 align="center">RaulRod UI</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/@raulrod/ui"><img src="https://img.shields.io/npm/v/@raulrod/ui" alt="npm version" /></a>
  <a href="https://github.com/raulrod16124/raulrod-ui/actions"><img src="https://github.com/raulrod16124/raulrod-ui/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" /></a>
</p>

<p align="center">
  Design System of accessible, composable and tokenized React components.
</p>

<p align="center">
  RaulRod UI provides a stable public API, design tokens, light/dark theming and accessibility built into the components, so each consumer project starts from the same solid base instead of copying and pasting UI code.
</p>

## Installation

```bash
npm install @raulrod/ui @raulrod/tokens @raulrod/icons
```

Peer dependencies:

- `react >= 18.2.0`
- `react-dom >= 18.2.0`

## Quick start

Import the system stylesheet once, then use the public API:

```tsx
import { Button } from "@raulrod/ui";
import "@raulrod/tokens/styles.css";
import "@raulrod/ui/styles.css";

export default function App() {
  return <Button type="button">Get started</Button>;
}
```

## Theming

Load the tokens before the component styles and set the theme on `<html>`:

```tsx
import "@raulrod/tokens/styles.css";
import "@raulrod/ui/styles.css";
```

```html
<html data-theme="dark">
  <!-- ... -->
</html>
```

Available themes: `light` and `dark`.

## Usage example

```tsx
import { Dialog, Button, ChevronDown } from "@raulrod/ui";
import "@raulrod/tokens/styles.css";
import "@raulrod/ui/styles.css";

export function ConfirmDialog() {
  return (
    <Dialog>
      <Dialog.Trigger asChild>
        <Button type="button">
          Open <ChevronDown aria-hidden="true" />
        </Button>
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Are you sure?</Dialog.Title>
        </Dialog.Header>
        <Dialog.Footer>
          <Button type="button">Cancel</Button>
          <Button type="button">Confirm</Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}
```

## Packages

| Package           | npm                                                   | Role                                                                |
| ----------------- | ----------------------------------------------------- | ------------------------------------------------------------------- |
| `@raulrod/ui`     | [View](https://www.npmjs.com/package/@raulrod/ui)     | Public React components (main library entry).                       |
| `@raulrod/tokens` | [View](https://www.npmjs.com/package/@raulrod/tokens) | Design tokens as CSS custom properties.                             |
| `@raulrod/icons`  | [View](https://www.npmjs.com/package/@raulrod/icons)  | Full re-export of `lucide-react`, also re-exposed by `@raulrod/ui`. |

## Design principles

- **Accessibility first** — keyboard, focus and screen-reader support as part of the design.
- **Tokens over hardcoded values** — CSS + CSS variables; no CSS-in-JS; `rr-*` class names.
- **Composition over configuration** — composable public APIs over prop explosions.
- **Public API over internals** — consumers never reach implementation internals.
- **TypeScript strict** — useful public types and errors that guide the consumer.

## Components

| Area         | Components                                                                     |
| ------------ | ------------------------------------------------------------------------------ |
| Foundations  | `Stack`, `Inline`, `Text`, `Heading`, `VisuallyHidden`, `Portal`               |
| Form         | `Input`, `FormField`, `Textarea`, `Checkbox`, `RadioGroup`, `Switch`, `Select` |
| Feedback     | `Badge`, `Avatar`, `Skeleton`, `Progress`, `Toast`                             |
| Overlays     | `Dialog`, `Popover`, `DropdownMenu`, `Tooltip`, `Tabs`                         |
| Data display | `Pagination`, `Table`, `DataTable`                                             |

## Performance

The library ships ESM with `sideEffects: false`, so consumers pay for what they import.

| Scenario                        | JS (gzip) |
| ------------------------------- | --------- |
| Import one component (`Button`) | ~70.8 kB  |
| Import the whole public API     | ~86.7 kB  |
| Total CSS (not tree-shaken)     | ~5.5 kB   |

React itself dominates the single-component number; the design-system code in it is
~2.2 kB. Icon costs stay per-icon (a shared ~4.1 kB lucide runtime plus the icon
module). `@raulrod/tokens` is imported as types only, so its runtime adds nothing to
the bundle.

Reproduce the full baseline (per-component, per-icon, before/after) with:

```bash
pnpm perf:baseline
```

The detailed report is written to `docs/performance.md` (local, not versioned).

## Documentation

- **Storybook** — deployed <a href="https://raulrod16124.github.io/raulrod-ui">here</a>
- **Security policy** — [`SECURITY.md`](SECURITY.md): how to report a vulnerability, what CI gates, and the URL/content contract.
- **Architecture Decision Records** — `docs/decisions/`.

## Development

This repository uses pnpm workspaces and Turborepo. Internal build guides and the work-board live in the `docs/` folder.

## License

[MIT](LICENSE)
