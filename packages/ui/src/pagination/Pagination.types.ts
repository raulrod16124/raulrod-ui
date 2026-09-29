import type { HTMLAttributes } from "react";

/**
 * Props of {@link Pagination} (RRU-064): a `nav` landmark named "Pagination"
 * whose controls each move the user to a page of the same list. SIMPLE props
 * API (ADR-004 router): the bar derives every control from `page`/`pageCount`
 * — there are no inter-node ARIA idrefs nor shared state to wire, so
 * composition would be dogma (guía §15).
 *
 * The page state follows the DS controlled/uncontrolled contract (Tabs /
 * RadioGroup / Select precedent): pass `page` + keep it in sync via
 * `onPageChange`, or let `defaultPage` seed an uncontrolled bar. `onPageChange`
 * fires ONLY when the page actually changes (clicking the current page is a
 * no-op, Tabs precedent).
 *
 * Only buttons, no URL mode in the MVP (Button's `href → <a>` precedent does
 * not parse to the bar): the DS has no routing dependency and no consumer has
 * requested shareable page URLs (§9/§17/§33). If one appears, `getHref(page)`
 * is added later as an additive, backward-compatible prop.
 *
 * `pageCount` is REQUIRED (compile-time guard, IconButton `label` precedent).
 * An out-of-range `page` is clamped silently into `[1, pageCount]` for
 * rendering. `className`, `style`, ARIA (incl. `aria-label` to rename the
 * landmark), events and `data-*` pass through to the `<nav>` root via `cx`.
 */
export interface PaginationProps extends HTMLAttributes<HTMLElement> {
  /** Current page, 1-based. When provided, the bar is controlled: the consumer
   *  owns the value and must re-render through `onPageChange`. Clamped into
   *  range for rendering. */
  page?: number;
  /** Initial page of the uncontrolled variant (defaults to 1). */
  defaultPage?: number;
  /** Total number of pages; required. */
  pageCount: number;
  /** Fires when the page actually changes (never on a click of the current
   *  page). Controlled bars re-render through this callback. */
  onPageChange?: (page: number) => void;
}
