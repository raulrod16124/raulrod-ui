import { useId as useReactId } from "react";

/**
 * Normalizes a raw id fragment (React's `useId` emits `:r0:`) into an
 * alphanumeric core so the result is safe to use anywhere a DOM/CSS
 * identifier is expected (`htmlFor`, `aria-labelledby`, selectors). Pure and
 * deterministic so it can be tested without rendering (RRU-030).
 * @internal exported only for unit checking; not part of the public API.
 */
export function sanitizeId(fragment: string): string {
  return fragment.replace(/:/g, "");
}

/**
 * Stable, SSR-safe unique id generator for wiring accessible relationships
 * (labels, described-by, error messages). Wraps React's `useId`, namespacing
 * the raw fragment under a caller-provided prefix (default `rr`).
 */
export function useId(prefix = "rr"): string {
  const raw = useReactId();
  return `${prefix}-${sanitizeId(raw)}`;
}
