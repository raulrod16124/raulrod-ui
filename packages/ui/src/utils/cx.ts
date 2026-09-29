/**
 * Class name composition utility (RRU-030).
 * Joins truthy values with a single space, dropping `false`, `null`,
 * `undefined`, `0` and empty strings so callers can write conditional classes
 * inline (`cx("base", isActive && "active")`). Nested arrays are flattened.
 * Zero dependencies by design: no `clsx`/`tailwind-merge` in the MVP (RRU-030
 * DoD); note this utility does NOT deduplicate classes nor merge Tailwind-like
 * conflicts.
 */
export type CxValue = string | number | false | null | undefined | CxValue[];

/** Joins class name values, filtering falsy inputs and flattening arrays. */
export function cx(...inputs: CxValue[]): string {
  return inputs
    .filter((input) => Boolean(input))
    .map((input) => (Array.isArray(input) ? cx(...input) : String(input)))
    .join(" ")
    .trim();
}
