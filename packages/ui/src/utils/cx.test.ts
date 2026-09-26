// `cx` (RRU-030) as a tracked spec, replacing the gitignored `check-utils.mjs`.
// It is the composition primitive every className merge in the library goes
// through, so its falsy handling and array flattening are part of the public
// contract, not an implementation detail.
import { describe, expect, it } from "vitest";

import { cx } from "./cx.js";

const isActive = true;

const CASES: { args: Parameters<typeof cx>; expected: string }[] = [
  { args: ["a", "b", "c"], expected: "a b c" },
  { args: ["a", false, "b", null, "c", undefined], expected: "a b c" },
  { args: ["a", 0, "b"], expected: "a b" },
  { args: ["a", 5, "b"], expected: "a 5 b" },
  { args: ["base", isActive && "active"], expected: "base active" },
  { args: ["base", !isActive && "active"], expected: "base" },
  { args: ["a", "", "b"], expected: "a b" },
  { args: [], expected: "" },
  { args: [""], expected: "" },
  { args: [["a", "b"], "c"], expected: "a b c" },
  { args: ["x", ["y", ["z"]]], expected: "x y z" },
  { args: ["a", ["b", false, "c"]], expected: "a b c" },
  { args: ["  spaced  "], expected: "spaced" },
  { args: ["a", "a"], expected: "a a" },
];

describe("cx", () => {
  it.each(CASES)('cx($args) -> "$expected"', ({ args, expected }) => {
    expect(cx(...args)).toBe(expected);
  });

  it("drops every falsy value, so a disabled modifier leaves no dangling space", () => {
    expect(cx("rr-button", false, undefined, null)).toBe("rr-button");
  });

  it("keeps 0 out but keeps other numbers in (documented: 0 is a falsy class)", () => {
    expect(cx("a", 0, 1)).toBe("a 1");
  });

  it("flattens nested arrays recursively, including falsy members inside them", () => {
    expect(cx("root", [["mid", ["leaf", false]], undefined], "")).toBe("root mid leaf");
  });

  it("does NOT deduplicate: the merge is verbatim concatenation", () => {
    expect(cx("a", "a", "a")).toBe("a a a");
  });
});
