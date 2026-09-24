import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

/**
 * Props of {@link Tabs} (RRU-058), the COMPOSITION ROOT of the WAI-ARIA Tabs
 * pattern (guide §14/§15, ADR-004). Like {@link Select} (RRU-057) a PURE
 * provider: no DOM of its own (documented exception), the slots carry the DOM.
 *
 * Acts CONTROLLED when `value` is provided and UNCONTROLLED otherwise, seeded
 * by `defaultValue` — the value/onValueChange contract mirrors
 * {@link RadioGroup} (RRU-047): `onValueChange` fires only when the value
 * actually changes (re-selecting the same tab is a no-op call-wise).
 *
 * WAI-ARIA (automatic activation, APG): the list is `role="tablist"`, each
 * {@link Tabs.Trigger} `role="tab"` with a roving tabindex and
 * `aria-selected` **only when a selection exists** (never following focus
 * without activation), each {@link Tabs.Panel} `role="tabpanel"` wired by
 * `aria-labelledby`/`aria-controls` and kept MOUNTED with the `hidden`
 * attribute while inactive (tab reaches the panel content directly — no
 * reparenting, no focus loss). ArrowLeft/Right wrap and skip disabled tabs,
 * Home/End jump; Tab passes through unprevented.
 */
export interface TabsProps {
  /** The composite tree, rendered by the consumer:
   *  `<Tabs.List>` wrapping the `<Tabs.Trigger>`s, followed by one
   *  `<Tabs.Panel>` per trigger value. */
  children?: ReactNode;
  /** Controlled selected value; the trigger with this `value` is selected. */
  value?: string;
  /** Uncontrolled seed for the initially selected value. */
  defaultValue?: string;
  /** Called when the selection changes (click or automatic keyboard
   *  activation) — only when the value actually changes. */
  onValueChange?: (value: string) => void;
}

/**
 * Props of {@link Tabs.List} slot (RRU-058): the `role="tablist"` rail. Owns
 * the keyboard — a single React `onKeyDown` performs the roving focus +
 * automatic activation (WAI-ARIA Tabs), reusing the pure menu math from
 * `utils/menu.ts` (skip disabled + wrap). `id`/`title`/`data-*`/ARIA pass
 * through onto the `<div>`.
 */
export interface TabsListProps extends HTMLAttributes<HTMLDivElement> {
  /** The triggers, typically `<Tabs.Trigger>` slots. */
  children?: ReactNode;
}

/**
 * Props of {@link Tabs.Trigger} slot (RRU-058): one `role="tab"` `<button>`.
 * `type="button"` is forced after the spread (consumers cannot break it); the
 * ARIA contract (`role`, `id`/`aria-controls` wiring, roving `tabIndex`,
 * `aria-selected`) is forced too. `value` is the tab's identity — REQUIRED and
 * guaranteed in compile time (Radio `value` precedent, RRU-047). `disabled`
 * tabs are never focusable and never selectable (WCAG). `id`/`data-*`/ARIA
 * pass through.
 *
 * Note: `ButtonHTMLAttributes` already declares `value?`, but as
 * `string | readonly string[] | number` — narrowing that interface signature
 * would break `extends`, so it is omitted and redeclared as `string`
 * (Select.Item `value` precedent, RRU-057).
 */
export interface TabsTriggerProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "type" | "value"
> {
  /** The value this trigger activates (its identity in the tablist). */
  value: string;
  /** Disabled tabs are skipped by every navigation and swallow clicks. */
  disabled?: boolean;
  /** The visible label of the tab (its accessible name). */
  children?: ReactNode;
}

/**
 * Props of {@link Tabs.Panel} slot (RRU-058): one `role="tabpanel"`. Wired to
 * its trigger through `id`/`aria-labelledby` and kept MOUNTED, hidden only
 * while inactive (`hidden` attribute — the panel content stays in the DOM for
 * `Tab` order and layout, matching APG). `id`/`title`/`data-*`/ARIA pass
 * through onto the `<div>`.
 */
export interface TabsPanelProps extends HTMLAttributes<HTMLDivElement> {
  /** The value of the trigger this panel belongs to. */
  value: string;
  /** The panel content. */
  children?: ReactNode;
}

/** Closure with the generated DOM ids of one tab (index = order in the tree).
 *  Internal — never part of the public API. */
export interface TabsIdEntry {
  tabId: string;
  panelId: string;
  index: number;
}

/** Ordered model of one tab, aligned with the DOM order of the triggers
 *  (collect-items precedent, Select RRU-057). Internal. */
export interface TabsRovingItem {
  value: string;
  disabled: boolean;
}

/** Context flowing from the {@link Tabs} root to every slot (ADR-004): the
 *  selection state, the selection callback and the id wiring. Internal —
 *  never part of the public API. */
export interface TabsContextValue {
  selectedValue?: string;
  /** Value of the first ENABLED tab — the fallback tab stop in the roving
   *  tabindex when nothing is selected. */
  firstEnabledValue?: string;
  /** Ordered `<Tabs.Trigger>` model, aligned with the DOM order of the tabs —
   *  consumed by the shared roving math (`utils/menu.ts`). */
  tabs: TabsRovingItem[];
  idsByValue: ReadonlyMap<string, TabsIdEntry>;
  setValue: (value: string) => void;
}
