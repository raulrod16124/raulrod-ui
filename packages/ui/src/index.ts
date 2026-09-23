/* eslint-disable import-x/export -- `export *` from @raulrod/icons intentionally
   overlaps the local exports: ESM gives explicit exports precedence over star
   exports, so `Heading`/`Text` resolve to OUR components and the same-named
   lucide icons stay reachable via @raulrod/icons (ADR-007, RRU-041). */
export { cx } from "./utils/cx.js";
export type { CxValue } from "./utils/cx.js";
export { useId } from "./utils/use-id.js";
export { Inline } from "./inline/index.js";
export type { InlineProps } from "./inline/index.js";
export { Stack } from "./stack/index.js";
export type { StackProps } from "./stack/index.js";
export { Heading } from "./heading/index.js";
export type { HeadingLevel, HeadingProps } from "./heading/index.js";
export { Text } from "./text/index.js";
export type { TextProps } from "./text/index.js";
export { VisuallyHidden } from "./visually-hidden/index.js";
export type { VisuallyHiddenProps } from "./visually-hidden/index.js";
export { Portal } from "./portal/index.js";
export type { PortalProps } from "./portal/index.js";
export { Button } from "./button/index.js";
export type { ButtonProps, ButtonSize, ButtonVariant } from "./button/index.js";
export { IconButton } from "./icon-button/index.js";
export type { IconButtonProps, IconButtonSize, IconButtonVariant } from "./icon-button/index.js";
// ADR-007 / decisión de producto #2: el entry point público re-exporta todo el
// set de iconos para que los consumidores no dependan de lucide-react
// directamente (RRU-041, sesión 2026-09-23).
export * from "@raulrod/icons";
