// Behavioral spec for Popover (RRU-054). Runs in happy-dom with a REAL DOM:
// open/toggle/dismiss/focus/keyboard as user gestures (precedent Dialog.test.tsx)
// plus one integration case pinning the flip/overflow DoD on the inline style.
// Positioning geometry itself is unit-tested in utils/popover.test.ts (pure,
// synthetic rects); here the DOM measurement + hook wiring is exercised with
// stubbed rects (happy-dom has no layout engine). Behavior over implementation.
import type { ReactElement } from "react";

import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { auditA11y } from "../test-support/axe.js";

import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "./index.js";

/** Portaled content lives outside RTL's `container`, so query the document. */
const qs = <T extends Element>(selector: string): T | null =>
  document.body.querySelector<T>(selector);

const panel = () => screen.queryByRole("dialog");
const triggerButton = () => screen.getByTestId("trigger");

function pressKey(key: string, init: KeyboardEventInit = {}): void {
  fireEvent.keyDown(document, { key, ...init });
}

function pointerDownOn(target: Element): void {
  fireEvent.pointerDown(target);
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

const realDivRect = HTMLDivElement.prototype.getBoundingClientRect;
const realButtonRect = HTMLButtonElement.prototype.getBoundingClientRect;
let anchorRectMock: RectMock | null = null;
let panelRectMock: RectMock | null = null;
let realInnerWidth: PropertyDescriptor | undefined;
let realInnerHeight: PropertyDescriptor | undefined;

function mockGeometry(anchor: RectMock, panelRect: RectMock): void {
  anchorRectMock = anchor;
  panelRectMock = panelRect;
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

/** userEvent focuses the trigger on click the way a real browser does. */
async function openViaTrigger(): Promise<{ trigger: HTMLElement; panel: HTMLElement }> {
  const user = userEvent.setup();
  const trigger = triggerButton();

  await user.click(trigger);

  const opened = screen.getByRole("dialog");
  expect(trigger).toHaveAttribute("aria-expanded", "true");
  return { trigger, panel: opened };
}

describe("Popover open/close flow (DoD #2)", () => {
  it("trigger ARIA contract: haspopup/expanded/controls, content is a non-modal dialog", async () => {
    render(composedPopover());
    expect(panel()).toBeNull();

    const trigger = triggerButton();
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger.getAttribute("aria-controls")).toBeTruthy();

    const { panel: content } = await openViaTrigger();
    expect(content).toHaveAttribute("role", "dialog");
    expect(content).not.toHaveAttribute("aria-modal"); // non-modal
    // aria-controls resolves to the panel's own id.
    expect(trigger.getAttribute("aria-controls")).toBe(content.id);
  });

  it("initial focus lands on the first focusable child; falls back to the panel", async () => {
    const { unmount } = render(composedPopover());
    await openViaTrigger();
    expect(document.activeElement).toBe(screen.getByTestId("first"));

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
    const { panel: barePanel } = await openViaTrigger();
    expect(document.activeElement).toBe(barePanel);
  });

  it("Escape closes and restores focus to the trigger", async () => {
    render(composedPopover());
    const { trigger } = await openViaTrigger();

    pressKey("Escape");

    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("outside pointer-down closes; pointer-down inside the panel does not", async () => {
    render(
      <div>
        <button data-testid="outside">outside</button>
        {composedPopover()}
      </div>,
    );
    await openViaTrigger();
    pointerDownOn(screen.getByTestId("outside"));
    expect(panel()).toBeNull();

    await openViaTrigger();
    pointerDownOn(screen.getByTestId("first"));
    expect(panel()).not.toBeNull();
  });

  it("re-clicking the trigger toggles closed (trigger is inside the dismiss layer)", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Popover defaultOpen onOpenChange={onOpenChange}>
        <Popover.Trigger data-testid="trigger">Open</Popover.Trigger>
        <Popover.Content>
          <button>Item</button>
        </Popover.Content>
      </Popover>,
    );
    const trigger = triggerButton();
    expect(panel()).not.toBeNull();

    // Pointer-down on the trigger must NOT dismiss (it is an inside node), so
    // the following click performs a single toggle to closed — not close→reopen.
    pointerDownOn(trigger);
    expect(panel()).not.toBeNull();
    await user.click(trigger);

    expect(panel()).toBeNull();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(onOpenChange).toHaveBeenCalledTimes(1);
  });

  it("focus may leave the panel without closing (non-modal)", async () => {
    render(
      <div>
        <button data-testid="elsewhere">outside</button>
        <Popover>
          <Popover.Trigger data-testid="trigger">Open</Popover.Trigger>
          <Popover.Content>no focusable children — the panel holds focus</Popover.Content>
        </Popover>
      </div>,
    );
    const { panel: content } = await openViaTrigger();
    expect(document.activeElement).toBe(content);

    // Non-modal: moving focus elsewhere (the Tab path a trap would keep
    // cycling inside the overlay) neither closes the popover nor holds focus.
    // happy-dom has no native Tab navigation — the focus-trap is the only
    // thing that would move focus on its own — so the behavioral contract is
    // asserted with a real focus move.
    const elsewhere = screen.getByTestId("elsewhere");
    act(() => elsewhere.focus());
    expect(document.activeElement).toBe(elsewhere);
    expect(content.isConnected).toBe(true);
  });

  it("has no axe violations while open (labelled non-modal dialog)", async () => {
    render(composedPopover());
    await openViaTrigger();

    await expect(auditA11y(document.body)).resolves.toHaveNoViolations();
  });
});

describe("Popover ARIA wiring + controlled/uncontrolled", () => {
  it("associates the Title via aria-labelledby when present; never empty otherwise", async () => {
    const { unmount } = render(composedPopover());
    const { panel: titled } = await openViaTrigger();
    const title = qs(".rr-popover-title") as HTMLElement;
    expect(titled.getAttribute("aria-labelledby")).toBe(title.id);
    expect(screen.getByRole("dialog", { name: "Settings" })).toBe(titled);

    unmount();
    render(composedPopover({ withTitle: false }));
    const { panel: barePanel } = await openViaTrigger();
    expect(barePanel).not.toHaveAttribute("aria-labelledby");
  });

  it("controlled: onOpenChange fires and the root keeps the gate", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <Popover open={false} onOpenChange={onOpenChange}>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>
          <Popover.Title>Title</Popover.Title>
        </Popover.Content>
      </Popover>,
    );

    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(panel()).toBeNull();

    rerender(
      <Popover open onOpenChange={onOpenChange}>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>
          <Popover.Title>Title</Popover.Title>
        </Popover.Content>
      </Popover>,
    );
    expect(panel()).not.toBeNull();

    pressKey("Escape");
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(panel()).not.toBeNull();
  });

  it("uncontrolled: defaultOpen renders; Escape closes", () => {
    render(composedPopover({ defaultOpen: true }));
    expect(panel()).not.toBeNull();
    pressKey("Escape");
    expect(panel()).toBeNull();
  });
});

describe("Popover positioning integration (DoD #1)", () => {
  it("writes the flipped/clamped position to the panel inline style", () => {
    // Anchor near the bottom of a small viewport: "bottom" must flip to "top"
    // and stay fully inside (anchorCenter 60, panelTop 312 — see popover.test.ts).
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 320 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 480 });
    realInnerWidth = Object.getOwnPropertyDescriptor(window, "innerWidth");
    realInnerHeight = Object.getOwnPropertyDescriptor(window, "innerHeight");
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

    const content = qs(".rr-popover-content") as HTMLElement;
    expect(content.style.left).toBe("60px");
    expect(content.style.top).toBe("312px");
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

  it("merges className and passes through props on the slots", async () => {
    render(
      <Popover>
        <Popover.Trigger className="probe" data-x="1" data-testid="trigger">
          Open
        </Popover.Trigger>
        <Popover.Content className="probe" data-x="1">
          <Popover.Title className="probe" data-x="1">
            Title
          </Popover.Title>
        </Popover.Content>
      </Popover>,
    );
    const trigger = screen.getByRole("button", { name: "Open" });
    expect(trigger.className).toBe("rr-popover-trigger probe");
    expect(trigger).toHaveAttribute("data-x", "1");

    await openViaTrigger();

    expect(qs(".rr-popover-content")?.className).toBe("rr-popover-content probe");
    expect(qs(".rr-popover-title")?.className).toBe("rr-popover-title probe");
  });

  it("exports the slots both standalone and mounted on the root (ADR-004)", () => {
    expect(Popover.Trigger).toBe(PopoverTrigger);
    expect(Popover.Content).toBe(PopoverContent);
    expect(Popover.Title).toBe(PopoverTitle);
  });
});
