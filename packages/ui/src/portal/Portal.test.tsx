// Behavioral spec for the Portal primitive (RRU-034, tracked in RRU-068).
// Two guarantees, both behavioral:
//   1. SSR emits nothing and never throws (card DoD #2), so the first client
//      render matches the server output and hydration can only add the portal
//      afterwards in a client-only commit.
//   2. Container resolution (card DoD #1): `document.body` by default, a
//      caller-provided container wins — now exercised against a real DOM
//      instead of a stubbed global, so the React path is covered too.
import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { resolvePortalContainer } from "../utils/portal.js";

import { Portal } from "./index.js";

describe("Portal server rendering", () => {
  it("emits nothing, so hydration starts from identical markup", () => {
    expect(renderToStaticMarkup(<Portal>Hello</Portal>)).toBe("");
  });

  it("emits nothing even when a container is provided", () => {
    expect(renderToStaticMarkup(<Portal container={document.body}>Hello</Portal>)).toBe("");
  });

  it("emits nothing for an empty portal", () => {
    expect(renderToStaticMarkup(<Portal />)).toBe("");
  });
});

describe("Portal container resolution", () => {
  it("defaults to document.body, also for an explicit undefined", () => {
    expect(resolvePortalContainer()).toBe(document.body);
    expect(resolvePortalContainer(undefined)).toBe(document.body);
  });

  it("lets the container prop win over the body default", () => {
    const container = document.createElement("div");
    expect(resolvePortalContainer(container)).toBe(container);
    expect(resolvePortalContainer(document.body)).toBe(document.body);
  });
});

describe("Portal client rendering", () => {
  it("moves the children into document.body once mounted, leaving the render tree empty", () => {
    const { container } = render(<Portal>Portaled</Portal>);

    expect(document.body).toHaveTextContent("Portaled");
    expect(container).toBeEmptyDOMElement();
  });

  it("moves the children into the provided container", () => {
    const container = document.createElement("div");
    document.body.append(container);
    render(
      <Portal container={container}>
        <span>Inside</span>
      </Portal>,
    );

    const content = screen.getByText("Inside");
    expect(content.parentElement).toBe(container);
    expect(container.contains(content)).toBe(true);
  });

  it("renders no element of its own", () => {
    const { container } = render(<Portal>Only child</Portal>);

    expect(container).toBeEmptyDOMElement();
  });

  it("exposes a displayName for dev tooling", () => {
    expect(Portal.displayName).toBe("Portal");
  });
});
