// Internal focusable-element helpers shared by the overlay infrastructure
// (RRU-052). Precedents: `utils/portal.ts` and `utils/use-id.ts` — internal
// modules, never exported from the package root (frontera §24). Keep this
// module free of React: it is pure DOM introspection, unit-tested in
// `focusable.test.ts` and consumed by focus-trap / focus-return / dismissable.

/**
 * Focusable candidates in document order for keyboard navigation (Tab cycle).
 * Covers the standard set of interactive elements plus anything with a
 * non-negative `tabindex`. Excluded by the selector/guards:
 * - `tabindex="-1"` (programmatic-only focus, NOT part of tab order);
 * - `disabled` form controls;
 * - `hidden` attribute, `aria-hidden="true"` and explicit `display:none`
 *   (invisible ≡ unfocusable for the tab cycle).
 */
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "[tabindex]:not([tabindex='-1'])",
  "audio[controls]",
  "video[controls]",
  "summary",
  "[contenteditable]:not([contenteditable='false'])",
].join(",");

/**
 * Whether `element` is in the keyboard tab order: it must be a focusable
 * candidate AND not visually/structurally hidden.
 */
export function isFocusableElement(element: Element): boolean {
  if (!(element instanceof HTMLElement)) return false;
  if (element.tabIndex < 0) return false;
  if (element.hidden) return false;
  if (element.getAttribute("aria-hidden") === "true") return false;
  return element.matches(FOCUSABLE_SELECTOR);
}

/**
 * All elements inside `root` that participate in the tab order, in document
 * order (the same order the browser would tab through). Returns an empty array
 * when `root` has no focusable descendants.
 */
export function getFocusableElements(root: ParentNode): HTMLElement[] {
  const candidates = root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
  const focusable: HTMLElement[] = [];
  for (const element of candidates) {
    if (isFocusableElement(element)) focusable.push(element);
  }
  return focusable;
}
