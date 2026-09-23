// Naming contract of the token taxonomy (RRU-020).
// Authoritative reference: docs/token-taxonomy.md §3.
// Each layer key MUST follow its layer convention; the derived unions
// (PrimitiveToken / SemanticToken / ComponentToken) feed RRU-025 props types.

export type TokenLayer = "primitive" | "semantic" | "component";

/** Primitive keys: `namespace-step` in kebab, no dots (e.g. `blue-500`, `space-4`, `radius-md`). */
export type PrimitiveKey = `${string}-${string}`;

/** Semantic keys: dot-separated `category.descriptor(.specific)`, min 2 segments
 *  (e.g. `color.text.muted`, `shadow.sm`, `z.modal`, `breakpoint.sm`); segments
 *  may contain digits and internal hyphens (`font.size.2xs`,
 *  `font.numeric.tabular-nums`). Two segments suffice for single-role keys;
 *  three for composed intents (RRU-023 relaxed the contract from min 3). Charset
 *  enforced at runtime by scripts/check-contrast.mjs. */
export type SemanticKey = `${string}.${string}`;

/** Component keys: dot-separated `component.variant.property(.state)` (e.g. `button.primary.background.hover`). */
export type ComponentKey = `${string}.${string}.${string}`;
