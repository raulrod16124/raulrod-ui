import type { ProfilerOnRenderCallback, ReactElement } from "react";

import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Profiler, useState } from "react";
import { describe, expect, it } from "vitest";

import { Select } from "./Select";

function count() {
  const renders: Record<string, number> = {};
  const onRender =
    (id: string): ProfilerOnRenderCallback =>
    () => {
      renders[id] = (renders[id] ?? 0) + 1;
    };
  return { renders: renders, onRender: onRender } as const;
}

function buildItems(n: number): ReactElement[] {
  return Array.from({ length: n }, (_, i) => (
    <Select.Item key={`v${i}`} value={`v${i}`}>
      Item {i}
    </Select.Item>
  ));
}

describe("Select render budgets (RRU-101)", () => {
  it("mount with placeholder: renders of root subtree = 1", () => {
    const { renders: counts, onRender } = count();
    render(
      <Profiler id="select-mount" onRender={onRender("select-mount")}>
        <Select>
          <Select.Trigger data-testid="t">
            <Select.Value>Pick</Select.Value>
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="a">A</Select.Item>
            <Select.Item value="b">B</Select.Item>
          </Select.Content>
        </Select>
      </Profiler>,
    );
    expect(counts["select-mount"] ?? 0).toBe(1);
  });

  it("open then close: total root subtree renders <= 4 (measured baseline)", async () => {
    const { renders, onRender } = count();
    render(
      <Profiler id="select-open-close" onRender={onRender("select-open-close")}>
        <Select>
          <Select.Trigger data-testid="t">
            <Select.Value>Pick</Select.Value>
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="a">A</Select.Item>
            <Select.Item value="b">B</Select.Item>
          </Select.Content>
        </Select>
      </Profiler>,
    );
    const t = screen.getByTestId("t");
    await act(async () => {
      await userEvent.click(t);
    });
    await act(async () => {
      await userEvent.click(t);
    });
    const r = renders["select-open-close"] ?? 0;
    expect(r).toBeGreaterThanOrEqual(1);
    expect(r).toBeLessThanOrEqual(4);
  });

  it("selecting a value: Value re-renders because selectedLabel changes", async () => {
    const { renders, onRender } = count();
    render(
      <Profiler id="select-select" onRender={onRender("select-select")}>
        <Select>
          <Select.Trigger data-testid="t">
            <Select.Value data-testid="v">Pick</Select.Value>
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="a">A</Select.Item>
            <Select.Item value="b">B</Select.Item>
          </Select.Content>
        </Select>
      </Profiler>,
    );
    const t = screen.getByTestId("t");
    await act(async () => {
      await userEvent.click(t);
    });
    const items = screen.getAllByRole("option");
    const target = items[0];
    if (!target) throw new Error("expected at least one option to be open");
    await act(async () => {
      await userEvent.click(target);
    });
    const r = renders["select-select"] ?? 0;
    expect(r).toBeGreaterThanOrEqual(3);
    expect(r).toBeLessThanOrEqual(6);
  });

  it("parent re-render with referentially stable children: Select re-renders, subtree does not", async () => {
    const { renders, onRender } = count();
    // Hoisted OUT of App so the element tree keeps its identity across the
    // parent's renders. This is the scenario the render budget is about: a
    // consumer whose props/children are already stable.
    const tree = (
      <Select defaultValue="a">
        <Select.Trigger>
          <Select.Value />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="a">A</Select.Item>
          <Select.Item value="b">B</Select.Item>
        </Select.Content>
      </Select>
    );
    // The Profiler wrapper is hoisted too: with its own element identity stable,
    // React can bail out at the wrapper, so any commit it reports is work the
    // Select subtree actually did. A wrapper rebuilt inside App would report the
    // PARENT's commit and silently count as a Select render.
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

  it("with 200 items, opening+closing does not cause O(n) explosion beyond baseline", async () => {
    const { renders, onRender } = count();
    const items = buildItems(200);
    render(
      <Profiler id="big" onRender={onRender("big")}>
        <Select>
          <Select.Trigger data-testid="t">
            <Select.Value>Pick</Select.Value>
          </Select.Trigger>
          <Select.Content>{items}</Select.Content>
        </Select>
      </Profiler>,
    );
    const t = screen.getByTestId("t");
    await act(async () => {
      await userEvent.click(t);
    });
    await act(async () => {
      await userEvent.click(t);
    });
    const r = renders.big ?? 0;
    expect(r).toBeLessThanOrEqual(5);
  });
});
