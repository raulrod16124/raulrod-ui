---
"@raulrod/ui": minor
---

feat(ui): add typed `styles` and `classNames` escape hatches (RRU-147)

- Add `styles?: Styles<"...">` to all public components that render DOM. The type is derived from the component's own CSS via `tools/derive-style-types.mjs`, so only tokens the component actually consumes are accepted.
- Add `classNames?: { [slot]: string }` to compound components. The root distributes the classes to its public slots through the existing React context; internal `rr-*` selectors remain implementation details.
- Add `mergeStyles` utility and preserve the merge order: component styles → `styles` → consumer `style` wins on collision.
- Add representative stories (`Button.StylesOverride`, `FormField.ClassNamesOverride`, `Dialog.ClassNamesOverride`) and the "Cuándo sobrescribir" Storybook guide.
- Update ADR-009 implementation notes and component-pattern.mdx §5.1 with the merge order and AA responsibility boundary.
