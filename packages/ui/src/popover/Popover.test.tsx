// Behavioral spec for Popover (RRU-054). Runs in happy-dom with a REAL DOM:
// open/toggle/dismiss/focus/keyboard as user gestures (precedent Dialog.test.tsx)
// plus one integration case pinning the flip/overflow DoD on the inline style.
// Positioning geometry itself is unit-tested in utils/popover.test.ts (pure,
// synthetic rects); here the DOM measurement + hook wiring is exercised with
// stubbed rects (happy-dom has no layout engine). Behavior over implementation.
import type { ReactElement } from "react";
import type { Root } from "react-dom/client";

import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "./index.js";

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

function pressKey(key: string, init: KeyboardEventInit = {}): void {
  act(() => {
    document.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, ...init }));
  });
}

function pointerDownOn(selector: string): void {
  const node = document.querySelector(selector);
  expect(node, `element ${selector} must exist`).not.toBeNull();
  act(() => {
    node!.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
  });
}

function openViaTrigger(): { trigger: HTMLButtonElement; panel: HTMLElement } {
  const trigger = document.querySelector<HTMLButtonElement>("[data-testid='trigger']")!;
  expect(trigger, "trigger must exist").not.toBeNull();
  act(() => trigger.focus());
  act(() => trigger.click());

  const panel = document.querySelector<HTMLElement>("[role='dialog']")!;
  expect(panel, "popover must be open after trigger click").not.toBeNull();
  return { trigger, panel };
}

function composedPopover({
  defaultOpen = false,
  withTitle = true,
}: { defaultOpen?: boolean; withTitle?: boolean } = {}): ReactElement {
  return (
    <Popover defaultOpen={defaultOpen}>
      <Popover.Trigger data-testid="trigger">Open</Popover.Trigger>
      <Popover.Content data-testid="content">
        {withTitle ? <Popover.Title>Settings</Popover.Title> : null}
        <button data-testid="first">First</button>
        <button data-testid="second">Second</button>
      </Popover.Content>
    </Popover>
  );
}

// --- Geometry stubbing for the flip integration test (happy-dom has no
// layout): the rect mock feeds getBoundingClientRect of the anchor (button)
// and the panel (div). Cast-ish assignment: happy-dom's prototype returns
// DOMRect, the plain object satisfies the fields the hook reads (docs/typescript.md §6).
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

describe("Popover open/close flow (DoD #2)", () => {
  it("trigger ARIA contract: haspopup/expanded/controls, content is a non-modal dialog", () => {
    render(composedPopover());
    expect(document.querySelector("[role='dialog']")).toBeNull();

    const trigger = document.querySelector<HTMLButtonElement>("[data-testid='trigger']")!;
    expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.getAttribute("aria-controls")).toBeTruthy();

    const { panel } = openViaTrigger();
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(panel.getAttribute("role")).toBe("dialog");
    expect(panel.hasAttribute("aria-modal")).toBe(false); // non-modal
    // aria-controls resolves to the panel's own id.
    expect(trigger.getAttribute("aria-controls")).toBe(panel.id);
  });

  it("initial focus lands on the first focusable child; falls back to the panel", () => {
    render(composedPopover());
    const { panel } = openViaTrigger();
    expect(document.activeElement).toBe(
      document.querySelector<HTMLButtonElement>("[data-testid='first']"),
    );

    // Fallback case: a content WITHOUT any focusable child → the panel
    // (tabIndex=-1, ARIA APG non-modal dialog) becomes the initial-focus target.
    unmount();
    render(
      <Popover>
        <Popover.Trigger data-testid="trigger">Open</Popover.Trigger>
        <Popover.Content data-testid="content">
          <span>plain hint text, nothing focusable</span>
        </Popover.Content>
      </Popover>,
    );
    const { panel: barePanel } = openViaTrigger();
    expect(document.activeElement).toBe(barePanel);
    void panel;
  });

  it("Escape closes and restores focus to the trigger", () => {
    render(composedPopover());
    const { trigger } = openViaTrigger();
    pressKey("Escape");
    expect(document.querySelector("[role='dialog']")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("outside pointer-down closes; pointer-down inside the panel does not", () => {
    render(
      <div>
        <button data-testid="outside">outside</button>
        {composedPopover()}
      </div>,
    );
    openViaTrigger();
    pointerDownOn("[data-testid='outside']");
    expect(document.querySelector("[role='dialog']")).toBeNull();

    openViaTrigger();
    pointerDownOn("[data-testid='first']");
    expect(document.querySelector("[role='dialog']")).not.toBeNull();
  });

  it("re-clicking the trigger toggles closed (trigger is inside the dismiss layer)", () => {
    const onOpenChange = vi.fn();
    render(
      <Popover defaultOpen onOpenChange={onOpenChange}>
        <Popover.Trigger data-testid="trigger">Open</Popover.Trigger>
        <Popover.Content>
          <button>Item</button>
        </Popover.Content>
      </Popover>,
    );
    const trigger = document.querySelector<HTMLButtonElement>("[data-testid='trigger']")!;
    expect(document.querySelector("[role='dialog']")).not.toBeNull();

    // Pointer-down on the trigger must NOT dismiss (it is an inside node), so
    // the following click performs a single toggle to closed — not close→reopen.
    pointerDownOn("[data-testid='trigger']");
    expect(document.querySelector("[role='dialog']")).not.toBeNull();
    act(() => trigger.click());

    expect(document.querySelector("[role='dialog']")).toBeNull();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(onOpenChange).toHaveBeenCalledTimes(1);
  });

  it("focus may leave the panel without closing (non-modal)", () => {
    render(
      <div>
        <button data-testid="elsewhere">outside</button>
        <Popover>
          <Popover.Trigger data-testid="trigger">Open</Popover.Trigger>
          <Popover.Content>no focusable children — the panel holds focus</Popover.Content>
        </Popover>
      </div>,
    );
    const { panel } = openViaTrigger();
    expect(document.activeElement).toBe(panel);

    // Non-modal: moving focus elsewhere (the Tab path a trap would keep
    // cycling inside the overlay) neither closes the popover nor holds focus.
    // happy-dom has no native Tab navigation — the focus-trap is the only
    // thing that would move focus on its own — so the behavioral contract is
    // asserted with a real focus move.
    act(() => document.querySelector<HTMLButtonElement>("[data-testid='elsewhere']")!.focus());
    expect(document.activeElement).toBe(document.querySelector("[data-testid='elsewhere']"));
    expect(panel.isConnected).toBe(true);
  });
});

describe("Popover ARIA wiring + controlled/uncontrolled", () => {
  it("associates the Title via aria-labelledby when present; never empty otherwise", () => {
    render(composedPopover());
    const { panel } = openViaTrigger();
    const title = document.querySelector(".rr-popover-title")!;
    expect(panel.getAttribute("aria-labelledby")).toBe(title.id);

    unmount();
    render(composedPopover({ withTitle: false }));
    const { panel: barePanel } = openViaTrigger();
    expect(barePanel.hasAttribute("aria-labelledby")).toBe(false);
  });

  it("controlled: onOpenChange fires and the root keeps the gate", () => {
    const onOpenChange = vi.fn();
    render(
      <Popover open={false} onOpenChange={onOpenChange}>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>
          <Popover.Title>Title</Popover.Title>
        </Popover.Content>
      </Popover>,
    );
    document.querySelector<HTMLButtonElement>(".rr-popover-trigger")!.click();
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(document.querySelector("[role='dialog']")).toBeNull();

    rerender(
      <Popover open onOpenChange={onOpenChange}>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>
          <Popover.Title>Title</Popover.Title>
        </Popover.Content>
      </Popover>,
    );
    expect(document.querySelector("[role='dialog']")).not.toBeNull();

    pressKey("Escape");
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(document.querySelector("[role='dialog']")).not.toBeNull();
  });

  it("uncontrolled: defaultOpen renders; Escape closes", () => {
    render(composedPopover({ defaultOpen: true }));
    expect(document.querySelector("[role='dialog']")).not.toBeNull();
    pressKey("Escape");
    expect(document.querySelector("[role='dialog']")).toBeNull();
  });
});

describe("Popover positioning integration (DoD #1)", () => {
  it("writes the flipped/clamped position to the panel inline style", () => {
    // Anchor near the bottom of a small viewport: "bottom" must flip to "top"
    // and stay fully inside (anchorCenter 60, panelTop 312 — see popover.test.ts).
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 320 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 480 });
    mockGeometry(
      { left: 80, top: 400, width: 120, height: 40 },
      { left: 0, top: 0, width: 160, height: 80 },
    );

    render(
      <Popover defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>
          <Popover.Title>Title</Popover.Title>
          <button>Item</button>
        </Popover.Content>
      </Popover>,
    );
    const panel = document.querySelector<HTMLElement>(".rr-popover-content")!;
    expect(panel.style.left).toBe("60px");
    expect(panel.style.top).toBe("312px");
  });
});

describe("Popover SSR parity + composition contract", () => {
  it("renders provider + trigger server-side, never the portal content", () => {
    const markup = renderToStaticMarkup(
      <Popover>
        <Popover.Trigger className="probe">Open</Popover.Trigger>
        <Popover.Content>
          <Popover.Title>Title</Popover.Title>
        </Popover.Content>
      </Popover>,
    );
    expect(markup).toContain("rr-popover-trigger probe");
    expect(markup).toContain('aria-haspopup="dialog"');
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).not.toContain('role="dialog"');
  });

  it("merges className and passes through props on the slots", () => {
    render(
      <Popover>
        <Popover.Trigger className="probe" data-x="1">
          Open
        </Popover.Trigger>
        <Popover.Content className="probe" data-x="1">
          <Popover.Title className="probe" data-x="1">
            Title
          </Popover.Title>
        </Popover.Content>
      </Popover>,
    );
    const trigger = document.querySelector<HTMLButtonElement>(".rr-popover-trigger")!;
    expect(trigger.className).toBe("rr-popover-trigger probe");
    expect(trigger.getAttribute("data-x")).toBe("1");

    act(() => trigger.focus());
    act(() => trigger.click());
    expect(document.querySelector(".rr-popover-content")!.className).toBe(
      "rr-popover-content probe",
    );
    expect(document.querySelector(".rr-popover-title")!.className).toBe("rr-popover-title probe");
  });

  it("exports the slots both standalone and mounted on the root (ADR-004)", () => {
    expect(Popover.Trigger).toBe(PopoverTrigger);
    expect(Popover.Content).toBe(PopoverContent);
    expect(Popover.Title).toBe(PopoverTitle);
  });
});
