import type { Meta, StoryObj } from "@storybook/react";

import { fn, userEvent, within } from "@storybook/test";
import { useState } from "react";

import { StoryStack } from "../storybook-support/index.js";

import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "./index.js";

const meta: Meta<typeof Popover> = {
  title: "Components/Popover",
  component: Popover,
  args: {
    defaultOpen: false,
  },
  argTypes: {
    defaultOpen: { control: "boolean" },
    open: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Popover>;

function ExamplePopover(props: React.ComponentProps<typeof Popover>) {
  return (
    <Popover {...props}>
      <PopoverTrigger>Open popover</PopoverTrigger>
      <PopoverContent>
        <PopoverTitle>Popover title</PopoverTitle>
        <p>This is a non-modal floating panel.</p>
      </PopoverContent>
    </Popover>
  );
}

export const Playground: Story = {
  render: (args) => <ExamplePopover {...args} />,
};

export const Default: Story = {
  render: () => <ExamplePopover />,
};

export const OpenByDefault: Story = {
  render: () => <ExamplePopover defaultOpen />,
};

export const Placements: Story = {
  render: () => (
    <StoryStack>
      {(["top", "right", "bottom", "left"] as const).map((placement) => (
        <Popover key={placement}>
          <PopoverTrigger>{placement}</PopoverTrigger>
          <PopoverContent placement={placement}>
            <PopoverTitle>Placement</PopoverTitle>
            <p>{placement}</p>
          </PopoverContent>
        </Popover>
      ))}
    </StoryStack>
  ),
};

function ControlledPopover() {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>Controlled</PopoverTrigger>
      <PopoverContent>
        <button type="button" onClick={() => setOpen(false)}>
          Close
        </button>
      </PopoverContent>
    </Popover>
  );
}

export const Controlled: Story = {
  render: () => <ControlledPopover />,
};

export const LongContent: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger>Long content</PopoverTrigger>
      <PopoverContent>
        <PopoverTitle>Details</PopoverTitle>
        <StoryStack>
          {Array.from({ length: 5 }).map((_, i) => (
            <p key={i}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor.
            </p>
          ))}
        </StoryStack>
      </PopoverContent>
    </Popover>
  ),
};

export const Keyboard: Story = {
  render: () => <ExamplePopover />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Open popover" });
    await userEvent.click(trigger);
    await userEvent.keyboard("{escape}");
  },
};
