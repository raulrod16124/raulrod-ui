import type { CSSProperties } from "react";

import { describe, expect, it } from "vitest";

import { type Styles } from "../style-tokens.generated.js";

import { mergeStyles } from "./merge-styles.js";

describe("mergeStyles", () => {
  it("returns the consumer style when styles are undefined", () => {
    const style = { color: "red" };

    expect(mergeStyles(undefined, style)).toBe(style);
  });

  it("returns the consumer style when styles are empty", () => {
    const style = { color: "red" };

    expect(mergeStyles({}, style)).toBe(style);
  });

  it("returns only styles when the style prop is undefined", () => {
    const styles: Styles<"button"> = { "--rr-button-primary-background": "blue" };

    expect(mergeStyles(styles, undefined)).toEqual({
      "--rr-button-primary-background": "blue",
    });
  });

  it("merges styles under the consumer style prop", () => {
    const styles: Styles<"button"> = { "--rr-button-primary-background": "blue" };

    expect(mergeStyles(styles, { color: "red" })).toEqual({
      color: "red",
      "--rr-button-primary-background": "blue",
    });
  });

  it("carries standard CSS properties through the merge", () => {
    const styles: Styles<"button"> = { color: "blue", opacity: 0.5 };

    expect(mergeStyles(styles, { backgroundColor: "black" })).toEqual({
      backgroundColor: "black",
      color: "blue",
      opacity: 0.5,
    });
  });

  it("lets the explicit style prop win over styles on key collision", () => {
    const styles: Styles<"button"> = {
      "--rr-button-primary-background": "blue",
      color: "blue",
    };
    const style: CSSProperties = { color: "red" };

    expect(mergeStyles(styles, style)).toEqual({
      "--rr-button-primary-background": "blue",
      color: "red",
    });
  });
});
