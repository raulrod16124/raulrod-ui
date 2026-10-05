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

/**
 * The stack at a width and height where it is genuinely over its block bound
 * (RRU-139).
 *
 * `parameters.viewport`, never a wrapper: the stack is `position: fixed` in the
 * top-right corner of the screen, so a narrow container would constrain the
 * STORY and not the toast. This is the ADR-008 exception, and `mobile1` is the
 * only preset narrow enough to matter — the card's own `space-4` gutter leaves
 * 288px of column at 320px, which a 500-character description cannot fit in
 * vertically.
 *
 * `duration: null` because the defect was a screenshot, not a flash: with the
 * default timeout the stack empties before the card scrolls into view.
 */
export const Responsive: Story = {
  render: () => (
    <ToastProvider>
      <Button
        onClick={() => {
          const { toast } = useToast();
          // Raised first, so it renders last. The stack is newest-first, and the
          // older card is the one that ends up below the bound.
          toast({
            title: "Card details still need a review",
            description:
              "Billing runs on the first of every month and charges the workspace owner for each active seat. Changing the plan mid-cycle takes effect at the next renewal rather than immediately, so the current invoice is never repriced: the proration appears as a credit on the following one.",
            tone: "warning",
            duration: null,
          });
          toast({
            title: "Your billing details were updated",
            description:
              "Billing runs on the first of every month and charges the workspace owner for each active seat. Changing the plan mid-cycle takes effect at the next renewal rather than immediately, so the current invoice is never repriced: the proration appears as a credit on the following one.",
            tone: "info",
            duration: null,
          });
        }}
      >
        Raise long notifications
      </Button>
    </ToastProvider>
  ),
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
};
