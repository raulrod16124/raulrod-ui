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
