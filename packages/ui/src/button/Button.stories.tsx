import type { Meta, StoryObj } from "@storybook/react";

import { fn, userEvent, within } from "@storybook/test";

import { ChevronDown, Loader2 } from "@raulrod/icons";

import { Inline } from "../inline/index.js";
import { NarrowContainer, StoryInline, StoryStack } from "../storybook-support/index.js";

import { Button } from "./Button.js";

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  args: {
    children: "Button",
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
    startIcon: { control: false },
    endIcon: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Playground: Story = {};

export const Default: Story = {};

export const Variants: Story = {
  render: () => (
    <StoryInline gap="space-4">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="link">Link</Button>
    </StoryInline>
  ),
};

export const Sizes: Story = {
  render: () => (
    <StoryInline gap="space-4" align="center">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </StoryInline>
  ),
};

export const Disabled: Story = {
  render: () => (
    <StoryInline gap="space-4">
      {(["primary", "secondary", "outline", "ghost", "destructive", "link"] as const).map(
        (variant) => (
          <Button key={variant} variant={variant} disabled>
            {variant}
          </Button>
        ),
      )}
    </StoryInline>
  ),
};

export const Loading: Story = {
  render: () => (
    <StoryInline gap="space-4">
      {(["primary", "secondary", "outline", "ghost", "destructive"] as const).map((variant) => (
        <Button key={variant} variant={variant} loading>
          {variant}
        </Button>
      ))}
    </StoryInline>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <StoryInline gap="space-4">
      <Button startIcon={<ChevronDown />}>Start icon</Button>
      <Button endIcon={<ChevronDown />}>End icon</Button>
      <Button startIcon={<ChevronDown />} endIcon={<ChevronDown />}>
        Both icons
      </Button>
    </StoryInline>
  ),
};

export const AsAnchor: Story = {
  render: () => (
    <StoryInline gap="space-4">
      <Button href="https://example.com" target="_blank">
        External link (rel defaults)
      </Button>
      <Button href="https://example.com" target="_blank" rel="external">
        External link (rel overridden)
      </Button>
      <Button href="https://example.com" disabled>
        Disabled link
      </Button>
    </StoryInline>
  ),
};

export const Keyboard: Story = {
  args: {
    children: "Click me",
    onClick: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Click me" });
    await userEvent.click(button);
    await userEvent.keyboard("{enter}");
  },
};

export const LongContent: Story = {
  render: () => (
    <StoryStack>
      <Button size="sm">This is a very long label for a small button</Button>
      <Button>This is a very long label for a medium button</Button>
      <Button size="lg">This is a very long label for a large button</Button>
    </StoryStack>
  ),
};

/**
 * RRU-136, ADR-008. The previous version of this story set `flex: 1 1 120px` on
 * every button, so it demonstrated the CONSUMER's CSS, not the component's.
 *
 * What is worth seeing at a narrow width is the long-label policy, and the case
 * that makes it necessary is a label with NO SPACES — a URL, an id, an email.
 * `min-width: 0` lets the control shrink as a flex item, and
 * `overflow-wrap: anywhere` is the value that feeds soft wrap opportunities into
 * the min-content size (`break-word` would not, so the floor would survive).
 * The label WRAPS: it is never truncated, because `text-overflow` does not apply
 * to this `inline-flex` root and clipping a centred label would cut it on both
 * edges. `LongContent` above is the prose version of the same case.
 */
export const Responsive: Story = {
  render: () => (
    <StoryStack gap="space-6">
      <NarrowContainer label="unbreakable labels wrap inside a 320px container">
        <StoryStack gap="space-3">
          <Button>Cancel-the-subscription-and-refund-the-current-period</Button>
          <Button size="sm">
            https://example.com/settings/billing/invoices/2026-10-05/download
          </Button>
          <Button size="lg">rr-7f3a91c2e5b84d0f6a1b2c3d4e5f60718</Button>
        </StoryStack>
      </NarrowContainer>
      <NarrowContainer label="a row of buttons wraps with Inline's wrap, not by overflowing">
        <Inline wrap gap="space-2">
          <Button variant="outline">Save draft</Button>
          <Button variant="outline">Discard</Button>
          <Button variant="outline">Duplicate workspace and invite teammates</Button>
        </Inline>
      </NarrowContainer>
    </StoryStack>
  ),
  parameters: {
    // The narrow viewport EPIC-12 measures at, from the Dialog precedent. The
    // frames above are containers, so they behave the same at any window size;
    // this only keeps the story honest about the width it was reviewed at.
    viewport: { defaultViewport: "mobile1" },
  },
};

export const CustomSpinner: Story = {
  render: () => (
    <Button loading startIcon={<Loader2 />}>
      Loading with start icon
    </Button>
  ),
};
