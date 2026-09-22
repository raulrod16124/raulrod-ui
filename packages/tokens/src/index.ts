// Public API of @raulrod/tokens (RRU-020).
// Single source of truth for token values lives in the layer modules below;
// derived unions (RRU-025) and CSS emission (RRU-024) consume them.
import type { component } from "./component.js";
import type { primitives } from "./primitives.js";
import type { semantic } from "./semantic.js";

export { component } from "./component.js";
export { primitives } from "./primitives.js";
export { semantic } from "./semantic.js";
export type { ComponentKey, PrimitiveKey, SemanticKey, TokenLayer } from "./taxonomy.js";

export type PrimitiveToken = keyof typeof primitives;
export type SemanticToken = keyof typeof semantic;
export type ComponentToken = keyof typeof component;
