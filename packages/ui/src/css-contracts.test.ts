// The two a11y contracts that RRU-072 put under a gate: `prefers-reduced-motion`
// and contrast.
//
// Both were promises with no mechanical proof. `axe.ts` says so in writing —
// `color-contrast` is disabled in the happy-dom suites because the rule can only
// return `incomplete` there, and the fallback ("the authorized token pairs plus
// the final QA pass") was this card. The tokens gate (RRU-021) proves the pairs
// ON THE TABLE meet AA; it says nothing about the pairs the components actually
// paint, and that is where the two real defects of this card lived
// (`.rr-button--link` painting text with a 3:1-authorized token, and a
// `transform` transition with no reduced-motion escape).
//
// Why SOURCE and not the DOM: these contracts must hold for every state, not
// only the ones a fixture renders. Reading the stylesheet decides all of them at
// once, in both themes, and a component that ships a state nobody renders is
// exactly the state that ships broken. The cost is stated in each gate below:
// what a source-level reader can and cannot see.
import type { CssDeclaration, CssRule } from "./test-support/css-rules.js";
import type { PairKind } from "@raulrod/tokens";

import { afterAll, describe, expect, it } from "vitest";

import {
  authorizedThemes,
  breakpoints,
  component,
  contrastRatio,
  findAuthorizedPair,
  primitives,
  requiredContrast,
  semantic,
} from "@raulrod/tokens";

import {
  at,
  baseSelector,
  declaration,
  isReducedMotion,
  lastDeclaration,
  mediaFeatures,
  parseCssRules,
  tokenNames,
} from "./test-support/css-rules.js";
import { listComponentStylePaths } from "./test-support/css.js";

// --- Token resolution ---------------------------------------------------------
// The emitted custom property name is the token key with `.` → `-`
// (`color.text.primary` → `--rr-color-text-primary`). Building the map from the
// layer keys is exact; reconstructing a key from the dashes of a var name would
// be a guess, because a dash is both a segment separator and part of a word
// (`text-primary`, `background-sunken`, `focus-ring`).
type ThemeName = "light" | "dark";
type ThemeValues = Record<ThemeName, string>;

const varName = (key: string): string => `--rr-${key.replaceAll(".", "-")}`;

const SEMANTIC_BY_VAR = new Map(
  Object.entries(semantic).map(([key, value]) => [varName(key), { key, value }] as const),
);
const COMPONENT_BY_VAR = new Map(
  Object.entries(component).map(([key, value]) => [varName(key), value] as const),
);

/**
 * The semantic intention and the two theme values behind a `var(--rr-…)`
 * reference, following the component layer down to its semantic target
 * (RRU-026: a component token is an atomic alias, never a color of its own).
 * `undefined` for anything that is not a color, which is how a shadow or a
 * duration reference drops out of a contrast pair instead of being misread.
 */
function resolveColor(
  variable: string,
): { readonly key: string; readonly values: ThemeValues } | undefined {
  const semanticEntry = SEMANTIC_BY_VAR.get(variable);
  if (semanticEntry !== undefined) {
    const { value } = semanticEntry;
    if (typeof value !== "object" || value === null || !("light" in value)) return undefined;
    return { key: semanticEntry.key, values: { light: value.light, dark: value.dark } };
  }

  const componentTarget = COMPONENT_BY_VAR.get(variable);
  if (componentTarget === undefined) return undefined;
  const resolved = resolveColor(varName(componentTarget));
  return resolved === undefined ? undefined : { key: resolved.key, values: resolved.values };
}

/**
 * The single color a declaration paints with, or `undefined` if it is not one.
 * A shorthand (`border: 1px solid var(--rr-color-border-strong)`) counts as one
 * paint; a value mixing two colors does not, because then the reader cannot say
 * which one is the boundary and guessing would be worse than skipping.
 */
function colorOf(value: string): string | undefined {
  const names = tokenNames(value);
  return names.length === 1 ? names[0] : undefined;
}

// --- Shared rule helpers -----------------------------------------------------
const stylesheets = await listComponentStylePaths();

/** Rules that can paint: no keyframe frames, no reduced-motion overrides. */
function paintingRules(rules: readonly CssRule[]): CssRule[] {
  return rules.filter((rule) => rule.keyframes === null && !isReducedMotion(rule.media));
}

/** A background that is not a color, so the page shows through behind it. */
function isSeeThrough(value: string): boolean {
  return /\btransparent\b/.test(value) || /color-mix\s*\(/.test(value);
}

// --- Gate 1: prefers-reduced-motion ------------------------------------------
/**
 * Properties whose transition MOVES something. WCAG 2.3.3 (Animation from
 * Interactions, AAA) is the rule of thumb the policy follows: it covers motion,
 * not colour, so a `background-color` fade on hover stays out of scope while
 * anything that translates, rotates, resizes or slides does not.
 */
const MOVEMENT_PROPERTIES = new Set([
  "transform",
  "translate",
  "rotate",
  "scale",
  "width",
  "height",
  "min-width",
  "max-width",
  "min-height",
  "max-height",
  "top",
  "right",
  "bottom",
  "left",
  "inset",
  "margin",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "padding",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "scroll-behavior",
  "perspective",
]);

/**
 * Every property the DS is allowed to transition. The list exists to make the
 * gate fail LOUD on a property nobody classified: `transition: all` in
 * particular would smuggle `transform` past a property-by-property reading, and
 * an unknown property is a decision, not a detail.
 */
const KNOWN_TRANSITION_PROPERTIES = new Set([
  ...MOVEMENT_PROPERTIES,
  "background-color",
  "border-color",
  "color",
  "opacity",
  "box-shadow",
  "fill",
  "stroke",
  "text-decoration-color",
]);

/**
 * One comma item of a `transition` value: the property it fades, and the
 * duration as authored (`undefined` when the item names no time, which the
 * shorthand treats as an initial `0s`).
 */
interface TransitionItem {
  readonly property: string;
  readonly duration: string | undefined;
}

/**
 * The longest a transition may run when it does NOT move anything (RRU-124).
 *
 * RRU-072 decided that a `prefers-reduced-motion` guard covers movement and
 * geometry, not every `transition`: a colour or border fade is an AFFORDANCE —
 * it is how the component says "this changed" — and it does not drive the
 * vestibular symptoms the media query exists for. That exemption is only
 * defensible while the fade is short enough to read as a state change rather
 * than as motion.
 *
 * `motion.duration.fast` (100ms) is that line, and it is the shortest duration
 * token the DS ships, so the policy reads without a number anyone has to keep
 * in sync: a non-movement transition may not outlast the fastest thing we have.
 * Movement keeps `motion.duration.base` because that is a different question —
 * there the guard decides, not the clock.
 */
const PERCEPTIBLE_DURATION_CEILING_MS = 100;

/**
 * A duration in milliseconds, whether authored as a time or as a token.
 * `undefined` for anything that is not one — an easing curve, an unresolvable
 * reference — so the caller can decline to judge instead of guessing.
 */
function durationMs(token: string): number | undefined {
  const authored = /^(\d*\.?\d+)(m?s)$/.exec(token);
  if (authored !== null) {
    const value = Number(authored[1]);
    return authored[2] === "s" ? value * 1000 : value;
  }

  // Follow one level of indirection into the token layer, the same way
  // `resolveColor` does for colours: a component token is an atomic alias.
  const variable = /^var\((--rr-[a-z0-9-]+)\)$/.exec(token)?.[1];
  if (variable === undefined) return undefined;
  const entry = SEMANTIC_BY_VAR.get(variable);
  if (entry === undefined || typeof entry.value !== "string") return undefined;
  return entry.value === token ? undefined : durationMs(entry.value);
}

/**
 * The `transition` value read one comma item at a time. `none` transitions
 * nothing and `all` is rejected outright, so the answer is a list of real
 * properties or an empty one.
 *
 * ONE parser for both jobs (which properties move, how long they run): a
 * second reader could agree with a broken one, and then the gate would pass
 * for the wrong reason.
 */
function transitionItems(value: string): {
  readonly items: readonly TransitionItem[];
  readonly all: boolean;
} {
  const items: TransitionItem[] = [];
  let all = false;
  for (const entry of value.split(",")) {
    const tokens = entry.trim().split(/\s+/).filter(Boolean);
    const first = tokens[0]?.toLowerCase() ?? "";
    if (first === "") continue;
    if (first === "none") continue;
    if (first === "all") {
      all = true;
      continue;
    }
    items.push({
      property: first,
      // The time is whichever remaining token resolves to one; an easing token
      // like `var(--rr-motion-easing-standard)` does not, so this cannot
      // mistake the curve for the clock.
      duration: tokens.slice(1).find((token) => durationMs(token) !== undefined),
    });
  }
  return { items, all };
}

/** Does this declaration switch the animation off? */
function stopsAnimation(value: string): boolean {
  return (
    value === "none" ||
    /var\(--rr-motion-behavior-(reduced|none)\)/.test(value) ||
    /\b0m?s\b/.test(value)
  );
}

/** Does this declaration switch the transition off? */
function stopsTransition(rule: CssRule): boolean {
  return (
    declaration(rule, "transition")?.value === "none" ||
    declaration(rule, "transition-property")?.value === "none" ||
    /^(0m?s|none)$/.test(declaration(rule, "transition-duration")?.value ?? "")
  );
}

/**
 * The selectors a stylesheet neutralizes inside `prefers-reduced-motion`.
 * Both the exact selector and its base are recorded, because a guard written as
 * `.rr-switch-input::after` has to answer for the declaration on
 * `.rr-switch-input::after` and not for a differently-pseudo-classed rule.
 */
function neutralizedSelectors(rules: readonly CssRule[]): Set<string> {
  const neutralized = new Set<string>();
  for (const rule of rules) {
    if (!isReducedMotion(rule.media)) continue;
    const stops =
      stopsAnimation(declaration(rule, "animation")?.value ?? "") ||
      stopsAnimation(declaration(rule, "animation-name")?.value ?? "") ||
      stopsTransition(rule);
    if (!stops) continue;
    for (const selector of rule.selectors) {
      neutralized.add(selector);
      neutralized.add(baseSelector(selector));
    }
  }
  return neutralized;
}

/**
 * The reduced-motion findings for one stylesheet. A function, not an assertion,
 * so the negative probes at the end of this file can audit a stylesheet written
 * on the spot through the SAME reader instead of a second implementation that
 * could agree with a broken gate.
 */
async function reducedMotionProblems(file: string): Promise<string[]> {
  const rules = await parseCssRules(file);
  const neutralized = neutralizedSelectors(rules);
  const problems: string[] = [];

  for (const rule of paintingRules(rules)) {
    if (isReducedMotion(rule.media)) continue;
    const escaped = rule.selectors.some((selector) => neutralized.has(baseSelector(selector)));

    const transition = declaration(rule, "transition");
    if (transition !== undefined) {
      const { items, all } = transitionItems(transition.value);
      if (all) {
        problems.push(
          `${at(rule, transition.line)}: \`transition: all\` hides what moves — list the properties`,
        );
      }
      for (const item of items) {
        const { property } = item;
        if (!KNOWN_TRANSITION_PROPERTIES.has(property)) {
          problems.push(
            `${at(rule, transition.line)}: \`${property}\` is not classified — add it to the policy with its reason`,
          );
        } else if (MOVEMENT_PROPERTIES.has(property) && !escaped) {
          problems.push(
            `${at(rule, transition.line)}: ${property} moves, but no prefers-reduced-motion rule stops it`,
          );
        } else if (!MOVEMENT_PROPERTIES.has(property) && item.duration !== undefined) {
          // Only a non-movement fade is bounded by the clock. A movement
          // transition is a deliberate animation whose length is the design
          // decision, and its reduced-motion escape removes it outright for
          // anyone who needs that — lengthening it is not the fix.
          const ms = durationMs(item.duration);
          if (ms !== undefined && ms > PERCEPTIBLE_DURATION_CEILING_MS) {
            problems.push(
              `${at(rule, transition.line)}: ${property} fades for ${ms}ms, over the ${PERCEPTIBLE_DURATION_CEILING_MS}ms ceiling for anything that does not move — use \`motion.duration.fast\` or drop the transition`,
            );
          }
        }
      }
    }

    const animation = declaration(rule, "animation");
    if (animation !== undefined && !escaped) {
      problems.push(
        `${at(rule, animation.line)}: \`animation\` runs with no prefers-reduced-motion rule stopping it`,
      );
    }
  }

  return problems;
}

describe("reduced motion: every movement transition and every animation has an escape", () => {
  it.each(stylesheets)("%s", async (file) => {
    expect(await reducedMotionProblems(file), `${file} reduced-motion contract`).toEqual([]);
  });
});

// --- Gate 2: contrast --------------------------------------------------------
/**
 * The two surfaces the DS ships. A component that paints no background of its
 * own is on one of them, or on something the consumer composed out of the
 * palette — and no authorized row can exist for a surface the DS does not
 * control, which is why those are judged by number instead of by table.
 */
const PAGE_SURFACES = ["color.background.default", "color.background.surface"] as const;

/**
 * WCAG 2.1 §1.4.3 exempts the disabled look of a control from the contrast
 * requirements, and the DS ships one disabled look for the whole control family
 * (Button.css cites the same exemption). The exemption is therefore decided by
 * STATE, read off the selector, instead of being a list of pairs to silence: a
 * new disabled variant is covered without anyone remembering to exempt it, and
 * a pair that is only ever painted disabled can never hide a real defect
 * elsewhere, because the state that paints it is named in the selector.
 */
const DISABLED = /disabled/;

/** Where a boundary is drawn relative to the element's own fill. */
type Placement = "inside" | "outside";

/**
 * Non-text paints, judged at 3:1 (WCAG 1.4.11 Non-text Contrast), with the
 * placement each property defaults to. Placement decides WHERE a boundary gets
 * its contrast from, and guessing it wrong invents pairs the browser can never
 * produce in either direction.
 *
 * Both default to `outside`, and that is the whole point. A border band straddles
 * the outer edge of the box: what identifies the element is the half the user
 * sees against the SURROUNDING surface. Read against the element's own fill it
 * reports the switch track's `border.strong` on its own `border.strong` fill at
 * 1.00:1, a "defect" made of a hairline matching the surface it is drawn on.
 */
const NON_TEXT_PLACEMENT = new Map<string, Placement>([
  ["border", "outside"],
  ["border-color", "outside"],
  // An outline is painted outside the border box by definition, in the gap
  // `outline-offset` opens, so it also meets the surrounding surface.
  ["outline", "outside"],
  ["outline-color", "outside"],
]);

/**
 * Tokens whose NAME says which surface they are for, and the theme that surface
 * lives in.
 *
 * `color.text.inverse` is white in BOTH themes, so on the light page it measures
 * 1.00:1 — a number that says nothing except that the API is not for the light
 * page. It is for a dark surface the consumer paints (a footer, a hero), and the
 * DS's own darkest surface is `background.default` in the dark theme. Judging it
 * there is what a consumer who follows the API actually gets: 17.13:1.
 */
const SURFACE_NAMED_BY_TOKEN: ReadonlyMap<
  string,
  { readonly surface: string; readonly theme: ThemeName }
> = new Map([["color.text.inverse", { surface: "color.background.default", theme: "dark" }]]);

/**
 * The surface a paint is judged against, in three kinds, because "who owns this
 * surface" decides whether the authorized table applies at all:
 *
 *   - `owned` — the component paints this surface itself, so both sides of the
 *     pair are a DS decision and the pair has to be on the table;
 *   - `page`  — a boundary drawn past the border box, which meets the page. The
 *     DS owns those surfaces too, so the table applies to them;
 *   - `open`  — an absent, `transparent` or `color-mix(…, transparent)` fill, so
 *     the surface underneath shows through and belongs to the consumer. No row
 *     can exist for a surface with no token, so the only question is the number.
 */
type Surface =
  | { readonly kind: "owned"; readonly key: string }
  | { readonly kind: "page" }
  | { readonly kind: "open" };

interface Paint {
  readonly kind: PairKind;
  /** Semantic token key, e.g. `color.text.primary`. */
  readonly key: string;
  /** The property that paints it, which is what makes it text or non-text. */
  readonly property: string;
  /** The declaration that won the cascade, for a failure a human can jump to. */
  readonly line: number;
  /** The rule that won, needed to read the `outline-offset` beside the ring. */
  readonly rule: CssRule;
}

/** One measured pair, whether or not it passed. This is the DoD's artefact. */
interface Judgement {
  readonly file: string;
  readonly where: string;
  readonly kind: PairKind;
  readonly foreground: string;
  readonly surface: string;
  readonly theme: ThemeName;
  readonly ratio: number;
  /** Whether an authorized row governed this judgement, for the report. */
  readonly authorized: boolean;
}

/**
 * Splits a selector into the node it styles, the state of that node and its
 * pseudo-element.
 *
 * The state is read off the LAST compound only, because that is the only place
 * it can live: `[aria-expanded="true"] .rr-select-icon` puts the state on an
 * ANCESTOR, and the icon's own surface does not change with it, so treating the
 * whole selector as the state would invent a state the icon is never in.
 */
function parseSelector(selector: string): {
  readonly element: string;
  readonly state: string;
  readonly pseudoElement: string | null;
} {
  const pseudoElement = /::[a-z-]+$/.exec(selector)?.[0] ?? null;
  const head =
    pseudoElement === null ? selector : selector.slice(0, selector.length - pseudoElement.length);

  const compounds = head.split(/\s+/);
  const last = compounds[compounds.length - 1] ?? head;
  const stateAt = last.search(/[:[]/);
  if (stateAt === -1) return { element: head, state: "", pseudoElement };

  compounds[compounds.length - 1] = last.slice(0, stateAt);
  return {
    element: compounds.filter(Boolean).join(" "),
    state: last.slice(stateAt),
    pseudoElement,
  };
}

/** The rule that paints this node's background in these rules, if any. */
function backgroundRuleOf(rules: readonly CssRule[]): CssRule | undefined {
  // A reverse scan, not `findLast`: the package targets ES2022 (see
  // `lastDeclaration` in css-rules.ts for the same reason).
  for (let index = rules.length - 1; index >= 0; index -= 1) {
    const rule = rules[index];
    if (
      rule !== undefined &&
      (lastDeclaration(rule, "background-color") !== undefined ||
        lastDeclaration(rule, "background") !== undefined)
    ) {
      return rule;
    }
  }
  return undefined;
}

function surfaceOf(rule: CssRule | undefined): Surface {
  if (rule === undefined) return { kind: "open" };
  const declaration =
    lastDeclaration(rule, "background-color") ?? lastDeclaration(rule, "background");
  if (declaration === undefined) return { kind: "open" };
  if (isSeeThrough(declaration.value)) return { kind: "open" };
  const variable = colorOf(declaration.value);
  const resolved = variable === undefined ? undefined : resolveColor(variable);
  return resolved === undefined ? { kind: "open" } : { kind: "owned", key: resolved.key };
}

/**
 * The colors this node paints in one state, with the ones it inherits from its
 * resting rule — the cascade over `{state rules, resting rule}`, source order
 * deciding, which is what the browser does. Reading a state as a separate
 * element is what produced 187 phantom failures: `.rr-button--secondary:hover`
 * keeps the resting `color`, so a hover that changes only the background is
 * still one paint contract with two surfaces.
 */
function paintsOf(cascade: readonly CssRule[]): Paint[] {
  const winning = new Map<string, { declaration: CssDeclaration; rule: CssRule }>();
  for (const rule of cascade) {
    for (const property of ["color", ...NON_TEXT_PLACEMENT.keys()]) {
      const declaration = lastDeclaration(rule, property);
      if (declaration !== undefined) winning.set(property, { declaration, rule });
    }
  }

  const paints: Paint[] = [];
  for (const [property, { declaration, rule }] of winning) {
    // `transparent` paints nothing, so it is not a pair to authorize.
    if (declaration.value === "transparent") continue;
    if (!declaration.value.includes("var(--rr-")) continue;
    // Two colors in one value (`box-shadow`, `border: 1px solid var() var()`)
    // mean the reader cannot say which one is the boundary; skipping is the
    // honest answer and the report says how many paints were judged.
    const variable = colorOf(declaration.value);
    if (variable === undefined) continue;
    const resolved = resolveColor(variable);
    if (resolved === undefined) continue;

    paints.push({
      kind: property === "color" ? "text" : "non-text",
      key: resolved.key,
      property,
      line: declaration.line,
      rule,
    });
  }
  return paints;
}

/**
 * Where this boundary is actually drawn, from the property's placement and then
 * from the offset beside it.
 *
 * Every boundary in the table is `outside`, so the offset only has one case to
 * decide: a NEGATIVE `outline-offset` — the listbox option ring, the one such
 * case in this DS — draws the ring back INSIDE the box, over the option's own
 * fill, and is judged there. Read outside, a ring with a positive offset meets
 * the surrounding surface: judging it against the control's own fill reports a
 * blue ring on a blue button at 1.01:1, which no browser produces.
 */
function placementOf(paint: Paint): Placement {
  if (NON_TEXT_PLACEMENT.get(paint.property) !== "outside") return "inside";
  const offset = lastDeclaration(paint.rule, "outline-offset")?.value ?? "";
  return offset.startsWith("-") ? "inside" : "outside";
}

/**
 * One paint, the surface it was judged on and the theme: the coordinates a
 * defect is filed under. `where` is the selector, its state, the token and the
 * property, WITHOUT `file:line`, so a defect survives a line moving in its
 * stylesheet and a registry entry cannot rot into a stale line reference.
 */
interface JudgedTarget {
  readonly location: string;
  readonly where: string;
  readonly surface: Surface;
  readonly context: string;
}

/**
 * A defect this audit found, registered instead of fixed, with the card that owns
 * it. The registry is a RATCHET, not a suppression list:
 *
 *   - a failing paint that matches no entry is a NEW defect and fails the gate;
 *   - an entry that matches nothing is a FIXED defect and fails the gate too,
 *     because the number has to come down with the fix, not after it.
 *
 * So the gate is green today, goes red the moment anything else breaks, and
 * cannot be kept green by leaving a stale entry behind. Every entry carries the
 * ratio it was measured at, so a token value changing under a registered defect
 * is caught too.
 *
 * **Empty as of RRU-126/127/128** (2026-10-02), which closed the last three
 * entries this registry held: the link text got its own token, and the control
 * boundaries moved off `border.default` and off the primary FILL. The next entry
 * added here is a defect someone chose not to fix, and it has to name the card
 * that owns it.
 */
interface KnownDefect {
  readonly card: string;
  readonly where: RegExp;
  readonly surfaces: readonly string[];
  readonly themes: readonly ThemeName[];
  /** The ratios this was measured at, to 2 decimals. */
  readonly ratios: readonly number[];
  readonly why: string;
}

const KNOWN_DEFECTS: readonly KnownDefect[] = [];

/** Registry index -> how many failing paints it absorbed on this run. */
const knownDefectHits = new Map<number, number>();

function matchesKnownDefect(defect: {
  readonly where: string;
  readonly surface: string;
  readonly theme: ThemeName;
  readonly ratio: number;
}): number {
  return KNOWN_DEFECTS.findIndex(
    (entry) =>
      entry.where.test(defect.where) &&
      entry.surfaces.includes(defect.surface) &&
      entry.themes.includes(defect.theme) &&
      entry.ratios.some((ratio) => Math.abs(ratio - defect.ratio) < 0.01),
  );
}

interface Audit {
  readonly file: string;
  readonly problems: string[];
  readonly judgements: Judgement[];
  /** Node-states that had at least one paint, so a silent no-op cannot pass. */
  readonly judged: number;
}

function themeValues(key: string): ThemeValues | undefined {
  return resolveColor(varName(key))?.values;
}

/** Does this stylesheet declare any paint this gate judges at all? */
function declaresJudgeablePaint(rules: readonly CssRule[]): boolean {
  return paintingRules(rules).some((rule) =>
    ["color", ...NON_TEXT_PLACEMENT.keys()].some(
      (property) => lastDeclaration(rule, property)?.value.includes("var(--rr-") === true,
    ),
  );
}

async function audit(file: string): Promise<Audit> {
  const rules = paintingRules(await parseCssRules(file));

  // node id -> the rules that target it in each of its states.
  const nodes = new Map<
    string,
    {
      readonly element: string;
      readonly pseudoElement: string | null;
      readonly states: Map<string, CssRule[]>;
    }
  >();

  for (const rule of rules) {
    for (const selector of rule.selectors) {
      const { element, state, pseudoElement } = parseSelector(selector);
      const id = `${element}${pseudoElement ?? ""}`;
      const node = nodes.get(id) ?? {
        element,
        pseudoElement,
        states: new Map<string, CssRule[]>(),
      };
      node.states.set(state, [...(node.states.get(state) ?? []), rule]);
      nodes.set(id, node);
    }
  }

  const problems: string[] = [];
  const judgements: Judgement[] = [];
  let judged = 0;

  /**
   * Files a failing paint. A paint that matches the registry is absorbed; one
   * that does not is a new defect and lands in `problems`, which is what the
   * per-stylesheet gate asserts is empty.
   */
  const record = (defect: {
    readonly location: string;
    readonly where: string;
    readonly surface: string;
    readonly theme: ThemeName;
    readonly ratio: number;
    readonly why: string;
  }): void => {
    const known = matchesKnownDefect(defect);
    if (known === -1) {
      problems.push(
        `${defect.location} ${defect.where} on ${defect.surface} [${defect.theme}] — ${defect.ratio.toFixed(2)}:1: ${defect.why}. No known-defect entry covers it, so this is a NEW defect.`,
      );
      return;
    }
    knownDefectHits.set(known, (knownDefectHits.get(known) ?? 0) + 1);
  };

  /**
   * One row per (paint, surface, theme). The surface a paint can land on is a
   * LIST, not a single value, and the theme is its own dimension because a pair
   * can be verified in one theme and forbidden in the other — which is the whole
   * reason `AUTHORIZED_PAIRS` carries an `inDark` flag.
   */
  const judge = (paint: Paint, target: JudgedTarget): void => {
    const { surface, location, where, context } = target;
    const label = `${location} ${where}`;
    const required = requiredContrast(paint.kind);
    const foreground = themeValues(paint.key);
    if (foreground === undefined) {
      problems.push(`${label} — ${paint.key} does not resolve to a color token`);
      return;
    }

    const named = SURFACE_NAMED_BY_TOKEN.get(paint.key);
    const targets: readonly { readonly key: string; readonly theme: ThemeName }[] =
      named !== undefined
        ? [{ key: named.surface, theme: named.theme }]
        : surface.kind === "owned"
          ? [
              { key: surface.key, theme: "light" },
              { key: surface.key, theme: "dark" },
            ]
          : PAGE_SURFACES.flatMap((page) => [
              { key: page, theme: "light" as const },
              { key: page, theme: "dark" as const },
            ]);

    for (const { key, theme } of targets) {
      const background = themeValues(key);
      if (background === undefined) {
        problems.push(`${label} on ${key} — the surface does not resolve to a color token`);
        continue;
      }
      const ratio = contrastRatio(foreground[theme], background[theme]);
      // Per target, not per paint: a boundary drawn outside the box is judged
      // against `background.default` AND `background.surface`, and each of those
      // is a DS surface with its own rows. Resolving the pair once per paint
      // silently dropped the `inDark` check for every outside boundary, which is
      // how a 3.0-authorized token kept being painted in the theme it was never
      // verified in.
      const authorized =
        named === undefined && surface.kind !== "open"
          ? findAuthorizedPair(paint.key, key)
          : undefined;
      judgements.push({
        file,
        where: label,
        kind: paint.kind,
        foreground: paint.key,
        surface: key,
        theme,
        ratio,
        authorized: authorized !== undefined,
      });

      if (authorized === undefined) {
        // A surface the DS paints is a GOVERNANCE question: the pair has to be
        // on the table, because the DS owns both sides of it. A surface nobody
        // owns cannot be in the table at all, so there the only question is the
        // number — and a paint that clears it is not a problem, it is a fact the
        // report records.
        if (surface.kind === "owned" && named === undefined) {
          record({
            location,
            where,
            surface: key,
            theme,
            ratio,
            why: `no authorized row governs this pair (color.md §6)${
              ratio < required
                ? `, and ${ratio.toFixed(2)}:1 is below the ${required.toFixed(1)}:1 it needs`
                : ""
            }: add the pair to AUTHORIZED_PAIRS with these numbers`,
          });
        } else if (ratio < required) {
          record({
            location,
            where,
            surface: key,
            theme,
            ratio,
            why: `below the ${required.toFixed(1)}:1 it needs, because ${target.context}`,
          });
        }
        continue;
      }

      const reason =
        authorized[2] < required
          ? `the table authorizes this pair at ${authorized[2].toFixed(1)}:1, but it is painted as ${
              paint.kind === "text" ? "text, which needs 4.5:1" : "a boundary or focus ring"
            }`
          : !authorizedThemes(authorized)[theme]
            ? `the pair was never verified in the ${theme} theme, so it may not be painted there`
            : `${ratio.toFixed(2)}:1 is below the ${required.toFixed(1)}:1 it needs`;

      if (authorized[2] < required || !authorizedThemes(authorized)[theme] || ratio < required) {
        record({ location, where, surface: key, theme, ratio, why: reason });
      }
    }
  };

  for (const [id, node] of nodes) {
    const resting = node.states.get("") ?? [];
    // A pseudo-element is a DIFFERENT box: `.rr-switch-input::after` (the knob)
    // is painted over the track, so with no background of its own it inherits
    // the host's surface. Merging it into the host's group is what made the
    // switch report a knob fill against a track border.
    const host = nodes.get(node.element);
    const hostResting = host?.states.get("") ?? [];

    for (const [state, stateRules] of node.states) {
      if (DISABLED.test(`${state} ${node.element}`)) continue;

      // Cascade order: the resting rule FIRST and the state rule LAST, so the
      // state overrides it — the browser's order. Reversed, the resting
      // background wins and every hover/active state silently judges as if it
      // were at rest, which is how `.rr-button--secondary:hover` reported the
      // resting gray instead of `action.secondary.background.hover`.
      const cascade = [...resting, ...stateRules];
      const paints = paintsOf(cascade);
      if (paints.length === 0) continue;

      const surface = surfaceOf(
        backgroundRuleOf(cascade) ??
          backgroundRuleOf([...hostResting, ...(host?.states.get(state) ?? [])]),
      );
      judged += 1;

      for (const paint of paints) {
        const target = {
          location: `${file}:${paint.line}`,
          where: `${id}${state}: ${paint.key} (${paint.property})`,
          surface,
          context:
            surface.kind === "open"
              ? "the DS paints no background here, so the surface underneath is the consumer's"
              : "the component paints this surface itself",
        };
        if (placementOf(paint) === "outside") {
          // The boundary is drawn past the border box, so it meets whatever
          // surrounds the control — the page, or a panel the consumer put it in.
          judge(paint, {
            ...target,
            surface: { kind: "page" },
            context: "a boundary painted outside the box is judged against the surfaces around it",
          });
          continue;
        }
        judge(paint, target);
      }
    }
  }

  return { file, problems, judgements, judged };
}

const audits = await Promise.all(stylesheets.map(audit));
const judgements = audits.flatMap((entry) => entry.judgements);

describe("contrast: every paint a component performs is an authorized AA pair", () => {
  it.each(stylesheets)("%s", (file) => {
    const audit = audits.find((entry) => entry.file === file);
    expect(audit, `${file} was not audited`).toBeDefined();
    expect(audit?.problems, `${file} contrast contract`).toEqual([]);
  });

  it("judges a paint for every stylesheet that declares one", async () => {
    // Computed independently of the audit, so a parser that silently stops
    // reading declarations fails here instead of passing by judging nothing.
    const painted = new Set(
      (
        await Promise.all(
          stylesheets.map(async (file) =>
            declaresJudgeablePaint(await parseCssRules(file)) ? file : undefined,
          ),
        )
      ).filter((file): file is string => file !== undefined),
    );
    expect(new Set(judgements.map((judgement) => judgement.file))).toEqual(painted);
  });

  it("judged every paint, not a sample of them", () => {
    // A floor, not the exact count: a new component is expected to move it, and
    // a number that can only go up is what a stopped parser would break.
    expect(judgements.length).toBeGreaterThanOrEqual(600);
  });

  it("ratchets: every registered defect is still failing, and the registry is not padded", () => {
    // The other half of the ratchet. A paint that no entry covers fails the
    // per-stylesheet gate above; an entry that absorbs NOTHING means the defect
    // it names was fixed, and the gate refuses to stay green until the entry is
    // deleted. That is what stops the registry from becoming a place where dead
    // defects are kept on the books.
    const stale = KNOWN_DEFECTS.filter((_, index) => !knownDefectHits.has(index));
    expect(
      stale.map((entry) => `${entry.card} — ${entry.why} (${entry.where})`),
      "these registered defects no longer fail, so delete their entry",
    ).toEqual([]);
  });

  it("reports every failure the registry does not cover", () => {
    // The forward half of the ratchet, paired with the test above: a paint that
    // fails and matches no registered entry lands in `problems`, so this is the
    // half that stops the registry from HIDING a defect (the other stops it from
    // keeping a dead one).
    //
    // It used to assert `absorbed > 0`, which only said anything while the
    // registry was non-empty — after RRU-126/127/128 emptied it, that assertion
    // could only be satisfied by inventing a defect to register. The invariant
    // worth keeping is the direction, not the count.
    const uncovered = audits.flatMap((entry) => entry.problems);
    expect(
      uncovered,
      "a failing paint no registered defect covers: fix it, or register it with the card that owns it",
    ).toEqual([]);
  });
});

// A gate that cannot fail is decoration. Each probe below is a stylesheet
// written to a temp file and audited, so a probe exercises the SAME reader, the
// SAME cascade and the SAME table as the real components. The last two probes are
// COMPLIANT stylesheets: without them, a gate that flagged everything would pass
// this block.
const { mkdtemp, writeFile, rm } = await import("node:fs/promises");
const { tmpdir } = await import("node:os");
const { join } = await import("node:path");

const probeDirectory = await mkdtemp(join(tmpdir(), "rr-css-contract-"));

const auditCss = async (name: string, css: string): Promise<string[]> => {
  const path = join(probeDirectory, name);
  await writeFile(path, css, "utf8");
  const { problems } = await audit(path);
  return problems;
};

afterAll(async () => {
  await rm(probeDirectory, { recursive: true, force: true });
});

describe("the contract is not a no-op (negative probes, ADR-005)", () => {
  it("flags text painted below 4.5:1", async () => {
    // `border.default` as text on the sunken surface: 1.38:1, with no row either.
    const problems = await auditCss(
      "low-text.css",
      `.rr-probe {
  background: var(--rr-color-background-sunken);
  color: var(--rr-color-border-default);
}`,
    );
    expect(problems.length).toBe(2);
    expect(problems.join("\n")).toContain("below the 4.5:1 it needs");
  });

  it("flags a control boundary painted below 3:1", async () => {
    const problems = await auditCss(
      "low-boundary.css",
      `.rr-probe {
  background: var(--rr-color-background-surface);
  border: 1px solid var(--rr-color-border-default);
}`,
    );
    expect(problems.length).toBeGreaterThan(0);
    expect(problems.join("\n")).toContain("color.border.default");
  });

  it("flags a 3:1-authorized token painted as text", async () => {
    // `border.danger` against the page is authorized at 3.0, which is a boundary
    // threshold. Painted as text it needs 4.5:1, and the table's own threshold
    // says so even where the number happens to clear it — this probe is the one
    // that keeps the THIRD column of `AUTHORIZED_PAIRS` load-bearing.
    const problems = await auditCss(
      "boundary-as-text.css",
      `.rr-probe {
  background: var(--rr-color-background-default);
  color: var(--rr-color-border-danger);
}`,
    );
    expect(problems.join("\n")).toContain("painted as text, which needs 4.5:1");
  });

  it("flags a pair the table never verified in a theme", async () => {
    // A boundary, so the threshold check passes and the THEME check is what
    // fires: authorized at 3.0, painted as a boundary, but `inDark: false`.
    const problems = await auditCss(
      "unverified-theme.css",
      `.rr-probe {
  background: var(--rr-color-background-default);
  border: 1px solid var(--rr-color-action-primary-background);
}`,
    );
    expect(problems.join("\\n")).toContain("never verified in the dark theme");
  });

  it("flags an owned surface with no authorized row", async () => {
    const problems = await auditCss(
      "no-row.css",
      `.rr-probe {
  background: var(--rr-color-background-info);
  color: var(--rr-color-text-primary);
}`,
    );
    expect(problems.join("\n")).toContain("no authorized row");
  });

  it("passes a compliant stylesheet untouched", async () => {
    const problems = await auditCss(
      "compliant.css",
      `.rr-probe {
  background: var(--rr-color-action-secondary-background);
  color: var(--rr-color-action-secondary-text);
}

.rr-probe__ring:focus-visible {
  outline: 2px solid var(--rr-color-focus-ring);
  outline-offset: 2px;
}`,
    );
    expect(problems).toEqual([]);
  });

  it("flags a movement transition with no reduced-motion escape", async () => {
    const path = join(probeDirectory, "motion.css");
    await writeFile(path, ".rr-probe {\n  transition: transform 200ms ease;\n}\n", "utf8");
    expect(await reducedMotionProblems(path)).toEqual([expect.stringContaining("transform moves")]);
  });

  it("accepts the same transition with the escape, and a colour fade without it", async () => {
    const path = join(probeDirectory, "motion-ok.css");
    await writeFile(
      path,
      `.rr-probe {
  transition: background-color var(--rr-motion-duration-fast) ease, transform 200ms ease;
}

@media (prefers-reduced-motion: reduce) {
  .rr-probe {
    transition: none;
  }
}
`,
      "utf8",
    );
    expect(await reducedMotionProblems(path)).toEqual([]);
  });

  it("flags a colour or border fade slower than the perceptible ceiling", async () => {
    // The ceiling is what keeps RRU-072's exemption for fades defensible: no
    // reduced-motion escape is required for something that does not move, but
    // only while it is short enough to read as a state change.
    const path = join(probeDirectory, "slow-fade.css");
    await writeFile(
      path,
      `.rr-probe {
  transition: border-color 250ms ease, background-color var(--rr-motion-duration-base) ease;
}
`,
      "utf8",
    );
    const problems = await reducedMotionProblems(path);
    expect(problems).toHaveLength(2);
    expect(problems[0]).toContain("border-color fades for 250ms");
    expect(problems[0]).toContain("over the 100ms ceiling");
    expect(problems[1]).toContain("background-color fades for 200ms");
  });

  it("does not bound movement by the ceiling — its length is the design's call", async () => {
    // Movement is a deliberate animation with a reduced-motion escape, so the
    // clock is not what decides it. `Select` and `Progress` ship `transform`
    // and `width` at `motion.duration.base` and must stay legal; a probe here
    // would forbid the DS's own two slowest transitions.
    const path = join(probeDirectory, "movement-is-not-a-fade.css");
    await writeFile(
      path,
      `.rr-probe {
  transition: transform var(--rr-motion-duration-base) ease, width 300ms linear;
}

@media (prefers-reduced-motion: reduce) {
  .rr-probe {
    transition: none;
  }
}
`,
      "utf8",
    );
    expect(await reducedMotionProblems(path)).toEqual([]);
  });

  it("ignores an easing token that looks like a duration", async () => {
    // `durationMs` walks one level into the token layer to tell a time from a
    // curve. If it ever mistook `var(--rr-motion-easing-standard)` — which
    // resolves to `cubic-bezier(...)` — for a clock, every transition in the
    // DS would read as an unresolvable number and the ceiling would be dead
    // code that never fires. This probe is what keeps it honest.
    const path = join(probeDirectory, "easing-is-not-a-duration.css");
    await writeFile(
      path,
      `.rr-probe {
  transition: background-color var(--rr-motion-duration-fast) var(--rr-motion-easing-standard);
}
`,
      "utf8",
    );
    expect(await reducedMotionProblems(path)).toEqual([]);
  });
});

// --- Responsive contract (RRU-136, ADR-008) ------------------------------------
//
// The gap this closes: `--rr-breakpoint-*` is DOCUMENTARY. CSS custom properties
// cannot be used inside `@media` or `@container`, so the conditions carry px
// literals while the tokens stay the source of truth (theming.md §8). Until this
// gate, nothing connected the two: a `768px` typed by hand would look exactly
// like a `768px` that came from `breakpoint.md`, and the two would drift apart
// silently. EPIC-12's own preamble names this gate as the epic's first
// deliverable; RRU-133 deferred it and RRU-135 did not need it, so RRU-136 is the
// first card that can write a width condition and the first that can enforce one.
//
// Three promises, all decidable by reading the source:
//
//  1. EVERY length in a width condition is a `breakpoint.*` value. The allowed set
//     is derived from `@raulrod/tokens`, never written out here, so adding a
//     breakpoint to the tokens opens the gate without touching this file.
//  2. `@media` for width stays Dialog and Toast only (ADR-008:28). Those two
//     measure the VIEWPORT — a dialog's max height and a toast's offset are
//     viewport geometry — so they are the documented exception. Everything else
//     uses `@container`.
//  3. A `@container` query in a stylesheet that declares no `container-type` never
//     matches. ADR-008:77 names "forgetting the container context" as the epic's
//     first observable risk, and a silent no-op query is the hardest kind of CSS
//     defect to notice: nothing fails, the layout just never changes.

/** The px literals a width condition may use, derived from the tokens themselves. */
const ALLOWED_WIDTH_LITERALS = new Set<string>(Object.values(breakpoints));

/**
 * The two components allowed a width `@media` (ADR-008:28). Matched against the
 * component FOLDER, which is the unit `listComponentStylePaths` yields.
 */
const VIEWPORT_MEDIA_COMPONENTS: ReadonlySet<string> = new Set(["dialog", "toast"]);

/** Features that make a condition a statement about WIDTH rather than about user preference. */
const WIDTH_FEATURES: ReadonlySet<string> = new Set(["min-width", "max-width", "width"]);

/**
 * The at-rule a prelude opens with, e.g. `@container` or `@media`.
 */
function atRuleOf(prelude: string): string {
  return /^@[a-z-]+/.exec(prelude)?.[0] ?? "";
}

/**
 * Every length authored in a condition, with its unit. `min-width: 768px` gives
 * `768px`; `min-width: 48rem` gives `48rem`, which is a different unit and is
 * rejected for the same reason an invented px is — a breakpoint is px here
 * because the tokens are px.
 */
function lengthsIn(prelude: string): readonly string[] {
  return [...prelude.matchAll(/(\d*\.?\d+)(px|em|rem|ch|ex|vw|vh|vmin|vmax|%)/g)].map(
    (match) => `${match[1]}${match[2]}`,
  );
}

/**
 * The width conditions of a stylesheet, one entry per DISTINCT prelude, each with
 * the line of the first rule inside it. A `@container` block repeats its prelude
 * on every child rule, and the gate has to say it once.
 */
function widthConditions(
  rules: readonly CssRule[],
): readonly { readonly prelude: string; readonly line: number }[] {
  const seen = new Map<string, number>();

  for (const rule of rules) {
    const prelude = rule.media;
    if (prelude === null) continue;
    if (!mediaFeatures(prelude).some((feature) => WIDTH_FEATURES.has(feature))) continue;

    const line = rule.declarations[0]?.line ?? 1;
    if (!seen.has(prelude)) seen.set(prelude, line);
  }

  return [...seen].map(([prelude, line]) => ({ prelude, line }));
}

/**
 * What a stylesheet gets wrong about responsive layout, as human-readable lines.
 * `path` is the `src/`-relative name the failure message points at.
 */
function responsiveProblems(path: string, rules: readonly CssRule[]): readonly string[] {
  const problems: string[] = [];
  const folder = path.split("/")[0] ?? path;
  const declaresContainerType = rules.some((rule) =>
    rule.declarations.some((entry) => entry.property === "container-type"),
  );

  for (const { prelude, line } of widthConditions(rules)) {
    const where = `${path}:${line}`;
    const rule = atRuleOf(prelude);

    for (const length of lengthsIn(prelude)) {
      if (!ALLOWED_WIDTH_LITERALS.has(length)) {
        problems.push(
          `${where}: "${prelude}" uses ${length}, which is not a breakpoint token. The width conditions of ${rule} may only use ${[...ALLOWED_WIDTH_LITERALS].join(", ")} (breakpoint.sm/md/lg/xl); CSS variables cannot be read inside a condition (theming.md §8).`,
        );
      }
    }

    if (rule === "@media" && !VIEWPORT_MEDIA_COMPONENTS.has(folder)) {
      problems.push(
        `${where}: ${folder} uses "${prelude}" for width. @media is reserved for ${[...VIEWPORT_MEDIA_COMPONENTS].join(" and ")}, which measure the viewport (ADR-008); everything else reacts to its container with @container.`,
      );
    }

    if (rule === "@container" && !declaresContainerType) {
      problems.push(
        `${where}: "${prelude}" can never match, because ${path} declares no container-type. An element queries its ANCESTORS' containers, so the context has to be established by this stylesheet.`,
      );
    }
  }

  return problems;
}

/** `responsiveProblems` for a file the probes write to disk. */
async function responsiveProblemsIn(path: string): Promise<readonly string[]> {
  return responsiveProblems(path.split("/").pop() ?? path, await parseCssRules(path));
}

describe("responsive: width conditions come from the tokens (RRU-136, ADR-008)", () => {
  it.each(stylesheets)("%s", async (file) => {
    expect(await responsiveProblemsIn(file)).toEqual([]);
  });

  it("reads the at-rules it is judging, and discriminates width from preference", async () => {
    // The coverage proof, and the reason it is not "there is at least one width
    // condition somewhere": as of RRU-136 the package legitimately has ZERO, so
    // a floor on the real stylesheets would be a gate that can only go red — and
    // it would go red the moment RRU-137 adds its first `@container`, which is
    // this epic succeeding. What has to hold forever is that the reader SEES
    // at-rules and tells a statement about width apart from a statement about a
    // user preference, so both halves are proven on a stylesheet that has one of
    // each rather than on whatever the repo happens to contain today.
    const seen = new Set<string>();
    for (const file of stylesheets) {
      for (const rule of await parseCssRules(file)) {
        if (rule.media !== null) seen.add(rule.media);
      }
    }
    expect(seen.size).toBeGreaterThan(0);

    const path = join(probeDirectory, "both-kinds.css");
    await writeFile(
      path,
      `@media (prefers-reduced-motion: reduce) {
  .rr-probe {
    gap: var(--rr-space-2);
  }
}
@media (prefers-color-scheme: dark) {
  .rr-probe {
    gap: var(--rr-space-2);
  }
}
@container (min-width: ${breakpoints.sm}) {
  .rr-probe__item {
    gap: var(--rr-space-2);
  }
}
`,
      "utf8",
    );

    const judged = widthConditions(await parseCssRules(path)).map((entry) => entry.prelude);
    expect(judged).toEqual([`@container (min-width: ${breakpoints.sm})`]);
  });

  it("would accept a width condition written from a token value", async () => {
    const path = join(probeDirectory, "token-width.css");
    await writeFile(
      path,
      `.rr-probe {
  container-type: inline-size;
}
@container (min-width: ${breakpoints.md}) {
  .rr-probe__item {
    gap: var(--rr-space-2);
  }
}
`,
      "utf8",
    );
    expect(await responsiveProblemsIn(path)).toEqual([]);
  });
});

describe("the responsive contract is not a no-op (negative probes, RRU-136)", () => {
  const probe = async (name: string, css: string): Promise<readonly string[]> => {
    const path = join(probeDirectory, name);
    await writeFile(path, css, "utf8");
    return responsiveProblemsIn(path);
  };

  it("flags a width literal that is not a breakpoint", async () => {
    const problems = await probe(
      "invented-width.css",
      `@container (min-width: 700px) {
  .rr-probe {
    gap: var(--rr-space-2);
  }
}
`,
    );
    expect(problems.join("\n")).toContain("700px, which is not a breakpoint token");
  });

  it("flags a width condition authored in a unit the tokens do not use", async () => {
    const problems = await probe(
      "rem-width.css",
      `.rr-probe {
  container-type: inline-size;
}
@container (min-width: 48rem) {
  .rr-probe__item {
    gap: var(--rr-space-2);
  }
}
`,
    );
    expect(problems.join("\n")).toContain("48rem, which is not a breakpoint token");
  });

  it("flags a width @media outside Dialog and Toast", async () => {
    const problems = await probe(
      "viewport-media.css",
      `@media (min-width: ${breakpoints.md}) {
  .rr-probe {
    gap: var(--rr-space-2);
  }
}
`,
    );
    expect(problems.join("\n")).toContain("@media is reserved for dialog and toast");
  });

  it("accepts the documented @media exception for Dialog and Toast", async () => {
    const problems = await probe(
      "dialog-viewport-media.css",
      `@media (min-width: ${breakpoints.md}) {
  .rr-probe {
    gap: var(--rr-space-2);
  }
}
`,
    );
    // Same stylesheet, read as the component it is named after. Without this
    // probe, a gate that flagged every width @media would pass this block.
    expect(
      responsiveProblems(
        "dialog/Dialog.css",
        await parseCssRules(join(probeDirectory, "dialog-viewport-media.css")),
      ),
    ).toEqual([]);
    expect(problems.length).toBeGreaterThan(0);
  });

  it("flags a @container with no container context to match", async () => {
    const problems = await probe(
      "contextless-container.css",
      `@container (min-width: ${breakpoints.lg}) {
  .rr-probe__item {
    gap: var(--rr-space-2);
  }
}
`,
    );
    expect(problems.join("\n")).toContain("declares no container-type");
  });
});

// --- Floating overlays: the viewport bound (RRU-137, ADR-008) -----------------
//
// RRU-136 judged the at-rules. This one judges the DECLARATIONS, and it exists
// because the defect it guards is invisible to every other gate in the repo: a
// floating panel is `position: fixed` with no intrinsic width, so its size is
// shrink-to-fit against the viewport. A 500-character panel therefore opens
// WIDER THAN THE SCREEN, and nothing in the DOM reports it — the panel is
// present, visible, correctly labelled and fully readable by a screen reader. It
// is only wrong to the eye, and only at a width nobody on a laptop will ever
// open.
//
// The bound is the `Toast.css` mold, and this gate pins the three properties that
// make it load-bearing rather than decorative:
//   - `max-inline-size` on all four panels, so no panel can be wider than the
//     viewport minus `space-4` on each side;
//   - `max-block-size` + `overflow: auto` where the panel is keyboard-reachable
//     through its scrollport (Popover, DropdownMenu, and the Select listbox, whose
//     options own the roving tabindex);
//   - and, deliberately, the ABSENCE of a scrollport on Tooltip (see below), so a
//     later change cannot re-add an overflow a keyboard user cannot reach.
//
// RRU-138 adds the Select listbox to the family. It needed the bound MORE than the
// other three, and not only for the width: measured on the E2E before the card,
// the panel was 312px wide on a 320px viewport — 40px wider than the 272px field
// it belongs to, with its right edge exactly on the screen edge — and 328px tall
// against a `max-height` that declared 320px, because without `box-sizing` both
// clamps measure the content box. The options were 24px wider than the panel's
// content box for the same reason, which made the listbox scroll SIDEWAYS.

/** The panels RRU-137/RRU-138 bounded, with the class each one renders. */
const BOUNDED_PANELS: readonly {
  readonly selector: string;
  readonly file: string;
  /** Whether the panel's scrollport is reachable by keyboard. */
  readonly scrollable: boolean;
}[] = [
  { selector: ".rr-popover-content", file: "popover/Popover.css", scrollable: true },
  { selector: ".rr-dropdown-menu", file: "dropdown-menu/DropdownMenu.css", scrollable: true },
  { selector: ".rr-tooltip", file: "tooltip/Tooltip.css", scrollable: false },
  { selector: ".rr-select-listbox", file: "select/Select.css", scrollable: true },
];

/** The last declaration of `property` in the base rule for `selector`. */
function panelDeclaration(
  rules: readonly CssRule[],
  selector: string,
  property: string,
): { readonly value: string; readonly line: number } | undefined {
  const rule = rules.find(
    (entry) => entry.keyframes === null && entry.selectors.includes(selector),
  );
  const found = rule === undefined ? undefined : lastDeclaration(rule, property);
  return found === undefined ? undefined : { value: found.value, line: found.line };
}

/**
 * Why a bounded panel is not bounded, as human-readable lines. `path` is the
 * `src/`-relative name a failure points at.
 */
function panelBoundsProblems(path: string, rules: readonly CssRule[]): readonly string[] {
  const problems: string[] = [];
  const panel = BOUNDED_PANELS.find((entry) => entry.file === path);
  if (panel === undefined) return problems;

  // Checked before the clamps themselves, because it decides what they mean. The
  // package ships no `box-sizing` reset, so without this declaration both
  // `max-*` values resolve against the CONTENT box: the E2E measured a popover
  // 320px wide and 360px tall at a 320×360 viewport (flush with all four edges,
  // past the bound it appeared to declare) and a 416px-wide panel on desktop
  // instead of 384px. Every "fits the viewport" assertion kept passing, which is
  // why this is pinned here rather than left to a comment.
  const boxSizing = panelDeclaration(rules, panel.selector, "box-sizing");
  if (boxSizing?.value !== "border-box") {
    problems.push(
      `${path}: ${panel.selector} declares box-sizing: ${boxSizing?.value ?? "nothing"}, so its max-* clamps measure the content box and the panel ends up flush with the screen edges. Declare "border-box" on the panel root (RRU-137/RRU-138).`,
    );
  }

  const inline = panelDeclaration(rules, panel.selector, "max-inline-size");
  if (inline === undefined) {
    problems.push(
      `${path}: ${panel.selector} has no max-inline-size, so its width is shrink-to-fit against the viewport and a long panel opens wider than the screen (RRU-137/RRU-138).`,
    );
  } else if (!inline.value.includes("100vw")) {
    // Not "any bound is fine": a `max-inline-size: 100%` would resolve against a
    // containing block that a fixed panel does not have, and a fixed `20rem`
    // would still overflow a 320px viewport.
    problems.push(
      `${path}:${inline.line}: max-inline-size is "${inline.value}", which does not clamp against the viewport. A position: fixed panel's containing block is the viewport, so the bound has to name it: min(<durable>, calc(100vw - 2 * var(--rr-space-4))).`,
    );
  }

  const block = panelDeclaration(rules, panel.selector, "max-block-size");
  const overflow = panelDeclaration(rules, panel.selector, "overflow");

  if (panel.scrollable) {
    if (block === undefined) {
      problems.push(
        `${path}: ${panel.selector} has no max-block-size, so a panel taller than the screen cannot scroll (RRU-137/RRU-138).`,
      );
    }
    if (overflow?.value !== "auto") {
      problems.push(
        `${path}: ${panel.selector} declares overflow: ${overflow?.value ?? "nothing"}, so its max-block-size clips the content instead of scrolling it. A bounded block size needs "auto" (RRU-137/RRU-138).`,
      );
    }
  } else if (overflow?.value === "auto") {
    // The deviation, enforced rather than merely documented: this panel is not
    // focusable, so a scrollport here is content no keyboard user can reach.
    problems.push(
      `${path}: ${panel.selector} declares overflow: auto. It is not focusable and not a focus trap, so this scrollport is unreachable by keyboard — the documented deviation is to wrap instead (RRU-137).`,
    );
  }

  return problems;
}

describe("floating overlays: every panel is bounded by the viewport (RRU-137)", () => {
  it.each(BOUNDED_PANELS)("bounds $selector in $file", async ({ file }) => {
    expect(await panelBoundsProblems(file, await parseCssRules(file))).toEqual([]);
  });

  it("judges every panel it claims, and every one it lists really exists", async () => {
    // The coverage proof, so the block above cannot pass by finding nothing: each
    // declared panel is resolved as a real rule that really is fixed-positioned.
    for (const panel of BOUNDED_PANELS) {
      const rules = await parseCssRules(panel.file);
      const rule = rules.find(
        (entry) => entry.keyframes === null && entry.selectors.includes(panel.selector),
      );
      expect(rule, `${panel.file} has no rule for ${panel.selector}`).toBeDefined();
      expect(declaration(rule!, "position")?.value).toBe("fixed");
    }
  });

  it("claims four panels and four panels, no more", () => {
    // The scope floor, so this cannot quietly grow into a repo-wide style rule.
    // Dialog and Toast measure the viewport too, but they are RRU-139's card and
    // they carry their own bounds, and a contract written in two places is a
    // contract that ends up honoured in one.
    const claimed = new Set(BOUNDED_PANELS.map((entry) => entry.file));
    expect(stylesheets.filter((file) => claimed.has(file))).toHaveLength(BOUNDED_PANELS.length);
  });
});

describe("the overlay bound is not a no-op (negative probes, RRU-137)", () => {
  /** Writes a probe stylesheet and judges it the way `file` is judged. */
  const probe = async (name: string, file: string, css: string): Promise<readonly string[]> => {
    const path = join(probeDirectory, name);
    await writeFile(path, css, "utf8");
    return panelBoundsProblems(file, await parseCssRules(path));
  };

  it("flags a panel with no width bound at all", async () => {
    const problems = await probe(
      "unbounded-panel.css",
      "tooltip/Tooltip.css",
      `.rr-tooltip {
  position: fixed;
  left: -9999px;
  top: -9999px;
  box-sizing: border-box;
  padding: var(--rr-space-2) var(--rr-space-3);
}
`,
    );
    expect(problems.join("\n")).toContain("no max-inline-size");
  });

  it("flags a width bound that does not name the viewport", async () => {
    const problems = await probe(
      "percent-panel.css",
      "tooltip/Tooltip.css",
      `.rr-tooltip {
  position: fixed;
  box-sizing: border-box;
  max-inline-size: 100%;
  overflow-wrap: anywhere;
}
`,
    );
    expect(problems.join("\n")).toContain("does not clamp against the viewport");
  });

  it("flags a max-block-size that clips instead of scrolling", async () => {
    const problems = await probe(
      "clipping-panel.css",
      "popover/Popover.css",
      `.rr-popover-content {
  position: fixed;
  box-sizing: border-box;
  max-inline-size: calc(100vw - 2 * var(--rr-space-4));
  max-block-size: calc(100dvh - 2 * var(--rr-space-4));
  overflow: hidden;
}
`,
    );
    expect(problems.join("\n")).toContain("declares overflow: hidden");
  });

  it("flags a scrollable panel with no block bound to scroll", async () => {
    const problems = await probe(
      "unbounded-block.css",
      "dropdown-menu/DropdownMenu.css",
      `.rr-dropdown-menu {
  position: fixed;
  box-sizing: border-box;
  max-inline-size: calc(100vw - 2 * var(--rr-space-4));
  overflow: auto;
}
`,
    );
    expect(problems.join("\n")).toContain("no max-block-size");
  });

  it("flags a clamp that would measure the content box instead of the panel", async () => {
    // The one that is not visible in the stylesheet's own arithmetic: this panel
    // declares both clamps exactly as the tooltip does, and still ends up wider
    // than the bound by its own padding. Only the E2E found it, by measuring the
    // border box.
    const problems = await probe(
      "content-box-panel.css",
      "popover/Popover.css",
      `.rr-popover-content {
  position: fixed;
  max-inline-size: min(calc(var(--rr-space-16) * 6), calc(100vw - 2 * var(--rr-space-4)));
  max-block-size: calc(100dvh - 2 * var(--rr-space-4));
  overflow: auto;
}
`,
    );
    expect(problems.join("\n")).toContain("measure the content box");
  });

  it("rejects the scrollport the tooltip must not have", async () => {
    // Judged as `tooltip/Tooltip.css` on purpose, and the compliant stylesheet in
    // the same test is the same CSS minus the scrollport: without both halves the
    // documented deviation would be indistinguishable from an oversight.
    const withScrollport = await probe(
      "scrolling-tooltip.css",
      "tooltip/Tooltip.css",
      `.rr-tooltip {
  position: fixed;
  box-sizing: border-box;
  max-inline-size: min(calc(var(--rr-space-16) * 6), calc(100vw - 2 * var(--rr-space-4)));
  max-block-size: calc(100dvh - 2 * var(--rr-space-4));
  overflow: auto;
}
`,
    );
    expect(withScrollport.join("\n")).toContain("unreachable by keyboard");

    expect(
      await probe(
        "wrapping-tooltip.css",
        "tooltip/Tooltip.css",
        `.rr-tooltip {
  position: fixed;
  box-sizing: border-box;
  max-inline-size: min(calc(var(--rr-space-16) * 6), calc(100vw - 2 * var(--rr-space-4)));
  overflow-wrap: anywhere;
}
`,
      ),
    ).toEqual([]);
  });
});

// --- The listbox's inner declarations (RRU-138) --------------------------------
//
// Two declarations of the Select that no other gate in the repo would notice
// missing, which is why they are written here rather than left to a comment.
//
// The card's first criterion is the clear case, and RRU-136 already documented the
// rule for it: a declaration whose absence has no observable effect in the CURRENT
// composition is asserted in the authored CSS, because rewriting an E2E to go red
// on it would mean asserting an internal modifier name. `.rr-select-trigger` is a
// `<button>` whose value cell declares its own `min-width: 0`, so the trigger
// already reaches a floor of roughly its own padding today — the floor only
// appears when a consumer puts raw text straight into the trigger. The card's
// premise, that the trigger inherits an `<input>`'s ~177px UA floor, is FALSE: the
// trigger is a button, and measured at 320px the floor is the padding plus the
// chevron. The declaration is still right, and this is where that decision is
// pinned.
//
// The second is the panel-root `box-sizing` contract applied one level down.
// `box-sizing` is not inherited, so `panelBoundsProblems` checking the panel root
// says nothing about `.rr-select-item`, and an item with `width: 100%` plus
// `space-3` padding is 24px wider than the box it fills. Measured before the card:
// the listbox scrolled 24px sideways instead of scrolling its options.

/** Select declarations whose absence is invisible everywhere except this file. */
const SELECT_DECLARATIONS: readonly {
  readonly selector: string;
  readonly file: string;
  readonly property: string;
  readonly value: string;
  readonly why: string;
}[] = [
  {
    selector: ".rr-select-trigger",
    file: "select/Select.css",
    property: "min-width",
    value: "0",
    why: "a flex item is floored at its min-content size, so without this a trigger with raw text children cannot shrink inside a tight row",
  },
  {
    selector: ".rr-select-item",
    file: "select/Select.css",
    property: "box-sizing",
    value: "border-box",
    why: "`width: 100%` plus `space-3` padding makes every option 24px wider than the panel's content box, so the listbox scrolls sideways",
  },
  {
    selector: ".rr-select-item",
    file: "select/Select.css",
    property: "overflow-wrap",
    value: "anywhere",
    why: "an option label with no spaces is the RRU-136 long-label case: wrapping is the policy, and truncating an option is not available",
  },
];

/**
 * What `rules` is missing from `entries`, as readable lines.
 *
 * `entries` is a parameter because the entries share one stylesheet: without it
 * every case in the `it.each` below would receive the same file-wide answer and
 * report three failures for one deleted declaration, which trains people to read
 * past this gate.
 */
function selectDeclarationProblems(
  path: string,
  rules: readonly CssRule[],
  entries: readonly (typeof SELECT_DECLARATIONS)[number][] = SELECT_DECLARATIONS,
): readonly string[] {
  return entries
    .filter((entry) => entry.file === path)
    .filter(
      (entry) => panelDeclaration(rules, entry.selector, entry.property)?.value !== entry.value,
    )
    .map(
      (entry) =>
        `${path}: ${entry.selector} must declare ${entry.property}: ${entry.value}, because ${entry.why} (RRU-138).`,
    );
}

describe("the Select's inner declarations (RRU-138)", () => {
  it.each(SELECT_DECLARATIONS)("$selector declares $property: $value", async (entry) => {
    expect(selectDeclarationProblems(entry.file, await parseCssRules(entry.file), [entry])).toEqual(
      [],
    );
  });

  it("judges every selector it claims, and each one really exists", async () => {
    // The coverage proof, so the block above cannot pass by finding nothing.
    for (const file of new Set(SELECT_DECLARATIONS.map((entry) => entry.file))) {
      const rules = await parseCssRules(file);
      for (const entry of SELECT_DECLARATIONS.filter((declared) => declared.file === file)) {
        expect(
          rules.some((rule) => rule.keyframes === null && rule.selectors.includes(entry.selector)),
          `${file} has no rule for ${entry.selector}`,
        ).toBe(true);
      }
    }
  });
});

describe("the Select contract is not a no-op (negative probes, RRU-138)", () => {
  /**
   * Writes a probe stylesheet and judges it the way `select/Select.css` is judged.
   *
   * Every probe carries the OTHER two declarations in their compliant form, so a
   * probe can only go red for the one thing it is about — the same discipline as
   * the RRU-137 tooltip probe, which contrasts the scrollport against the
   * compliant stylesheet in the same test.
   */
  const probe = async (name: string, css: string): Promise<readonly string[]> => {
    const path = join(probeDirectory, name);
    await writeFile(path, css, "utf8");
    return selectDeclarationProblems("select/Select.css", await parseCssRules(path));
  };

  it("flags a trigger that cannot shrink, and accepts the one that can", async () => {
    const compliant = `
.rr-select-item {
  display: flex;
  width: 100%;
  box-sizing: border-box;
  overflow-wrap: anywhere;
}
`;
    expect(
      (
        await probe(
          "floored-trigger.css",
          `.rr-select-trigger {
  display: inline-flex;
  width: 100%;
}
${compliant}`,
        )
      ).join("\n"),
    ).toContain("min-width: 0");

    expect(
      await probe(
        "shrinking-trigger.css",
        `.rr-select-trigger {
  display: inline-flex;
  width: 100%;
  min-width: 0;
}
${compliant}`,
      ),
    ).toEqual([]);
  });

  it("flags an option whose padding escapes the panel, and one that wraps", async () => {
    const compliant = `
.rr-select-trigger {
  display: inline-flex;
  width: 100%;
  min-width: 0;
}
`;
    const floored = await probe(
      "padded-option.css",
      `.rr-select-item {
  display: flex;
  width: 100%;
  padding: var(--rr-space-2) var(--rr-space-3);
}
${compliant}`,
    );
    expect(floored.join("\n")).toContain("box-sizing: border-box");
    expect(floored.join("\n")).toContain("overflow-wrap: anywhere");

    expect(
      await probe(
        "wrapping-option.css",
        `.rr-select-item {
  display: flex;
  width: 100%;
  box-sizing: border-box;
  overflow-wrap: anywhere;
  padding: var(--rr-space-2) var(--rr-space-3);
}
${compliant}`,
      ),
    ).toEqual([]);
  });
});

// --- The panels whose coordinate space IS the viewport (RRU-139) ----------------
//
// `panelBoundsProblems` above deliberately stops at four panels and says so: its
// two shared assertions (`box-sizing` on the root, a `100vw` term in
// `max-inline-size`) are written for a panel that has NO width of its own, because
// a popover or a listbox is shrink-to-fit. Dialog and Toast are not that shape,
// and copying the gate onto them would have been wrong twice over:
//
//  - Dialog's width is never `100vw`-derived. It is a centred grid item inside a
//    full-bleed overlay whose `padding` is the gutter, so `width: 100%` resolves
//    against the overlay's content box and is already viewport-bounded. A
//    `100vw` term in its `max-inline-size` would be a second, redundant bound that
//    disagrees with the first by the scrollbar.
//  - Toast is bounded with `inset` on BOTH inline edges plus a durable
//    `max-inline-size`, which is the shape `panelBoundsProblems` would reject for
//    lacking `100vw`.
//
// So this is a second contract rather than a fifth entry, and it is a DIFFERENT
// one: these two are bounded by an ARITHMETIC IDENTITY between two declarations
// that live in the same stylesheet, and by the two bugs no width assertion can
// reach.

/** The two viewport-positioned panels, and the gutter each one must reserve. */
const VIEWPORT_PANELS: readonly {
  readonly selector: string;
  readonly file: string;
  /** The selector whose padding (or `top`) defines the gutter the cap owes. */
  readonly gutterFrom: string;
  /** The property on `gutterFrom` the gutter is read from. */
  readonly gutterProperty: "padding" | "top";
  /** The panel's own footer/action row, when it has one. */
  readonly footer: string | undefined;
}[] = [
  {
    selector: ".rr-dialog-content",
    file: "dialog/Dialog.css",
    gutterFrom: ".rr-dialog",
    gutterProperty: "padding",
    footer: ".rr-dialog-footer",
  },
  {
    selector: ".rr-toast-viewport",
    file: "toast/Toast.css",
    gutterFrom: ".rr-toast-viewport",
    gutterProperty: "top",
    footer: undefined,
  },
];

/**
 * `calc(100dvh - 2 * var(--rr-space-N))` → `--rr-space-N`, or `undefined`.
 *
 * Deliberately strict about the shape as well as the token. A cap of
 * `calc(100dvh - var(--rr-space-8))` is the pre-RRU-139 defect verbatim — it is
 * the same arithmetic with one side dropped — and a regex loose enough to accept
 * it would accept the bug it exists to prevent.
 */
const VIEWPORT_CAP = /^calc\(\s*100dvh\s*-\s*2\s*\*\s*var\((--rr-space-\d+)\)\s*\)$/;

/** The one token a declaration names, if it names exactly one. */
function soleToken(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const found = value.match(/var\((--rr-[a-z0-9-]+)\)/g);
  return found?.length === 1 ? found[0].slice(4, -1) : undefined;
}

/**
 * A primitive as a failure message reads it: `space-6 (24px)`.
 *
 * Resolved through the token package rather than written out, so the message
 * cannot go stale if the scale is renumbered — and so the gate is judged against
 * the same values the stylesheet resolves to at runtime.
 */
function describeToken(token: string | undefined): string {
  if (token === undefined) return "nothing";
  const name = token.replace("--rr-", "");
  const px = (primitives as Readonly<Record<string, string>>)[name];
  return px === undefined ? name : `${name} (${px})`;
}

/**
 * What a viewport-positioned panel is getting wrong, as readable lines.
 *
 * Every check below exists because a measurement found it. The measured numbers
 * are in `apps/playground/e2e/viewport-panels.spec.ts`; what they add up to is
 * that neither of these panels can be verified by asserting "inside the
 * viewport", because both defects left the panel's box passing that test while
 * part of it sat outside the screen.
 */
function viewportBoundsProblems(path: string, rules: readonly CssRule[]): readonly string[] {
  const problems: string[] = [];
  const panel = VIEWPORT_PANELS.find((entry) => entry.file === path);
  if (panel === undefined) return problems;

  // Checked before the cap, because it decides what the cap means — but only for
  // the panel it is load-bearing on, which is the one that has padding of its own.
  // The package ships no `box-sizing` reset, so a panel with padding measures
  // `max-block-size` against its CONTENT box: the padding lands outside the cap
  // and the border box comes out at `100dvh` — flush with the screen edges, the
  // exact outcome the overlay's padding exists to prevent. Measured on the Dialog
  // at 320×360: 360px tall, i.e. 24px past the bound on each side.
  // Mutation-checked: deleting that one line turns the E2E's `312` into `360`.
  //
  // The Toast stack is deliberately exempt, and not by oversight: it declares no
  // padding and no `width`, so its border box and content box are the same height
  // and the clamp means the same thing either way. A gate that demanded the line
  // here would be a declaration with no measured reason behind it, which is the
  // one kind of rule this file does not carry.
  const ownPadding =
    panelDeclaration(rules, panel.selector, "padding") ??
    panelDeclaration(rules, panel.selector, "padding-block");
  const boxSizing = panelDeclaration(rules, panel.selector, "box-sizing");
  if (ownPadding !== undefined && boxSizing?.value !== "border-box") {
    problems.push(
      `${path}: ${panel.selector} declares box-sizing: ${boxSizing?.value ?? "nothing"} and padding ${ownPadding.value}, so max-block-size measures the content box, the padding lands outside the cap and the panel ends up flush with the screen edges. Declare "border-box" on the panel root (RRU-139).`,
    );
  }

  // The identity, and the reason this is not a `max-block-size: <something>`
  // assertion. The two numbers are not independent: the overlay reserves a gutter
  // and the panel is allowed the viewport minus that same gutter, so the cap and
  // the gutter must be the SAME token. They were not — the cap subtracted
  // `space-8` (32px) while the overlay reserved `space-6` (24px) — and the panel
  // rendered 376px tall inside a 312px content box, 32px off-screen above and
  // 32px below, because a flex line centres its content and an item taller than
  // the line overflows equally on both sides.
  const cap = panelDeclaration(rules, panel.selector, "max-block-size");
  const capToken = cap?.value.match(VIEWPORT_CAP)?.[1];
  const gutter = soleToken(panelDeclaration(rules, panel.gutterFrom, panel.gutterProperty)?.value);
  if (cap === undefined) {
    problems.push(
      `${path}: ${panel.selector} has no max-block-size, so content taller than the screen cannot scroll inside the viewport (RRU-139).`,
    );
  } else if (capToken === undefined) {
    problems.push(
      `${path}:${cap.line}: max-block-size is "${cap.value}", which does not subtract the gutter from the visual viewport in the form "calc(100dvh - 2 * var(--rr-space-N))". Both halves matter: 100vh counts the browser chrome that a fixed overlay does not cover, and a one-sided subtraction is the pre-RRU-139 defect (RRU-139).`,
    );
  } else if (capToken !== gutter) {
    problems.push(
      `${path}:${cap.line}: max-block-size subtracts ${describeToken(capToken)} but ${panel.gutterFrom}'s ${panel.gutterProperty} reserves ${describeToken(gutter)}. The cap has to be the viewport minus the gutter the panel is actually positioned in: a panel allowed to be taller than the space it sits in overflows on BOTH sides, because the overlay centres its content (RRU-139).`,
    );
  }

  // A cap with no scrollport is a clip, not a bound. Measured on the Toast: 422px
  // of card in a 360px viewport with `overflow-y: visible`, so 78px of the
  // description was unreachable — not clipped by a few pixels, simply gone.
  const scrollport =
    panelDeclaration(rules, panel.selector, "overflow-y") ??
    panelDeclaration(rules, panel.selector, "overflow");
  if (scrollport?.value !== "auto") {
    problems.push(
      `${path}: ${panel.selector} declares ${scrollport === undefined ? "no overflow" : `overflow-y: ${scrollport.value}`}, so its max-block-size clips the content instead of scrolling it. A bounded block size needs "auto" (RRU-139).`,
    );
  }

  // Toast-only: the inline axis, which is where `panelBoundsProblems`' `100vw`
  // rule cannot be reused. `width` sized the stack against a box that INCLUDES
  // the scrollbar while the `inset-inline-end` it was positioned against does
  // not, so below 416px the two disagreed by ~15px. This defect is not
  // reproducible in the E2E — headless Chromium reports `innerWidth ===
  // clientWidth`, reserving no scrollbar space, which is why mutation-check
  // reverting this to `width: min(..., calc(100vw - ...))` leaves all seven specs
  // green. It is pinned here instead, where reading the declaration is the point.
  if (panel.file === "toast/Toast.css") {
    const width = panelDeclaration(rules, panel.selector, "width");
    if (width !== undefined) {
      problems.push(
        `${path}:${width.line}: ${panel.selector} declares width: ${width.value}. Resolve the inline axis with inset instead: 100vw includes the scrollbar and the inset it is positioned against does not, so below the durable term the stack is sized against a wider box than it sits in (RRU-139).`,
      );
    }

    // Both edges, because one edge plus `width` is the pair that has to go: with
    // only the end edge set the stack has no start bound at all, and with `width:
    // auto` and both edges set the box fills the space between them.
    for (const edge of ["inset-inline-start", "inset-inline-end"]) {
      if (panelDeclaration(rules, panel.selector, edge) === undefined) {
        problems.push(
          `${path}: ${panel.selector} has no ${edge}, so its inline size is bounded on one side only and a long notification can reach the opposite edge of the screen (RRU-139).`,
        );
      }
    }

    // And the cap's companion. With both insets set and `width: auto` the box
    // fills the space, and once `max-inline-size` clamps it the FREE SPACE GOES TO
    // THE LEFT in LTR — the stack would sit at `space-4` from the start edge,
    // which is not where a notification region belongs. Mutation-checked:
    // deleting this line moves the 384px card from x = 880 to x = 16 at 1280px.
    if (panelDeclaration(rules, panel.selector, "margin-inline-start")?.value !== "auto") {
      problems.push(
        `${path}: ${panel.selector} must declare margin-inline-start: auto, so the clamped stack keeps hugging the END edge. With both insets set and width: auto the box fills the space, and in LTR the leftover would otherwise go to the start edge (RRU-139).`,
      );
    }
  }

  // Dialog-only, and the one claim in this whole card that no geometry
  // assertion can reach. With `flex-wrap: nowrap` the footer did not overflow —
  // `overflowPx` measured exactly 0 — it CRUSHED: RRU-136's `min-width: 0` and
  // `overflow-wrap: anywhere` let three buttons shrink to ~65px wide and 96–114px
  // tall each, labels wrapped over three and four lines, on a single row as tall
  // as a paragraph. So the E2E asserts the number of ROWS and this asserts the
  // declaration behind it.
  if (panel.footer !== undefined) {
    const wrap = panelDeclaration(rules, panel.footer, "flex-wrap");
    if (wrap?.value !== "wrap") {
      problems.push(
        `${path}: ${panel.footer} declares flex-wrap: ${wrap?.value ?? "nothing"}, so a row of actions narrower than its labels does not wrap — it shrinks each button until its own label wraps instead, which reads as a broken layout rather than a tight one (RRU-139).`,
      );
    }
  }

  return problems;
}

describe("the viewport-positioned panels are bounded by the viewport (RRU-139)", () => {
  it.each(VIEWPORT_PANELS)("bounds $selector in $file", async ({ file }) => {
    expect(await viewportBoundsProblems(file, await parseCssRules(file))).toEqual([]);
  });

  it("judges every panel it claims, and each one really sits in a fixed box", async () => {
    // The coverage proof, so the block above cannot pass by finding nothing.
    for (const panel of VIEWPORT_PANELS) {
      const rules = await parseCssRules(panel.file);
      const rule = rules.find(
        (entry) => entry.keyframes === null && entry.selectors.includes(panel.selector),
      );
      expect(rule, `${panel.file} has no rule for ${panel.selector}`).toBeDefined();

      // Fixed is asserted on `gutterFrom`, NOT on the panel, and the distinction
      // is the whole reason these two are not floating panels. The Toast stack IS
      // the fixed box; the Dialog panel is `position: relative` inside a fixed
      // overlay that reserves the gutter. Both are in a viewport coordinate space
      // — which is what ADR-008's exception reserves `@media` for, and what
      // `100dvh` names — and only the second shape is a "floating panel" the
      // other gate could have judged.
      const fixed = rules.find(
        (entry) => entry.keyframes === null && entry.selectors.includes(panel.gutterFrom),
      );
      expect(fixed, `${panel.file} has no rule for ${panel.gutterFrom}`).toBeDefined();
      expect(
        declaration(fixed!, "position")?.value,
        `${panel.gutterFrom} must be fixed-positioned to be in this contract`,
      ).toBe("fixed");
    }
  });

  it("claims two panels, and the floating-panel gate still claims four", async () => {
    // The scope floor, and the reason the two contracts cannot drift into each
    // other: a panel listed in both would be judged twice by rules written for
    // different shapes, and the first one to disagree would win silently.
    expect(new Set(VIEWPORT_PANELS.map((entry) => entry.file)).size).toBe(VIEWPORT_PANELS.length);
    const both = new Set(VIEWPORT_PANELS.map((entry) => entry.file));
    expect(BOUNDED_PANELS.filter((entry) => both.has(entry.file))).toEqual([]);
  });
});

describe("the viewport bounds are not a no-op (negative probes, RRU-139)", () => {
  /**
   * Writes a probe stylesheet and judges it the way `file` is judged.
   *
   * Every probe carries the OTHER declarations in their compliant form, so a probe
   * can only go red for the one thing it is about — the same discipline as the
   * RRU-137 and RRU-138 probe blocks.
   */
  const probe = async (name: string, file: string, css: string): Promise<readonly string[]> => {
    const path = join(probeDirectory, name);
    await writeFile(path, css, "utf8");
    return viewportBoundsProblems(file, await parseCssRules(path));
  };

  const DIALOG_CSS = `
.rr-dialog {
  position: fixed;
  padding: var(--rr-space-6);
}
.rr-dialog-content {
  position: relative;
  box-sizing: border-box;
  max-block-size: calc(100dvh - 2 * var(--rr-space-6));
  overflow-y: auto;
}
.rr-dialog-footer {
  display: flex;
  flex-wrap: wrap;
}
`;

  // The gutter is read from the panel's OWN `top` here rather than from a wrapper,
  // which is what the `gutterFrom` entry says: the stack insets itself, so the
  // identity is `100dvh - 2 × top`.
  const TOAST_CSS = `
.rr-toast-viewport {
  position: fixed;
  top: var(--rr-space-4);
  inset-inline-start: var(--rr-space-4);
  inset-inline-end: var(--rr-space-4);
  margin-inline-start: auto;
  max-inline-size: calc(var(--rr-space-16) * 6);
  max-block-size: calc(100dvh - 2 * var(--rr-space-4));
  overflow-y: auto;
}
`;

  it("accepts the compliant dialog, then rejects each half of it", async () => {
    expect(await probe("compliant-dialog.css", "dialog/Dialog.css", DIALOG_CSS)).toEqual([]);

    // The pre-card stylesheet, verbatim in the lines that matter — its padding is
    // part of the probe, not decoration, because that is what makes `box-sizing`
    // load-bearing. This is a stylesheet a reviewer would read as perfectly
    // reasonable.
    const before = await probe(
      "pre-card-dialog.css",
      "dialog/Dialog.css",
      `
.rr-dialog {
  position: fixed;
  padding: var(--rr-space-6);
}
.rr-dialog-content {
  position: relative;
  padding: var(--rr-space-6);
  max-height: calc(100vh - var(--rr-space-8));
  overflow-y: auto;
}
.rr-dialog-footer {
  display: flex;
}
`,
    );
    expect(before.join("\n")).toContain("content box");
    // The cap was written as `max-height`, not `max-block-size` — the logical
    // property is the fix's other half, so the probe keeps the old name too and
    // the "no max-block-size" message is the one that fires.
    expect(before.join("\n")).toContain("no max-block-size");
    expect(before.join("\n")).toContain("flex-wrap");

    // The subtler one: the cap written in the CORRECT form but against the
    // wrong gutter. Both declarations look right in isolation, which is exactly
    // why the contract compares them instead of pattern-matching either.
    expect(
      (
        await probe(
          "mismatched-dialog-gutter.css",
          "dialog/Dialog.css",
          `
.rr-dialog {
  position: fixed;
  padding: var(--rr-space-6);
}
.rr-dialog-content {
  position: relative;
  box-sizing: border-box;
  max-block-size: calc(100dvh - 2 * var(--rr-space-8));
  overflow-y: auto;
}
.rr-dialog-footer {
  display: flex;
  flex-wrap: wrap;
}
`,
        )
      ).join("\n"),
    ).toContain("reserves space-6");
  });

  it("flags a one-sided cap, and a cap against the layout viewport", async () => {
    // `calc(100dvh - var(--rr-space-8))`: the same arithmetic with one side
    // dropped. A looser check would read this as compliant.
    expect(
      (
        await probe(
          "one-sided-dialog-cap.css",
          "dialog/Dialog.css",
          DIALOG_CSS.replace(
            "calc(100dvh - 2 * var(--rr-space-6))",
            "calc(100dvh - var(--rr-space-8))",
          ),
        )
      ).join("\n"),
    ).toContain("one-sided subtraction");

    // `100vh` counts the browser chrome a fixed overlay never covers, so with the
    // bar visible the panel hides under it. The E2E cannot see this — there is no
    // browser bar in a headless viewport — so the gate holds it.
    expect(
      (
        await probe("vh-dialog-cap.css", "dialog/Dialog.css", DIALOG_CSS.replace("100dvh", "100vh"))
      ).join("\n"),
    ).toContain("visual viewport");
  });

  it("flags a cap with no scrollport, and a clip pretending to be a bound", async () => {
    // `overflow: hidden` is the more dangerous half: it reads like a deliberate
    // choice, and the content is simply lost.
    expect(
      (
        await probe(
          "clipping-dialog.css",
          "dialog/Dialog.css",
          DIALOG_CSS.replace("overflow-y: auto", "overflow: hidden"),
        )
      ).join("\n"),
    ).toContain('needs "auto"');

    expect(
      (
        await probe(
          "unscrollable-toast.css",
          "toast/Toast.css",
          TOAST_CSS.replace("overflow-y: auto", "pointer-events: none"),
        )
      ).join("\n"),
    ).toContain('needs "auto"');
  });

  it("flags a Toast stack sized against the scrollbar, and one that lost its end edge", async () => {
    // The pre-card Toast, verbatim. This is the one mutation the E2E suite
    // cannot catch: headless Chromium reports `innerWidth === clientWidth`, so
    // `100vw` and the viewport width are the same number there and every geometry
    // spec stays green. The defect is real — the scrollbar is inside `100vw` and
    // outside the inset the stack is positioned against — and it is exactly the
    // kind of claim a source-level gate exists to hold.
    const before = await probe(
      "pre-card-toast.css",
      "toast/Toast.css",
      `
.rr-toast-viewport {
  position: fixed;
  top: var(--rr-space-4);
  inset-inline-end: var(--rr-space-4);
  width: min(calc(var(--rr-space-16) * 6), calc(100vw - 2 * var(--rr-space-4)));
}
`,
    );
    expect(before.join("\n")).toContain("includes the scrollbar");
    expect(before.join("\n")).toContain("inset-inline-start");

    // And the compliant form of the same stylesheet, which the contract accepts —
    // this contrast is what makes the two failures above mean something rather
    // than being what every probe would say anyway.
    expect(await probe("compliant-toast.css", "toast/Toast.css", TOAST_CSS)).toEqual([]);
  });

  it("flags a stack that drifts off the end edge once it is clamped", async () => {
    // The subtle consequence of replacing `width` with two insets: the panel is
    // now correct and WRONG at once — inside the screen, but in the wrong place.
    expect(
      (
        await probe(
          "start-hugging-toast.css",
          "toast/Toast.css",
          TOAST_CSS.replace("  margin-inline-start: auto;\n", ""),
        )
      ).join("\n"),
    ).toContain("END edge");
  });
});

describe("contrast report (the DoD artefact, not a gate)", () => {
  it("summarises what it judged", () => {
    // The full 600+ row table lives in `docs/accessibility/manual-review.md`,
    // regenerated from this data; the test prints the shape of it so a change in
    // coverage is visible without dumping the table on every run.
    const byKind = (kind: PairKind): number =>
      judgements.filter((judgement) => judgement.kind === kind).length;
    const authorized = judgements.filter((judgement) => judgement.authorized).length;
    const absorbed = [...knownDefectHits.entries()].map(
      ([index, count]) => `${KNOWN_DEFECTS[index]?.card}: ${count}`,
    );
    process.stdout.write(
      `\ncontrast: ${judgements.length} pairs judged (${byKind("text")} text, ${byKind("non-text")} non-text), ${authorized} governed by an authorized row, registered defects absorbed -> ${absorbed.join(", ")}\n`,
    );
    expect(judgements.length).toBeGreaterThan(0);
  });
});
