// Internal roving-focus + type-ahead math for menus (RRU-055). Pure DOM-free
// functions over a lightweight item model, mirroring the split of
// `popover.ts` (pure geometry) vs `use-popover-position.ts` (DOM wiring): the
// keyboard *decisions* are unit-tested here with synthetic item arrays and the
// binding to real `[role="menuitem"]` nodes lives in
// `use-menu-keyboard.ts`. Zero deps. Internal module: never exported from the
// package root (frontera §24).
export interface MenuItemModel {
  /** Disabled items are skipped by every navigation (WCAG: not focusable). */
  disabled: boolean;
  /** Text used by type-ahead matching (lowercased on compare). */
  label?: string;
}

/** Index of the first (or -1) enabled item. */
export function firstEnabledIndex(items: MenuItemModel[]): number {
  return scan(items, -1, 1);
}

/** Index of the last (or -1) enabled item. */
export function lastEnabledIndex(items: MenuItemModel[]): number {
  return scan(items, -1, -1);
}

/** Index of the next enabled item after `current`, wrapping to the first when
 *  `current` is the last enabled one; `-1` if none or the list is empty. A
 *  `current` of `-1` (no focused item yet) resolves to the first enabled. */
export function nextItemIndex(items: MenuItemModel[], current: number): number {
  return scan(items, current, 1);
}

/** Index of the previous enabled item before `current`, wrapping to the last
 *  when `current` is the first enabled one; `-1` if none or empty. A `current`
 *  of `-1` resolves to the last enabled. */
export function prevItemIndex(items: MenuItemModel[], current: number): number {
  return scan(items, current, -1);
}

function scan(items: MenuItemModel[], current: number, dir: 1 | -1): number {
  const length = items.length;
  if (length === 0) return -1;
  let cursor = current < 0 ? (dir === 1 ? -1 : length) : current;
  for (let step = 0; step < length; step++) {
    cursor = (cursor + dir + length) % length;
    const item = items[cursor];
    if (item !== undefined && !item.disabled) return cursor;
  }
  return -1;
}

/** Type-ahead: index of the first enabled item AFTER `current` (wrapping)
 *  whose `label` starts with `query` (case-insensitive). Returns `current`
 *  when nothing later matches — callers may then re-search from the start. */
export function typeaheadIndex(items: MenuItemModel[], current: number, query: string): number {
  const normalized = query.toLowerCase().trim();
  const length = items.length;
  if (length === 0 || normalized === "") return current;
  for (let step = 1; step <= length; step++) {
    const index = (current + step) % length;
    const item = items[index];
    if (item === undefined || item.disabled) continue;
    if ((item.label ?? "").toLowerCase().startsWith(normalized)) return index;
  }
  return current;
}
