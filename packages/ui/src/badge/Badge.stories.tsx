import type { Meta, StoryObj } from "@storybook/react";

import { NarrowContainer, StoryInline, StoryStack } from "../storybook-support/index.js";

import { Badge } from "./Badge.js";

const meta: Meta<typeof Badge> = {
  title: "Components/Badge",
  component: Badge,
  args: {
    children: "Badge",
    variant: "neutral",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["neutral", "success", "warning", "destructive", "info"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Playground: Story = {};

export const Default: Story = {};

export const Variants: Story = {
  render: () => (
    <StoryInline gap="space-4">
      {(["neutral", "success", "warning", "destructive", "info"] as const).map((variant) => (
        <Badge key={variant} variant={variant}>
          {variant}
        </Badge>
      ))}
    </StoryInline>
  ),
};

export const LongContent: Story = {
  render: () => (
    <StoryStack>
      <Badge>This badge has a very long label that should not break layout</Badge>
      <StoryInline gap="space-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Badge key={i}>tag-{i + 1}</Badge>
        ))}
      </StoryInline>
    </StoryStack>
  ),
};

export const Responsive: Story = {
  render: () => (
    <StoryStack gap="space-6">
      <NarrowContainer label="long badge content wraps instead of overflowing">
        <Badge>https://example.com/settings/billing/invoices/2026-10-05/download</Badge>
      </NarrowContainer>
      <NarrowContainer label="multiple badges wrap inside a 240px frame" width="240px">
        <StoryInline gap="space-2" wrap>
          {Array.from({ length: 12 }).map((_, i) => (
            <Badge key={i}>badge-{i + 1}</Badge>
          ))}
        </StoryInline>
      </NarrowContainer>
    </StoryStack>
  ),
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
};
