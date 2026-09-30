import type { Meta, StoryObj } from "@storybook/react";

import { Inline, Text } from "../index.js";

import { VisuallyHidden } from "./VisuallyHidden.js";

const meta: Meta<typeof VisuallyHidden> = {
  title: "Components/VisuallyHidden",
  component: VisuallyHidden,
  args: {
    children: "Screen-reader only text",
    focusable: false,
  },
  argTypes: {
    focusable: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof VisuallyHidden>;

export const Playground: Story = {};

export const Default: Story = {};

export const Focusable: Story = {
  render: () => (
    <Inline gap="space-4">
      <a href="#main">
        <VisuallyHidden focusable>Skip to main content</VisuallyHidden>
      </a>
      <Text>Tab into the story to reveal the skip link.</Text>
    </Inline>
  ),
};

export const WithinLabel: Story = {
  render: () => (
    <label htmlFor="within-label-input">
      <Text>Visible label</Text>
      <VisuallyHidden> — additional context for screen readers</VisuallyHidden>
      <input id="within-label-input" type="text" />
    </label>
  ),
};
