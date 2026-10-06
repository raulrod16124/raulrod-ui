// Shared presentational helpers for Storybook stories (RRU-082).
// These components are only used inside `.stories.tsx` files; they are NOT
// exported from the package root and therefore do not affect the public API.
import type { CSSProperties, ReactNode } from "react";

import { Inline, type InlineProps } from "../inline/index.js";
import { Stack, type StackProps } from "../stack/index.js";
import { Text } from "../text/index.js";

const placeholderStyle: CSSProperties = {
  alignItems: "center",
  background: "var(--rr-color-background-sunken)",
  border: "1px solid var(--rr-color-border-default)",
  borderRadius: "var(--rr-radius-md)",
  display: "flex",
  justifyContent: "center",
  minHeight: "var(--rr-space-10)",
  minWidth: "var(--rr-space-10)",
  padding: "var(--rr-space-2)",
};

/** A neutral box used to visualise layout primitives in stories. */
export function Placeholder({ children, style }: { children?: ReactNode; style?: CSSProperties }) {
  return (
    <span style={{ ...placeholderStyle, ...style }}>
      {children ?? <Text size="font.size.sm">Item</Text>}
    </span>
  );
}

/** Horizontal row of items with the DS spacing scale. */
export function StoryInline({ children, ...props }: Omit<InlineProps, "ref">) {
  return (
    <Inline align="center" wrap {...props}>
      {children}
    </Inline>
  );
}

/** Vertical stack of items with the DS spacing scale. */
export function StoryStack({ children, ...props }: Omit<StackProps, "ref">) {
  return <Stack {...props}>{children}</Stack>;
}

/** Long paragraph useful for testing text-wrapping and responsive stories. */
export function LongContent() {
  return (
    <Text>
      The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How
      vexingly quick daft zebras jump! Sphinx of black quartz, judge my vow. Two driven jocks help
      fax my big quiz.
    </Text>
  );
}

/**
 * The `Responsive` story pattern of EPIC-12 (RRU-136, ADR-008): a fixed-width
 * frame with a visible boundary, so a story can prove a component reacts to the
 * width of ITS CONTAINER and not to the viewport.
 *
 * Two reasons this exists instead of a `parameters.viewport` story alone:
 *
 *  - A viewport story can only shrink the canvas, so it cannot separate "this
 *    component reacts to the viewport" from "this component reacts to its
 *    container". Resize the browser window with this frame on screen and
 *    nothing inside it changes; resize the frame and it does. That contrast is
 *    the mechanism ADR-008 chose, made observable by a human.
 *  - `containerType: "inline-size"` is declared HERE, on purpose. A `@container`
 *    query with no container context never matches, and ADR-008 names that as
 *    the epic's first observable risk. Every family that adds a `@container`
 *    block gets its context from this frame for free.
 *
 * The frame keeps the width explicit and token-free (`320px` is the narrow
 * viewport EPIC-12 measures at, not a design value), because a story is a
 * consumer, and a consumer is allowed its own layout numbers.
 */
export function NarrowContainer({
  children,
  label,
  width = "320px",
}: {
  children: ReactNode;
  label: string;
  width?: string;
}) {
  return (
    <Stack gap="space-2" style={{ alignItems: "flex-start" }}>
      <Text size="font.size.sm">{label}</Text>
      <div
        style={{
          border: "1px dashed var(--rr-color-border-strong)",
          borderRadius: "var(--rr-radius-md)",
          containerType: "inline-size",
          inlineSize: width,
          overflow: "visible",
          padding: "var(--rr-space-2)",
        }}
      >
        {children}
      </div>
    </Stack>
  );
}
