// Unit spec for the internal focusable-element helpers (RRU-052). Pure DOM
// introspection: no React, no rendering. Behavior over implementation: we
// assert the TAB-ORDER contract (what the browser would tab through), not how
// the selector is written.
import { describe, expect, it } from "vitest";

import {
  getFocusableElements,
  getFocusableElementsInDocumentOrder,
  isFocusableElement,
} from "./focusable.js";

function render(html: string): HTMLElement {
  const host = document.createElement("div");
  // The ONLY dangerous-API disable in the repo (RRU-102). This fixture needs
  // markup, and a test file is never published: `tsconfig.build.json` excludes
  // `*.test.*`, `*.stories.*` and `test-support/` from the emitted `dist`, so
  // nothing here can reach a consumer. Production sources carry no disable —
  // build the DOM node-by-node instead if this fixture ever needs to grow.
  // eslint-disable-next-line no-restricted-syntax -- test fixture, not shipped
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

describe("isFocusableElement", () => {
  it("accepts buttons/links/inputs and elements with tabindex >= 0", () => {
    const host = render(`
      <button id="btn"></button>
      <a id="link" href="#"></a>
      <input id="input">
      <div id="tab" tabindex="0"></div>
    `);
    for (const id of ["btn", "link", "input", "tab"]) {
      expect(isFocusableElement(host.querySelector(`#${id}`) as Element)).toBe(true);
    }
  });

  it("rejects tabindex=-1, disabled controls and invisible elements", () => {
    const host = render(`
      <button id="neg" tabindex="-1"></button>
      <button id="disabled" disabled></button>
      <button id="hidden" hidden></button>
      <button id="aria-hidden" aria-hidden="true"></button>
      <div id="plain"></div>
    `);
    for (const id of ["neg", "disabled", "hidden", "aria-hidden", "plain"]) {
      expect(isFocusableElement(host.querySelector(`#${id}`) as Element)).toBe(false);
    }
  });
});

describe("getFocusableElements", () => {
  it("returns focusable descendants in document order, skipping excluded ones", () => {
    const host = render(`
      <button id="b"></button>
      <button id="a"></button>
      <button id="skip" tabindex="-1"></button>
      <button id="gone" hidden></button>
      <input id="c">
    `);
    const ids = getFocusableElements(host).map((el) => el.id);
    expect(ids).toEqual(["b", "a", "c"]);
  });

  it("returns [] when nothing is focusable", () => {
    const host = render("<div><span>text</span><button hidden>x</button></div>");
    expect(getFocusableElements(host)).toEqual([]);
  });
});

describe("getFocusableElementsInDocumentOrder", () => {
  it("returns the document-order union of the roots, excluding the page behind", () => {
    const host = render(`
      <button id="page-behind"></button>
      <div id="trap">
        <button id="a"></button>
      </div>
      <div id="panel">
        <button id="b"></button>
      </div>
    `);
    const trap = host.querySelector("#trap") as ParentNode;
    const panel = host.querySelector("#panel") as ParentNode;

    // `page-behind` is FIRST in the tab order, but it belongs to no root: the
    // modal context is exactly the roots, so it must not leak into the cycle.
    const ids = getFocusableElementsInDocumentOrder([trap, panel]).map((el) => el.id);
    expect(ids).toEqual(["a", "b"]);
  });

  it("preserves document order across the roots (a portaled panel keeps its DOM position)", () => {
    const host = render(`
      <div id="panel-a">
        <button id="x"></button>
      </div>
      <div id="trap">
        <button id="y"></button>
      </div>
      <div id="panel-b">
        <button id="z"></button>
      </div>
    `);
    const trap = host.querySelector("#trap") as ParentNode;
    const panelA = host.querySelector("#panel-a") as ParentNode;
    const panelB = host.querySelector("#panel-b") as ParentNode;

    const ids = getFocusableElementsInDocumentOrder([trap, panelA, panelB]).map((el) => el.id);
    expect(ids).toEqual(["x", "y", "z"]);
  });

  it("returns [] when none of the roots contains a focusable", () => {
    const host = render(`
      <button id="page-behind"></button>
      <div id="empty"></div>
    `);
    const empty = host.querySelector("#empty") as ParentNode;
    expect(getFocusableElementsInDocumentOrder([empty])).toEqual([]);
  });
});
