// Behavioral spec for Input (RRU-043, tracked in RRU-068).
// Input is intentionally a thin native control: the spec pins the pass-through
// of native attributes, the `size` axis, and the card's key decision — the
// invalid state is driven by `aria-invalid` alone (no parallel `invalid` prop),
// so the styling and the assistive technology read the same source of truth.
import type { InputSize } from "./Input.types.js";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Input } from "../index.js";
import { auditA11y } from "../test-support/axe.js";
import { expectTokenLineage, readComponentCss, tokenVarsUsed } from "../test-support/css.js";

const sizes: InputSize[] = ["sm", "md", "lg"];

describe("Input rendered markup", () => {
  it("renders the base class by default (size md lives in the CSS base rule)", () => {
    expect(renderToStaticMarkup(<Input />)).toBe('<input class="rr-input"/>');
  });

  it.each(sizes)('size="%s" emits its modifier', (size) => {
    expect(renderToStaticMarkup(<Input size={size} />)).toBe(
      `<input class="rr-input rr-input--size-${size}"/>`,
    );
  });

  it("merges className and passes native attributes through", () => {
    const markup = renderToStaticMarkup(
      <Input size="lg" className="probe" id="i" data-x="1" type="email" name="mail" />,
    );

    expect(markup).toMatch(/^<input [^>]*class="rr-input rr-input--size-lg probe"[^>]*\/>$/);
    for (const attribute of ['id="i"', 'data-x="1"', 'type="email"', 'name="mail"']) {
      expect(markup, attribute).toContain(attribute);
    }
    expect(renderToStaticMarkup(<Input placeholder="Name" disabled />)).toBe(
      '<input placeholder="Name" disabled="" class="rr-input"/>',
    );
    expect(renderToStaticMarkup(<Input value="x" readOnly />)).toContain('value="x"');
  });

  it("passes aria-invalid through untouched, in both directions", () => {
    expect(renderToStaticMarkup(<Input aria-invalid />)).toBe(
      '<input aria-invalid="true" class="rr-input"/>',
    );
    expect(renderToStaticMarkup(<Input aria-invalid="false" />)).toBe(
      '<input aria-invalid="false" class="rr-input"/>',
    );
  });
});

describe("Input behavior", () => {
  it("accepts typed text and reports the invalid state to assistive tech", async () => {
    const user = userEvent.setup();
    render(
      <>
        <label htmlFor="mail">Email</label>
        <Input id="mail" aria-invalid="grammar" />
      </>,
    );
    const input = screen.getByLabelText("Email");

    await user.type(input, "raul@example.com");

    expect(input).toHaveValue("raul@example.com");
    expect(input).toHaveAttribute("aria-invalid", "grammar");
  });

  it("does not accept focus while disabled", async () => {
    render(<Input disabled aria-label="Locked" />);
    const input = screen.getByLabelText("Locked");

    await userEvent.click(input);

    expect(input).toBeDisabled();
  });

  it("has no axe violations when labelled", async () => {
    const { container } = render(
      <>
        <label htmlFor="mail">Email</label>
        <Input id="mail" placeholder="you@example.com" />
      </>,
    );

    await expect(auditA11y(container)).resolves.toHaveNoViolations();
  });
});

describe("Input authored CSS contract", () => {
  it("declares a modifier for every size", async () => {
    const css = await readComponentCss("input/Input.css");

    expect(css).toMatch(/\.rr-input\s*\{/);
    for (const size of sizes) {
      expect(css, `size ${size}`).toMatch(new RegExp(`\\.rr-input--size-${size}\\s*\\{`));
    }
  });

  it("draws the resting boundary with border.strong and never border.default (color.md §6.2)", async () => {
    const css = await readComponentCss("input/Input.css");
    const base = /\.rr-input\s*\{[^}]*\}/.exec(css)?.[0] ?? "";

    expect(base).toMatch(/border:\s*1px solid var\(--rr-color-border-strong\)/);
    expect(base, "border.default is forbidden on an interactive control boundary").not.toContain(
      "var(--rr-color-border-default)",
    );
  });

  it("mutes the placeholder, rings on focus-visible and paints invalid with the danger border", async () => {
    const css = await readComponentCss("input/Input.css");

    expect(css).toMatch(/\.rr-input::placeholder\s*\{[^}]*color:\s*var\(--rr-color-text-muted\)/);
    expect(css).toMatch(
      /\.rr-input:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--rr-color-focus-ring\)/,
    );
    expect(css).toMatch(
      /\.rr-input\[aria-invalid="true"\]\s*\{[^}]*border-color:\s*var\(--rr-color-border-danger\)/,
    );
  });

  it("orders the disabled block after the invalid rule (source order at equal specificity)", async () => {
    const css = await readComponentCss("input/Input.css");
    const invalidRule = css.search(/\[aria-invalid="true"\]/);
    const disabledBlock = css.search(/\.rr-input:disabled/);

    expect(invalidRule).toBeGreaterThanOrEqual(0);
    expect(
      disabledBlock,
      `disabled at ${disabledBlock} vs invalid at ${invalidRule}`,
    ).toBeGreaterThan(invalidRule);
  });

  it("only consumes tokens that @raulrod/tokens defines", async () => {
    const variables = await expectTokenLineage(await readComponentCss("input/Input.css"));

    expect(tokenVarsUsed(await readComponentCss("input/Input.css"))).toContain(
      "--rr-color-border-danger",
    );
    expect(variables).toBeGreaterThan(0);
  });
});
