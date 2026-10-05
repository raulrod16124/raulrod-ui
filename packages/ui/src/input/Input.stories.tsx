import type { Meta, StoryObj } from "@storybook/react";

import { fn, userEvent, within } from "@storybook/test";

import { Button } from "../button/index.js";
import { Inline } from "../inline/index.js";
import { NarrowContainer, StoryStack } from "../storybook-support/index.js";

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

export const Responsive: Story = {
  render: () => (
    <StoryStack gap="space-6">
      <NarrowContainer label="field shrinks inside a 200px row">
        <Inline>
          <Input placeholder="Email" />
          <Button>Send</Button>
        </Inline>
      </NarrowContainer>
      <NarrowContainer label="long value wraps instead of overflowing" width="240px">
        <Input defaultValue={"a".repeat(60)} />
      </NarrowContainer>
    </StoryStack>
  ),
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
};
