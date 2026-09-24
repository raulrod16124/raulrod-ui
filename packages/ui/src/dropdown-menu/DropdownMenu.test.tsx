// Behavioral spec for DropdownMenu (RRU-055). Runs in happy-dom with a REAL
// DOM: open/toggle/dismiss/focus/roving-keyboard/submenu as user gestures
// (precedent Popover.test.tsx / Dialog.test.tsx) plus integration cases
// pinning the flip/overflow DoD on the inline style. Positioning geometry
// itself is unit-tested in utils/popover.test.ts (pure, synthetic rects); here
// the DOM measurement + hook wiring is exercised with stubbed rects (happy-dom
// has no layout engine). Submenu-opening keys target the real node: React's
// delegated handlers receive document-level events, but the SUB-TRIGGER's own
// onKeyDown is a React handler, so ArrowRight is dispatched on the portaled
// node itself (verified in the RRU-055 session: React delegates keydown on
// portal content; pointer-enter is simulated from `pointerover`). Behavior
// over implementation.
import type { ReactElement } from "react";
import type { Root } from "react-dom/client";

import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./index.js";

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

/** Menu-direct keys (roving/type-ahead/Tab) travel through the DOCUMENT
 *  listener (use-menu-keyboard); the hook resolves the target from
 *  `document.activeElement` (containment check) so a document-level dispatch
 *  behaves like a real keypress when focus sits inside the panel. Escape is
 *  handled by the dismissable layer (document listener, no containment). */
function pressKey(key: string, init: KeyboardEventInit = {}): void {
  act(() => {
    document.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, ...init }));
  });
}

/** React-handler keys (SubTrigger's own onKeyDown) must be dispatched ON the
 *  node so they bubble through the (portaled) React delegation target. */
function keydownOn(selector: string, key: string): void {
  const node = document.querySelector<HTMLElement>(selector);
  expect(node, `element ${selector} must exist`).not.toBeNull();
  act(() => {
    node!.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
  });
}

function pointerDownOn(selector: string): void {
  const node = document.querySelector(selector);
  expect(node, `element ${selector} must exist`).not.toBeNull();
  act(() => {
    node!.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
  });
}

function pointerOverOn(selector: string): void {
  const node = document.querySelector(selector);
  expect(node, `element ${selector} must exist`).not.toBeNull();
  act(() => {
    node!.dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
  });
}

function openViaTrigger(): { trigger: HTMLButtonElement; menu: HTMLElement } {
  const trigger = document.querySelector<HTMLButtonElement>("[data-testid='trigger']")!;
  expect(trigger, "trigger must exist").not.toBeNull();
  act(() => trigger.focus());
  act(() => trigger.click());

  const menu = document.querySelector<HTMLElement>("[role='menu']")!;
  expect(menu, "menu must be open after trigger click").not.toBeNull();
  return { trigger, menu };
}

/** Default fixture: Edit, Share (disabled), Separator, [Sub: More → Duplicate,
 *  Delete], Settings. `withSub: false` keeps the menu sub-free for the
 *  roving/type-ahead cases that want a flat item list. */
function composedMenu({
  defaultOpen = false,
  withSub = true,
}: { defaultOpen?: boolean; withSub?: boolean } = {}): ReactElement {
  return (
    <DropdownMenu defaultOpen={defaultOpen}>
      <DropdownMenu.Trigger data-testid="trigger">Options</DropdownMenu.Trigger>
      <DropdownMenu.Content data-testid="content">
        <DropdownMenu.Item data-testid="edit">Edit</DropdownMenu.Item>
        <DropdownMenu.Item data-testid="share" disabled>
          Share
        </DropdownMenu.Item>
        <DropdownMenu.Separator />
        {withSub && (
          <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger data-testid="more">More</DropdownMenu.SubTrigger>
            <DropdownMenu.SubContent data-testid="sub">
              <DropdownMenu.Item data-testid="duplicate">Duplicate</DropdownMenu.Item>
              <DropdownMenu.Item data-testid="delete">Delete</DropdownMenu.Item>
            </DropdownMenu.SubContent>
          </DropdownMenu.Sub>
        )}
        <DropdownMenu.Item data-testid="settings">Settings</DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  );
}

// --- Geometry stubbing for the positioning integration tests (happy-dom has
// no layout): the rect mock feeds getBoundingClientRect of the anchors
// (buttons) and the panels (divs). Cast-ish assignment (docs/typescript.md §6).
interface RectMock {
  left: number;
  top: number;
  width: number;
  height: number;
}
let anchorRectMock: RectMock | null = null;
let panelRectMock: RectMock | null = null;

const realDivRect = HTMLDivElement.prototype.getBoundingClientRect;
const realButtonRect = HTMLButtonElement.prototype.getBoundingClientRect;
const realInnerWidth = Object.getOwnPropertyDescriptor(window, "innerWidth");
const realInnerHeight = Object.getOwnPropertyDescriptor(window, "innerHeight");

function mockGeometry(anchor: RectMock, panel: RectMock): void {
  anchorRectMock = anchor;
  panelRectMock = panel;
}

beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
  HTMLDivElement.prototype.getBoundingClientRect = function () {
    return panelRectMock !== null
      ? ({ ...panelRectMock } as unknown as DOMRect)
      : realDivRect.call(this);
  };
  HTMLButtonElement.prototype.getBoundingClientRect = function () {
    return anchorRectMock !== null
      ? ({ ...anchorRectMock } as unknown as DOMRect)
      : realButtonRect.call(this);
  };
});

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  host?.remove();
  host = null;
  anchorRectMock = null;
  panelRectMock = null;
  HTMLDivElement.prototype.getBoundingClientRect = realDivRect;
  HTMLButtonElement.prototype.getBoundingClientRect = realButtonRect;
  if (realInnerWidth) Object.defineProperty(window, "innerWidth", realInnerWidth);
  if (realInnerHeight) Object.defineProperty(window, "innerHeight", realInnerHeight);
});

describe("DropdownMenu trigger + open/close flow (DoD #2)", () => {
  it("trigger ARIA contract: haspopup/expanded/controls; panel is role=menu; sub-trigger contract", () => {
    render(composedMenu());
    expect(document.querySelector("[role='menu']")).toBeNull();

    const trigger = document.querySelector<HTMLButtonElement>("[data-testid='trigger']")!;
    expect(trigger.getAttribute("aria-haspopup")).toBe("menu");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.getAttribute("aria-controls")).toBeTruthy();

    const { menu } = openViaTrigger();
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(menu.getAttribute("role")).toBe("menu");
    expect(trigger.getAttribute("aria-controls")).toBe(menu.id);

    const subTrigger = document.querySelector<HTMLElement>("[data-testid='more']")!;
    expect(subTrigger.getAttribute("aria-haspopup")).toBe("menu");
    expect(subTrigger.getAttribute("aria-expanded")).toBe("false");
    expect(subTrigger.getAttribute("aria-controls")).toBeTruthy();
  });

  it("initial focus lands on the FIRST ENABLED item (disabled items skipped)", () => {
    render(composedMenu());
    openViaTrigger();
    expect(document.activeElement).toBe(
      document.querySelector<HTMLButtonElement>("[data-testid='edit']"),
    );
    // Roving tabindex write: the focused item carries 0, everything else -1.
    expect(document.querySelector<HTMLButtonElement>("[data-testid='edit']")!.tabIndex).toBe(0);
    expect(document.querySelector<HTMLButtonElement>("[data-testid='share']")!.tabIndex).toBe(-1);
  });

  it("item activation fires onSelect, closes the tree and restores focus to the trigger", () => {
    const onSelect = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <DropdownMenu onOpenChange={onOpenChange}>
        <DropdownMenu.Trigger data-testid="trigger">Options</DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <DropdownMenu.Item data-testid="item" onSelect={onSelect}>
            Choose
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu>,
    );
    const { trigger } = openViaTrigger();
    act(() => document.querySelector<HTMLButtonElement>("[data-testid='item']")!.click());

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(document.querySelector("[role='menu']")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("Escape closes and restores focus to the trigger", () => {
    render(composedMenu());
    const { trigger } = openViaTrigger();
    pressKey("Escape");
    expect(document.querySelector("[role='menu']")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("outside pointer-down closes; pointer-down inside the panel does not", () => {
    render(
      <div>
        <button data-testid="outside">outside</button>
        {composedMenu()}
      </div>,
    );
    openViaTrigger();
    pointerDownOn("[data-testid='outside']");
    expect(document.querySelector("[role='menu']")).toBeNull();

    openViaTrigger();
    pointerDownOn("[data-testid='edit']");
    expect(document.querySelector("[role='menu']")).not.toBeNull();
  });

  it("re-clicking the trigger toggles closed once (trigger is inside the dismiss layer)", () => {
    const onOpenChange = vi.fn();
    render(
      <div>
        <button data-testid="outside">outside</button>
        <DropdownMenu defaultOpen onOpenChange={onOpenChange}>
          <DropdownMenu.Trigger data-testid="trigger">Options</DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.Item>Edit</DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>
      </div>,
    );
    const trigger = document.querySelector<HTMLButtonElement>("[data-testid='trigger']")!;
    expect(document.querySelector("[role='menu']")).not.toBeNull();

    // Pointer-down on the trigger must NOT dismiss (it is an inside node), so
    // the following click performs a single toggle to closed — not close→reopen.
    pointerDownOn("[data-testid='trigger']");
    expect(document.querySelector("[role='menu']")).not.toBeNull();
    act(() => trigger.click());

    expect(document.querySelector("[role='menu']")).toBeNull();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(onOpenChange).toHaveBeenCalledTimes(1);
  });

  it("Tab closes the tree without stealing the tab (APG)", () => {
    render(composedMenu());
    const { trigger } = openViaTrigger();
    pressKey("Tab");
    expect(document.querySelector("[role='menu']")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});

describe("DropdownMenu keyboard: roving focus + type-ahead (DoD #2)", () => {
  it("ArrowDown moves to the next ENABLED item, wraps and skips disabled", () => {
    render(composedMenu());
    openViaTrigger();
    // [edit(0), share(disabled), more(2), settings(3)]
    pressKey("ArrowDown");
    expect(document.activeElement).toBe(document.querySelector("[data-testid='more']"));
    expect(document.querySelector<HTMLElement>("[data-testid='edit']")!.tabIndex).toBe(-1);
    expect(document.querySelector<HTMLElement>("[data-testid='more']")!.tabIndex).toBe(0);

    pressKey("ArrowDown");
    expect(document.activeElement).toBe(document.querySelector("[data-testid='settings']"));

    pressKey("ArrowDown");
    expect(document.activeElement).toBe(document.querySelector("[data-testid='edit']"));
  });

  it("ArrowUp moves backwards, wrapping and skipping disabled", () => {
    render(composedMenu());
    openViaTrigger();
    // From the first item (edit) ArrowUp wraps to the LAST enabled (settings).
    pressKey("ArrowUp");
    expect(document.activeElement).toBe(document.querySelector("[data-testid='settings']"));
    pressKey("ArrowUp");
    expect(document.activeElement).toBe(document.querySelector("[data-testid='more']"));
    // share is disabled: more → edit directly.
    pressKey("ArrowUp");
    expect(document.activeElement).toBe(document.querySelector("[data-testid='edit']"));
  });

  it("Home / End jump to the first / last enabled item", () => {
    render(composedMenu());
    openViaTrigger();
    pressKey("End");
    expect(document.activeElement).toBe(document.querySelector("[data-testid='settings']"));
    pressKey("Home");
    expect(document.activeElement).toBe(document.querySelector("[data-testid='edit']"));
  });

  it("type-ahead: rolling buffer matches the next item, skipping disabled", () => {
    render(
      <DropdownMenu>
        <DropdownMenu.Trigger data-testid="trigger">Options</DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <DropdownMenu.Item data-testid="edit">Edit</DropdownMenu.Item>
          <DropdownMenu.Item data-testid="save" disabled>
            Save
          </DropdownMenu.Item>
          <DropdownMenu.Item data-testid="settings">Settings</DropdownMenu.Item>
          <DropdownMenu.Item data-testid="share">Share</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu>,
    );
    openViaTrigger();
    // Focus Edit; "s" skips the DISABLED "Save" and lands on "Settings".
    pressKey("s");
    expect(document.activeElement).toBe(document.querySelector("[data-testid='settings']"));
    // Rolling buffer "se" keeps matching "Settings" (no jump to elsewhere).
    pressKey("e");
    expect(document.activeElement).toBe(document.querySelector("[data-testid='settings']"));
  });

  it("type-ahead is case-insensitive", () => {
    render(
      <DropdownMenu>
        <DropdownMenu.Trigger data-testid="trigger">Options</DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <DropdownMenu.Item data-testid="alpha">Alpha</DropdownMenu.Item>
          <DropdownMenu.Item data-testid="beta">Beta</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu>,
    );
    openViaTrigger();
    pressKey("B");
    expect(document.activeElement).toBe(document.querySelector("[data-testid='beta']"));
  });
});

describe("DropdownMenu submenu (RRU-055)", () => {
  function openSubmenu(): {
    trigger: HTMLButtonElement;
    menu: HTMLElement;
    sub: HTMLElement;
    more: HTMLElement;
  } {
    const { trigger, menu } = openViaTrigger();
    // Move focus from edit(0) to more(2), skipping disabled share(1).
    pressKey("ArrowDown");
    expect(document.activeElement).toBe(document.querySelector("[data-testid='more']"));
    const more = document.querySelector<HTMLElement>("[data-testid='more']")!;
    keydownOn("[data-testid='more']", "ArrowRight");

    const sub = document.querySelector<HTMLElement>("[data-testid='sub']")!;
    expect(sub, "submenu must be open after ArrowRight").not.toBeNull();
    return { trigger, menu, sub, more };
  }

  it("ArrowRight on a sub-trigger opens the submenu and focuses its first item", () => {
    render(composedMenu());
    const { menu, more } = openSubmenu();
    expect(document.activeElement).toBe(document.querySelector("[data-testid='duplicate']"));
    expect(more.getAttribute("aria-expanded")).toBe("true");
    const sub = document.querySelector<HTMLElement>("[data-testid='sub']")!;
    expect(more.getAttribute("aria-controls")).toBe(sub.id);
    // Root stays open — the sub floats beside it, not instead of it.
    expect(menu.isConnected).toBe(true);
  });

  it("ArrowDown inside the submenu roves between sub items", () => {
    render(composedMenu());
    openSubmenu();
    expect(document.activeElement).toBe(document.querySelector("[data-testid='duplicate']"));
    pressKey("ArrowDown");
    expect(document.activeElement).toBe(document.querySelector("[data-testid='delete']"));
    pressKey("ArrowDown");
    expect(document.activeElement).toBe(document.querySelector("[data-testid='duplicate']"));
  });

  it("ArrowLeft closes the submenu and returns focus to the sub-trigger; root stays open", () => {
    render(composedMenu());
    openSubmenu();
    pressKey("ArrowLeft");
    expect(document.querySelector("[data-testid='sub']")).toBeNull();
    expect(document.activeElement).toBe(document.querySelector("[data-testid='more']"));
    expect(document.querySelector("[role='menu']")).not.toBeNull();
    // The sub-trigger's aria-expanded follows its now-closed sub-level.
    const more = document.querySelector<HTMLElement>("[data-testid='more']")!;
    expect(more.getAttribute("aria-expanded")).toBe("false");
  });

  it("Escape closes one level at a time: sub, then root (topmost-aware)", () => {
    render(composedMenu());
    const { trigger } = openSubmenu();

    pressKey("Escape");
    expect(document.querySelector("[data-testid='sub']")).toBeNull();
    expect(document.querySelector("[role='menu']")).not.toBeNull();
    expect(document.activeElement).toBe(document.querySelector("[data-testid='more']"));

    pressKey("Escape");
    expect(document.querySelector("[role='menu']")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("selecting a sub-item closes the ENTIRE tree and returns focus to the root trigger", () => {
    render(composedMenu());
    const { trigger } = openSubmenu();
    act(() => document.querySelector<HTMLButtonElement>("[data-testid='delete']")!.click());

    expect(document.querySelector("[data-testid='sub']")).toBeNull();
    expect(document.querySelector("[role='menu']")).toBeNull();
    expect(document.activeElement).toBe(trigger);

    // Stale-guard: reopening mounts a fresh Sub → the submenu must be closed.
    act(() => trigger.click());
    expect(document.querySelector("[role='menu']")).not.toBeNull();
    expect(document.querySelector("[data-testid='sub']")).toBeNull();
  });

  it("pointer-enter on the sub-trigger opens the submenu (mouse flow)", () => {
    render(composedMenu());
    openViaTrigger();
    pointerOverOn("[data-testid='more']");
    expect(document.querySelector("[data-testid='sub']")).not.toBeNull();
    expect(document.activeElement).toBe(document.querySelector("[data-testid='duplicate']"));
  });
});

describe("DropdownMenu controlled/uncontrolled + composition", () => {
  it("controlled: onOpenChange fires and the root keeps the gate", () => {
    const onOpenChange = vi.fn();
    render(
      <DropdownMenu open={false} onOpenChange={onOpenChange}>
        <DropdownMenu.Trigger>Options</DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <DropdownMenu.Item>Edit</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu>,
    );
    document.querySelector<HTMLButtonElement>(".rr-dropdown-trigger")!.click();
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(document.querySelector("[role='menu']")).toBeNull();

    rerender(
      <DropdownMenu open onOpenChange={onOpenChange}>
        <DropdownMenu.Trigger>Options</DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <DropdownMenu.Item>Edit</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu>,
    );
    expect(document.querySelector("[role='menu']")).not.toBeNull();

    pressKey("Escape");
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(document.querySelector("[role='menu']")).not.toBeNull();
  });

  it("uncontrolled: defaultOpen renders; Escape closes", () => {
    render(composedMenu({ defaultOpen: true }));
    expect(document.querySelector("[role='menu']")).not.toBeNull();
    pressKey("Escape");
    expect(document.querySelector("[role='menu']")).toBeNull();
  });

  it("exports the slots both standalone and mounted on the root (ADR-004)", () => {
    expect(DropdownMenu.Trigger).toBe(DropdownMenuTrigger);
    expect(DropdownMenu.Content).toBe(DropdownMenuContent);
    expect(DropdownMenu.Item).toBe(DropdownMenuItem);
    expect(DropdownMenu.Separator).toBe(DropdownMenuSeparator);
    expect(DropdownMenu.Sub).toBe(DropdownMenuSub);
    expect(DropdownMenu.SubTrigger).toBe(DropdownMenuSubTrigger);
    expect(DropdownMenu.SubContent).toBe(DropdownMenuSubContent);
  });

  it("merges className and passes through props on the slots", () => {
    render(
      <DropdownMenu>
        <DropdownMenu.Trigger className="probe" data-x="1">
          Options
        </DropdownMenu.Trigger>
        <DropdownMenu.Content className="probe" data-x="1">
          <DropdownMenu.Item className="probe" data-x="1">
            Edit
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="probe" data-x="1" />
          <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger className="probe" data-x="1" data-testid="more">
              More
            </DropdownMenu.SubTrigger>
            <DropdownMenu.SubContent className="probe" data-x="1">
              <DropdownMenu.Item>Duplicate</DropdownMenu.Item>
            </DropdownMenu.SubContent>
          </DropdownMenu.Sub>
        </DropdownMenu.Content>
      </DropdownMenu>,
    );
    const trigger = document.querySelector<HTMLButtonElement>(".rr-dropdown-trigger")!;
    expect(trigger.className).toBe("rr-dropdown-trigger probe");
    expect(trigger.getAttribute("data-x")).toBe("1");

    act(() => trigger.focus());
    act(() => trigger.click());
    expect(document.querySelector(".rr-dropdown-menu")!.className).toBe("rr-dropdown-menu probe");
    expect(document.querySelector(".rr-dropdown-menu")!.getAttribute("data-x")).toBe("1");
    // Item + separator + sub-trigger class/props.
    const items = document.querySelectorAll<HTMLElement>(".rr-dropdown-item");
    expect(items.length).toBeGreaterThanOrEqual(2);
    for (const el of items) {
      if (el.getAttribute("data-x") === "1") expect(el.className).toContain("probe");
    }
    expect(
      document.querySelector<HTMLElement>(".rr-dropdown-separator")!.getAttribute("data-x"),
    ).toBe("1");
    expect(document.querySelector<HTMLElement>(".rr-dropdown-separator")!.className).toBe(
      "rr-dropdown-separator probe",
    );

    pointerOverOn("[data-testid='more']");
    const subContents = document.querySelectorAll<HTMLElement>(".rr-dropdown-menu");
    expect(subContents.length).toBe(2);
    const subPanel = subContents[1]!;
    expect(subPanel.className).toBe("rr-dropdown-menu probe");
    expect(subPanel.getAttribute("data-x")).toBe("1");
    expect(document.querySelector<HTMLElement>("[data-testid='more']")!.className).toBe(
      "rr-dropdown-item probe",
    );
  });
});

describe("DropdownMenu positioning integration (DoD #1)", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1920 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 1080 });
    mockGeometry(
      { left: 40, top: 20, width: 120, height: 40 },
      { left: 0, top: 0, width: 160, height: 80 },
    );
  });

  it("writes the bottom-start position to the root panel inline style", () => {
    render(composedMenu({ withSub: false }));
    openViaTrigger();
    const panel = document.querySelector<HTMLElement>(".rr-dropdown-menu")!;
    expect(panel.style.left).toBe("40px"); // anchor left (bottom-start)
    expect(panel.style.top).toBe("68px"); // anchor.top + anchor.height + margin(8)
  });

  it("writes the right-start position (margin 4) to the sub panel", () => {
    render(composedMenu());
    openViaTrigger();
    pressKey("ArrowDown");
    keydownOn("[data-testid='more']", "ArrowRight");

    const panels = document.querySelectorAll<HTMLElement>(".rr-dropdown-menu");
    expect(panels.length).toBe(2);
    const sub = panels[1]!;
    expect(sub.style.left).toBe("164px"); // anchor.left + anchor.width + margin(4)
    expect(sub.style.top).toBe("20px"); // anchor top (right-START, margin 4)
  });
});

describe("DropdownMenu SSR parity", () => {
  it("renders provider + trigger server-side, never the portaled panels", () => {
    const markup = renderToStaticMarkup(
      <DropdownMenu>
        <DropdownMenu.Trigger className="probe">Options</DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <DropdownMenu.Item>Edit</DropdownMenu.Item>
          <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger>More</DropdownMenu.SubTrigger>
            <DropdownMenu.SubContent>
              <DropdownMenu.Item>Duplicate</DropdownMenu.Item>
            </DropdownMenu.SubContent>
          </DropdownMenu.Sub>
        </DropdownMenu.Content>
      </DropdownMenu>,
    );
    expect(markup).toContain("rr-dropdown-trigger probe");
    expect(markup).toContain('aria-haspopup="menu"');
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).toContain('aria-controls="');
    expect(markup).not.toContain('role="menu"');
  });
});
