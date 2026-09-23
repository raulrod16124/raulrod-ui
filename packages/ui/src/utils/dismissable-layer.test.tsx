// Behavioral spec for useDismissableLayer (RRU-052, DoD #2): Escape and outside
// pointer interaction dismiss only the TOPMOST active layer. Runs in happy-dom
// with real DOM events. Behavior over implementation.
import type { ReactElement } from "react";
import type { Root } from "react-dom/client";

import { act, useRef } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDismissableLayer } from "./dismissable-layer.js";

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

function pressEscape(): void {
  act(() => {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  });
}

function pointerDownOutside(): void {
  const outside = document.querySelector<HTMLButtonElement>("[data-testid='outside']")!;
  act(() => {
    outside.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
  });
}

function pointerDownOnLayer(testId: string): void {
  const layer = document.querySelector<HTMLDivElement>(`[data-testid='${testId}']`)!;
  act(() => {
    layer.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
  });
}

interface LayerProps {
  id: string;
  active: boolean;
  onEscape?: () => void;
  onPointerDownOutside?: (event: Event) => void;
}

function Layer({ id, active, onEscape, onPointerDownOutside }: LayerProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  useDismissableLayer({ nodeRef, active, onEscape, onPointerDownOutside });
  return (
    <div data-testid={id} ref={nodeRef}>
      layer content
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

describe("useDismissableLayer", () => {
  it("dismisses on Escape only while active", () => {
    const onEscape = vi.fn();
    render(<Layer id="layer" active={false} onEscape={onEscape} />);

    pressEscape();
    expect(onEscape).not.toHaveBeenCalled();

    unmount();
    render(<Layer id="layer" active onEscape={onEscape} />);
    pressEscape();
    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it("dismisses on pointer interaction outside the layer, but not inside", () => {
    const onOutside = vi.fn();
    render(
      <div>
        <button data-testid="outside">outside</button>
        <Layer id="layer" active onPointerDownOutside={onOutside} />
      </div>,
    );

    pointerDownOutside();
    expect(onOutside).toHaveBeenCalledTimes(1);

    pointerDownOnLayer("layer");
    expect(onOutside).toHaveBeenCalledTimes(1);
  });

  it("with stacked layers, only the topmost dismisses on Escape and on outside click", () => {
    const onEscapeTop = vi.fn();
    const onEscapeBottom = vi.fn();
    const onOutsideTop = vi.fn();
    const onOutsideBottom = vi.fn();

    render(
      <div>
        <button data-testid="outside">outside</button>
        <Layer
          id="bottom"
          active
          onEscape={onEscapeBottom}
          onPointerDownOutside={onOutsideBottom}
        />
        <div data-testid="stacked">
          <Layer id="top" active onEscape={onEscapeTop} onPointerDownOutside={onOutsideTop} />
        </div>
      </div>,
    );

    pressEscape();
    expect(onEscapeTop).toHaveBeenCalledTimes(1);
    expect(onEscapeBottom).not.toHaveBeenCalled();

    pointerDownOutside();
    expect(onOutsideTop).toHaveBeenCalledTimes(1);
    expect(onOutsideBottom).not.toHaveBeenCalled();
  });

  it("with stacked layers, a pointer inside the topmost layer dismisses nothing", () => {
    const onOutsideTop = vi.fn();
    const onOutsideBottom = vi.fn();

    render(
      <div>
        <Layer id="bottom" active onPointerDownOutside={onOutsideBottom} />
        <div data-testid="stacked">
          <Layer id="top" active onPointerDownOutside={onOutsideTop} />
        </div>
      </div>,
    );

    pointerDownOnLayer("top");
    expect(onOutsideTop).not.toHaveBeenCalled();
    expect(onOutsideBottom).not.toHaveBeenCalled();
  });
});
