import type { Meta, StoryObj } from "@storybook/react";

import { StoryStack } from "../storybook-support/index.js";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "./index.js";

const meta: Meta<typeof Table> = {
  title: "Components/Table",
  component: Table,
  args: {
    size: "md",
    sticky: false,
    loading: false,
  },
  argTypes: {
    size: { control: "select", options: ["sm", "md"] },
    sticky: { control: "boolean" },
    loading: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Table>;

const basicRows = [
  { name: "Ada Lovelace", role: "Engineer", hours: 120 },
  { name: "Grace Hopper", role: "Admiral", hours: 145 },
  { name: "Tim Berners-Lee", role: "Inventor", hours: 90 },
];

function BasicTable(props: React.ComponentProps<typeof Table>) {
  return (
    <Table {...props}>
      <TableCaption>Team hours</TableCaption>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Name</TableHeaderCell>
          <TableHeaderCell>Role</TableHeaderCell>
          <TableHeaderCell numeric>Hours</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {basicRows.map((row) => (
          <TableRow key={row.name}>
            <TableCell>{row.name}</TableCell>
            <TableCell>{row.role}</TableCell>
            <TableCell numeric>{row.hours}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export const Playground: Story = {
  render: (args) => <BasicTable {...args} />,
};

export const Default: Story = {
  render: () => <BasicTable />,
};

export const Sizes: Story = {
  render: () => (
    <StoryStack>
      <BasicTable size="sm" />
      <BasicTable size="md" />
    </StoryStack>
  ),
};

export const Empty: Story = {
  render: () => (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Name</TableHeaderCell>
          <TableHeaderCell>Role</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody empty="No results found" />
    </Table>
  ),
};

export const Error: Story = {
  render: () => (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Name</TableHeaderCell>
          <TableHeaderCell>Role</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody empty="No results found" error="Failed to load data" />
    </Table>
  ),
};

export const Loading: Story = {
  render: () => (
    <Table loading>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Name</TableHeaderCell>
          <TableHeaderCell>Role</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody empty="No results" />
    </Table>
  ),
};

export const LongContent: Story = {
  render: () => (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Description</TableHeaderCell>
          <TableHeaderCell numeric>Amount</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {Array.from({ length: 20 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell>
              A very long description that will test the row height and wrapping behaviour
            </TableCell>
            <TableCell numeric>{(i + 1) * 1000}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

export const Responsive: Story = {
  render: () => (
    <div style={{ maxWidth: "320px" }}>
      <BasicTable />
    </div>
  ),
};
