// Behavioral spec for Pagination (RRU-064). Range math is unit-tested directly
// on the pure `paginationRange` helper (§19 "logic aislada"); the SSR contract
// (landmark + per-control names + exactly one `aria-current` + live region) and
// the DOM behavior (controlled/uncontrolled, change guard, disabled boundaries,
// silent clamp) are exercised as user gestures (Tabs.test.tsx precedent).
import { type ReactElement, act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { paginationRange } from "./pagination-range.js";

import { Pagination } from "./index.js";

describe("paginationRange (pure window math)", () => {
  it("degenerate totals never render a bar", () => {
    expect(paginationRange(0, 1)).toEqual([]);
    expect(paginationRange(-3, 1)).toEqual([]);
  });

  it("single page = [1]", () => {
    expect(paginationRange(1, 1)).toEqual([1]);
  });

  it("two pages = [1, 2]", () => {
    expect(paginationRange(2, 1)).toEqual([1, 2]);
    expect(paginationRange(2, 2)).toEqual([1, 2]);
  });

  it("dense totals (≤ 2·sibling + 5) render the FULL run — no ellipsis", () => {
    for (let page = 1; page <= 7; page += 1) {
      expect(paginationRange(7, page)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    }
    // boundary of the density rule: 8 > 7 → window kicks in
    expect(paginationRange(8, 4)).toEqual([1, "ellipsis", 3, 4, 5, "ellipsis", 8]);
  });

  it("middle window renders both ellipses", () => {
    expect(paginationRange(12, 5)).toEqual([1, "ellipsis", 4, 5, 6, "ellipsis", 12]);
    expect(paginationRange(12, 6)).toEqual([1, "ellipsis", 5, 6, 7, "ellipsis", 12]);
  });

  it("near-start renders a single TRAILING ellipsis (page 1 exposes 1 and 2)", () => {
    expect(paginationRange(12, 1)).toEqual([1, 2, "ellipsis", 12]);
    expect(paginationRange(12, 2)).toEqual([1, 2, 3, "ellipsis", 12]);
  });

  it("near-end renders a single LEADING ellipsis", () => {
    expect(paginationRange(12, 12)).toEqual([1, "ellipsis", 11, 12]);
    expect(paginationRange(12, 11)).toEqual([1, "ellipsis", 10, 11, 12]);
  });

  it("clamps the current page silently into [1, pageCount]", () => {
    expect(paginationRange(12, 0)).toEqual([1, 2, "ellipsis", 12]);
    expect(paginationRange(12, 99)).toEqual([1, "ellipsis", 11, 12]);
  });
});

describe("Pagination SSR contract (landmark + a11y serialized on the server)", () => {
  const page = (props: Parameters<typeof Pagination>[0]) =>
    renderToStaticMarkup(<Pagination {...props} />);

  it("renders a nav landmark named Pagination by default", () => {
    expect(page({ pageCount: 5 })).toContain('<nav aria-label="Pagination" class="rr-pagination">');
    expect(page({ pageCount: 5 })).toContain("</nav>");
  });

  it("the consumer overrides the landmark name via aria-label (pass-through)", () => {
    const markup = page({ pageCount: 5, "aria-label": "Results pages" });
    expect(markup).toContain('<nav aria-label="Results pages" class="rr-pagination">');
  });

  it("a list structure wraps the controls (1.3.1)", () => {
    const markup = page({ pageCount: 5 });
    const liCount = markup.match(/<li>/g) ?? [];
    // prev + 5 pages + next
    expect(liCount).toHaveLength(7);
  });

  it("every control has an action-naming accessible label + forcing type=button", () => {
    const markup = page({ pageCount: 5 });
    expect(markup).toContain('aria-label="Previous page"');
    expect(markup).toContain('aria-label="Next page"');
    for (let n = 1; n <= 5; n += 1) {
      expect(markup).toContain(`aria-label="Go to page ${n}"`);
    }
    // prev + 5 pages + next all start as `<button type="button"`
    expect(markup.match(/<button type="button"/g)).toHaveLength(7);
  });

  it('exactly ONE aria-current="page", spelling and all, on the current page', () => {
    const markup = page({ pageCount: 5, defaultPage: 3 });
    expect(markup.match(/aria-current="page"/g)).toHaveLength(1);
    expect(markup).not.toMatch(/aria-current="true"/);
    // current page button stays a focusable button — never disabled, never a tabindex
    const currentButton =
      markup.match(/<button[^>]*aria-current="page"[^>]*>(.*?)<\/button>/)?.[0] ?? "";
    expect(currentButton).toContain('class="rr-pagination__item"');
    expect(currentButton).not.toMatch(/disabled/);
  });

  it("boundaries: previous disabled at page 1, next disabled at pageCount", () => {
    const first = page({ pageCount: 5, defaultPage: 1 });
    expect(first).toContain('aria-label="Previous page" disabled');
    expect(first).not.toContain('aria-label="Next page" disabled');
    const last = page({ pageCount: 5, defaultPage: 5 });
    expect(last).toContain('aria-label="Next page" disabled');
    expect(last).not.toContain('aria-label="Previous page" disabled');
  });

  it("ellipsis when the window cannot cover every page: aria-hidden, non-focusable", () => {
    const wide = page({ pageCount: 12, defaultPage: 5 });
    expect(wide).toContain('<span class="rr-pagination__ellipsis" aria-hidden="true">…</span>');
    expect(wide.match(/<span class="rr-pagination__ellipsis"[^>]*>/g)).toHaveLength(2);
    // the ellipsis span is not a control: no tabindex anywhere in the bar
    expect(wide).not.toMatch(/tabindex/);

    const dense = page({ pageCount: 5 });
    expect(dense).not.toContain("ellipsis");
    expect(dense).not.toMatch(/…/);
  });

  it("icons are decorative (aria-hidden) — the label is the accessible name", () => {
    const markup = page({ pageCount: 5 });
    expect(markup.match(/aria-hidden="true"/g) ?? []).toHaveLength(2);
    expect(markup).toContain("lucide-chevron-left");
    expect(markup).toContain("lucide-chevron-right");
  });

  it("an always-mounted role=status live region announces 'Page X of Y' (WCAG 4.1.3)", () => {
    const markup = page({ pageCount: 12, defaultPage: 5 });
    expect(markup).toContain('role="status"');
    expect(markup).toContain('aria-live="polite"');
    expect(markup).toContain(">Page 5 of 12</span>");
    expect(markup).toContain('class="rr-visually-hidden"');
  });

  it("native keyboard only: no tabindex rewrite, no synthetic key handlers", () => {
    const markup = page({ pageCount: 12, defaultPage: 5 });
    expect(markup).not.toMatch(/tabindex/);
    expect(markup).not.toMatch(/onkeydown/i);
  });

  it("merges className and passes through props on the nav root", () => {
    const markup = renderToStaticMarkup(
      <Pagination pageCount={3} id="p" data-x="1" title="t" className="probe" />,
    );
    expect(markup).toContain('aria-label="Pagination"');
    expect(markup).toContain('class="rr-pagination probe"');
    expect(markup).toContain('id="p"');
    expect(markup).toContain('data-x="1"');
    expect(markup).toContain('title="t"');
    expect(markup).toContain("</nav>");
  });

  it("uses the UNCONTROLLED defaultPage only when provided (else page 1)", () => {
    expect(page({ pageCount: 3, defaultPage: 2 })).toContain('aria-current="page"');
    const markup = page({ pageCount: 3, defaultPage: 2 });
    const current = markup.match(/<button[^>]*aria-current="page"[^>]*>(.*?)<\/button>/)?.[1];
    expect(current).toBe("2");
  });

  it("is a genuine forwardRef with displayName (pattern RRU-040)", () => {
    expect(Pagination.$$typeof).toBe(Symbol.for("react.forward_ref"));
    expect(Pagination.displayName).toBe("Pagination");
  });
});

describe("Pagination behavior (happy-dom, user gestures)", () => {
  let host: HTMLDivElement | null = null;
  let root: Root | null = null;

  const mount = (ui: ReactElement) => {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    act(() => root!.render(ui));
  };

  const unmount = () => {
    act(() => root?.unmount());
    root = null;
    host?.remove();
    host = null;
  };

  const click = (label: string) => {
    const node = document.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`);
    expect(node, `button ${label} must exist`).not.toBeNull();
    act(() => node!.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  };

  const currentPage = (): string =>
    (document.querySelector<HTMLButtonElement>('[aria-current="page"]')?.textContent ?? "").trim();

  afterEach(() => {
    unmount();
  });

  it("uncontrolled: defaultPage seeds; clicking a page fires onPageChange and moves aria-current", () => {
    const onPageChange = vi.fn();
    mount(<Pagination pageCount={12} defaultPage={5} onPageChange={onPageChange} />);
    expect(currentPage()).toBe("5");
    click("Go to page 6"); // 6 is inside the [4,5,6] window → rendered
    expect(onPageChange).toHaveBeenLastCalledWith(6);
    expect(currentPage()).toBe("6");
  });

  it("the change guard: clicking the CURRENT page never fires (Tabs precedent)", () => {
    const onPageChange = vi.fn();
    mount(<Pagination pageCount={12} defaultPage={5} onPageChange={onPageChange} />);
    click("Go to page 5");
    expect(onPageChange).not.toHaveBeenCalled();
    expect(currentPage()).toBe("5");
  });

  it("disabled boundary controls swallow the click", () => {
    const onPageChange = vi.fn();
    mount(<Pagination pageCount={5} defaultPage={1} onPageChange={onPageChange} />);
    click("Previous page");
    expect(onPageChange).not.toHaveBeenCalled();
    expect(currentPage()).toBe("1");
  });

  it("previous/next navigate by one and clamp at the edges", () => {
    const onPageChange = vi.fn();
    mount(<Pagination pageCount={12} defaultPage={5} onPageChange={onPageChange} />);
    click("Next page");
    expect(currentPage()).toBe("6");
    click("Previous page");
    expect(currentPage()).toBe("5");
    expect(onPageChange).toHaveBeenCalledTimes(2);
  });

  it("controlled: the prop gates the value (fires callback, does not move internally)", () => {
    const onPageChange = vi.fn();
    mount(<Pagination pageCount={12} page={5} onPageChange={onPageChange} />);
    click("Go to page 6"); // inside the [4,5,6] window → rendered
    expect(onPageChange).toHaveBeenLastCalledWith(6);
    expect(currentPage()).toBe("5");

    act(() => {
      root!.render(<Pagination pageCount={12} page={6} onPageChange={onPageChange} />);
    });
    expect(currentPage()).toBe("6");
  });

  it("silent clamp: out-of-range page renders clamped (fail soft, never crash)", () => {
    const low = vi.fn();
    mount(<Pagination pageCount={5} page={0} onPageChange={low} />);
    expect(currentPage()).toBe("1");

    act(() => {
      root!.render(<Pagination pageCount={5} page={99} onPageChange={low} />);
    });
    expect(currentPage()).toBe("5");
    expect(document.querySelector('[aria-label="Next page"]')).toHaveProperty("disabled", true);
  });

  it("tab order is native: no tabindex rewrite, no roving; ellipsis never a focus stop", () => {
    mount(<Pagination pageCount={12} defaultPage={5} />);
    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("button"));
    expect(buttons.length).toBe(7); // prev + 5 window/edges + next
    for (const button of buttons) {
      // no roving tabindex: native focusability only (disabled skips naturally)
      expect(button.hasAttribute("tabindex")).toBe(false);
      expect(button.type).toBe("button");
    }
    // the 2 ellipsis spans (aria-hidden) are the only decorative nodes
    expect(document.querySelectorAll(".rr-pagination__ellipsis")).toHaveLength(2);
  });

  it("the status live region stays MOUNTED and tracks the page (4.1.3 precondition)", () => {
    mount(<Pagination pageCount={12} defaultPage={5} />);
    expect(document.querySelector('[role="status"]')?.textContent).toBe("Page 5 of 12");
    click("Next page");
    expect(document.querySelector('[role="status"]')?.textContent).toBe("Page 6 of 12");
  });
});
