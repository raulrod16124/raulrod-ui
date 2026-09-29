// Behavioral spec for Radio / RadioGroup (RRU-047, tracked in RRU-068).
// The card's DoD is native behavior instead of JS keyboard handling: the group
// only has to give every option the same `name` (that is what makes the browser
// enforce single-selection and roving arrow keys) and mark the selected one.
// Selection, disabled and the size axis are asserted through the DOM, not
// through the snapshot of the class list alone.
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Checkbox, Radio, RadioGroup } from "../index.js";
import { auditA11y } from "../test-support/axe.js";
import { expectTokenLineage, readComponentCss } from "../test-support/css.js";

const options = (overrides = {}, secondOverrides = {}) => [
  <Radio key="a" value="a" {...overrides}>
    A
  </Radio>,
  <Radio key="b" value="b" {...secondOverrides}>
    B
  </Radio>,
];

describe("RadioGroup rendered markup", () => {
  it("is a radiogroup with the vertical orientation by default", () => {
    expect(renderToStaticMarkup(<RadioGroup value="a">{options()}</RadioGroup>)).toMatch(
      /^<div role="radiogroup" class="rr-radio-group rr-radio-group--vertical">/,
    );
  });

  it("shares one name across every option — the contract that enables native arrow keys", () => {
    const markup = renderToStaticMarkup(<RadioGroup value="a">{options()}</RadioGroup>);
    const names = [...markup.matchAll(/name="([^"]+)"/g)].map((match) => match[1]);

    expect(names).toHaveLength(2);
    expect(names[0]).toBe(names[1]);
    expect(names[0]).toMatch(/^rr-radio-group-/);
  });

  it("uses the consumer name when given, so the group participates in a form", () => {
    const markup = renderToStaticMarkup(
      <RadioGroup name="plan" value="b">
        {options()}
      </RadioGroup>,
    );

    expect([...markup.matchAll(/name="([^"]+)"/g)].map((match) => match[1])).toEqual([
      "plan",
      "plan",
    ]);
  });

  it("checks exactly the selected option, controlled and uncontrolled", () => {
    const controlled = renderToStaticMarkup(<RadioGroup value="a">{options()}</RadioGroup>);
    const uncontrolled = renderToStaticMarkup(
      <RadioGroup defaultValue="b">{options()}</RadioGroup>,
    );

    expect(controlled.match(/checked=""/g)).toHaveLength(1);
    expect(controlled).toContain(
      'class="rr-radio-input" name="rr-radio-group-_R_0_" checked="" value="a"',
    );
    expect(uncontrolled.match(/checked=""/g)).toHaveLength(1);
    expect(uncontrolled).toMatch(/checked="" value="b"/);
  });

  it("distributes the group size and disabled defaults, with per-option overrides", () => {
    const markup = renderToStaticMarkup(
      <RadioGroup size="sm" disabled>
        {options({}, { size: "lg" })}
      </RadioGroup>,
    );
    const rows = [...markup.matchAll(/<label class="rr-radio[^"]*"/g)].map((match) => match[0]);

    expect(rows).toEqual([
      '<label class="rr-radio rr-radio--disabled rr-radio--size-sm"',
      '<label class="rr-radio rr-radio--disabled rr-radio--size-lg"',
    ]);
    expect(markup.match(/disabled=""/g)).toHaveLength(2);
  });

  it("emits the horizontal modifier and merges className with pass-through props", () => {
    expect(
      renderToStaticMarkup(<RadioGroup orientation="horizontal">{options()}</RadioGroup>),
    ).toContain('class="rr-radio-group rr-radio-group--horizontal"');

    expect(
      renderToStaticMarkup(
        <RadioGroup className="probe" id="g" data-x="1" aria-labelledby="lbl">
          {options()}
        </RadioGroup>,
      ),
    ).toMatch(
      /^<div role="radiogroup" id="g" data-x="1" aria-labelledby="lbl" class="rr-radio-group rr-radio-group--vertical probe">/,
    );
  });
});

describe("Radio behavior", () => {
  it("labels each option through the wrapping label", () => {
    render(<RadioGroup>{options()}</RadioGroup>);

    expect(screen.getByRole("radio", { name: "A" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "B" })).toBeInTheDocument();
  });

  it("selects the clicked option", async () => {
    render(<RadioGroup defaultValue="a">{options()}</RadioGroup>);

    await userEvent.click(screen.getByRole("radio", { name: "B" }));

    expect(screen.getByRole("radio", { name: "B" })).toBeChecked();
  });

  it("does not select a disabled option", async () => {
    render(<RadioGroup defaultValue="a">{options({}, { disabled: true })}</RadioGroup>);
    const option = screen.getByRole("radio", { name: "B" });

    await userEvent.click(option);

    expect(option).toBeDisabled();
    expect(option).not.toBeChecked();
  });

  it("has no axe violations when the group is named", async () => {
    const { container } = render(
      <RadioGroup aria-label="Plan" defaultValue="a">
        {options()}
      </RadioGroup>,
    );

    await expect(auditA11y(container)).resolves.toHaveNoViolations();
  });
});

describe("Radio authored CSS contract", () => {
  it("draws a custom dot with every size modifier", async () => {
    const css = await readComponentCss("radio/Radio.css");

    expect(css).toMatch(/\.rr-radio-input\s*\{[^}]*appearance:\s*none/);
    expect(css).toMatch(/\.rr-radio-input\s*\{[^}]*width:\s*var\(--rr-space-4\)/);
    for (const size of ["sm", "md", "lg"]) {
      expect(css, `size ${size}`).toMatch(
        new RegExp(`\\.rr-radio--size-${size}\\s+\\.rr-radio-input\\s*\\{`),
      );
    }
  });

  it("draws the resting boundary with border.strong, never border.default (color.md §6.2)", async () => {
    const css = await readComponentCss("radio/Radio.css");
    const base = /\.rr-radio-input\s*\{[^}]*\}/.exec(css)?.[0] ?? "";

    expect(base).toMatch(/border:\s*1px solid var\(--rr-color-border-strong\)/);
    expect(base).not.toContain("var(--rr-color-border-default)");
  });

  it("paints the selected dot from the action tokens, hover included", async () => {
    const css = await readComponentCss("radio/Radio.css");

    expect(css).toMatch(
      /\.rr-radio-input:checked\s*\{[^}]*background-color:\s*var\(--rr-color-action-primary-background\)/,
    );
    expect(css).toMatch(
      /\.rr-radio-input\s*\{[^}]*radial-gradient\(circle, var\(--rr-color-action-primary-text\)/,
    );
    expect(css).toMatch(
      /\.rr-radio-input:checked:hover\s*\{[^}]*background-color:\s*var\(--rr-color-action-primary-background-hover\)/,
    );
  });

  it("propagates the group aria-invalid to every option and mutes the disabled label", async () => {
    const css = await readComponentCss("radio/Radio.css");

    expect(css).toMatch(
      /\.rr-radio-group\[aria-invalid="true"\]\s+\.rr-radio-input\s*\{[^}]*border-color:\s*var\(--rr-color-border-danger\)/,
    );
    expect(css).toMatch(
      /\.rr-radio--disabled\s+\.rr-radio-label\s*\{[^}]*color:\s*var\(--rr-color-text-muted\)/,
    );
  });

  it("rings on focus-visible and clears the dot when disabled, after every state rule", async () => {
    const css = await readComponentCss("radio/Radio.css");
    const firstDisabled = css.search(/\.rr-radio-input:disabled/);

    expect(css).toMatch(
      /\.rr-radio-input:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--rr-color-focus-ring\)/,
    );
    expect(css).toMatch(/\.rr-radio-input:disabled\s*\{[^}]*background-image:\s*none/);
    expect(firstDisabled).toBeGreaterThan(css.lastIndexOf(":hover"));
    expect(firstDisabled).toBeGreaterThan(css.lastIndexOf(":checked"));
  });

  it("only consumes tokens that @raulrod/tokens defines", async () => {
    await expectTokenLineage(await readComponentCss("radio/Radio.css"));
  });

  it("keeps Radio, RadioGroup and Checkbox coexisting in the public API", () => {
    expect(Radio).toBeTypeOf("object");
    expect(RadioGroup).toBeTypeOf("object");
    expect(Checkbox).toBeTypeOf("object");
  });
});
