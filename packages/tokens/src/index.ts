// Public API of @raulrod/tokens (RRU-020).
// Single source of truth for token values lives in the layer modules below;
// derived unions (RRU-025) and CSS emission (RRU-024) consume them.
import type { component } from "./component";
import type { primitives } from "./primitives";
import type { semantic } from "./semantic";

export { component } from "./component";
export { primitives } from "./primitives";
export { semantic } from "./semantic";
export type { ComponentKey, PrimitiveKey, SemanticKey, TokenLayer } from "./taxonomy";

export type PrimitiveToken = keyof typeof primitives;
export type SemanticToken = keyof typeof semantic;
export type ComponentToken = keyof typeof component;
