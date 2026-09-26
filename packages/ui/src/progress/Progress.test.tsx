// Behavioral spec for Progress (RRU-063, tracked in RRU-068).
// Progress is the one component whose contract is mostly ARIA: the track owns
// `role="progressbar"` with the label as its accessible name, `aria-valuenow` is
// clamped so assistive tech never reads a nonsense value, and the indeterminate
// state omits `aria-valuenow` (a moving bar has no current value) while keeping
// its visual indicator decorative. The DOM half of the contract — rerendering
// the announced value, forwarding the ref — lives here too, and the authored CSS
// contract (motion tokens + reduced motion) is asserted in the same file.
import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { auditA11y } from "../test-support/axe.js";
import { expectTokenLineage, readComponentCss, stripCssComments } from "../test-support/css.js";

import { Progress } from "./index.js";

const progressbar = (name: string) => screen.getByRole("progressbar", { name });

describe("Progress SSR contract", () => {
  it("renders a determinate progressbar with its accessible name and fixed range", () => {
    const markup = renderToStaticMarkup(<Progress label="Upload" value={40} />);

    expect(markup).toContain('role="progressbar"');
    expect(markup).toContain('aria-label="Upload"');
    expect(markup).toContain('aria-valuemin="0"');
    expect(markup).toContain('aria-valuemax="100"');
    expect(markup).toContain('aria-valuenow="40"');
    expect(markup).toContain('class="rr-progress"');
    expect(markup).toContain('class="rr-progress__indicator" style="width:40%"');
  });

  it("clamps determinate values and treats non-finite values as the minimum", () => {
    expect(renderToStaticMarkup(<Progress label="Low" value={-1} />)).toContain(
      'aria-valuenow="0"',
    );
    expect(renderToStaticMarkup(<Progress label="High" value={101} />)).toContain(
      'aria-valuenow="100"',
    );
    expect(renderToStaticMarkup(<Progress label="Unknown" value={Number.NaN} />)).toContain(
      'aria-valuenow="0"',
    );
  });

  it("omits aria-valuenow and emits the indeterminate modifier when progress is unknown", () => {
    const markup = renderToStaticMarkup(<Progress label="Loading" indeterminate />);

    expect(markup).toContain('class="rr-progress rr-progress--indeterminate"');
    expect(markup).toContain('aria-valuemin="0"');
    expect(markup).toContain('aria-valuemax="100"');
    expect(markup).not.toContain("aria-valuenow");
    expect(markup).toContain('class="rr-progress__indicator" style="width:35%"');
  });

  it("keeps the visual indicator decorative", () => {
    const markup = renderToStaticMarkup(<Progress label="Loading" indeterminate />);

    expect(markup).toContain('aria-hidden="true" class="rr-progress__indicator"');
  });

  it("merges className and passes native attributes through to the root", () => {
    const markup = renderToStaticMarkup(
      <Progress
        label="Processing"
        value={25}
        className="probe"
        id="processing"
        title="Processing files"
        data-state="active"
        aria-valuetext="25 percent complete"
      />,
    );

    expect(markup).toContain('id="processing"');
    expect(markup).toContain('title="Processing files"');
    expect(markup).toContain('data-state="active"');
    expect(markup).toContain('aria-valuetext="25 percent complete"');
    expect(markup).toMatch(/class="rr-progress probe"/);
  });
});

describe("Progress DOM contract", () => {
  it("updates the announced value and visual width when props change", () => {
    const { rerender } = render(<Progress label="Upload" value={20} />);
    expect(progressbar("Upload")).toHaveAttribute("aria-valuenow", "20");
    expect(document.querySelector<HTMLElement>(".rr-progress__indicator")?.style.width).toBe("20%");

    rerender(<Progress label="Upload" value={80} />);
    expect(progressbar("Upload")).toHaveAttribute("aria-valuenow", "80");
    expect(document.querySelector<HTMLElement>(".rr-progress__indicator")?.style.width).toBe("80%");

    rerender(<Progress label="Upload" indeterminate />);
    expect(progressbar("Upload")).not.toHaveAttribute("aria-valuenow");
    expect(progressbar("Upload").className).toContain("rr-progress--indeterminate");
  });

  it("forwards the ref to the progressbar root", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Progress label="Upload" value={10} ref={ref} />);

    expect(ref.current).toBe(document.querySelector(".rr-progress"));
    expect(ref.current).toHaveAttribute("role", "progressbar");
  });

  it("is a genuine forwardRef with a stable displayName", () => {
    expect(Progress.$$typeof).toBe(Symbol.for("react.forward_ref"));
    expect(Progress.displayName).toBe("Progress");
  });

  it("has no axe violations in both states", async () => {
    const { container } = render(
      <>
        <Progress label="Upload" value={40} />
        <Progress label="Loading" indeterminate />
      </>,
    );

    await expect(auditA11y(container)).resolves.toHaveNoViolations();
  });
});

describe("Progress authored CSS contract", () => {
  it("builds the track and the indicator from tokens", async () => {
    const css = await readComponentCss("progress/Progress.css");
    const track = /\.rr-progress\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
    const indicator = /\.rr-progress__indicator\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";

    expect(track).toMatch(/display:\s*block/);
    expect(track).toMatch(/width:\s*100%/);
    expect(track).toMatch(/height:\s*var\(--rr-space-2\)/);
    expect(track).toMatch(/overflow:\s*hidden/);
    expect(track).toMatch(/background-color:\s*var\(--rr-color-background-sunken\)/);
    expect(track).toMatch(/border-radius:\s*var\(--rr-radius-full\)/);
    expect(indicator).toMatch(/display:\s*block/);
    expect(indicator).toMatch(/height:\s*100%/);
    expect(indicator).toMatch(/background-color:\s*var\(--rr-color-action-primary-background\)/);
    expect(indicator).toMatch(
      /transition:\s*width var\(--rr-motion-duration-base\) var\(--rr-motion-easing-standard\)/,
    );
  });

  it("animates the indeterminate state with the motion tokens and loops", async () => {
    const css = await readComponentCss("progress/Progress.css");

    expect(css).toMatch(/@keyframes rr-progress-indeterminate/);
    expect(css).toMatch(
      /\.rr-progress--indeterminate \.rr-progress__indicator\s*\{[\s\S]*animation:\s*rr-progress-indeterminate var\(--rr-motion-duration-slow\)\s+var\(--rr-motion-easing-standard\)\s+infinite/,
    );
  });

  it("disables the motion under prefers-reduced-motion", async () => {
    const css = await readComponentCss("progress/Progress.css");

    expect(css).toMatch(/prefers-reduced-motion:\s*reduce/);
    expect(css).toMatch(
      /\.rr-progress--indeterminate \.rr-progress__indicator\s*\{\s*animation-name:\s*var\(--rr-motion-behavior-reduced\)/,
    );
    expect(css).toMatch(/transition:\s*none/);
  });

  it("holds the token-only rule: no hex, no pixel design values", async () => {
    const css = stripCssComments(await readComponentCss("progress/Progress.css"));

    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/\d+px\b/);
  });

  it("only consumes tokens that @raulrod/tokens defines", async () => {
    await expectTokenLineage(await readComponentCss("progress/Progress.css"));
  });
});
