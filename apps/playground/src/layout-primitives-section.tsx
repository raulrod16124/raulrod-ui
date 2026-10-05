// Probe fixture for the layout primitives at a narrow width (RRU-136, EPIC-12).
//
// This is NOT the responsive section of the playground: RRU-144 owns that, and
// builds the showcase a human reviews. What lives here is the minimum surface the
// E2E suite needs in order to MEASURE the four contracts RRU-136 changed, which
// the existing page cannot supply:
//
//   1. a label with no spaces, so the long-label policy has a real case (an id);
//   2. a row wider than a 320px viewport, so `flex-shrink` has something to fail on.
//
// Neither exists in the app today: every Button label here is prose, and the one
// pair of IconButtons in the overlays section is not a crowded row.
//
// Two rules from `e2e/helpers.ts` shape this file. Every control keeps a real
// accessible name, because a test asserts on the name a user would read, not on
// an index. And the wrappers carry `data-testid` because a plain `div` row has no
// accessible identity of its own — which is exactly the exception the helper
// allows, and the reason no `rr-*` class is ever named here.
import { Check, ChevronDown, Trash2 } from "@raulrod/icons";
import { Button, Heading, IconButton, Inline, Stack, Text } from "@raulrod/ui";

export function LayoutPrimitivesSection() {
  return (
    <Stack gap="space-6">
      <Stack gap="space-3">
        <Heading as="h3">Wrapping label</Heading>
        <Text>
          A label with no spaces at all: the case a flex item cannot shrink past without{" "}
          <code>overflow-wrap: anywhere</code>, since only that value feeds soft wrap opportunities
          into the min-content size.
        </Text>
        {/* `wrap` is opt-in, so the row that reflows has to ask for it. */}
        <Inline data-testid="narrow-wrap-row" gap="space-2" wrap>
          <Button variant="outline">Save</Button>
          <Button variant="outline">rr-7f3a91c2e5b84d0f6a1b2c3d4e5f60718</Button>
          <Button variant="outline">Cancel</Button>
        </Inline>
      </Stack>

      <Stack gap="space-3">
        <Heading as="h3">Crowded icon row</Heading>
        <Text>
          More icon buttons than a 320px viewport can hold, deliberately, with no extra CSS: eight
          squares of 34px plus seven 8px gaps need 328px, so the row is genuinely tight. It is
          expected to overflow rather than squeeze, because every size fixes both its width and its
          height and the square is what keeps a mixed toolbar aligned.
        </Text>
        <Inline data-testid="narrow-icon-row" gap="space-2">
          <IconButton label="Archive item" variant="outline">
            <Check />
          </IconButton>
          <IconButton label="Delete item" variant="outline">
            <Trash2 />
          </IconButton>
          <IconButton label="Move item" variant="outline">
            <ChevronDown />
          </IconButton>
          <IconButton label="Share item" variant="outline">
            <ChevronDown />
          </IconButton>
          <IconButton label="Duplicate item" variant="outline">
            <ChevronDown />
          </IconButton>
          <IconButton label="Restore item" variant="outline">
            <ChevronDown />
          </IconButton>
          <IconButton label="Pin item" variant="outline">
            <Check />
          </IconButton>
          <IconButton label="Print item" variant="outline">
            <ChevronDown />
          </IconButton>
        </Inline>
      </Stack>

      <Stack gap="space-3">
        <Heading as="h3">Mixed toolbar</Heading>
        <Text>
          The alignment contract itself: a Button and an IconButton of the same size share the same
          height, and it is the token arithmetic in the stylesheets that decides it.
        </Text>
        <Inline data-testid="narrow-toolbar-row" gap="space-2">
          <Button variant="outline">Save</Button>
          <IconButton label="Delete item" variant="outline">
            <Trash2 />
          </IconButton>
          <Button variant="outline">Cancel</Button>
        </Inline>
      </Stack>
    </Stack>
  );
}
