/**
 * The consumer page, written the way the README and docs/theming.md §4 say:
 * tokens first, component stylesheet second, consumer CSS last.
 *
 * `ChevronDown` comes from `@raulrod/ui` and not from `@raulrod/icons` because
 * that is what the README documents, and the choice is load-bearing rather than
 * cosmetic: the re-export means `@raulrod/ui`'s runtime imports `@raulrod/icons`,
 * so every step of the external check fails if that cross-package dependency did
 * not survive packing as a real version instead of a `workspace:` link.
 *
 * `Heading as="h1"` and not `Text as="h1"` because `Text` has no `as` prop in
 * this system (a closed decision documented in `Text.tsx`). The typecheck has to
 * see the API as it is, not as one might wish it were.
 */
import { Button, ChevronDown, Heading } from "@raulrod/ui";

import "@raulrod/tokens/styles.css";
import "@raulrod/ui/styles.css";
import "./app.css";

export function App() {
  return (
    <main className="app">
      <Heading as="h1">External consumer</Heading>
      <Button type="button">
        Press me
        <ChevronDown aria-hidden="true" />
      </Button>
    </main>
  );
}
