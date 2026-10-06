// Behavioral spec for Dialog (RRU-053). Runs in happy-dom with a REAL DOM:
// the DoD #1 flow (open → Tab → Escape → close → focus return) is exercised
// with actual focus tracking + key/pointer events, as established for the
// overlay primitives in RRU-052. Behavior over implementation.
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { Popover } from "../popover/index.js";
import { Select } from "../select/index.js";
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

describe("nested overlays inside the dialog trap (RRU-116)", () => {
  function dialogWithNestedOverlays() {
    return (
      <Dialog>
        <Dialog.Trigger data-testid="trigger">Open</Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Title>Invite</Dialog.Title>
          <Select>
            <Select.Trigger aria-label="City" data-testid="city-trigger">
              <Select.Value>Pick a city</Select.Value>
              <Select.Icon />
            </Select.Trigger>
            <Select.Content>
              <Select.Item data-testid="city-berlin" value="berlin">
                Berlin
              </Select.Item>
              <Select.Item data-testid="city-oaxaca" value="oaxaca">
                Oaxaca
              </Select.Item>
            </Select.Content>
          </Select>
          <Popover>
            <Popover.Trigger data-testid="more-trigger">More</Popover.Trigger>
            <Popover.Content>
              <Popover.Title>More</Popover.Title>
              <a data-testid="popover-first" href="/first">
                First
              </a>
              <button data-testid="popover-second">Second</button>
            </Popover.Content>
          </Popover>
          <button data-testid="cancel">Cancel</button>
          <button data-testid="send">Send invites</button>
        </Dialog.Content>
      </Dialog>
    );
  }

  const panelNode = () => qs(".rr-dialog-content");
  const popoverNode = () => qs(".rr-popover-content");

  /** Every keyboard stop of the modal must belong to the modal context: the
   *  dialog panel or the portaled nested overlay's panel (RRU-116). */
  function insideModalContext(element: Element | null): boolean {
    if (element === null) return false;
    return (panelNode()?.contains(element) ?? false) || (popoverNode()?.contains(element) ?? false);
  }

  async function renderWithOpenDialog() {
    const user = userEvent.setup();
    render(dialogWithNestedOverlays());
    await user.click(screen.getByTestId("trigger"));
    await user.click(screen.getByTestId("city-trigger"));
    return user;
  }

  it("the nested portaled panel's focusables are part of the trap cycle (RRU-116)", async () => {
    const user = userEvent.setup();
    render(dialogWithNestedOverlays());
    await user.click(screen.getByTestId("trigger"));
    await user.click(screen.getByTestId("more-trigger"));

    // Popover initial focus = its first focusable (APG non-modal dialog).
    const first = screen.getByTestId("popover-first");
    const second = screen.getByTestId("popover-second");
    expect(document.activeElement).toBe(first);

    // RRU-071 finding: with the old subtree-only trap this Tab SKIPPED the
    // second control and jumped to the dialog's first focusable instead.
    pressKey("Tab");
    expect(document.activeElement).toBe(second);

    // After the nested panel's last control the cycle wraps to the dialog's
    // first control: the portaled focusables sit in the same cycle as the
    // dialog's own.
    pressKey("Tab");
    expect(document.activeElement).toBe(screen.getByTestId("city-trigger"));

    // Finish the full cycle back to the start, every stop inside the modal
    // context: [city-trigger → more-trigger → cancel → send → first].
    for (let index = 0; index < 4; index += 1) {
      pressKey("Tab");
      expect(insideModalContext(document.activeElement)).toBe(true);
    }
    expect(document.activeElement).toBe(first);

    // Backwards wrap lands on the control before the panel, still in scope.
    pressKey("Tab", { shiftKey: true });
    expect(document.activeElement).toBe(screen.getByTestId("send"));
    expect(insideModalContext(document.activeElement)).toBe(true);

    // A11y gate stays green with the nested overlay live on top.
    await expect(auditA11y(document.body)).resolves.toHaveNoViolations();
  });

  it("an open Select inside the dialog can never leak focus to the page (RRU-116)", async () => {
    await renderWithOpenDialog();

    // Select initial focus = first enabled option (APG roving focus). The
    // option is tabindex=-1: NOT a real tab stop, so the trap's union has no
    // entry for it — the hardest case for a trap (focus is inside a portaled
    // panel but that panel exposes no tab stops of its own).
    const berlin = screen.getByTestId("city-berlin");
    expect(document.activeElement).toBe(berlin);
    expect(screen.queryByRole("listbox")).not.toBeNull();

    // The trap intercepts Tab at the document CAPTURE phase, before the
    // listbox's own bubble-phase Tab-close: the listbox stays open, but the
    // focus moves inside the modal scope — never to the page behind.
    pressKey("Tab");
    expect(screen.queryByRole("listbox")).not.toBeNull();
    expect(insideModalContext(document.activeElement)).toBe(true);
    expect(document.activeElement).not.toBe(berlin);

    // Cycling Tab/Shift+Tab from any stop stays inside the modal context.
    for (let index = 0; index < 4; index += 1) {
      pressKey("Tab", { shiftKey: index % 2 === 1 });
      expect(insideModalContext(document.activeElement)).toBe(true);
    }

    // Escape dismisses the nested overlay; the return lands on its trigger,
    // which sits inside the dialog panel — the whole scope stays trapped.
    pressKey("Escape");
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(insideModalContext(document.activeElement)).toBe(true);
  });
});

describe("focus restoration fallback for a triggerless dialog (RRU-117)", () => {
  /** Controlled dialog with NO `Dialog.Trigger`; opened purely by the `open`
   *  prop — the direct reproduction of the manual-review finding #2 (a dialog
   *  opened by code, not by a user gesture on its own trigger). */
  function TriggerlessDialog({ open, onOpenChange }: { open: boolean; onOpenChange: () => void }) {
    return (
      <div>
        <button data-testid="page-first">Page focus start</button>
        <Dialog open={open} onOpenChange={onOpenChange}>
          <Dialog.Content>
            <Dialog.Title>Keyboard tour</Dialog.Title>
            <button data-testid="next">Next</button>
          </Dialog.Content>
        </Dialog>
      </div>
    );
  }

  it("Escape closes it and the focus lands on the page's first focusable, never the body (DoD #2)", () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(<TriggerlessDialog open onOpenChange={onOpenChange} />);

    expect(screen.queryByRole("dialog")).not.toBeNull();
    // Programmatic open parks the focus on the panel (RRU-053 initial focus),
    // NOT on the body — the no-op fallback only ever appears on CLOSE.
    expect(document.activeElement).not.toBe(document.body);

    // The documented closing path: Escape reaches the dismissable layer.
    pressKey("Escape");
    expect(onOpenChange).toHaveBeenLastCalledWith(false);

    rerender(<TriggerlessDialog open={false} onOpenChange={onOpenChange} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    // With the old `document.body.focus()` fallback this was a no-op and the
    // focus stayed on the body with no visible ring (RRU-117 bug).
    expect(document.activeElement).not.toBe(document.body);
    expect(document.activeElement).toBe(screen.getByTestId("page-first"));
  });

  it("a trigger that unmounts while the dialog is open no longer hijacks the return", () => {
    function App({
      withTrigger,
      open,
      onOpenChange,
    }: {
      withTrigger: boolean;
      open: boolean;
      onOpenChange: () => void;
    }) {
      return (
        <div>
          <button data-testid="page-first">Page focus start</button>
          <Dialog open={open} onOpenChange={onOpenChange}>
            {withTrigger ? (
              <Dialog.Trigger data-testid="trigger">Delete project</Dialog.Trigger>
            ) : null}
            <Dialog.Content>
              <Dialog.Title>Reporting</Dialog.Title>
              <button data-testid="cancel">Cancel</button>
            </Dialog.Content>
          </Dialog>
        </div>
      );
    }

    const onOpenChange = vi.fn();
    const { rerender } = render(<App withTrigger open onOpenChange={onOpenChange} />);

    // The trigger registered itself; open state is on the panel.
    const trigger = screen.getByTestId("trigger");
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    // The trigger is removed from the tree while the dialog stays open: its
    // ref callback fires with null, so the fallbackRef must be abandoned.
    rerender(<App withTrigger={false} open onOpenChange={onOpenChange} />);
    expect(screen.queryByTestId("trigger")).toBeNull();

    rerender(<App withTrigger={false} open={false} onOpenChange={onOpenChange} />);
    expect(document.activeElement).not.toBe(document.body);
    expect(document.activeElement).toBe(screen.getByTestId("page-first"));
  });

  it("a triggerless overlay over a LIVE dialog lands back in the modal scope, never behind it", async () => {
    // A hint-style popover with no trigger of its own, opened by a page-level
    // action while the dialog stays open. Its captured element (the page button
    // the "hint" was requested from) is OUTSIDE the live modal scope: restoring
    // to it would land the focus behind the modal, so the fallback must pick a
    // destination from the enclosing scope instead (RRU-117 scope rule).
    function DialogWithTriggerlessPopover() {
      const [popoverOpen, setPopoverOpen] = useState(false);
      return (
        <div>
          <button data-testid="page-reveal" onClick={() => setPopoverOpen(true)}>
            Reveal hint popover
          </button>
          <Dialog open>
            <Dialog.Content>
              <Dialog.Title>Settings</Dialog.Title>
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <Popover.Content>
                  <button data-testid="popover-save">Save</button>
                </Popover.Content>
              </Popover>
              <button data-testid="cancel">Cancel</button>
            </Dialog.Content>
          </Dialog>
        </div>
      );
    }

    const user = userEvent.setup();
    render(<DialogWithTriggerlessPopover />);
    expect(screen.getByRole("dialog")).not.toBeNull();

    // Opening the triggerless popover focuses whatever the user interacted
    // with — the page button behind the modal.
    await user.click(screen.getByTestId("page-reveal"));
    expect(screen.queryByTestId("popover-save")).not.toBeNull();

    // Escape closes the popover (topmost layer) but NOT the dialog.
    pressKey("Escape");
    expect(screen.queryByTestId("popover-save")).toBeNull();
    expect(screen.getByRole("dialog")).not.toBeNull();

    // The restoration may NOT go to the page button behind the modal: the
    // scope rule rejects it and the destination lands inside the dialog.
    expect(document.activeElement).not.toBe(document.body);
    expect(document.activeElement).not.toBe(screen.getByTestId("page-reveal"));
    const panel = document.querySelector(".rr-dialog-content");
    expect(panel?.contains(document.activeElement)).toBe(true);
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

  it("distributes root classNames to every slot", () => {
    render(
      <Dialog
        defaultOpen
        classNames={{
          trigger: "root-trigger",
          content: "root-content",
          header: "root-header",
          title: "root-title",
          description: "root-desc",
          footer: "root-footer",
        }}
      >
        <Dialog.Trigger data-testid="trigger">Open</Dialog.Trigger>
        <Dialog.Content data-testid="content">
          <Dialog.Header data-testid="header">
            <Dialog.Title data-testid="title">Title</Dialog.Title>
            <Dialog.Description data-testid="description">Desc</Dialog.Description>
          </Dialog.Header>
          <Dialog.Footer data-testid="footer" />
        </Dialog.Content>
      </Dialog>,
    );

    expect(screen.getByTestId("trigger").className).toBe("rr-dialog-trigger root-trigger");
    expect(screen.getByTestId("content").className).toBe("rr-dialog-content root-content");
    expect(screen.getByTestId("header").className).toBe("rr-dialog-header root-header");
    expect(screen.getByTestId("title").className).toBe("rr-dialog-title root-title");
    expect(screen.getByTestId("description").className).toBe("rr-dialog-description root-desc");
    expect(screen.getByTestId("footer").className).toBe("rr-dialog-footer root-footer");
  });
});
