// Contrast POLICY of the token system (color.md §6 and §7), as code.
//
// Why this module exists: the WCAG formula and the authorized-pair table were
// born inside `tokens.test.ts` (RRU-021), when the only thing to check was the
// palette. RRU-072 then had to check the OTHER half of the promise — the pairs
// the component stylesheets actually paint — and a spec file is not importable
// across a package boundary (`tsconfig.build.json` excludes tests from `dist/`).
// Duplicating the table would have created a second source of truth that the
// tokens gate and the component gate could disagree about silently.
//
// So the policy lives in the package and the specs consume it. The rule it
// encodes is the governance one from color.md §7: a component may only paint a
// pair that is on the table, and a pair that is on the table carries the
// threshold it was VERIFIED at — using a 3:1-authorized token as text is a
// violation even when the number happens to pass.

/** A `#RRGGBB` value. The primitive color layer is restricted to this shape. */
export const COLOR_HEX_RE = /^#[0-9a-f]{6}$/i;

/**
 * WCAG 2.1 §1.4.3 (AA) thresholds. 4.5:1 for text, 3:1 for the boundary of a
 * control and for a focus indicator (1.4.11 Non-text Contrast).
 */
export const TEXT_CONTRAST_MIN = 4.5;
export const NON_TEXT_CONTRAST_MIN = 3;

/** What a paint is judged as, which decides the threshold it must meet. */
export type PairKind = "text" | "non-text";

/** The threshold a paint of this kind must meet in a theme. */
export function requiredContrast(kind: PairKind): number {
  return kind === "text" ? TEXT_CONTRAST_MIN : NON_TEXT_CONTRAST_MIN;
}

// --- WCAG 2.1 relative luminance and contrast ratio --------------------------
function parseHex(hex: string): [number, number, number] {
  const match = COLOR_HEX_RE.exec(hex);
  if (!match) throw new Error(`"${hex}" is not a #RRGGBB hex`);
  return [
    parseInt(match[0].slice(1, 3), 16),
    parseInt(match[0].slice(3, 5), 16),
    parseInt(match[0].slice(5, 7), 16),
  ];
}

function toLinear(channel: number): number {
  const srgb = channel / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

/** WCAG 2.1 relative luminance of a `#RRGGBB` color. */
export function luminance(hex: string): number {
  const [r, g, b] = parseHex(hex);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** WCAG 2.1 contrast ratio between two `#RRGGBB` colors: 1 (identical) … 21. */
export function contrastRatio(foreground: string, background: string): number {
  const first = luminance(foreground);
  const second = luminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

// --- Authorized contrast pairs (color.md §6) ---------------------------------
/**
 * `[foreground, background, threshold, appliesToLight, appliesToDark]`.
 *
 * The threshold is the one the pair was verified at, not a default: a pair with
 * 3.0 is a control boundary or a focus ring, and painting it as text is out of
 * contract even if it numerically clears 4.5. `appliesToDark: false` means the
 * combination was never verified in the dark theme and must not be painted
 * there.
 */
export type AuthorizedPair = readonly [
  foreground: string,
  background: string,
  threshold: number,
  inLight: boolean,
  inDark: boolean,
];

export const AUTHORIZED_PAIRS: readonly AuthorizedPair[] = [
  ["color.text.primary", "color.background.default", 4.5, true, true],
  ["color.text.primary", "color.background.surface", 4.5, true, true],
  // Table row hover (RRU-065): the body row fills background.sunken on hover
  // under the same text.primary — color.md §6.1 rows (15.11:1 light /
  // 11.42:1 dark).
  ["color.text.primary", "color.background.sunken", 4.5, true, true],
  ["color.text.muted", "color.background.default", 4.5, true, true],
  ["color.text.muted", "color.background.surface", 4.5, true, true],
  ["color.text.danger", "color.background.default", 4.5, true, true],
  ["color.text.danger", "color.background.surface", 4.5, true, true],
  // Neutral Badge (RRU-049): reuses sunken + muted instead of dedicated tokens —
  // color.md §6.1 rows (4.81:1 light / 5.11:1 dark).
  ["color.text.muted", "color.background.sunken", 4.5, true, true],
  // Status tints for Badge/Toast (RRU-049, deferred from RRU-021 — color.md
  // §5.3/§6.1): soft tint background + dark text, AA ≥4.5 in both themes.
  ["color.text.success", "color.background.success", 4.5, true, true],
  ["color.text.warning", "color.background.warning", 4.5, true, true],
  ["color.text.info", "color.background.info", 4.5, true, true],
  ["color.text.destructive", "color.background.destructive", 4.5, true, true],
  ["color.action.secondary.text", "color.action.secondary.background", 4.5, true, true],
  ["color.action.secondary.text", "color.action.secondary.background.hover", 4.5, true, true],
  // Hover/active fills painted by the transparent variants (RRU-072): the ghost,
  // outline and pagination-item hover reuse the secondary fill under the resting
  // text.primary — color.md §6.1 rows (15.11:1 light / 11.42:1 dark, and
  // 13.80:1 / 8.46:1 for the hover step).
  ["color.text.primary", "color.action.secondary.background", 4.5, true, true],
  ["color.text.primary", "color.action.secondary.background.hover", 4.5, true, true],
  ["color.action.primary.text", "color.action.primary.background", 4.5, true, true],
  ["color.action.primary.text", "color.action.primary.background.hover", 4.5, true, true],
  // The pressed step of the primary fill, under the primary text — color.md §6.1
  // row (8.72:1 in both themes).
  ["color.action.primary.text", "color.action.primary.background.active", 4.5, true, true],
  ["color.action.destructive.text", "color.action.destructive.background", 4.5, true, true],
  ["color.action.destructive.text", "color.action.destructive.background.hover", 4.5, true, true],
  ["color.action.success.text", "color.action.success.background", 4.5, true, true],
  ["color.action.success.text", "color.action.success.background.hover", 4.5, true, true],
  ["color.action.info.text", "color.action.info.background", 4.5, true, true],
  ["color.action.info.text", "color.action.info.background.hover", 4.5, true, true],
  ["color.border.strong", "color.background.default", 3.0, true, true],
  ["color.border.danger", "color.background.default", 3.0, true, true],
  ["color.focus.ring", "color.background.default", 3.0, true, true],
  ["color.focus.ring", "color.background.surface", 3.0, true, true],
  ["color.action.primary.background", "color.background.default", 3.0, true, false],
  ["color.action.primary.background", "color.background.surface", 3.0, true, false],
  ["color.action.destructive.background", "color.background.default", 3.0, true, false],
];

/**
 * The authorized row for a foreground/background combination of semantic token
 * keys, or `undefined` when the combination is not on the table at all.
 *
 * Component-layer tokens (`button.primary.background`) must be resolved to their
 * semantic target before calling this: the table is written in semantic
 * intentions, which is also the vocabulary of color.md §6.
 */
export function findAuthorizedPair(
  foreground: string,
  background: string,
): AuthorizedPair | undefined {
  return AUTHORIZED_PAIRS.find((pair) => pair[0] === foreground && pair[1] === background);
}

/** The themes a pair was verified in, as `Record<"light" | "dark", boolean>`. */
export function authorizedThemes(pair: AuthorizedPair): Record<"light" | "dark", boolean> {
  return { light: pair[3], dark: pair[4] };
}
