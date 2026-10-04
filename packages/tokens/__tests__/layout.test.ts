// Layout tokens contract (RRU-135).
// Behavior over implementation: validates keys, values and that media queries
// are only exposed as explicit exceptions (container-first).

import { describe, expect, it } from "vitest";

import { breakpoints, queries } from "../src/layout/index.js";

describe("breakpoints", () => {
  it("exports canonical breakpoint keys and px values", () => {
    expect(breakpoints).toMatchObject({
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
    });
    const keys = Object.keys(breakpoints) as Array<keyof typeof breakpoints>;
    expect(keys).toEqual(["sm", "md", "lg", "xl"]);
    for (const v of Object.values(breakpoints)) {
      expect(v).toMatch(/^\d+px$/);
      expect(parseInt(v, 10)).toBeGreaterThan(0);
    }
  });
});

describe("queries", () => {
  it("provides container-first queries for all breakpoints", () => {
    expect(queries.container).toMatchObject({
      sm: "@container (min-width: 640px)",
      md: "@container (min-width: 768px)",
      lg: "@container (min-width: 1024px)",
      xl: "@container (min-width: 1280px)",
    });
  });

  it("exposes media queries only as explicit exceptions (Dialog/Toast)", () => {
    expect(queries.media).toMatchObject({
      sm: "@media (min-width: 640px)",
      md: "@media (min-width: 768px)",
      lg: "@media (min-width: 1024px)",
      xl: "@media (min-width: 1280px)",
    });
    expect(Object.keys(queries.container)).toEqual(["sm", "md", "lg", "xl"]);
    expect(Object.keys(queries.media)).toEqual(["sm", "md", "lg", "xl"]);
  });

  it("container queries do not use @media", () => {
    for (const v of Object.values(queries.container)) {
      expect(v.startsWith("@container")).toBe(true);
      expect(v.includes("@media")).toBe(false);
    }
  });

  it("media queries use @media only", () => {
    for (const v of Object.values(queries.media)) {
      expect(v.startsWith("@media")).toBe(true);
      expect(v.includes("@container")).toBe(false);
    }
  });
});
