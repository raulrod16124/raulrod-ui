// Behavioral spec for Switch (RRU-048, tracked in RRU-068).
// The WAI-ARIA switch pattern on a native checkbox: `role="switch"` plus the
// exposed checked state is what makes screen readers announce on/off, so the
// spec pins that wiring, the toggle interaction, and — importantly — that the
// FormField ARIA payload lands on the *input* (the labeled control), not on the
// wrapping label row.
import type { SwitchSize } from "./Switch.types.js";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import {
  FormField,
  FormFieldControl,
  FormFieldError,
  FormFieldLabel,
} from "../form-field/index.js";
import { Switch } from "../index.js";
import { auditA11y } from "../test-support/axe.js";
import { expectTokenLineage, readComponentCss } from "../test-support/css.js";

const sizes: SwitchSize[] = ["sm", "md", "lg"];
const switchOf = (container: HTMLElement): HTMLInputElement =>
  container.querySelector("input") as HTMLInputElement;

describe("Switch rendered markup", () => {
  it("renders a label row wrapping a bare checkbox with role=switch", () => {
    expect(renderToStaticMarkup(<Switch>on</Switch>)).toBe(
      '<label class="rr-switch"><input type="checkbox" role="switch" class="rr-switch-input"/><span class="rr-switch-label">on</span></label>',
    );
  });

  it("exposes the checked state natively, controlled and uncontrolled", () => {
    const onChange = () => undefined;

    expect(
      renderToStaticMarkup(
        <Switch checked onChange={onChange}>
          on
        </Switch>,
      ),
    ).toContain('checked=""');
    expect(
      renderToStaticMarkup(
        <Switch checked={false} onChange={onChange}>
          on
        </Switch>,
      ),
    ).not.toContain('checked=""');
    expect(renderToStaticMarkup(<Switch defaultChecked>on</Switch>)).toContain('checked=""');
  });

  it.each(sizes)('size="%s" emits the modifier on the row', (size) => {
    expect(renderToStaticMarkup(<Switch size={size}>on</Switch>)).toMatch(
      new RegExp(`^<label class="rr-switch rr-switch--size-${size}">`),
    );
  });

  it("flags the row and the native input when disabled", () => {
    expect(renderToStaticMarkup(<Switch disabled>on</Switch>)).toMatch(
      /^<label class="rr-switch rr-switch--disabled"><input type="checkbox" role="switch"[^>]*disabled=""/,
    );
  });

  it("merges className and spreads pass-through props on the row", () => {
    expect(
      renderToStaticMarkup(
        <Switch className="probe" title="t" data-x="1">
          on
        </Switch>,
      ),
    ).toMatch(/^<label title="t" data-x="1" class="rr-switch probe">/);
  });

  it("routes id, name, value and the ARIA wiring to the input, never duplicating them on the row", () => {
    const markup = renderToStaticMarkup(
      <Switch
        id="sw"
        aria-invalid
        aria-describedby="desc"
        aria-errormessage="err"
        name="notify"
        value="v"
      >
        on
      </Switch>,
    );
    const input = /<input[^>]*>/.exec(markup)?.[0] ?? "";

    expect(input).toContain('id="sw"');
    expect(input).toContain('aria-invalid="true"');
    expect(input).toContain('aria-describedby="desc"');
    expect(input).toContain('aria-errormessage="err"');
    expect(input).toContain('name="notify"');
    expect(input).toContain('value="v"');
    expect(markup).not.toMatch(/^<label[^>]*id="sw"/);
    expect(renderToStaticMarkup(<Switch>on</Switch>)).not.toContain("aria-invalid");
  });
});

describe("Switch behavior", () => {
  it("toggles on click and on Space", async () => {
    const user = userEvent.setup();
    render(<Switch>Notify me</Switch>);
    const control = screen.getByRole("switch", { name: "Notify me" });

    expect(control).not.toBeChecked();

    await user.click(control);
    expect(control).toBeChecked();

    await user.keyboard(" ");
    expect(control).not.toBeChecked();
  });

  it("does not toggle while disabled", async () => {
    const user = userEvent.setup();
    render(<Switch disabled>Notify me</Switch>);
    const control = screen.getByRole("switch", { name: "Notify me" });

    await user.click(control);

    expect(control).toBeDisabled();
    expect(control).not.toBeChecked();
  });

  it("accepts the FormField payload on the labeled control", () => {
    const onChange = vi.fn();
    render(
      <FormField>
        <FormFieldLabel>Notify me</FormFieldLabel>
        <FormFieldControl>
          {(field) => (
            <Switch {...field} onChange={onChange}>
              on
            </Switch>
          )}
        </FormFieldControl>
        <FormFieldError>Required</FormFieldError>
      </FormField>,
    );
    // The switch label wraps the input, so its accessible name also carries the
    // FormField label text — the important part is that the wiring reaches the input.
    const control = screen.getByRole("switch");

    expect(control).toHaveAccessibleName("Notify me on");
    expect(control).toHaveAttribute("aria-invalid", "true");
    expect(control).toHaveAccessibleErrorMessage("Required");
  });

  it("has no axe violations in each state", async () => {
    const { container } = render(
      <>
        <Switch>Off</Switch>
        <Switch defaultChecked>On</Switch>
        <Switch disabled>Locked</Switch>
      </>,
    );

    await expect(auditA11y(container)).resolves.toHaveNoViolations();
  });

  it("keeps the control and the row in sync after a rerender", () => {
    const { container, rerender } = render(<Switch>on</Switch>);

    rerender(
      <Switch checked onChange={() => undefined}>
        on
      </Switch>,
    );

    expect(switchOf(container)).toBeChecked();
  });
});

describe("Switch authored CSS contract", () => {
  it("sizes the track from tokens and rounds it with radius-full", async () => {
    const css = await readComponentCss("switch/Switch.css");

    expect(css).toMatch(/\.rr-switch-input\s*\{[^}]*appearance:\s*none/);
    expect(css).toMatch(/\.rr-switch-input\s*\{[^}]*width:\s*var\(--rr-space-10\)/);
    expect(css).toMatch(/\.rr-switch-input\s*\{[^}]*height:\s*var\(--rr-space-5\)/);
    expect(css).toMatch(/\.rr-switch-input\s*\{[^}]*border-radius:\s*var\(--rr-radius-full\)/);
  });

  it("fills the resting track with border.strong, never border.default (color.md §6.2)", async () => {
    const css = await readComponentCss("switch/Switch.css");
    const base = /\.rr-switch-input\s*\{[^}]*\}/.exec(css)?.[0] ?? "";

    expect(base).toMatch(/background:\s*var\(--rr-color-border-strong\)/);
    expect(base).not.toContain("border-default");
  });

  it("derives the knob size and travel from the track tokens", async () => {
    const css = await readComponentCss("switch/Switch.css");

    expect(css).toMatch(
      /\.rr-switch-input::after\s*\{[^}]*background:\s*var\(--rr-color-background-default\)/,
    );
    expect(css).toMatch(
      /\.rr-switch-input::after\s*\{[^}]*width:\s*calc\(var\(--rr-space-5\) - 4px\)/,
    );
    expect(css).toMatch(
      /\.rr-switch-input:checked::after\s*\{[^}]*background-color:\s*var\(--rr-color-action-primary-text\)/,
    );
    expect(css).toMatch(
      /\.rr-switch-input:checked::after\s*\{[^}]*transform:\s*translateX\(calc\(var\(--rr-space-10\) - var\(--rr-space-5\)\)\)/,
    );
  });

  it("declares the track and the knob for every size", async () => {
    const css = await readComponentCss("switch/Switch.css");

    for (const size of sizes) {
      expect(css, `track ${size}`).toMatch(
        new RegExp(`\\.rr-switch--size-${size}\\s+\\.rr-switch-input\\s*\\{`),
      );
      expect(css, `knob ${size}`).toMatch(
        new RegExp(`\\.rr-switch--size-${size}\\s+\\.rr-switch-input::after\\s*\\{`),
      );
    }
  });

  it("rings on focus-visible and paints invalid with the danger border", async () => {
    const css = await readComponentCss("switch/Switch.css");

    expect(css).toMatch(
      /\.rr-switch-input:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--rr-color-focus-ring\)/,
    );
    expect(css).toMatch(
      /\.rr-switch-input\[aria-invalid="true"\]\s*\{[^}]*border-color:\s*var\(--rr-color-border-danger\)/,
    );
  });

  it("mutes the disabled track, knob and label, after every state rule", async () => {
    const css = await readComponentCss("switch/Switch.css");
    const firstDisabled = css.search(/\.rr-switch-input:disabled/);

    expect(css).toMatch(
      /\.rr-switch-input:disabled\s*\{[^}]*background-color:\s*var\(--rr-color-action-disabled-background\)/,
    );
    expect(css).toMatch(
      /\.rr-switch-input:disabled::after\s*\{[^}]*background-color:\s*var\(--rr-color-action-disabled-text\)/,
    );
    expect(css).toMatch(/\.rr-switch--disabled\s*\{\s*cursor:\s*not-allowed/);
    expect(css).toMatch(
      /\.rr-switch--disabled\s+\.rr-switch-label\s*\{[^}]*color:\s*var\(--rr-color-text-muted\)/,
    );
    expect(firstDisabled).toBeGreaterThan(css.lastIndexOf(":hover"));
    expect(firstDisabled).toBeGreaterThan(css.lastIndexOf(":checked"));
  });

  it("kills the knob transition under prefers-reduced-motion", async () => {
    const css = await readComponentCss("switch/Switch.css");

    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.rr-switch-input,\s*\.rr-switch-input::after\s*\{\s*transition:\s*none/,
    );
  });

  it("only consumes tokens that @raulrod/tokens defines", async () => {
    await expectTokenLineage(await readComponentCss("switch/Switch.css"));
  });
});
