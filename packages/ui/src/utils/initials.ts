// Initials derivation for Avatar (RRU-050). Internal module: not exported
// from the package root (docs/typescript.md §4). Pure and deterministic so it
// can be unit-checked without rendering (pattern RRU-030). Rules (decision of
// session 2026-09-23): single word → its first letter; two or more words →
// the first letter of the first and the last word; trimmed + uppercased;
// empty (or only whitespace) → "?".
export function getInitials(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);
  const first = words[0];
  if (first === undefined) return "?";
  if (words.length === 1) return first.charAt(0).toUpperCase();
  // `words.length >= 2` here, but noUncheckedIndexedAccess keeps the index
  // possibly-undefined — guard instead of a cast (docs/typescript.md §6).
  const last = words[words.length - 1];
  if (last === undefined) return first.charAt(0).toUpperCase();
  return (first.charAt(0) + last.charAt(0)).toUpperCase();
}
