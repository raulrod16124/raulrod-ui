// Behavioral spec for useFocusReturn (RRU-052, DoD #1): focus returns to the
// element that had focus when the overlay activated — on deactivation and on
// unmount. Runs in happy-dom with real focus via document.activeElement.
import type { ReactElement } from "react";
import type { Root } from "react-dom/client";

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { useFocusReturn } from "./focus-return.js";

let host: HTMLDivElement | null = null;
let root: Root | null = null;

function render(ui: ReactElement): void {
  root = createRoot(host as HTMLDivElement);
  act(() => root!.render(ui));
}

function rerender(ui: ReactElement): void {
  act(() => root!.render(ui));
}

function Overlay({ active }: { active: boolean }) {
  useFocusReturn({ active });
  return <div data-testid="panel">panel content</div>;
}

/** The trigger lives OUTSIDE the mountable overlay subtree so unmount tests
 *  can assert the trigger keeps focus (unmounting a focused node moves focus
 *  to body by browser semantics). */
function Scenario({ mounted, active }: { mounted: boolean; active: boolean }) {
  return (
    <div>
      <button data-testid="trigger">open overlay</button>
      {mounted ? <Overlay active={active} /> : null}
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

describe("useFocusReturn", () => {
  it("restores focus to the trigger when the overlay deactivates", () => {
    render(<Scenario mounted active={false} />);
    const trigger = document.querySelector<HTMLButtonElement>("[data-testid='trigger']")!;
    const panel = document.querySelector<HTMLDivElement>("[data-testid='panel']")!;

    act(() => trigger.focus());
    expect(document.activeElement).toBe(trigger);

    // Activation captures the trigger (effect runs after the active=true commit).
    rerender(<Scenario mounted active />);
    act(() => panel.focus());
    expect(document.activeElement).toBe(panel);

    rerender(<Scenario mounted active={false} />);
    expect(document.activeElement).toBe(trigger);
  });

  it("restores focus on unmount while active", () => {
    render(<Scenario mounted active={false} />);
    const trigger = document.querySelector<HTMLButtonElement>("[data-testid='trigger']")!;
    const panel = document.querySelector<HTMLDivElement>("[data-testid='panel']")!;

    act(() => trigger.focus());
    // Activate AFTER focusing the trigger so the capture is the trigger.
    rerender(<Scenario mounted active />);
    act(() => panel.focus());
    expect(document.activeElement).toBe(panel);

    // Unmount only the overlay: trigger stays in the DOM and receives focus back.
    rerender(<Scenario mounted={false} active={false} />);
    expect(document.activeElement).toBe(trigger);
  });

  it("does not steal focus when the overlay never activated", () => {
    render(<Scenario mounted active={false} />);
    const trigger = document.querySelector<HTMLButtonElement>("[data-testid='trigger']")!;
    act(() => trigger.focus());

    rerender(<Scenario mounted={false} active={false} />);
    expect(document.activeElement).toBe(trigger);
  });
});
