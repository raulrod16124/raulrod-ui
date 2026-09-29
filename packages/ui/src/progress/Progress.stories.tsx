import type { Meta, StoryObj } from "@storybook/react";

import { StoryStack } from "../storybook-support/index.js";

import { Progress } from "./Progress.js";

const meta: Meta<typeof Progress> = {
  title: "Components/Progress",
  component: Progress,
  args: {
    value: 50,
    label: "Loading",
  },
  argTypes: {
    value: { control: { type: "range", min: 0, max: 100 } },
    indeterminate: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Progress>;

export const Playground: Story = {};

export const Default: Story = {};

export const Values: Story = {
  render: () => (
    <StoryStack>
      <Progress value={0} label="0%" />
      <Progress value={25} label="25%" />
      <Progress value={50} label="50%" />
      <Progress value={75} label="75%" />
      <Progress value={100} label="100%" />
    </StoryStack>
  ),
};

export const Indeterminate: Story = {
  args: {
    indeterminate: true,
    label: "Working…",
  },
};

export const LongContent: Story = {
  render: () => (
    <Progress value={60} label="Uploading a very large file with a long descriptive label" />
  ),
};

export const Responsive: Story = {
  render: () => <Progress value={40} label="Responsive" style={{ width: "100%" }} />,
};
