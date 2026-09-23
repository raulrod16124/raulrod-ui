// Derived token unions (RRU-025).
// Domain-level unions for component props, derived from the single source of
// truth (the `as const` layer modules). No literals are hand-duplicated here:
// every union is an `Extract<…>` over the emitted keys, so adding/removing a
// token (RRU-021/022/023) reshapes props types of consuming components without
// touching this file.
//
// Primitive domains match the kebab `namespace-step` naming (`space-4`,
// `radius-md`); semantic domains match the dot-separated `category.descriptor`
// naming (`font.size.2xs`, `breakpoint.sm`). See taxonomy.ts and
// docs/token-taxonomy.md §3. Consumed by `@raulrod/ui` components (e.g.
// `Spacing` in Stack/Inline gap, RRU-031) and documented in docs/typescript.md §8.
import type { primitives } from "./primitives.js";
import type { semantic } from "./semantic.js";

type PrimitiveToken = keyof typeof primitives;
type SemanticToken = keyof typeof semantic;

/** Spacing scale steps (base 4px), e.g. `space-4` → 16px. */
export type Spacing = Extract<PrimitiveToken, `space-${string}`>;

/** Radius scale steps: `radius-none` | `radius-sm` | `radius-md` | `radius-lg` | `radius-full`. */
export type Radius = Extract<PrimitiveToken, `radius-${string}`>;

/** Font size scale (`font.size.*`), e.g. `font.size.base`. */
export type TypeScale = Extract<SemanticToken, `font.size.${string}`>;

/** Font weight (`font.weight.*`): regular, medium, semibold, bold. */
export type FontWeight = Extract<SemanticToken, `font.weight.${string}`>;

/** Line-height (`font.leading.*`): none, tight, normal, relaxed. */
export type FontLeading = Extract<SemanticToken, `font.leading.${string}`>;

/** Letter-spacing (`font.tracking.*`): tight, normal, wide. */
export type FontTracking = Extract<SemanticToken, `font.tracking.${string}`>;

/** Font family (`font.family.*`): sans | mono. */
export type FontFamily = Extract<SemanticToken, `font.family.${string}`>;

/** Numeric font variant (`font.numeric.*`): tabular-nums. */
export type FontNumeric = Extract<SemanticToken, `font.numeric.${string}`>;

/** Breakpoints (`breakpoint.*`): sm | md | lg | xl. */
export type Breakpoint = Extract<SemanticToken, `breakpoint.${string}`>;

/** Elevation scale (`shadow.*`): sm | md. */
export type Shadow = Extract<SemanticToken, `shadow.${string}`>;

/** Motion duration (`motion.duration.*`): fast | base | slow. */
export type MotionDuration = Extract<SemanticToken, `motion.duration.${string}`>;

/** Motion easing (`motion.easing.*`): standard | enter | exit. */
export type MotionEasing = Extract<SemanticToken, `motion.easing.${string}`>;

/** Motion behaviour (`motion.behavior.*`): default | reduced. */
export type MotionBehavior = Extract<SemanticToken, `motion.behavior.${string}`>;

/** Z-index roles (`z.*`): base | overlay | modal | toast. */
export type ZIndex = Extract<SemanticToken, `z.${string}`>;

/** Semantic text colors (`color.text.*`): primary | muted | inverse. */
export type ColorText = Extract<SemanticToken, `color.text.${string}`>;

/** Semantic background colors (`color.background.*`): default | surface | sunken. */
export type ColorBackground = Extract<SemanticToken, `color.background.${string}`>;

/** Semantic border colors (`color.border.*`): default | strong. */
export type ColorBorder = Extract<SemanticToken, `color.border.${string}`>;
