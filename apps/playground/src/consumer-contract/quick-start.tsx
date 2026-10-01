// README "Quick start", mirrored VERBATIM (RRU-110).
//
// This file is not an illustration of the README — it is the same text, and
// `consumer-contract.test.ts` fails if the two ever diverge. The reason is not
// tidiness: the README snippet is the FIRST code a consumer compiles, and this
// app is the only place in the repo where that snippet is actually type-checked.
// Before this mirror existed, the README documented an API that did not exist
// (`Dialog.Trigger asChild`) and nothing in CI noticed, because fenced Markdown
// is prose until someone compiles it.
//
// Mirroring means the snippet must stay copy-pasteable, so it keeps its own
// `App` component and its own stylesheet imports: nothing else in this file may
// change it. It is rendered by `section.tsx`, which is what keeps it a live
// consumer instead of code that only type-checks.

import { Button } from "@raulrod/ui";
import "@raulrod/tokens/styles.css";
import "@raulrod/ui/styles.css";

export default function App() {
  return <Button type="button">Get started</Button>;
}
