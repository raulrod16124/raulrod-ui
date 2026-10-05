// Responsive contract for Radio (RRU-142).
//
// A horizontal group wraps instead of crushing its labels; each label must be
// able to shrink (min-width: 0) and break long words (overflow-wrap: anywhere).
// These declarations have no DOM-visible effect on the current stories, so they
// are asserted at source level (RRU-138 precedent).
import { describe, expect, it } from "vitest";

import { declaration, parseCssRules } from "../test-support/css-rules.js";

const FILE = "radio/Radio.css";

describe("Radio responsive contract (RRU-142)", () => {
  it("declares flex-wrap: wrap on the horizontal group modifier", async () => {
    const rules = await parseCssRules(FILE);
    const horizontal = rules.find(
      (rule) => rule.selectors.includes(".rr-radio-group--horizontal") && rule.media === null,
    );
    expect(horizontal, ".rr-radio-group--horizontal rule exists").toBeDefined();
    expect(declaration(horizontal!, "flex-wrap")?.value).toBe("wrap");
  });

  it("declares min-width: 0 on the option label", async () => {
    const rules = await parseCssRules(FILE);
    const label = rules.find(
      (rule) => rule.selectors.includes(".rr-radio-label") && rule.media === null,
    );
    expect(label, ".rr-radio-label rule exists").toBeDefined();
    expect(declaration(label!, "min-width")?.value).toBe("0");
  });

  it("declares overflow-wrap: anywhere on the option label", async () => {
    const rules = await parseCssRules(FILE);
    const label = rules.find(
      (rule) => rule.selectors.includes(".rr-radio-label") && rule.media === null,
    );
    expect(label, ".rr-radio-label rule exists").toBeDefined();
    expect(declaration(label!, "overflow-wrap")?.value).toBe("anywhere");
  });
});
