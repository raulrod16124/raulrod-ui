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
    <Table>
      <Table.Caption>Responsive Table (narrow viewport)</Table.Caption>
      <Table.Head>
        <Table.Row>
          <Table.HeaderCell>Name</Table.HeaderCell>
          <Table.HeaderCell>Handle</Table.HeaderCell>
          <Table.HeaderCell>Email</Table.HeaderCell>
          <Table.HeaderCell>UUID</Table.HeaderCell>
          <Table.HeaderCell>Description</Table.HeaderCell>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        <Table.Row>
          <Table.Cell>Ana Martínez</Table.Cell>
          <Table.Cell>@ana_martinez_design</Table.Cell>
          <Table.Cell>ana.martinez.design+verylongemail@example-domain-name.co</Table.Cell>
          <Table.Cell>f7b8a5d0-9c42-4e86-b9f3-8d62f40ab3f9</Table.Cell>
          <Table.Cell>
            https://example.com/components/table/responsive-behavior/with-very-long-unbroken-url-path-that-should-wrap-or-trigger-horizontal-scroll
          </Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell>Jon López</Table.Cell>
          <Table.Cell>@jonlop</Table.Cell>
          <Table.Cell>jon.lopez+qa@example.com</Table.Cell>
          <Table.Cell>6b902e73-8c44-46f1-bb80-d90f36af22f0</Table.Cell>
          <Table.Cell>
            Long unbroken token 7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f
          </Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell>Mara Chen</Table.Cell>
          <Table.Cell>@mara</Table.Cell>
          <Table.Cell>mara@example.com</Table.Cell>
          <Table.Cell>9a407058-dbc9-4d41-b9c4-b25d67113e70</Table.Cell>
          <Table.Cell>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
