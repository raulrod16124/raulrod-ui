import type { ReactNode } from "react";

/**
 * Props of {@link Portal} (RRU-034): renders `children` into a different part
 * of the DOM via React portals, by default `document.body`, without breaking
 * SSR/hydration. Base for Dialog/Popover/Tooltip/Toast. The component renders
 * no element of its own, so there is deliberately no `className`, style,
 * ARIA or DOM-event pass-through here, and no `forwardRef` (refs belong on
 * the consumer's own children, which live in the portal target).
 *
 * No `as`/polymorphic prop in the MVP (closed decision, RRU-031).
 */
export interface PortalProps {
  /** Whatever should be rendered into the portal target. */
  children?: ReactNode;
  /** DOM node to portal into. Defaults to `document.body`. */
  container?: HTMLElement;
}
