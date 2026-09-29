// Theme model of the playground (RRU-069).
//
// It is the CONSUMER side of the theming contract designed in RRU-024, kept
// deliberately small because the design system does not ship a theme provider:
// theming is a `data-theme` attribute on `<html>` plus the emitted tokens
// (decisión de producto #1, docs/theming.md §3). Three states exist and none is
// the default of the others:
//
//   "system" → no attribute at all, the tokens' `prefers-color-scheme` blocks apply;
//   "light"  → `data-theme="light"`, wins even on a dark OS;
//   "dark"   → `data-theme="dark"`, wins even on a light OS.
//
// The write is a DOM mutation, not React state: the attribute lives outside the
// React tree, which is what makes it impossible for the markup and the applied
// theme to disagree (§5 of the same guide). React only mirrors the *choice* to
// render the pressed state of the switcher.
export type ThemeChoice = "system" | "light" | "dark";

const STORAGE_KEY = "rr-theme";

/** The persisted choice; `"system"` when nothing valid is stored. */
export function readThemeChoice(): ThemeChoice {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    // localStorage can be unavailable (private mode, blocked storage) — the
    // blocking script in index.html has the same fallback, so the app and the
    // first paint always agree on "system".
    return "system";
  }
}

/**
 * Applies and persists a choice. Removing the attribute (instead of writing
 * `data-theme="system"`) is required: the emitted CSS only excludes
 * `:root:not([data-theme="light"])` from the system-dark block, so an explicit
 * "system" value would be a fourth, unsupported state.
 */
export function applyTheme(choice: ThemeChoice): void {
  const root = document.documentElement;

  if (choice === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", choice);
  }

  try {
    if (choice === "system") {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, choice);
    }
  } catch {
    // Persistence is a convenience: the applied theme is already in the DOM.
  }
}
