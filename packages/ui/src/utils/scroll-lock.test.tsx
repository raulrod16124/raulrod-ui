// Behavioral spec for useScrollLock (RRU-052, DoD #2): locks body scroll while
// active, preserves the original overflow, and reference-counts so stacked
// overlays release in the correct order. Runs in happy-dom (real style API).
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useScrollLock } from "./scroll-lock.js";

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
  document.body.style.overflow = "";
});

describe("useScrollLock", () => {
  it("locks body overflow while active and restores the original value after", () => {
    document.body.style.overflow = "auto";

    const { unmount } = render(<Lock />);
    expect(document.body.style.overflow).toBe("hidden");

    unmount();
    expect(document.body.style.overflow).toBe("auto");
  });

  it("reference-counts: the lock is released only when the LAST overlay unmounts", () => {
    const { rerender } = render(<TwoLocks active />);
    expect(document.body.style.overflow).toBe("hidden");

    // Remove the second overlay: body must STAY locked (first overlay open).
    rerender(<TwoLocks active={false} />);
    expect(document.body.style.overflow).toBe("hidden");

    // Remove the last overlay too: lock released to the original value.
    rerender(<div />);
    expect(document.body.style.overflow).toBe("");
  });

  it("unlocks when active flips to false (element stays mounted)", () => {
    const { rerender } = render(<ToggleLock active />);
    expect(document.body.style.overflow).toBe("hidden");

    rerender(<ToggleLock active={false} />);
    expect(document.body.style.overflow).toBe("");
  });
});
