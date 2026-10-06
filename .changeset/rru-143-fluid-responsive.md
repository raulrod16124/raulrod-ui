---
"@raulrod/ui": patch
---

fix(ui): keep long words inside narrow containers (RRU-143)

- `Text`, `Heading`, `Badge` and `Switch.label` now declare `overflow-wrap: anywhere` so unbreakable tokens (URLs, ids, hashes) wrap instead of overflowing narrow containers.
- `Switch.label` and `Badge` also declare `min-width: 0` so they can shrink as flex items without crushing their text.
- Add `Responsive` stories for `Checkbox`, `Switch`, `VisuallyHidden` and `Portal`, and upgrade the existing thin `Responsive` stories of `Avatar`, `Badge`, `Skeleton`, `Progress`, `Text` and `Heading` to the NarrowContainer + `parameters.viewport` pattern.
- Add `packages/ui/src/fluid-contract.test.ts`: a table-driven source-level gate that pins the six genuinely fluid components and the four fixes, plus ADR-005 negative probes.
- Add `apps/playground/src/fluid-responsive-section.tsx` and `apps/playground/e2e/fluid-responsive.spec.ts` with geometric assertions at 320px and 1280px. No public API change.
