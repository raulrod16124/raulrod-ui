import type { Meta, StoryObj } from "@storybook/react";

import {
  NarrowContainer,
  Placeholder,
  StoryInline,
  StoryStack,
} from "../storybook-support/index.js";
import { Text } from "../text/index.js";

import { Stack } from "./Stack.js";

const meta: Meta<typeof Stack> = {
  title: "Components/Stack",
  component: Stack,
  args: {
    gap: "space-4",
    align: "stretch",
    justify: "start",
    wrap: false,
  },
  argTypes: {
    gap: {
      control: "select",
      options: [
        "space-0",
        "space-1",
        "space-2",
        "space-3",
        "space-4",
        "space-5",
        "space-6",
        "space-8",
        "space-10",
        "space-12",
        "space-16",
      ],
    },
    align: { control: "select", options: ["start", "center", "end", "stretch", "baseline"] },
    justify: {
      control: "select",
      options: ["start", "center", "end", "between", "around", "evenly"],
    },
    wrap: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Stack>;

export const Playground: Story = {
  render: (args) => (
    <Stack {...args}>
      <Placeholder>First</Placeholder>
      <Placeholder>Second</Placeholder>
      <Placeholder>Third</Placeholder>
    </Stack>
  ),
};

export const Default: Story = {
  render: () => (
    <Stack>
      <Placeholder>First</Placeholder>
      <Placeholder>Second</Placeholder>
      <Placeholder>Third</Placeholder>
    </Stack>
  ),
};

export const Gaps: Story = {
  render: () => (
    <StoryStack>
      <StoryInline gap="space-6" align="start">
        <Stack gap="space-2">
          <Placeholder>2</Placeholder>
          <Placeholder>2</Placeholder>
        </Stack>
        <Stack gap="space-4">
          <Placeholder>4</Placeholder>
          <Placeholder>4</Placeholder>
        </Stack>
        <Stack gap="space-6">
          <Placeholder>6</Placeholder>
          <Placeholder>6</Placeholder>
        </Stack>
        <Stack gap="space-8">
          <Placeholder>8</Placeholder>
          <Placeholder>8</Placeholder>
        </Stack>
      </StoryInline>
    </StoryStack>
  ),
};

export const Alignments: Story = {
  render: () => (
    <StoryStack>
      {(["start", "center", "end", "stretch"] as const).map((align) => (
        <Stack key={align} gap="space-2" align={align} style={{ width: "100%" }}>
          <Placeholder>{align}</Placeholder>
        </Stack>
      ))}
    </StoryStack>
  ),
};

export const LongContent: Story = {
  render: () => (
    <Stack style={{ maxWidth: "320px" }}>
      <Placeholder>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut
        labore et dolore magna aliqua.
      </Placeholder>
      <Placeholder>
        Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
        commodo consequat.
      </Placeholder>
    </Stack>
  ),
};

/**
 * RRU-136, ADR-008. A Stack cannot overflow on its own main axis — it is a
 * `column`, so its height grows and its width follows its container. The two
 * things worth SHOWING at a narrow width are the properties it does have:
 *
 *  - `min-width: 0` means a Stack nested in a flex or grid parent can shrink
 *    below its widest child, so the consumer's `overflow: hidden` truncation can
 *    actually engage. Below, the long text sits in a 320px container and is cut
 *    with an ellipsis, which is impossible while the automatic flex item minimum
 *    is still the min-content size.
 *  - `align="stretch"` (the default) fills the container width, so the same
 *    Stack reflows its text to whatever width it is given without any resize
 *    listener.
 */
export const Responsive: Story = {
  render: () => (
    <StoryStack gap="space-6">
      <NarrowContainer label="stretch — text reflows to the container width">
        <Stack gap="space-3">
          <Placeholder style={{ minWidth: 0, maxWidth: "100%" }}>
            The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.
          </Placeholder>
        </Stack>
      </NarrowContainer>
      <NarrowContainer label="min-width: 0 — the consumer can now clip what does not fit">
        <Stack gap="space-3">
          <div
            style={{
              maxInlineSize: "100%",
              minInlineSize: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <Text size="font.size.sm">
              A single unbreakable token is the case that needs min-width: 0 on both the flex item
              and the wrapper, or neither can ever cut it: rr-7f3a91c2e5b84d0f6a1b2c3d4e5f60718
            </Text>
          </div>
        </Stack>
      </NarrowContainer>
    </StoryStack>
  ),
};
