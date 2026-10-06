// Responsive contract for Pagination (RRU-141).
//
// The collapse is proved geometrically in the E2E, but three declarations are
// invisible to a DOM assertion and are part of the contract:
//
//   1. `.rr-pagination` must declare `container-type: inline-size`, otherwise
//      the `@container` collapse query can never match (ADR-008).
//   2. The collapse query must use a breakpoint token value (640px = sm).
//   3. The query must hide the NUMBER nodes that are not current AND the
//      ellipsis, while keeping prev/next/current visible. That requires
//      per-node modifiers, which are a CSS-only mechanism with no API change.
import { describe, expect, it } from "vitest";

import { declaration, parseCssRules } from "../test-support/css-rules.js";

const FILE = "pagination/Pagination.css";

function hasDeclaration(
  rules: Awaited<ReturnType<typeof parseCssRules>>,
  selector: string,
  media: string | null,
  property: string,
  value: string,
): boolean {
  return rules.some(
    (rule) =>
      rule.selectors.includes(selector) &&
      rule.media === media &&
      declaration(rule, property)?.value === value,
  );
}

describe("Pagination responsive contract (RRU-141)", () => {
  it("declares an inline-size container on the nav root", async () => {
    const rules = await parseCssRules(FILE);
    const root = rules.find(
      (rule) => rule.selectors.includes(".rr-pagination") && rule.media === null,
    );
    expect(root, ".rr-pagination base rule exists").toBeDefined();
    expect(declaration(root!, "container-type")?.value).toBe("inline-size");
  });

  it("collapses to prev/current/next inside a small container, using the breakpoint token", async () => {
    const rules = await parseCssRules(FILE);
    const collapseRules = rules.filter((rule) => rule.media === "@container (max-width: 640px)");
    expect(collapseRules.length).toBeGreaterThan(0);

    expect(
      hasDeclaration(
        collapseRules,
        '.rr-pagination__item--number:not([aria-current="page"])',
        "@container (max-width: 640px)",
        "display",
        "none",
      ),
    ).toBe(true);
    expect(
      hasDeclaration(
        collapseRules,
        ".rr-pagination__ellipsis",
        "@container (max-width: 640px)",
        "display",
        "none",
      ),
    ).toBe(true);
  });

  it("keeps prev and next outside the collapse rule", async () => {
    const rules = await parseCssRules(FILE);
    const collapseRules = rules.filter((rule) => rule.media === "@container (max-width: 640px)");

    for (const rule of collapseRules) {
      const text = rule.selectors.join(", ");
      expect(text).not.toContain("rr-pagination__item--prev");
      expect(text).not.toContain("rr-pagination__item--next");
    }
  });
});
