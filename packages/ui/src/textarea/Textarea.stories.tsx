import type { Meta, StoryObj } from "@storybook/react";

import { fn, userEvent, within } from "@storybook/test";

import { Button } from "../button/index.js";
import { Inline } from "../inline/index.js";
import { NarrowContainer, StoryStack } from "../storybook-support/index.js";

import { Textarea } from "./Textarea.js";

const meta: Meta<typeof Textarea> = {
  title: "Components/Textarea",
  component: Textarea,
  args: {
    placeholder: "Type multiple lines…",
    disabled: false,
    size: "md",
    autoResize: false,
  },
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg"] },
    autoResize: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Playground: Story = {};

export const Default: Story = {};

export const Sizes: Story = {
  render: () => (
    <StoryStack>
      <Textarea size="sm" placeholder="Small" />
      <Textarea size="md" placeholder="Medium" />
      <Textarea size="lg" placeholder="Large" />
    </StoryStack>
  ),
};

export const Disabled: Story = {
  render: () => <Textarea disabled defaultValue="Disabled textarea" />,
};

export const Error: Story = {
  render: () => <Textarea aria-invalid defaultValue="Invalid textarea" />,
};

export const AutoResize: Story = {
  render: () => <Textarea autoResize defaultValue={"Line 1\nLine 2\nLine 3"} />,
};

export const LongContent: Story = {
  render: () => <Textarea defaultValue={"Lorem ipsum dolor sit amet.\n".repeat(10)} rows={4} />,
};

export const Keyboard: Story = {
  args: {
    placeholder: "Focus and type",
    onChange: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByRole("textbox");
    await userEvent.click(textarea);
    await userEvent.type(textarea, "hello world");
  },
};

export const Responsive: Story = {
  render: () => (
    <StoryStack gap="space-6">
      <NarrowContainer label="textarea shrinks inside a 200px row">
        <Inline>
          <Textarea placeholder="Message" rows={2} />
          <Button>Send</Button>
        </Inline>
      </NarrowContainer>
      <NarrowContainer label="autosize stays inside a 240px frame" width="240px">
        <Textarea
          autoResize
          defaultValue={
            "This autosizing textarea should remain inside its narrow container even when the user types a very long unbroken word."
          }
        />
      </NarrowContainer>
    </StoryStack>
  ),
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
};
