// Behavioral spec for Dialog (RRU-053). Runs in happy-dom with a REAL DOM:
// the DoD #1 flow (open → Tab → Escape → close → focus return) is exercised
// with actual focus tracking + key/pointer events, as established for the
// overlay primitives in RRU-052. Behavior over implementation.
import type { ReactElement } from "react";
import type { Root } from "react-dom/client";

import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

function openViaTrigger(selector = ".rr-dialog-trigger"): {
  trigger: HTMLButtonElement;
  panel: HTMLElement;
} {
  const trigger = document.querySelector<HTMLButtonElement>(selector)!;
  expect(trigger, `trigger ${selector} must exist`).not.toBeNull();
  // Real browsers focus the button on click; happy-dom does not, so model the
  // user gesture explicitly (needed to assert focus RESTORATION, DoD #1).
  act(() => trigger.focus());
  act(() => trigger.click());

  const panel = document.querySelector<HTMLElement>("[role='dialog']")!;
  expect(panel, "dialog must be open after trigger click").not.toBeNull();
  return { trigger, panel };
}

function composedDialog({ defaultOpen = false }: { defaultOpen?: boolean } = {}): ReactElement {
  return (
    <Dialog defaultOpen={defaultOpen}>
      <Dialog.Trigger data-testid="trigger">Delete project</Dialog.Trigger>
      <Dialog.Content data-testid="content">
        <Dialog.Header>
          <Dialog.Title>Delete project?</Dialog.Title>
          <Dialog.Description>This action cannot be undone.</Dialog.Description>
        </Dialog.Header>
        <Dialog.Footer>
          <button data-testid="cancel">Cancel</button>
          <button data-testid="confirm">Delete</button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
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

describe("Dialog full flow (DoD #1)", () => {
  it("open → initial focus on the panel → Tab wraps → Escape closes → focus back to the trigger", () => {
    render(composedDialog());

    expect(document.querySelector("[role='dialog']")).toBeNull();
    const { trigger, panel } = openViaTrigger();

    // Initial focus lands on the dialog container (ARIA APG modal pattern).
    expect(document.activeElement).toBe(panel);

    // Tab: panel is not in the tab order (tabIndex=-1), so the first Tab goes
    // to the first focusable (Cancel); the next wraps to the last (Delete), and
    // the next wraps back to the first.
    pressKey("Tab", { shiftKey: false });
    const cancel = document.querySelector<HTMLButtonElement>("[data-testid='cancel']")!;
    const confirm = document.querySelector<HTMLButtonElement>("[data-testid='confirm']")!;
    expect(document.activeElement).toBe(cancel);
    pressKey("Tab");
    expect(document.activeElement).toBe(confirm);
    pressKey("Tab");
    expect(document.activeElement).toBe(cancel);

    // Escape dismisses (topmost layer) and focus returns to the trigger.
    pressKey("Escape");
    expect(document.querySelector("[role='dialog']")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("backdrop pointer-down closes; pointer-down inside the panel does not", () => {
    render(composedDialog());
    openViaTrigger();

    pointerDownOn(".rr-dialog-backdrop");
    expect(document.querySelector("[role='dialog']")).toBeNull();

    openViaTrigger();
    pointerDownOn("[data-testid='confirm']");
    expect(document.querySelector("[role='dialog']")).not.toBeNull();
  });

  it("scroll lock is applied on open and restored on close", () => {
    render(composedDialog());
    openViaTrigger();
    expect(document.body.style.overflow).toBe("hidden");

    pressKey("Escape");
    expect(document.body.style.overflow).toBe("");
  });
});

describe("Dialog ARIA wiring (DoD #2)", () => {
  it("associates Title/Description when present; trigger carries haspopup/expanded/controls", () => {
    render(composedDialog());

    const trigger = document.querySelector<HTMLButtonElement>("[data-testid='trigger']")!;
    expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.getAttribute("aria-controls")).toBeTruthy();

    const { panel } = openViaTrigger();

    expect(panel.getAttribute("aria-modal")).toBe("true");
    expect(panel.getAttribute("aria-labelledby")).toBe(
      document.querySelector(".rr-dialog-title")!.getAttribute("id"),
    );
    expect(panel.getAttribute("aria-describedby")).toBe(
      document.querySelector(".rr-dialog-description")!.getAttribute("id"),
    );
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });

  it("never emits an empty aria-labelledby/aria-describedby without the slots", () => {
    render(
      <Dialog>
        <Dialog.Trigger>Open</Dialog.Trigger>
        <Dialog.Content>
          <p>No title or description slots.</p>
        </Dialog.Content>
      </Dialog>,
    );
    openViaTrigger();
    const panel = document.querySelector<HTMLElement>("[role='dialog']")!;
    expect(panel.hasAttribute("aria-labelledby")).toBe(false);
    expect(panel.hasAttribute("aria-describedby")).toBe(false);
  });
});

describe("Dialog controlled/uncontrolled", () => {
  it("controlled: onOpenChange fires and the root keeps the gate (open follows the prop)", () => {
    const onOpenChange = vi.fn();
    const ui = (
      <Dialog open={false} onOpenChange={onOpenChange}>
        <Dialog.Trigger>Open</Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Title>Title</Dialog.Title>
        </Dialog.Content>
      </Dialog>
    );
    render(ui);

    document.querySelector<HTMLButtonElement>(".rr-dialog-trigger")!.click();
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(document.querySelector("[role='dialog']")).toBeNull();

    rerender(
      <Dialog open onOpenChange={onOpenChange}>
        <Dialog.Trigger>Open</Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Title>Title</Dialog.Title>
        </Dialog.Content>
      </Dialog>,
    );
    expect(document.querySelector("[role='dialog']")).not.toBeNull();

    pressKey("Escape");
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(document.querySelector("[role='dialog']")).not.toBeNull();
  });

  it("uncontrolled: defaultOpen renders the dialog; Escape closes it", () => {
    render(composedDialog({ defaultOpen: true }));
    expect(document.querySelector("[role='dialog']")).not.toBeNull();
    pressKey("Escape");
    expect(document.querySelector("[role='dialog']")).toBeNull();
  });
});

describe("Dialog SSR parity + composition contract", () => {
  it("renders the provider + trigger but nothing portal-backed server-side (no hydration mismatch)", () => {
    const markup = renderToStaticMarkup(
      <Dialog>
        <Dialog.Trigger aria-label="Open">Open</Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Title>Title</Dialog.Title>
        </Dialog.Content>
      </Dialog>,
    );
    expect(markup).toContain("rr-dialog-trigger");
    expect(markup).toContain('aria-expanded="false"');
    // The content is portal-mounted (null until client hydration, RRU-034): the
    // first client render matches this server markup exactly.
    expect(markup).not.toContain('role="dialog"');
  });

  it("merges className and passes through props on the slots", () => {
    render(
      <Dialog>
        <Dialog.Trigger className="probe" data-x="1">
          Open
        </Dialog.Trigger>
        <Dialog.Content className="probe" data-x="1">
          <Dialog.Header className="probe" data-x="1">
            <Dialog.Title className="probe" data-x="1" data-kind-of-heading>
              Title
            </Dialog.Title>
            <Dialog.Description className="probe" data-x="1">
              Desc
            </Dialog.Description>
          </Dialog.Header>
          <Dialog.Footer className="probe" data-x="1" />
        </Dialog.Content>
      </Dialog>,
    );

    const trigger = document.querySelector<HTMLButtonElement>(".rr-dialog-trigger")!;
    expect(trigger.className).toBe("rr-dialog-trigger probe");
    expect(trigger.getAttribute("data-x")).toBe("1");

    openViaTrigger();
    expect(document.querySelector(".rr-dialog-content")!.className).toBe("rr-dialog-content probe");
    expect(document.querySelector(".rr-dialog-header")!.className).toBe("rr-dialog-header probe");
    expect(document.querySelector(".rr-dialog-title")!.className).toBe("rr-dialog-title probe");
    expect(document.querySelector(".rr-dialog-description")!.className).toBe(
      "rr-dialog-description probe",
    );
    expect(document.querySelector(".rr-dialog-footer")!.className).toBe("rr-dialog-footer probe");
  });

  it("exports the slots both standalone and mounted on the root (ADR-004)", () => {
    expect(Dialog.Trigger).toBe(DialogTrigger);
    expect(Dialog.Content).toBe(DialogContent);
    expect(Dialog.Header).toBe(DialogHeader);
    expect(Dialog.Title).toBe(DialogTitle);
    expect(Dialog.Description).toBe(DialogDescription);
    expect(Dialog.Footer).toBe(DialogFooter);
  });
});
