// The consumer-contract section (RRU-110).
//
// §25 asks the playground to validate the whole consumer surface — installation,
// exports, types, theming — and this section is the part of the app that answers
// "exports" and "types" for the two packages the rest of the app never touches
// as packages:
//
//   * `@raulrod/tokens` appears elsewhere ONLY as `@raulrod/tokens/styles.css`,
//     so its TypeScript entrypoint — the one a consumer reaches for to type a
//     spacing or a token key — was never resolved by anything. `SECTION_GAP` is
//     that import, and it is a TYPE import on purpose: the README promises the
//     tokens package adds nothing to the bundle at runtime (`import type` → 0 kB,
//     measured in RRU-100), and a "validation" that quietly paid 8 kB of runtime
//     JS to prove a point would contradict the promise it validates.
//   * `@raulrod/icons` was only ever consumed TRANSITIVELY, through the
//     `export *` in `@raulrod/ui`'s barrel. That proves the re-export works, and
//     nothing about the icons package on its own: its `exports` map, its
//     `.d.ts`, and its standalone resolution. One direct import covers all three.
//
// It also renders the two README mirrors (`quick-start.tsx`, `usage-example.tsx`)
// so the published snippets are exercised at runtime, not only compiled, and the
// install report (`install-report.ts`), which is this card's DoD #1 written where
// a reviewer opening the app can read it instead of only in a CI log.
//
// E2E CONSTRAINT (same rule RRU-071 hit): the Playwright specs locate overlays
// WITHOUT scope (`getByRole("dialog")`, `getByRole("listbox")`), so this section
// renders NO overlay and reuses no accessible name already on the page. The
// mirrored `ConfirmDialog` stays closed — only its trigger is in the DOM — and
// its labels ("Get started", "Open", "Cancel", "Confirm") are unique here.
import type { Spacing } from "@raulrod/tokens";

import { Compass } from "@raulrod/icons";
import { Badge, Heading, Inline, Stack, Text } from "@raulrod/ui";

import { INSTALLED_PACKAGES } from "./install-report.js";
import QuickStart from "./quick-start.js";
import { ConfirmDialog } from "./usage-example.js";

// Typed against the tokens package, so a renamed or dropped spacing token breaks
// `pnpm typecheck` here and nowhere else would notice.
const SECTION_GAP: Spacing = "space-4";

export function ConsumerContract() {
  return (
    <Stack gap={SECTION_GAP}>
      <Heading as="h3">Installed packages</Heading>
      <Text>
        What this app installs, and the exact specifiers it imports. Each one is declared in the{" "}
        <code>exports</code> map of its package and imported by a source file of this app —{" "}
        <code>consumer-contract.test.ts</code> fails if this list stops matching either.
      </Text>
      <Stack gap="space-3">
        {INSTALLED_PACKAGES.map((pkg) => (
          <Stack gap="space-1" key={pkg.name}>
            <Inline align="baseline" gap="space-2" wrap>
              <Text weight="font.weight.semibold">{pkg.name}</Text>
              {pkg.entrypoints
                // The package name IS its `.` entrypoint — `@raulrod/ui` and
                // `@raulrod/ui` are one specifier written twice, and the
                // semibold line above already states it. Badging both read as a
                // typo during the manual review of this page.
                .filter((specifier) => specifier !== pkg.name)
                .map((specifier) => (
                  <Badge key={specifier} variant="info">
                    {specifier}
                  </Badge>
                ))}
            </Inline>
            <Text color="color.text.muted">{pkg.role}</Text>
          </Stack>
        ))}
      </Stack>

      <Heading as="h3">Published snippets</Heading>
      <Text>
        The two snippets below are the README ones, mirrored verbatim and gated against it by{" "}
        <code>consumer-contract.test.ts</code>.
      </Text>
      <Inline align="center" gap="space-4" wrap>
        <QuickStart />
        <ConfirmDialog />
      </Inline>

      <Heading as="h3">Why those direct imports</Heading>
      <Inline align="center" gap="space-2">
        <Compass aria-hidden="true" />
        <Text>
          Icon from <code>@raulrod/icons</code>, spacing typed with <code>@raulrod/tokens</code> —
          both as packages in their own right, not only through the re-exports of{" "}
          <code>@raulrod/ui</code>.
        </Text>
      </Inline>
    </Stack>
  );
}
