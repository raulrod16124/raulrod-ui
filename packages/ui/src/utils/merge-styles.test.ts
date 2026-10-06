import type { CSSProperties } from "react";

import { describe, expect, it } from "vitest";

import { mergeStyles } from "./merge-styles.js";

describe("mergeStyles", () => {
  it("returns the base style when overrides are undefined", () => {
    const base = { color: "red" };

    expect(mergeStyles(undefined, base)).toBe(base);
  });

  it("returns the base style when overrides are empty", () => {
    const base = { color: "red" };

    expect(mergeStyles({}, base)).toBe(base);
  });

  it("returns only overrides when the base style is undefined", () => {
    expect(mergeStyles({ "--rr-button-primary-background": "blue" }, undefined)).toEqual({
      "--rr-button-primary-background": "blue",
    });
  });

  it("merges overrides on top of the base style", () => {
    expect(mergeStyles({ "--rr-button-primary-background": "blue" }, { color: "red" })).toEqual({
      color: "red",
      "--rr-button-primary-background": "blue",
    });
  });

  it("lets the explicit style prop win over styles on key collision", () => {
    const base = {
      "--rr-button-primary-background": "green",
      color: "red",
    } as CSSProperties;

    expect(mergeStyles({ "--rr-button-primary-background": "blue" }, base)).toEqual({
      "--rr-button-primary-background": "blue",
      color: "red",
    });
  });
});
