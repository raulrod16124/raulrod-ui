import type { Meta, StoryObj } from "@storybook/react";

import { StoryInline } from "../storybook-support/index.js";

import { Avatar } from "./Avatar.js";

const meta: Meta<typeof Avatar> = {
  title: "Components/Avatar",
  component: Avatar,
  args: {
    name: "Raúl Ortiz",
    size: "md",
  },
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg"] },
    src: { control: "text" },
    alt: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const Playground: Story = {};

export const Default: Story = {};

export const Sizes: Story = {
  render: () => (
    <StoryInline gap="space-4" align="center">
      <Avatar name="Ada Lovelace" size="sm" />
      <Avatar name="Ada Lovelace" size="md" />
      <Avatar name="Ada Lovelace" size="lg" />
    </StoryInline>
  ),
};

export const WithImage: Story = {
  render: () => (
    <StoryInline gap="space-4" align="center">
      <Avatar name="Ada Lovelace" size="sm" src="https://i.pravatar.cc/150?u=ada" />
      <Avatar name="Ada Lovelace" size="md" src="https://i.pravatar.cc/150?u=ada" />
      <Avatar name="Ada Lovelace" size="lg" src="https://i.pravatar.cc/150?u=ada" />
    </StoryInline>
  ),
};

export const Fallback: Story = {
  render: () => (
    <StoryInline gap="space-4" align="center">
      <Avatar name="Ada Lovelace" size="md" src="https://example.com/broken.jpg" />
      <Avatar name="Grace Hopper" size="md" src="https://example.com/broken.jpg" />
      <Avatar name="Single" size="md" src="https://example.com/broken.jpg" />
    </StoryInline>
  ),
};

export const LongName: Story = {
  render: () => <Avatar name="María de la Paz Mercedes Bismarck Ramírez de Arrellano" size="md" />,
};

export const Responsive: Story = {
  render: () => (
    <StoryInline gap="space-4" style={{ flexWrap: "wrap" }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <Avatar key={i} name={`User ${i + 1}`} size={i % 2 === 0 ? "md" : "sm"} />
      ))}
    </StoryInline>
  ),
};
