# @raulrod/icons

Icon set for RaulRod UI. Re-exports the full [lucide-react](https://lucide.dev) catalog with tree-shaking support.

## Installation

```bash
npm install @raulrod/icons
```

`react` is a peer dependency (>= 18.2.0).

## Usage

```tsx
import { ChevronDown, Loader2 } from "@raulrod/icons";

export default function Example() {
  return (
    <button type="button">
      Options <ChevronDown aria-hidden="true" />
    </button>
  );
}
```

## Tree-shaking

The package is configured with `sideEffects: false` and ESM exports, so importing a single icon does not pull the entire catalog into your bundle.

## Catalog

Browse the full icon catalog at [lucide.dev](https://lucide.dev/icons).
