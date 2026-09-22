// Primitive tokens: raw values, theme-agnostic (RRU-020/021).
import type { PrimitiveKey } from "./taxonomy.js";

// Naming: `namespace-step` kebab, no dots (color.md §3). Only the steps consumed
// by a semantic token are emitted (color.md §1.5); the AA contrast gate lives in
// scripts/check-contrast.mjs.
export const primitives = {
  "gray-0": "#ffffff",
  "gray-50": "#f7f8fa",
  "gray-100": "#eef1f4",
  "gray-200": "#e3e7ec",
  "gray-300": "#d0d6dd",
  "gray-450": "#98a4b2",
  "gray-550": "#7a8794",
  "gray-600": "#6b7684",
  "gray-650": "#5d6b7a",
  "gray-800": "#3d4650",
  "gray-900": "#2b323b",
  "gray-925": "#1f242b",
  "gray-950": "#171c22",
  "blue-500": "#4c8cff",
  "blue-550": "#155dfc",
  "blue-600": "#2563eb",
  "blue-700": "#1d4ed8",
  "blue-800": "#1e40af",
  "red-600": "#dc2626",
  "red-700": "#b91c1c",
  "red-800": "#991b1b",
  "green-700": "#15803d",
  "green-800": "#166534",
  "green-900": "#14532d",
  "sky-700": "#0369a1",
  "sky-800": "#075985",
  "sky-900": "#0c4a6e",
} as const satisfies Record<PrimitiveKey, string>;

/** Union of the emitted primitive hex values (single source of truth for semantic tokens). */
export type PrimitiveHex = (typeof primitives)[keyof typeof primitives];
