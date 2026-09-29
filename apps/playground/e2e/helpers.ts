// Shared helpers for the E2E suite (RRU-069).
//
// Two rules shape this file:
//
//  1. LOCATORS ARE WRITTEN THE WAY A USER FINDS THINGS. Role, name and visible
//     text only. `data-testid` exists here and in the app, but only for nodes
//     that have no accessible identity of their own (a row of icon buttons, a
//     state readout). Asserting on `rr-*` class names would couple the suite to
//     the design system's internals: renaming a class would break tests that
//     were proving behaviour, not styling.
//  2. NO ARBITRARY WAITS. Every wait is a condition (`toBeVisible`, `toHaveCSS`)
//     that auto-retries, so a slow run is a slow run and a broken run is red.
import type { Page } from "@playwright/test";

import { expect } from "@playwright/test";

/** Loads the playground and waits for React to have painted something real. */
export async function openPlayground(page: Page): Promise<void> {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "RaulRod UI" })).toBeVisible();
}

/** The element that currently has focus, described well enough to assert on. */
export function activeElement(page: Page) {
  return page.evaluate(() => {
    const active = document.activeElement;
    if (active === null) return null;
    return {
      tag: active.tagName.toLowerCase(),
      testId: active.getAttribute("data-testid"),
      text: (active.textContent ?? "").trim(),
      role: active.getAttribute("role"),
    };
  });
}
