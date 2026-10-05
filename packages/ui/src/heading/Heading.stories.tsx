import type { Meta, StoryObj } from "@storybook/react";

import { NarrowContainer, StoryStack } from "../storybook-support/index.js";

import { Heading } from "./Heading.js";

const meta: Meta<typeof Heading> = {
  title: "Components/Heading",
  component: Heading,
  args: {
    children: "Heading",
    as: "h2",
    color: "color.text.primary",
  },
  argTypes: {
    as: { control: "select", options: ["h1", "h2", "h3", "h4", "h5", "h6"] },
    color: {
      control: "select",
      options: [
        "color.text.primary",
        "color.text.muted",
        "color.text.inverse",
        "color.text.danger",
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Heading>;

export const Playground: Story = {};

export const Default: Story = {};

export const Levels: Story = {
  render: () => (
    <StoryStack>
      {(["h1", "h2", "h3", "h4", "h5", "h6"] as const).map((level) => (
        <Heading key={level} as={level}>
          {level}
        </Heading>
      ))}
    </StoryStack>
  ),
};

export const Colors: Story = {
  render: () => (
    <StoryStack>
      {(["color.text.primary", "color.text.muted", "color.text.danger"] as const).map((color) => (
        <Heading key={color} as="h3" color={color}>
          {color.replace("color.text.", "")}
        </Heading>
      ))}
      <div
        style={{ background: "var(--rr-color-background-sunken)", padding: "var(--rr-space-2)" }}
      >
        <Heading as="h3" color="color.text.inverse">
          inverse
        </Heading>
      </div>
    </StoryStack>
  ),
};

export const LongContent: Story = {
  render: () => (
    <Heading as="h3" style={{ maxWidth: "320px" }}>
      A very long heading that wraps across multiple lines to test line-height and readability
    </Heading>
  ),
};

export const Responsive: Story = {
  render: () => (
    <StoryStack gap="space-6">
      <NarrowContainer label="long words break instead of overflowing">
        <Heading as="h1">https://example.com/settings/billing/invoices/2026-10-05/download</Heading>
      </NarrowContainer>
      <NarrowContainer label="heading at display size still wraps" width="240px">
        <Heading as="h2">
          {["A long heading that must wrap cleanly inside a narrow container without truncation."]}
        </Heading>
      </NarrowContainer>
    </StoryStack>
  ),
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
};
