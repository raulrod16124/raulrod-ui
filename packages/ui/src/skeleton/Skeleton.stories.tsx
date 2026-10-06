import type { Meta, StoryObj } from "@storybook/react";

import { NarrowContainer, StoryInline, StoryStack } from "../storybook-support/index.js";

import { Skeleton } from "./Skeleton.js";

const meta: Meta<typeof Skeleton> = {
  title: "Components/Skeleton",
  component: Skeleton,
  args: {
    variant: "rectangle",
  },
  argTypes: {
    variant: { control: "select", options: ["rectangle", "circle"] },
  },
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Playground: Story = {
  render: (args) => <Skeleton {...args} style={{ width: "200px", height: "24px" }} />,
};

export const Default: Story = {
  render: () => <Skeleton style={{ width: "200px", height: "24px" }} />,
};

export const Variants: Story = {
  render: () => (
    <StoryInline gap="space-4" align="center">
      <Skeleton variant="rectangle" style={{ width: "200px", height: "24px" }} />
      <Skeleton variant="circle" style={{ width: "40px", height: "40px" }} />
    </StoryInline>
  ),
};

export const LoadingLayout: Story = {
  render: () => (
    <StoryStack>
      <StoryInline gap="space-4" align="center">
        <Skeleton variant="circle" style={{ width: "40px", height: "40px" }} />
        <Skeleton style={{ width: "160px", height: "16px" }} />
      </StoryInline>
      <Skeleton style={{ width: "100%", height: "12px" }} />
      <Skeleton style={{ width: "80%", height: "12px" }} />
      <Skeleton style={{ width: "60%", height: "12px" }} />
    </StoryStack>
  ),
};

export const Responsive: Story = {
  render: () => (
    <StoryStack gap="space-6">
      <NarrowContainer label="skeleton fills the width of a 200px frame">
        <Skeleton />
      </NarrowContainer>
      <NarrowContainer label="circle skeleton keeps its fixed size" width="240px">
        <StoryInline gap="space-4" align="center">
          <Skeleton variant="circle" />
          <Skeleton variant="circle" />
          <Skeleton variant="circle" />
        </StoryInline>
      </NarrowContainer>
    </StoryStack>
  ),
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
};
