// Internal listbox keyboard hook (RRU-057). Binds the pure roving-focus/type-ahead
// math of `menu.ts` (RRU-055, generic item model — zero duplication) to ONE
// listbox popup (`role="listbox"`) and its `[role="option"]` descendants, per
// the WAI-ARIA read-only Combobox / Listbox-Select patterns:
//   - ArrowDown/ArrowUp move the roving tabindex (wrapping) to the next/previous
//     ENABLED option (disabled options are never focusable — WCAG);
//   - Home/End jump to the first/last enabled option;
//   - type-ahead moves to the next option whose label starts with the typed
//     string (buffer resets after ~500ms, Radix/menu precedent);
//   - Enter/Space SELECT the focused option (fires `onSelectItem`) — selection
//     happens by COMMIT, not follow-focus: `aria-selected` never chases focus;
//   - Tab closes the popup WITHOUT `preventDefault` — the browser's tab order
//     resumes naturally once the portaled panel unmounts (APG, same as menus).
// Escape/outside-pointer dismissal live in `useDismissableLayer` (RRU-052);
// group labels are NOT options (`[role="group"]`/`[role="presentation"]`), so
// the selector skips them and they never take roving focus.
// Roving focus is managed imperatively (`tabIndex=0/-1` + `focus()`); the item
// DOM is read at keydown time so reordering stays correct. The initial focus on
// open (selected option, else first enabled — APG) is exported for the
// content's mount effect. All DOM access lives in effects/handlers → SSR-safe.
// Internal module: never exported from the package root (frontera §24).
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

export interface ListboxKeyboardOptions {
  /** The `role="listbox"` popup this level owns. */
  listboxRef: RefObject<HTMLElement | null>;
  /** When false every listener is inert and the type-ahead buffer is dropped. */
  active: boolean;
  /** Currently selected value — used to seed the initial focus when opening. */
  selectedValue?: string;
  /** Enter/Space on an enabled option → commit the selection. */
  onSelectItem: (value: string) => void;
  /** Tab → close the popup (focus resumes outside, APG). */
  onCloseListbox: () => void;
}

/** One real `[role="option"]` DOM node flattened to the pure model + node. */
export interface ListboxDomOption extends MenuItemModel {
  element: HTMLElement;
  value: string;
}

type ListboxCallbacks = Partial<Pick<ListboxKeyboardOptions, "onSelectItem" | "onCloseListbox">>;

const OPTION_SELECTOR = '[role="option"]';
/** Type-ahead buffer lifetime (WAI-ARIA "rapid succession", menu precedent). */
const TYPEAHEAD_TIMEOUT = 500;

/** All options inside `listbox` in DOM order. Disabled entries stay in the
 *  list — the pure math (`menu.ts`) skips them when navigating. */
function getOptions(listbox: HTMLElement): ListboxDomOption[] {
  return Array.from(listbox.querySelectorAll<HTMLElement>(OPTION_SELECTOR)).map((element) => ({
    element,
    disabled: element.getAttribute("aria-disabled") === "true",
    label: element.getAttribute("aria-label") ?? (element.textContent ?? "").trim(),
    value: element.getAttribute("data-value") ?? "",
  }));
}

/** Roving-focus write: the target keeps `tabIndex=0`, every other option -1,
 *  and focus moves (`scrollIntoView` keeps it visible in a scrolling listbox). */
function focusOption(options: ListboxDomOption[], index: number): void {
  const target = options[index];
  if (target === undefined) return;
  for (const option of options) option.element.tabIndex = -1;
  target.element.tabIndex = 0;
  target.element.focus();
  if (typeof target.element.scrollIntoView === "function") {
    target.element.scrollIntoView({ block: "nearest" });
  }
}

/** Initial focus for a freshly opened listbox (APG): the SELECTED option when
 *  there is one (and it is enabled), else the first enabled one. */
export function focusSelectedOption(
  listbox: HTMLElement | null,
  selectedValue: string | undefined,
): void {
  if (!listbox) return;
  const options = getOptions(listbox);
  const selectedIndex = options.findIndex(
    (option) => option.value === selectedValue && !option.disabled,
  );
  focusOption(options, selectedIndex >= 0 ? selectedIndex : firstEnabledIndex(options));
}

export function useListboxKeyboard(options: ListboxKeyboardOptions): void {
  const { listboxRef, active } = options;
  const callbacksRef = useRef<ListboxCallbacks>({});

  // Latest-callback mirror (react-hooks/refs + precedent RRU-052): the keydown
  // listener never re-binds on re-renders; the refs always hold the newest
  // handlers, read only by the effect that owns them.
  useEffect(() => {
    callbacksRef.current = {
      onSelectItem: options.onSelectItem,
      onCloseListbox: options.onCloseListbox,
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
      const listbox = listboxRef.current;
      if (!listbox) return;

      // Only keys originating inside THIS listbox drive it (every overlay
      // mounts its own instance; a sibling overlay keeps its own handlers).
      const eventTarget = event.target;
      const focusedInside =
        eventTarget instanceof HTMLElement && listbox.contains(eventTarget)
          ? eventTarget
          : document.activeElement instanceof HTMLElement &&
              listbox.contains(document.activeElement)
            ? document.activeElement
            : null;
      if (focusedInside === null) return;

      const options = getOptions(listbox);
      const current = options.findIndex((entry) => entry.element === focusedInside);

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          focusOption(options, nextItemIndex(options, current));
          break;
        case "ArrowUp":
          event.preventDefault();
          focusOption(options, prevItemIndex(options, current));
          break;
        case "Home":
          event.preventDefault();
          focusOption(options, firstEnabledIndex(options));
          break;
        case "End":
          event.preventDefault();
          focusOption(options, lastEnabledIndex(options));
          break;
        case "Enter":
        case " ":
          // Commit-on-activation: select the focused option and close (the
          // focus-return of the content restores the trigger). A div option
          // needs the preventDefault so Space does not scroll and Enter does
          // not submit a surrounding form.
          event.preventDefault();
          {
            const item = options[current];
            if (item !== undefined && !item.disabled) {
              callbacksRef.current.onSelectItem?.(item.value);
            }
          }
          break;
        case "Tab":
          // Close WITHOUT preventDefault — the browser's tab order resumes
          // naturally once the portaled panel unmounts (APG, menu precedent).
          callbacksRef.current.onCloseListbox?.();
          break;
        default: {
          // Type-ahead on a single printable character (Space selects and is
          // excluded — WAI-ARIA, menu precedent).
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
          let index = typeaheadIndex(options, current, typeBuffer);
          // Multi-char miss: retain only the last character and re-search
          // (menu precedent) so typing "sy" with no match still lands on "s".
          if (index === current && typeBuffer.length > 1) {
            const currentLabel = options[current]?.label?.toLowerCase() ?? "";
            if (!currentLabel.startsWith(typeBuffer.toLowerCase())) {
              const last = typeBuffer.slice(-1);
              typeBuffer = last;
              index = typeaheadIndex(options, current, last);
            }
          }
          focusOption(options, index);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      clearTypeahead();
    };
  }, [active, listboxRef]);
}
