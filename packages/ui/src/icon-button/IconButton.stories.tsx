import type { Meta, StoryObj } from "@storybook/react";

import { fn, userEvent, within } from "@storybook/test";

import { Check, ChevronDown, Trash2 } from "@raulrod/icons";

import { StoryInline } from "../storybook-support/index.js";

import { IconButton } from "./IconButton.js";

const meta: Meta<typeof IconButton> = {
  title: "Components/IconButton",
  component: IconButton,
  args: {
    label: "Action",
    children: <ChevronDown />,
    disabled: false,
    loading: false,
    variant: "primary",
    size: "md",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "outline", "ghost", "destructive", "link"],
    },
    size: { control: "select", options: ["sm", "md", "lg"] },
    children: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof IconButton>;

export const Playground: Story = {};

export const Default: Story = {};

export const Variants: Story = {
  render: () => (
    <StoryInline gap="space-4">
      {(["primary", "secondary", "outline", "ghost", "destructive", "link"] as const).map(
        (variant) => (
          <IconButton key={variant} label={variant} variant={variant}>
            <ChevronDown />
          </IconButton>
        ),
      )}
    </StoryInline>
  ),
};

export const Sizes: Story = {
  render: () => (
    <StoryInline gap="space-4" align="center">
      <IconButton label="Small" size="sm">
        <Check />
      </IconButton>
      <IconButton label="Medium" size="md">
        <Check />
      </IconButton>
      <IconButton label="Large" size="lg">
        <Check />
      </IconButton>
    </StoryInline>
  ),
};

export const Disabled: Story = {
  render: () => (
    <StoryInline gap="space-4">
      {(["primary", "secondary", "outline", "ghost", "destructive"] as const).map((variant) => (
        <IconButton key={variant} label={variant} variant={variant} disabled>
          <Trash2 />
        </IconButton>
      ))}
    </StoryInline>
  ),
};

export const Loading: Story = {
  render: () => (
    <StoryInline gap="space-4">
      {(["primary", "secondary", "outline", "ghost", "destructive"] as const).map((variant) => (
        <IconButton key={variant} label={variant} variant={variant} loading>
          <Trash2 />
        </IconButton>
      ))}
    </StoryInline>
  ),
};

export const Keyboard: Story = {
  args: {
    label: "Delete item",
    children: <Trash2 />,
    onClick: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Delete item" });
    await userEvent.click(button);
    await userEvent.keyboard("{enter}");
  },
};
