// Range computation of Pagination (RRU-064). Internal module: not exported
// from the package root (docs/typescript.md §4). Pure function — the page-window
// math, unit-tested directly (§19 "logica aislada"/"transformaciones").
// Collocated with the component because it is single-consumer; shared utilities
// live in utils/.
//
// Window contract (fixed in the MVP per §9/§33 — no `siblingCount` prop until a
// real consumer needs a wider window; adding it later is backward-compatible):
// page 1 and pageCount are ALWAYS rendered; the window around the current page
// spans `page ± sibling` (default 1). When a gap of ≥2 page numbers opens
// between the window and a boundary, an `"ellipsis"` marker is inserted — at
// most two (one per edge). The result is a flat sequence of page numbers and
// ellipsis markers, so the render maps exactly once.
//
// Density rule: when the total page count fits in `2*sibling + 5` slots (the
// same slots an ellipsis layout would consume), the FULL run `1..pageCount` is
// returned — "1 … 3 4 5 … 7" is strictly worse than "1 2 3 4 5 6 7".
export type PaginationItem = number | "ellipsis";

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/** Build the ordered page/ellipsis sequence for the bar. `page` is clamped
 *  silently into `[1, pageCount]` (render always stays coherent; the caller
 *  renders `aria-current` against the same clamped value). */
export function paginationRange(pageCount: number, page: number, sibling = 1): PaginationItem[] {
  if (pageCount <= 0) return [];
  if (pageCount <= 2 * sibling + 5) return range(1, pageCount);

  const current = Math.min(Math.max(page, 1), pageCount);
  // The window around the current page, keeping page 1 and pageCount exclusive
  // so the boundary items are never duplicated as window members.
  const left = Math.max(2, current - sibling);
  const right = Math.min(pageCount - 1, current + sibling);

  const items: PaginationItem[] = [1];
  if (left > 2) items.push("ellipsis");
  for (let n = left; n <= right; n += 1) items.push(n);
  if (right < pageCount - 1) items.push("ellipsis");
  items.push(pageCount);
  return items;
}
