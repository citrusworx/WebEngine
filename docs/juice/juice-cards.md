# Juice Cards

Juice cards are structural components. They define spacing, sizing, content flow, and internal regions while leaving color, typography, icons, and theme styling to the consumer through regular Juice attributes.

Cards follow the parent/child/sibling naming rule from [Juice Naming](./juice-naming.md). Children use bare slot names; variants and scalars live on the card itself.

## Design intent

Cards in Juice should answer questions like:

- How wide is this card?
- How much padding does it use?
- Does the content flow vertically or horizontally?
- Does the card have a header, body, media area, or actions area?
- Is the card interactive?

Cards should not hardcode brand styling that belongs to the app or theme using Juice.

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

Variants live as values on the `card` attribute.

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

### `card="pricing"`

Use for pricing tiers. Pairs naturally with a `plan` child region.

### `card="large"`, `card="muted"`, `card="hero"`

Sizing and surface-character variants. These replace the legacy `card-large`, `card-muted`, `hero-panel` shorthands.

## Card sizing

Sizing lives on the card itself with the bare `size` attribute.

```html
<div card size="sm"></div>
<div card size="md"></div>
<div card size="lg"></div>
```

Supported values:

- `size="sm"`
- `size="md"`
- `size="lg"`

Selector scoping happens through attribute combination, e.g. `[card][size="md"]`.

## Card padding

```html
<div card padding="sm"></div>
<div card padding="md"></div>
<div card padding="lg"></div>
```

Supported values:

- `padding="sm"`
- `padding="md"`
- `padding="lg"`

`padding` also accepts numeric values like `padding="2rem"` (see [Spacing](./juice-spacing.md)).

## Card flow

Cards can explicitly change their internal flow with the bare `flow` attribute.

```html
<div card flow="vertical"></div>
<div card flow="horizontal"></div>
```

Supported values:

- `flow="vertical"`
- `flow="horizontal"`

## Card regions

Region children use bare slot names from the universal vocabulary. Their meaning comes from the parent `card`.

### `header`

Top section for title, intro, toggle rows, or leading metadata.

### `body`

Main content region. Text, lists, or core information.

### `action`

Action row for buttons, links, and CTA controls.

### `meta`

Small supporting metadata row for pills, labels, or short supporting facts.

### `media`

Media region for icons, illustrations, or images.

### `divider`

Simple visual divider inside a card.

## Example

```html
<div card="cta" size="md" bgColor="white-100" shadow="gray-400" depth="sm">
  <div header row space="between" centered>
    <h3 font="korolev-rounded-bold" fontSize="xl">Simple Mode</h3>
    <i icon="toggle-on" width="2rem" height="2rem" fontColor="red-800"></i>
  </div>

  <div body stack gap="1rem">
    <p font="korolev-rounded">
      Managed hosting and governance for teams that want clarity without losing control.
    </p>
  </div>

  <div action center>
    <button btn="outline" theme="citrusmint-300" scale="lg">Click Me</button>
  </div>
</div>
```

## Pricing card example

```html
<div card="pricing" featured>
  <span badge="ribbon">Most Popular</span>
  <div plan>
    <div header>
      <div name>Pro</div>
      <div price>
        <span currency>$</span>
        <span amount>20</span>
        <span period>/month</span>
      </div>
      <p description>For professional WordPress sites</p>
    </div>

    <ul features>
      <li>10 WordPress sites</li>
      <li>1TB bandwidth</li>
      <li>Priority support</li>
    </ul>

    <div action>
      <button full type="button">Start Free Trial</button>
    </div>
  </div>
</div>
```

## Legacy shorthands

Previous versions of Juice used BEM-style compound names. These are deprecated; the canonical forms above should be used in all new code.

| Legacy | Canonical |
| --- | --- |
| `card-header` | `header` |
| `card-body` | `body` |
| `card-actions` | `action` |
| `card-meta` | `meta` |
| `card-media` | `media` |
| `card-divider` | `divider` |
| `card-size="X"` | `size="X"` |
| `card-padding="X"` | `padding="X"` |
| `card-flow="X"` | `flow="X"` |
| `card-large` | `card="large"` |
| `card-small` | `card="small"` |
| `card-compact` | `card="compact"` |
| `card-muted` | `card="muted"` |

## Recommended usage

Let the card define structure, and let wrappers define placement.

Good separation of concerns:

- card controls internal flow
- wrapper controls alignment and placement
- the theme controls colors, fonts, and visual character
- app code controls behavior

That keeps the card system flexible and consistent with Juice's overall philosophy. See [Layers](./juice-layers.md) for the full ownership split.
