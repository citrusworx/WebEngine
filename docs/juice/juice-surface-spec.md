# Juice Surface Spec

This document defines the surface model for Juice.

The goal is to make Juice expressive at visual treatment without abandoning its strengths in layout, spacing, and responsive scaling — and without violating the [Juice / Themes layer split](./juice-layers.md).

## Core Idea

Juice surfaces are composed from three things:

1. **Structural attributes** — Juice owns these. They describe what a thing *is*.
2. **Utility attributes** — Juice owns these. They describe composable visual traits.
3. **Visual treatment** — Themes own this. It decides how 1 and 2 actually render.

A theme does not invent new structural attributes. A structural attribute does not hardcode brand color.

## Structural Attributes

Structural attributes answer:

> What kind of element is this?

They live on the element itself, as either a boolean (`card`, `hero`) or a variant value (`card="pricing"`, `card="cta"`, `card="feature"`).

Children of structural elements use **bare slot names** from the universal vocabulary (`header`, `body`, `action`, `media`, etc.) — see [Naming](./juice-naming.md). Selectors are always scoped through the parent.

### Example

```html
<section card="hero">
  <div heading>Stewarded Infrastructure</div>
  <div content>Governed execution for modern platforms.</div>
  <div action>
    <button btn="flat">Get Started</button>
  </div>
</section>
```

Structural attributes should:

- describe what the element is, not what it looks like
- pair naturally with the universal slot vocabulary for children
- never encode color, font, or brand identity

## Utility Attributes

Utility attributes answer:

> What visual traits should this element have?

They are small, composable controls that work across many element types.

Examples:

- `surfaceTone="soft"`
- `surfaceTone="strong"`
- `borderStrength="soft"`
- `borderStrength="bold"`
- `shadowTone="cool"`
- `shadowTone="warm"`
- `blur="sm"`
- `blur="md"`
- `overlay="frost"`
- `variant="monochromatic"`
- `variant="glass"`
- `variant="tinted"`
- `lineHeight="2rem"`

Utility attributes should:

- be reusable across many element types
- remain composable
- stay low-level enough to combine freely
- avoid encoding one specific component shape

### Example

```html
<section
  card="hero"
  bgColor="white-100"
  rounded="xl"
  shadow
  depth="md"
  variant="monochromatic"
  lineHeight="2rem"
>
  <h3 heading>Account Health</h3>
  <p content>Usage, retention, and support pressure in one place.</p>
</section>
```

## Visual Treatment (Theme Layer)

Themes own the visual realization of every structural and utility attribute Juice ships.

A theme can decide:

- what `card="hero"` actually looks like (background, gradient, padding texture)
- what `featured` does (gradient? border? scale-up? glow?)
- how `surfaceTone="soft"` translates to actual colors
- which font `heading` uses inside a card

A theme can also add **brand-specific structural variants** by extending the `card` attribute value space — e.g., `card="aqua-hero"` for a theme-specific hero pattern. Theme-specific variants still follow the parent/child naming rule: children inside `card="aqua-hero"` are bare slot names (`header`, `body`, `action`), not `aqua-header` or `aqua-body`.

### Example: same markup, themed

```html
<section card="hero" surfaceTone="soft">
  <div heading>Customer Health</div>
  <div content>Accounts with declining usage are surfaced here.</div>
</section>
```

Under `theme="aquaflux"`, this might render as a glassmorphic panel with a serif heading. Under `theme="kiwipress"`, it might render as a gradient card with a rounded display heading. The markup does not change.

## Layering Model

```
┌──────────────────────────────────────────┐
│ Theme                                    │
│   visual treatment of all Juice attrs    │
│   brand-specific structural variants     │
│   typography, colors, surface character  │
├──────────────────────────────────────────┤
│ Juice utility attributes                 │
│   surfaceTone, borderStrength, blur,     │
│   variant, lineHeight, overlay, ...      │
├──────────────────────────────────────────┤
│ Juice structural attributes              │
│   card, btn, badge, hero, plan,          │
│   bare slot vocabulary (header, body…)   │
├──────────────────────────────────────────┤
│ Juice layout & spacing                   │
│   stack, row, grid, gap, padding, ...    │
└──────────────────────────────────────────┘
```

Reading order in markup:

1. **Layout & spacing** establish the structure of the page.
2. **Structural attributes** identify each region (card, button, badge, hero, plan).
3. **Utility attributes** fine-tune the visual treatment.
4. **The theme** renders all of the above.

### Example

```html
<section
  card="hero"
  paddingX="2rem"
  paddingY="2rem"
  variant="monochromatic"
  lineHeight="2rem"
>
  <div heading>Customer Health</div>
  <div content>Accounts with declining usage are surfaced here.</div>
</section>
```

In this model:

- `card="hero"` provides the structural identity
- `paddingX` and `paddingY` provide spacing (Juice layout layer)
- `variant` and `lineHeight` adjust the visual treatment (Juice utility layer)
- the active theme renders all of it

## Rules

### 1. Utilities describe traits

Utility attributes express visual properties, not whole component identities.

Good:

- `variant="monochromatic"`
- `borderStrength="soft"`

Not ideal:

- `variant="hero-card-premium"` — that is a structural identity, not a trait

### 2. Structural attributes describe what a thing is

Structural attributes go on the element as variants:

- `card="hero"`, `card="pricing"`, `card="cta"`
- `btn="outline"`, `btn="flat"`
- `badge="ribbon"`

Not as compound flags (`hero-panel`, `pricing-card`).

### 3. Children use bare slot names

Inside a structural element, children use the universal vocabulary:

- `header`, `body`, `action`, `media`, `meta`, `divider`
- `heading`, `content`, `name`, `description`, `price`, `features`

Selectors are scoped through the parent.

### 4. Themes own visual realization

Themes decide colors, fonts, shadows, gradients, and surface character for every Juice attribute. Themes do not invent new structural attribute *names*; they may add new *values* to existing attributes (`card="aqua-hero"`).

### 5. Layout remains Juice territory

Themes never replace Juice's layout and spacing primitives.

Use Juice for:

- `row`, `stack`, `grid`
- `gap`, `padding`, `paddingX`, `paddingY`, `margin`
- `width`, `height`
- responsive collapse behavior

Use the theme for:

- color and typography
- shadow tone, depth language
- border character
- background treatment
- surface identity

## Why This Model Fits Juice

This model keeps Juice structured and themes swappable.

- The same JSX renders differently under different themes — only visual treatment changes, not structure.
- Authors learn one vocabulary; theme variation does not require relearning component shapes.
- Juice stays opinionated about layout, spacing, and naming. It stays unopinionated about color, type, and surface tone.

## Legacy Compound Surface Attributes

Earlier drafts of this spec proposed compound surface names like `card-large`, `card-muted`, `hero-panel`, `promo-banner`, `dashboard-panel`. These are deprecated. The canonical forms are:

| Legacy | Canonical |
| --- | --- |
| `card-large` | `card="large"` |
| `card-muted` | `card="muted"` |
| `card-compact` | `card="compact"` |
| `hero-panel` | `card="hero"` or `<section hero>` |
| `promo-banner` | `card="promo"` or `<section promo>` |
| `dashboard-panel` | `card="dashboard"` |
| `aqua-card` | `card` inside `theme="aquaflux"`, optionally `card="aqua-*"` for theme-specific variants |
| `aqua-hero` | `card="hero"` inside `theme="aquaflux"`, optionally `card="aqua-hero"` |

See [Naming](./juice-naming.md) for the underlying rule.

## Summary

Juice surfaces compose from:

- **structural attributes** (Juice) — what a thing is, with bare-slot children
- **utility attributes** (Juice) — composable visual traits
- **visual treatment** (Theme) — how all of it actually renders

That gives Juice an expressive surface language while preserving its design philosophy and the Juice / Themes layer split.

## See also

- [Layers](./juice-layers.md)
- [Naming](./juice-naming.md)
- [Theme Authoring](./juice-theme-authoring.md)
- [Cards](./juice-cards.md)
