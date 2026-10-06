import type { Meta, StoryObj } from "@storybook/react";

import { fn, userEvent, within } from "@storybook/test";

import { NarrowContainer, StoryStack } from "../storybook-support/index.js";

import { Radio, RadioGroup } from "./index.js";

const meta: Meta<typeof RadioGroup> = {
  title: "Components/Radio",
  component: RadioGroup,
  args: {
    defaultValue: "a",
    disabled: false,
  },
  argTypes: {
    orientation: { control: "select", options: ["vertical", "horizontal"] },
  },
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

export const Playground: Story = {
  render: (args) => (
    <RadioGroup {...args}>
      <Radio value="a">Option A</Radio>
      <Radio value="b">Option B</Radio>
      <Radio value="c">Option C</Radio>
    </RadioGroup>
  ),
};

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="a">
      <Radio value="a">Option A</Radio>
      <Radio value="b">Option B</Radio>
      <Radio value="c">Option C</Radio>
    </RadioGroup>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <RadioGroup defaultValue="a" orientation="horizontal">
      <Radio value="a">Option A</Radio>
      <Radio value="b">Option B</Radio>
      <Radio value="c">Option C</Radio>
    </RadioGroup>
  ),
};

export const Sizes: Story = {
  render: () => (
    <StoryStack>
      <RadioGroup defaultValue="a" size="sm">
        <Radio value="a">Small A</Radio>
        <Radio value="b">Small B</Radio>
      </RadioGroup>
      <RadioGroup defaultValue="a" size="md">
        <Radio value="a">Medium A</Radio>
        <Radio value="b">Medium B</Radio>
      </RadioGroup>
      <RadioGroup defaultValue="a" size="lg">
        <Radio value="a">Large A</Radio>
        <Radio value="b">Large B</Radio>
      </RadioGroup>
    </StoryStack>
  ),
};

export const Disabled: Story = {
  render: () => (
    <RadioGroup defaultValue="a" disabled>
      <Radio value="a">Disabled A</Radio>
      <Radio value="b">Disabled B</Radio>
    </RadioGroup>
  ),
};

export const DisabledOption: Story = {
  render: () => (
    <RadioGroup defaultValue="a">
      <Radio value="a">Enabled</Radio>
      <Radio value="b" disabled>
        Disabled option
      </Radio>
      <Radio value="c">Enabled</Radio>
    </RadioGroup>
  ),
};

export const Keyboard: Story = {
  render: () => (
    <RadioGroup defaultValue="a" onValueChange={fn()}>
      <Radio value="a">First</Radio>
      <Radio value="b">Second</Radio>
      <Radio value="c">Third</Radio>
    </RadioGroup>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const radio = canvas.getByRole("radio", { name: "First" });
    await userEvent.click(radio);
    await userEvent.keyboard("{arrowdown}");
  },
};

export const Responsive: Story = {
  render: () => (
    <StoryStack gap="space-6">
      <NarrowContainer label="horizontal group wraps at 320px">
        <RadioGroup defaultValue="a" orientation="horizontal">
          <Radio value="a">Alpha</Radio>
          <Radio value="b">Beta</Radio>
          <Radio value="c">Gamma</Radio>
          <Radio value="d">Delta</Radio>
          <Radio value="e">Epsilon</Radio>
        </RadioGroup>
      </NarrowContainer>
      <NarrowContainer label="vertical group stays a column" width="240px">
        <RadioGroup defaultValue="a">
          <Radio value="a">Alpha</Radio>
          <Radio value="b">Beta</Radio>
          <Radio value="c">Gamma</Radio>
        </RadioGroup>
      </NarrowContainer>
    </StoryStack>
  ),
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
};
