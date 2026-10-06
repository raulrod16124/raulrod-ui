// Queries base (RRU-135) — container-first by default (ADR-008).
// @media is used ONLY for exceptions documented below (Dialog and Toast).
// These helpers return full query strings to avoid leaking CSS syntax details
// to consumers while keeping the surface minimal and token-driven.

import { breakpoints } from "./breakpoints.js";

export const queries = {
  // Container queries (primary mechanism)
  container: {
    sm: `@container (min-width: ${breakpoints.sm})`,
    md: `@container (min-width: ${breakpoints.md})`,
    lg: `@container (min-width: ${breakpoints.lg})`,
    xl: `@container (min-width: ${breakpoints.xl})`,
  },
  // Media queries — exceptions only (Dialog/Toast per ADR-008)
  // media-only: dialog/toast
  media: {
    sm: `@media (min-width: ${breakpoints.sm})`,
    md: `@media (min-width: ${breakpoints.md})`,
    lg: `@media (min-width: ${breakpoints.lg})`,
    xl: `@media (min-width: ${breakpoints.xl})`,
  },
} as const;

export type ContainerQueries = typeof queries.container;
export type MediaQueries = typeof queries.media;
export type Queries = typeof queries;
