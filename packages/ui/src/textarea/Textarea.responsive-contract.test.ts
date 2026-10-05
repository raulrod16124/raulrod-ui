// Responsive contract for Textarea (RRU-142).
//
// Both the bare control and the autosize grid wrapper can be composed as
// flex/grid items, so both must drop the automatic minimum size. The mirror
// already carries `overflow-wrap: anywhere` (RRU-045); this gate pins the
// missing declarations on the control and the wrapper.
import { describe, expect, it } from "vitest";

import { declaration, parseCssRules } from "../test-support/css-rules.js";

const FILE = "textarea/Textarea.css";

describe("Textarea responsive contract (RRU-142)", () => {
  it("declares min-width: 0 on the control", async () => {
    const rules = await parseCssRules(FILE);
    const root = rules.find(
      (rule) => rule.selectors.includes(".rr-textarea") && rule.media === null,
    );
    expect(root, ".rr-textarea base rule exists").toBeDefined();
    expect(declaration(root!, "min-width")?.value).toBe("0");
  });

  it("declares min-width: 0 on the autosize grid wrapper", async () => {
    const rules = await parseCssRules(FILE);
    const wrapper = rules.find(
      (rule) => rule.selectors.includes(".rr-textarea-autosize") && rule.media === null,
    );
    expect(wrapper, ".rr-textarea-autosize base rule exists").toBeDefined();
    expect(declaration(wrapper!, "min-width")?.value).toBe("0");
  });
});
