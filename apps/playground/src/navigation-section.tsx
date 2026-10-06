// Probe fixture for the navigation-family responsive behaviour (RRU-141, EPIC-12).
//
// This section gives the E2E suite the two horizontal rails the ticket covers:
// Pagination (collapses to prev/current/next) and Tabs (scrollport horizontal).
// The existing playground has no wide enough pagination or tab set to overflow
// at 320px, and changing the a11y-review widget would alter the manual review
// surface (RRU-071).
import { Pagination, Stack, Tabs, TabsList, TabsPanel, TabsTrigger, Text } from "@raulrod/ui";

export function NavigationSection() {
  return (
    <Stack gap="space-6">
      <Stack gap="space-3" data-testid="responsive-pagination">
        <Text color="color.text.muted">
          Pagination with its maximum 9-node bar: prev + first + ellipsis + window + ellipsis + last
          + next. At 320px it collapses to previous/current/next.
        </Text>
        <Pagination aria-label="Paged results" pageCount={20} defaultPage={10} />
      </Stack>

      <Stack gap="space-3" data-testid="responsive-tabs">
        <Text color="color.text.muted">
          Tabs wider than a 320px viewport: the rail becomes a horizontal scrollport, and keyboard
          arrows still move focus and selection together.
        </Text>
        <Tabs defaultValue="1">
          <TabsList aria-label="Wide tab set">
            {Array.from({ length: 8 }).map((_, i) => (
              <TabsTrigger key={i} value={`${i + 1}`}>
                Tab {i + 1}
              </TabsTrigger>
            ))}
          </TabsList>
          {Array.from({ length: 8 }).map((_, i) => (
            <TabsPanel key={i} value={`${i + 1}`}>
              Content of tab {i + 1}
            </TabsPanel>
          ))}
        </Tabs>
      </Stack>
    </Stack>
  );
}
