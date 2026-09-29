import type { Meta, StoryObj } from "@storybook/react";

import { Placeholder, StoryStack } from "../storybook-support/index.js";

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

export const Responsive: Story = {
  render: () => (
    <Inline wrap gap="space-4" style={{ width: "100%" }}>
      {Array.from({ length: 12 }).map((_, i) => (
        <Placeholder key={i} style={{ flex: "1 1 120px" }}>
          {i + 1}
        </Placeholder>
      ))}
    </Inline>
  ),
};
