// Behavioral spec for Skeleton (RRU-062). Static, non-interactive placeholder
// (Badge precedent): observable behavior is the SSR markup — default variant in
// JS, the modifier per `variant`, `cx` className merge + pass-through, children
// pass-through — and the deliberately-empty semantics (no ARIA/interactivity:
// the loading state is announced by the composing container, shared states
// RRU-067, or by Progress RRU-063 — a skeleton must stay noiseless). The
// authored-CSS contract (shimmer + reduced-motion DoD #1 + token lineage) is
// asserted by the local `check-skeleton.mjs` (gitignored, **/scripts/*.mjs
// policy, like Badge/Switch/Button) because the repo has no @types/node for the
// test TS files yet (RRU-068) and the component has no DOM interaction.
import type { SkeletonProps } from "./Skeleton.types.js";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Skeleton } from "./index.js";

const render = (props: SkeletonProps = {}) => renderToStaticMarkup(<Skeleton {...props} />);

describe("SSR contract", () => {
  it("default variant = rectangle, emitted in JS (Badge precedent)", () => {
    expect(render()).toBe('<span class="rr-skeleton rr-skeleton--rectangle"></span>');
  });

  it("circle variant emits the rr-skeleton--circle modifier", () => {
    expect(render({ variant: "circle" })).toBe(
      '<span class="rr-skeleton rr-skeleton--circle"></span>',
    );
  });

  it("className merge (appended) + pass-through attrs preserved", () => {
    expect(
      renderToStaticMarkup(
        <Skeleton className="probe" title="t" data-x="1" id="s" aria-hidden="true" />,
      ),
    ).toBe(
      '<span title="t" data-x="1" id="s" aria-hidden="true" class="rr-skeleton rr-skeleton--rectangle probe"></span>',
    );
  });

  it("renders children (spread) — a skeleton may contain decorative markup", () => {
    expect(renderToStaticMarkup(<Skeleton>…</Skeleton>)).toBe(
      '<span class="rr-skeleton rr-skeleton--rectangle">…</span>',
    );
  });

  it("is deliberately empty of semantics: no role, no ARIA, no tabindex, no interactivity", () => {
    const markup = render();
    expect(markup).not.toMatch(/role=/);
    expect(markup).not.toMatch(/aria-/);
    expect(markup).not.toMatch(/tabindex/);
    expect(markup).not.toMatch(/disabled|onclick|onkeydown/i);
  });
});

describe("ref + displayName", () => {
  it("is a genuine forwardRef (pattern RRU-040)", () => {
    expect(Skeleton.$$typeof).toBe(Symbol.for("react.forward_ref"));
  });

  it("sets displayName for devtools", () => {
    expect(Skeleton.displayName).toBe("Skeleton");
  });
});
