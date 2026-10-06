// Responsive contract for Input (RRU-142).
//
// The replaced element's intrinsic `size=20` floor is invisible to a DOM
// assertion once the field is alone on its own line; the only way to pin the
// contract is to assert the authored declaration.
import { describe, expect, it } from "vitest";

import { declaration, parseCssRules } from "../test-support/css-rules.js";

const FILE = "input/Input.css";

describe("Input responsive contract (RRU-142)", () => {
  it("declares min-width: 0 on the control so it can shrink inside a flex row", async () => {
    const rules = await parseCssRules(FILE);
    const root = rules.find((rule) => rule.selectors.includes(".rr-input") && rule.media === null);
    expect(root, ".rr-input base rule exists").toBeDefined();
    expect(declaration(root!, "min-width")?.value).toBe("0");
  });
});
