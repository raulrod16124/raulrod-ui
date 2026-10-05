---
"@raulrod/ui": patch
---

fix(ui): bound floating overlays to the viewport so long content cannot open a panel wider or taller than the screen (RRU-137)

- Popover, DropdownMenu and Tooltip: add `max-inline-size: min(calc(var(--rr-space-16) * 6), calc(100vw - 2 * var(--rr-space-4)))`, matching the existing `Toast` mold — the durable term caps a panel at 384px on desktop, the viewport term keeps `space-4` clear on each edge at 320px.
- Add `box-sizing: border-box` to the three panel roots. This is load-bearing, not cosmetic: the package ships no `box-sizing` reset, so both clamps otherwise measure the content box and the padding lands outside the bound. Measured with the E2E at a 320×360 viewport — a panel 320px wide and 360px tall, flush with all four edges, and 416px on desktop instead of 384px — while every "fits the viewport" assertion still passed.
- Popover and DropdownMenu: add `max-block-size: calc(100dvh - 2 * var(--rr-space-4))` and `overflow: auto`, so content taller than the screen scrolls instead of clipping. The menu's scrollport is keyboard-reachable because every item is a focusable `menuitem`.
- Tooltip: add `overflow-wrap: anywhere` and deliberately **no** `max-block-size`/`overflow: auto`. The tooltip is not focusable and is not a focus trap, so a scrollport there would be content no keyboard user can reach; it wraps instead. This is the documented deviation from the card's DoD, enforced by the CSS contract test as well as documented.
- Use `100dvh` rather than `100vh` for the block bound: a fixed overlay tracks the visual viewport. Recorded in ADR-008 so the Dialog/Toast family inherits the decision.
- Add `blockOverflowPx` and `expectNothingClipped` E2E helpers. `overflowPx` measures the inline axis only, which reports zero for a panel whose text wraps at the clamp — the wrong axis would have called a clipping panel unclipped.
- Add the bounded-panel contract to css-contracts (`BOUNDED_PANELS`), with negative probes for a missing bound, a bound that does not name the viewport, a clipping `overflow`, a missing block bound, a content-box clamp, and the scrollport the tooltip must not have.
- Add a 500-character case per component to the playground and a geometric E2E spec at 320px and 1280px, plus `Responsive` stories for the three components. No public API change.
