import type { Meta, StoryObj } from "@storybook/react";

import { fn, userEvent, within } from "@storybook/test";

import { StoryInline, StoryStack } from "../storybook-support/index.js";

import { Switch } from "./Switch.js";

const meta: Meta<typeof Switch> = {
  title: "Components/Switch",
  component: Switch,
  args: {
    disabled: false,
    defaultChecked: false,
    size: "md",
  },
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg"] },
  },
};

export default meta;
type Story = StoryObj<typeof Switch>;

export const Playground: Story = {};

export const Default: Story = {
  render: () => <Switch>Enable notifications</Switch>,
};

export const Sizes: Story = {
  render: () => (
    <StoryInline gap="space-6" align="center">
      <Switch size="sm">Small</Switch>
      <Switch size="md">Medium</Switch>
      <Switch size="lg">Large</Switch>
    </StoryInline>
  ),
};

export const Checked: Story = {
  render: () => (
    <StoryStack>
      <Switch defaultChecked>On by default</Switch>
      <Switch checked>Controlled on</Switch>
    </StoryStack>
  ),
};

export const Disabled: Story = {
  render: () => (
    <StoryInline gap="space-6" align="center">
      <Switch disabled>Off disabled</Switch>
      <Switch disabled defaultChecked>
        On disabled
      </Switch>
    </StoryInline>
  ),
};

export const Error: Story = {
  render: () => (
    <Switch aria-invalid value="yes">
      Invalid switch
    </Switch>
  ),
};

export const Keyboard: Story = {
  args: {
    children: "Toggle me",
    onChange: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole("switch");
    await userEvent.click(sw);
    await userEvent.keyboard("{space}");
  },
};
