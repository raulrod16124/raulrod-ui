import type { ProgressProps } from "./Progress.types.js";
import type { ReactElement } from "react";
import type { Root } from "react-dom/client";

import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";

import { Progress } from "./index.js";

function render(props: ProgressProps): string {
  return renderToStaticMarkup(<Progress {...props} />);
}

describe("Progress SSR contract", () => {
  it("renders a determinate progressbar with its accessible name and fixed range", () => {
    const markup = render({ label: "Upload progress", value: 40 });

    expect(markup).toContain('role="progressbar"');
    expect(markup).toContain('aria-label="Upload progress"');
    expect(markup).toContain('aria-valuemin="0"');
    expect(markup).toContain('aria-valuemax="100"');
    expect(markup).toContain('aria-valuenow="40"');
    expect(markup).toContain('class="rr-progress"');
    expect(markup).toContain('class="rr-progress__indicator" style="width:40%"');
  });

  it("clamps determinate values and treats non-finite values as the minimum", () => {
    expect(render({ label: "Low", value: -20 })).toContain('aria-valuenow="0"');
    expect(render({ label: "High", value: 140 })).toContain('aria-valuenow="100"');
    expect(render({ label: "Unknown", value: Number.NaN })).toContain('aria-valuenow="0"');
  });

  it("omits aria-valuenow and emits the indeterminate modifier when progress is unknown", () => {
    const markup = render({ label: "Loading", indeterminate: true });

    expect(markup).toContain('class="rr-progress rr-progress--indeterminate"');
    expect(markup).toContain('aria-valuemin="0"');
    expect(markup).toContain('aria-valuemax="100"');
    expect(markup).not.toContain("aria-valuenow");
    expect(markup).toContain('class="rr-progress__indicator" style="width:35%"');
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
    expect(markup).toContain('class="rr-progress probe"');
  });

  it("keeps the visual indicator decorative", () => {
    const markup = render({ label: "Loading", indeterminate: true });
    expect(markup).toContain('aria-hidden="true" class="rr-progress__indicator"');
  });
});

describe("Progress DOM contract", () => {
  let host: HTMLDivElement | null = null;
  let root: Root | null = null;

  function mount(element: ReactElement): void {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    act(() => root?.render(element));
  }

  function rerender(element: ReactElement): void {
    act(() => root?.render(element));
  }

  afterEach(() => {
    act(() => root?.unmount());
    root = null;
    host?.remove();
    host = null;
  });

  it("updates the announced value and visual width when props change", () => {
    mount(<Progress label="Upload" value={20} />);
    let progress = document.querySelector<HTMLElement>(".rr-progress");
    let indicator = document.querySelector<HTMLElement>(".rr-progress__indicator");
    expect(progress?.getAttribute("aria-valuenow")).toBe("20");
    expect(indicator?.style.width).toBe("20%");

    rerender(<Progress label="Upload" value={80} />);
    progress = document.querySelector<HTMLElement>(".rr-progress");
    indicator = document.querySelector<HTMLElement>(".rr-progress__indicator");
    expect(progress?.getAttribute("aria-valuenow")).toBe("80");
    expect(indicator?.style.width).toBe("80%");

    rerender(<Progress label="Upload" indeterminate />);
    progress = document.querySelector<HTMLElement>(".rr-progress");
    expect(progress?.hasAttribute("aria-valuenow")).toBe(false);
    expect(progress?.className).toContain("rr-progress--indeterminate");
  });

  it("forwards the ref to the progressbar root", () => {
    const ref: { current: HTMLDivElement | null } = { current: null };
    mount(
      <Progress
        label="Upload"
        value={10}
        ref={(node) => {
          ref.current = node;
        }}
      />,
    );

    expect(ref.current).toBe(document.querySelector(".rr-progress"));
    expect(ref.current?.getAttribute("role")).toBe("progressbar");
  });

  it("is a genuine forwardRef with a stable displayName", () => {
    expect(Progress.$$typeof).toBe(Symbol.for("react.forward_ref"));
    expect(Progress.displayName).toBe("Progress");
  });
});
