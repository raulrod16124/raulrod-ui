# @raulrod/tokens

Design tokens for RaulRod UI: primitive, semantic and component layers emitted as CSS custom properties.

## Installation

```bash
npm install @raulrod/tokens
```

## Usage

Import the generated stylesheet once at the root of your application:

```tsx
import "@raulrod/tokens/styles.css";
```

Use the tokens in your CSS:

```css
.my-box {
  background: var(--rr-color-background-surface);
  color: var(--rr-color-text-default);
  padding: var(--rr-space-4);
  border-radius: var(--rr-radius-md);
}
```

## Theming

Tokens are scoped to `[data-theme="light"]` and `[data-theme="dark"]`. Set the attribute on `<html>` to switch themes.

## Structure

- **Primitives**: raw values (colors, space, radius, motion, etc.).
- **Semantics**: theme-aware values (`color.text.default`, `color.background.surface`, etc.).
- **Component tokens**: values scoped to specific components (`button.primary.background`).
