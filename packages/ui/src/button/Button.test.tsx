// Behavioral spec for Button (RRU-041, tracked in RRU-068).
// Covers the card's DoD as observable behavior: bounded polymorphism (`href`
// ⇒ `<a>`, never the other way round), the loading/disabled states a consumer
// and a screen reader can perceive, decorative icons that do not pollute the
// accessible name, plus the authored CSS contract (focus ring, disabled source
// order, spinner + reduced motion).
import type { ButtonSize, ButtonVariant } from "./Button.types.js";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { Button, ChevronDown, Loader2 } from "../index.js";
import { auditA11y } from "../test-support/axe.js";
import { expectTokenLineage, readComponentCss } from "../test-support/css.js";

const variants: ButtonVariant[] = [
  "primary",
  "secondary",
  "outline",
  "ghost",
  "destructive",
  "link",
];
const sizes: ButtonSize[] = ["sm", "md", "lg"];

describe("Button rendered markup", () => {
  it("defaults to the primary variant (size md lives in the CSS base class)", () => {
    expect(renderToStaticMarkup(<Button>Go</Button>)).toBe(
      '<button class="rr-button rr-button--primary">Go</button>',
    );
  });

  it.each(variants)('variant="%s" emits its modifier', (variant) => {
    expect(renderToStaticMarkup(<Button variant={variant}>x</Button>)).toBe(
      `<button class="rr-button rr-button--${variant}">x</button>`,
    );
  });

  it.each(sizes)('size="%s" emits its modifier', (size) => {
    expect(renderToStaticMarkup(<Button size={size}>x</Button>)).toBe(
      `<button class="rr-button rr-button--primary rr-button--size-${size}">x</button>`,
    );
  });

  it("emits combined modifiers, merges className and spreads pass-through props", () => {
    expect(
      renderToStaticMarkup(
        <Button variant="destructive" size="lg" className="probe" id="b" data-x="1">
          x
        </Button>,
      ),
    ).toBe(
      '<button id="b" data-x="1" class="rr-button rr-button--destructive rr-button--size-lg probe">x</button>',
    );
  });

  it("renders an anchor when href is present, and a button otherwise", () => {
    expect(renderToStaticMarkup(<Button href="/docs">Docs</Button>)).toBe(
      '<a href="/docs" class="rr-button rr-button--primary">Docs</a>',
    );
    expect(
      renderToStaticMarkup(
        <Button href="https://example.com" target="_blank" rel="noreferrer">
          Ext
        </Button>,
      ),
    ).toBe(
      '<a href="https://example.com" target="_blank" rel="noreferrer" class="rr-button rr-button--primary">Ext</a>',
    );
    expect(renderToStaticMarkup(<Button variant="link">Docs</Button>)).toMatch(/^<button /);
  });

  it("wraps the icons in decorative aria-hidden spans next to the label", () => {
    expect(
      renderToStaticMarkup(
        <Button startIcon="S" endIcon="E">
          Save
        </Button>,
      ),
    ).toBe(
      '<button class="rr-button rr-button--primary"><span class="rr-button__icon" aria-hidden="true">S</span>Save<span class="rr-button__icon" aria-hidden="true">E</span></button>',
    );
    expect(renderToStaticMarkup(<Button>x</Button>)).not.toContain("rr-button__icon");
  });
});

describe("Button disabled and loading states", () => {
  it("uses the native disabled attribute on the button render", () => {
    render(<Button disabled>Save</Button>);

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("keeps the accessible name while loading, marks it busy and shows a decorative spinner", () => {
    const { container } = render(<Button loading>Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveClass("rr-button--loading");
    expect(container.querySelector(".rr-button__spinner")).toHaveAttribute("aria-hidden", "true");
  });

  it("never fires onClick while loading", async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Save
      </Button>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it("translates disabled into aria-disabled on the anchor render, with a navigation guard", async () => {
    const onClick = vi.fn();
    render(
      <Button href="/docs" disabled onClick={onClick}>
        Docs
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Docs" });

    expect(link).toHaveAttribute("aria-disabled", "true");
    expect(link).not.toBeDisabled();

    await userEvent.click(link);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(link).toHaveAttribute("aria-disabled", "true");
  });

  it("marks the anchor busy while loading and keeps its label", () => {
    render(
      <Button href="/docs" loading>
        Docs
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Docs" });

    expect(link).toHaveAttribute("aria-busy", "true");
    expect(link).toHaveAttribute("aria-disabled", "true");
  });

  it("activates on click and on Enter when it is not inert", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });

    await userEvent.click(button);
    await userEvent.keyboard("{enter}");

    expect(onClick).toHaveBeenCalledTimes(2);
  });
});

// The `rel` default (RRU-102). Observable behavior, not markup trivia: what the
// consumer sees is what the OPENED document gets — a `window.opener` handle back
// to this page (reverse tabnabbing) and this page's URL in its `Referer`
// header. A `target` is the trigger, `rel` is the protection, and forgetting the
// second one while using the first is the bug this closes.
describe("Button link rel default", () => {
  it.each(["_blank", "_parent", "_top", "docs"])(
    'defaults rel to "noopener noreferrer" for target="%s"',
    (target) => {
      render(
        <Button href="https://example.com" target={target}>
          Ext
        </Button>,
      );

      expect(screen.getByRole("link", { name: "Ext" })).toHaveAttribute(
        "rel",
        "noopener noreferrer",
      );
    },
  );

  it("emits no rel without a target (same browsing context, nothing to protect)", () => {
    expect(renderToStaticMarkup(<Button href="/docs">Docs</Button>)).not.toContain("rel=");
    expect(
      renderToStaticMarkup(
        <Button href="/docs" target="_self">
          Docs
        </Button>,
      ),
    ).not.toContain("rel=");
  });

  it("lets an explicit rel win, including the empty value", () => {
    expect(
      renderToStaticMarkup(
        <Button href="https://example.com" target="_blank" rel="external">
          Ext
        </Button>,
      ),
    ).toContain('rel="external"');
    expect(
      renderToStaticMarkup(
        <Button href="https://example.com" target="_blank" rel="">
          Ext
        </Button>,
      ),
    ).toContain('rel=""');
  });

  it("never touches rel on the button render, where there is no navigation", () => {
    expect(renderToStaticMarkup(<Button>Save</Button>)).not.toContain("rel=");
  });
});

describe("Button accessibility", () => {
  it("exposes the icons as re-exports of @raulrod/icons from the package root", () => {
    expect(Loader2).toBeTypeOf("object");
    expect(ChevronDown).toBeTypeOf("object");
  });

  it("has no axe violations in the main states", async () => {
    const { container } = render(
      <>
        <Button>Save</Button>
        <Button variant="outline" startIcon={<ChevronDown />}>
          More
        </Button>
        <Button loading>Saving</Button>
        <Button href="/docs" disabled>
          Docs
        </Button>
      </>,
    );

    await expect(auditA11y(container)).resolves.toHaveNoViolations();
  });
});

describe("Button authored CSS contract", () => {
  it("declares every variant and size of the public API", async () => {
    const css = await readComponentCss("button/Button.css");

    for (const variant of variants) {
      expect(css, `variant ${variant}`).toMatch(new RegExp(`\\.rr-button--${variant}\\s*\\{`));
    }
    for (const size of sizes) {
      expect(css, `size ${size}`).toMatch(new RegExp(`\\.rr-button--size-${size}\\s*\\{`));
    }
  });

  it("shares one disabled selector and resolves the component disabled tokens", async () => {
    const css = await readComponentCss("button/Button.css");

    expect(css).toMatch(/:disabled\s*,\s*\.rr-button\[aria-disabled="true"\]/);
    expect(css).toMatch(/background:\s*var\(--rr-button-primary-background-disabled\)/);
  });

  it("exposes a 2px focus-visible ring (color.md §6.3)", async () => {
    const css = await readComponentCss("button/Button.css");

    expect(css).toMatch(
      /\.rr-button:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--rr-color-focus-ring\)/,
    );
  });

  it("paints the link variant with link.text, and the secondary edge with border.strong", async () => {
    // Two pairs that used to be painted with the wrong token, both measured
    // (RRU-126/127):
    //
    //   - `link` was `color.action.primary.background`, a token authorized at 3:1
    //     as a control boundary. Text needs 4.5:1, and in dark it measured
    //     3.32:1 at rest / 2.33:1 on hover.
    //   - `secondary` edged itself with `color.border.default`, which measures
    //     1.46:1 / 1.38:1 against the page — the outline a `secondary` button is
    //     identified by was invisible.
    const css = await readComponentCss("button/Button.css");

    expect(css).toMatch(/\.rr-button--link\s*\{[^}]*color:\s*var\(--rr-color-link-text\)/);
    expect(css).toMatch(
      /\.rr-button--link:hover\s*\{[^}]*color:\s*var\(--rr-color-link-text-hover\)/,
    );
    expect(css).not.toMatch(/\.rr-button--link[^{]*\{[^}]*color:\s*var\(--rr-color-action-/);
    expect(css).toMatch(
      /\.rr-button--secondary\s*\{[^}]*border-color:\s*var\(--rr-color-border-strong\)/,
    );
    expect(css).not.toMatch(/border-color:\s*var\(--rr-color-border-default\)/);
  });

  it("animates the spinner and honors prefers-reduced-motion", async () => {
    const css = await readComponentCss("button/Button.css");

    expect(css).toMatch(/@keyframes rr-button-spin/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
    expect(css).toMatch(/var\(--rr-motion-behavior-reduced\)/);
  });

  it("orders the disabled block after every :hover rule (source order at equal specificity)", async () => {
    const css = await readComponentCss("button/Button.css");
    const firstDisabled = css.search(/\.rr-button:disabled/);
    const lastHover = css.lastIndexOf(":hover");

    expect(firstDisabled).toBeGreaterThanOrEqual(0);
    expect(
      firstDisabled,
      `disabled block at ${firstDisabled} vs last :hover at ${lastHover}`,
    ).toBeGreaterThan(lastHover);
  });

  it("only consumes tokens that @raulrod/tokens defines", async () => {
    await expectTokenLineage(await readComponentCss("button/Button.css"));
  });

  it("wraps a long label instead of overflowing (RRU-136)", async () => {
    const css = await readComponentCss("button/Button.css");

    // The flex item floor, dropped so the control can shrink as a flex item.
    expect(css).toMatch(/\.rr-button\s*\{[^}]*min-width:\s*0/);

    // `anywhere` and not `break-word`, deliberately: only `anywhere` feeds soft
    // wrap opportunities into the MIN-CONTENT size, so a label with no spaces
    // does not put a floor that `min-width: 0` alone cannot cross. A label like
    // an id or a URL is the case that motivated it.
    expect(css).toMatch(/\.rr-button\s*\{[^}]*overflow-wrap:\s*anywhere/);
    expect(css).not.toMatch(/overflow-wrap:\s*break-word/);

    // The wrapping policy must not become a truncation policy: an ellipsis here
    // would be inert (it only applies to block containers, and this root is
    // `inline-flex`) and would hide part of an action's label.
    expect(css).not.toMatch(/\.rr-button\s*\{[^}]*text-overflow/);
    expect(css).not.toMatch(/\.rr-button\s*\{[^}]*white-space:\s*nowrap/);
  });

  it("keeps the label in the DOM whatever the width does (RRU-136)", () => {
    // The visible rendering may wrap onto a second line, but the accessible
    // name is the label itself and truncation never gets to shorten it.
    const markup = renderToStaticMarkup(<Button>Cancel the subscription</Button>);

    expect(markup).toContain("Cancel the subscription");
  });
});
