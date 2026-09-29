// Behavioral spec for Tabs (RRU-058). Runs in happy-dom with a REAL DOM:
// ARIA contract / selection wiring / keyboard roving / controlled-uncontrolled
// as user gestures (precedent Select.test.tsx). The roving-focus MATH is
// unit-tested in utils/menu.test.ts (pure, synthetic item arrays); here the
// binding to real `[role="tab"]` nodes + the WAI-ARIA Tabs contract is
// exercised. Behavior over implementation.
import type { ReactElement } from "react";

import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { auditA11y } from "../test-support/axe.js";

import { Tabs, TabsList, TabsPanel, TabsTrigger } from "./index.js";

/** The event object is returned so the APG preventDefault contract stays
 *  assertable (`defaultPrevented`) instead of inferred from a side effect. */
function pressKeyOn(target: Element, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init });
  fireEvent(target, event);
  return event;
}

const trigger = (id: string): HTMLButtonElement => screen.getByTestId(id);
const panel = (id: string): HTMLElement => screen.getByTestId(id);

async function clickOn(id: string): Promise<void> {
  await userEvent.click(screen.getByTestId(id));
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
    const { unmount } = render(composedTabs());
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
  it("clicking a tab selects it, shows its panel and fires onValueChange", async () => {
    const onValueChange = vi.fn();
    render(composedTabs({ defaultValue: "overview", onValueChange }));
    await clickOn("tab-settings");
    expect(onValueChange).toHaveBeenLastCalledWith("settings");
    expect(trigger("tab-settings").getAttribute("aria-selected")).toBe("true");
    expect(panel("panel-settings").hasAttribute("hidden")).toBe(false);
    expect(panel("panel-overview").hasAttribute("hidden")).toBe(true);
  });

  it("re-selecting the SAME tab does not re-fire onValueChange", async () => {
    const onValueChange = vi.fn();
    render(composedTabs({ defaultValue: "overview", onValueChange }));
    await clickOn("tab-overview");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(trigger("tab-overview").getAttribute("aria-selected")).toBe("true");
  });

  it("disabled tabs swallow the click (never select, never fire)", async () => {
    const onValueChange = vi.fn();
    render(composedTabs({ defaultValue: "overview", onValueChange }));
    await clickOn("tab-disabled");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(trigger("tab-overview").getAttribute("aria-selected")).toBe("true");
  });

  it("the consumer onClick is chained after the internal select", async () => {
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
    await clickOn("tab-overview");
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(trigger("tab-overview")).toHaveAttribute("aria-selected", "true");
  });
});

describe("Tabs keyboard: automatic activation roving (WAI-ARIA)", () => {
  it("ArrowRight wraps and SKIPS disabled; focus follows the selection", () => {
    const onValueChange = vi.fn();
    render(composedTabs({ defaultValue: "overview", onValueChange }));
    act(() => trigger("tab-overview").focus());

    pressKeyOn(trigger("tab-overview"), "ArrowRight"); // → activity
    expect(trigger("tab-activity").getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(trigger("tab-activity"));
    pressKeyOn(trigger("tab-activity"), "ArrowRight"); // → settings (skips disabled)
    expect(trigger("tab-settings").getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(trigger("tab-settings"));
    pressKeyOn(trigger("tab-settings"), "ArrowRight"); // wraps → overview
    expect(trigger("tab-overview").getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(trigger("tab-overview"));
    expect(onValueChange).toHaveBeenCalledTimes(3);
    expect(onValueChange).toHaveBeenLastCalledWith("overview");
  });

  it("ArrowLeft wraps backward", () => {
    render(composedTabs({ defaultValue: "overview" }));
    act(() => trigger("tab-overview").focus());
    pressKeyOn(trigger("tab-overview"), "ArrowLeft"); // wraps → settings (skips disabled)
    expect(trigger("tab-settings").getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(trigger("tab-settings"));
  });

  it("Home/End jump to the first/last ENABLED tab", () => {
    render(composedTabs({ defaultValue: "settings" }));
    act(() => trigger("tab-settings").focus());
    pressKeyOn(trigger("tab-settings"), "Home");
    expect(trigger("tab-overview").getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(trigger("tab-overview"));
    pressKeyOn(trigger("tab-overview"), "End");
    expect(trigger("tab-settings").getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(trigger("tab-settings"));
  });

  it("arrow/Home/End preventDefault; Tab passes through UNprevented (APG)", () => {
    render(composedTabs({ defaultValue: "overview" }));
    act(() => trigger("tab-overview").focus());
    expect(pressKeyOn(trigger("tab-overview"), "ArrowRight").defaultPrevented).toBe(true);
    expect(pressKeyOn(trigger("tab-activity"), "ArrowLeft").defaultPrevented).toBe(true);
    expect(pressKeyOn(trigger("tab-overview"), "Home").defaultPrevented).toBe(true);
    expect(pressKeyOn(trigger("tab-overview"), "End").defaultPrevented).toBe(true);
    expect(pressKeyOn(trigger("tab-overview"), "Tab").defaultPrevented).toBe(false);
  });

  it("the consumer onKeyDown on the list is chained after the internal move", () => {
    const onListKeyDown = vi.fn();
    render(composedTabs({ defaultValue: "overview", onListKeyDown }));
    act(() => trigger("tab-overview").focus());
    pressKeyOn(trigger("tab-overview"), "ArrowRight");
    expect(onListKeyDown).toHaveBeenCalledTimes(1);
    expect(trigger("tab-activity").getAttribute("aria-selected")).toBe("true");
  });
});

describe("Tabs panel as a tab stop (RRU-118, APG)", () => {
  /** Two compositions over the same widget, plus a sentinel control AFTER it:
   *  the sentinel is what makes "leaves the region" assertable at all.
   *
   *  `controls: "button"` — the active panel holds a control.
   *  `controls: "text"` — EVERY panel is text-only, the case RRU-118 is about.
   *
   *  Why the text-only composition is its own fixture and not the mixed one: a
   *  hidden panel's focusable content must be skipped by the tab order, and
   *  happy-dom's sequential navigation does not honour the `hidden` ATTRIBUTE
   *  on an ancestor, so the mixed case (text panel active + a control inside a
   *  HIDDEN sibling panel) cannot be modelled faithfully here. That combination
   *  is exactly the one the playground ships, and it is covered for real in
   *  `apps/playground/e2e/tabs.spec.ts` (ADR-005 §4: a limit of the environment
   *  is documented and covered elsewhere, not papered over). */
  function tabsWithSentinel(value: string, controls: "button" | "text" = "button"): ReactElement {
    return (
      <Tabs defaultValue={value}>
        <Tabs.List>
          <Tabs.Trigger value="text" data-testid="tab-text">
            Text
          </Tabs.Trigger>
          <Tabs.Trigger value="controls" data-testid="tab-controls">
            Controls
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Panel value="text" data-testid="panel-text">
          Only text here, nothing to focus.
        </Tabs.Panel>
        <Tabs.Panel value="controls" data-testid="panel-controls">
          {controls === "button" ? (
            <button type="button" data-testid="inner-button">
              Inner
            </button>
          ) : (
            "Also only text."
          )}
        </Tabs.Panel>
        <button type="button" data-testid="after-tabs">
          After
        </button>
      </Tabs>
    );
  }

  it("the ACTIVE panel is a tab stop; inactive panels emit no tabIndex", () => {
    render(tabsWithSentinel("text"));
    expect(panel("panel-text").tabIndex).toBe(0);
    // A hidden panel is already out of the tab order, so it does not even carry
    // the attribute: no stray tab stop can survive an activation change.
    expect(panel("panel-controls").hasAttribute("tabindex")).toBe(false);
  });

  it("the stop MOVES with the selection (a hidden panel never keeps it)", async () => {
    render(tabsWithSentinel("text"));
    await clickOn("tab-controls");
    expect(panel("panel-controls").tabIndex).toBe(0);
    expect(panel("panel-text").hasAttribute("tabindex")).toBe(false);
  });

  it("without a selection NO panel is a tab stop (nothing is visible to reach)", () => {
    render(
      <Tabs>
        <Tabs.List>
          <Tabs.Trigger value="text" data-testid="tab-text">
            Text
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Panel value="text" data-testid="panel-text">
          Text
        </Tabs.Panel>
      </Tabs>,
    );
    expect(panel("panel-text").hasAttribute("tabindex")).toBe(false);
  });

  it("Tab reaches a TEXT-ONLY panel and then leaves the widget in order", async () => {
    render(tabsWithSentinel("text", "text"));
    // Into the tablist: the roving stop sits on the selected tab.
    act(() => trigger("tab-text").focus());

    // The bug: the panel has nothing focusable inside it, so before RRU-118 the
    // focus skipped it entirely and jumped straight out of the widget.
    await userEvent.tab();
    expect(document.activeElement).toBe(panel("panel-text"));

    // And out again — the panel is the LAST stop of the region.
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByTestId("after-tabs"));
  });

  it("a panel WITH focusable content is also a stop, then yields to its content", async () => {
    render(tabsWithSentinel("controls"));
    act(() => trigger("tab-controls").focus());

    // The panel takes the stop even when it holds controls: the `tabIndex` is
    // decided in render-phase, not by inspecting the DOM, so the SAME markup and
    // the SAME behaviour hold for every panel (documented trade-off in
    // docs/tabs.mdx §Por qué así — the alternative needs a DOM-reading effect
    // and goes stale on async content).
    await userEvent.tab();
    expect(document.activeElement).toBe(panel("panel-controls"));

    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByTestId("inner-button"));

    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByTestId("after-tabs"));
  });

  it("the consumer's tabIndex cannot remove the stop (forced after the spread)", () => {
    render(
      <Tabs defaultValue="text">
        <Tabs.List>
          <Tabs.Trigger value="text" data-testid="tab-text">
            Text
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Panel value="text" data-testid="panel-text" tabIndex={-1}>
          Text
        </Tabs.Panel>
      </Tabs>,
    );
    expect(panel("panel-text").tabIndex).toBe(0);
  });

  it("SSR: tabindex lands ONLY on the active panel (deterministic markup)", () => {
    const markup = renderToStaticMarkup(composedTabs({ defaultValue: "activity" }));
    // Identity, not a coincidence of counts: the panel that carries the stop is
    // the one the SELECTED trigger controls (idref resolution is an allowed
    // internal assertion, ADR-005 §3).
    const activeTabTag = /<button[^>]*aria-selected="true"[^>]*>/.exec(markup)?.[0];
    expect(activeTabTag).toBeDefined();
    const activePanelId = /aria-controls="([^"]+)"/.exec(activeTabTag ?? "")?.[1];
    expect(activePanelId).toBeDefined();
    // Attribute-order agnostic: a spread prop (`data-testid`) is serialized
    // BEFORE the forced ARIA contract, so anchoring on `<div role=` would miss.
    const panelTags = markup.match(/<div[^>]*role="tabpanel"[^>]*>/g) ?? [];
    const activePanelTag = panelTags.find((tag) => tag.includes(`id="${activePanelId}"`));
    expect(activePanelTag).toContain('tabindex="0"');
    // The hidden panels never do — the attribute is decided in render-phase, so
    // the server ships the same tab order the client will have.
    for (const tag of panelTags.filter(
      (candidate) => !candidate.includes(`id="${activePanelId}"`),
    )) {
      expect(tag).not.toContain("tabindex");
    }
  });
});

describe("Tabs controlled/uncontrolled", () => {
  it("uncontrolled: defaultValue seeds; changes flow through onValueChange", async () => {
    const onValueChange = vi.fn();
    render(composedTabs({ defaultValue: "overview", onValueChange }));
    await clickOn("tab-activity");
    expect(onValueChange).toHaveBeenLastCalledWith("activity");
    expect(trigger("tab-activity").getAttribute("aria-selected")).toBe("true");
  });

  it("controlled: onValueChange fires but the root keeps the value gate", async () => {
    const onValueChange = vi.fn();
    const { rerender } = render(composedTabs({ value: "overview", onValueChange }));
    await clickOn("tab-settings");
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

  it("has no axe violations in the selected and unselected shapes", async () => {
    const selected = render(composedTabs({ defaultValue: "activity" }));
    await expect(auditA11y(selected.container)).resolves.toHaveNoViolations();
    selected.unmount();

    const idle = render(composedTabs());
    await expect(auditA11y(idle.container)).resolves.toHaveNoViolations();
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
