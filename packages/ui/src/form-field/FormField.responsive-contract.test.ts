// Responsive contract for FormField (RRU-142).
//
// The field root and its control slot can both be composed as flex/grid items,
// so both must drop the automatic minimum size. The card deliberately does NOT
// add `width: 100%` to the root; see the comment in FormField.css for why.
import { describe, expect, it } from "vitest";

import { declaration, parseCssRules } from "../test-support/css-rules.js";

const FILE = "form-field/FormField.css";

describe("FormField responsive contract (RRU-142)", () => {
  it("declares min-width: 0 on the field root", async () => {
    const rules = await parseCssRules(FILE);
    const root = rules.find(
      (rule) => rule.selectors.includes(".rr-form-field") && rule.media === null,
    );
    expect(root, ".rr-form-field base rule exists").toBeDefined();
    expect(declaration(root!, "min-width")?.value).toBe("0");
  });

  it("declares min-width: 0 on the control slot", async () => {
    const rules = await parseCssRules(FILE);
    const control = rules.find(
      (rule) => rule.selectors.includes(".rr-form-field-control") && rule.media === null,
    );
    expect(control, ".rr-form-field-control rule exists").toBeDefined();
    expect(declaration(control!, "min-width")?.value).toBe("0");
  });
});
