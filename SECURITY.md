# Security Policy

RaulRod UI is a component library: it ships React components, design tokens and
icons, and it renders content it did not write. This document is the short,
public version of the security posture. The working notes — advisory inventory,
reachability analysis, audit thresholds — live in `docs/security.md` (local, not
versioned).

## Supported versions

| Version | Supported |
| ------- | --------- |
| `0.1.x` | ✅        |

The library is pre-1.0: fixes ship as patches within `0.1.x`, and anything that
would change the public API waits for `1.0.0`.

## Reporting a vulnerability

Open a **private** security advisory on the repository
(<https://github.com/raulrod16124/raulrod-ui/security/advisories/new>) rather
than a public issue. Include the affected package and version, a reproduction,
and the impact you observed.

Please do not run automated scanners against the deployed Storybook or report
missing rate limits on the docs site — this is a static library, there is no
server-side component to attack.

## What we check on every change

| Gate                                            | What it proves                                                                                                      |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `pnpm audit --prod --audit-level moderate` (CI) | No known moderate-or-worse advisory in what we publish                                                              |
| `pnpm audit --audit-level high` (CI)            | No known high-or-worse advisory in the dev toolchain                                                                |
| ESLint ban on dangerous APIs                    | No `dangerouslySetInnerHTML`, `eval`/`Function`, DOM string writes or `javascript:` literals in shipped code        |
| `security-contracts` spec (`packages/ui`)       | No raw-HTML or unbounded-polymorphism prop in the public types; every rendered URL attribute is a reviewed decision |

The ESLint ban and the spec are deliberately redundant: the rule fails at the
offending line, the spec fails on the published artifact. A component that
genuinely needs raw HTML is a public-API decision — it needs an ADR and a
documented, narrowly-typed escape hatch, not a lint exception.

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
no `.npmrc` with a token is committed. `pnpm publish --dry-run` output is
reviewed as part of the release PR.
