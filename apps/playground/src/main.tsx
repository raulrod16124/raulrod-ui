// Entry point of the playground (RRU-069).
//
// Two consumer-level facts are encoded here, and both are import-order
// dependent on purpose:
//
//  1. THE STYLESHEET IS IMPORTED BY THE CONSUMER, not by the components. The
//     package is `sideEffects: false` (ADR-007), so nothing inside
//     `@raulrod/ui` imports its own CSS; a single import here is what styles
//     the app. Until RRU-091 formalizes the `exports` map, both artifacts are
//     consumed by path — the same rule `docs/theming.md` documents for
//     `@raulrod/tokens`.
//  2. THIS FILE IMPORTS THE SYSTEM CSS BEFORE `./app.js`, and `app.tsx` is what
//     pulls the app's own stylesheet. Vite collects CSS in module evaluation
//     order, so the system always lands first and consumer overrides always
//     win the cascade. Renaming or moving these two imports inverts it
//     silently, which is why the reason lives here and not in a comment inside
//     the stylesheet.
import { createRoot } from "react-dom/client";

// Two stylesheets, one from each package, both through the public subpath
// exports formalized in RRU-091 (`@raulrod/<pkg>/styles.css`). The consumer
// controls load order: system CSS first, then app CSS, so overrides win the
// cascade without fighting specificity.
import "@raulrod/tokens/styles.css";
import "@raulrod/ui/styles.css";

import { App } from "./app.js";

const container = document.getElementById("root");

if (container === null) {
  // Without this guard the failure would be a React error deep in the mount,
  // which says nothing about the real cause.
  throw new Error("Playground: no #root element found in index.html");
}

createRoot(container).render(<App />);
