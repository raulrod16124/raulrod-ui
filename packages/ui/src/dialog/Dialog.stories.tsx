import type { Meta, StoryObj } from "@storybook/react";

import { fn, userEvent, within } from "@storybook/test";
import { useState } from "react";

import { Button } from "../button/index.js";
import { StoryStack } from "../storybook-support/index.js";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./index.js";

const meta: Meta<typeof Dialog> = {
  title: "Components/Dialog",
  component: Dialog,
  args: {
    defaultOpen: false,
  },
  argTypes: {
    defaultOpen: { control: "boolean" },
    open: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Dialog>;

function ExampleDialog(props: React.ComponentProps<typeof Dialog>) {
  return (
    <Dialog {...props}>
      <DialogTrigger>Open dialog</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm action</DialogTitle>
          <DialogDescription>
            Are you sure you want to continue? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary">Cancel</Button>
          <Button>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const Playground: Story = {
  render: (args) => <ExampleDialog {...args} />,
};

export const Default: Story = {
  render: () => <ExampleDialog />,
};

export const OpenByDefault: Story = {
  render: () => <ExampleDialog defaultOpen />,
};

function ControlledDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>Controlled</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Controlled dialog</DialogTitle>
        </DialogHeader>
        <Button onClick={() => setOpen(false)}>Close programmatically</Button>
      </DialogContent>
    </Dialog>
  );
}

export const Controlled: Story = {
  render: () => <ControlledDialog />,
};

export const WithoutDescription: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger>No description</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Title only</DialogTitle>
        </DialogHeader>
        <p>This dialog has no description slot.</p>
      </DialogContent>
    </Dialog>
  ),
};

export const LongContent: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger>Long content</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Terms and conditions</DialogTitle>
          <DialogDescription>Please read the following text carefully.</DialogDescription>
        </DialogHeader>
        <StoryStack>
          {Array.from({ length: 8 }).map((_, i) => (
            <p key={i}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
              incididunt ut labore et dolore magna aliqua.
            </p>
          ))}
        </StoryStack>
        <DialogFooter>
          <Button>Accept</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const Keyboard: Story = {
  render: () => <ExampleDialog />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Open dialog" });
    await userEvent.click(trigger);
    await userEvent.keyboard("{escape}");
  },
};

export const Responsive: Story = {
  render: () => <ExampleDialog defaultOpen />,
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
};
