// Internal portal container resolver for the `Portal` primitive (RRU-034).
// Internal module: not exported from the package root (docs/typescript.md §4).
// Splitting the "body by default, `container` wins" decision out of the
// component keeps it pure testable glue and means `Portal.tsx` never touches
// the global `document` during serialization — the default is only resolved
// once the component is mounted on the client, so SSR never throws and never
// emits markup (hydration-safe by construction, see the card notes).

/**
 * Returns the DOM node React should portal into: the caller-supplied
 * `container` when present, otherwise `document.body`. Intended to be called
 * only on the client, after the component has mounted, so the `document`
 * fallback is never evaluated during server rendering.
 */
export function resolvePortalContainer(container?: HTMLElement): HTMLElement {
  return container ?? document.body;
}
