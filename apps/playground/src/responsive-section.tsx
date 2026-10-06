// Showcase responsive surface of the playground (RRU-144).
//
// This is the "real section" EPIC-12 left pending: a human-visible place where
// the responsive behaviour of the system can be compared at three widths.
// Each frame is a fixed-width device simulator (320 / 375 / 768 px) clamped to
// the available width, so the demo stays honest on a phone viewport.
//
// The probe inside each frame deliberately repeats the same content: the point
// is to see how the SAME consumer markup behaves at different widths.
import { Badge, Button, Heading, Inline, Stack, Text } from "@raulrod/ui";

const LONG_TOKEN = "probe-7f3a91c2e5b84d0f6a1b2c3d4e5f60718";
const LONG_URL = "https://example.com/settings/billing/invoices/2026-10-05/download";

const FRAMES = [320, 375, 768] as const;

export function ResponsiveSection() {
  return (
    <Stack gap="space-6">
      <Text color="color.text.muted">
        The same content rendered inside three device-width frames. At narrow widths text wraps,
        buttons reflow and badges stay inside their container.
      </Text>

      <Inline className="pg-responsive-frames" gap="space-4" wrap>
        {FRAMES.map((width) => (
          <div
            className="pg-responsive-frame"
            data-testid={`responsive-frame-${width}`}
            key={width}
            style={{ width: `${width}px` }}
          >
            <Text className="pg-responsive-frame__label" color="color.text.muted">
              {width}px
            </Text>
            <Stack gap="space-3">
              <Heading as="h4">Responsive probe</Heading>
              <Text>{LONG_URL}</Text>
              <Inline gap="space-2" wrap>
                <Button variant="outline">Save</Button>
                <Button variant="outline">{LONG_TOKEN}</Button>
              </Inline>
              <Badge>{LONG_TOKEN}</Badge>
            </Stack>
          </div>
        ))}
      </Inline>
    </Stack>
  );
}
