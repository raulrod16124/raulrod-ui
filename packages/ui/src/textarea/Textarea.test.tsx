// Behavioral spec for Textarea (RRU-045, tracked in RRU-068).
// Two things matter here: the native pass-through (the component adds no state
// of its own to the control) and `autoResize`, whose CSS-grid mirror is the
// mechanism. The mirror used to be only SSR-observable; with the DOM available
// the spec now covers the dynamic half too — typing must re-sync the mirror
// while the consumer's own `onChange` still fires.
import type { TextareaSize } from "./Textarea.types.js";

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
import { Textarea } from "../index.js";
import { auditA11y } from "../test-support/axe.js";
import { expectTokenLineage, readComponentCss, stripCssComments } from "../test-support/css.js";

const sizes: TextareaSize[] = ["sm", "md", "lg"];
const mirrorOf = (container: HTMLElement): HTMLElement | null =>
  container.querySelector(".rr-textarea-autosize__mirror");

describe("Textarea rendered markup", () => {
  it("renders a bare textarea with the base class (size md in CSS)", () => {
    expect(renderToStaticMarkup(<Textarea />)).toBe('<textarea class="rr-textarea"></textarea>');
  });

  it.each(sizes)('size="%s" emits its modifier', (size) => {
    expect(renderToStaticMarkup(<Textarea size={size} />)).toBe(
      `<textarea class="rr-textarea rr-textarea--size-${size}"></textarea>`,
    );
  });

  it("merges className and passes native attributes through", () => {
    const markup = renderToStaticMarkup(
      <Textarea size="lg" className="probe" id="t" data-x="1" name="body" rows={3} cols={40} />,
    );

    expect(markup).toMatch(
      /^<textarea [^>]*class="rr-textarea rr-textarea--size-lg probe"[^>]*><\/textarea>$/,
    );
    for (const attribute of ['id="t"', 'data-x="1"', 'name="body"', 'rows="3"', 'cols="40"']) {
      expect(markup, attribute).toContain(attribute);
    }
    expect(renderToStaticMarkup(<Textarea placeholder="Describe" disabled />)).toBe(
      '<textarea placeholder="Describe" disabled="" class="rr-textarea"></textarea>',
    );
  });

  it("renders the uncontrolled and controlled initial content", () => {
    expect(renderToStaticMarkup(<Textarea defaultValue={"hello\nworld"} />)).toContain(
      "hello\nworld",
    );
    const controlled = renderToStaticMarkup(
      <Textarea value="cv" maxLength={10} onChange={() => undefined} />,
    );

    expect(controlled).toContain(">cv</textarea>");
    expect(controlled).toContain('maxLength="10"');
  });

  it("passes aria-invalid through untouched, in both directions", () => {
    expect(renderToStaticMarkup(<Textarea aria-invalid />)).toBe(
      '<textarea aria-invalid="true" class="rr-textarea"></textarea>',
    );
    expect(renderToStaticMarkup(<Textarea aria-invalid="false" />)).toBe(
      '<textarea aria-invalid="false" class="rr-textarea"></textarea>',
    );
  });
});

describe("Textarea autoResize", () => {
  it("wraps the control in the grid container with a presentational mirror", () => {
    const { container } = render(<Textarea autoResize aria-label="Notes" />);
    const mirror = mirrorOf(container);

    expect(container.querySelector(".rr-textarea-autosize")).not.toBeNull();
    expect(mirror).toHaveAttribute("aria-hidden", "true");
    expect(mirror?.textContent).toBe("\u200b");
  });

  it("keeps id, ARIA and className on the interactive textarea, leaving one control only", () => {
    const { container } = render(
      <Textarea autoResize id="T" aria-invalid rows={2} className="mybox" />,
    );
    const textareas = container.querySelectorAll("textarea");

    expect(textareas).toHaveLength(1);
    expect(textareas[0]).toHaveAttribute("id", "T");
    expect(textareas[0]).toHaveAttribute("aria-invalid", "true");
    expect(textareas[0]).toHaveAttribute("rows", "2");
    expect(textareas[0]).toHaveClass("rr-textarea", "mybox");
  });

  it("seeds the mirror from defaultValue and from the controlled value", () => {
    const uncontrolled = render(
      <Textarea autoResize defaultValue={"seed\nline2"} aria-label="a" />,
    );
    expect(mirrorOf(uncontrolled.container)?.textContent).toBe("seed\nline2");

    const controlled = render(
      <Textarea autoResize value={"ab\ncd"} onChange={() => undefined} aria-label="b" />,
    );
    expect(mirrorOf(controlled.container)?.textContent).toBe("ab\ncd");
  });

  it("re-syncs the mirror while typing and still calls the consumer onChange", async () => {
    const onChange = vi.fn();
    const { container } = render(<Textarea autoResize onChange={onChange} aria-label="Notes" />);

    await userEvent.type(screen.getByLabelText("Notes"), "hi\nthere");

    expect(mirrorOf(container)?.textContent).toBe("hi\nthere");
    expect(onChange).toHaveBeenCalledTimes(8);
  });

  it("carries the size modifier on the mirror, so padding and font-size stay in parity", () => {
    const { container } = render(<Textarea autoResize size="lg" aria-label="Notes" />);

    expect(mirrorOf(container)).toHaveClass("rr-textarea--size-lg");
  });
});

describe("Textarea composition and accessibility", () => {
  it("receives the FormField ARIA payload straight onto the textarea", () => {
    render(
      <FormField>
        <FormFieldLabel>Notes</FormFieldLabel>
        <FormFieldControl>{(field) => <Textarea {...field} />}</FormFieldControl>
        <FormFieldError>Too short</FormFieldError>
      </FormField>,
    );
    const control = screen.getByLabelText("Notes");

    expect(control).toHaveAttribute("aria-invalid", "true");
    expect(control).toHaveAccessibleErrorMessage("Too short");
  });

  it("has no axe violations when labelled", async () => {
    const { container } = render(
      <>
        <label htmlFor="a">Notes</label>
        <Textarea id="a" placeholder="Describe" />
        <label htmlFor="b">Auto</label>
        <Textarea id="b" autoResize />
      </>,
    );

    await expect(auditA11y(container)).resolves.toHaveNoViolations();
  });
});

describe("Textarea authored CSS contract", () => {
  it("floors the height with a token, allows vertical resize and uses the multiline leading", async () => {
    const css = await readComponentCss("textarea/Textarea.css");

    expect(css).toMatch(/\.rr-textarea\s*\{/);
    expect(css).toMatch(/\.rr-textarea\s*\{[^}]*min-height:\s*var\(--rr-space-16\)/);
    expect(css).toMatch(/\.rr-textarea\s*\{[^}]*line-height:\s*var\(--rr-font-leading-normal\)/);
    expect(css).toMatch(/\.rr-textarea\s*\{[^}]*resize:\s*vertical/);
  });

  it("draws the resting boundary with border.strong, never border.default (color.md §6.2)", async () => {
    const css = await readComponentCss("textarea/Textarea.css");
    const base = /\.rr-textarea\s*\{[^}]*\}/.exec(css)?.[0] ?? "";

    expect(base).toMatch(/border:\s*1px solid var\(--rr-color-border-strong\)/);
    expect(base).not.toContain("var(--rr-color-border-default)");
  });

  it("declares every size and mutes the placeholder", async () => {
    const css = await readComponentCss("textarea/Textarea.css");

    for (const size of sizes) {
      expect(css, `size ${size}`).toMatch(new RegExp(`\\.rr-textarea--size-${size}\\s*\\{`));
    }
    expect(css).toMatch(
      /\.rr-textarea::placeholder\s*\{[^}]*color:\s*var\(--rr-color-text-muted\)/,
    );
  });

  it("rings on focus-visible, paints invalid with the danger border and mutes disabled", async () => {
    const css = await readComponentCss("textarea/Textarea.css");

    expect(css).toMatch(
      /\.rr-textarea:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--rr-color-focus-ring\)/,
    );
    expect(css).toMatch(
      /\.rr-textarea\[aria-invalid="true"\]\s*\{[^}]*border-color:\s*var\(--rr-color-border-danger\)/,
    );
    expect(css).toMatch(
      /\.rr-textarea:disabled[^{]*\{[^}]*background:\s*var\(--rr-color-action-disabled-background\)/,
    );
  });

  it("orders the disabled block after the invalid rule (source order at equal specificity)", async () => {
    const css = await readComponentCss("textarea/Textarea.css");

    expect(css.search(/\.rr-textarea:disabled/)).toBeGreaterThan(
      css.search(/\[aria-invalid="true"\]/),
    );
  });

  it("lays the autoResize grid out and disables the manual resize inside it", async () => {
    const css = await readComponentCss("textarea/Textarea.css");

    expect(css).toMatch(/\.rr-textarea-autosize\s*\{[^}]*display:\s*grid/);
    expect(css).toMatch(/\.rr-textarea-autosize .rr-textarea\s*\{[^}]*grid-area:\s*1 \/ 1/);
    expect(css).toMatch(/\.rr-textarea-autosize .rr-textarea\s*\{[^}]*resize:\s*none/);
  });

  it("gives the mirror parity with the control, before the size modifiers", async () => {
    const css = stripCssComments(await readComponentCss("textarea/Textarea.css"));
    const mirrorRule = /\.rr-textarea-autosize__mirror\s*\{[^}]*\}/.exec(css)?.[0] ?? "";

    for (const declaration of [
      "grid-area: 1 / 1",
      "visibility: hidden",
      "white-space: pre-wrap",
      "overflow-wrap: anywhere",
      "border: 1px solid transparent",
    ]) {
      expect(mirrorRule, declaration).toContain(declaration);
    }
    expect(css.search(/\.rr-textarea--size-sm\s*\{/)).toBeGreaterThan(
      css.search(/\.rr-textarea-autosize__mirror\s*\{/),
    );
  });

  it("only consumes tokens that @raulrod/tokens defines", async () => {
    await expectTokenLineage(await readComponentCss("textarea/Textarea.css"));
  });
});
