// Responsive contract for Tabs (RRU-141).
//
// Tabs does NOT use a container query: the rail is a horizontal scrollport at
// every width, so the only responsive declarations are the scroll mechanics and
// the focus-ring contract that keeps the indicator visible inside the clipping
// ancestor.
import { describe, expect, it } from "vitest";

import { declaration, parseCssRules } from "../test-support/css-rules.js";

const FILE = "tabs/Tabs.css";

describe("Tabs responsive contract (RRU-141)", () => {
  it("declares a horizontal scrollport on the tab list", async () => {
    const rules = await parseCssRules(FILE);
    const list = rules.find(
      (rule) => rule.selectors.includes(".rr-tabs-list") && rule.media === null,
    );
    expect(list, ".rr-tabs-list base rule exists").toBeDefined();
    expect(declaration(list!, "overflow-x")?.value).toBe("auto");
  });

  it("uses proximity snapping so keyboard focus scrolling is not overruled", async () => {
    const rules = await parseCssRules(FILE);
    const list = rules.find(
      (rule) => rule.selectors.includes(".rr-tabs-list") && rule.media === null,
    );
    expect(declaration(list!, "scroll-snap-type")?.value).toMatch(/inline\s+proximity/);

    const trigger = rules.find(
      (rule) => rule.selectors.includes(".rr-tabs-trigger") && rule.media === null,
    );
    expect(declaration(trigger!, "scroll-snap-align")?.value).toBe("start");
  });

  it("keeps the focus ring inside the trigger box so overflow cannot clip it", async () => {
    const rules = await parseCssRules(FILE);
    const focus = rules.find((rule) => rule.selectors.includes(".rr-tabs-trigger:focus-visible"));
    expect(focus, "trigger focus ring exists").toBeDefined();
    expect(declaration(focus!, "outline-offset")?.value).toBe("-2px");
  });
});
