# Security Policy

RaulRod UI is a component library: it ships React components, design tokens and
icons, and it renders content it did not write. This document is the short,
public version of the security posture. The working notes — advisory inventory,
reachability analysis, audit thresholds — live in `docs/security.md` (local, not
versioned).

## Supported versions

| Version | Supported |
| ------- | --------- |
| `1.0.x` | ✅        |

The library is at `1.0.0`: fixes ship as patches within `1.0.x`, and anything
that would change or remove the public API ships as a minor or a major, with
release notes.

## Reporting a vulnerability

Open a **private** security advisory on the repository
(<https://github.com/raulrod16124/raulrod-ui/security/advisories/new>) rather
than a public issue. Include the affected package and version, a reproduction,
and the impact you observed.

Please do not run automated scanners against the deployed Storybook or report
missing rate limits on the docs site — this is a static library, there is no
server-side component to attack.

## What we check on every change

| Gate                                            | What it proves                                                                                                                                            |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm audit --prod --audit-level moderate` (CI) | No known moderate-or-worse advisory in what we publish                                                                                                    |
| `pnpm audit --audit-level high` (CI)            | No known high-or-worse advisory in the dev toolchain                                                                                                      |
| ESLint ban on dangerous APIs                    | No `dangerouslySetInnerHTML`, `eval`/`Function`, DOM string writes or `javascript:` literals in shipped code                                              |
| `security-contracts` spec (`packages/ui`)       | No raw-HTML or unbounded-polymorphism prop in the public types; every rendered URL attribute is a reviewed decision                                       |
| `pnpm check:demo` (CI)                          | The public `DEMO.md` still describes this repository: every path it cites, every command it quotes and every count it prints are re-derived from the tree |

The first four rows are security gates; the last one is not, and it earns its place in the same
table because it answers the same question from a different angle — whether the repository still
says what it does. It runs in the quality gate and it **blocks**, unlike the informational job
below: it needs no network, no browser and no build output, so there is nothing in it that can fail
for a reason that is not this repository's fault.

The ESLint ban and the spec are deliberately redundant: the rule fails at the
offending line, the spec fails on the published artifact. A component that
genuinely needs raw HTML is a public-API decision — it needs an ADR and a
documented, narrowly-typed escape hatch, not a lint exception.

### Informational: the external-install job

One CI job runs `pnpm verify:external --route=tarball --no-browser` on every
change. It installs the packed packages into a throwaway project outside the
repository, typechecks them in two resolution modes, renders one under Node ESM
and builds the page with Vite — the only check that answers "what does a
consumer outside this repo actually receive".

It is **informational**: it runs with `continue-on-error`, so a red result does
not block the merge. It needs the network and a clean runner, and it is
propense to failing for reasons that are not a package bug; a gate that goes
red on infrastructure is a gate people learn to ignore. Read a failure there as
a signal to investigate, not as a blocked merge.

Two things stay manual, on purpose:

- **The `--route=registry` check.** It installs `@raulrod/*@latest`, so it
  measures the last release, not the tree under review — a red run there says
  nothing about the commit in front of you. It runs before publishing.
- **The React 18 pass.** `--react` covers one major per run, so React 19 in CI
  says nothing about the `>=18.2.0` peer floor. `pnpm verify:external:react18`
  covers it; the playground and its E2E run against React 19.

## Content and URLs

Components render **content as text or as React nodes**. There is no `html` prop
and no generic `asChild`/`component` escape hatch, because a component that
accepts a raw HTML string is itself the vulnerability, whatever its internals do.

URL props (`Button.href`, `Avatar.src`) are forwarded to the DOM **verbatim**.
The library deliberately does not rewrite or validate them: sanitizing would
break `data:`, `blob:` and relative URLs, and a library that "makes URLs safe"
gives a false sense of safety while leaving the real boundary — your input —
untouched. Validate untrusted URLs where they enter your application. For
reference, React itself replaces a `javascript:` URL with a throwing stub, and
`Button` defaults `rel` to `"noopener noreferrer"` when `target` opens another
browsing context.

## Publishing

Releases are published from `main` by GitHub Actions using the `NPM_TOKEN` secret
and the automatic `GITHUB_TOKEN`; no credential is stored in the repository and
no `.npmrc` with a token is committed. The workflow runs lint, format check,
typecheck and tests before the publish step, and `ci.yml` only runs on pull
requests — so those gates are the ones protecting a release, not a redundant
second opinion. `pnpm publish --dry-run` output is reviewed as part of the
release PR.

Before a release is published, `pnpm verify:external --route=registry` is run by
hand against the packages as they exist on npm. It is a release-time check, not
a per-commit one, for the reason given above: it measures what is published, not
the tree being reviewed.
