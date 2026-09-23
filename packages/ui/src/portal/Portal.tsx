import type { PortalProps } from "./Portal.types.js";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { resolvePortalContainer } from "../utils/portal.js";

const subscribeToNothing = (): (() => void) => () => {};

/**
 * Mount-gate that is `false` on the server AND on the first client render
 * (hydration), flipping to `true` only after hydration completes. Backed by
 * `useSyncExternalStore`: the renderer consults the *server* snapshot — which
 * stays `false` — both during serialization and before hydration on the
 * client, so the initial markup always matches (no hydration error, card DoD
 * #2); only after the hydration commit does React read the *client* snapshot
 * (`true`) and re-render once to render the portal. This is the canonical
 * pure form of a hydration flag: no `setState` inside an effect (the
 * `react-hooks/set-state-in-effect` gate), no side effects in `getSnapshot`,
 * and no visible frame gap — the flip is a post-hydration synchronous pass.
 */
function useMounted(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
}

/**
 * SSR-safe portal primitive (RRU-034): renders `children` into
 * `document.body` by default (or a `container`-provided DOM node) once the
 * component has mounted on the client (see {@link useMounted} for the
 * hydration strategy). This is the radix-by-default strategy for primitives
 * whose consumers are typically closed/unmounted at initial render (Dialog,
 * Popover, Tooltip, Toast) and avoids rendering in place and then moving the
 * subtree afterwards.
 *
 * No element of its own is rendered, so there is no ref or `as`/polymorphic
 * prop (MVP rule, RRU-031): focus/a11y management belongs to the consumer's
 * content inside the portal target.
 */
export function Portal({ children, container }: PortalProps) {
  const mounted = useMounted();

  if (!mounted) {
    return null;
  }

  return createPortal(children, resolvePortalContainer(container));
}
Portal.displayName = "Portal";
