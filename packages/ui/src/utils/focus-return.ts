// Internal focus-restoration hook (RRU-052). Remembers which element had focus
// when an overlay activates and returns focus to it on deactivate/unmount
// (guide §14: "focus restoration"). SSR-safe: DOM access lives in effects only.
import type { RefObject } from "react";

import { useEffect, useRef } from "react";

import { getTopmostModalScopeNodes } from "./dismissable-layer.js";
import { getFocusableElementsInDocumentOrder, isFocusableElement } from "./focusable.js";

export interface FocusReturnOptions {
  /** When true the hook captures the current focused element to restore later. */
  active: boolean;
  /** The overlay's own known trigger. When the captured element is no
   *  longer restorable this is the SECOND destination the hook tries — the
   *  "return to the invoker" behaviour even when the invocation left nothing
   *  focusable behind. Popover/Select/DropdownMenu already track their trigger
   *  node in the context; Dialog now does too. Internal option only — never
   *  part of the public API (frontera §24). */
  fallbackRef?: RefObject<HTMLElement | null>;
}

/** Whether a node is a usable focus destination: real element, still in the
 *  document and still a tab stop. The only nodes ever focused by this hook. */
function isRestorable(target: Element | null | undefined): target is HTMLElement {
  return target instanceof HTMLElement && target.isConnected && isFocusableElement(target);
}

/**
 * The last-resort destination when neither the captured element nor the
 * overlay's trigger is restorable: the FIRST focusable, in document
 * order, of the topmost open modal scope — or of the whole document when no
 * modal is active. This is the documented rule for a triggerless overlay:
 *
 *   1. the element that had focus when the overlay opened, if it is still
 *      connected and focusable (the ordinary trigger case);
 *   2. the overlay's own trigger (`fallbackRef`), when the captured element is
 *      gone but the trigger survives;
 *   3. the first focusable of the enclosing modal scope, or of the document.
 *      When a modal is still open this CANNOT be behind it — the scope is the
 *      same union the focus trap cycles over, so focus never leaves a
 *      modal just because a nested overlay whose trigger vanished had to land
 *      somewhere. Deterministic and always visible: a keyboard user always has
 *      a focus ring, never the `<body>` no-op that browsers can't focus.
 *
 * Steps 1 and 2 are only honored when the candidate is reachable: while ANY
 * modal is open, a captured element or trigger that sits OUTSIDE the live modal
 * scope is rejected (a nested overlay closed over a still-open dialog must not
 * land its focus behind the modal — it falls through to step 3, which by
 * construction lands inside the scope). When no modal scope is live the whole
 * document is reachable, which is the case the ordinary trigger flow relies on.
 *
 * Returns `null` only when NOTHING focusable exists anywhere in the document;
 * in that case the browser is already parked on/inside `body` and the next Tab
 * restarts from the top of the document — the only honest outcome left.
 */
function resolveRestoreTarget(
  previous: Element | null,
  fallbackRef: RefObject<HTMLElement | null> | undefined,
  rootDocument: Document,
): HTMLElement | null {
  const modalScope = getTopmostModalScopeNodes();
  const isReachable = (node: HTMLElement): boolean =>
    modalScope.length === 0 || modalScope.some((root) => root.contains(node));

  if (isRestorable(previous) && isReachable(previous)) return previous;
  if (isRestorable(fallbackRef?.current) && isReachable(fallbackRef.current)) {
    return fallbackRef.current;
  }
  const roots: readonly ParentNode[] = modalScope.length > 0 ? modalScope : [rootDocument.body];
  return getFocusableElementsInDocumentOrder(roots)[0] ?? null;
}

/**
 * Captures `document.activeElement` on the `false → true` transition and
 * restores focus to it on `true → false` or unmount. The effect-keyed-on
 * `active` pattern makes the capture/restore a single transition: the cleanup
 * of the "true" effect runs exactly when `active` flips to false or the hook
 * unmounts, so re-renders never steal focus. If the captured element is gone
 * or no longer focusable (e.g. the trigger was conditionally removed), the
 * destination follows the rule documented on {@link resolveRestoreTarget}
 * — never `document.body.focus()`, which is a no-op on a `<body>`
 * without `tabindex` and leaves the user with no visible focus ring.
 *
 * The `fallbackRef` is mirrored into a ref by a dedicated effect so this hook
 * only re-binds on the `active` transition — a consumer that passes a fresh
 * ref object on re-render cannot make the cleanup re-run (react-hooks/refs).
 *
 * Per-instance storage keeps nesting correct: each overlay restores to its own
 * trigger, so closing the inner overlay returns to the outer one's content and
 * closing the outer one returns to the original trigger (no global stack —
 * ADR-004, alternative D).
 */
export function useFocusReturn({ active, fallbackRef }: FocusReturnOptions): void {
  const fallbackRefRef = useRef<RefObject<HTMLElement | null> | undefined>(fallbackRef);

  useEffect(() => {
    fallbackRefRef.current = fallbackRef;
  });

  useEffect(() => {
    if (!active) return;

    const previous = document.activeElement;
    const rootDocument = document;

    return () => {
      const target = resolveRestoreTarget(previous, fallbackRefRef.current, rootDocument);
      target?.focus();
    };
  }, [active]);
}
