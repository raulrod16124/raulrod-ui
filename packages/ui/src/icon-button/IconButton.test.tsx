// Behavioral spec for IconButton (RRU-042, tracked in RRU-068).
// The interesting part is the accessible name (ADR-007): the icon is
// decorative, the required `label` is the single labelling channel, and that
// contract must win over a consumer-supplied `aria-label`. Loading must replace
// the icon with a decorative spinner while the name and busy state survive.
import type { IconButtonSize, IconButtonVariant } from "./IconButton.types.js";

import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { IconButton, Loader2 } from "../index.js";
import { auditA11y } from "../test-support/axe.js";
import { expectTokenLineage, readComponentCss, stripCssComments } from "../test-support/css.js";

const variants: IconButtonVariant[] = [
  "primary",
  "secondary",
  "outline",
  "ghost",
  "destructive",
  "link",
];
const sizes: IconButtonSize[] = ["sm", "md", "lg"];

/** Square sizes that must match Button's heights (24/34/46) from tokens + 2px border. */
const sizeSquares = [
  { size: "sm", font: "font-size-sm", pad: "space-2" },
  { size: "md", font: "font-size-base", pad: "space-4" },
  { size: "lg", font: "font-size-lg", pad: "space-6" },
] as const;

describe("IconButton rendered markup", () => {
  it("labels the control with the required label and hides the icon", () => {
    expect(
      renderToStaticMarkup(
        <IconButton label="Save">
          <Loader2 />
        </IconButton>,
      ),
    ).toMatch(
      /^<button aria-label="Save" class="rr-icon-button rr-icon-button--primary"><span class="rr-icon-button__icon" aria-hidden="true"><svg/,
    );
  });

  it.each(variants)('variant="%s" emits its modifier', (variant) => {
    expect(
      renderToStaticMarkup(
        <IconButton label="x" variant={variant}>
          <Loader2 />
        </IconButton>,
      ),
    ).toContain(`class="rr-icon-button rr-icon-button--${variant}"`);
  });

  it.each(sizes)('size="%s" emits its modifier', (size) => {
    expect(
      renderToStaticMarkup(
        <IconButton label="x" size={size}>
          <Loader2 />
        </IconButton>,
      ),
    ).toContain(`class="rr-icon-button rr-icon-button--primary rr-icon-button--size-${size}"`);
  });

  it("emits combined modifiers, merges className and spreads pass-through props", () => {
    expect(
      renderToStaticMarkup(
        <IconButton label="x" variant="destructive" size="lg" className="probe" id="b" data-x="1">
          <Loader2 />
        </IconButton>,
      ),
    ).toMatch(
      /^<button id="b" data-x="1" aria-label="x" class="rr-icon-button rr-icon-button--destructive rr-icon-button--size-lg probe">/,
    );
  });
});

describe("IconButton accessible name", () => {
  it("exposes the label as the accessible name of the button", () => {
    render(
      <IconButton label="Save">
        <Loader2 />
      </IconButton>,
    );

    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("renders no text of its own, so the name is never duplicated", () => {
    const { container } = render(<IconButton label="Save" />);

    expect(container.querySelector(".rr-icon-button__icon")).toHaveAttribute("aria-hidden", "true");
    expect(container).not.toHaveTextContent("Save");
  });

  it("keeps its own aria-label even if the consumer spreads one", () => {
    const { container } = render(
      <IconButton label="Save" aria-label="override">
        <Loader2 />
      </IconButton>,
    );

    expect(container.querySelector("button")).toHaveAttribute("aria-label", "Save");
  });

  it("throws a helpful error in development if label is missing", () => {
    expect(() => {
      // @ts-expect-error — testing the runtime guard that catches JS/ignored-TS usage
      render(<IconButton />);
    }).toThrow(
      "[@raulrod/ui] IconButton requires a `label` prop. The icon passed as `children` is decorative and cannot provide an accessible name.",
    );
  });
});

describe("IconButton disabled and loading states", () => {
  it("is enabled by default and honours the native disabled attribute", () => {
    const { rerender } = render(<IconButton label="Save" />);
    expect(screen.getByRole("button", { name: "Save" })).not.toBeDisabled();

    rerender(
      <IconButton label="Save" disabled>
        <Loader2 />
      </IconButton>,
    );
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("replaces the icon with a decorative spinner while loading, keeping name and busy state", () => {
    const { container } = render(
      <IconButton label="Save" loading>
        <Loader2 />
      </IconButton>,
    );
    const button = screen.getByRole("button", { name: "Save" });

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveClass("rr-icon-button--loading");
    expect(container.querySelector(".rr-icon-button__spinner")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(container.querySelector(".rr-icon-button__icon")).toBeNull();
  });

  it("combines an explicit disabled with loading", () => {
    const { container } = render(
      <IconButton label="Save" loading disabled={false}>
        <Loader2 />
      </IconButton>,
    );

    expect(container.querySelector("button")).toHaveAttribute("disabled");
    expect(container.querySelector("button")).toHaveAttribute("aria-busy", "true");
  });
});

describe("IconButton accessibility", () => {
  it("has no axe violations, since a nameless icon button would fail the name rule", async () => {
    const { container } = render(
      <>
        <IconButton label="Save">
          <Loader2 />
        </IconButton>
        <IconButton label="More" variant="ghost">
          <Loader2 />
        </IconButton>
        <IconButton label="Saving" loading>
          <Loader2 />
        </IconButton>
      </>,
    );

    await expect(auditA11y(container)).resolves.toHaveNoViolations();
  });
});

describe("IconButton authored CSS contract", () => {
  it("declares every variant and size of the public API", async () => {
    const css = await readComponentCss("icon-button/IconButton.css");

    for (const variant of variants) {
      expect(css, `variant ${variant}`).toMatch(new RegExp(`\\.rr-icon-button--${variant}\\s*\\{`));
    }
    for (const size of sizes) {
      expect(css, `size ${size}`).toMatch(new RegExp(`\\.rr-icon-button--size-${size}\\s*\\{`));
    }
  });

  it("keeps every size square, built from the font-size token plus the size padding", async () => {
    const css = await readComponentCss("icon-button/IconButton.css");

    for (const { size, font, pad } of sizeSquares) {
      const block =
        css.match(new RegExp(`\\.rr-icon-button--size-${size}\\s*\\{[^}]*\\}`))?.[0] ?? "";
      const square = new RegExp(
        `(width|height):\\s*calc\\(var\\(--rr-${font}\\) \\+ var\\(--rr-${pad}\\) \\+ 2px\\)`,
        "g",
      );

      expect(block, `size-${size} width`).toMatch(square);
      expect(block, `size-${size} height`).toMatch(square);
    }
  });

  it("refuses to lose the square in a tight row (RRU-136)", async () => {
    const css = await readComponentCss("icon-button/IconButton.css");

    // Every size declares `width` AND `height`, so the box is what keeps a mixed
    // Button/IconButton toolbar aligned. `min-width: 0` must not appear on this
    // control: it is the declaration that would allow the width to be given up
    // while the height stays fixed, turning the square into a rectangle.
    expect(css).toMatch(/\.rr-icon-button\s*\{[^}]*flex-shrink:\s*0/);
    expect(css).not.toMatch(/\.rr-icon-button\s*\{[^}]*min-width:\s*0/);

    // There is no label here to wrap: the icon is decorative and `label` is the
    // accessible name, so Button's wrapping policy must not leak in.
    expect(css).not.toMatch(/overflow-wrap/);
    expect(css).not.toMatch(/\.rr-icon-button\s*\{[^}]*white-space:\s*nowrap/);
  });

  it("defaults size=md in the base class, identically to --size-md", async () => {
    // Comments are stripped first: the rationale for this contract lives in a
    // CSS comment inside the very block being read, and a regex over raw source
    // would match the prose instead of the declarations.
    const css = stripCssComments(await readComponentCss("icon-button/IconButton.css"));

    // The regression gate for a defect found by the RRU-136 E2E: `size` is
    // optional and `createVariants` drops an `undefined` axis (variants.ts), so
    // an IconButton rendered with no `size` prop carries NO `--size-md` class.
    // The md geometry therefore has to live in the base block — that is the
    // convention variants.ts:12 states ("defaults live in CSS base classes") and
    // the one Stack.gap and Button follow. It did not, and the control fell
    // through to the UA stylesheet: measured at 87.59x20 with `padding: 1px 6px`,
    // breaking both the square and the Button-height alignment asserted above.
    const geometry = ["padding", "font-size", "width", "height"];

    const base = /\.rr-icon-button\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
    const md = /\.rr-icon-button--size-md\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
    expect(base, "the base block must exist").not.toBe("");
    expect(md, "the --size-md block must exist").not.toBe("");

    // Parity, not a snapshot: an explicit `size="md"` and the default must resolve
    // to the same box, so the four declarations are compared across the two
    // blocks. A missing default or a diverged duplicate fails here.
    for (const property of geometry) {
      const inBase = new RegExp(`(?:^|;)\\s*${property}:\\s*([^;]+)`).exec(base)?.[1]?.trim();
      const inMd = new RegExp(`(?:^|;)\\s*${property}:\\s*([^;]+)`).exec(md)?.[1]?.trim();
      expect(inBase, `${property} must be declared in .rr-icon-button`).toBeDefined();
      expect(inMd, `${property} must be declared in .rr-icon-button--size-md`).toBeDefined();
      expect(inBase, `${property} must match between the default and --size-md`).toBe(inMd);
    }
  });

  it("exposes a 2px focus-visible ring (color.md §6.3)", async () => {
    const css = await readComponentCss("icon-button/IconButton.css");

    expect(css).toMatch(
      /\.rr-icon-button:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--rr-color-focus-ring\)/,
    );
  });

  it("paints the link variant with link.text, and the secondary edge with border.strong", async () => {
    // Same two corrections as Button (RRU-126/127), asserted here too because
    // these are two independent stylesheets: a shared token does not mean a
    // shared declaration.
    const css = await readComponentCss("icon-button/IconButton.css");

    expect(css).toMatch(/\.rr-icon-button--link\s*\{[^}]*color:\s*var\(--rr-color-link-text\)/);
    expect(css).toMatch(
      /\.rr-icon-button--link:hover\s*\{[^}]*color:\s*var\(--rr-color-link-text-hover\)/,
    );
    expect(css).not.toMatch(/\.rr-icon-button--link[^{]*\{[^}]*color:\s*var\(--rr-color-action-/);
    expect(css).toMatch(
      /\.rr-icon-button--secondary\s*\{[^}]*border-color:\s*var\(--rr-color-border-strong\)/,
    );
    expect(css).not.toMatch(/border-color:\s*var\(--rr-color-border-default\)/);
  });

  it("animates the spinner and honors prefers-reduced-motion", async () => {
    const css = await readComponentCss("icon-button/IconButton.css");

    expect(css).toMatch(/@keyframes rr-icon-button-spin/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
    expect(css).toMatch(/var\(--rr-motion-behavior-reduced\)/);
  });

  it("orders the disabled block after every :hover rule (source order at equal specificity)", async () => {
    const css = await readComponentCss("icon-button/IconButton.css");
    const firstDisabled = css.search(/\.rr-icon-button:disabled/);
    const lastHover = css.lastIndexOf(":hover");

    expect(firstDisabled).toBeGreaterThanOrEqual(0);
    expect(
      firstDisabled,
      `disabled block at ${firstDisabled} vs last :hover at ${lastHover}`,
    ).toBeGreaterThan(lastHover);
  });

  it("only consumes tokens that @raulrod/tokens defines", async () => {
    await expectTokenLineage(await readComponentCss("icon-button/IconButton.css"));
  });
});
