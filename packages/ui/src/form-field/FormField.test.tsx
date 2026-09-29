// Behavioral spec for FormField (RRU-044, tracked in RRU-068).
// The whole card is association, so the spec asserts it the way assistive tech
// reads it: the label finds its control, the description and error are the
// control's accessible description, the error is exposed via
// `aria-errormessage` AND announced (`role="alert"`), and `aria-invalid` is
// driven by the presence of the Error slot alone (no parallel prop). Absence of
// slots must leave clean HTML — no dangling idrefs, which is also what keeps
// axe green.
import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Input } from "../index.js";
import { auditA11y } from "../test-support/axe.js";
import { expectTokenLineage, readComponentCss, tokenVarsUsed } from "../test-support/css.js";

import {
  FormField,
  FormFieldControl,
  FormFieldDescription,
  FormFieldError,
  FormFieldLabel,
  useFormField,
} from "./index.js";

/** A control drawn through the render-prop slot, as a consumer would. */
function EmailField({ error }: { error?: string }) {
  return (
    <FormField>
      <FormFieldLabel>Email</FormFieldLabel>
      <FormFieldDescription>We never share your email.</FormFieldDescription>
      <FormFieldControl>{(field) => <Input {...field} />}</FormFieldControl>
      {error !== undefined && <FormFieldError>{error}</FormFieldError>}
    </FormField>
  );
}

describe("FormField association", () => {
  it("labels the control and describes it with the description and the error", () => {
    render(<EmailField error="Invalid email address." />);
    const control = screen.getByLabelText("Email");

    expect(control).toHaveAccessibleDescription(
      "We never share your email. Invalid email address.",
    );
    expect(control).toHaveAccessibleErrorMessage("Invalid email address.");
    expect(control).toHaveAttribute("aria-invalid", "true");
  });

  it("announces the error instead of only showing it", () => {
    render(<EmailField error="Invalid email address." />);

    expect(screen.getByRole("alert")).toHaveTextContent("Invalid email address.");
  });

  it("keeps the control valid while there is no error slot", () => {
    render(<EmailField />);
    const control = screen.getByLabelText("Email");

    expect(control).toHaveAccessibleDescription("We never share your email.");
    expect(control).not.toHaveAttribute("aria-invalid");
    expect(control).not.toHaveAttribute("aria-errormessage");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("toggles the wiring when the error slot appears", () => {
    const { rerender } = render(<EmailField />);
    expect(screen.getByLabelText("Email")).not.toHaveAttribute("aria-invalid");

    rerender(<EmailField error="Bad" />);
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
  });

  it("leaves no dangling idrefs when only the control is present", () => {
    const { container } = render(
      <FormField>
        <FormFieldControl>{(field) => <Input {...field} aria-label="Bare" />}</FormFieldControl>
      </FormField>,
    );
    const control = screen.getByLabelText("Bare");

    expect(control).not.toHaveAttribute("aria-describedby");
    expect(control).not.toHaveAttribute("aria-errormessage");
    expect(container.querySelector("label")).toBeNull();
  });

  it("honours a controlId override, the className merge and pass-through props", () => {
    const { container } = render(
      <FormField controlId="my-email" className="probe" id="ff-root" data-x="1">
        <FormFieldLabel>Email</FormFieldLabel>
        <FormFieldControl>{(field) => <Input {...field} />}</FormFieldControl>
      </FormField>,
    );

    expect(container.firstElementChild).toHaveAttribute("id", "ff-root");
    expect(container.firstElementChild).toHaveClass("rr-form-field", "probe");
    expect(screen.getByLabelText("Email")).toHaveAttribute("id", "my-email");
  });

  it("exposes the same payload through the useFormField hook", () => {
    function CustomControl() {
      const field = useFormField();
      return <Input {...field} />;
    }

    render(
      <FormField controlId="hooked">
        <FormFieldLabel>Email</FormFieldLabel>
        <FormFieldControl>
          <CustomControl />
        </FormFieldControl>
        <FormFieldError>Bad</FormFieldError>
      </FormField>,
    );

    const control = screen.getByLabelText("Email");
    expect(control).toHaveAttribute("id", "hooked");
    expect(control).toHaveAccessibleErrorMessage("Bad");
  });

  it("renders the same wiring on the server", () => {
    const markup = renderToStaticMarkup(<EmailField error="Invalid email address." />);

    expect(markup).toContain('aria-errormessage="');
    expect(markup).toContain('aria-invalid="true"');
    expect(markup).toContain('role="alert"');
    expect(markup).toMatch(
      /<label class="rr-form-field-label" for="rr-field-[\w-]+">Email<\/label>/,
    );
  });

  it("has no axe violations in the valid and invalid states", async () => {
    const { container } = render(
      <>
        <EmailField />
        <EmailField error="Invalid email address." />
      </>,
    );

    await expect(auditA11y(container)).resolves.toHaveNoViolations();
  });
});

describe("FormField authored CSS contract", () => {
  it("declares the five element selectors of the structure", async () => {
    const css = await readComponentCss("form-field/FormField.css");

    for (const selector of [
      "rr-form-field",
      "rr-form-field-label",
      "rr-form-field-description",
      "rr-form-field-control",
      "rr-form-field-error",
    ]) {
      expect(css, selector).toMatch(new RegExp(`\\.${selector}\\s*\\{`));
    }
  });

  it("mutes the description and paints label and error with their text tokens", async () => {
    const css = await readComponentCss("form-field/FormField.css");

    expect(css).toMatch(
      /\.rr-form-field-description\s*\{[^}]*color:\s*var\(--rr-color-text-muted\)/,
    );
    expect(css).toMatch(/\.rr-form-field-label\s*\{[^}]*color:\s*var\(--rr-color-text-primary\)/);
    expect(css).toMatch(/\.rr-form-field-error\s*\{[^}]*color:\s*var\(--rr-color-text-danger\)/);
  });

  it("only consumes tokens that @raulrod/tokens defines", async () => {
    const variables = await expectTokenLineage(await readComponentCss("form-field/FormField.css"));

    expect(tokenVarsUsed(await readComponentCss("form-field/FormField.css"))).toContain(
      "--rr-color-text-danger",
    );
    expect(variables).toBeGreaterThan(0);
  });
});
