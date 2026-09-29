// Behavioral spec for Toast (RRU-059). Runs in happy-dom with a REAL DOM:
// role derivation (DoD #1), stacking, dismiss(id)/all, deadline-based
// auto-dismiss (DoD #2), hover/focus pause, Escape-with-focus and SSR parity.
// The provider + hook are exercised imperatively (a probe component captures
// the api), because the system STARTING STATE is always empty and toasts enter
// through user events/async flows — behavior over implementation.
import type { ToastApi } from "./Toast.types.js";
import type { ReactElement } from "react";

import { act, fireEvent, render } from "@testing-library/react";
import { useEffect } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ToastProvider, useToast } from "./index.js";

let api: ToastApi | null = null;

/** Captures the imperative api for driving the provider from the tests. The
 *  assignment happens in an EFFECT (never during render) — the api is a
 *  stable memoized object, so a single pass captures it. */
function ApiProbe() {
  const ctx = useToast();
  useEffect(() => {
    api = ctx;
  }, [ctx]);
  return null;
}

function pushToast(input: Parameters<ToastApi["toast"]>[0]): string {
  let id = "";
  act(() => {
    id = api!.toast(input);
  });
  return id;
}

const viewport = (): HTMLDivElement | null => document.querySelector(".rr-toast-viewport");
const toasts = (): HTMLElement[] => Array.from(document.querySelectorAll<HTMLElement>(".rr-toast"));

function pointerOver(): void {
  fireEvent.pointerOver(viewport() as Element);
}

function pointerOut(): void {
  fireEvent.pointerOut(viewport() as Element);
}

beforeEach(() => {
  api = null;
});

afterEach(() => {
  // the viewport + toasts are portal-mounted: RTL's cleanup unmounts the tree,
  // which takes the portal with it (no manual DOM surgery)
  api = null;
});

describe("live roles (DoD #1)", () => {
  it("derives ONE role per toast from the tone: status for info/success, alert for warning/destructive", () => {
    render(
      <ToastProvider>
        <ApiProbe />
      </ToastProvider>,
    );
    pushToast({ tone: "info", title: "Info" });
    pushToast({ tone: "success", title: "Ok" });
    pushToast({ tone: "warning", title: "Careful" });
    pushToast({ tone: "destructive", title: "Danger" });

    const list = toasts();
    expect(list).toHaveLength(4);
    // Newest first (stack order): destructive → warning → success → info.
    expect(list.map((t) => t.getAttribute("role"))).toEqual(["alert", "alert", "status", "status"]);
    // Exactly one role each, never an extra explicit aria-live (the role
    // implies the politeness; a redundant attribute is the "both at once" bug
    // the card forbids) and never aria-live on the shared viewport.
    for (const toast of list) {
      expect(toast.getAttribute("role")).toMatch(/^(status|alert)$/);
      expect(toast.hasAttribute("aria-live")).toBe(false);
    }
    expect(viewport()!.hasAttribute("aria-live")).toBe(false);
  });

  it("does not announce anything the user did NOT add: empty/children-only SSR", () => {
    expect(viewport()).toBeNull();
    expect(toasts()).toHaveLength(0);
  });
});

describe("stacking + imperatives", () => {
  it("stacks multiple toasts newest-first (top of the column) and preserves them", () => {
    render(
      <ToastProvider>
        <ApiProbe />
      </ToastProvider>,
    );
    pushToast({ title: "first" });
    pushToast({ title: "second" });

    const titles = Array.from(
      document.querySelectorAll<HTMLParagraphElement>(".rr-toast__title"),
    ).map((n) => n.textContent);
    expect(titles).toEqual(["second", "first"]);
  });

  it("dismiss(id) removes only that toast, firing its onDismiss", () => {
    render(
      <ToastProvider>
        <ApiProbe />
      </ToastProvider>,
    );
    const onA = vi.fn();
    const onB = vi.fn();
    const a = pushToast({ title: "A", onDismiss: onA });
    pushToast({ title: "B", onDismiss: onB });

    act(() => api!.dismiss(a));
    expect(toasts()).toHaveLength(1);
    expect(onA).toHaveBeenCalledTimes(1);
    expect(onB).not.toHaveBeenCalled();
    expect(toasts()[0]!.textContent).toContain("B");
  });

  it("dismissAll removes every toast and fires every onDismiss", () => {
    render(
      <ToastProvider>
        <ApiProbe />
      </ToastProvider>,
    );
    const onA = vi.fn();
    const onB = vi.fn();
    pushToast({ title: "A", onDismiss: onA });
    pushToast({ title: "B", onDismiss: onB });

    act(() => api!.dismissAll());
    expect(toasts()).toHaveLength(0);
    expect(onA).toHaveBeenCalledTimes(1);
    expect(onB).toHaveBeenCalledTimes(1);
  });

  it("close button is the reachable control with a proper accessible label", () => {
    render(
      <ToastProvider>
        <ApiProbe />
      </ToastProvider>,
    );
    pushToast({ title: "Saved" });
    const close = document.querySelector<HTMLButtonElement>(".rr-toast__close")!;
    expect(close).not.toBeNull();
    expect(close.getAttribute("aria-label")).toBe("Dismiss");

    act(() => close.click());
    expect(toasts()).toHaveLength(0);
  });
});

describe("auto-dismiss + controlled announcement (DoD #2)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("status toast auto-dismisses after the provider default; fires onDismiss once", () => {
    render(
      <ToastProvider duration={100}>
        <ApiProbe />
      </ToastProvider>,
    );
    const onDismiss = vi.fn();
    pushToast({ title: "Saved", onDismiss });
    expect(toasts()).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(toasts()).toHaveLength(1); // still inside the window

    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(toasts()).toHaveLength(0);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("a per-toast duration overrides the provider default", () => {
    render(
      <ToastProvider duration={10_000}>
        <ApiProbe />
      </ToastProvider>,
    );
    pushToast({ title: "Soon", duration: 50 });
    act(() => {
      vi.advanceTimersByTime(49);
    });
    expect(toasts()).toHaveLength(1);
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(toasts()).toHaveLength(0);
  });

  it("alert tones are PERSISTENT by default (never auto-yanked from the reader)", () => {
    render(
      <ToastProvider duration={100}>
        <ApiProbe />
      </ToastProvider>,
    );
    pushToast({ tone: "destructive", title: "Failed" });
    pushToast({ tone: "warning", title: "Heads up" });
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(toasts()).toHaveLength(2); // both alert → nothing auto-dismissed
  });

  it("an explicit null duration makes even a status toast persistent", () => {
    render(
      <ToastProvider>
        <ApiProbe />
      </ToastProvider>,
    );
    pushToast({ title: "Sticky", duration: null });
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(toasts()).toHaveLength(1);
  });

  it("pause on hover freezes the remaining time; leave resumes the leftover (no full reset)", () => {
    render(
      <ToastProvider duration={100}>
        <ApiProbe />
      </ToastProvider>,
    );
    pushToast({ title: "Paused" });
    act(() => {
      vi.advanceTimersByTime(60); // 40 left
    });
    pointerOver(); // hover pauses
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(toasts()).toHaveLength(1); // frozen despite 10s elapsing

    pointerOut(); // leave resumes with ~40 left
    act(() => {
      vi.advanceTimersByTime(39);
    });
    expect(toasts()).toHaveLength(1);
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(toasts()).toHaveLength(0);
  });

  it("pause on focus (close button) and resume when focus leaves the viewport", () => {
    render(
      <ToastProvider duration={100}>
        <ApiProbe />
      </ToastProvider>,
    );
    pushToast({ title: "Focused" });
    act(() => {
      vi.advanceTimersByTime(60);
    });
    const close = document.querySelector<HTMLButtonElement>(".rr-toast__close")!;
    act(() => close.focus()); // focus enters the viewport → pause
    expect(viewport()!.contains(document.activeElement)).toBe(true);
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(toasts()).toHaveLength(1);

    act(() => document.body.focus()); // focus leaves → resume
    act(() => {
      vi.advanceTimersByTime(39);
    });
    expect(toasts()).toHaveLength(1);
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(toasts()).toHaveLength(0);
  });

  it("Escape dismisses ONLY the toast whose close button holds focus", () => {
    render(
      <ToastProvider>
        <ApiProbe />
      </ToastProvider>,
    );
    pushToast({ title: "A" });
    pushToast({ title: "B" });

    const closes = Array.from(document.querySelectorAll<HTMLButtonElement>(".rr-toast__close"));
    expect(closes).toHaveLength(2);
    // closes[0] belongs to the NEWEST toast (B, top of the stack).
    act(() => closes[0]!.focus());
    act(() => {
      closes[0]!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });

    // Only the focused toast (B) went away; A is untouched.
    expect(toasts()).toHaveLength(1);
    expect(toasts()[0]!.textContent).toContain("A");
  });
});

describe("context + SSR parity", () => {
  it("throws a helpful error when useToast is used outside the provider", () => {
    expect(() => {
      render(
        <>
          <ApiProbe />
        </>,
      );
    }).toThrow("useToast must be used within a <ToastProvider>");
  });

  it("SSR: the provider serializes ONLY the app children (viewport is mount-gated)", () => {
    const markup = renderToStaticMarkup(
      <ToastProvider>
        <span>app</span>
      </ToastProvider>,
    );
    expect(markup).toBe("<span>app</span>");
    expect(markup).not.toContain("rr-toast");
    expect(markup).not.toContain("role=");
  });
});
