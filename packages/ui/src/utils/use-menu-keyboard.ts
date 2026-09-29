// Internal menu keyboard hook (RRU-055). Binds the pure roving-focus/type-ahead
// math of `menu.ts` to one REAL menu panel (`role="menu"`) and its
// `[role="menuitem"]` descendants, per the WAI-ARIA Menu Button pattern:
//   - ArrowDown/ArrowUp move focus (wrapping) to the next/previous ENABLED item;
//   - Home/End jump to the first/last enabled item;
//   - type-ahead moves to the next item whose label starts with the typed
//     string (buffer resets after ~500ms without a keystroke);
//   - ArrowRight is left to the sub-menu TRIGGER (`[aria-haspopup="menu"]`
//     OWN button handler — the trigger opens the submenu itself, so this hook
//     has no role in it);
//   - ArrowLeft only acts when this level IS a sub-menu (closes it);
//   - Tab closes the whole menu tree without `preventDefault` (APG: Tab exits,
//     the natural browser tab order continues once the tree unmounts).
// Roving focus is managed imperatively (like `use-popover-position.ts` writes
// inline coordinates): the focused item gets `tabIndex=0`, its siblings -1,
// and focus() moves it — no per-item state or registration, item DOM is read
// at keydown time so reordering stays correct. Enter/Space/click activation is
// NATIVE (the items are real buttons) and NOT handled here. Escape lives in
// `useDismissableLayer`. Document-level listener + containment check: works per
// level independently (root Content and each SubContent mount their own). All
// DOM access stays in effects/handlers → SSR-safe. Internal module: never
// exported from the package root (frontera §24).
import type { MenuItemModel } from "./menu.js";
import type { RefObject } from "react";

import { useEffect, useRef } from "react";

import {
  firstEnabledIndex,
  lastEnabledIndex,
  nextItemIndex,
  prevItemIndex,
  typeaheadIndex,
} from "./menu.js";

export interface MenuKeyboardOptions {
  /** The `role="menu"` panel this level owns. */
  menuRef: RefObject<HTMLElement | null>;
  /** When false every listener is inert and the type-ahead buffer is dropped. */
  active: boolean;
  /** ArrowLeft when this level is a sub-menu → close it (focus returns via
   *  the sub-content's focus-return). Undefined on the root level. */
  onCloseSubmenu?: () => void;
  /** Tab → close the whole tree (APG: Tab leaves the menu). */
  onCloseMenu?: () => void;
}

/** One real menuitem DOM node flattened to the pure model + the node itself. */
export interface MenuDomItem extends MenuItemModel {
  element: HTMLElement;
}

type MenuKeyboardCallbacks = Omit<MenuKeyboardOptions, "menuRef" | "active">;

const ITEM_SELECTOR = '[role="menuitem"]';
/** Type-ahead buffer lifetime (WAI-ARIA "rapid succession", Radix precedent). */
const TYPEAHEAD_TIMEOUT = 500;

/** All menuitems inside `menu` in DOM order, mapped to `{element, disabled,
 *  label}`. Disabled entries stay in the list — the pure math skips them. */
function getMenuItems(menu: HTMLElement): MenuDomItem[] {
  return Array.from(menu.querySelectorAll<HTMLElement>(ITEM_SELECTOR)).map((element) => ({
    element,
    disabled: element.getAttribute("aria-disabled") === "true" || element.hasAttribute("disabled"),
    label: element.getAttribute("aria-label") ?? (element.textContent ?? "").trim(),
  }));
}

/** Roving-focus write: the target keeps `tabIndex=0`, every other item -1, and
 *  focus moves. `tabIndex=-1` keeps non-active items out of the page tab order
 *  while menu items are still reachable programmatically (WAI-ARIA roving). */
function focusMenuItem(items: MenuDomItem[], index: number): void {
  const target = items[index];
  if (target === undefined) return;
  for (const { element } of items) element.tabIndex = -1;
  target.element.tabIndex = 0;
  target.element.focus();
}

/** Initial focus for a freshly opened level: first enabled item (APG). */
export function focusFirstMenuItem(menu: HTMLElement | null): void {
  if (!menu) return;
  focusMenuItem(getMenuItems(menu), firstEnabledIndex(getMenuItems(menu)));
}

export function useMenuKeyboard(options: MenuKeyboardOptions): void {
  const { menuRef, active } = options;
  const callbacksRef = useRef<MenuKeyboardCallbacks>({});

  // Latest-callback mirror (react-hooks/refs + precedent RRU-052): the keydown
  // listener never re-binds on re-renders; the refs always hold the newest
  // handlers, read only by the effects they are used in.
  useEffect(() => {
    callbacksRef.current = {
      onCloseSubmenu: options.onCloseSubmenu,
      onCloseMenu: options.onCloseMenu,
    };
  });

  useEffect(() => {
    if (!active) return;

    let typeBuffer = "";
    let timeout: number | null = null;

    const clearTypeahead = (): void => {
      typeBuffer = "";
      if (timeout !== null) window.clearTimeout(timeout);
      timeout = null;
    };

    const scheduleTypeaheadClear = (): void => {
      if (timeout !== null) window.clearTimeout(timeout);
      timeout = window.setTimeout(clearTypeahead, TYPEAHEAD_TIMEOUT);
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      const menu = menuRef.current;
      if (!menu) return;

      // Only keys originating inside THIS level's panel drive it (a sibling
      // overlay — e.g. an open submenu — has its own instance).
      const eventTarget = event.target;
      const focusedInside =
        eventTarget instanceof HTMLElement && menu.contains(eventTarget)
          ? eventTarget
          : document.activeElement instanceof HTMLElement && menu.contains(document.activeElement)
            ? document.activeElement
            : null;
      if (focusedInside === null) return;

      const items = getMenuItems(menu);
      const current = items.findIndex((entry) => entry.element === focusedInside);

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          focusMenuItem(items, nextItemIndex(items, current));
          break;
        case "ArrowUp":
          event.preventDefault();
          focusMenuItem(items, prevItemIndex(items, current));
          break;
        case "Home":
          event.preventDefault();
          focusMenuItem(items, firstEnabledIndex(items));
          break;
        case "End":
          event.preventDefault();
          focusMenuItem(items, lastEnabledIndex(items));
          break;
        case "ArrowRight":
          // Deliberately NOT handled here: expanding into a sub-menu belongs to
          // the sub-menu TRIGGER's own button handler (ArrowRight on it opens
          // the submenu). This hook only drives roving focus/type-ahead.
          break;
        case "ArrowLeft":
          // Sub-level only: close this level (focus returns via focus-return).
          if (callbacksRef.current.onCloseSubmenu !== undefined) {
            event.preventDefault();
            callbacksRef.current.onCloseSubmenu();
          }
          break;
        case "Tab":
          // Close the tree WITHOUT preventDefault — the browser's tab order
          // resumes naturally (APG) once the portaled panel unmounts.
          callbacksRef.current.onCloseMenu?.();
          break;
        default: {
          // Type-ahead on a single printable character (Space activates the
          // item natively and is excluded — WAI-ARIA).
          if (
            event.key.length !== 1 ||
            event.key === " " ||
            event.ctrlKey ||
            event.metaKey ||
            event.altKey
          ) {
            return;
          }
          event.preventDefault();
          typeBuffer += event.key;
          scheduleTypeaheadClear();
          let index = typeaheadIndex(items, current, typeBuffer);
          // Multi-char miss: retain only the last character and re-search
          // (Radix precedent) so typing "sh" with no match still lands on "s".
          // BUT only when the current item no longer matches the full buffer —
          // e.g. typing "se" while focused on "Settings" must NOT yank focus
          // to "Edit".
          if (index === current && typeBuffer.length > 1) {
            const currentLabel = items[current]?.label?.toLowerCase() ?? "";
            if (!currentLabel.startsWith(typeBuffer.toLowerCase())) {
              const last = typeBuffer.slice(-1);
              typeBuffer = last;
              index = typeaheadIndex(items, current, last);
            }
          }
          focusMenuItem(items, index);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      clearTypeahead();
    };
  }, [active, menuRef]);
}
