// Naming contract of the token taxonomy (RRU-020).
// Authoritative reference: docs/token-taxonomy.md §3.
// Each layer key MUST follow its layer convention; the derived unions
// (PrimitiveToken / SemanticToken / ComponentToken) feed RRU-025 props types.

export type TokenLayer = "primitive" | "semantic" | "component";

/** Primitive keys: `namespace-step` in kebab, no dots (e.g. `blue-500`, `space-4`, `radius-md`). */
export type PrimitiveKey = `${string}-${string}`;

/** Semantic keys: dot-separated `category.descriptor.specific` (e.g. `color.text.muted`). */
export type SemanticKey = `${string}.${string}.${string}`;

/** Component keys: dot-separated `component.variant.property(.state)` (e.g. `button.primary.background.hover`). */
export type ComponentKey = `${string}.${string}.${string}`;
