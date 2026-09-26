// Behavioral spec for useFocusReturn (RRU-052, DoD #1): focus returns to the
// element that had focus when the overlay activated — on deactivation and on
// unmount. Runs in happy-dom with real focus via document.activeElement.
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { useFocusReturn } from "./focus-return.js";

function Overlay({ active }: { active: boolean }) {
  useFocusReturn({ active });
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
