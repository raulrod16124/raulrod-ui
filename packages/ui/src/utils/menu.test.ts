// Unit spec for the pure menu-roving math (RRU-055). Synthetic item arrays, no
// DOM (mirror of popover.test.ts): the functions above must decide the correct
// next/prev/first/last/type-ahead index given `{disabled,label}` models.
import type { MenuItemModel } from "./menu.js";

import { describe, expect, it } from "vitest";

import {
  firstEnabledIndex,
  lastEnabledIndex,
  nextItemIndex,
  prevItemIndex,
  typeaheadIndex,
} from "./menu.js";

const item = (label: string, disabled = false): MenuItemModel => ({ label, disabled });
const gap = (): MenuItemModel => ({ label: "", disabled: true });

describe("firstEnabledIndex / lastEnabledIndex", () => {
  it("finds the first/last enabled, skipping leading/trailing disabled", () => {
    const items = [gap(), item("Alpha"), item("Beta"), gap()];
    expect(firstEnabledIndex(items)).toBe(1);
    expect(lastEnabledIndex(items)).toBe(2);
  });

  it("returns -1 for an all-disabled or empty list", () => {
    expect(firstEnabledIndex([gap()])).toBe(-1);
    expect(lastEnabledIndex([gap()])).toBe(-1);
    expect(firstEnabledIndex([])).toBe(-1);
    expect(lastEnabledIndex([])).toBe(-1);
  });
});

describe("nextItemIndex / prevItemIndex (roving focus)", () => {
  const items = [item("One"), gap(), item("Three"), item("Four")];

  it("moves to the next enabled item, skipping disabled", () => {
    expect(nextItemIndex(items, 0)).toBe(2);
    expect(nextItemIndex(items, 2)).toBe(3);
  });

  it("wraps from the last enabled item to the first", () => {
    expect(nextItemIndex(items, 3)).toBe(0);
  });

  it("moves to the previous enabled item, skipping disabled and wrapping", () => {
    expect(prevItemIndex(items, 2)).toBe(0);
    expect(prevItemIndex(items, 0)).toBe(3);
  });

  it("resolves an unknown current (-1) as first/last enabled", () => {
    expect(nextItemIndex(items, -1)).toBe(0);
    expect(prevItemIndex(items, -1)).toBe(3);
  });
});

describe("typeaheadIndex", () => {
  const items = [item("Edit"), item("Share"), gap(), item("Save"), item("Settings")];

  it("finds the next item starting with the query, case-insensitively", () => {
    expect(typeaheadIndex(items, 1, "s")).toBe(3); // Save (Share is current)
    expect(typeaheadIndex(items, 1, "S")).toBe(3);
    expect(typeaheadIndex(items, 3, "se")).toBe(4); // Settings (matches from Save)
  });

  it("wraps around to items after the current one", () => {
    expect(typeaheadIndex(items, 4, "e")).toBe(0); // Edit
  });

  it("skips disabled items", () => {
    expect(typeaheadIndex([item("Edit"), gap(), item("Save")], 0, "s")).toBe(2);
  });

  it("returns current when nothing matches or the query is empty/blank", () => {
    expect(typeaheadIndex(items, 0, "z")).toBe(0);
    expect(typeaheadIndex(items, 2, "")).toBe(2);
    expect(typeaheadIndex(items, 2, "   ")).toBe(2);
  });
});
