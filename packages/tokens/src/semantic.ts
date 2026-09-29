// Semantic tokens: intent per theme (RRU-020/021).
// Naming: dot-separated `category.descriptor[.specific]` (color.md §4/§5,
// token-taxonomy.md §3.2). Color intents declare light and dark — the theme
// changes the value, never the intent — and MUST resolve to a primitive (or the
// fixed inverse `#ffffff`), enforced at compile time via PrimitiveHex and at
// runtime by scripts/check-contrast.mjs. Non-color domains (font.*, breakpoint.*,
// shadow.*, motion.*, z.*) are theme-agnostic scalars (string | number) validated
// by the same runtime gate.
import type { SemanticKey } from "./taxonomy.js";

import { primitives, type PrimitiveHex } from "./primitives.js";

/** Value shapes accepted by semantic tokens: color pairs or theme-agnostic scalars. */
export type SemanticValue = { light: PrimitiveHex; dark: PrimitiveHex } | string | number;

export const semantic = {
  "color.background.default": { light: primitives["gray-0"], dark: primitives["gray-950"] },
  "color.background.surface": { light: primitives["gray-50"], dark: primitives["gray-925"] },
  "color.background.sunken": { light: primitives["gray-100"], dark: primitives["gray-900"] },
  "color.text.primary": { light: primitives["gray-950"], dark: primitives["gray-100"] },
  "color.text.muted": { light: primitives["gray-650"], dark: primitives["gray-450"] },
  "color.text.inverse": { light: "#ffffff", dark: "#ffffff" },
  // Error/danger text (RRU-044): light uses red-600 (AA 4.83:1 over default,
  // 4.54:1 over surface); dark needs a LIGHTER step — red-600 is 3.55:1 on the
  // dark bg (fails AA) — so it flips to red-400 (6.19:1 / 5.64:1). Same
  // "theme changes the value, not the intent" model as muted (gray-650/450).
  "color.text.danger": { light: primitives["red-600"], dark: primitives["red-400"] },
  "color.border.default": { light: primitives["gray-300"], dark: primitives["gray-800"] },
  "color.border.strong": { light: primitives["gray-600"], dark: primitives["gray-550"] },
  // Invalid/danger border (RRU-043): red-600 clears AA ≥3:1 against surface in
  // both themes (4.54 light / 3.23 dark — verified by check-contrast.mjs).
  "color.border.danger": { light: primitives["red-600"], dark: primitives["red-600"] },
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
  // Disabled control state (RRU-041): one generic intent shared by every
  // disabled control. WCAG 1.4.3 exempts disabled controls from contrast, so
  // these pairs are deliberately NOT in the check-contrast PAIRS allowlist
  // (color.md §6 note); values reuse existing gray steps so no primitive is
  // added speculatively (token-taxonomy §1, RRU-026/041).
  "color.action.disabled.background": {
    light: primitives["gray-100"],
    dark: primitives["gray-800"],
  },
  "color.action.disabled.text": {
    light: primitives["gray-650"],
    dark: primitives["gray-450"],
  },
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
  // Status tints for Badge/Toast (RRU-049, deferred from RRU-021 — color.md
  // §5.3/§6.1). Soft background + darker text per intent: the theme flips the
  // VALUE (light bg/tint → dark bg/tint), never the intent. Each pair clears AA
  // ≥4.5 in both themes (verified by the PAIRS table of check-contrast.mjs).
  // `color.text.destructive` coexists with `color.text.danger` (RRU-044): the
  // former is the dark tint text (red-900/red-300), the latter the bright error
  // text (red-600/red-400) over default/surface.
  "color.text.success": { light: primitives["green-900"], dark: primitives["green-300"] },
  "color.background.success": { light: primitives["green-100"], dark: primitives["green-950"] },
  "color.text.warning": { light: primitives["amber-900"], dark: primitives["amber-400"] },
  "color.background.warning": { light: primitives["amber-100"], dark: primitives["amber-950"] },
  "color.text.info": { light: primitives["sky-900"], dark: primitives["sky-300"] },
  "color.background.info": { light: primitives["sky-100"], dark: primitives["sky-950"] },
  "color.text.destructive": { light: primitives["red-900"], dark: primitives["red-300"] },
  "color.background.destructive": { light: primitives["red-100"], dark: primitives["red-950"] },
  "color.focus.ring": { light: primitives["blue-550"], dark: primitives["blue-500"] },

  // Typography (RRU-022): theme-agnostic scalars from docs/typography.md §2–§5.
  // font.size.* in px; font.weight.* unitless; font.leading.* unitless;
  // font.tracking.* as em-suffixed letter-spacing strings; font.numeric.* a CSS
  // `font-variant-numeric` value. Static scale (fluid type excluded from MVP).
  "font.family.sans": "'Inter', 'Helvetica Neue', Arial, sans-serif",
  "font.family.mono": "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace",
  "font.size.2xs": 12,
  "font.size.xs": 13,
  "font.size.sm": 14,
  "font.size.base": 16,
  "font.size.lg": 20,
  "font.size.xl": 25,
  "font.size.2xl": 31,
  "font.size.3xl": 39,
  "font.size.4xl": 49,
  "font.size.5xl": 61,
  "font.weight.regular": 400,
  "font.weight.medium": 500,
  "font.weight.semibold": 600,
  "font.weight.bold": 700,
  "font.leading.none": 1,
  "font.leading.tight": 1.25,
  "font.leading.normal": 1.5,
  "font.leading.relaxed": 1.75,
  "font.tracking.tight": "-0.01em",
  "font.tracking.normal": "0",
  "font.tracking.wide": "0.05em",
  "font.numeric.tabular-nums": "tabular-nums",

  // Breakpoints (RRU-023): semantic role names, integer px (token-taxonomy.md §3.2).
  "breakpoint.sm": 640,
  "breakpoint.md": 768,
  "breakpoint.lg": 1024,
  "breakpoint.xl": 1280,

  // Shadow (RRU-023): small elevation scale as CSS box-shadow strings.
  "shadow.sm": "0 1px 2px rgb(0 0 0 / 0.06), 0 1px 3px rgb(0 0 0 / 0.10)",
  "shadow.md": "0 4px 6px rgb(0 0 0 / 0.07), 0 10px 20px rgb(0 0 0 / 0.10)",

  // Motion (RRU-023): duration (ms strings), easing (cubic-bezier) and
  // reduced-motion behaviour. RRU-024 emits behavior.* under
  // `@media (prefers-reduced-motion: reduce)`.
  "motion.duration.fast": "100ms",
  "motion.duration.base": "200ms",
  "motion.duration.slow": "350ms",
  "motion.easing.standard": "cubic-bezier(0.2, 0, 0, 1)",
  "motion.easing.enter": "cubic-bezier(0, 0, 0.2, 1)",
  "motion.easing.exit": "cubic-bezier(0.4, 0, 1, 1)",
  "motion.behavior.default": "auto",
  "motion.behavior.reduced": "none",

  // Z-index (RRU-023): semantic roles, integer stacking order.
  "z.base": 0,
  "z.overlay": 100,
  "z.modal": 200,
  "z.toast": 300,
} as const satisfies Record<SemanticKey, SemanticValue>;
