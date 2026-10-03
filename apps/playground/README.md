# RaulRod UI playground

A small application that consumes `@raulrod/ui`, `@raulrod/tokens` and `@raulrod/icons`
the way an external project would: through their published entrypoints and nothing else.

It exists because the rest of the repository cannot prove that claim about itself. Unit tests
import the sources, the bundle baseline measures what a bundler resolves locally, and both would
stay green if a consumer's `npm install` were missing a file. This app is the one place where
the install is the thing under test.

## Run it

```bash
pnpm dev:playground          # builds the packages, serves the app, rebuilds on source changes
pnpm dev:playground -- --preview   # serves the built artifact instead, the one E2E drives
```

`pnpm dev` also starts it, but it does not rebuild `packages/*/src`, and this app consumes their
built output on purpose — see below.

## The rules it follows

- **Public API only.** Every import is a specifier an `exports` map declares. A relative path into
  `packages/*` is an ESLint error (the allowlist is derived from the manifests, not written by
  hand), and `@raulrod/*/internal` does not exist as a subpath to reach for.
- **No `resolve.alias` to the sources.** The app resolves the built `dist/`, which is what a
  consumer gets. Aliasing `src` in would make every gate below pass against something nobody
  installs.
- **The consumer owns the stylesheets.** `@raulrod/ui` is `sideEffects: false`, so nothing inside
  the package imports its own CSS. `src/main.tsx` imports the two stylesheets in order — system
  first, app CSS last — which is the documented way to let consumer overrides win the cascade.
- **No business logic.** Every state, validation rule and data set here belongs to the app. The
  design system owns no validation (a field is invalid because `FormField.Error` is rendered and
  `aria-invalid`/`aria-errormessage` follow), which is exactly the integration a consumer has to
  get right.

## What it validates, and which gate proves it

Everything in this table runs against `dist/` resolved by **workspace link**, so it answers
questions about the packages as built. What a consumer _outside_ the repo receives is a separate
question, answered by `pnpm verify:external` (see below).

| Validated                                    | Gate                                                                                                                                                                                                                   |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Installation: what npm would upload          | `src/published-install.test.ts` — packs each tarball and checks it ships every `exports` target, declares `files`, keeps React a peer, and leaks no test/build file                                                    |
| Installation: the packed artifact's edges    | `src/published-install.test.ts` — the shipped JavaScript imports only declared packages, every range is fetchable, `workspace:` is rewritten rather than pinned by hand, and the emitted theme layer stands on its own |
| Public API surface: exports and types        | `src/consumer-contract.test.ts` — every declared entrypoint is imported; every README snippet is mirrored and compiled                                                                                                 |
| What this app installs (visible in the page) | `src/consumer-contract.test.ts` + `src/consumer-contract/install-report.ts`                                                                                                                                            |
| Theming: system, light, dark, no flash       | `e2e/theme.spec.ts` — three states and their precedence over the OS preference                                                                                                                                         |
| Overlays, form, table, theme switch          | `e2e/*.spec.ts` — the interactions, not the markup                                                                                                                                                                     |
| Server rendering                             | `src/ssr-smoke.test.tsx` — renders the app with no DOM globals and twice, for hydration determinism                                                                                                                    |
| Tree-shaking                                 | `pnpm size-limit`, `pnpm perf:baseline`                                                                                                                                                                                |

## Installation outside this repository

`pnpm verify:external` (`tools/external-install-check.mjs`) covers what the table above cannot. It
copies `tools/fixtures/external-consumer/` into a temp directory, writes a `package.json` that knows
nothing about the monorepo, and from there on nothing in this repository participates: `npm`
installs the packages, the consumer's own `tsc` resolves them in `bundler` and `node16` modes, Node
ESM renders a component with `renderToString`, Vite builds the page, and Chromium reads the computed
values of the theme in six states.

The one thing it deliberately checks that nothing else can is **provenance**: `pnpm pack` rewrites
`workspace:` to a concrete version, and when that version does not match what the consumer asked
for, npm is free to satisfy the transitive range from the registry instead. The tool then inspects
the whole `node_modules` tree — nested copies included — and fails rather than reporting a pass for
a tree that was half downloaded.

Two routes, because they answer different questions:

- `--route=tarball` (default) installs `pnpm pack` output, so it covers work that is not committed
  yet. This is what belongs in a review.
- `--route=registry` installs `@raulrod/*@latest`, so it covers what is on npm today. It warns when
  the published version differs from the one in `packages/`, because a green run here does not mean
  the working tree was validated.

`--no-browser` skips the Chromium pass; the run then says so instead of claiming a theme was
checked in a browser.

## What runs where

`verify:external` is not one check with one trigger, so this is the honest split:

| Run                                     | When                      | What it covers                                                                                                                                                                                                 |
| --------------------------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `external-install` job (`ci.yml`)       | every push and PR         | `--route=tarball --no-browser`, React 19: install, types in two resolutions, Node ESM render, Vite build, theme as text in the built CSS. **Informational** — `continue-on-error`, it does not block the merge |
| `pnpm verify:external:react18`          | by hand, before a release | `--react=18.2.0` and `--react=18`: the declared peer floor and the latest 18.x. One major per run, so this is separate from the job rather than folded into it                                                 |
| `pnpm verify:external --route=registry` | by hand, before a release | `@raulrod/*@latest` as installed from npm: what a consumer gets today, not the working tree                                                                                                                    |

Two things the job deliberately does **not** do, and why:

- **No Chromium.** The `e2e` job installs and caches the browser and covers the
  theme in a real one. Duplicating it here would cost minutes per PR to answer
  the same question twice.
- **No `--route=registry` on every commit.** That route measures the last
  release, so a failure there is about a commit that is not in front of you, and
  it would make every PR red for something it cannot fix.

The job runs with `continue-on-error` because the route needs the network (npm
installs React, Vite and TypeScript into the throwaway project) and a clean
runner: it fails for reasons that are not a package bug often enough that a
blocking gate would be learned to ignore. A red `External install` is a signal
to look, not a blocked merge — see `SECURITY.md` §Informational.

## What it is not

- Not a second Storybook. Stories document one component at a time; this page is about the seams
  between them.
- Not a test fixture. The Playwright suite shares the page, so the sections avoid the two things
  that would break it: no extra overlay mounted (the specs locate overlays unscoped, and a second
  one would turn a green run red through strict mode) and no accessible name reused.
- Not a benchmark. Numbers live in `pnpm perf:baseline`; this app just has to keep working.
