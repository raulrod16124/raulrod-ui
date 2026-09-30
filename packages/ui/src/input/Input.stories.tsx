import type { Meta, StoryObj } from "@storybook/react";

import { fn, userEvent, within } from "@storybook/test";

import { StoryStack } from "../storybook-support/index.js";

import { Input } from "./Input.js";

const meta: Meta<typeof Input> = {
  title: "Components/Input",
  component: Input,
  args: {
    placeholder: "Type something…",
    disabled: false,
    size: "md",
  },
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg"] },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Playground: Story = {};

export const Default: Story = {};

export const Sizes: Story = {
  render: () => (
    <StoryStack>
      <Input size="sm" placeholder="Small" />
      <Input size="md" placeholder="Medium" />
      <Input size="lg" placeholder="Large" />
    </StoryStack>
  ),
};

export const Disabled: Story = {
  render: () => (
    <StoryStack>
      <Input disabled placeholder="Disabled" />
      <Input disabled defaultValue="Disabled with value" />
    </StoryStack>
  ),
};

export const Error: Story = {
  render: () => (
    <StoryStack>
      <Input aria-invalid placeholder="Invalid state" />
      <Input aria-invalid defaultValue="Invalid value" />
    </StoryStack>
  ),
};

export const LongContent: Story = {
  render: () => <Input defaultValue={"a".repeat(80)} />,
};

export const Keyboard: Story = {
  args: {
    placeholder: "Focus and type",
    onChange: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");
    await userEvent.click(input);
    await userEvent.type(input, "hello");
  },
};
