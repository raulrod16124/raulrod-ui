---
"@raulrod/ui": minor
---

feat(ui): accept standard CSS properties in the `styles` prop

- Widen `Styles<K>` to `Partial<Record<Tokens, string>> & CSSProperties`: component tokens stay typed from the CSS (unknown `--rr-*` keys are still rejected), while standard CSS properties (`color`, `opacity`, `zIndex`, …) now compile with React `style` semantics, including numeric values.
- Match the type to the runtime: `mergeStyles` has always been an unfiltered spread, so the token/CSS restriction was type-only.
- Fix the merge order on key collision: the consumer's `style` prop now wins over `styles`, as documented in ADR-009, the Storybook guide and the published 1.1.0 contract (previously `styles` won; only same-key collisions are affected).
- Flip the `color` probe in `styles-type-contract.test.ts` to a positive assertion; the unknown-token negative probe remains the gate.
- Update the "Cuándo sobrescribir" Storybook guide, the `StylesOverride` story, and amend ADR-009 (tokens + standard CSS in, arbitrary custom props out).
- Make the Documentation links in the README clickable (Storybook URL and repository).
