---
"@raulrod/ui": patch
---

Make `Table` and `DataTable` responsive at narrow widths (RRU-140).

- `Table` now declares `container-type: inline-size` and automatically drops to
  the `sm` density when its own wrapper is at most `breakpoint.sm` wide.
- Long unbroken content in cells wraps via `overflow-wrap: anywhere`, so the
  horizontal scrollport is the table's own wrapper instead of the page.
- `DataTable` no longer uses a breakpoint custom property as a `flex-basis`;
  the toolbar filter uses the literal `640px` and the pagination slot wraps.
- A new playground E2E asserts no page overflow and a real sticky header in a
  bounded scrollport at 320px and 1280px.
