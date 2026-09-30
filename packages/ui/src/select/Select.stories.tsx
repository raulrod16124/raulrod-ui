import type { Meta, StoryObj } from "@storybook/react";

import { fn, userEvent, within } from "@storybook/test";
import { useState } from "react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectIcon,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./index.js";

const meta: Meta<typeof Select> = {
  title: "Components/Select",
  component: Select,
  args: {
    defaultValue: "apple",
  },
  argTypes: {
    defaultValue: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof Select>;

function ExampleSelect(props: React.ComponentProps<typeof Select>) {
  return (
    <Select {...props}>
      <SelectTrigger>
        <SelectValue>Pick a fruit</SelectValue>
        <SelectIcon />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
        <SelectItem value="blueberry">Blueberry</SelectItem>
        <SelectItem value="disabled" disabled>
          Unavailable
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

function GroupedSelect() {
  return (
    <Select>
      <SelectTrigger>
        <SelectValue>Pick a timezone</SelectValue>
        <SelectIcon />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Europe</SelectLabel>
          <SelectItem value="cet">CET</SelectItem>
          <SelectItem value="gmt">GMT</SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>America</SelectLabel>
          <SelectItem value="est">EST</SelectItem>
          <SelectItem value="pst">PST</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export const Playground: Story = {
  render: (args) => <ExampleSelect {...args} />,
};

export const Default: Story = {
  render: () => <ExampleSelect />,
};

export const OpenByDefault: Story = {
  render: () => <ExampleSelect defaultOpen />,
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "var(--rr-space-4)", flexDirection: "column" }}>
      <Select>
        <SelectTrigger size="sm">
          <SelectValue>Small</SelectValue>
          <SelectIcon />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>
      <Select>
        <SelectTrigger size="md">
          <SelectValue>Medium</SelectValue>
          <SelectIcon />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>
      <Select>
        <SelectTrigger size="lg">
          <SelectValue>Large</SelectValue>
          <SelectIcon />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const Grouped: Story = {
  render: () => <GroupedSelect />,
};

function ControlledSelect() {
  const [value, setValue] = useState("apple");
  return (
    <Select value={value} onValueChange={setValue}>
      <SelectTrigger>
        <SelectValue />
        <SelectIcon />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
      </SelectContent>
    </Select>
  );
}

export const Controlled: Story = {
  render: () => <ControlledSelect />,
};

export const LongContent: Story = {
  render: () => (
    <Select>
      <SelectTrigger>
        <SelectValue>Many options</SelectValue>
        <SelectIcon />
      </SelectTrigger>
      <SelectContent>
        {Array.from({ length: 30 }).map((_, i) => (
          <SelectItem key={i} value={`option-${i}`}>
            Option {i + 1} with a very long label
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ),
};

export const Keyboard: Story = {
  render: () => <ExampleSelect onValueChange={fn()} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox");
    await userEvent.click(trigger);
    await userEvent.keyboard("{arrowdown}");
    await userEvent.keyboard("{enter}");
  },
};
