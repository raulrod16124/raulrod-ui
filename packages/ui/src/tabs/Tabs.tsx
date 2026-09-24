import type {
  TabsContextValue,
  TabsIdEntry,
  TabsListProps,
  TabsPanelProps,
  TabsProps,
  TabsRovingItem,
  TabsTriggerProps,
} from "./Tabs.types.js";
import type { KeyboardEvent, ReactNode } from "react";

import { Children, createContext, forwardRef, isValidElement, useContext, useState } from "react";

import { cx } from "../utils/cx.js";
import {
  firstEnabledIndex,
  lastEnabledIndex,
  nextItemIndex,
  prevItemIndex,
} from "../utils/menu.js";
import { useId } from "../utils/use-id.js";

/**
 * Tabs (RRU-058): WAI-ARIA Tabs with automatic activation (APG) — the list is
 * a `role="tablist"`, the triggers `role="tab"` with a roving tabindex and
 * `aria-selected` only when a selection exists, and the `role="tabpanel"`
 * panels stay MOUNTED, hidden with the `hidden` attribute while inactive (the
 * content keeps its natural Tab order and layout). Root: PURE provider, no DOM
 * of its own (same documented exception as Popover/DropdownMenu/Select,
 * ADR-004).
 *
 * API (RRU-058): `value`/`defaultValue`/`onValueChange` (RadioGroup precedent,
 * RRU-047 — fires only when the value actually changes).
 *
 * Keyboard (WAI-ARIA Tabs, automatic activation): ArrowLeft/Right wrap and
 * skip disabled; Home/End jump; all reusing the pure math of `utils/menu.ts`
 * (the same roving logic as the menu/listbox keyboard). Arrow/Home/End
 * `preventDefault`; Tab passes through UNprevented, so the focus leaves the
 * tablist into the active panel's content naturally (the panels are always in
 * the DOM). Focus + selection move together (activation by construction); a
 * `disabled` trigger never takes focus and never selects (WCAG).
 *
 * Horizontal only (closed decision): tabs render side-by-side; `aria-orientation`
 * stays at the tablist default.
 */

export function Tabs({ value, defaultValue, onValueChange, children }: TabsProps) {
  const baseId = useId("rr-tabs");

  const [uncontrolledValue, setUncontrolledValue] = useState<string | undefined>(defaultValue);
  const controlledValue = value !== undefined;
  const selectedValue = controlledValue ? value : uncontrolledValue;

  // Render-phase, side-effect free tab model (Select `collectItems` precedent)
  // → the ids/roving wiring never depend on the DOM and the markup is
  // identical on server and client.
  const tabs = collectTabs(children);
  const idsByValue = new Map<string, TabsIdEntry>();
  tabs.forEach((item, index) => {
    idsByValue.set(item.value, {
      tabId: `${baseId}-tab-${index}`,
      panelId: `${baseId}-panel-${index}`,
      index,
    });
  });
  const firstEnabledValue = tabs.find((item) => !item.disabled)?.value;

  const setValue = (next: string): void => {
    // Guard keeps the contract "onValueChange fires only when the value
    // actually changes" (RadioGroup/Select precedent).
    if (next !== selectedValue) {
      if (!controlledValue) setUncontrolledValue(next);
      onValueChange?.(next);
    }
  };

  const tabsContext: TabsContextValue = {
    selectedValue,
    firstEnabledValue,
    tabs,
    idsByValue,
    setValue,
  };

  return <TabsContext.Provider value={tabsContext}>{children}</TabsContext.Provider>;
}
Tabs.displayName = "Tabs";

/** `Tabs.List` slot: the `role="tablist"` rail. Owns the KEYBOARD through a
 *  single React `onKeyDown`: the DOM `[role="tab"]` nodes (in DOM order, which
 *  equals the collected model order) are navigated with the pure menu math —
 *  `nextItemIndex`/`prevItemIndex` wrap and skip disabled, `firstEnabledIndex`/
 *  `lastEnabledIndex` are Home/End; each move sets the value (automatic
 *  activation) AND focuses the tab. Tab is never prevented, so the active
 *  panel's content is the natural next tab stop. The consumer's onKeyDown is
 *  chained after the internal handling. */
export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(function TabsList(
  { className, onKeyDown, children, ...props },
  ref,
) {
  const tabs = useTabsContext();

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const nodes = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
    );
    const current = nodes.indexOf(event.target as HTMLButtonElement);
    switch (event.key) {
      case "ArrowRight":
      case "ArrowLeft": {
        event.preventDefault();
        move(
          tabs,
          nodes,
          event.key === "ArrowRight"
            ? nextItemIndex(tabs.tabs, current)
            : prevItemIndex(tabs.tabs, current),
        );
        break;
      }
      case "Home": {
        event.preventDefault();
        move(tabs, nodes, firstEnabledIndex(tabs.tabs));
        break;
      }
      case "End": {
        event.preventDefault();
        move(tabs, nodes, lastEnabledIndex(tabs.tabs));
        break;
      }
    }
    onKeyDown?.(event);
  };

  return (
    <div
      {...props}
      ref={ref}
      role="tablist"
      // `interactive-supports-focus`: the tablist is independently focusable
      // (tabIndex -1 — script-only, the roving tab stop lives on the tabs).
      tabIndex={-1}
      className={cx("rr-tabs-list", className)}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  );
});
TabsList.displayName = "TabsList";

/** `Tabs.Trigger` slot: one `role="tab"` `<button>` with the roving tabindex
 *  and the ARIA wiring forced after the spread. `aria-selected` is emitted
 *  ONLY when a selection exists (a freshly-mounted tablist with no value has
 *  no selected tab — APG), and the tab stop falls back to the first enabled
 *  tab then. The consumer's onClick is chained after the internal select. */
export const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(function TabsTrigger(
  { className, value, disabled = false, onClick, children, ...props },
  ref,
) {
  const tabs = useTabsContext();
  const entry = tabs.idsByValue.get(value);
  const hasSelection = tabs.selectedValue !== undefined;
  const isSelected = tabs.selectedValue === value;
  // The roving tab stop is ALWAYS a focusable (enabled) tab: a selected-but-
  // disabled value (pathological consumer seeding) shows as selected but must
  // not trap tabindex on a node that can never take focus (WCAG) — the stop
  // falls back to the first enabled tab.
  const hasStopOnSelected = isSelected && !disabled;
  const isTabStop = hasStopOnSelected || (!hasStopOnSelected && tabs.firstEnabledValue === value);

  return (
    <button
      {...props}
      ref={ref}
      type="button"
      role="tab"
      id={entry?.tabId}
      aria-selected={hasSelection ? isSelected : undefined}
      aria-controls={entry?.panelId}
      tabIndex={isTabStop ? 0 : -1}
      disabled={disabled}
      className={cx("rr-tabs-trigger", disabled && "rr-tabs-trigger--disabled", className)}
      onClick={(event) => {
        if (event.currentTarget.disabled) return;
        tabs.setValue(value);
        onClick?.(event);
      }}
    >
      {children}
    </button>
  );
});
TabsTrigger.displayName = "TabsTrigger";

/** `Tabs.Panel` slot: one `role="tabpanel"`, wired to its trigger via
 *  `aria-labelledby` and kept MOUNTED — `hidden` only while inactive, so the
 *  panel content keeps its natural Tab order and the layout does not shift
 *  (APG). The entrance animation lives on the visible state
 *  (`.rr-tabs-panel:not([hidden])`), replaying on each activation. */
export const TabsPanel = forwardRef<HTMLDivElement, TabsPanelProps>(function TabsPanel(
  { className, value, children, ...props },
  ref,
) {
  const tabs = useTabsContext();
  const active = tabs.selectedValue === value;
  const entry = tabs.idsByValue.get(value);

  return (
    <div
      {...props}
      ref={ref}
      role="tabpanel"
      id={entry?.panelId}
      aria-labelledby={entry?.tabId}
      hidden={!active}
      className={cx("rr-tabs-panel", className)}
    >
      {children}
    </div>
  );
});
TabsPanel.displayName = "TabsPanel";

// Slots mounted as properties of the root (ADR-004 §Decision mecánica):
// `<Tabs.List>`, `.Trigger`, `.Panel`.
Tabs.List = TabsList;
Tabs.Trigger = TabsTrigger;
Tabs.Panel = TabsPanel;

const TabsContext = createContext<TabsContextValue | null>(null);
TabsContext.displayName = "TabsContext";

function useTabsContext(): TabsContextValue {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs slots must be used within a <Tabs> root");
  }
  return context;
}

/** One keyboard move: selects the target (automatic activation) and moves
 *  focus to it. Both reads are guarded — the model and DOM aligned by index,
 *  but a render-after-collect mismatch (pathological) must fail soft. */
function move(tabs: TabsContextValue, nodes: HTMLButtonElement[], to: number): void {
  const item = tabs.tabs[to];
  const node = nodes[to];
  if (item === undefined || node === undefined) return;
  tabs.setValue(item.value);
  node.focus();
}

/** Composition root slot-detection (ADR-004, Select `collectItems` precedent):
 *  walks the children tree (recursively honoring arrays, fragments and
 *  conditional expressions) collecting the ordered `<Tabs.Trigger>` model —
 *  value + disabled. Render-phase + side-effect free → identical on server and
 *  client; the DOM order of the triggers equals this order (both follow the
 *  render tree), keeping the ids/roving wiring aligned. */
function collectTabs(children: ReactNode): TabsRovingItem[] {
  const tabs: TabsRovingItem[] = [];

  const walk = (node: ReactNode): void => {
    Children.forEach(node, (child) => {
      if (!isValidElement(child)) return;
      if (child.type === TabsTrigger) {
        const props = child.props as { value?: string; disabled?: boolean };
        if (props.value !== undefined) {
          tabs.push({ value: props.value, disabled: props.disabled === true });
        }
      }
      const nested = (child.props as { children?: ReactNode }).children;
      if (nested !== undefined) walk(nested);
    });
  };

  walk(children);
  return tabs;
}
