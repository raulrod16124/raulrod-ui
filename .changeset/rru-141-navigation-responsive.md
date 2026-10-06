---
"@raulrod/ui": patch
---

fix(ui): scroll the Pagination and Tabs rails when space is tight (RRU-141)

- Pagination: add per-node modifiers `--prev`, `--next`, `--number` and collapse to previous/current/next inside a narrow container with `container-type: inline-size` and `@container (max-width: 640px)`. The DOM keeps every node (SSR/a11y structure is unchanged); only the visual rendering is suppressed.
- Tabs: turn `.rr-tabs-list` into a horizontal scrollport with `overflow-x: auto` and `scroll-snap-type: inline proximity`; triggers snap to `start`. The existing `outline-offset: -2px` focus ring survives the clipping ancestor.
- DataTable: add `flex: 1 1 auto` to `.rr-data-table__pagination`. Without it, `container-type: inline-size` on the composed `<nav>` collapses the pager to zero width because it is a flex item of `.rr-data-table__footer` with no flex-grow.
- Add responsive-contract tests for both components, `Responsive` stories with `NarrowContainer`, a `navigation-section.tsx` playground fixture, and a geometric E2E spec at 320px and 1280px. The keyboard test asserts that arrowing past the fold keeps the focused tab inside the visible rail. No public API change.
