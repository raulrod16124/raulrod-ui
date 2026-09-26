// Behavioral spec for Dialog (RRU-053). Runs in happy-dom with a REAL DOM:
// the DoD #1 flow (open → Tab → Escape → close → focus return) is exercised
// with actual focus tracking + key/pointer events, as established for the
// overlay primitives in RRU-052. Behavior over implementation.
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { auditA11y } from "../test-support/axe.js";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./index.js";

/** Portaled content lives outside RTL's `container`, so query the document. */
const qs = <T extends Element>(selector: string): T | null =>
  document.body.querySelector<T>(selector);

const dialog = () => screen.getByRole("dialog");

function pressKey(key: string, init: KeyboardEventInit = {}): void {
  fireEvent.keyDown(document, { key, ...init });
}

function pointerDownOn(target: Element): void {
  fireEvent.pointerDown(target);
}

function composedDialog({ defaultOpen = false }: { defaultOpen?: boolean } = {}) {
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

/** userEvent focuses the trigger on click the way a real browser does, so the
 *  focus-RESTORATION assertion is now a real user gesture, not a staged one. */
async function openViaTrigger() {
  const user = userEvent.setup();
  const trigger = screen.getByTestId("trigger");

  await user.click(trigger);

  const panel = dialog();
  expect(trigger).toHaveAttribute("aria-expanded", "true");
  return { trigger, panel };
}

describe("Dialog full flow (DoD #1)", () => {
  it("open → initial focus on the panel → Tab wraps → Escape closes → focus back to the trigger", async () => {
    render(composedDialog());

    expect(screen.queryByRole("dialog")).toBeNull();
    const { trigger, panel } = await openViaTrigger();

    // Initial focus lands on the dialog container (ARIA APG modal pattern).
    expect(document.activeElement).toBe(panel);

    // Tab: panel is not in the tab order (tabIndex=-1), so the first Tab goes
    // to the first focusable (Cancel); the next wraps to the last (Delete), and
    // the next wraps back to the first.
    const cancel = screen.getByTestId("cancel");
    const confirm = screen.getByTestId("confirm");

    pressKey("Tab", { shiftKey: false });
    expect(document.activeElement).toBe(cancel);
    pressKey("Tab");
    expect(document.activeElement).toBe(confirm);
    pressKey("Tab");
    expect(document.activeElement).toBe(cancel);

    // Escape dismisses (topmost layer) and focus returns to the trigger.
    pressKey("Escape");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("backdrop pointer-down closes; pointer-down inside the panel does not", async () => {
    render(composedDialog());
    await openViaTrigger();

    pointerDownOn(qs(".rr-dialog-backdrop") as Element);
    expect(screen.queryByRole("dialog")).toBeNull();

    await openViaTrigger();
    pointerDownOn(screen.getByTestId("confirm"));
    expect(screen.queryByRole("dialog")).not.toBeNull();
  });

  it("scroll lock is applied on open and restored on close", async () => {
    render(composedDialog());
    await openViaTrigger();
    expect(document.body.style.overflow).toBe("hidden");

    pressKey("Escape");
    expect(document.body.style.overflow).toBe("");
  });

  it("has no axe violations while open (labelled, described, modal)", async () => {
    render(composedDialog());
    await openViaTrigger();

    await expect(auditA11y(document.body)).resolves.toHaveNoViolations();
  });
});

describe("Dialog ARIA wiring (DoD #2)", () => {
  it("associates Title/Description when present; trigger carries haspopup/expanded/controls", async () => {
    render(composedDialog());

    const trigger = screen.getByTestId("trigger");
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    // The reference is generated up-front by the root and must NOT change when
    // the panel mounts: a trigger that re-points `aria-controls` on every open
    // announces a different relationship each time.
    const controls = trigger.getAttribute("aria-controls");
    expect(controls).toBeTruthy();

    const { panel } = await openViaTrigger();

    expect(trigger.getAttribute("aria-controls")).toBe(controls);
    // RRU-115: the announced id must RESOLVE to the panel that is on screen.
    // Asserting only that the attribute is non-empty is exactly what let this
    // idref stay dangling for four epics, and it is not something the a11y gate
    // can catch: axe reports `aria-controls` as "incomplete" (never a violation)
    // on any element that carries `aria-haspopup`.
    expect(panel.id).toBe(controls);
    expect(document.getElementById(controls ?? "")).toBe(panel);

    expect(panel).toHaveAttribute("aria-modal", "true");
    expect(panel.getAttribute("aria-labelledby")).toBe(
      qs(".rr-dialog-title")?.getAttribute("id") ?? null,
    );
    expect(panel.getAttribute("aria-describedby")).toBe(
      qs(".rr-dialog-description")?.getAttribute("id") ?? null,
    );
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("the Title is the dialog's accessible name (found by role+name)", async () => {
    render(composedDialog());
    await openViaTrigger();

    expect(screen.getByRole("dialog", { name: "Delete project?" })).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toHaveAccessibleDescription("This action cannot be undone.");
  });

  it("never emits an empty aria-labelledby/aria-describedby without the slots", async () => {
    render(
      <Dialog>
        <Dialog.Trigger data-testid="trigger">Open</Dialog.Trigger>
        <Dialog.Content>
          <p>No title or description slots.</p>
        </Dialog.Content>
      </Dialog>,
    );
    await openViaTrigger();

    const panel = dialog();
    expect(panel).not.toHaveAttribute("aria-labelledby");
    expect(panel).not.toHaveAttribute("aria-describedby");
  });

  it("two Dialogs in one tree: every trigger resolves to its OWN panel", async () => {
    // `useId` guarantees unique ids, but nothing verified that the reference
    // actually LANDED on the panel: a collision (or a shared base id) would
    // silently point both triggers at whichever panel mounted last, and a screen
    // reader would announce the wrong dialog for one of them.
    const user = userEvent.setup();
    render(
      <>
        <Dialog>
          <Dialog.Trigger data-testid="trigger-a">Open A</Dialog.Trigger>
          <Dialog.Content>
            <Dialog.Title>Dialog A</Dialog.Title>
          </Dialog.Content>
        </Dialog>
        <Dialog>
          <Dialog.Trigger data-testid="trigger-b">Open B</Dialog.Trigger>
          <Dialog.Content>
            <Dialog.Title>Dialog B</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      </>,
    );

    const triggerA = screen.getByTestId("trigger-a");
    const triggerB = screen.getByTestId("trigger-b");
    const controlsA = triggerA.getAttribute("aria-controls");
    const controlsB = triggerB.getAttribute("aria-controls");

    expect(controlsA).toBeTruthy();
    expect(controlsB).toBeTruthy();
    expect(controlsA).not.toBe(controlsB);

    await user.click(triggerA);
    const panelA = dialog();
    expect(panelA).toHaveAccessibleName("Dialog A");
    expect(document.getElementById(controlsA ?? "")).toBe(panelA);

    pressKey("Escape");
    await user.click(triggerB);
    const panelB = dialog();
    expect(panelB).toHaveAccessibleName("Dialog B");
    expect(document.getElementById(controlsB ?? "")).toBe(panelB);
  });
});

describe("Dialog controlled/uncontrolled", () => {
  it("controlled: onOpenChange fires and the root keeps the gate (open follows the prop)", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <Dialog open={false} onOpenChange={onOpenChange}>
        <Dialog.Trigger>Open</Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Title>Title</Dialog.Title>
        </Dialog.Content>
      </Dialog>,
    );

    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(screen.queryByRole("dialog")).toBeNull();

    rerender(
      <Dialog open onOpenChange={onOpenChange}>
        <Dialog.Trigger>Open</Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Title>Title</Dialog.Title>
        </Dialog.Content>
      </Dialog>,
    );
    expect(screen.queryByRole("dialog")).not.toBeNull();

    pressKey("Escape");
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    // the prop is still true: the root does not close itself
    expect(screen.queryByRole("dialog")).not.toBeNull();
  });

  it("uncontrolled: defaultOpen renders the dialog; Escape closes it", () => {
    render(composedDialog({ defaultOpen: true }));

    expect(screen.queryByRole("dialog")).not.toBeNull();
    pressKey("Escape");
    expect(screen.queryByRole("dialog")).toBeNull();
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

  it("merges className and passes through props on the slots", async () => {
    render(
      <Dialog>
        <Dialog.Trigger className="probe" data-x="1" data-testid="trigger">
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

    const trigger = screen.getByRole("button", { name: "Open" });
    expect(trigger.className).toBe("rr-dialog-trigger probe");
    expect(trigger).toHaveAttribute("data-x", "1");

    await openViaTrigger();

    expect(qs(".rr-dialog-content")?.className).toBe("rr-dialog-content probe");
    expect(qs(".rr-dialog-header")?.className).toBe("rr-dialog-header probe");
    expect(qs(".rr-dialog-title")?.className).toBe("rr-dialog-title probe");
    expect(qs(".rr-dialog-description")?.className).toBe("rr-dialog-description probe");
    expect(qs(".rr-dialog-footer")?.className).toBe("rr-dialog-footer probe");
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
