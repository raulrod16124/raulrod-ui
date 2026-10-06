import type { Meta, StoryObj } from "@storybook/react";

import { Inline, Text } from "../index.js";
import { NarrowContainer, StoryStack } from "../storybook-support/index.js";

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
      <VisuallyHidden focusable>
        <a href="#main">Skip to main content</a>
      </VisuallyHidden>
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

export const Responsive: Story = {
  render: () => (
    <StoryStack gap="space-6">
      <NarrowContainer label="hidden text leaves zero horizontal footprint">
        <Inline gap="space-4" align="center">
          <a href="#main">
            <VisuallyHidden focusable>Skip to main content</VisuallyHidden>
          </a>
          <Text>Tab into the story to reveal the skip link.</Text>
        </Inline>
      </NarrowContainer>
    </StoryStack>
  ),
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
};
