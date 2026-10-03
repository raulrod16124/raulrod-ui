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

Both ends of that range are exercised, not just declared. `pnpm verify:external:react18` installs
the packages from a `pnpm pack` tarball into a throwaway project outside the repository and runs the
consumer's own gates on them — `tsc --noEmit` in `bundler` and `node16`, `renderToString()` under
Node ESM, a `vite build`, and the six theme states in Chromium. It does so twice: on **18.2.0**,
the declared floor, and on the newest 18.x. React 19 is covered by the same tool as the default.

So: the range is verified at its lower bound and its upper bound for the same major, and the
verifier prints the React version it actually got from `node_modules` rather than the range it
asked npm for.

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

Load the tokens **before** the component stylesheet (see the Quick start above) and set the
theme on `<html>`:

```html
<html data-theme="dark">
  <!-- ... -->
</html>
```

Available themes: `light` and `dark`. Leaving the attribute off follows the OS
(`prefers-color-scheme`).

## Usage example

```tsx
import {
  Button,
  ChevronDown,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@raulrod/ui";
import "@raulrod/tokens/styles.css";
import "@raulrod/ui/styles.css";

export function ConfirmDialog() {
  return (
    <Dialog>
      <DialogTrigger>
        Remove account <ChevronDown aria-hidden="true" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
        </DialogHeader>
        <DialogFooter>
          <Button type="button">Cancel</Button>
          <Button type="button">Confirm</Button>
        </DialogFooter>
      </DialogContent>
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

- **Demo script** — [`DEMO.md`](DEMO.md): a five-minute tour of the repository, what each part
  demonstrates, what it does not prove, and the fifteen questions this project should be able to
  answer. Every claim in it is verified against the tree by `pnpm check:demo`.
- **Storybook** — deployed <a href="https://raulrod16124.github.io/raulrod-ui">here</a>
- **Security policy** — [`SECURITY.md`](SECURITY.md): how to report a vulnerability, what CI gates, and the URL/content contract.
- **Architecture Decision Records** — `docs/decisions/`.

## Development

This repository uses pnpm workspaces and Turborepo. Internal build guides and the work-board live in the `docs/` folder.

`apps/playground` is a consumer application that installs the three packages the way an external
project would, and it is where the installation itself is tested.
[`apps/playground/README.md`](apps/playground/README.md) lists what it validates and which gate
proves it; run it with `pnpm dev:playground`.

The playground resolves `dist/` by workspace link, so it cannot answer what someone outside this
repository gets. `pnpm verify:external` answers exactly that: it builds a throwaway project in the
OS temp directory, installs the packages into it with `npm` — the package manager a consumer is
most likely to use, and the one that rejects what a workspace link accepts — and then typechecks it
in two resolution modes, renders it under Node ESM, builds it with Vite and reads the theme in
Chromium.

```bash
pnpm verify:external                      # both routes
pnpm verify:external --route=tarball      # what the next release would upload
pnpm verify:external --route=registry     # what is on npm today
pnpm verify:external --no-browser         # skip the Chromium pass
```

The two routes answer different questions. `tarball` packs the working tree, so it covers
uncommitted work. `registry` installs `@raulrod/*@latest`, so it can be wrong because of a past
release rather than of the current tree — and when the published version differs from the one in
`packages/`, the run says so rather than letting a green result imply it validated your checkout.

It needs the network, so the CI job runs the `--no-browser` route (`verify:external --route=tarball
--no-browser`) against a real published tarball on every PR: the theme question is answered as text
in the built CSS there, which is cheaper than re-installing a browser for it — the `e2e` job already
covers the real browser. The React 18 pass (`verify:external:react18`) stays manual and
release-time, because the peer floor is declared `>=18.2.0` and proving one major proves nothing
about the other. The part of the same question that can be re-checked offline on every commit is
`apps/playground/src/published-install.test.ts`.

## License

[MIT](LICENSE)
