import type { Meta, StoryObj } from "@storybook/react";

import { fn, userEvent, within } from "@storybook/test";

import { ChevronDown, Loader2 } from "@raulrod/icons";

import { StoryInline, StoryStack } from "../storybook-support/index.js";

import { Button } from "./Button.js";

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  args: {
    children: "Button",
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
    startIcon: { control: false },
    endIcon: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Playground: Story = {};

export const Default: Story = {};

export const Variants: Story = {
  render: () => (
    <StoryInline gap="space-4">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="link">Link</Button>
    </StoryInline>
  ),
};

export const Sizes: Story = {
  render: () => (
    <StoryInline gap="space-4" align="center">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </StoryInline>
  ),
};

export const Disabled: Story = {
  render: () => (
    <StoryInline gap="space-4">
      {(["primary", "secondary", "outline", "ghost", "destructive", "link"] as const).map(
        (variant) => (
          <Button key={variant} variant={variant} disabled>
            {variant}
          </Button>
        ),
      )}
    </StoryInline>
  ),
};

export const Loading: Story = {
  render: () => (
    <StoryInline gap="space-4">
      {(["primary", "secondary", "outline", "ghost", "destructive"] as const).map((variant) => (
        <Button key={variant} variant={variant} loading>
          {variant}
        </Button>
      ))}
    </StoryInline>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <StoryInline gap="space-4">
      <Button startIcon={<ChevronDown />}>Start icon</Button>
      <Button endIcon={<ChevronDown />}>End icon</Button>
      <Button startIcon={<ChevronDown />} endIcon={<ChevronDown />}>
        Both icons
      </Button>
    </StoryInline>
  ),
};

export const AsAnchor: Story = {
  render: () => (
    <StoryInline gap="space-4">
      <Button href="https://example.com" target="_blank" rel="noopener noreferrer">
        External link
      </Button>
      <Button href="https://example.com" disabled>
        Disabled link
      </Button>
    </StoryInline>
  ),
};

export const Keyboard: Story = {
  args: {
    children: "Click me",
    onClick: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Click me" });
    await userEvent.click(button);
    await userEvent.keyboard("{enter}");
  },
};

export const LongContent: Story = {
  render: () => (
    <StoryStack>
      <Button size="sm">This is a very long label for a small button</Button>
      <Button>This is a very long label for a medium button</Button>
      <Button size="lg">This is a very long label for a large button</Button>
    </StoryStack>
  ),
};

export const Responsive: Story = {
  render: () => (
    <StoryInline gap="space-4" style={{ flexWrap: "wrap" }}>
      <Button style={{ flex: "1 1 120px" }}>Adaptive</Button>
      <Button style={{ flex: "1 1 120px" }}>Adaptive</Button>
      <Button style={{ flex: "1 1 120px" }}>Adaptive</Button>
    </StoryInline>
  ),
};

export const CustomSpinner: Story = {
  render: () => (
    <Button loading startIcon={<Loader2 />}>
      Loading with start icon
    </Button>
  ),
};
