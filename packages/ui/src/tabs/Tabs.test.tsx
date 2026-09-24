// Behavioral spec for Tabs (RRU-058). Runs in happy-dom with a REAL DOM:
// ARIA contract / selection wiring / keyboard roving / controlled-uncontrolled
// as user gestures (precedent Select.test.tsx). The roving-focus MATH is
// unit-tested in utils/menu.test.ts (pure, synthetic item arrays); here the
// binding to real `[role="tab"]` nodes + the WAI-ARIA Tabs contract is
// exercised. Behavior over implementation.
import type { ReactElement } from "react";
import type { Root } from "react-dom/client";

import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Tabs, TabsList, TabsPanel, TabsTrigger } from "./index.js";

let host: HTMLDivElement | null = null;
let root: Root | null = null;

function render(ui: ReactElement): void {
  root = createRoot(host as HTMLDivElement);
  act(() => root!.render(ui));
}

function rerender(ui: ReactElement): void {
  act(() => root!.render(ui));
}

function unmount(): void {
  act(() => root?.unmount());
  root = null;
}

function pressKeyOn(selector: string, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const node = document.querySelector(selector);
  expect(node, `element ${selector} must exist`).not.toBeNull();
  let captured: KeyboardEvent | null = null;
  act(() => {
    const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init });
    captured = event;
    node!.dispatchEvent(event);
  });
  return captured!;
}

function clickOn(selector: string): void {
  const node = document.querySelector(selector);
  expect(node, `element ${selector} must exist`).not.toBeNull();
  act(() => {
    node!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

function trigger(id: string): HTMLButtonElement {
  return document.querySelector<HTMLButtonElement>(`[data-testid='${id}']`)!;
}

function panel(id: string): HTMLDivElement {
  return document.querySelector<HTMLDivElement>(`[data-testid='${id}']`)!;
}

interface ComposedTabsInput {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onListKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
}

function composedTabs({
  value,
  defaultValue,
  onValueChange,
  onListKeyDown,
}: ComposedTabsInput = {}): ReactElement {
  return (
    <Tabs value={value} defaultValue={defaultValue} onValueChange={onValueChange}>
      <Tabs.List data-testid="tablist" onKeyDown={onListKeyDown}>
        <Tabs.Trigger value="overview" data-testid="tab-overview">
          Overview
        </Tabs.Trigger>
        <Tabs.Trigger value="activity" data-testid="tab-activity">
          Activity
        </Tabs.Trigger>
        <Tabs.Trigger value="disabled" disabled data-testid="tab-disabled">
          Disabled
        </Tabs.Trigger>
        <Tabs.Trigger value="settings" data-testid="tab-settings">
          Settings
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Panel value="overview" data-testid="panel-overview">
        Overview content
      </Tabs.Panel>
      <Tabs.Panel value="activity" data-testid="panel-activity">
        Activity content
      </Tabs.Panel>
      <Tabs.Panel value="disabled" data-testid="panel-disabled">
        Disabled content
      </Tabs.Panel>
      <Tabs.Panel value="settings" data-testid="panel-settings">
        Settings content
      </Tabs.Panel>
    </Tabs>
  );
}

beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
});

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  host?.remove();
  host = null;
});

describe("Tabs ARIA contract (DoD #2, WAI-ARIA Tabs)", () => {
  it("list=tablist, triggers=role tab buttons with persistent ids + panel wiring", () => {
    render(composedTabs());
    const list = document.querySelector("[data-testid='tablist']")!;
    expect(list.getAttribute("role")).toBe("tablist");

    const tabs = document.querySelectorAll('[role="tab"]');
    expect(tabs).toHaveLength(4);
    for (const tab of tabs) {
      expect(tab.getAttribute("role")).toBe("tab");
      expect(tab.tagName.toLowerCase()).toBe("button");
      expect(tab.getAttribute("type")).toBe("button");
      expect(tab.getAttribute("id")).toMatch(/^rr-tabs-.+-tab-\d$/);
    }

    const panels = document.querySelectorAll('[role="tabpanel"]');
    expect(panels).toHaveLength(4);
    // The ids persist across renders and the wiring resolves: trigger
    // aria-controls → its panel id; panel aria-labelledby → its trigger id.
    const overviewTab = trigger("tab-overview");
    const overviewPanel = panel("panel-overview");
    expect(overviewTab.getAttribute("aria-controls")).toBe(overviewPanel.id);
    expect(overviewPanel.getAttribute("aria-labelledby")).toBe(overviewTab.id);
  });

  it("without a selection: NO aria-selected anywhere, first ENABLED tab is the tab stop, all panels hidden", () => {
    render(composedTabs());
    for (const tab of document.querySelectorAll('[role="tab"]')) {
      expect(tab.hasAttribute("aria-selected")).toBe(false);
    }
    expect(trigger("tab-overview").tabIndex).toBe(0);
    expect(trigger("tab-activity").tabIndex).toBe(-1);
    expect(trigger("tab-disabled").tabIndex).toBe(-1);
    expect(trigger("tab-settings").tabIndex).toBe(-1);
    for (const p of document.querySelectorAll('[role="tabpanel"]')) {
      expect(p.hasAttribute("hidden")).toBe(true);
    }
  });

  it("with a selection: aria-selected on the selected tab only; its panel is visible", () => {
    render(composedTabs({ defaultValue: "activity" }));
    expect(trigger("tab-activity").getAttribute("aria-selected")).toBe("true");
    expect(trigger("tab-overview").getAttribute("aria-selected")).toBe("false");
    expect(trigger("tab-settings").getAttribute("aria-selected")).toBe("false");
    expect(trigger("tab-activity").tabIndex).toBe(0);
    expect(panel("panel-activity").hasAttribute("hidden")).toBe(false);
    expect(panel("panel-overview").hasAttribute("hidden")).toBe(true);
    expect(panel("panel-settings").hasAttribute("hidden")).toBe(true);
  });

  it("disabled triggers carry native disabled + modifier and never the roving tab stop", () => {
    render(composedTabs());
    const disabled = trigger("tab-disabled");
    expect(disabled.disabled).toBe(true);
    expect(disabled.className).toContain("rr-tabs-trigger--disabled");
    expect(disabled.tabIndex).toBe(-1);

    // Seeding a DISABLED value (pathological) still leaves the tab stop on an
    // enabled tab — a disabled node can never take focus (WCAG).
    unmount();
    render(composedTabs({ defaultValue: "disabled" }));
    expect(trigger("tab-disabled").getAttribute("aria-selected")).toBe("true");
    expect(trigger("tab-disabled").tabIndex).toBe(-1);
    expect(trigger("tab-overview").tabIndex).toBe(0);
  });
});

describe("Tabs selection: click + clickability", () => {
  it("clicking a tab selects it, shows its panel and fires onValueChange", () => {
    const onValueChange = vi.fn();
    render(composedTabs({ defaultValue: "overview", onValueChange }));
    clickOn("[data-testid='tab-settings']");
    expect(onValueChange).toHaveBeenLastCalledWith("settings");
    expect(trigger("tab-settings").getAttribute("aria-selected")).toBe("true");
    expect(panel("panel-settings").hasAttribute("hidden")).toBe(false);
    expect(panel("panel-overview").hasAttribute("hidden")).toBe(true);
  });

  it("re-selecting the SAME tab does not re-fire onValueChange", () => {
    const onValueChange = vi.fn();
    render(composedTabs({ defaultValue: "overview", onValueChange }));
    clickOn("[data-testid='tab-overview']");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(trigger("tab-overview").getAttribute("aria-selected")).toBe("true");
  });

  it("disabled tabs swallow the click (never select, never fire)", () => {
    const onValueChange = vi.fn();
    render(composedTabs({ defaultValue: "overview", onValueChange }));
    clickOn("[data-testid='tab-disabled']");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(trigger("tab-overview").getAttribute("aria-selected")).toBe("true");
  });

  it("the consumer onClick is chained after the internal select", () => {
    const onClick = vi.fn();
    const onValueChange = vi.fn();
    render(
      <Tabs defaultValue="overview" onValueChange={onValueChange}>
        <Tabs.List>
          <Tabs.Trigger value="overview" data-testid="tab-overview" onClick={onClick}>
            Overview
          </Tabs.Trigger>
          <Tabs.Trigger value="settings">Settings</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Panel value="overview">O</Tabs.Panel>
        <Tabs.Panel value="settings">S</Tabs.Panel>
      </Tabs>,
    );
    clickOn("[data-testid='tab-overview']");
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(
      document.querySelector("[data-testid='tab-overview']")!.getAttribute("aria-selected"),
    ).toBe("true");
  });
});

describe("Tabs keyboard: automatic activation roving (WAI-ARIA)", () => {
  it("ArrowRight wraps and SKIPS disabled; focus follows the selection", () => {
    const onValueChange = vi.fn();
    render(composedTabs({ defaultValue: "overview", onValueChange }));
    act(() => trigger("tab-overview").focus());

    pressKeyOn("[data-testid='tab-overview']", "ArrowRight"); // → activity
    expect(trigger("tab-activity").getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(trigger("tab-activity"));
    pressKeyOn("[data-testid='tab-activity']", "ArrowRight"); // → settings (skips disabled)
    expect(trigger("tab-settings").getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(trigger("tab-settings"));
    pressKeyOn("[data-testid='tab-settings']", "ArrowRight"); // wraps → overview
    expect(trigger("tab-overview").getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(trigger("tab-overview"));
    expect(onValueChange).toHaveBeenCalledTimes(3);
    expect(onValueChange).toHaveBeenLastCalledWith("overview");
  });

  it("ArrowLeft wraps backward", () => {
    render(composedTabs({ defaultValue: "overview" }));
    act(() => trigger("tab-overview").focus());
    pressKeyOn("[data-testid='tab-overview']", "ArrowLeft"); // wraps → settings (skips disabled)
    expect(trigger("tab-settings").getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(trigger("tab-settings"));
  });

  it("Home/End jump to the first/last ENABLED tab", () => {
    render(composedTabs({ defaultValue: "settings" }));
    act(() => trigger("tab-settings").focus());
    pressKeyOn("[data-testid='tab-settings']", "Home");
    expect(trigger("tab-overview").getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(trigger("tab-overview"));
    pressKeyOn("[data-testid='tab-overview']", "End");
    expect(trigger("tab-settings").getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(trigger("tab-settings"));
  });

  it("arrow/Home/End preventDefault; Tab passes through UNprevented (APG)", () => {
    render(composedTabs({ defaultValue: "overview" }));
    act(() => trigger("tab-overview").focus());
    expect(pressKeyOn("[data-testid='tab-overview']", "ArrowRight").defaultPrevented).toBe(true);
    expect(pressKeyOn("[data-testid='tab-activity']", "ArrowLeft").defaultPrevented).toBe(true);
    expect(pressKeyOn("[data-testid='tab-overview']", "Home").defaultPrevented).toBe(true);
    expect(pressKeyOn("[data-testid='tab-overview']", "End").defaultPrevented).toBe(true);
    expect(pressKeyOn("[data-testid='tab-overview']", "Tab").defaultPrevented).toBe(false);
  });

  it("the consumer onKeyDown on the list is chained after the internal move", () => {
    const onListKeyDown = vi.fn();
    render(composedTabs({ defaultValue: "overview", onListKeyDown }));
    act(() => trigger("tab-overview").focus());
    pressKeyOn("[data-testid='tab-overview']", "ArrowRight");
    expect(onListKeyDown).toHaveBeenCalledTimes(1);
    expect(trigger("tab-activity").getAttribute("aria-selected")).toBe("true");
  });
});

describe("Tabs controlled/uncontrolled", () => {
  it("uncontrolled: defaultValue seeds; changes flow through onValueChange", () => {
    const onValueChange = vi.fn();
    render(composedTabs({ defaultValue: "overview", onValueChange }));
    clickOn("[data-testid='tab-activity']");
    expect(onValueChange).toHaveBeenLastCalledWith("activity");
    expect(trigger("tab-activity").getAttribute("aria-selected")).toBe("true");
  });

  it("controlled: onValueChange fires but the root keeps the value gate", () => {
    const onValueChange = vi.fn();
    render(composedTabs({ value: "overview", onValueChange }));
    clickOn("[data-testid='tab-settings']");
    expect(onValueChange).toHaveBeenLastCalledWith("settings");
    expect(trigger("tab-overview").getAttribute("aria-selected")).toBe("true");
    expect(panel("panel-overview").hasAttribute("hidden")).toBe(false);

    rerender(composedTabs({ value: "settings", onValueChange }));
    expect(trigger("tab-settings").getAttribute("aria-selected")).toBe("true");
    expect(panel("panel-settings").hasAttribute("hidden")).toBe(false);
  });
});

describe("Tabs SSR parity + composition contract", () => {
  it("serializes deterministically: ids, aria-selected, hidden count, wiring", () => {
    const markup = renderToStaticMarkup(composedTabs({ defaultValue: "activity" }));
    expect(markup).toContain('role="tablist"');
    expect(markup).toContain('role="tab"');
    expect(markup).toContain('role="tabpanel"');
    expect(markup).toContain('aria-selected="true"');
    // 1 active panel, 3 hidden — the hidden attribute is serialized server-side.
    const hiddenCount = markup.match(/\shidden=""/g) ?? [];
    expect(hiddenCount).toHaveLength(3);
    // The id wiring resolves against the generated ids on both ends.
    expect(markup).toContain('aria-controls="rr-tabs-');
    expect(markup).toContain('aria-labelledby="rr-tabs-');
  });

  it("the pure provider root serializes to nothing by itself", () => {
    const markup = renderToStaticMarkup(<Tabs>content</Tabs>);
    expect(markup).toBe("content");
  });

  it("merges className and passes through props on every slot", () => {
    const markup = renderToStaticMarkup(
      <Tabs defaultValue="overview">
        <Tabs.List className="probe" id="list" data-x="1">
          <Tabs.Trigger value="overview" className="probe-t" data-x="2">
            Overview
          </Tabs.Trigger>
          <Tabs.Trigger value="settings">Settings</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Panel value="overview" className="probe-p" title="panel">
          O
        </Tabs.Panel>
        <Tabs.Panel value="settings">S</Tabs.Panel>
      </Tabs>,
    );
    expect(markup).toContain('class="rr-tabs-list probe"');
    expect(markup).toContain('id="list"');
    expect(markup).toContain("data-x");
    expect(markup).toContain('class="rr-tabs-trigger probe-t"');
    expect(markup).toContain('class="rr-tabs-panel probe-p"');
    expect(markup).toContain('title="panel"');
  });

  it("exports the slots both standalone and mounted on the root (ADR-004)", () => {
    expect(Tabs.List).toBe(TabsList);
    expect(Tabs.Trigger).toBe(TabsTrigger);
    expect(Tabs.Panel).toBe(TabsPanel);
  });

  it("a slot used outside a <Tabs> root fails loud", () => {
    expect(() => renderToStaticMarkup(<Tabs.Trigger value="a">A</Tabs.Trigger>)).toThrow(
      "Tabs slots must be used within a <Tabs> root",
    );
    expect(() => renderToStaticMarkup(<Tabs.List>tabs</Tabs.List>)).toThrow(
      "Tabs slots must be used within a <Tabs> root",
    );
    expect(() => renderToStaticMarkup(<Tabs.Panel value="a">P</Tabs.Panel>)).toThrow(
      "Tabs slots must be used within a <Tabs> root",
    );
  });
});
