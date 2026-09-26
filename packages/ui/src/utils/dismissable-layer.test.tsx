// Behavioral spec for useDismissableLayer (RRU-052, DoD #2): Escape and outside
// pointer interaction dismiss only the TOPMOST active layer. Runs in happy-dom
// with real DOM events. Behavior over implementation.
import { fireEvent, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it, vi } from "vitest";

import { useDismissableLayer } from "./dismissable-layer.js";

/** Structural stand-in for `RefObject<HTMLElement | null>` (React 19 types
 *  keep it to `{ current: T }`) so the test stays import-light. */
type MutableRefLike<T> = { current: T | null };

function pressEscape(): void {
  fireEvent.keyDown(document, { key: "Escape" });
}

function pointerDownOutside(): void {
  fireEvent.pointerDown(screen.getByTestId("outside"));
}

function pointerDownOnLayer(testId: string): void {
  fireEvent.pointerDown(screen.getByTestId(testId));
}

interface LayerProps {
  id: string;
  active: boolean;
  onEscape?: () => void;
  onPointerDownOutside?: (event: Event) => void;
  extraInsideRefs?: Array<MutableRefLike<HTMLElement>>;
}

function Layer({ id, active, onEscape, onPointerDownOutside, extraInsideRefs }: LayerProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  useDismissableLayer({ nodeRef, active, onEscape, onPointerDownOutside, extraInsideRefs });
  return (
    <div data-testid={id} ref={nodeRef}>
      layer content
    </div>
  );
}

/** Layer wired the way Popover wires it: an extra "inside" ref pointing at a
 *  sibling node (the trigger) that lives OUTSIDE the layer's own subtree. */
function LayerWithExtra({
  extraRef,
  active,
  onEscape,
  onPointerDownOutside,
}: {
  extraRef: MutableRefLike<HTMLElement>;
  active: boolean;
  onEscape?: () => void;
  onPointerDownOutside?: (event: Event) => void;
}) {
  const nodeRef = useRef<HTMLDivElement>(null);
  useDismissableLayer({
    nodeRef,
    extraInsideRefs: [extraRef],
    active,
    onEscape,
    onPointerDownOutside,
  });
  return (
    <div data-testid="layer" ref={nodeRef}>
      layer content
    </div>
  );
}

describe("useDismissableLayer", () => {
  it("dismisses on Escape only while active", () => {
    const onEscape = vi.fn();
    const { unmount } = render(<Layer id="layer" active={false} onEscape={onEscape} />);

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

  it("treats nodes in extraInsideRefs as inside (RRU-054 popover trigger)", () => {
    const onEscape = vi.fn();
    const onOutside = vi.fn();
    const extraRef: MutableRefLike<HTMLElement> = { current: null };

    render(
      <div>
        <button data-testid="outside">outside</button>
        <button
          data-testid="trigger"
          ref={(node) => {
            extraRef.current = node;
          }}
        >
          trigger
        </button>
        <LayerWithExtra
          extraRef={extraRef}
          active
          onEscape={onEscape}
          onPointerDownOutside={onOutside}
        />
      </div>,
    );

    // Pointer-down on the trigger (an extra-inside node, sibling of the layer)
    // must NOT count as outside.
    fireEvent.pointerDown(screen.getByTestId("trigger"));
    expect(onOutside).not.toHaveBeenCalled();

    // A genuine outside node still dismisses, and Escape still works.
    pointerDownOutside();
    expect(onOutside).toHaveBeenCalledTimes(1);

    pressEscape();
    expect(onEscape).toHaveBeenCalledTimes(1);
  });
});
