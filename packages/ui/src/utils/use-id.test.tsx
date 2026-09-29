// `useId` / `sanitizeId` (RRU-030) as a tracked spec. The old check could only
// assert the pure `sanitizeId` helper and that `useId` was exported — its render
// behavior was "validated by typecheck + review" because there was no renderer.
// With RTL the observable behavior IS assertable: ids must be usable in
// `htmlFor`/`aria-describedby`, unique per instance, stable across rerenders and
// identical between the server and the client (no hydration mismatch).
import type { ReactElement } from "react";

import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { sanitizeId, useId } from "./use-id.js";

describe("sanitizeId (pure)", () => {
  it.each([
    { input: ":r0:", expected: "r0" },
    { input: ":R1:", expected: "R1" },
    { input: "abc", expected: "abc" },
    { input: ":r5:", expected: "r5" },
  ])("strips React's colons: $input -> $expected", ({ input, expected }) => {
    expect(sanitizeId(input)).toBe(expected);
  });

  it("never collapses two distinct fragments into the same id", () => {
    expect(sanitizeId(":r0:")).not.toBe(sanitizeId(":r1:"));
  });

  it("leaves an already-clean fragment untouched", () => {
    expect(sanitizeId("rr-field-1")).toBe("rr-field-1");
  });
});

describe("useId (public hook)", () => {
  it("is exported from the public entry point", async () => {
    const index = await import("../index.js");

    expect(typeof index.useId).toBe("function");
  });

  it("namespaces the fragment under the rr prefix by default", () => {
    function Probe(): ReactElement {
      return <span data-testid="probe" data-id={useId()} />;
    }

    render(<Probe />);

    const id = screen.getByTestId("probe").dataset.id ?? "";

    expect(id).toMatch(/^rr-/);
    // whatever React's raw fragment looks like, the public id must be selector-safe
    expect(id).not.toContain(":");
  });

  it("honors a caller-provided prefix", () => {
    function Probe(): ReactElement {
      return <span data-testid="probe" data-id={useId("invoice")} />;
    }

    render(<Probe />);

    const id = screen.getByTestId("probe").dataset.id ?? "";

    expect(id).toMatch(/^invoice-/);
    expect(id).not.toContain(":");
  });

  it("is unique per instance — two fields never share a label target", () => {
    function Pair(): ReactElement {
      const first = useId();
      const second = useId();

      return (
        <>
          <label htmlFor={first}>First</label>
          <input id={first} />
          <label htmlFor={second}>Second</label>
          <input id={second} />
        </>
      );
    }

    render(<Pair />);

    const [first, second] = screen.getAllByRole("textbox") as HTMLInputElement[];
    expect(first?.id).not.toBe("");
    expect(second?.id).not.toBe(first?.id);
    expect(screen.getByLabelText("First")).toBe(first);
    expect(screen.getByLabelText("Second")).toBe(second);
  });

  it("is stable across rerenders (the wired relationship survives a value change)", () => {
    function Field({ value }: { value: string }): ReactElement {
      const id = useId();

      return (
        <>
          <label htmlFor={id}>Name</label>
          <input id={id} value={value} readOnly />
        </>
      );
    }

    const { rerender } = render(<Field value="Ada" />);
    const before = screen.getByLabelText("Name").id;

    rerender(<Field value="Grace" />);

    expect(screen.getByLabelText("Name").id).toBe(before);
    expect(screen.getByLabelText("Name")).toHaveValue("Grace");
  });

  it("serializes the same id on the server and the client (SSR-safe, no mismatch)", () => {
    function Field(): ReactElement {
      const id = useId();

      return <input id={id} aria-describedby={id} />;
    }

    const serverId = /id="([^"]+)"/.exec(renderToStaticMarkup(<Field />))?.[1] ?? "";

    expect(serverId).toMatch(/^rr-/);

    render(<Field />);

    const clientId = screen.getByRole("textbox").id;

    expect(clientId).toMatch(/^rr-/);
    expect(clientId).not.toContain(":"); // sanitized: safe in selectors and CSS
  });
});
