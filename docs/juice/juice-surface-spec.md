# Juice Surface Spec

This document defines a proposed surface model for Juice.

The goal is to make Juice stronger at visual treatment without abandoning its existing strengths in layout, spacing, and responsive scaling.

## Core Idea

Juice should support two surface layers:

- utility attributes
- component attributes

These layers solve different problems.

## Utility Attributes

Utility attributes are small, composable visual controls.

They answer:

> What visual traits should this element have?

Examples:

- `lineHeight="4rem"`
- `variant="monochromatic"`
- `surfaceTone="soft"`
- `borderStrength="bold"`
- `blur="md"`

Utility attributes should:

- be reusable across many element types
- remain composable
- stay low-level enough to combine freely
- avoid hardcoding one specific component shape

### Example

```html
<section
  bgColor="white-100"
  rounded="xl"
  shadow
  depth="md"
  variant="monochromatic"
  lineHeight="2rem"
>
  <h3>Account Health</h3>
  <p>Usage, retention, and support pressure in one place.</p>
</section>
```

## Component Attributes

Component attributes are higher-level, named surface patterns.

They answer:

> What kind of element is this?

Examples:

- `card-large`
- `card-compact`
- `hero-panel`
- `promo-banner`
- `dashboard-panel`

Component attributes should:

- feel more opinionated
- represent a reusable authored pattern
- reduce repeated visual assembly in templates
- work well with Juice spacing and layout primitives

### Example

```html
<section card-large>
  <h3>Growth Dashboard</h3>
  <p>Pipeline velocity, activation, and conversion metrics.</p>
</section>
```

## Theme-Specific Component Attributes

Themes may also define named component surfaces.

These answer:

> What kind of element is this within this theme?

Examples:

- `aqua-card`
- `aqua-hero`
- `citrus-card`

These should remain theme-specific rather than becoming global primitives.

### Example

```html
<section theme="aquaflux" aqua-card>
  <h3>Wellness Metrics</h3>
  <p>Membership, bookings, and session utilization.</p>
</section>
```

## Layering Model

The intended layering model is:

1. Juice layout and spacing attributes define structure
2. component or theme attributes define the named surface pattern
3. utility attributes fine-tune that pattern when needed

### Example

```html
<section
  aqua-card
  paddingX="2rem"
  paddingY="2rem"
  variant="monochromatic"
  lineHeight="2rem"
>
  <h3>Customer Health</h3>
  <p>Accounts with declining usage are surfaced here.</p>
</section>
```

In this model:

- `aqua-card` provides the main surface identity
- `paddingX` and `paddingY` provide spacing
- `variant` adjusts the visual treatment
- `lineHeight` adjusts typography rhythm

## Proposed Utility Surface Attributes

The following are good candidates for early utility-level surface primitives:

- `variant`
- `surfaceTone`
- `borderStrength`
- `shadowTone`
- `blur`
- `overlay`
- `lineHeight`

### Example values

- `variant="monochromatic"`
- `variant="glass"`
- `variant="tinted"`
- `surfaceTone="soft"`
- `surfaceTone="strong"`
- `borderStrength="soft"`
- `borderStrength="bold"`
- `shadowTone="cool"`
- `shadowTone="warm"`
- `blur="sm"`
- `blur="md"`
- `overlay="frost"`

These should be designed as composable traits, not as complete components.

## Proposed Component Surface Attributes

The following are good candidates for early component-level patterns:

- `card-large`
- `card-muted`
- `hero-panel`
- `promo-banner`
- `dashboard-panel`

These should be broader than utility attrs and more reusable than one-off template CSS.

## Rules

### 1. Utilities describe traits

Utility attributes should express visual properties, not whole component identities.

Good:

- `variant="monochromatic"`
- `borderStrength="soft"`

Not ideal:

- `variant="hero-card-premium"`

### 2. Components describe named patterns

Component attributes should express a recognized UI surface.

Good:

- `card-large`
- `hero-panel`

### 3. Themes may add themed components

Theme-specific component attributes are encouraged when they reflect a stable themed pattern.

Good:

- `aqua-card`
- `aqua-hero`

### 4. Layout remains Juice territory

Themes and surface patterns should not replace Juice spacing and layout primitives.

Use Juice for:

- `row`
- `stack`
- `gap`
- `paddingX`
- `paddingY`
- `width`
- `height`

Use surfaces for:

- visual tone
- depth
- border character
- background treatment
- surface identity

## Why This Model Fits Juice

This model keeps Juice structured.

It allows Juice to grow more expressive without turning every element into a custom CSS problem.

It also preserves the system split that is already emerging:

- Juice handles layout and spacing
- themes handle typography and color
- surface utilities handle visual traits
- component attributes handle repeatable visual patterns

## Initial Recommendation

The first implementation pass should prototype:

1. utility attributes
   - `variant`
   - `surfaceTone`
   - `borderStrength`
   - `blur`

2. component attributes
   - `card-large`
   - `card-muted`
   - `hero-panel`

3. theme component attributes
   - `aqua-card`
   - `aqua-hero`

## Summary

Juice should support both:

- utility-level surface controls
- component-level named surface patterns

The distinction is:

- utility attributes answer what traits an element has
- component attributes answer what kind of element it is

That gives Juice a stronger surface language while preserving its current design philosophy.
