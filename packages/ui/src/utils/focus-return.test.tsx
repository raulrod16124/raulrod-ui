// Behavioral spec for useFocusReturn (RRU-052, DoD #1): focus returns to the
// element that had focus when the overlay activated — on deactivation and on
// unmount. Runs in happy-dom with real focus via document.activeElement.
// RRU-117 extends the spec to the FALLBACK chain: when the captured element is
// gone or no longer focusable, the hook must land the focus on a real,
// predictable destination — never on the unfocusable `<body>`.
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef, useState } from "react";
import { beforeEach, describe, expect, it } from "vitest";

import { useFocusReturn, type FocusReturnOptions } from "./focus-return.js";

function Overlay({ active, fallbackRef }: FocusReturnOptions) {
  useFocusReturn({ active, fallbackRef });
  return (
    <div data-testid="panel" tabIndex={-1}>
      panel content
    </div>
  );
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

const trigger = () => screen.getByTestId("trigger");
const panel = () => screen.getByTestId("panel");

beforeEach(() => {
  document.body.focus();
});

describe("useFocusReturn", () => {
  it("restores focus to the trigger when the overlay deactivates", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Scenario mounted active={false} />);

    await user.click(trigger());
    expect(document.activeElement).toBe(trigger());

    // Activation captures the trigger (effect runs after the active=true commit).
    rerender(<Scenario mounted active />);
    await user.click(panel());
    expect(document.activeElement).toBe(panel());

    rerender(<Scenario mounted active={false} />);
    expect(document.activeElement).toBe(trigger());
  });

  it("restores focus on unmount while active", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Scenario mounted active={false} />);

    await user.click(trigger());
    // Activate AFTER focusing the trigger so the capture is the trigger.
    rerender(<Scenario mounted active />);
    await user.click(panel());
    expect(document.activeElement).toBe(panel());

    // Unmount only the overlay: trigger stays in the DOM and receives focus back.
    rerender(<Scenario mounted={false} active={false} />);
    expect(document.activeElement).toBe(trigger());
  });

  it("does not steal focus when the overlay never activated", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Scenario mounted active={false} />);

    await user.click(trigger());

    rerender(<Scenario mounted={false} active={false} />);
    expect(document.activeElement).toBe(trigger());
  });
});

describe("useFocusReturn fallback (RRU-117)", () => {
  it("restores to the overlay's own trigger when the captured element is gone", () => {
    const triggerRef = { current: null as HTMLButtonElement | null };

    function Scenario({ keepDisposable, active }: { keepDisposable: boolean; active: boolean }) {
      return (
        <div>
          <button data-testid="trigger" ref={triggerRef}>
            open overlay
          </button>
          {keepDisposable ? (
            <button data-testid="disposable">disposable focus holder</button>
          ) : null}
          {active ? <Overlay active={active} fallbackRef={triggerRef} /> : null}
        </div>
      );
    }

    const { rerender } = render(<Scenario keepDisposable active={false} />);

    // The open action removes BOTH the focused element and mounts the overlay
    // in the same commit — nothing restorable got captured (the trigger-gone
    // case: a dialog opened by something that unmounted itself).
    rerender(<Scenario keepDisposable={false} active />);
    expect(screen.queryByTestId("disposable")).toBeNull();

    rerender(<Scenario keepDisposable={false} active={false} />);
    expect(document.activeElement).not.toBe(document.body);
    expect(document.activeElement).toBe(screen.getByTestId("trigger"));
  });

  it("falls back to the first focusable of the document when nothing was captureable", () => {
    const page = (
      <div>
        <button data-testid="page-first">before the overlay</button>
        <Overlay active />
        <button data-testid="page-last">after the overlay</button>
      </div>
    );

    // Programmatic open: the overlay activates from mount with focus parked on
    // body — there is no captured element and no trigger.
    const { rerender } = render(page);
    expect(document.activeElement).toBe(document.body);

    rerender(
      <div>
        <button data-testid="page-first">before the overlay</button>
        <Overlay active={false} />
        <button data-testid="page-last">after the overlay</button>
      </div>,
    );
    expect(document.activeElement).not.toBe(document.body);
    expect(document.activeElement).toBe(screen.getByTestId("page-first"));
  });

  it("with nothing focusable anywhere, focus stays on the browser's parking spot", () => {
    function BareOverlay({ active }: { active: boolean }) {
      useFocusReturn({ active });
      return <span aria-hidden="true">content without a tab stop</span>;
    }

    const { rerender } = render(<BareOverlay active />);
    expect(document.activeElement).toBe(document.body);

    // No captured element, no trigger, zero focusables in the document: the
    // only honest outcome is to not move focus — `body.focus()` is a no-op and
    // the next Tab starts at the top of the document.
    rerender(<BareOverlay active={false} />);
    expect(document.activeElement).toBe(document.body);
  });
});
