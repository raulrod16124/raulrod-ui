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
  component,
  contrastRatio,
  findAuthorizedPair,
  requiredContrast,
  semantic,
} from "@raulrod/tokens";

import {
  at,
  baseSelector,
  declaration,
  isReducedMotion,
  lastDeclaration,
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
