import type { PaginationItem } from "./pagination-range.js";
import type { PaginationProps } from "./Pagination.types.js";

import { forwardRef, useState } from "react";

import { ChevronLeft, ChevronRight } from "@raulrod/icons";

import { cx } from "../utils/cx.js";
import { VisuallyHidden } from "../visually-hidden/index.js";

import { paginationRange } from "./pagination-range.js";

/**
 * Pagination (RRU-064): a labelled `nav` landmark whose controls each move the
 * user to a page of the same list — previous/next buttons, numbered page
 * buttons and ellipsis markers when the window cannot cover every page.
 * SIMPLE props API (ADR-004 router): every control derives from
 * `page`/`pageCount` and there is no inter-node ARIA wiring to own, so
 * composition would be dogma (guía §15, component-pattern.mdx §6).
 *
 * Accessibility contract (DoD #1 + §18/§31, 2023–2026 APG practice):
 * - `<nav aria-label="Pagination">` → a navigation landmark reachable with one
 *   keystroke (2.4.1); the consumer renames it via `aria-label` on the props.
 * - Each control has an accessible name that states its action ("Previous
 *   page", "Go to page 3") — never a bare number — so the bar is
 *   self-explaining in the list of landmarks/links (4.1.2, 2.4.4).
 * - Exactly ONE control carries `aria-current="page"` (the current page is a
 *   FOCUSABLE button — not disabled, so it never drops from the tab order;
 *   activating it is a guarded no-op). `[aria-current="page"]` is the CSS hook
 *   of the distinct current style (weight + fill, not color alone — 1.4.1).
 * - The ellipsis is a non-interactive, `aria-hidden` `<span>` inside a `<li>`:
 *   announcing "ellipsis" adds noise without information; it is never a focus
 *   stop (1.3.1 structure stays a real list).
 * - A `role="status"` polite live region (VisuallyHidden, RRU-033 precedent of
 *   Select's `selectedLabel`) is ALWAYS mounted and announces "Page X of Y" on
 *   each page change — WCAG 4.1.3 for the SPA case, where the list swaps in
 *   place without navigation (precond: the region exists before the update).
 * - Boundary disabled: previous at page 1 / next at page pageCount use native
 *   `disabled` (Button precedent) — removed from the tab order, announced as
 *   dimmed, action impossible by construction.
 *
 * Keyboard: plain browser Tab order through every enabled control (Enter/Space
 * native); NO roving tabindex nor arrow keys — a pager is NAVE-GATION, not a
 * composite widget (APG defines no pagination pattern/keyboard model:
 * `nav`+list+buttons+aria-current are the whole job). Deliberate contrast with
 * Tabs, which IS a composite. Focus needs no management: page buttons are
 * keyed by page number, so the activated button keeps its DOM node (and focus)
 * across the page change.
 *
 * State: controlled/uncontrolled (Tabs precedent) — `page`/`defaultPage`/
 * `onPageChange`, which fires only when the value actually changes. An
 * out-of-range `page` is clamped silently into `[1, pageCount]` (fail soft:
 * consumer state, never a crash). MVP is buttons-only; URL/link mode is a
 * delayed additive prop (see Pagination.types.ts).
 */
export const Pagination = forwardRef<HTMLElement, PaginationProps>(function Pagination(
  { page, defaultPage, pageCount, onPageChange, className, ...props },
  ref,
) {
  const [uncontrolledPage, setUncontrolledPage] = useState<number>(defaultPage ?? 1);
  const controlled = page !== undefined;
  const rawPage = controlled ? page : uncontrolledPage;
  const current = Math.min(Math.max(rawPage, 1), Math.max(pageCount, 1));
  const items: PaginationItem[] = paginationRange(pageCount, current);

  const commit = (next: number): void => {
    if (next === current) return;
    if (!controlled) setUncontrolledPage(next);
    onPageChange?.(next);
  };

  return (
    <nav
      {...props}
      ref={ref}
      aria-label={props["aria-label"] ?? "Pagination"}
      className={cx("rr-pagination", className)}
    >
      <ul className="rr-pagination__list">
        <li>
          <button
            type="button"
            aria-label="Previous page"
            disabled={current <= 1}
            className="rr-pagination__item"
            onClick={() => commit(current - 1)}
          >
            <ChevronLeft aria-hidden={true} />
          </button>
        </li>
        {items.map((item, index) =>
          item === "ellipsis" ? (
            <li key={`ellipsis-${index}`}>
              <span className="rr-pagination__ellipsis" aria-hidden="true">
                …
              </span>
            </li>
          ) : (
            <li key={`page-${item}`}>
              <button
                type="button"
                aria-label={`Go to page ${item}`}
                aria-current={item === current ? "page" : undefined}
                className="rr-pagination__item"
                onClick={() => commit(item)}
              >
                {item}
              </button>
            </li>
          ),
        )}
        <li>
          <button
            type="button"
            aria-label="Next page"
            disabled={current >= pageCount}
            className="rr-pagination__item"
            onClick={() => commit(current + 1)}
          >
            <ChevronRight aria-hidden={true} />
          </button>
        </li>
      </ul>
      <VisuallyHidden role="status" aria-live="polite">
        {`Page ${current} of ${pageCount}`}
      </VisuallyHidden>
    </nav>
  );
});
Pagination.displayName = "Pagination";
