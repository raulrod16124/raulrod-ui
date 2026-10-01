import type { ProfilerOnRenderCallback } from "react";

import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Profiler, useState } from "react";
import { describe, expect, it } from "vitest";

import { Tooltip } from "./Tooltip";

function count() {
  const renders: Record<string, number> = {};
  const onRender =
    (id: string): ProfilerOnRenderCallback =>
    () => {
      renders[id] = (renders[id] ?? 0) + 1;
    };
  return { renders: renders, onRender: onRender } as const;
}

describe("Tooltip render budgets (RRU-101)", () => {
  it("mount: renders of root subtree = 1", async () => {
    const { renders, onRender } = count();
    render(
      <Profiler id="tip-mount" onRender={onRender("tip-mount")}>
        <Tooltip content="Hello">
          <button data-testid="t">Hover me</button>
        </Tooltip>
      </Profiler>,
    );
    expect(renders["tip-mount"] ?? 0).toBe(1);
  });

  it("open/close: renders <= 3", async () => {
    const { renders, onRender } = count();
    render(
      <Profiler id="tip" onRender={onRender("tip")}>
        <Tooltip content="Hello">
          <button data-testid="t">Hover me</button>
        </Tooltip>
      </Profiler>,
    );
    const t = screen.getByTestId("t");
    await act(async () => {
      await userEvent.hover(t);
    });
    await act(async () => {
      await userEvent.unhover(t);
    });
    const r = renders.tip ?? 0;
    expect(r).toBeGreaterThanOrEqual(1);
    expect(r).toBeLessThanOrEqual(3);
  });

  it("parent re-render with referentially stable children: no additional renders", async () => {
    const { renders, onRender } = count();
    // Both the tooltip tree and its Profiler wrapper are hoisted, so React can
    // bail out at the wrapper and every reported commit is real tooltip work.
    const tree = (
      <Tooltip content="Hello">
        <button>Hover</button>
      </Tooltip>
    );
    const profiled = (
      <Profiler id="p" onRender={onRender("p")}>
        {tree}
      </Profiler>
    );
    function App() {
      const [tick, setTick] = useState(0);
      return (
        <>
          <button data-testid="tick" onClick={() => setTick((x) => x + 1)}>
            tick
          </button>
          {profiled}
        </>
      );
    }
    render(<App />);
    const base = renders.p ?? 0;
    await act(async () => {
      await userEvent.click(screen.getByTestId("tick"));
    });
    const after = renders.p ?? 0;
    expect(after).toBe(base);
  });

  it("scroll and resize do not render the tooltip subtree (imperative positioning)", async () => {
    const { renders, onRender } = count();
    render(
      <Profiler id="tip-overflow" onRender={onRender("tip-overflow")}>
        <Tooltip content="Hello" open>
          <button data-testid="t">Hover me</button>
        </Tooltip>
      </Profiler>,
    );
    const mounted = renders["tip-overflow"] ?? 0;
    await act(async () => {
      for (let i = 0; i < 10; i++) {
        window.dispatchEvent(new Event("scroll"));
        window.dispatchEvent(new Event("resize"));
      }
    });
    const after = renders["tip-overflow"] ?? 0;
    expect(after).toBe(mounted);
  });
});
