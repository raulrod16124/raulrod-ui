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

// Two stylesheets, one from each package, both by PATH: the `exports` map that
// would make them `@raulrod/<pkg>/styles.css` is RRU-091's work, and until then
// this is the documented way to consume them (docs/theming.md §1). The lint
// exception is on the import and not in the rule, so the exception is visible
// exactly where a reader needs the reason.
/* eslint-disable no-restricted-imports -- RRU-091: subpath exports replace these two paths. */
import "@raulrod/tokens/dist/tokens.css";
import "@raulrod/ui/dist/styles.css";
/* eslint-enable no-restricted-imports */

import { App } from "./app.js";

const container = document.getElementById("root");

if (container === null) {
  // Without this guard the failure would be a React error deep in the mount,
  // which says nothing about the real cause.
  throw new Error("Playground: no #root element found in index.html");
}

createRoot(container).render(<App />);
