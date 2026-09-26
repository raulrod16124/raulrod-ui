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

import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { auditA11y } from "../test-support/axe.js";

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

/** Menu-direct keys (roving/type-ahead/Tab) travel through the DOCUMENT
 *  listener (use-menu-keyboard); the hook resolves the target from
 *  `document.activeElement` (containment check) so a document-level dispatch
 *  behaves like a real keypress when focus sits inside the panel. Escape is
 *  handled by the dismissable layer (document listener, no containment). */
function pressKey(key: string, init: KeyboardEventInit = {}): void {
  fireEvent.keyDown(document, { key, ...init });
}

/** React-handler keys (SubTrigger's own onKeyDown) must be dispatched ON the
 *  node so they bubble through the (portaled) React delegation target. */
function keydownOn(target: Element, key: string): void {
  fireEvent.keyDown(target, { key });
}

function pointerDownOn(target: Element): void {
  fireEvent.pointerDown(target);
}

function pointerOverOn(target: Element): void {
  fireEvent.pointerOver(target);
}

const menuPanel = () => screen.queryByRole("menu");
/** Positive lookup: fails loudly with a useful message when absent. */
const item = (id: string) => screen.getByTestId(id);
/** Negative lookup: for "this must be GONE" assertions. */
const maybeItem = (id: string) => screen.queryByTestId(id);
const triggerButton = () => screen.getByTestId("trigger");

/** The trigger is focused BEFORE the click, exactly as a browser does, so the
 *  focus-RESTORATION assertions describe a real user gesture. */
function openViaTrigger(): { trigger: HTMLElement; menu: HTMLElement } {
  const trigger = screen.getByTestId("trigger");
  act(() => trigger.focus());
  fireEvent.click(trigger);

  const opened = screen.getByRole("menu");
  expect(trigger).toHaveAttribute("aria-expanded", "true");
  return { trigger, menu: opened };
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
    expect(menuPanel()).toBeNull();

    const trigger = item("trigger");
    expect(trigger.getAttribute("aria-haspopup")).toBe("menu");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.getAttribute("aria-controls")).toBeTruthy();

    const { menu } = openViaTrigger();
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(menu.getAttribute("role")).toBe("menu");
    expect(trigger.getAttribute("aria-controls")).toBe(menu.id);

    const subTrigger = item("more");
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
    expect(item("edit").tabIndex).toBe(0);
    expect(item("share").tabIndex).toBe(-1);
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
    act(() => item("item").click());

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(menuPanel()).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("Escape closes and restores focus to the trigger", () => {
    render(composedMenu());
    const { trigger } = openViaTrigger();
    pressKey("Escape");
    expect(menuPanel()).toBeNull();
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
    pointerDownOn(item("outside"));
    expect(menuPanel()).toBeNull();

    openViaTrigger();
    pointerDownOn(item("edit"));
    expect(menuPanel()).not.toBeNull();
  });

  it("re-clicking the trigger toggles closed once (trigger is inside the dismiss layer)", async () => {
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
    const trigger = item("trigger");
    expect(menuPanel()).not.toBeNull();

    // Pointer-down on the trigger must NOT dismiss (it is an inside node), so
    // the following click performs a single toggle to closed — not close→reopen.
    pointerDownOn(item("trigger"));
    expect(menuPanel()).not.toBeNull();
    await userEvent.click(trigger);

    expect(menuPanel()).toBeNull();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(onOpenChange).toHaveBeenCalledTimes(1);
  });

  it("Tab closes the tree without stealing the tab (APG)", () => {
    render(composedMenu());
    const { trigger } = openViaTrigger();
    pressKey("Tab");
    expect(menuPanel()).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});

describe("DropdownMenu keyboard: roving focus + type-ahead (DoD #2)", () => {
  it("ArrowDown moves to the next ENABLED item, wraps and skips disabled", () => {
    render(composedMenu());
    openViaTrigger();
    // [edit(0), share(disabled), more(2), settings(3)]
    pressKey("ArrowDown");
    expect(document.activeElement).toBe(item("more"));
    expect(item("edit").tabIndex).toBe(-1);
    expect(item("more").tabIndex).toBe(0);

    pressKey("ArrowDown");
    expect(document.activeElement).toBe(item("settings"));

    pressKey("ArrowDown");
    expect(document.activeElement).toBe(item("edit"));
  });

  it("ArrowUp moves backwards, wrapping and skipping disabled", () => {
    render(composedMenu());
    openViaTrigger();
    // From the first item (edit) ArrowUp wraps to the LAST enabled (settings).
    pressKey("ArrowUp");
    expect(document.activeElement).toBe(item("settings"));
    pressKey("ArrowUp");
    expect(document.activeElement).toBe(item("more"));
    // share is disabled: more → edit directly.
    pressKey("ArrowUp");
    expect(document.activeElement).toBe(item("edit"));
  });

  it("Home / End jump to the first / last enabled item", () => {
    render(composedMenu());
    openViaTrigger();
    pressKey("End");
    expect(document.activeElement).toBe(item("settings"));
    pressKey("Home");
    expect(document.activeElement).toBe(item("edit"));
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
    expect(document.activeElement).toBe(item("settings"));
    // Rolling buffer "se" keeps matching "Settings" (no jump to elsewhere).
    pressKey("e");
    expect(document.activeElement).toBe(item("settings"));
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
    expect(document.activeElement).toBe(item("beta"));
  });
});

describe("DropdownMenu submenu (RRU-055)", () => {
  function openSubmenu(): {
    trigger: HTMLElement;
    menu: HTMLElement;
    sub: HTMLElement;
    more: HTMLElement;
  } {
    const { trigger, menu } = openViaTrigger();
    // Move focus from edit(0) to more(2), skipping disabled share(1).
    pressKey("ArrowDown");
    expect(document.activeElement).toBe(item("more"));
    const more = item("more");
    keydownOn(item("more"), "ArrowRight");

    const sub = item("sub");
    expect(sub, "submenu must be open after ArrowRight").not.toBeNull();
    return { trigger, menu, sub, more };
  }

  it("ArrowRight on a sub-trigger opens the submenu and focuses its first item", () => {
    render(composedMenu());
    const { menu, more } = openSubmenu();
    expect(document.activeElement).toBe(item("duplicate"));
    expect(more.getAttribute("aria-expanded")).toBe("true");
    const sub = item("sub");
    expect(more.getAttribute("aria-controls")).toBe(sub.id);
    // Root stays open — the sub floats beside it, not instead of it.
    expect(menu.isConnected).toBe(true);
  });

  it("ArrowDown inside the submenu roves between sub items", () => {
    render(composedMenu());
    openSubmenu();
    expect(document.activeElement).toBe(item("duplicate"));
    pressKey("ArrowDown");
    expect(document.activeElement).toBe(item("delete"));
    pressKey("ArrowDown");
    expect(document.activeElement).toBe(item("duplicate"));
  });

  it("ArrowLeft closes the submenu and returns focus to the sub-trigger; root stays open", () => {
    render(composedMenu());
    openSubmenu();
    pressKey("ArrowLeft");
    expect(maybeItem("sub")).toBeNull();
    expect(document.activeElement).toBe(item("more"));
    expect(menuPanel()).not.toBeNull();
    // The sub-trigger's aria-expanded follows its now-closed sub-level.
    const more = item("more");
    expect(more.getAttribute("aria-expanded")).toBe("false");
  });

  it("Escape closes one level at a time: sub, then root (topmost-aware)", () => {
    render(composedMenu());
    const { trigger } = openSubmenu();

    pressKey("Escape");
    expect(maybeItem("sub")).toBeNull();
    expect(menuPanel()).not.toBeNull();
    expect(document.activeElement).toBe(item("more"));

    pressKey("Escape");
    expect(menuPanel()).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("selecting a sub-item closes the ENTIRE tree and returns focus to the root trigger", async () => {
    render(composedMenu());
    const { trigger } = openSubmenu();
    act(() => item("delete").click());

    expect(maybeItem("sub")).toBeNull();
    expect(menuPanel()).toBeNull();
    expect(document.activeElement).toBe(trigger);

    // Stale-guard: reopening mounts a fresh Sub → the submenu must be closed.
    await userEvent.click(trigger);
    expect(menuPanel()).not.toBeNull();
    expect(maybeItem("sub")).toBeNull();
  });

  it("pointer-enter on the sub-trigger opens the submenu (mouse flow)", () => {
    render(composedMenu());
    openViaTrigger();
    pointerOverOn(item("more"));
    expect(item("sub")).not.toBeNull();
    expect(document.activeElement).toBe(item("duplicate"));
  });
});

describe("DropdownMenu controlled/uncontrolled + composition", () => {
  it("controlled: onOpenChange fires and the root keeps the gate", async () => {
    const onOpenChange = vi.fn();
    const view = render(
      <DropdownMenu open={false} onOpenChange={onOpenChange}>
        <DropdownMenu.Trigger>Options</DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <DropdownMenu.Item>Edit</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu>,
    );
    await userEvent.click(document.querySelector<HTMLButtonElement>(".rr-dropdown-trigger")!);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(menuPanel()).toBeNull();

    view.rerender(
      <DropdownMenu open onOpenChange={onOpenChange}>
        <DropdownMenu.Trigger>Options</DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <DropdownMenu.Item>Edit</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu>,
    );
    expect(menuPanel()).not.toBeNull();

    pressKey("Escape");
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(menuPanel()).not.toBeNull();
  });

  it("uncontrolled: defaultOpen renders; Escape closes", () => {
    render(composedMenu({ defaultOpen: true }));
    expect(menuPanel()).not.toBeNull();
    pressKey("Escape");
    expect(menuPanel()).toBeNull();
  });

  it("has no axe violations with the menu and submenu open", async () => {
    render(composedMenu());
    openViaTrigger();
    await userEvent.click(item("more"));

    await expect(auditA11y(document.body)).resolves.toHaveNoViolations();
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

  it("merges className and passes through props on the slots", async () => {
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
    await userEvent.click(trigger);
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

    pointerOverOn(item("more"));
    const subContents = document.querySelectorAll<HTMLElement>(".rr-dropdown-menu");
    expect(subContents.length).toBe(2);
    const subPanel = subContents[1]!;
    expect(subPanel.className).toBe("rr-dropdown-menu probe");
    expect(subPanel.getAttribute("data-x")).toBe("1");
    expect(item("more").className).toBe("rr-dropdown-item probe");
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
    keydownOn(item("more"), "ArrowRight");

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
