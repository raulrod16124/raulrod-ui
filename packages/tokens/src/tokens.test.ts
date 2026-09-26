// Token + color gate for @raulrod/tokens (RRU-021, extended by RRU-022/023/024/
// 025/026; tracked as a real test suite in RRU-068).
//
// Enforces, over the single source of truth:
//   1. naming contract per layer (primitive `namespace-step`, semantic
//      `category.descriptor(.specific)`, component `component.variant.property`);
//   2. value shapes per primitive namespace and per semantic domain
//      (font/motion/breakpoint/shadow/z, typography.md §2–§5);
//   3. component layer = atomic aliases to an existing semantic `color.*` token,
//      never a raw value and never two aliases sharing a target (RRU-026);
//   4. color lineage: every semantic color resolves to a primitive (or the fixed
//      inverse `#ffffff`), and no color primitive is orphaned;
//   5. WCAG AA contrast for every authorized pair, light + dark (color.md §6).
//
// `collectTokenProblems` is a pure function, so the suite also feeds it
// deliberately broken fixtures: a gate that has never been seen failing is not
// evidence of anything. That replaces the manual negative probes done in past
// sessions with a permanent, automated self-check.
import type { SemanticColorPair, SemanticLayerValue, TokenLayers } from "./taxonomy.js";

import { describe, expect, it } from "vitest";

import { component, primitives, semantic } from "./index.js";

const FIXED_INVERSE = "#ffffff";
const HEX_RE = /^#[0-9a-f]{6}$/i;
// Segments may start with a digit (`font.size.2xs`) and contain internal hyphens
// (`font.numeric.tabular-nums`). First segment starts with a letter. Min 2
// segments so single-role keys (`shadow.sm`, `z.modal`, `breakpoint.sm`) are valid.
const SEMANTIC_KEY_RE = /^[a-z]+(\.[a-z0-9-]+)+$/;
const PRIMITIVE_KEY_RE = /^[a-z]+-[a-z0-9]+$/;
// Component keys: dot-separated `component.variant.property(.state)`, min 3
// segments (taxonomy.ts ComponentKey), first segment starts with a letter.
const COMPONENT_KEY_RE = /^[a-z]+(\.[a-z0-9-]+){2,}$/;
// Length values: `0` or a positive integer with a px unit (`4px`, `9999px`).
const LENGTH_RE = /^[1-9]\d*px$/;
const FONT_TRACKING_RE = /^-?(?:0|[1-9]\d*)(?:\.\d+)?em$/;

const isLengthValue = (value: string): boolean => value === "0" || LENGTH_RE.test(value);

type ValueRule = (value: SemanticLayerValue | string | number) => boolean;

const FONT_DOMAIN_RULES: Record<string, ValueRule> = {
  family: (value) => typeof value === "string" && value.length > 0,
  size: (value) => typeof value === "number" && Number.isInteger(value) && value > 0,
  weight: (value) => typeof value === "number" && value >= 100 && value <= 900,
  leading: (value) => typeof value === "number" && value > 0,
  tracking: (value) => typeof value === "string" && (value === "0" || FONT_TRACKING_RE.test(value)),
  numeric: (value) => typeof value === "string" && value.length > 0,
};

// Value-shape rule per `motion.<specifier>` segment (RRU-023). behavior.* mirrors
// the `prefers-reduced-motion` affordance emitted by RRU-024.
const MOTION_SPECIFIER_RULES: Record<string, ValueRule> = {
  duration: (value) => typeof value === "string" && /^\d+ms$/.test(value),
  easing: (value) => typeof value === "string" && value.length > 0,
  behavior: (value) => value === "auto" || value === "none",
};

const RADIUS_STEPS = new Set(["none", "sm", "md", "lg", "full"]);

// Value-shape rule per primitive namespace that is NOT a color (RRU-023). The
// {none,sm,md,lg,full} radius step set is enforced on the key in the loop below.
const PRIMITIVE_NAMESPACE_RULES: Record<string, (value: string) => boolean> = {
  space: (value) => isLengthValue(value) && (value === "0" || parseInt(value, 10) % 4 === 0),
  radius: (value) => isLengthValue(value),
};

const SEMANTIC_DOMAIN_RULES: Record<string, ValueRule | Record<string, ValueRule>> = {
  font: FONT_DOMAIN_RULES,
  motion: MOTION_SPECIFIER_RULES,
  breakpoint: (value) => typeof value === "number" && Number.isInteger(value) && value > 0,
  shadow: (value) => typeof value === "string" && value.length > 0,
  z: (value) => typeof value === "number" && Number.isInteger(value) && value >= 0,
};

// --- WCAG 2.1 relative luminance and contrast ratio --------------------------
function parseHex(hex: string): [number, number, number] {
  const match = HEX_RE.exec(hex);
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

export function luminance(hex: string): number {
  const [r, g, b] = parseHex(hex);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function contrastRatio(foreground: string, background: string): number {
  const first = luminance(foreground);
  const second = luminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

// --- Authorized contrast pairs (color.md §6) ---------------------------------
// [foreground, background, threshold, appliesToLight, appliesToDark]
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
  ["color.action.primary.text", "color.action.primary.background", 4.5, true, true],
  ["color.action.primary.text", "color.action.primary.background.hover", 4.5, true, true],
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

function isThemePair(value: SemanticLayerValue | undefined): value is SemanticColorPair {
  return typeof value === "object" && value !== null && "light" in value && "dark" in value;
}

/**
 * Runs every structural contract over the three layers and returns the list of
 * violations (empty ⇒ the token set is valid).
 */
export function collectTokenProblems(layers: TokenLayers): string[] {
  const { primitives: primitiveLayer, semantic: semanticLayer, component: componentLayer } = layers;
  const problems: string[] = [];

  const primitiveValueOrigin = new Map<string, string>();
  for (const [key, value] of Object.entries(primitiveLayer)) {
    if (!PRIMITIVE_KEY_RE.test(key))
      problems.push(`primitive key breaks naming contract: "${key}"`);
    if (typeof value === "string" && HEX_RE.test(value)) {
      // Color primitive: unique value + consumed-by-semantic invariants below.
      const origin = primitiveValueOrigin.get(value);
      if (origin)
        problems.push(`primitives "${origin}" and "${key}" share the same value (${value})`);
      primitiveValueOrigin.set(value, key);
      continue;
    }
    const [namespace = "", step = ""] = key.split("-");
    const rule = PRIMITIVE_NAMESPACE_RULES[namespace];
    if (!rule) {
      problems.push(`primitive "${key}" is not a known namespace (color/space/radius)`);
    } else if (typeof value !== "string" || !rule(value)) {
      problems.push(
        `primitive "${key}" (${JSON.stringify(value)}) breaks the "${namespace}" value contract`,
      );
    }
    if (namespace === "radius" && !RADIUS_STEPS.has(step)) {
      problems.push(
        `radius primitive "${key}" step "${step}" not in {${[...RADIUS_STEPS].join(", ")}}`,
      );
    }
  }

  const colorTokens = new Map<string, SemanticColorPair>();
  for (const [key, value] of Object.entries(semanticLayer)) {
    if (!SEMANTIC_KEY_RE.test(key)) problems.push(`semantic key breaks naming contract: "${key}"`);
    if (key.startsWith("color.")) {
      if (!isThemePair(value)) {
        problems.push(
          `semantic color "${key}" must declare a {light, dark} pair, got ${JSON.stringify(value)}`,
        );
        continue;
      }
      colorTokens.set(key, value);
      continue;
    }
    const [domain = "", specifier = ""] = key.split(".");
    const rules = SEMANTIC_DOMAIN_RULES[domain];
    if (!rules) {
      problems.push(
        `semantic token "${key}" is not in a known domain (color/font/breakpoint/shadow/motion/z)`,
      );
      continue;
    }
    const rule = typeof rules === "function" ? rules : rules[specifier];
    if (!rule) {
      problems.push(
        `semantic token "${key}" has unknown specifier "${specifier}" in domain "${domain}"`,
      );
    } else if (!rule(value)) {
      problems.push(
        `semantic token "${key}" (${JSON.stringify(value)}) breaks the "${domain}${specifier ? `.${specifier}` : ""}" value contract`,
      );
    }
  }

  // Component layer (RRU-026): each key is an atomic alias whose value must resolve
  // to an existing semantic `color.*` token. No raw values (hex/px/…) and no
  // duplicated targets — an alias always stays a real consumed state.
  const componentTargetCount = new Map<string, number>();
  for (const [key, ref] of Object.entries(componentLayer)) {
    if (!COMPONENT_KEY_RE.test(key)) {
      problems.push(`component key breaks naming contract: "${key}"`);
    }
    if (!ref.startsWith("color.")) {
      problems.push(`component token "${key}" must reference a color.* semantic, got "${ref}"`);
    }
    if (!(ref in semanticLayer)) {
      problems.push(`component token "${key}" references unknown semantic "${ref}"`);
      continue;
    }
    componentTargetCount.set(ref, (componentTargetCount.get(ref) ?? 0) + 1);
  }
  for (const [ref, occurrences] of componentTargetCount) {
    if (occurrences > 1) {
      problems.push(
        `component tokens share the semantic "${ref}" (${occurrences}×) — de-duplicate`,
      );
    }
  }

  const colorPrimitiveValues = new Set(
    Object.values(primitiveLayer).filter(
      (value): value is string => typeof value === "string" && HEX_RE.test(value),
    ),
  );
  for (const [key, pair] of colorTokens) {
    for (const theme of ["light", "dark"] as const) {
      const value = pair[theme];
      if (!HEX_RE.test(value)) {
        problems.push(`semantic "${key}.${theme}" is not a hex value: ${value}`);
      } else if (!colorPrimitiveValues.has(value) && value !== FIXED_INVERSE) {
        problems.push(
          `semantic "${key}.${theme}" (${value}) does not resolve to a primitive nor the fixed inverse`,
        );
      }
    }
  }

  const consumedValues = new Set<string>();
  for (const pair of colorTokens.values()) {
    consumedValues.add(pair.light).add(pair.dark);
  }
  for (const [key, value] of Object.entries(primitiveLayer)) {
    // Non-hex primitives (space-*, radius-*) are consumed directly by components
    // (token-taxonomy.md §4) and are intentionally not referenced by a semantic.
    if (typeof value !== "string" || !HEX_RE.test(value)) continue;
    if (!consumedValues.has(value)) {
      problems.push(`orphan primitive not consumed by any semantic: "${key}"`);
    }
  }

  return problems;
}

/** Contrast problems for the authorized pairs that apply to each theme. */
export function collectContrastProblems(
  layers: TokenLayers,
  pairs: readonly AuthorizedPair[] = AUTHORIZED_PAIRS,
): string[] {
  const problems: string[] = [];
  const resolve = (key: string, theme: "light" | "dark"): string | undefined => {
    const value = layers.semantic[key];
    return isThemePair(value) ? value[theme] : undefined;
  };

  for (const [foreground, background, threshold, inLight, inDark] of pairs) {
    const fgPair = layers.semantic[foreground];
    const bgPair = layers.semantic[background];
    if (!isThemePair(fgPair) || !isThemePair(bgPair)) {
      problems.push(`pair references an unknown token: ${foreground} / ${background}`);
      continue;
    }
    for (const [theme, enabled] of [
      ["light", inLight],
      ["dark", inDark],
    ] as const) {
      if (!enabled) continue;
      const ratio = contrastRatio(
        resolve(foreground, theme) as string,
        resolve(background, theme) as string,
      );
      if (ratio < threshold) {
        problems.push(
          `${foreground} over ${background} (${theme}): ${ratio.toFixed(2)}:1 < ${threshold}:1 (AA)`,
        );
      }
    }
  }

  return problems;
}

const tokens: TokenLayers = { primitives, semantic, component };

describe("token contracts (naming, value shapes, component layer, color lineage)", () => {
  it("reports no violation on the real token set", () => {
    expect(collectTokenProblems(tokens)).toEqual([]);
  });
});

describe("contrast: WCAG AA on every authorized pair (color.md §6)", () => {
  it.each(AUTHORIZED_PAIRS)(
    "%s over %s (light: %s / dark: %s) meets %s:1",
    (foreground, background, threshold, inLight, inDark) => {
      const themes: Array<[string, boolean]> = [
        ["light", inLight],
        ["dark", inDark],
      ];
      for (const [theme, enabled] of themes) {
        if (!enabled) continue;
        const pair = semantic[foreground as keyof typeof semantic];
        const backgroundPair = semantic[background as keyof typeof semantic];
        expect(isThemePair(pair), `${foreground} must be a color pair`).toBe(true);
        expect(isThemePair(backgroundPair), `${background} must be a color pair`).toBe(true);
        if (!isThemePair(pair) || !isThemePair(backgroundPair)) continue;
        const ratio = contrastRatio(
          pair[theme as "light" | "dark"],
          backgroundPair[theme as "light" | "dark"],
        );
        expect(
          ratio,
          `${foreground} over ${background} (${theme}) is ${ratio.toFixed(2)}:1, needs ${threshold}:1`,
        ).toBeGreaterThanOrEqual(threshold);
      }
    },
  );

  it("reports no violation for the whole authorized set", () => {
    expect(collectContrastProblems(tokens)).toEqual([]);
  });
});

describe("WCAG math", () => {
  it("computes 21:1 for black on white and 1:1 for a color on itself", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#3b82f6", "#3b82f6")).toBeCloseTo(1, 5);
  });
});

describe("gate self-check: the contracts actually detect violations", () => {
  // A gate never observed failing proves nothing. Each case feeds a fixture with
  // exactly one defect and asserts the matching problem is reported.
  const base: TokenLayers = {
    primitives: {
      "gray-0": "#ffffff",
      "gray-900": "#111827",
      "space-4": "16px",
      "radius-md": "8px",
    },
    semantic: {
      "color.background.default": { light: "#ffffff", dark: "#111827" },
      "color.text.primary": { light: "#111827", dark: "#ffffff" },
      "font.size.base": 16,
      "motion.duration.fast": "100ms",
    },
    component: { "button.primary.background": "color.background.default" },
  };

  it("flags a primitive key that breaks the naming contract", () => {
    const problems = collectTokenProblems({
      ...base,
      primitives: { ...base.primitives, "Gray 0": "#ffffff" },
    });
    expect(
      problems.some((problem) =>
        problem.includes('primitive key breaks naming contract: "Gray 0"'),
      ),
    ).toBe(true);
  });

  it("flags a space primitive off the 4px base", () => {
    const problems = collectTokenProblems({
      ...base,
      primitives: { ...base.primitives, "space-5": "18px" },
    });
    expect(problems.some((problem) => problem.includes('breaks the "space" value contract'))).toBe(
      true,
    );
  });

  it("flags two primitives sharing the same color value", () => {
    const problems = collectTokenProblems({
      ...base,
      primitives: { ...base.primitives, "gray-1": "#ffffff" },
    });
    expect(problems.some((problem) => problem.includes("share the same value (#ffffff)"))).toBe(
      true,
    );
  });

  it("flags an unknown radius step", () => {
    const problems = collectTokenProblems({
      ...base,
      primitives: { ...base.primitives, "radius-xl": "16px" },
    });
    expect(problems.some((problem) => problem.includes('step "xl" not in'))).toBe(true);
  });

  it("flags a semantic key with a single segment", () => {
    const problems = collectTokenProblems({ ...base, semantic: { ...base.semantic, text: "x" } });
    expect(
      problems.some((problem) => problem.includes('semantic key breaks naming contract: "text"')),
    ).toBe(true);
  });

  it("flags a value that breaks its domain contract", () => {
    const problems = collectTokenProblems({
      ...base,
      semantic: { ...base.semantic, "motion.duration.fast": "100" },
    });
    expect(
      problems.some((problem) => problem.includes('breaks the "motion.duration" value contract')),
    ).toBe(true);
  });

  it("flags a component token pointing at a non-color or unknown semantic", () => {
    expect(
      collectTokenProblems({
        ...base,
        component: { "button.primary.background": "font.size.base" },
      }).some((problem) => problem.includes("must reference a color.* semantic")),
    ).toBe(true);
    expect(
      collectTokenProblems({
        ...base,
        component: { "button.primary.background": "color.text.missing" },
      }).some((problem) => problem.includes("references unknown semantic")),
    ).toBe(true);
  });

  it("flags two component tokens sharing the same semantic target", () => {
    const problems = collectTokenProblems({
      ...base,
      component: {
        "button.primary.background": "color.background.default",
        "button.secondary.background": "color.background.default",
      },
    });
    expect(problems.some((problem) => problem.includes("de-duplicate"))).toBe(true);
  });

  it("flags an orphan color primitive", () => {
    const problems = collectTokenProblems({
      ...base,
      primitives: { ...base.primitives, "gray-950": "#0b1220" },
    });
    expect(problems.some((problem) => problem.includes("orphan primitive not consumed"))).toBe(
      true,
    );
  });

  it("flags a semantic color that resolves to no primitive", () => {
    const problems = collectTokenProblems({
      ...base,
      semantic: { ...base.semantic, "color.border.danger": { light: "#ff0000", dark: "#ff0000" } },
    });
    expect(problems.some((problem) => problem.includes("does not resolve to a primitive"))).toBe(
      true,
    );
  });

  it("flags a pair below the AA threshold and only in the enabled themes", () => {
    const problems = collectContrastProblems(
      {
        primitives: { "gray-0": "#ffffff", "gray-500": "#9ca3af" },
        semantic: {
          "color.background.default": { light: "#ffffff", dark: "#ffffff" },
          "color.text.muted": { light: "#9ca3af", dark: "#9ca3af" },
        },
        component: {},
      },
      [["color.text.muted", "color.background.default", 4.5, true, false]],
    );
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("(light)");
    expect(problems[0]).toMatch(/\d\.\d{2}:1 < 4\.5:1/);
  });

  it("flags a pair that references an unknown token", () => {
    const problems = collectContrastProblems(base, [
      ["color.text.ghost", "color.background.default", 4.5, true, true],
    ]);
    expect(problems).toEqual([
      "pair references an unknown token: color.text.ghost / color.background.default",
    ]);
  });
});
