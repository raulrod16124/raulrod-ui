// Behavioral spec for useScrollLock (RRU-052, DoD #2): locks body scroll while
// active, preserves the original overflow, and reference-counts so stacked
// overlays release in the correct order. Runs in happy-dom (real style API).
import type { ReactElement } from "react";
import type { Root } from "react-dom/client";

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { useScrollLock } from "./scroll-lock.js";

let host: HTMLDivElement | null = null;
let root: Root | null = null;

function render(ui: ReactElement): void {
  root = createRoot(host as HTMLDivElement);
  act(() => root!.render(ui));
}

function rerender(ui: ReactElement): void {
  act(() => root!.render(ui));
}

function unmount(): void {
  act(() => root!.unmount());
  root = null;
}

function Lock({ id = "lock" }: { id?: string }) {
  useScrollLock({ active: true });
  return <span data-testid={id}>lock</span>;
}

function ToggleLock({ active }: { active: boolean }) {
  useScrollLock({ active });
  return <span data-testid="toggle">toggle</span>;
}

function TwoLocks({ active = true }: { active?: boolean }) {
  return (
    <>
      <Lock id="lock-a" />
      {active ? <Lock id="lock-b" /> : null}
    </>
  );
}

beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
  document.body.style.overflow = "";
});

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  host?.remove();
  host = null;
});

describe("useScrollLock", () => {
  it("locks body overflow while active and restores the original value after", () => {
    document.body.style.overflow = "auto";
    render(<Lock />);
    expect(document.body.style.overflow).toBe("hidden");

    unmount();
    expect(document.body.style.overflow).toBe("auto");
  });

  it("reference-counts: the lock is released only when the LAST overlay unmounts", () => {
    render(<TwoLocks active />);
    expect(document.body.style.overflow).toBe("hidden");

    // Remove the second overlay: body must STAY locked (first overlay open).
    rerender(<TwoLocks active={false} />);
    expect(document.body.style.overflow).toBe("hidden");

    // Remove the last overlay too: lock released to the original value.
    rerender(<div />);
    expect(document.body.style.overflow).toBe("");
  });

  it("unlocks when active flips to false (element stays mounted)", () => {
    render(<ToggleLock active />);
    expect(document.body.style.overflow).toBe("hidden");

    rerender(<ToggleLock active={false} />);
    expect(document.body.style.overflow).toBe("");
  });
});
