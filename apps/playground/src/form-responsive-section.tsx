// Probe fixture for the form-family responsive behaviour (RRU-142, EPIC-12).
//
// The existing form-section.tsx is a real form with consumer overrides
// (.pg-field max-width, .pg-row flex-wrap), so it cannot measure the DS-level
// shrink behaviour. This fixture uses fixed 200px frames and nowrap Inline rows
// so the E2E can assert that Input, Textarea, Radio and FormField shrink or
// wrap instead of overflowing.
import {
  Button,
  FormField,
  FormFieldControl,
  Inline,
  Input,
  Radio,
  RadioGroup,
  Stack,
  Text,
  Textarea,
} from "@raulrod/ui";

export function FormResponsiveSection() {
  return (
    <Stack gap="space-6">
      <Stack gap="space-3" data-testid="responsive-input-row">
        <Text color="color.text.muted">
          Input + Button in a nowrap row inside a 200px frame. The input must shrink below its
          intrinsic UA width instead of pushing the row out.
        </Text>
        <div className="pg-narrow-frame" data-testid="responsive-input-frame">
          <Inline>
            <Input placeholder="Email" />
            <Button>Send</Button>
          </Inline>
        </div>
      </Stack>

      <Stack gap="space-3" data-testid="responsive-textarea-row">
        <Text color="color.text.muted">
          Textarea with autosize inside a 200px frame. The control and the autosize wrapper must
          both shrink.
        </Text>
        <div className="pg-narrow-frame" data-testid="responsive-textarea-frame">
          <Textarea
            autoResize
            defaultValue="A very long unbrokenwordthatwouldotherwisepushtheframeout."
          />
        </div>
      </Stack>

      <Stack gap="space-3" data-testid="responsive-radio-row">
        <Text color="color.text.muted">
          Horizontal radio group with five options inside a 200px frame. It must wrap onto multiple
          rows instead of overflowing or crushing labels.
        </Text>
        <div className="pg-narrow-frame" data-testid="responsive-radio-frame">
          <RadioGroup defaultValue="a" orientation="horizontal">
            <Radio value="a">Alpha</Radio>
            <Radio value="b">Beta</Radio>
            <Radio value="c">Gamma</Radio>
            <Radio value="d">Delta</Radio>
            <Radio value="e">Epsilon</Radio>
          </RadioGroup>
        </div>
      </Stack>

      <Stack gap="space-3" data-testid="responsive-form-field-row">
        <Text color="color.text.muted">
          FormField + Button in a nowrap row inside a 200px frame. The field root and its control
          slot must shrink as flex items.
        </Text>
        <div className="pg-narrow-frame" data-testid="responsive-form-field-frame">
          <Inline>
            <FormField>
              <FormFieldControl>
                {(field) => <Input placeholder="Search" {...field} />}
              </FormFieldControl>
            </FormField>
            <Button>Go</Button>
          </Inline>
        </div>
      </Stack>
    </Stack>
  );
}
