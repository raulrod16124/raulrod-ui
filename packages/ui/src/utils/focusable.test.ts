// Unit spec for the internal focusable-element helpers (RRU-052). Pure DOM
// introspection: no React, no rendering. Behavior over implementation: we
// assert the TAB-ORDER contract (what the browser would tab through), not how
// the selector is written.
import { describe, expect, it } from "vitest";

import { getFocusableElements, isFocusableElement } from "./focusable.js";

function render(html: string): HTMLElement {
  const host = document.createElement("div");
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
