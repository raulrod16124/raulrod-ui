import type { Meta, StoryObj } from "@storybook/react";

import { Placeholder, StoryInline, StoryStack } from "../storybook-support/index.js";

import { Stack } from "./Stack.js";

const meta: Meta<typeof Stack> = {
  title: "Components/Stack",
  component: Stack,
  args: {
    gap: "space-4",
    align: "stretch",
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
type Story = StoryObj<typeof Stack>;

export const Playground: Story = {
  render: (args) => (
    <Stack {...args}>
      <Placeholder>First</Placeholder>
      <Placeholder>Second</Placeholder>
      <Placeholder>Third</Placeholder>
    </Stack>
  ),
};

export const Default: Story = {
  render: () => (
    <Stack>
      <Placeholder>First</Placeholder>
      <Placeholder>Second</Placeholder>
      <Placeholder>Third</Placeholder>
    </Stack>
  ),
};

export const Gaps: Story = {
  render: () => (
    <StoryStack>
      <StoryInline gap="space-6" align="start">
        <Stack gap="space-2">
          <Placeholder>2</Placeholder>
          <Placeholder>2</Placeholder>
        </Stack>
        <Stack gap="space-4">
          <Placeholder>4</Placeholder>
          <Placeholder>4</Placeholder>
        </Stack>
        <Stack gap="space-6">
          <Placeholder>6</Placeholder>
          <Placeholder>6</Placeholder>
        </Stack>
        <Stack gap="space-8">
          <Placeholder>8</Placeholder>
          <Placeholder>8</Placeholder>
        </Stack>
      </StoryInline>
    </StoryStack>
  ),
};

export const Alignments: Story = {
  render: () => (
    <StoryStack>
      {(["start", "center", "end", "stretch"] as const).map((align) => (
        <Stack key={align} gap="space-2" align={align} style={{ width: "100%" }}>
          <Placeholder>{align}</Placeholder>
        </Stack>
      ))}
    </StoryStack>
  ),
};

export const LongContent: Story = {
  render: () => (
    <Stack style={{ maxWidth: "320px" }}>
      <Placeholder>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut
        labore et dolore magna aliqua.
      </Placeholder>
      <Placeholder>
        Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
        commodo consequat.
      </Placeholder>
    </Stack>
  ),
};

export const Responsive: Story = {
  render: () => (
    <Stack style={{ width: "100%" }}>
      <Placeholder>Resize the viewport to see the stack stay vertical.</Placeholder>
      <Placeholder>It fills the available width.</Placeholder>
    </Stack>
  ),
};
