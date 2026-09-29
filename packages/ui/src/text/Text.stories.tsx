import type { Meta, StoryObj } from "@storybook/react";

import { StoryStack } from "../storybook-support/index.js";

import { Text } from "./Text.js";

const meta: Meta<typeof Text> = {
  title: "Components/Text",
  component: Text,
  args: {
    children: "The quick brown fox jumps over the lazy dog.",
    size: "font.size.base",
    weight: "font.weight.regular",
    color: "color.text.primary",
  },
  argTypes: {
    size: {
      control: "select",
      options: [
        "font.size.2xs",
        "font.size.xs",
        "font.size.sm",
        "font.size.base",
        "font.size.lg",
        "font.size.xl",
        "font.size.2xl",
        "font.size.3xl",
        "font.size.4xl",
        "font.size.5xl",
      ],
    },
    weight: {
      control: "select",
      options: [
        "font.weight.regular",
        "font.weight.medium",
        "font.weight.semibold",
        "font.weight.bold",
      ],
    },
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
type Story = StoryObj<typeof Text>;

export const Playground: Story = {};

export const Default: Story = {};

const SIZES = [
  "font.size.2xs",
  "font.size.xs",
  "font.size.sm",
  "font.size.base",
  "font.size.lg",
  "font.size.xl",
  "font.size.2xl",
  "font.size.3xl",
  "font.size.4xl",
  "font.size.5xl",
] as const;

export const Sizes: Story = {
  render: () => (
    <StoryStack>
      {SIZES.map((size) => (
        <Text key={size} size={size}>
          {size.replace("font.size.", "")}
        </Text>
      ))}
    </StoryStack>
  ),
};

export const Weights: Story = {
  render: () => (
    <StoryStack>
      {(
        [
          "font.weight.regular",
          "font.weight.medium",
          "font.weight.semibold",
          "font.weight.bold",
        ] as const
      ).map((weight) => (
        <Text key={weight} weight={weight}>
          {weight.replace("font.weight.", "")}
        </Text>
      ))}
    </StoryStack>
  ),
};

export const Colors: Story = {
  render: () => (
    <StoryStack>
      {(["color.text.primary", "color.text.muted", "color.text.danger"] as const).map((color) => (
        <Text key={color} color={color}>
          {color.replace("color.text.", "")}
        </Text>
      ))}
      <div
        style={{ background: "var(--rr-color-background-sunken)", padding: "var(--rr-space-2)" }}
      >
        <Text color="color.text.inverse">inverse</Text>
      </div>
    </StoryStack>
  ),
};

export const LongContent: Story = {
  render: () => (
    <Text style={{ maxWidth: "320px" }}>
      The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How
      vexingly quick daft zebras jump! Sphinx of black quartz, judge my vow. Two driven jocks help
      fax my big quiz.
    </Text>
  ),
};

export const Responsive: Story = {
  render: () => (
    <Text size="font.size.lg" style={{ maxWidth: "100%" }}>
      This text scales by using the DS type scale. Resize the viewport to see it reflow.
    </Text>
  ),
};
