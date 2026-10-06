import type { Meta, StoryObj } from "@storybook/react";

import { fn, userEvent, within } from "@storybook/test";

import { Check, ChevronDown, Trash2 } from "@raulrod/icons";

import { Button } from "../button/index.js";
import { Inline } from "../inline/index.js";
import { NarrowContainer, StoryInline, StoryStack } from "../storybook-support/index.js";

import { IconButton } from "./IconButton.js";

const meta: Meta<typeof IconButton> = {
  title: "Components/IconButton",
  component: IconButton,
  args: {
    label: "Action",
    children: <ChevronDown />,
    disabled: false,
    loading: false,
    variant: "primary",
    size: "md",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "outline", "ghost", "destructive", "link"],
    },
    size: { control: "select", options: ["sm", "md", "lg"] },
    children: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof IconButton>;

export const Playground: Story = {};

export const Default: Story = {};

export const Variants: Story = {
  render: () => (
    <StoryInline gap="space-4">
      {(["primary", "secondary", "outline", "ghost", "destructive", "link"] as const).map(
        (variant) => (
          <IconButton key={variant} label={variant} variant={variant}>
            <ChevronDown />
          </IconButton>
        ),
      )}
    </StoryInline>
  ),
};

export const Sizes: Story = {
  render: () => (
    <StoryInline gap="space-4" align="center">
      <IconButton label="Small" size="sm">
        <Check />
      </IconButton>
      <IconButton label="Medium" size="md">
        <Check />
      </IconButton>
      <IconButton label="Large" size="lg">
        <Check />
      </IconButton>
    </StoryInline>
  ),
};

export const Disabled: Story = {
  render: () => (
    <StoryInline gap="space-4">
      {(["primary", "secondary", "outline", "ghost", "destructive"] as const).map((variant) => (
        <IconButton key={variant} label={variant} variant={variant} disabled>
          <Trash2 />
        </IconButton>
      ))}
    </StoryInline>
  ),
};

export const Loading: Story = {
  render: () => (
    <StoryInline gap="space-4">
      {(["primary", "secondary", "outline", "ghost", "destructive"] as const).map((variant) => (
        <IconButton key={variant} label={variant} variant={variant} loading>
          <Trash2 />
        </IconButton>
      ))}
    </StoryInline>
  ),
};

export const Keyboard: Story = {
  args: {
    label: "Delete item",
    children: <Trash2 />,
    onClick: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Delete item" });
    await userEvent.click(button);
    await userEvent.keyboard("{enter}");
  },
};

/**
 * RRU-136, ADR-008. There is no long-label case here: the icon is decorative and
 * `label` is the accessible name, so Button's wrapping policy must not leak in.
 * What a narrow width CAN break is the square.
 *
 * Every size declares `width` AND `height`, and that square is what keeps a mixed
 * Button/IconButton toolbar aligned. A flex item with a specified width and the
 * default `flex-shrink: 1` gives up that width while its height stays fixed, so
 * the control silently becomes a rectangle. The first frame below is the case
 * that demonstrates it is prevented: a row wider than its 320px container, where
 * the last item is the one that would lose width. The second frame is the mixed
 * toolbar the square exists to serve.
 */
export const Responsive: Story = {
  render: () => (
    <StoryStack gap="space-6">
      <NarrowContainer label="a row too wide for the container stays square and overflows">
        <Inline gap="space-2">
          <IconButton label="Archive" variant="outline">
            <Check />
          </IconButton>
          <IconButton label="Delete" variant="outline">
            <Trash2 />
          </IconButton>
          <IconButton label="Move to another workspace" variant="outline">
            <ChevronDown />
          </IconButton>
          <IconButton label="Share" variant="outline">
            <ChevronDown />
          </IconButton>
          <IconButton label="Duplicate" variant="outline">
            <ChevronDown />
          </IconButton>
        </Inline>
      </NarrowContainer>
      <NarrowContainer label="mixed toolbar — Button and IconButton keep the same heights">
        <Inline gap="space-2">
          <Button variant="outline">Save</Button>
          <IconButton label="Delete" variant="outline">
            <Trash2 />
          </IconButton>
          <Button variant="outline">Cancel</Button>
        </Inline>
      </NarrowContainer>
    </StoryStack>
  ),
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
};
