// Probe fixture for the fluid-family responsive behaviour (RRU-143, EPIC-12).
//
// These ten components were supposed to be "already fluid". The board's value is
// making that claim measurable, and the measurement found four (Text, Heading,
// Badge, Switch.label) that lacked `overflow-wrap`. The frames below are the
// evidence: fixed 200px containers with the worst-case content each component
// can receive from a consumer.
import {
  Avatar,
  Badge,
  Button,
  Checkbox,
  Heading,
  Inline,
  Portal,
  Progress,
  Skeleton,
  Stack,
  Switch,
  Text,
  VisuallyHidden,
} from "@raulrod/ui";

const LONG_TOKEN = "a".repeat(60);
const LONG_URL = "https://example.com/settings/billing/invoices/2026-10-05/download";

export function FluidResponsiveSection() {
  return (
    <Stack gap="space-6">
      <Stack gap="space-3" data-testid="responsive-checkbox-row">
        <Text color="color.text.muted">
          Checkbox is a fixed square replaced element; its three sizes must fit inside a 200px frame
          without overflow.
        </Text>
        <div className="pg-narrow-frame" data-testid="responsive-checkbox-frame">
          <Inline gap="space-4" align="center">
            <Checkbox size="sm" defaultChecked aria-label="Small" />
            <Checkbox size="md" defaultChecked aria-label="Medium" />
            <Checkbox size="lg" defaultChecked aria-label="Large" />
          </Inline>
        </div>
      </Stack>

      <Stack gap="space-3" data-testid="responsive-switch-row">
        <Text color="color.text.muted">
          Switch label wraps instead of pushing the fixed-width track out of the frame.
        </Text>
        <div className="pg-narrow-frame" data-testid="responsive-switch-frame">
          <Switch>{LONG_URL}</Switch>
        </div>
      </Stack>

      <Stack gap="space-3" data-testid="responsive-avatar-row">
        <Text color="color.text.muted">
          Avatar is a fixed square with flex-shrink:0; it must stay square and inside the frame.
        </Text>
        <div className="pg-narrow-frame" data-testid="responsive-avatar-frame">
          <Avatar name="Fluid avatar" />
        </div>
      </Stack>

      <Stack gap="space-3" data-testid="responsive-badge-row">
        <Text color="color.text.muted">
          Badge wraps long unbreakable content instead of overflowing.
        </Text>
        <div className="pg-narrow-frame" data-testid="responsive-badge-frame">
          <Badge>{LONG_URL}</Badge>
        </div>
      </Stack>

      <Stack gap="space-3" data-testid="responsive-skeleton-row">
        <Text color="color.text.muted">Skeleton fills the width of its container.</Text>
        <div className="pg-narrow-frame" data-testid="responsive-skeleton-frame">
          <div data-testid="responsive-skeleton-target">
            <Skeleton />
          </div>
        </div>
      </Stack>

      <Stack gap="space-3" data-testid="responsive-progress-row">
        <Text color="color.text.muted">Progress fills the width of its container.</Text>
        <div className="pg-narrow-frame" data-testid="responsive-progress-frame">
          <Progress value={40} label="Responsive progress" />
        </div>
      </Stack>

      <Stack gap="space-3" data-testid="responsive-text-row">
        <Text color="color.text.muted">
          Text breaks long words. The second frame is a raw span with the same token to prove the
          assertion is not vacuous.
        </Text>
        <div className="pg-narrow-frame" data-testid="responsive-text-frame">
          <Text>{LONG_TOKEN}</Text>
        </div>
        <div className="pg-narrow-frame" data-testid="responsive-text-raw-frame">
          <span>{LONG_TOKEN}</span>
        </div>
      </Stack>

      <Stack gap="space-3" data-testid="responsive-heading-row">
        <Text color="color.text.muted">
          Heading breaks long words. The second frame is a raw span to prove the assertion is not
          vacuous.
        </Text>
        <div className="pg-narrow-frame" data-testid="responsive-heading-frame">
          <Heading as="h3">{LONG_TOKEN}</Heading>
        </div>
        <div className="pg-narrow-frame" data-testid="responsive-heading-raw-frame">
          <span>{LONG_TOKEN}</span>
        </div>
      </Stack>

      <Stack gap="space-3" data-testid="responsive-visually-hidden-row">
        <Text color="color.text.muted">
          VisuallyHidden leaves zero layout footprint; the parent must not scroll horizontally. Tab
          into the skip link to make it visible.
        </Text>
        <div className="pg-narrow-frame" data-testid="responsive-visually-hidden-frame">
          <Inline gap="space-2" align="center">
            <VisuallyHidden focusable>
              <a href="#fluid-responsive">
                Skip to fluid section with enough text that it would overflow the frame if it were
                visible
              </a>
            </VisuallyHidden>
            <Text>Next to the skip link</Text>
          </Inline>
        </div>
      </Stack>

      <Stack gap="space-3" data-testid="responsive-portal-row">
        <Text color="color.text.muted">
          Portal escapes an overflow:hidden ancestor and renders into the body; the portalled button
          must remain visible and inside the viewport.
        </Text>
        <div className="pg-clipped-frame" data-testid="responsive-portal-frame">
          <Portal>
            <Button>Portalled action</Button>
          </Portal>
        </div>
      </Stack>
    </Stack>
  );
}
