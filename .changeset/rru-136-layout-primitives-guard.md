---
"@raulrod/ui": patch
---

fix(ui): stop long button labels and layout primitives from overflowing (RRU-136)

- Button: add `min-width: 0` and `overflow-wrap: anywhere` so an unbroken label (e.g., an id) wraps instead of pushing its row sideways at narrow widths.
- IconButton: add default `size=md` geometry to the base class (width/height/padding) and keep `flex-shrink: 0`; document that `min-width: 0` is not added because `min-width: auto` already floors min-content for icon-only buttons. The parity between the base class and `--size-md` is now enforced by a contract test.
- Inline/Stack: set `min-width: 0` to allow flex children to wrap/shrink inside constrained containers.
- Add NarrowContainer helper to Storybook support and Responsive stories for Button, IconButton, Inline, Stack.
- Add the literal↔token gate to css-contracts (width conditions must use breakpoint px literals derived from `@raulrod/tokens`, `@media` width only for dialog/toast, and `@container` requires a `container-type`).
