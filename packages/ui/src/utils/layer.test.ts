// Unit spec for the internal semantic z-index layer helper (RRU-052). The
// `z.*` scale VALUES (0/100/200/300) already have their own gate in
// @raulrod/tokens (RRU-023); here we pin the consumption contract: token label
// → emitted CSS custom property, in the documented stacking order.
import { describe, expect, it } from "vitest";

import { LAYER_ORDER, resolveLayerVar } from "./layer.js";

describe("resolveLayerVar", () => {
  it("resolves each semantic layer to its emitted CSS custom property", () => {
    expect(resolveLayerVar("z.base")).toBe("var(--rr-z-base)");
    expect(resolveLayerVar("z.overlay")).toBe("var(--rr-z-overlay)");
    expect(resolveLayerVar("z.modal")).toBe("var(--rr-z-modal)");
    expect(resolveLayerVar("z.toast")).toBe("var(--rr-z-toast)");
  });
});

describe("LAYER_ORDER", () => {
  it("documents the stacking order and maps to unique variables", () => {
    expect(LAYER_ORDER).toEqual(["z.base", "z.overlay", "z.modal", "z.toast"]);
    const vars = LAYER_ORDER.map(resolveLayerVar);
    expect(new Set(vars).size).toBe(LAYER_ORDER.length);
  });
});
