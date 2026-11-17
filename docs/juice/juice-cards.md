# Juice Cards

Juice cards are structural components. They define spacing, sizing, content flow, and internal regions while leaving color, typography, icons, and theme styling to the consumer through regular Juice attributes.

`card.scss` and `plan.scss` select compound names (`card-header`, `plan-price`). Bare slot names such as `header` and `price` are not selectors. See [Juice Naming](./juice-naming.md).

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

`card="large"`, `card="muted"`, and `card="hero"` are not selectors in `card.scss`. A hero band is `[hero]`. Width steps are `card-size`. `[card-large]` and `[card-small]` are legacy width shorthands in that file.

Surface-depth **utility** recipes (`variant="monochromatic|glass|tinted"`) are a different attribute — they compose overlay / blur / border / shadow and are not `card="…"` values. See [Surfaces](./juice-surfaces.md). Structural `card` recipes beyond the list above stay later.

## Card sizing

Sizing is `card-size`. `card.scss` says `[card-large]` and `[card-small]` are legacy shorthands and to prefer `card-size`.

```html
<div card card-size="sm"></div>
<div card card-size="md"></div>
<div card card-size="lg"></div>
```

Supported values: `sm`, `md`, `lg`.

## Card padding

Card padding steps are `card-padding`. Numeric `padding="2rem"` is the spacing utility in [Spacing](./juice-spacing.md), not a `card-padding` step.

```html
<div card card-padding="sm"></div>
<div card card-padding="md"></div>
<div card card-padding="lg"></div>
```

Supported values: `sm`, `md`, `lg`.

## Card flow

```html
<div card card-flow="vertical"></div>
<div card card-flow="horizontal"></div>
```

Supported values: `vertical`, `horizontal`.

## Card regions

`card.scss` selects compound region names.

- `card-header` — top section. `[card-header][row]` centers a row
- `card-body` — main content
- `card-actions` — action row. `[card-actions][center]` and `[card-actions][right]` set justification
- `card-meta` — supporting row
- `card-media` — media region
- `card-divider` — 1px divider

Bare `header`, `body`, and `action` are not selectors.

## Example

```html
<div card="cta" card-size="md" bgColor="white-100" shadow="gray-400" depth="sm">
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

## Pricing card example

```html
<div card="pricing" featured>
  <span badge="ribbon">Most Popular</span>
  <div plan>
    <div plan-header>
      <h3>Pro</h3>
      <div plan-price>
        <span plan-currency>$</span>
        <span plan-amount>20</span>
        <span plan-period>/month</span>
      </div>
      <p plan-description>For professional WordPress sites</p>
    </div>

    <ul plan-features>
      <li>10 WordPress sites</li>
      <li>1TB bandwidth</li>
      <li>Priority support</li>
    </ul>

    <div card-actions>
      <button full type="button">Start Free Trial</button>
    </div>
  </div>
</div>
```

`[card="pricing"][featured]` scales the card. `plan.scss` selects `plan-header`, `plan-price`, `plan-currency`, `plan-amount`, `plan-period`, `plan-description`, and `plan-features`. Bare `name`, `price`, `currency`, `amount`, `period`, `description`, and `features` are not selectors.

## Names that are not selectors

`card.scss` does not select `card="large"`, `card="muted"`, `card="hero"`, `size`, `flow`, `header`, `body`, or `action`. `[card-large]` and `[card-small]` are the legacy width shorthands in that file.

## Recommended usage

Let the card define structure, and let wrappers define placement.

Good separation of concerns:

- card controls internal flow
- wrapper controls alignment and placement
- the theme controls colors, fonts, and visual character
- app code controls behavior

That keeps the card system flexible and consistent with Juice's overall philosophy. See [Layers](./juice-layers.md) for the full ownership split.
