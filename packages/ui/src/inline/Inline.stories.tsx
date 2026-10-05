import type { Meta, StoryObj } from "@storybook/react";

import { NarrowContainer, Placeholder, StoryStack } from "../storybook-support/index.js";

import { Inline } from "./Inline.js";

const meta: Meta<typeof Inline> = {
  title: "Components/Inline",
  component: Inline,
  args: {
    gap: "space-4",
    align: "center",
    justify: "start",
    wrap: false,
  },
  argTypes: {
    gap: {
      control: "select",
      options: [
        "space-0",
        "space-1",
        "space-2",
        "space-3",
        "space-4",
        "space-5",
        "space-6",
        "space-8",
        "space-10",
        "space-12",
        "space-16",
      ],
    },
    align: { control: "select", options: ["start", "center", "end", "stretch", "baseline"] },
    justify: {
      control: "select",
      options: ["start", "center", "end", "between", "around", "evenly"],
    },
    wrap: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Inline>;

export const Playground: Story = {
  render: (args) => (
    <Inline {...args}>
      <Placeholder>One</Placeholder>
      <Placeholder>Two</Placeholder>
      <Placeholder>Three</Placeholder>
    </Inline>
  ),
};

export const Default: Story = {
  render: () => (
    <Inline>
      <Placeholder>One</Placeholder>
      <Placeholder>Two</Placeholder>
      <Placeholder>Three</Placeholder>
    </Inline>
  ),
};

export const Gaps: Story = {
  render: () => (
    <StoryStack>
      <Inline gap="space-2">
        <Placeholder>2</Placeholder>
        <Placeholder>2</Placeholder>
      </Inline>
      <Inline gap="space-4">
        <Placeholder>4</Placeholder>
        <Placeholder>4</Placeholder>
      </Inline>
      <Inline gap="space-6">
        <Placeholder>6</Placeholder>
        <Placeholder>6</Placeholder>
      </Inline>
      <Inline gap="space-8">
        <Placeholder>8</Placeholder>
        <Placeholder>8</Placeholder>
      </Inline>
    </StoryStack>
  ),
};

export const Wrapping: Story = {
  render: () => (
    <Inline wrap gap="space-2" style={{ maxWidth: "220px" }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <Placeholder key={i}>{i + 1}</Placeholder>
      ))}
    </Inline>
  ),
};

export const Justify: Story = {
  render: () => (
    <StoryStack>
      {(["start", "center", "end", "between"] as const).map((justify) => (
        <Inline key={justify} gap="space-2" justify={justify} style={{ width: "100%" }}>
          <Placeholder>{justify}</Placeholder>
          <Placeholder>{justify}</Placeholder>
        </Inline>
      ))}
    </StoryStack>
  ),
};

/**
 * RRU-136, ADR-008. The contract this story demonstrates is `wrap`, and both
 * halves of it are on screen at once:
 *
 *  - `wrap` reflows onto new lines inside a 320px CONTAINER. Resize the browser
 *    window and the frame does not change, which is the point: the row reacts to
 *    the width it was given, not to the viewport.
 *  - `wrap={false}` overflows the same container. That is the documented
 *    consequence of an explicit consumer decision, not a defect: the DS does not
 *    make `wrap` responsive by default, because doing so would replace the
 *    consumer's decision with its own and `wrap={false}` would stop existing.
 *    The real counterexample lives in the playground (`form-section.tsx`) and is
 *    fixed there as consumer misuse in RRU-144.
 *
 * Nothing here sets a `flex` value on the children: the previous version of this
 * story delegated the whole behaviour to consumer CSS, so it proved nothing about
 * the component.
 */
export const Responsive: Story = {
  render: () => (
    <StoryStack gap="space-6">
      <NarrowContainer label="wrap — reflows inside a 320px container">
        <Inline wrap gap="space-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Placeholder key={i}>{i + 1}</Placeholder>
          ))}
        </Inline>
      </NarrowContainer>
      <NarrowContainer label="no wrap — overflows the same 320px container (consumer decision)">
        <Inline gap="space-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Placeholder key={i}>{i + 1}</Placeholder>
          ))}
        </Inline>
      </NarrowContainer>
    </StoryStack>
  ),
};
