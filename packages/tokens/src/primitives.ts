// Primitive tokens: raw values, theme-agnostic (RRU-020/021/023).
// Naming: `namespace-step` kebab, no dots (color.md §3, token-taxonomy.md §3.1).
// Color primitives: only the steps consumed by a semantic token are emitted
// (color.md §1.5). Spacing (base 4px) and radius primitives are consumed
// *directly* by components (token-taxonomy.md §4/§6, footnote ¹) and therefore
// are not referenced by any semantic — the runtime gate skips color invariants
// (duplicate value / orphan) for non-hex primitives. Value gate lives in
// scripts/check-contrast.mjs.
import type { PrimitiveKey } from "./taxonomy.js";

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

  // Spacing scale, base 4px (guide §10, token-taxonomy.md §3.1). Consumed
  // directly by components as gap/margin/padding; emitted as CSS `px` strings.
  "space-0": "0",
  "space-1": "4px",
  "space-2": "8px",
  "space-3": "12px",
  "space-4": "16px",
  "space-5": "20px",
  "space-6": "24px",
  "space-8": "32px",
  "space-10": "40px",
  "space-12": "48px",
  "space-16": "64px",

  // Radius scale {none, sm, md, lg, full} (guide §10).
  "radius-none": "0",
  "radius-sm": "4px",
  "radius-md": "8px",
  "radius-lg": "12px",
  "radius-full": "9999px",
} as const satisfies Record<PrimitiveKey, string>;

/** Union of the emitted color hex values (single source of truth for semantic
 *  color tokens). Non-hex primitives (`space-*`, `radius-*`) are excluded so a
 *  semantic color can only resolve to a real hex (enforced at compile time). */
export type PrimitiveHex = Extract<(typeof primitives)[keyof typeof primitives], `#${string}`>;
