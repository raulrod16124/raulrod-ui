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

| Validated                                    | Gate                                                                                                                                                                |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Installation: what npm would upload          | `src/published-install.test.ts` — packs each tarball and checks it ships every `exports` target, declares `files`, keeps React a peer, and leaks no test/build file |
| Public API surface: exports and types        | `src/consumer-contract.test.ts` — every declared entrypoint is imported; every README snippet is mirrored and compiled                                              |
| What this app installs (visible in the page) | `src/consumer-contract.test.ts` + `src/consumer-contract/install-report.ts`                                                                                         |
| Theming: system, light, dark, no flash       | `e2e/theme.spec.ts` — three states and their precedence over the OS preference                                                                                      |
| Overlays, form, table, theme switch          | `e2e/*.spec.ts` — the interactions, not the markup                                                                                                                  |
| Server rendering                             | `src/ssr-smoke.test.tsx` — renders the app with no DOM globals and twice, for hydration determinism                                                                 |
| Tree-shaking                                 | `pnpm size-limit`, `pnpm perf:baseline`                                                                                                                             |

## What it is not

- Not a second Storybook. Stories document one component at a time; this page is about the seams
  between them.
- Not a test fixture. The Playwright suite shares the page, so the sections avoid the two things
  that would break it: no extra overlay mounted (the specs locate overlays unscoped, and a second
  one would turn a green run red through strict mode) and no accessible name reused.
- Not a benchmark. Numbers live in `pnpm perf:baseline`; this app just has to keep working.
