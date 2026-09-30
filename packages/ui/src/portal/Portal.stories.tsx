import type { Meta, StoryObj } from "@storybook/react";

import { useState } from "react";

import { Text } from "../index.js";

import { Portal } from "./Portal.js";

const meta: Meta<typeof Portal> = {
  title: "Components/Portal",
  component: Portal,
  parameters: {
    // Portal renders into document.body by default; a static canvas story
    // cannot show that reliably, so we render inside a custom container.
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof Portal>;

function PortalPlayground() {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  return (
    <div>
      <Text>This text is in the normal React tree.</Text>
      <div
        ref={setContainer}
        style={{
          marginTop: "var(--rr-space-4)",
          padding: "var(--rr-space-4)",
          background: "var(--rr-color-background-sunken)",
          border: "1px dashed var(--rr-color-border-strong)",
        }}
      >
        <Text>Portal target below:</Text>
        {container && (
          <Portal container={container}>
            <Text color="color.text.danger">This content is portaled inside the dashed box.</Text>
          </Portal>
        )}
      </div>
    </div>
  );
}

function PortalDefault() {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  return (
    <div
      ref={setContainer}
      style={{
        padding: "var(--rr-space-4)",
        background: "var(--rr-color-background-sunken)",
      }}
    >
      {container && (
        <Portal container={container}>
          <Text>Portaled child</Text>
        </Portal>
      )}
    </div>
  );
}

export const Playground: Story = {
  render: () => <PortalPlayground />,
};

export const Default: Story = {
  render: () => <PortalDefault />,
};
