// Behavioral spec for Pagination (RRU-064). Range math is unit-tested directly
// on the pure `paginationRange` helper (§19 "logic aislada"); the SSR contract
// (landmark + per-control names + exactly one `aria-current` + live region) and
// the DOM behavior (controlled/uncontrolled, change guard, disabled boundaries,
// silent clamp) are exercised as user gestures (Tabs.test.tsx precedent).
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { auditA11y } from "../test-support/axe.js";
import { expectTokenLineage, readComponentCss, stripCssComments } from "../test-support/css.js";

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
  const currentPage = (): string =>
    (screen.getByRole("button", { current: "page" }).textContent ?? "").trim();
  const control = (label: string): HTMLButtonElement => screen.getByRole("button", { name: label });

  it("uncontrolled: defaultPage seeds; clicking a page fires onPageChange and moves aria-current", async () => {
    const onPageChange = vi.fn();
    render(<Pagination pageCount={12} defaultPage={5} onPageChange={onPageChange} />);
    expect(currentPage()).toBe("5");

    await userEvent.click(control("Go to page 6")); // 6 is inside the [4,5,6] window → rendered

    expect(onPageChange).toHaveBeenLastCalledWith(6);
    expect(currentPage()).toBe("6");
  });

  it("the change guard: clicking the CURRENT page never fires (Tabs precedent)", async () => {
    const onPageChange = vi.fn();
    render(<Pagination pageCount={12} defaultPage={5} onPageChange={onPageChange} />);

    await userEvent.click(control("Go to page 5"));

    expect(onPageChange).not.toHaveBeenCalled();
    expect(currentPage()).toBe("5");
  });

  it("disabled boundary controls swallow the click", async () => {
    const onPageChange = vi.fn();
    render(<Pagination pageCount={5} defaultPage={1} onPageChange={onPageChange} />);

    await userEvent.click(control("Previous page"));

    expect(onPageChange).not.toHaveBeenCalled();
    expect(currentPage()).toBe("1");
  });

  it("previous/next navigate by one and clamp at the edges", async () => {
    const onPageChange = vi.fn();
    render(<Pagination pageCount={12} defaultPage={5} onPageChange={onPageChange} />);

    await userEvent.click(control("Next page"));
    expect(currentPage()).toBe("6");

    await userEvent.click(control("Previous page"));
    expect(currentPage()).toBe("5");
    expect(onPageChange).toHaveBeenCalledTimes(2);
  });

  it("controlled: the prop gates the value (fires callback, does not move internally)", async () => {
    const onPageChange = vi.fn();
    const { rerender } = render(<Pagination pageCount={12} page={5} onPageChange={onPageChange} />);

    await userEvent.click(control("Go to page 6")); // inside the [4,5,6] window → rendered

    expect(onPageChange).toHaveBeenLastCalledWith(6);
    expect(currentPage()).toBe("5");

    rerender(<Pagination pageCount={12} page={6} onPageChange={onPageChange} />);
    expect(currentPage()).toBe("6");
  });

  it("silent clamp: out-of-range page renders clamped (fail soft, never crash)", () => {
    const low = vi.fn();
    const { rerender } = render(<Pagination pageCount={5} page={0} onPageChange={low} />);
    expect(currentPage()).toBe("1");

    rerender(<Pagination pageCount={5} page={99} onPageChange={low} />);

    expect(currentPage()).toBe("5");
    expect(control("Next page")).toBeDisabled();
  });

  it("tab order is native: no tabindex rewrite, no roving; ellipsis never a focus stop", () => {
    const { container } = render(<Pagination pageCount={12} defaultPage={5} />);
    const buttons = Array.from(container.querySelectorAll<HTMLButtonElement>("button"));

    expect(buttons).toHaveLength(7); // prev + 5 window/edges + next
    for (const button of buttons) {
      // no roving tabindex: native focusability only (disabled skips naturally)
      expect(button.hasAttribute("tabindex")).toBe(false);
      expect(button.type).toBe("button");
    }
    // the 2 ellipsis spans (aria-hidden) are the only decorative nodes
    expect(container.querySelectorAll(".rr-pagination__ellipsis")).toHaveLength(2);
  });

  it("the status live region stays MOUNTED and tracks the page (4.1.3 precondition)", async () => {
    render(<Pagination pageCount={12} defaultPage={5} />);
    expect(screen.getByRole("status")).toHaveTextContent("Page 5 of 12");

    await userEvent.click(control("Next page"));

    expect(screen.getByRole("status")).toHaveTextContent("Page 6 of 12");
  });

  it("has no axe violations in the dense and windowed shapes", async () => {
    // audited separately: two bars with the SAME landmark label in one container
    // would trip axe's landmark-unique rule without saying anything about Pagination
    const dense = render(<Pagination pageCount={5} defaultPage={3} />);
    await expect(auditA11y(dense.container)).resolves.toHaveNoViolations();
    dense.unmount();

    const windowed = render(<Pagination pageCount={12} defaultPage={5} />);
    await expect(auditA11y(windowed.container)).resolves.toHaveNoViolations();
  });
});

describe("Pagination authored CSS contract", () => {
  it("lays the bar out as a wrapping flex rail with the space-1 gap", async () => {
    const list =
      /\.rr-pagination__list\s*\{([^}]*)\}/.exec(
        await readComponentCss("pagination/Pagination.css"),
      )?.[1] ?? "";

    expect(list).toMatch(/display:\s*flex/);
    expect(list).toMatch(/flex-wrap:\s*wrap/);
    expect(list).toMatch(/gap:\s*var\(--rr-space-1\)/);
  });

  it("keeps a 32px hit target and the small label typography (WCAG 2.5.8)", async () => {
    const item =
      /\.rr-pagination__item\s*\{([^}]*)\}/.exec(
        await readComponentCss("pagination/Pagination.css"),
      )?.[1] ?? "";

    expect(item).toMatch(/min-width:\s*var\(--rr-space-8\)/);
    expect(item).toMatch(/height:\s*var\(--rr-space-8\)/);
    expect(item).toMatch(/font-size:\s*var\(--rr-font-size-sm\)/);
    expect(item).toMatch(/font-weight:\s*var\(--rr-font-weight-medium\)/);
  });

  it("rings the current item on focus-visible with the 2px focus family", async () => {
    const focus =
      /\.rr-pagination__item:focus-visible\s*\{([^}]*)\}/.exec(
        await readComponentCss("pagination/Pagination.css"),
      )?.[1] ?? "";

    expect(focus).toMatch(/outline:\s*2px solid\s+var\(--rr-color-focus-ring\)/);
    expect(focus).toMatch(/outline-offset:\s*2px/);
  });

  it("marks the current page with fill plus a non-color cue (1.4.1)", async () => {
    const current =
      /\.rr-pagination__item\[aria-current="page"\][^{]*\{([^}]*)\}/.exec(
        await readComponentCss("pagination/Pagination.css"),
      )?.[1] ?? "";

    expect(current).toMatch(/background:\s*var\(--rr-color-action-primary-background\)/);
    expect(current).toMatch(/color:\s*var\(--rr-color-action-primary-text\)/);
    expect(current).toMatch(/font-weight:\s*var\(--rr-font-weight-semibold\)/);
  });

  it("keeps the disabled rule last so it wins at equal specificity, and mutes the ellipsis", async () => {
    const css = await readComponentCss("pagination/Pagination.css");
    const ellipsis = /\.rr-pagination__ellipsis\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
    const disabled = /\.rr-pagination__item:disabled\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";

    expect(disabled).toMatch(/color:\s*var\(--rr-color-action-disabled-text\)/);
    expect(css.indexOf(":disabled")).toBeGreaterThan(css.indexOf('[aria-current="page"]'));
    expect(ellipsis).toMatch(/color:\s*var\(--rr-color-text-muted\)/);
    expect(ellipsis).toMatch(/min-width:\s*var\(--rr-space-8\)/);
  });

  it("holds the token-only rule: no hex, no pixel design values, no keyframes, no positioning", async () => {
    const css = stripCssComments(await readComponentCss("pagination/Pagination.css"));
    const withoutFocusRing = css.replace(/outline[^;]*;/g, "");

    expect(withoutFocusRing).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(withoutFocusRing).not.toMatch(/\d+px\b/);
    expect(css, "no keyframes → nothing to gate under reduced motion").not.toMatch(/@keyframes/);
    expect(css).not.toMatch(/position:\s*(absolute|fixed)/);
  });

  it("only consumes tokens that @raulrod/tokens defines", async () => {
    await expectTokenLineage(await readComponentCss("pagination/Pagination.css"));
  });
});
