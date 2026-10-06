// Responsive contract for Table (RRU-140).
//
// The behaviour is proved in the E2E (horizontal scrollport, no page overflow,
// sticky header in a bounded scrollport), but three declarations are invisible
// to a DOM assertion and are part of the contract:
//
//   1. `.rr-table` must declare `container-type: inline-size`, otherwise the
//      `@container` density query can never match (ADR-008).
//   2. The density query must use a breakpoint token value (640px = sm) and
//      must map to the `sm` density tokens, not to arbitrary numbers.
//   3. The sticky header rule must exist with the two mechanics declarations
//      (`position: sticky; top: 0`). Without them, a consumer who bounds the
//      wrapper height gets a scrollport but no sticky behaviour.
import { describe, expect, it } from "vitest";

import { declaration, parseCssRules } from "../test-support/css-rules.js";

const FILE = "table/Table.css";

/** Normalized selector as the parser emits it. */
function hasSelector(rules: Awaited<ReturnType<typeof parseCssRules>>, wanted: string): boolean {
  return rules.some((rule) =>
    rule.selectors.some((selector) => selector === wanted || selector.includes(wanted)),
  );
}

/** Rules whose selectors match one of the given strings exactly. */
function rulesWithSelectors(
  rules: Awaited<ReturnType<typeof parseCssRules>>,
  selectors: readonly string[],
): Awaited<ReturnType<typeof parseCssRules>> {
  const set = new Set(selectors);
  return rules.filter((rule) => rule.selectors.some((selector) => set.has(selector)));
}

describe("Table responsive contract (RRU-140)", () => {
  it("declares an inline-size container on the wrapper", async () => {
    const rules = await parseCssRules(FILE);
    const wrapper = rules.find(
      (rule) => rule.selectors.includes(".rr-table") && rule.media === null,
    );
    expect(wrapper, ".rr-table base rule exists").toBeDefined();
    expect(declaration(wrapper!, "container-type")?.value).toBe("inline-size");
  });

  it("drops to the sm density inside a small container, using the breakpoint token", async () => {
    const rules = await parseCssRules(FILE);
    const densityRules = rules.filter((rule) => rule.media === "@container (max-width: 640px)");
    expect(densityRules.length).toBeGreaterThan(0);

    const targets = rulesWithSelectors(densityRules, [".rr-table__header", ".rr-table__cell"]);
    expect(targets.length).toBeGreaterThan(0);

    const padding = targets
      .map((rule) => declaration(rule, "padding")?.value)
      .find((value) => value !== undefined);
    const fontSize = targets
      .map((rule) => declaration(rule, "font-size")?.value)
      .find((value) => value !== undefined);

    expect(padding).toBe("var(--rr-space-1) var(--rr-space-2)");
    expect(fontSize).toBe("var(--rr-font-size-xs)");
  });

  it("keeps the sticky header mechanics", async () => {
    const rules = await parseCssRules(FILE);
    const stickyRule = rules.find((rule) =>
      rule.selectors.includes(".rr-table--sticky .rr-table__head .rr-table__header"),
    );
    expect(stickyRule, "sticky header rule exists").toBeDefined();
    expect(declaration(stickyRule!, "position")?.value).toBe("sticky");
    expect(declaration(stickyRule!, "top")?.value).toBe("0");
  });
});
