import type { Meta, StoryObj } from "@storybook/react";

import { fn, userEvent, within } from "@storybook/test";

import { StoryInline, StoryStack } from "../storybook-support/index.js";

import { Checkbox } from "./Checkbox.js";

const meta: Meta<typeof Checkbox> = {
  title: "Components/Checkbox",
  component: Checkbox,
  args: {
    disabled: false,
    indeterminate: false,
    size: "md",
  },
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg"] },
    indeterminate: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Playground: Story = {};

export const Default: Story = {};

export const Sizes: Story = {
  render: () => (
    <StoryInline gap="space-6" align="center">
      <Checkbox size="sm" defaultChecked />
      <Checkbox size="md" defaultChecked />
      <Checkbox size="lg" defaultChecked />
    </StoryInline>
  ),
};

export const States: Story = {
  render: () => (
    <StoryStack>
      <StoryInline gap="space-4" align="center">
        <Checkbox id="checkbox-unchecked" />
        <label htmlFor="checkbox-unchecked">Unchecked</label>
      </StoryInline>
      <StoryInline gap="space-4" align="center">
        <Checkbox id="checkbox-checked" defaultChecked />
        <label htmlFor="checkbox-checked">Checked</label>
      </StoryInline>
      <StoryInline gap="space-4" align="center">
        <Checkbox id="checkbox-indeterminate" indeterminate />
        <label htmlFor="checkbox-indeterminate">Indeterminate</label>
      </StoryInline>
    </StoryStack>
  ),
};

export const Disabled: Story = {
  render: () => (
    <StoryInline gap="space-4" align="center">
      <Checkbox disabled />
      <Checkbox disabled defaultChecked />
      <Checkbox disabled indeterminate />
    </StoryInline>
  ),
};

export const Error: Story = {
  render: () => (
    <StoryInline gap="space-4" align="center">
      <Checkbox id="checkbox-invalid" aria-invalid />
      <label htmlFor="checkbox-invalid">Invalid</label>
    </StoryInline>
  ),
};

export const Keyboard: Story = {
  args: {
    onChange: fn(),
    "aria-label": "Accept terms",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox");
    await userEvent.click(checkbox);
    await userEvent.keyboard("{space}");
  },
};
