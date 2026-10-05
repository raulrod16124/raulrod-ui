import type { Meta, StoryObj } from "@storybook/react";

import { fn, userEvent, within } from "@storybook/test";

import { NarrowContainer, StoryStack } from "../storybook-support/index.js";

import { Pagination } from "./Pagination.js";

const meta: Meta<typeof Pagination> = {
  title: "Components/Pagination",
  component: Pagination,
  args: {
    pageCount: 10,
    defaultPage: 1,
  },
  argTypes: {
    page: { control: { type: "number", min: 1 } },
    pageCount: { control: { type: "number", min: 1 } },
    defaultPage: { control: { type: "number", min: 1 } },
  },
};

export default meta;
type Story = StoryObj<typeof Pagination>;

export const Playground: Story = {};

export const Default: Story = {};

export const FewPages: Story = {
  args: {
    pageCount: 3,
    defaultPage: 2,
  },
};

export const ManyPages: Story = {
  args: {
    pageCount: 20,
    defaultPage: 10,
  },
};

export const BoundaryCases: Story = {
  render: () => (
    <StoryStack>
      <Pagination pageCount={10} defaultPage={1} />
      <Pagination pageCount={10} defaultPage={10} />
      <Pagination pageCount={1} defaultPage={1} />
    </StoryStack>
  ),
};

export const Controlled: Story = {
  args: {
    pageCount: 10,
    page: 5,
    onPageChange: fn(),
  },
};

export const Keyboard: Story = {
  args: {
    pageCount: 5,
    defaultPage: 1,
    onPageChange: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const next = canvas.getByRole("button", { name: "Next page" });
    await userEvent.click(next);
    await userEvent.keyboard("{tab}{enter}");
  },
};

export const Responsive: Story = {
  render: () => (
    <StoryStack gap="space-6">
      <NarrowContainer label="collapsed to previous/current/next at 320px">
        <Pagination pageCount={15} defaultPage={8} />
      </NarrowContainer>
      <NarrowContainer label="full bar inside a 640px container" width="640px">
        <Pagination pageCount={15} defaultPage={8} />
      </NarrowContainer>
    </StoryStack>
  ),
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
};
