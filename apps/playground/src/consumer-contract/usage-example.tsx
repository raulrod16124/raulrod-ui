// README "Usage example", mirrored VERBATIM (RRU-110). Same contract as
// `quick-start.tsx`: `consumer-contract.test.ts` fails if the README and this
// file diverge, and `pnpm typecheck` fails if this file stops compiling.
//
// The compound components are SLOT PROPS (`DialogTrigger`, `DialogContent`,
// ...), not `Dialog.Trigger`, and there is no `asChild`: ADR-004 closed both
// decisions and `security-contracts.test.ts` keeps them closed. The README said
// otherwise until this card, which is the exact failure this mirror exists to
// make impossible to repeat.
//
// The visible labels ("Get started", "Remove account", "Cancel", "Confirm") are
// part of the published snippet, so they are also a constraint on this page: the
// E2E suite locates some controls by accessible name with Playwright's
// substring matching, so a label that CONTAINS an existing one ("Open" against
// the playground's "Open dialog") makes any future spec fail on strict mode. A
// manual pass over the rendered page is what caught it.

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
