// Behavioral spec for useFocusTrap (RRU-052, DoD #1). Runs in happy-dom with a
// REAL DOM: dispatch actual keydown events and assert focus movement through
// document.activeElement. Behavior over implementation.
import type { ReactElement } from "react";
import type { Root } from "react-dom/client";

import { act, useRef } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { useFocusTrap } from "./focus-trap.js";
import { getFocusableElements } from "./focusable.js";

let host: HTMLDivElement | null = null;
let root: Root | null = null;

function render(ui: ReactElement): void {
  root = createRoot(host as HTMLDivElement);
  act(() => root!.render(ui));
}

function unmount(): void {
  act(() => root!.unmount());
  root = null;
}

function pressTab(shiftKey: boolean): void {
  act(() => {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", shiftKey, bubbles: true }));
  });
}

function Trap({ active }: { active: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap({ container: containerRef, active });
  return (
    <div data-testid="trap" ref={containerRef}>
      <button data-testid="a">A</button>
      <button data-testid="b">B</button>
      <button data-testid="c" tabIndex={-1}>
        C (programmatic-only)
      </button>
      <input data-testid="d" />
    </div>
  );
}

function EmptyTrap({ active }: { active: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap({ container: containerRef, active });
  return (
    <div data-testid="emptytrap" ref={containerRef}>
      <span>no focusables here</span>
    </div>
  );
}

beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
});

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  host?.remove();
  host = null;
});

describe("useFocusTrap", () => {
  it("keeps Tab focus inside the container, cycling forward with wrap-around", () => {
    render(<Trap active />);
    const trap = document.querySelector<HTMLDivElement>("[data-testid='trap']")!;
    const a = document.querySelector<HTMLButtonElement>("[data-testid='a']")!;
    const b = document.querySelector<HTMLButtonElement>("[data-testid='b']")!;
    const d = document.querySelector<HTMLInputElement>("[data-testid='d']")!;

    // Sanity: the tab order skips the tabindex=-1 button (C).
    expect(getFocusableElements(trap).map((el) => el.dataset.testid)).toEqual(["a", "b", "d"]);

    act(() => a.focus());
    expect(document.activeElement).toBe(a);

    pressTab(false);
    expect(document.activeElement).toBe(b);

    pressTab(false);
    expect(document.activeElement).toBe(d);

    // d is the last tabbable element: Tab wraps to the first (a).
    pressTab(false);
    expect(document.activeElement).toBe(a);
  });

  it("wraps backwards with Shift+Tab", () => {
    render(<Trap active />);
    const a = document.querySelector<HTMLButtonElement>("[data-testid='a']")!;
    const b = document.querySelector<HTMLButtonElement>("[data-testid='b']")!;
    const d = document.querySelector<HTMLInputElement>("[data-testid='d']")!;

    act(() => a.focus());
    pressTab(true);
    // a is first tabbable: Shift+Tab wraps to the last tabbable (d).
    expect(document.activeElement).toBe(d);

    pressTab(true);
    expect(document.activeElement).toBe(b);
  });

  it("does not intercept Tab while inactive", () => {
    render(<Trap active={false} />);
    const a = document.querySelector<HTMLButtonElement>("[data-testid='a']")!;
    act(() => a.focus());
    pressTab(false);
    // No trap: our listener is gone, focus stays untouched.
    expect(document.activeElement).toBe(a);
  });

  it("swallows Tab when the container has no focusable descendants (cannot leak)", () => {
    render(<EmptyTrap active />);
    const span = document.querySelector("[data-testid='emptytrap'] span")!;
    act(() => (span as HTMLElement).focus());
    expect(document.activeElement).toBe(span);
    pressTab(false);
    expect(document.activeElement).toBe(span);
  });
});
