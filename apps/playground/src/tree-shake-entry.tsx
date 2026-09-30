// Minimal entry point for the tree-shaking / bundle-size check (RRU-092).
//
// This file intentionally imports ONLY `Button` and `ChevronDown` from the
// public API of `@raulrod/ui`. If the package is configured correctly
// (ESM + `sideEffects: false` + conditional `exports`), the produced bundle
// must NOT contain other components or icons from the library.
//
// Keep this file self-contained and free of app sections; it is a measurement
// fixture, not a demo page.
import { createRoot } from "react-dom/client";

import { Button, ChevronDown } from "@raulrod/ui";
import "@raulrod/ui/styles.css";

const container = document.getElementById("root");

if (container === null) {
  throw new Error("tree-shake-entry: no #root element found in index.html");
}

createRoot(container).render(
  <Button type="button">
    Options
    <ChevronDown aria-hidden="true" />
  </Button>,
);
