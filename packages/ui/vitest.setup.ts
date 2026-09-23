// Vitest setup (RRU-052): opt into React's `act` environment so the DOM-event
// wrappers in the overlay specs run under a testing-mode `act` without the
// "not configured to support act" warning. Flag documented by React 19.
// Loaded via `setupFiles` in `vitest.config.ts`.
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
