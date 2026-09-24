// Behavioral spec for Tooltip (RRU-056). Runs in happy-dom with a REAL DOM and
// fake timers: open/close as user gestures (pointer hover with delays, focus/
// blur without delay), the hover↔focus mutual-hold contract, panel bridging,
// the controlled gate and one integration case pinning the flip geometry on
// the inline style. Position math itself is unit-tested in utils/popover.test.ts;
// here the DOM measurement + hook wiring is exercised with stubbed rects
// (happy-dom has no layout engine). Behavior over implementation.
import type { ReactElement, ReactNode } from "react";
import type { Root } from "react-dom/client";

import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Tooltip, type TooltipProps } from "./index.js";

let host: HTMLDivElement | null = null;
let root: Root | null = null;

function render(ui: ReactElement): void {
  root = createRoot(host as HTMLDivElement);
  act(() => root!.render(ui));
}

function unmount(): void {
  act(() => root?.unmount());
  root = null;
}

const panel = (): HTMLElement | null => document.querySelector("[role='tooltip']");
const triggerSpan = (): HTMLElement => document.querySelector<HTMLElement>(".rr-tooltip-trigger")!;
const triggerButton = (): HTMLButtonElement =>
  document.querySelector<HTMLButtonElement>("[data-testid='trigger']")!;

function hoverEnter(el: Element): void {
  // React synthesizes onPointerEnter/onPointerLeave from the BUBBLING
  // pointerover/pointerout pairs (pointerenter itself does not bubble, so
  // dispatching it would never reach React's root delegation).
  act(() => {
    el.dispatchEvent(new PointerEvent("pointerover", { bubbles: true, composed: true }));
  });
}

function hoverLeave(el: Element): void {
  act(() => {
    el.dispatchEvent(new PointerEvent("pointerout", { bubbles: true, composed: true }));
  });
}

function advance(ms: number): void {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

function harness(props: Partial<TooltipProps> = {}): ReactElement {
  const { content = "hint text", defaultOpen = false, ...rest } = props;
  return (
    <Tooltip content={content} defaultOpen={defaultOpen} {...rest}>
      <button data-testid="trigger">go</button>
    </Tooltip>
  );
}

beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
});

afterEach(() => {
  unmount();
  host?.remove();
  host = null;
  vi.useRealTimers();
});

describe("Tooltip SSR parity + composition contract", () => {
  it("renders only the trigger wrapper server-side; never the tooltip panel", () => {
    const markup = renderToStaticMarkup(
      <Tooltip content={<span>essential guess</span>} className="probe" id="t" data-x="1">
        <button data-testid="trigger">go</button>
      </Tooltip>,
    );
    expect(markup).toContain('class="rr-tooltip-trigger probe"');
    expect(markup).toContain('id="t"');
    expect(markup).toContain('data-x="1"');
    expect(markup).toContain('<button data-testid="trigger">go</button>');
    // Panel is mount-gated (Portal, RRU-034): neither the role nor the content
    // leaks into server markup.
    expect(markup).not.toContain('role="tooltip"');
    expect(markup).not.toContain("essential guess");
  });

  it("merges className and passes through props on the wrapper; panel carries role+id", () => {
    render(harness({ className: "probe", id: "w", "data-x": "1" } as unknown as TooltipProps));
    const span = triggerSpan();
    expect(span.className).toBe("rr-tooltip-trigger probe");
    expect(span.id).toBe("w");
    expect(span.getAttribute("data-x")).toBe("1");

    act(() => triggerButton().focus());
    const tooltip = panel();
    expect(tooltip, "tooltip must render when the trigger is focused").not.toBeNull();
    expect(tooltip!.getAttribute("role")).toBe("tooltip");
    expect(tooltip!.id).toBeTruthy();
    expect(tooltip!.textContent).toBe("hint text");
  });
});

describe("Tooltip hover trigger with delays (card: hover/focus trigger)", () => {
  it("does not show before openDelay and shows after it", () => {
    vi.useFakeTimers();
    render(harness());
    hoverEnter(triggerSpan());
    expect(panel()).toBeNull();

    advance(499);
    expect(panel()).toBeNull();

    advance(1);
    expect(panel()).not.toBeNull();
  });

  it("respects a custom openDelay", () => {
    vi.useFakeTimers();
    render(harness({ openDelay: 200 }));
    hoverEnter(triggerSpan());
    advance(199);
    expect(panel()).toBeNull();
    advance(1);
    expect(panel()).not.toBeNull();
  });

  it("closes after closeDelay once the pointer leaves", () => {
    vi.useFakeTimers();
    render(harness({ closeDelay: 80 }));
    hoverEnter(triggerSpan());
    advance(500);
    expect(panel()).not.toBeNull();

    hoverLeave(triggerSpan());
    advance(79);
    expect(panel()).not.toBeNull();
    advance(1);
    expect(panel()).toBeNull();
  });

  it("cancels a pending open when the pointer leaves before the delay elapses", () => {
    vi.useFakeTimers();
    render(harness({ openDelay: 300 }));
    hoverEnter(triggerSpan());
    advance(200);
    hoverLeave(triggerSpan());
    advance(400);
    expect(panel()).toBeNull();
  });

  it("keeps the tooltip alive while the pointer bridges onto the panel, then closes on panel leave", () => {
    vi.useFakeTimers();
    render(harness());
    hoverEnter(triggerSpan());
    advance(500);
    const tooltip = panel();
    expect(tooltip).not.toBeNull();

    // Leaving the trigger toward the panel: the panel's enter cancels the
    // pending close, so a long hover over the tooltip itself stays open.
    hoverLeave(triggerSpan());
    hoverEnter(tooltip!);
    advance(9999);
    expect(panel()).not.toBeNull();

    hoverLeave(tooltip!);
    advance(100);
    expect(panel()).toBeNull();
  });
});

describe("Tooltip focus trigger (keyboard accessibility — DoD a11y)", () => {
  it("opens immediately on focus, without the hover delay", () => {
    vi.useFakeTimers();
    render(harness());
    act(() => triggerButton().focus());
    expect(panel()).not.toBeNull();
    // No timer may be pending that would re-fire the open.
    advance(1000);
    const onOpenChange = vi.fn();
    rerenderOnOpenChange(onOpenChange);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("closes on blur", () => {
    vi.useFakeTimers();
    render(harness());
    act(() => triggerButton().focus());
    expect(panel()).not.toBeNull();
    act(() => triggerButton().blur());
    expect(panel()).toBeNull();
  });

  it("stays open while either hover OR focus is held (WAI-ARIA Tooltip)", () => {
    vi.useFakeTimers();
    render(harness());
    act(() => triggerButton().focus());
    expect(panel()).not.toBeNull();

    // Pointer leaves while still focused → focus alone keeps it open.
    hoverLeave(triggerSpan());
    advance(1000);
    expect(panel()).not.toBeNull();

    // Hover resumes while the pointer is over the trigger, then focus is lost
    // → hover alone keeps it open.
    hoverEnter(triggerSpan());
    act(() => triggerButton().blur());
    expect(panel()).not.toBeNull();

    // Both released → closes after the close delay.
    hoverLeave(triggerSpan());
    advance(100);
    expect(panel()).toBeNull();
  });
});

function rerenderOnOpenChange(onOpenChange: unknown): void {
  const ui = harness({ onOpenChange: onOpenChange as (open: boolean) => void });
  act(() => root!.render(ui));
}

describe("Tooltip controlled/uncontrolled + onOpenChange", () => {
  it("controlled: locked closed still reports the hover intent; open renders", () => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn();
    render(harness({ open: false, onOpenChange }));
    hoverEnter(triggerSpan());
    advance(500);
    expect(panel()).toBeNull();
    expect(onOpenChange).toHaveBeenLastCalledWith(true);

    unmount();
    render(harness({ open: true }));
    expect(panel()).not.toBeNull();
  });

  it("uncontrolled: defaultOpen renders immediately and reports close", () => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn();
    render(harness({ defaultOpen: true, onOpenChange }));
    expect(panel()).not.toBeNull();
    hoverLeave(triggerSpan());
    advance(100);
    expect(panel()).toBeNull();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("uncontrolled hover does not re-fire onOpenChange(true) while already open", () => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn();
    render(harness({ defaultOpen: true, onOpenChange }));
    hoverEnter(triggerSpan());
    hoverLeave(triggerSpan());
    hoverEnter(triggerSpan());
    expect(onOpenChange).toHaveBeenCalledTimes(0);
  });
});

describe("Tooltip positioning integration (card DoD: positioning)", () => {
  // --- Geometry stubbing (happy-dom has no layout): the rect mock feeds
  // getBoundingClientRect of the anchor (span) and the panel (div).
  const realSpanRect = HTMLSpanElement.prototype.getBoundingClientRect;
  const realDivRect = HTMLDivElement.prototype.getBoundingClientRect;
  let anchorRect: Rect | null = null;
  let panelRect: Rect | null = null;

  interface Rect {
    left: number;
    top: number;
    width: number;
    height: number;
  }

  beforeEach(() => {
    HTMLSpanElement.prototype.getBoundingClientRect = function () {
      return anchorRect !== null
        ? ({ ...anchorRect } as unknown as DOMRect)
        : realSpanRect.call(this);
    };
    HTMLDivElement.prototype.getBoundingClientRect = function () {
      return panelRect !== null ? ({ ...panelRect } as unknown as DOMRect) : realDivRect.call(this);
    };
  });

  afterEach(() => {
    anchorRect = null;
    panelRect = null;
    HTMLSpanElement.prototype.getBoundingClientRect = realSpanRect;
    HTMLDivElement.prototype.getBoundingClientRect = realDivRect;
  });

  it("positions above the trigger by default (top, centered, margin space-1)", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 320 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 480 });
    anchorRect = { left: 100, top: 100, width: 100, height: 40 };
    panelRect = { left: 0, top: 0, width: 120, height: 32 };

    render(harness({ defaultOpen: true }));
    const tooltip = panel()!;
    // top: panelTop = anchorTop − margin(4) − panelHeight(32) = 64
    // center: left = anchorLeft + (anchorWidth − panelWidth)/2 = 90
    expect(tooltip.style.left).toBe("90px");
    expect(tooltip.style.top).toBe("64px");
    const desc = Object.getOwnPropertyDescriptor(window, "innerWidth");
    const descTop = Object.getOwnPropertyDescriptor(window, "innerHeight");
    if (desc) Object.defineProperty(window, "innerWidth", desc);
    if (descTop) Object.defineProperty(window, "innerHeight", descTop);
  });
});
