# RaulRod UI — demo script

A five-minute orientation through this repository, followed by the fifteen questions the
author should be able to answer about it. Read it with the repository open: every claim below
names the file or the command that backs it.

Nothing here is asserted on trust. `pnpm check:demo` re-derives the numbers, checks that every
path cited is tracked by git, that every `pnpm` command quoted is a real script, and that every
external URL also appears in `README.md`. If the repository moves and this document does not, the
gate fails instead of the document quietly going stale.

## Run it

```bash
pnpm install
pnpm dev:storybook     # components and documentation, on localhost:6006
pnpm dev:playground    # a consumer application, on 127.0.0.1:5173
```

Both are served from a built `dist/`, so `pnpm build` first if you have just cloned. The playground
helper does that for you: it builds, watches the two package sources and rebuilds on change.

## Repository at a glance

| Claim                          | Value  |
| ------------------------------ | ------ |
| Published packages             | 3      |
| Runtime exports of @raulrod/ui | 72     |
| Components                     | 28     |
| Story files                    | 27     |
| MDX documentation pages        | 17     |
| Architecture Decision Records  | 8      |
| Playwright E2E specs           | 10     |
| CI jobs                        | 5      |
| Published line                 | 1.x    |
| React peer floor               | 18.2.0 |

Every figure above is derived from the tree by `pnpm check:demo`. Test counts and bundle sizes are
deliberately absent: they move on every commit, so this document gives you the command instead.

The version is quoted as a line rather than as an exact patch for the same reason. `1.0.1` is the
heading at the top of `packages/ui/CHANGELOG.md`, and the next patch will replace it — a claim
that the release PR's own quality gate invalidated every time could only be met by editing this
document, which is the behaviour the gate exists to prevent. What `pnpm check:demo` does assert
about the release is that each published package's `version` matches the newest heading of its own
CHANGELOG, so a release cannot go out half-written.

## The chain

The five stages below are the shape of the project: tokens become components, components become
documentation, documentation becomes a published package, and the published package is consumed by
an application that knows nothing about the monorepo.

| Stage                | Where to look                                                                       | What proves it                                                                                   |
| -------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Design tokens        | `packages/tokens/src`, then the token guide in Storybook                            | `packages/ui/src/css-contracts.test.ts` — contrast and reduced-motion gates                      |
| Component library    | `apps/playground/src/app.tsx`, or the stories behind each component                 | `pnpm test`, `pnpm test:e2e`                                                                     |
| Documentation        | `docs/decisions/`, `packages/ui/src/docs/`                                          | `README.md`, and [Storybook](https://raulrod16124.github.io/raulrod-ui) deployed to GitHub Pages |
| Published package    | the three packages on npm, on the 1.x line                                          | `tools/external-install-check.mjs`, run by the `external-install` CI job                         |
| Consumer application | `apps/playground`, and the throwaway project in `tools/fixtures/external-consumer/` | `pnpm verify:external`                                                                           |

### 1. Design tokens

Three tiers — primitive, semantic, component — and the middle one is the point. A theme is a
mapping from semantic names to primitives, so re-theming is a change in one file
(`packages/tokens/tools/emit-css.mjs`) and a component never names a colour. The same tiering is
why contrast can be checked at all: the pairs that are allowed to sit next to each other are a
finite, declared list, and the gate measures that list instead of trusting review.

`docs/decisions/002-token-architecture.md` records why the middle tier is not optional.

### 2. Component library

Twenty-eight components, each with its own stylesheet, types, tests and stories. The pattern they
all follow — `forwardRef`, a variant map, `cx` for merging, dot-notation compound parts — is written
down in `packages/ui/src/docs/component-pattern.mdx` and enforced by
`packages/ui/src/component-pattern.test.tsx`, so it is a contract rather than a convention.
Composition is the API strategy: `Dialog` is not a `title` and a `footer` prop, it is
`DialogHeader`, `DialogTitle` and `DialogFooter` as real elements that share context. The reasoning,
and the alternative that was rejected, is `docs/decisions/004-component-composition.md`.

### 3. Documentation

Eight Architecture Decision Records in `docs/decisions/`, and MDX pages shipped inside the package
so they cannot drift from the components they describe — seventeen of them, including a Spanish
translation of the setup guide. Decisions are numbered and never edited after publication; a change
of mind is a new record.

### 4. Published package

`@raulrod/tokens`, `@raulrod/icons` and `@raulrod/ui` are published independently and versioned with
SemVer through Changesets — [tokens](https://www.npmjs.com/package/@raulrod/tokens),
[icons](https://www.npmjs.com/package/@raulrod/icons) and
[ui](https://www.npmjs.com/package/@raulrod/ui). The interesting part is not the publishing, it is
the proof that the tarball a consumer receives is the one this repository describes:
`tools/external-install-check.mjs` copies a fixture out of the repository, installs the packed
tarballs into it with `npm`, and then typechecks in two module-resolution modes, renders under Node
ESM, builds with Vite and reads the theme in Chromium. Expected values are read from the emitted
CSS, never hardcoded, so the check cannot drift into agreeing with itself.

`.github/workflows/release.yml` runs the same gates before it publishes, because the quality
workflow only runs on pull requests and the path to npm is a push to `main`.

### 5. Consumer application

`apps/playground` is a real application that installs the three packages the way an external project
would, with no aliases into the sources: if the public entry point does not export something, the
playground does not build.

It is not, however, a product. The consumer-of-record for this MVP is the throwaway project
`tools/fixtures/external-consumer/`, which exists to answer one question the playground structurally
cannot: what does someone get who is not inside this workspace. A real application — a trip planner,
the kind of thing that finds the uncomfortable APIs — is deliberately out of scope for the MVP and
is registered as `RRU-114` in the work board. It is named here rather than implied, because a
portfolio that quietly counts a fixture as a product is the kind of thing an interviewer finds in
five minutes.

## What a reviewer can observe

| Observable            | Where                                                                                                                                   | Status                                                                              |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Accessibility         | keyboard tour in `apps/playground/src/overlays-section.tsx`; Tabs, Table and DataTable in `apps/playground/src/a11y-review-section.tsx` | Covered — `apps/playground/e2e/`, plus the contrast gate                            |
| Theme switching       | `apps/playground/src/theme-switcher.tsx`                                                                                                | Covered — `apps/playground/e2e/theme.spec.ts` reads computed values in three states |
| Component composition | `apps/playground/src/consumer-contract/usage-example.tsx`, and every compound component in Storybook                                    | Covered — `docs/decisions/004-component-composition.md`                             |
| States                | `apps/playground/src/a11y-review-section.tsx` — table loading, error and empty; disabled and loading buttons                            | Covered — the story matrix per component                                            |
| Overlay behaviour     | `apps/playground/src/overlays-section.tsx` — a Select and a Popover opened from inside a Dialog                                         | Covered — `apps/playground/e2e/overlays.spec.ts` and two more overlay specs         |
| Tables                | same section: `Table` in four states, `DataTable` with sorting, filtering, selection and pagination                                     | Covered — `apps/playground/e2e/data-table.spec.ts`                                  |
| Forms                 | `apps/playground/src/form-section.tsx` — consumer-owned validation, error slot, success toast                                           | Covered — `apps/playground/e2e/form.spec.ts`                                        |
| Responsive            | —                                                                                                                                       | **Not covered.** See below.                                                         |

Two of these deserve a note rather than a row.

**Theme switching has no flash, and that is deliberate.** `apps/playground/index.html` carries a
blocking inline script that reads the stored choice and writes `data-theme` before the first paint.
Storybook does the same thing in `apps/storybook/.storybook/preview-head.html`. A theme that flashes
white on every reload is a bug users read as "this page is slow", and no amount of correct CSS
compensates for it.

**Responsive is the honest gap.** §35 of the design guide asks that the demo let a reviewer observe
responsive behaviour, and this repository does not have it. The only `@media` rules in the component
stylesheets are `prefers-reduced-motion`; there is no width-based breakpoint anywhere in
`packages/` or `apps/`. What exists today is fluid layout in the playground — wrapping rows, a
max-width container — which is not the same claim. Verifying it is one command:

```bash
git grep -n "@media" -- "packages/**/*.css" "apps/**/*.css"
```

The work is registered as `RRU-133` rather than left as a footnote. Stating the gap costs one row
in a table; pretending the fluid layout is responsive would have cost the whole document its
credibility, because it is the one claim here a reviewer could disprove by resizing a window.

## Reproduce any of it

```bash
pnpm lint                       # ESLint across the workspace, one flat config
pnpm typecheck                  # tsc --noEmit, strict, in every package
pnpm test                       # unit and component suites
pnpm test:e2e                   # Playwright against a production build
pnpm build                      # the three packages
pnpm size-limit                 # the bundle budgets CI enforces
pnpm perf:baseline              # the full bundle report, per component
pnpm verify:external            # install the packages as an outsider would
pnpm check:demo                 # this document, against the repository
```

## What this document does not prove

- **Nothing about the two live URLs.** Storybook on GitHub Pages and the npm registry are asserted
  to match `README.md`, not fetched. A gate that depends on the network is the gate that trains people
  to ignore it.
- **Nothing about rendering.** A document gate cannot open a browser. That the pages render is what
  `pnpm test:e2e` and the `e2e` CI job are for.
- **Nothing about responsive.** Stated above rather than implied.
- **Nothing about real-world usage.** No application outside this repository consumes the library yet.

## The interview pitch

Fifteen questions, each answered in one line with the evidence that backs it. The point is not to
memorise the left column: it is that the right column is a file you can open.

| #   | Question                                                    | Answer                                                                                                                                                                               | Evidence                                                                                            |
| --- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| 1   | Why a monorepo?                                             | Three packages with different responsibilities and one shared source of truth; independent releases without independent repositories.                                                | `docs/decisions/001-monorepo.md`, `turbo.json`                                                      |
| 2   | Why that styling strategy?                                  | CSS and custom properties, no CSS-in-JS: no runtime cost, theming by attribute, and a stylesheet a script can read and assert on.                                                    | `docs/decisions/003-styling-strategy.md`, `packages/ui/src/css-contracts.test.ts`                   |
| 3   | Why primitive plus semantic tokens?                         | A theme becomes a mapping instead of a palette, so a component never names a colour and re-theming touches one file.                                                                 | `docs/decisions/002-token-architecture.md`, `packages/tokens/tools/emit-css.mjs`                    |
| 4   | How is theming implemented?                                 | `data-theme` on the root element, `prefers-color-scheme` as the default, emitted custom properties, and a blocking script that applies the stored choice before first paint.         | `packages/tokens/src/css/emit-css.ts`, `apps/playground/index.html`                                 |
| 5   | How is the public API protected?                            | The `exports` map is the source of truth and the gates are derived from it, so a new export cannot be published without being reviewed.                                              | `packages/ui/src/public-api-boundary.test.ts`, `packages/ui/package.json`                           |
| 6   | How is accessibility guaranteed?                            | Behaviour is tested, and the two properties that human review judges badly — contrast and reduced motion — are gates over the real stylesheets, not a checklist.                     | `packages/ui/src/css-contracts.test.ts`, `apps/playground/e2e/`, `SECURITY.md`                      |
| 7   | How would you test a complex Dialog?                        | Behaviour, not structure: escape closes only the top layer, focus returns to the trigger and has a defined answer when there is none, scroll locks, motion respects the preference.  | `packages/ui/src/dialog/`, `apps/playground/e2e/dialog.spec.ts`                                     |
| 8   | What is controlled and what is not?                         | Every interactive component takes both forms, and the presence of the controlled prop is what decides who owns the state — never a hidden internal copy.                             | `packages/ui/src/dialog/Dialog.types.ts`, `packages/ui/src/tabs/Tabs.types.ts`                      |
| 9   | How are breaking changes managed?                           | SemVer plus Changesets, with the public API frontier deciding what counts as a major; the changelog is generated from the same commits that changed the code.                        | `.changeset/config.json`, `docs/decisions/006-release-strategy.md`, `.github/workflows/release.yml` |
| 10  | How is tree shaking guaranteed?                             | ESM, `sideEffects: false`, and a gate that builds a single-component bundle and fails if anything else is inside it.                                                                 | `packages/ui/package.json`, `tools/measure-bundle.mjs`                                              |
| 11  | How would you catch a bundle size regression?               | Two ratchets: a byte budget CI fails on, and a per-component report that shows what each component actually costs.                                                                   | `.size-limit.json`, `tools/measure-bundle.mjs`, `.github/workflows/ci.yml`                          |
| 12  | Why composition instead of more props?                      | Props grow a component's API without limit; compound parts let a consumer build a shape the library never imagined, and the shared state stays in context.                           | `docs/decisions/004-component-composition.md`, `packages/ui/src/component-pattern.test.tsx`         |
| 13  | What would you simplify if it grew?                         | The hand-written variant maps and the three-tier token model are the two places where a build-time extraction step would pay for itself. Both are deliberately cheap to replace now. | `packages/ui/src/utils/variants.ts`, `docs/decisions/002-token-architecture.md`                     |
| 14  | What does not belong in a design system?                    | Business concepts, anything with an opinion about data fetching, and anything with exactly one consumer. A component built for one product is that product's component.              | `docs/decisions/004-component-composition.md`, `README.md`                                          |
| 15  | What did building and consuming your own library teach you? | That a workspace link hides what npm does. The playground could never answer the installation question, which is why the answer comes from a project outside the repository.         | `tools/external-install-check.mjs`, `apps/playground/README.md`                                     |

Question 15 is the one worth saying out loud, because it is the honest one: the largest defects in
this project were found by the tooling that pretended to be a stranger, not by the tests that live
next to the code.

## Keeping this document honest

`pnpm check:demo` runs `tools/check-demo-claims.mjs`. It derives the table of figures from the tree,
confirms each path is tracked by git, confirms each command is a script in `package.json`, and
confirms each external URL also appears in `README.md`.

Two properties are deliberate. Deleting a claim from this document fails the check, so a claim
cannot be quietly retired to make the gate green; and counts that change on every commit are not
quoted here at all — the number of tests and the size of the bundle move whenever the repository is
worked on, so this document points at `pnpm test` and `pnpm perf:baseline` instead. A ratchet on a
moving number trains people to update the number instead of the work.
