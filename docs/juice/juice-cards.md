# Juice Cards

Juice cards are structural components. They are meant to define spacing, sizing, content flow, and internal regions while leaving color, typography, icons, and theme styling to the consumer through regular Juice attributes.

## Design intent

Cards in Juice should answer questions like:

- How wide is this card?
- How much padding does it use?
- Does the content flow vertically or horizontally?
- Does the card have a header, body, media area, or actions area?
- Is the card interactive?

Cards should not hardcode brand styling that belongs to the app using Juice.

## Base card

The base card is enabled with the `card` attribute:

```html
<div card bgColor="white-100" shadow="gray-400" depth="sm">
  <h3 font="korolev-rounded-bold">Card title</h3>
  <p font="korolev-rounded">Card content</p>
</div>
```

The base card currently provides:

- vertical content flow
- internal gap
- border radius
- padding
- responsive width behavior
- `box-sizing: border-box`

## Card variants

### `card="compact"`

Use for denser UI and smaller content blocks.

### `card="feature"`

Use for landing-page or marketing content with more generous spacing and rhythm.

### `card="interactive"`

Use for clickable or focusable cards that should lift slightly on hover or focus.

### `card="split"`

Use for two-region layouts such as media + content or content + sidebar.

### `card="cta"`

Use for cards that end in a clear action area and need a little more space around the action row.

## Card sizing

Prefer the newer `card-size` attribute over the older legacy shorthands.

```html
<div card card-size="sm"></div>
<div card card-size="md"></div>
<div card card-size="lg"></div>
```

Supported values:

- `card-size="sm"`
- `card-size="md"`
- `card-size="lg"`

Legacy shorthands still present in the stylesheet:

- `card-small`
- `card-large`

## Card padding

```html
<div card card-padding="sm"></div>
<div card card-padding="md"></div>
<div card card-padding="lg"></div>
```

Supported values:

- `card-padding="sm"`
- `card-padding="md"`
- `card-padding="lg"`

## Card flow

Cards can explicitly change their internal flow:

```html
<div card card-flow="vertical"></div>
<div card card-flow="horizontal"></div>
```

Supported values:

- `card-flow="vertical"`
- `card-flow="horizontal"`

## Card regions

Juice now provides a small set of card region hooks so card markup can be more semantic and repeatable.

### `card-header`

Top section for title, intro, toggle rows, or leading metadata.

### `card-body`

Main content region. This is usually where text, lists, or core information lives.

### `card-actions`

Action row for buttons, links, and CTA controls.

### `card-meta`

Small supporting metadata row for pills, labels, or short supporting facts.

### `card-media`

Media region for icons, illustrations, or images.

### `card-divider`

Simple visual divider inside a card.

## Example

```html
<div card card="cta" card-size="md" bgColor="white-100" shadow="gray-400" depth="sm">
  <div card-header row space="between" centered>
    <h3 font="korolev-rounded-bold" fontSize="xl">Simple Mode</h3>
    <i icon="toggle-on" width="2rem" height="2rem" fontColor="red-800"></i>
  </div>

  <div card-body stack gap="1rem">
    <p font="korolev-rounded">
      Managed hosting and governance for teams that want clarity without losing control.
    </p>
  </div>

  <div card-actions center>
    <button btn="outline" theme="citrusmint-300" scale="lg">Click Me</button>
  </div>
</div>
```

## Recommended usage

Let the card define structure, and let wrappers define placement.

Good separation of concerns:

- card controls internal flow
- wrapper controls alignment and placement
- app code controls colors, fonts, and theme expression

That keeps the card system flexible and consistent with Juice’s overall philosophy.
