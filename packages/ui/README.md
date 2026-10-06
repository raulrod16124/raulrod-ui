<p align="center">
  <img src="https://raw.githubusercontent.com/raulrod16124/raulrod-ui/main/.github/assets/logo.png" alt="RaulRod UI logo" width="160" />
</p>

<h1 align="center">@raulrod/ui</h1>

<p align="center">React component library for RaulRod UI.</p>

## Installation

```bash
npm install @raulrod/ui
```

Peer dependencies:

- `react >= 18.2.0`
- `react-dom >= 18.2.0`

## Basic usage

Import the component and the stylesheet:

```tsx
import { Button } from "@raulrod/ui";
import "@raulrod/tokens/styles.css";
import "@raulrod/ui/styles.css";

export default function App() {
  return <Button type="button">Get started</Button>;
}
```

## Theming

Load the design tokens before the component styles:

```tsx
import "@raulrod/tokens/styles.css";
import "@raulrod/ui/styles.css";
```

Set `data-theme="light"` or `data-theme="dark"` on `<html>` to switch themes.

## Documentation

- Full documentation and Storybook: <a href="https://raulrod16124.github.io/raulrod-ui" target="_blank" rel="noopener noreferrer">https://raulrod16124.github.io/raulrod-ui</a>
- Repository: <a href="https://github.com/raulrod16124/raulrod-ui" target="_blank" rel="noopener noreferrer">raulrod16124/raulrod-ui</a>
