import type { Meta, StoryObj } from "@storybook/react";

import { fn, userEvent, within } from "@storybook/test";

import { Button } from "../button/index.js";

import { ToastProvider, useToast } from "./index.js";

const meta: Meta<typeof ToastProvider> = {
  title: "Components/ToastProvider",
  component: ToastProvider,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof ToastProvider>;

function ToastControls() {
  const { toast, dismissAll } = useToast();
  return (
    <div style={{ display: "flex", gap: "var(--rr-space-4)", flexWrap: "wrap" }}>
      <Button
        onClick={() =>
          toast({
            title: "Changes saved",
            description: "Your profile has been updated.",
            tone: "success",
            onDismiss: fn(),
          })
        }
      >
        Success
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          toast({
            title: "New message",
            description: "You have a new notification.",
            tone: "info",
          })
        }
      >
        Info
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast({
            title: "Warning",
            description: "Something needs your attention.",
            tone: "warning",
          })
        }
      >
        Warning
      </Button>
      <Button
        variant="destructive"
        onClick={() =>
          toast({
            title: "Deletion failed",
            description: "Could not delete the record.",
            tone: "destructive",
          })
        }
      >
        Destructive
      </Button>
      <Button variant="ghost" onClick={dismissAll}>
        Dismiss all
      </Button>
    </div>
  );
}

export const Playground: Story = {
  render: () => (
    <ToastProvider>
      <ToastControls />
    </ToastProvider>
  ),
};

export const Default: Story = {
  render: () => (
    <ToastProvider>
      <ToastControls />
    </ToastProvider>
  ),
};

export const PersistentAlert: Story = {
  render: () => (
    <ToastProvider>
      <Button
        onClick={() =>
          useToast().toast({
            title: "Critical error",
            description: "This toast stays until dismissed.",
            tone: "destructive",
            duration: null,
          })
        }
      >
        Trigger alert
      </Button>
    </ToastProvider>
  ),
};

export const AutoDismiss: Story = {
  render: () => (
    <ToastProvider duration={2000}>
      <Button
        onClick={() =>
          useToast().toast({
            title: "Auto-dismiss",
            description: "This toast will disappear in 2 seconds.",
            tone: "info",
          })
        }
      >
        Trigger auto-dismiss
      </Button>
    </ToastProvider>
  ),
};

export const Keyboard: Story = {
  render: () => (
    <ToastProvider>
      <ToastControls />
    </ToastProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Success" });
    await userEvent.click(button);
    await userEvent.tab();
    await userEvent.keyboard("{enter}");
  },
};
