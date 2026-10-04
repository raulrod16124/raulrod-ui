// Breakpoints primitives (RRU-135) — container-first baseline per ADR-008.
// Values are integers in px (semantic token shape `breakpoint.*` currently
// uses numbers; this layout contract is exported as `string` values to be
// convenient for both CSS and runtime usage). Keep this in sync with the
// canonical semantic `breakpoint.*` set (sm/md/lg/xl) to avoid divergence.

export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
} as const;

export type BreakpointKey = keyof typeof breakpoints;
export type BreakpointValue = (typeof breakpoints)[BreakpointKey];
