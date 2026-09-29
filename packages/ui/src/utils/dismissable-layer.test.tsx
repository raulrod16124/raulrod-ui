// Behavioral spec for useDismissableLayer (RRU-052, DoD #2): Escape and outside
// pointer interaction dismiss only the TOPMOST active layer. Runs in happy-dom
// with real DOM events. Behavior over implementation.
import { fireEvent, render, screen } from "@testing-library/react";
import { useRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";

import {
  getActiveLayerNodesInContext,
  getTopmostModalScopeNodes,
  popModalContext,
  pushModalContext,
  useDismissableLayer,
} from "./dismissable-layer.js";

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

  it("one Escape closes exactly one level of a stacked overlay", () => {
    const onEscapeTop = vi.fn();
    const onEscapeBottom = vi.fn();

    function StackedLayers() {
      const [topOpen, setTopOpen] = useState(true);
      return (
        <div>
          <Layer id="bottom" active onEscape={onEscapeBottom} />
          {topOpen && (
            <Layer
              id="top"
              active
              onEscape={() => {
                setTopOpen(false);
                onEscapeTop();
              }}
            />
          )}
        </div>
      );
    }

    render(<StackedLayers />);

    // A single Escape dismisses only the topmost active layer.
    pressEscape();
    expect(onEscapeTop).toHaveBeenCalledTimes(1);
    expect(onEscapeBottom).not.toHaveBeenCalled();

    // After the top layer closes, the next Escape reaches the remaining layer.
    pressEscape();
    expect(onEscapeBottom).toHaveBeenCalledTimes(1);
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

describe("modal contexts (RRU-116)", () => {
  const testIds = (nodes: HTMLElement[]): string[] =>
    nodes.map((node) => node.getAttribute("data-testid") ?? "");

  /** `pushModalContext` needs the trapped container node (RRU-117): a real,
   *  connected element the modal owns. Rendered here so the scope rebuild the
   *  registry does has something to query against. */
  const renderModalContainer = (testId: string): HTMLElement => {
    render(
      <div data-testid={testId}>
        <button>inside</button>
      </div>,
    );
    return screen.getByTestId(testId) as HTMLElement;
  };

  it("a layer records the modal context that was topmost when it activated", () => {
    const modal = renderModalContainer("modal-a");
    const ctx = pushModalContext(modal);
    try {
      render(<Layer id="under-a" active />);
      expect(testIds(getActiveLayerNodesInContext(ctx))).toEqual(["under-a"]);
    } finally {
      popModalContext(ctx);
    }
  });

  it("nested contexts stay isolated: a top layer is not part of the outer trap's scope", () => {
    // Modal A open: a layer opened from it belongs to A.
    const modalA = renderModalContainer("modal-a");
    const ctxA = pushModalContext(modalA);
    let ctxB: symbol | undefined;
    try {
      render(<Layer id="belongs-to-a" active />);
      // Modal B stacks on top: a layer opened now belongs to B, NOT to A —
      // otherwise A's focus trap would capture B's focusables (stacked-modals
      // regression RRU-116 guards against).
      const modalB = renderModalContainer("modal-b");
      ctxB = pushModalContext(modalB);
      render(<Layer id="belongs-to-b" active />);

      expect(testIds(getActiveLayerNodesInContext(ctxA))).toEqual(["belongs-to-a"]);
      expect(testIds(getActiveLayerNodesInContext(ctxB))).toEqual(["belongs-to-b"]);
    } finally {
      if (ctxB !== undefined) popModalContext(ctxB);
      popModalContext(ctxA);
    }
  });

  it("closing the overlay removes its node from the trap's scope", () => {
    const modal = renderModalContainer("modal-a");
    const ctx = pushModalContext(modal);
    try {
      const { unmount } = render(<Layer id="inner" active />);
      expect(testIds(getActiveLayerNodesInContext(ctx))).toEqual(["inner"]);
      expect(testIds(getTopmostModalScopeNodes())).toContain("inner");

      // Unmounting = the overlay closed: its panel leaves the scope, exactly as
      // it would when the portal unmounts alongside the trap.
      unmount();
      expect(getActiveLayerNodesInContext(ctx)).toEqual([]);
      expect(testIds(getTopmostModalScopeNodes())).toEqual(["modal-a"]);
    } finally {
      popModalContext(ctx);
    }
  });

  it("a layer that opens with no modal up belongs to no trap scope", () => {
    render(<Layer id="floating" active />);
    const modal = renderModalContainer("modal-a");
    const ctx = pushModalContext(modal);
    expect(getActiveLayerNodesInContext(ctx)).toEqual([]);
    popModalContext(ctx);
  });
});

describe("topmost modal scope (RRU-117)", () => {
  const ids = (nodes: HTMLElement[]): string[] =>
    nodes.map((node) => node.getAttribute("data-testid") ?? "");

  it("the topmost scope is the trap's container plus the layers that opened under it", () => {
    const modal = (testId: string): HTMLElement => {
      render(<div data-testid={testId} />);
      return screen.getByTestId(testId) as HTMLElement;
    };
    const ctx = pushModalContext(modal("trap"));
    try {
      render(<Layer id="inner" active />);
      const scope = ids(getTopmostModalScopeNodes());
      expect(scope).toEqual(["trap", "inner"]);
    } finally {
      popModalContext(ctx);
    }
  });

  it("only the TOPMOST context's nodes form the scope; stacked modals stay isolated", () => {
    const modal = (testId: string): HTMLElement => {
      render(<div data-testid={testId} />);
      return screen.getByTestId(testId) as HTMLElement;
    };
    const ctxA = pushModalContext(modal("dialog-a"));
    try {
      render(<Layer id="opened-under-a" active />);
      const ctxB = pushModalContext(modal("dialog-b"));
      try {
        render(<Layer id="opened-under-b" active />);
        expect(ids(getTopmostModalScopeNodes())).toEqual(["dialog-b", "opened-under-b"]);
      } finally {
        popModalContext(ctxB);
      }
    } finally {
      popModalContext(ctxA);
    }
  });

  it("is empty when no trap is active, and a detached container counts as absent", () => {
    expect(getTopmostModalScopeNodes()).toEqual([]);

    // A modal that is CLOSING has a detached/absent container: it must not be
    // treated as a scope, or focus restoration would "land inside" a modal that
    // is already gone (RRU-117 ordering: the closing trap pops its context).
    const detached = document.createElement("div");
    detached.setAttribute("data-testid", "detached-modal");
    const ctx = pushModalContext(detached);
    try {
      expect(getTopmostModalScopeNodes()).toEqual([]);
    } finally {
      popModalContext(ctx);
    }
  });
});
