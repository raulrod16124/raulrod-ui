# @raulrod/ui

React component library for RaulRod UI.

## Installation

```bash
npm install @raulrod/ui
```

`react` and `react-dom` are peer dependencies (>= 18.2.0).

## Basic usage

Import the component and the stylesheet:

```tsx
import { Button } from "@raulrod/ui";
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

- [Storybook](https://raulrod16124.github.io/raulrod-ui) (when deployed)
- Package source: `raulrod16124/raulrod-ui`
