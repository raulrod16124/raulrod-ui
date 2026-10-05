import type { Meta, StoryObj } from "@storybook/react";

import { userEvent, within } from "@storybook/test";
import { useState } from "react";

import { IconButton } from "../icon-button/index.js";
import { Button } from "../index.js";

import { Tooltip } from "./Tooltip.js";

const meta: Meta<typeof Tooltip> = {
  title: "Components/Tooltip",
  component: Tooltip,
  args: {
    content: "I am a tooltip",
    placement: "top",
    openDelay: 100,
    closeDelay: 50,
  },
  argTypes: {
    placement: {
      control: "select",
      options: [
        "top",
        "right",
        "bottom",
        "left",
        "top-start",
        "top-end",
        "bottom-start",
        "bottom-end",
      ],
    },
    openDelay: { control: { type: "range", min: 0, max: 1000 } },
    closeDelay: { control: { type: "range", min: 0, max: 1000 } },
  },
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Playground: Story = {
  render: (args) => (
    <Tooltip {...args}>
      <Button>Hover or focus me</Button>
    </Tooltip>
  ),
};

export const Default: Story = {
  render: () => (
    <Tooltip content="A helpful hint">
      <Button>Hover me</Button>
    </Tooltip>
  ),
};

export const Placements: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "var(--rr-space-4)", flexWrap: "wrap" }}>
      {(["top", "right", "bottom", "left"] as const).map((placement) => (
        <Tooltip key={placement} content={placement} placement={placement}>
          <Button>{placement}</Button>
        </Tooltip>
      ))}
    </div>
  ),
};

export const OnIconButton: Story = {
  render: () => (
    <Tooltip content="Add to favourites">
      <IconButton label="Favourite">★</IconButton>
    </Tooltip>
  ),
};

function ControlledTooltip() {
  const [open, setOpen] = useState(false);
  return (
    <Tooltip content="Controlled" open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(!open)}>Toggle</Button>
    </Tooltip>
  );
}

export const Controlled: Story = {
  render: () => <ControlledTooltip />,
};

export const Keyboard: Story = {
  args: {
    content: "Keyboard tooltip",
  },
  render: (args) => (
    <Tooltip {...args}>
      <Button>Focus me</Button>
    </Tooltip>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button");
    await userEvent.hover(button);
    await userEvent.unhover(button);
    await userEvent.tab();
  },
};

/**
 * The 320px case (RRU-137), and the one panel that WRAPS instead of scrolling.
 *
 * Left closed rather than forced open with `defaultOpen`: the reader is meant to
 * reach this tooltip the way a keyboard user does, by focusing the trigger, which
 * is also the path that shows the deviation is safe — the panel is taller than a
 * hint should be, and every word of it is still reachable because it wraps and
 * nothing is clipped. A story that rendered open would hide exactly that.
 */
export const Responsive: Story = {
  args: {
    content:
      "Billing runs on the first of every month and charges the workspace owner for each active seat. Changing the plan mid-cycle takes effect at the next renewal rather than immediately, so the current invoice is never repriced.",
  },
  render: (args) => (
    <Tooltip {...args}>
      <Button>What does this do?</Button>
    </Tooltip>
  ),
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
};
