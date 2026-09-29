// Behavioral spec for Checkbox (RRU-046, tracked in RRU-068).
// A native `<input type="checkbox">` under the hood, so the spec exercises real
// interaction (click/Space toggle) instead of only markup. The card's own DoD is
// the tri-state: `indeterminate` must be visible to assistive tech as
// `aria-checked="mixed"` and to the browser as the native `indeterminate`
// property — there is no attribute for the latter, so both are asserted.
import type { CheckboxSize } from "./Checkbox.types.js";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Checkbox, Input } from "../index.js";
import { auditA11y } from "../test-support/axe.js";
import { expectTokenLineage, readComponentCss } from "../test-support/css.js";

const sizes: CheckboxSize[] = ["sm", "md", "lg"];

describe("Checkbox rendered markup", () => {
  it("forces the checkbox type and defaults to the base class (size md in CSS)", () => {
    expect(renderToStaticMarkup(<Checkbox />)).toBe('<input type="checkbox" class="rr-checkbox"/>');
  });

  it.each(sizes)('size="%s" emits its modifier', (size) => {
    expect(renderToStaticMarkup(<Checkbox size={size} />)).toBe(
      `<input type="checkbox" class="rr-checkbox rr-checkbox--size-${size}"/>`,
    );
  });

  it("merges className and passes native attributes through", () => {
    const markup = renderToStaticMarkup(
      <Checkbox
        size="lg"
        className="probe"
        id="c"
        name="agree"
        data-x="1"
        defaultChecked
        disabled
      />,
    );

    expect(markup).toMatch(/^<input [^>]*class="rr-checkbox rr-checkbox--size-lg probe"[^>]*\/>$/);
    for (const attribute of [
      'type="checkbox"',
      'id="c"',
      'name="agree"',
      'data-x="1"',
      'disabled=""',
    ]) {
      expect(markup, attribute).toContain(attribute);
    }
  });

  it("accepts the controlled usage (checked + value) without leaking the pass-through", () => {
    const markup = renderToStaticMarkup(
      <Checkbox checked onChange={() => undefined} value="yes" />,
    );

    expect(markup).toContain('checked=""');
    expect(markup).toContain('value="yes"');
    expect(markup).toMatch(/^<input type="checkbox" [^>]*class="rr-checkbox"[^>]*\/>$/);
  });
});

describe("Checkbox tri-state", () => {
  it("reports the mixed state through aria-checked", () => {
    expect(renderToStaticMarkup(<Checkbox indeterminate />)).toBe(
      '<input type="checkbox" aria-checked="mixed" class="rr-checkbox"/>',
    );
  });

  it("omits aria-checked when the state is false or absent", () => {
    expect(renderToStaticMarkup(<Checkbox indeterminate={false} />)).toBe(
      '<input type="checkbox" class="rr-checkbox"/>',
    );
    expect(renderToStaticMarkup(<Checkbox />)).toBe('<input type="checkbox" class="rr-checkbox"/>');
  });

  it("keeps a consumer aria-checked when it is not indeterminate", () => {
    expect(renderToStaticMarkup(<Checkbox aria-checked="true" />)).toBe(
      '<input type="checkbox" aria-checked="true" class="rr-checkbox"/>',
    );
  });

  it("wins over a consumer aria-checked when it is indeterminate", () => {
    expect(renderToStaticMarkup(<Checkbox indeterminate aria-checked="true" />)).toBe(
      '<input type="checkbox" aria-checked="mixed" class="rr-checkbox"/>',
    );
  });

  it("sets the native indeterminate property, since no attribute exists for it", () => {
    const { rerender } = render(<Checkbox aria-label="Select all" indeterminate />);
    const checkbox = screen.getByRole("checkbox", { name: "Select all" });

    expect((checkbox as HTMLInputElement).indeterminate).toBe(true);
    expect(checkbox).toHaveAttribute("aria-checked", "mixed");

    rerender(<Checkbox aria-label="Select all" indeterminate={false} />);
    expect((checkbox as HTMLInputElement).indeterminate).toBe(false);
  });
});

describe("Checkbox interaction", () => {
  it("toggles on click and on Space", async () => {
    const user = userEvent.setup();
    render(
      <>
        <label htmlFor="c">Accept</label>
        <Checkbox id="c" />
      </>,
    );
    const checkbox = screen.getByLabelText<HTMLInputElement>("Accept");

    await user.click(checkbox);
    expect(checkbox).toBeChecked();

    await user.keyboard(" ");
    expect(checkbox).not.toBeChecked();
  });

  it("does not toggle while disabled", async () => {
    const user = userEvent.setup();
    render(
      <>
        <label htmlFor="c">Accept</label>
        <Checkbox id="c" disabled />
      </>,
    );
    const checkbox = screen.getByLabelText<HTMLInputElement>("Accept");

    await user.click(checkbox);

    expect(checkbox).not.toBeChecked();
  });

  it("has no axe violations when labelled, in each state", async () => {
    const { container } = render(
      <>
        <label htmlFor="a">Accept</label>
        <Checkbox id="a" defaultChecked />
        <label htmlFor="b">Partially selected</label>
        <Checkbox id="b" indeterminate />
        <label htmlFor="c">Locked</label>
        <Checkbox id="c" disabled />
      </>,
    );

    await expect(auditA11y(container)).resolves.toHaveNoViolations();
  });
});

describe("Checkbox authored CSS contract", () => {
  it("draws a custom box (appearance:none) with every size modifier", async () => {
    const css = await readComponentCss("checkbox/Checkbox.css");

    expect(css).toMatch(/\.rr-checkbox\s*\{[^}]*appearance:\s*none/);
    for (const size of sizes) {
      expect(css, `size ${size}`).toMatch(new RegExp(`\\.rr-checkbox--size-${size}\\s*\\{`));
    }
  });

  it("draws the resting boundary with border.strong, never border.default (color.md §6.2)", async () => {
    const css = await readComponentCss("checkbox/Checkbox.css");
    const base = /\.rr-checkbox\s*\{[^}]*\}/.exec(css)?.[0] ?? "";

    expect(base).toMatch(/border:\s*1px solid var\(--rr-color-border-strong\)/);
    expect(base).not.toContain("var(--rr-color-border-default)");
    expect(base).toMatch(/width:\s*var\(--rr-space-4\)/);
  });

  it("paints the checked and indeterminate states with the primary action token and a glyph", async () => {
    const css = await readComponentCss("checkbox/Checkbox.css");

    expect(css).toMatch(
      /\.rr-checkbox:checked:not\(:indeterminate\)\s*\{[^}]*background-color:\s*var\(--rr-color-action-primary-background\)/,
    );
    expect(css).toMatch(
      /\.rr-checkbox:indeterminate\s*\{[^}]*background-color:\s*var\(--rr-color-action-primary-background\)/,
    );
    expect(css).toMatch(
      /\.rr-checkbox:checked:not\(:indeterminate\)\s*\{[^}]*background-image:\s*url\("data:image\/svg\+xml/,
    );
    expect(css).toMatch(
      /\.rr-checkbox:indeterminate\s*\{[^}]*background-image:\s*url\("data:image\/svg\+xml/,
    );
  });

  it("rings on focus-visible and paints aria-invalid with the danger border", async () => {
    const css = await readComponentCss("checkbox/Checkbox.css");

    expect(css).toMatch(
      /\.rr-checkbox:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--rr-color-focus-ring\)/,
    );
    expect(css).toMatch(
      /\.rr-checkbox\[aria-invalid="true"\]\s*\{[^}]*border-color:\s*var\(--rr-color-border-danger\)/,
    );
  });

  it("clears the glyph when disabled, after every state rule (source order at equal specificity)", async () => {
    const css = await readComponentCss("checkbox/Checkbox.css");
    const firstDisabled = css.search(/\.rr-checkbox:disabled/);
    const lastHover = css.lastIndexOf(":hover");
    const lastChecked = css.lastIndexOf(":checked");

    expect(css).toMatch(
      /\.rr-checkbox:disabled\s*,\s*\.rr-checkbox\[aria-disabled="true"\]\s*\{[^}]*background-image:\s*none/,
    );
    expect(firstDisabled).toBeGreaterThanOrEqual(0);
    expect(firstDisabled).toBeGreaterThan(lastHover);
    expect(firstDisabled).toBeGreaterThan(lastChecked);
  });

  it("only consumes tokens that @raulrod/tokens defines", async () => {
    await expectTokenLineage(await readComponentCss("checkbox/Checkbox.css"));
  });

  it("keeps Checkbox and Input coexisting in the public API", () => {
    expect(Checkbox).toBeTypeOf("object");
    expect(Input).toBeTypeOf("object");
  });
});
