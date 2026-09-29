// Behavioral spec for Select (RRU-057). Runs in happy-dom with a REAL DOM:
// open/toggle/dismiss/focus/keyboard/variants as user gestures (precedent
// Popover.test.tsx). The roving-focus/type-ahead MATH is unit-tested in
// utils/menu.test.ts (pure, synthetic item arrays); here the binding to real
// `[role="option"]` nodes + the combobox contract is exercised. happy-dom has
// no layout engine → DOM measurement (positioning) is NOT intended here (that
// is utils/popover.test.ts + the Popover flip integration). Behavior over
// implementation.
import type { ReactElement } from "react";

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import {
  FormField,
  FormFieldControl,
  FormFieldDescription,
  FormFieldError,
  FormFieldLabel,
} from "../form-field/index.js";
import { auditA11y } from "../test-support/axe.js";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectIcon,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./index.js";

/** The event is returned so the APG preventDefault contract stays assertable. */
function pressKey(key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init });
  fireEvent(document, event);
  return event;
}

function pointerDownOn(target: Element): void {
  fireEvent.pointerDown(target);
}

async function clickOn(id: string): Promise<void> {
  await userEvent.click(screen.getByTestId(id));
}

function options(): HTMLElement[] {
  return screen.getAllByRole("option");
}

const listbox = () => screen.queryByRole("listbox");
const triggerButton = () => screen.getByTestId("trigger");

interface OpenSelect {
  trigger: HTMLElement;
  panel: HTMLElement;
}

/** userEvent focuses the trigger on click the way a real browser does. */
async function openViaTrigger(): Promise<OpenSelect> {
  const user = userEvent.setup();
  const trigger = triggerButton();

  await user.click(trigger);

  const panel = screen.getByRole("listbox");
  expect(trigger).toHaveAttribute("aria-expanded", "true");
  return { trigger, panel };
}

function composedSelect({
  defaultOpen = false,
  value,
  defaultValue,
  onValueChange,
  onOpenChange,
}: {
  defaultOpen?: boolean;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
} = {}): ReactElement {
  return (
    <Select
      defaultOpen={defaultOpen}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      onOpenChange={onOpenChange}
    >
      <Select.Trigger data-testid="trigger">
        <Select.Value>Pick a city…</Select.Value>
      </Select.Trigger>
      <Select.Content data-testid="content">
        <Select.Item value="berlin">Berlin</Select.Item>
        <Select.Item value="madrid" data-testid="item-madrid">
          Madrid
        </Select.Item>
        <Select.Item value="oaxaca" disabled data-testid="item-oaxaca">
          Oaxaca
        </Select.Item>
        <Select.Item value="paris">Paris</Select.Item>
      </Select.Content>
    </Select>
  );
}

describe("Select combobox contract (DoD #2)", () => {
  it("trigger: combobox + haspopup + expanded + controls → the listbox; non-modal", async () => {
    render(composedSelect());
    expect(listbox()).toBeNull();

    const trigger = document.querySelector<HTMLButtonElement>("[data-testid='trigger']")!;
    expect(trigger.getAttribute("role")).toBe("combobox");
    expect(trigger.getAttribute("aria-haspopup")).toBe("listbox");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.getAttribute("aria-controls")).toBeTruthy();
    expect(trigger.getAttribute("type")).toBe("button");

    const { panel } = await openViaTrigger();
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(panel.getAttribute("role")).toBe("listbox");
    expect(panel.hasAttribute("aria-modal")).toBe(false); // non-modal
    // aria-controls resolves to the panel's own id (same shared contentId).
    expect(trigger.getAttribute("aria-controls")).toBe(panel.id);
  });

  it("options carry role/roving tabIndex/data-value; selected has aria-selected", async () => {
    render(composedSelect({ defaultValue: "madrid" }));
    await openViaTrigger();

    const entries = options();
    expect(entries).toHaveLength(4);
    for (const entry of entries) {
      expect(entry.getAttribute("role")).toBe("option");
      expect(entry.getAttribute("data-value")).toBeTruthy();
    }
    const madrid = document.querySelector<HTMLElement>("[data-testid='item-madrid']")!;
    expect(madrid.getAttribute("aria-selected")).toBe("true");
    // Roving tabindex: the SELECTED option is the active roving entry on open
    // → it carries tabIndex=0, every other option -1.
    expect(madrid.getAttribute("tabindex")).toBe("0");
    const berlin = options().find((entry) => entry.getAttribute("data-value") === "berlin")!;
    expect(berlin.getAttribute("aria-selected")).toBe("false");
    expect(berlin.getAttribute("tabindex")).toBe("-1");
  });

  it("announces the selection through a polite live region inside the trigger", async () => {
    render(composedSelect());
    const status = document.querySelector<HTMLElement>("[role='status']")!;
    expect(status).not.toBeNull();
    expect(status.getAttribute("aria-live")).toBe("polite");

    await clickOn("trigger");
    await clickOn("item-madrid");
    expect(status.textContent).toBe("Madrid");
  });
});

describe("Select open/close flow", () => {
  it("initial focus: the selected (ENABLED) option on open; else the first enabled", async () => {
    const { unmount } = render(composedSelect({ defaultValue: "oaxaca" })); // selected value is disabled
    await openViaTrigger();
    // A disabled selected value cannot hold focus (WCAG) → falls back to the
    // FIRST ENABLED option.
    expect(document.activeElement).toBe(options()[0]!);
    expect((document.activeElement as HTMLElement).getAttribute("data-value")).toBe("berlin");

    unmount();
    render(composedSelect({ defaultValue: "paris" }));
    await openViaTrigger();
    const paris = options().find((entry) => entry.getAttribute("data-value") === "paris")!;
    expect(document.activeElement).toBe(paris);
  });

  it("Escape closes and restores focus to the trigger", async () => {
    render(composedSelect());
    const { trigger } = await openViaTrigger();
    pressKey("Escape");
    expect(listbox()).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("outside pointer-down closes; pointer-down inside the panel does not", async () => {
    render(
      <div>
        <button data-testid="outside">outside</button>
        {composedSelect()}
      </div>,
    );
    await openViaTrigger();
    pointerDownOn(screen.getByTestId("outside"));
    expect(listbox()).toBeNull();

    await openViaTrigger();
    pointerDownOn(screen.getByTestId("item-madrid"));
    expect(listbox()).not.toBeNull();
  });

  it("re-clicking the trigger toggles closed (trigger is inside the dismiss layer)", async () => {
    const onOpenChange = vi.fn();
    render(composedSelect({ defaultOpen: true, onOpenChange }));
    const trigger = document.querySelector<HTMLButtonElement>("[data-testid='trigger']")!;
    expect(listbox()).not.toBeNull();

    // Pointer-down on the trigger is INSIDE → must NOT dismiss, so the click
    // performs a single toggle to closed — not close→reopen.
    pointerDownOn(trigger);
    expect(listbox()).not.toBeNull();
    await userEvent.click(trigger);

    expect(listbox()).toBeNull();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(onOpenChange).toHaveBeenCalledTimes(1);
  });
});

describe("Select keyboard: roving focus + type-ahead + commit", () => {
  it("ArrowDown/ArrowUp wrap and SKIP disabled options; Home/End jump", async () => {
    render(composedSelect());
    await openViaTrigger();
    const berlin = options()[0]!;
    const madrid = options()[1]!;
    const oaxaca = options()[2]!; // disabled
    const paris = options()[3]!;

    expect(document.activeElement).toBe(berlin);
    pressKey("ArrowDown"); // berlin → madrid (oaxaca skipped)
    expect(document.activeElement).toBe(madrid);
    pressKey("ArrowDown"); // madrid → paris
    expect(document.activeElement).toBe(paris);
    pressKey("ArrowDown"); // paris → wraps to berlin
    expect(document.activeElement).toBe(berlin);
    pressKey("ArrowUp"); // berlin → wraps to paris
    expect(document.activeElement).toBe(paris);

    pressKey("Home");
    expect(document.activeElement).toBe(berlin);
    pressKey("End");
    expect(document.activeElement).toBe(paris);

    // The roving tabindex: only the active option is tabbable.
    expect(paris.tabIndex).toBe(0);
    expect(berlin.tabIndex).toBe(-1);
    void oaxaca;
    void madrid;
  });

  it("type-ahead moves to the option whose label starts with the typed string", async () => {
    render(composedSelect());
    await openViaTrigger();
    expect(document.activeElement).toBe(options()[0]);
    pressKey("p"); // → Paris
    const paris = options().find((entry) => entry.getAttribute("data-value") === "paris")!;
    expect(document.activeElement).toBe(paris);
  });

  it("Enter on an option selects AND closes AND focus-returns (commit, not follow-focus)", async () => {
    const onValueChange = vi.fn();
    render(composedSelect({ onValueChange }));
    const { trigger } = await openViaTrigger();
    pressKey("Enter");
    expect(onValueChange).toHaveBeenLastCalledWith("berlin");
    expect(listbox()).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("Space selects the focused option", async () => {
    const onValueChange = vi.fn();
    render(composedSelect({ onValueChange }));
    await openViaTrigger();
    pressKey("ArrowDown");
    pressKey(" ");
    expect(onValueChange).toHaveBeenLastCalledWith("madrid");
    expect(listbox()).toBeNull();
  });

  it("Tab closes WITHOUT preventDefault (APG)", async () => {
    const onOpenChange = vi.fn();
    render(composedSelect({ onOpenChange }));
    await openViaTrigger();
    const event = pressKey("Tab");
    expect(event.defaultPrevented).toBe(false);
    expect(listbox()).toBeNull();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("disabled options are never focusable nor selectable (keyboard or click)", async () => {
    const onValueChange = vi.fn();
    render(composedSelect({ onValueChange }));
    await openViaTrigger();
    const oaxaca = document.querySelector<HTMLElement>("[data-testid='item-oaxaca']")!;
    expect(oaxaca.getAttribute("aria-disabled")).toBe("true");

    // type-ahead "o" must skip the disabled option and land on nothing enabled
    // starting with "o" → stays on the initial option.
    pressKey("o");
    expect(document.activeElement).toBe(options()[0]);

    pressKey("Home");
    pressKey("ArrowDown"); // berlin → madrid (oaxaca skipped)
    expect(options().find((entry) => entry.getAttribute("data-value") === "madrid")).toBe(
      document.activeElement,
    );

    // Click on the disabled option does nothing.
    await clickOn("item-oaxaca");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(listbox()).not.toBeNull();
  });
});

describe("Select controlled/uncontrolled + value wiring", () => {
  it("uncontrolled: defaultValue seeds; Value renders the label; changes flow via onValueChange", async () => {
    const onValueChange = vi.fn();
    render(composedSelect({ defaultValue: "paris", onValueChange }));
    expect(document.querySelector(".rr-select-value")!.textContent).toBe("Paris");
    expect(
      document
        .querySelector(".rr-select-value")!
        .classList.contains("rr-select-value--placeholder"),
    ).toBe(false);

    await clickOn("trigger");
    await clickOn("item-madrid");
    expect(onValueChange).toHaveBeenLastCalledWith("madrid");
    expect(document.querySelector(".rr-select-value")!.textContent).toBe("Madrid");
  });

  it("without a selected value the placeholder renders muted", () => {
    render(composedSelect());
    const value = document.querySelector<HTMLElement>(".rr-select-value")!;
    expect(value.textContent).toBe("Pick a city…");
    expect(value.classList.contains("rr-select-value--placeholder")).toBe(true);
  });

  it("re-selecting the SAME value closes but does NOT re-fire onValueChange", async () => {
    const onValueChange = vi.fn();
    render(composedSelect({ defaultValue: "madrid", onValueChange }));
    await clickOn("trigger");
    await clickOn("item-madrid");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(listbox()).toBeNull();
  });

  it("controlled: onValueChange fires but the root keeps the value gate", async () => {
    const onValueChange = vi.fn();
    render(composedSelect({ value: "berlin", onValueChange }));
    await clickOn("trigger");
    await clickOn("item-madrid");
    expect(onValueChange).toHaveBeenLastCalledWith("madrid");
    // The controlled root ignores the internal update → label stays Berlin.
    expect(document.querySelector(".rr-select-value")!.textContent).toBe("Berlin");
  });

  it("controlled open: onOpenChange fires but the root keeps the gate", async () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <Select open={false} onOpenChange={onOpenChange}>
        <Select.Trigger data-testid="trigger">
          <Select.Value>Pick…</Select.Value>
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="berlin">Berlin</Select.Item>
        </Select.Content>
      </Select>,
    );
    await userEvent.click(screen.getByRole("combobox"));
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(listbox()).toBeNull();

    rerender(
      <Select open onOpenChange={onOpenChange}>
        <Select.Trigger data-testid="trigger">
          <Select.Value>Pick…</Select.Value>
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="berlin">Berlin</Select.Item>
        </Select.Content>
      </Select>,
    );
    expect(listbox()).not.toBeNull();

    pressKey("Escape");
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(listbox()).not.toBeNull(); // gate stays
  });
});

describe("Select grouping + variants", () => {
  it("groups render role=group with a non-option label cell", () => {
    render(
      <Select defaultOpen>
        <Select.Trigger>
          <Select.Value>Pick…</Select.Value>
        </Select.Trigger>
        <Select.Content>
          <Select.Group data-testid="group-eu">
            <Select.Label>Europe</Select.Label>
            <Select.Item value="berlin">Berlin</Select.Item>
            <Select.Item value="paris">Paris</Select.Item>
          </Select.Group>
          <Select.Group data-testid="group-la">
            <Select.Label>Latin America</Select.Label>
            <Select.Item value="oaxaca">Oaxaca</Select.Item>
          </Select.Group>
        </Select.Content>
      </Select>,
    );
    const eu = document.querySelector("[data-testid='group-eu']")!;
    expect(eu.getAttribute("role")).toBe("group");
    const labels = document.querySelectorAll(".rr-select-group-label")!;
    expect(labels).toHaveLength(2);
    expect(labels[0]!.textContent).toBe("Europe");
    // Group labels are NOT options → never focusable entries.
    expect(options()).toHaveLength(3);
  });

  it("size modifiers emit the rr-select-trigger--{size} class (default md)", () => {
    render(
      <Select>
        <Select.Trigger data-testid="trigger" size="lg">
          <Select.Value>X</Select.Value>
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="x">X</Select.Item>
        </Select.Content>
      </Select>,
    );
    expect(document.querySelector("[data-testid='trigger']")!.className).toContain(
      "rr-select-trigger--lg",
    );
  });

  it("drop-in FormField: the control payload lands on the trigger (id/describedby/invalid)", () => {
    render(
      <FormField>
        <FormFieldLabel data-testid="label">City</FormFieldLabel>
        <FormFieldControl>
          {(field) => (
            <Select>
              <Select.Trigger {...field} data-testid="trigger">
                <Select.Value>Pick a city…</Select.Value>
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="berlin">Berlin</Select.Item>
              </Select.Content>
            </Select>
          )}
        </FormFieldControl>
        <FormFieldDescription>Pick the capital.</FormFieldDescription>
        <FormFieldError>Select a city.</FormFieldError>
      </FormField>,
    );
    const label = document.querySelector<HTMLLabelElement>("[data-testid='label']")!;
    const trigger = document.querySelector<HTMLButtonElement>("[data-testid='trigger']")!;
    expect(trigger.id).toBeTruthy();
    expect(label.getAttribute("for")).toBe(trigger.id);
    expect(trigger.getAttribute("aria-describedby")).toBeTruthy();
    expect(trigger.getAttribute("aria-invalid")).toBe("true");
    expect(trigger.getAttribute("aria-errormessage")).toBeTruthy();
  });
});

describe("Select SSR parity + composition contract", () => {
  it("renders provider + trigger server-side, never the listbox content", () => {
    const markup = renderToStaticMarkup(
      <Select>
        <Select.Trigger className="probe" id="s" data-x="1">
          <Select.Value>Pick a city…</Select.Value>
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="berlin">Berlin</Select.Item>
        </Select.Content>
      </Select>,
    );
    expect(markup).toMatch(/rr-select-trigger[^"]*\bprobe\b/);
    expect(markup).toContain('id="s"');
    expect(markup).toContain("data-x");
    expect(markup).toContain('role="combobox"');
    expect(markup).toContain('aria-haspopup="listbox"');
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).toContain("Pick a city…");
    expect(markup).not.toContain('role="listbox"');
  });

  it("merges className and passes through props on the slots", async () => {
    render(
      <Select defaultOpen>
        <Select.Trigger className="probe" data-x="1" data-testid="trigger">
          <Select.Value>Pick…</Select.Value>
        </Select.Trigger>
        <Select.Content className="probe" data-x="2">
          <Select.Item value="berlin">Berlin</Select.Item>
        </Select.Content>
      </Select>,
    );

    const trigger = screen.getByTestId("trigger");
    expect(trigger.className).toBe("rr-select-trigger rr-select-trigger--md probe");
    expect(trigger).toHaveAttribute("data-x", "1");

    const panel = screen.getByRole("listbox");
    expect(panel.className).toBe("rr-select-listbox probe");
    expect(panel).toHaveAttribute("data-x", "2");
  });

  it("has no axe violations with the listbox open (labeled integration)", async () => {
    render(
      <FormField>
        <FormFieldLabel>City</FormFieldLabel>
        <FormFieldControl>
          {(field) => (
            <Select defaultValue="madrid">
              <Select.Trigger {...field} data-testid="trigger">
                <Select.Value>Pick a city…</Select.Value>
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="berlin">Berlin</Select.Item>
                <Select.Item value="madrid">Madrid</Select.Item>
              </Select.Content>
            </Select>
          )}
        </FormFieldControl>
      </FormField>,
    );
    await openViaTrigger();

    await expect(auditA11y(document.body)).resolves.toHaveNoViolations();
  });

  // KNOWN GAP, deliberately NOT hidden by disabling the rule: `role="combobox"`
  // does not take its accessible name from contents, so a trigger the consumer
  // does not label is an unnamed combobox. Documented here so the follow-up
  // (RRU-057) is visible in the diff; the labeled FormField integration above
  // is the supported way to use Select.
  it("documents the known gap: a bare trigger is an UNNAMED combobox", async () => {
    render(composedSelect({ defaultValue: "madrid" }));
    await openViaTrigger();

    const results = await auditA11y(document.body);

    expect(results.violations.map((violation) => violation.id)).toContain("button-name");
  });

  it("exports the slots both standalone and mounted on the root (ADR-004)", () => {
    expect(Select.Trigger).toBe(SelectTrigger);
    expect(Select.Value).toBe(SelectValue);
    expect(Select.Icon).toBe(SelectIcon);
    expect(Select.Content).toBe(SelectContent);
    expect(Select.Item).toBe(SelectItem);
    expect(Select.Group).toBe(SelectGroup);
    expect(Select.Label).toBe(SelectLabel);
  });
});
