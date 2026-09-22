// Semantic tokens: intent per theme, light + dark values (RRU-020/021).
import type { SemanticKey } from "./taxonomy.js";

import { primitives, type PrimitiveHex } from "./primitives.js";

// Naming: dot-separated `category.descriptor.specific` (color.md §4/§5). Each
// intent declares light and dark: the theme changes the value, never the intent.
// Values MUST resolve to a primitive (or the fixed inverse `#ffffff`) — enforced
// at compile time via PrimitiveHex and at runtime by scripts/check-contrast.mjs.
export const semantic = {
  "color.background.default": { light: primitives["gray-0"], dark: primitives["gray-950"] },
  "color.background.surface": { light: primitives["gray-50"], dark: primitives["gray-925"] },
  "color.background.sunken": { light: primitives["gray-100"], dark: primitives["gray-900"] },
  "color.text.primary": { light: primitives["gray-950"], dark: primitives["gray-100"] },
  "color.text.muted": { light: primitives["gray-650"], dark: primitives["gray-450"] },
  "color.text.inverse": { light: "#ffffff", dark: "#ffffff" },
  "color.border.default": { light: primitives["gray-300"], dark: primitives["gray-800"] },
  "color.border.strong": { light: primitives["gray-600"], dark: primitives["gray-550"] },
  "color.action.primary.background": {
    light: primitives["blue-600"],
    dark: primitives["blue-600"],
  },
  "color.action.primary.background.hover": {
    light: primitives["blue-700"],
    dark: primitives["blue-700"],
  },
  "color.action.primary.background.active": {
    light: primitives["blue-800"],
    dark: primitives["blue-800"],
  },
  "color.action.primary.text": { light: "#ffffff", dark: "#ffffff" },
  "color.action.secondary.background": {
    light: primitives["gray-100"],
    dark: primitives["gray-900"],
  },
  "color.action.secondary.background.hover": {
    light: primitives["gray-200"],
    dark: primitives["gray-800"],
  },
  "color.action.secondary.text": { light: primitives["gray-900"], dark: primitives["gray-100"] },
  "color.action.destructive.background": {
    light: primitives["red-600"],
    dark: primitives["red-700"],
  },
  "color.action.destructive.background.hover": {
    light: primitives["red-700"],
    dark: primitives["red-800"],
  },
  "color.action.destructive.text": { light: "#ffffff", dark: "#ffffff" },
  "color.action.success.background": {
    light: primitives["green-700"],
    dark: primitives["green-800"],
  },
  "color.action.success.background.hover": {
    light: primitives["green-800"],
    dark: primitives["green-900"],
  },
  "color.action.success.text": { light: "#ffffff", dark: "#ffffff" },
  "color.action.info.background": { light: primitives["sky-700"], dark: primitives["sky-800"] },
  "color.action.info.background.hover": {
    light: primitives["sky-800"],
    dark: primitives["sky-900"],
  },
  "color.action.info.text": { light: "#ffffff", dark: "#ffffff" },
  "color.focus.ring": { light: primitives["blue-550"], dark: primitives["blue-500"] },
} as const satisfies Record<SemanticKey, { light: PrimitiveHex; dark: PrimitiveHex }>;
