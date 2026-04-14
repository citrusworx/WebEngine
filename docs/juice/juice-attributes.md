# Juice Attributes Reference

This document provides a reference for the HTML attributes currently supported by Juice.

## Overview

Juice uses HTML attributes to apply styles directly in markup. Attributes are grouped by category: layout, typography, colors, spacing, sizing, shadows, gradients, icons, and components.

## Layout Attributes

### Stack and Flow

- `stack`: creates a vertical flex container
- `row`: creates a horizontal flex container
- `reverse`: reverses direction when combined with `stack` or `row`
- `centered`: centers content and applies alignment helpers

### Grid

- `grid`: creates a CSS grid with predefined templates
  Values: `"2x2"`, `"3x2"`, `"3x3"`, `"4x3"`, `"4x4"`
- `span`: spans grid columns or rows
  Values: `"1"`, `"2"`, `"3"`, `"4"`, `"5"`, `"6"`

### Container and Layout Helpers

- `container`: responsive container helper
- `content`: content-width layout helper
- `bleed`: full-bleed layout helper
- `zone`: layout zoning helper
- `center`: centers inline content through wrapper layout helpers
- `left`: left-aligns wrapper content
- `right`: right-aligns wrapper content

### Positioning

- `position`
  Values: `"toBack"`, `"toFront"`, `"absolute"`
- `float`
  Values: `"left"`

### Spacing Within Layout

- `gap`
  Values: `"1"` through `"10"` and generated explicit values like `"2rem"`, `"24px"`, and `"10%"`
- `space`
  Values: `"between"`, `"around"`, `"evenly"`, `"start"`, `"end"`

## Typography Attributes

### Font Family

- `font`
  Values include integrated Google fonts, Adobe fonts, and a few custom family aliases used by Juice.

Examples:

- `"bebas-neue"`
- `"lato"`
- `"playfair-display"`
- `"source-code-pro"`
- `"korolev-rounded"`
- `"korolev-rounded-bold"`

For the full font list, see [Typography Reference](./juice-typography.md).

### Font Properties

- `fontSize`
  Values: `"sm"`, `"md"`, `"lg"`, `"xl"`, `"xxl"`
- `weight`
  Current support is limited and depends on the font family in use
- `align`
  Values: `"center"`, `"right"`, `"justify"`
- `decoration`
  Values: `"underline"`

## Color Attributes

Color attributes use token names from the Juice color system.

- `fontColor`: sets text color
- `bgColor`: sets background color
- `borderColor`: sets border color
- `hover`: sets hover background or border color
- `shadow`: sets the shadow color custom property used by `depth`

Examples:

- `"green-500"`
- `"white-100"`
- `"obsidian-900"`
- `"skyblue-400"`
- `"bubblegum-300"`

For the full palette, see [Colors Reference](./juice-colors.md).

## Shadow Attributes

- `depth`
  Values: `"sm"`, `"md"`, `"lg"`, `"xl"`

Use `depth` together with `shadow="..."` for a tinted shadow.

## Shape Attributes

- `rounded`
  Values: boolean, `"sm"`, `"md"`, `"lg"`

## Gradient Attributes

- `gradient`
  Values depend on the gradient tokens present in Juice, such as `"citrusmint-300"` or other named gradient families.

## Spacing Attributes

Spacing attributes accept values generated from the utility system.

- `padding`
- `margin`
- `margin-top`
- `margin-bottom`
- `margin-left`
- `margin-right`

Examples:

- `padding="2rem"`
- `padding="24px"`
- `margin="10%"`
- `margin-top="1rem"`

For more detail, see [Spacing Reference](./juice-spacing.md).

## Sizing Attributes

- `width`
  Supports generated `%`, `rem`, and `vw` values
- `height`
  Supports generated `%`, `rem`, and `vh` values

Examples:

- `width="50%"`
- `width="24rem"`
- `height="100vh"`
- `height="40vh"`

For more detail, see [Sizing Reference](./juice-sizing.md).

## Icon Attributes

- `icon`: applies a FontAwesome Free icon mask
  Values: any icon key that exists in the Juice solid, regular, or brands sets

Examples:

- `"check"`
- `"calendar"`
- `"github"`
- `"shopify"`
- `"shield-halved"`

Icons inherit their visible color from `currentColor`, so use `fontColor` to tint them.

For more detail, see [Icons](./juice-icons.md).

## Component Attributes

### Buttons

- `btn`
  Values: `"flat"`, `"outline"`, `"text"`, `"3d"`, `"metallic"`
- `scale`
  Values currently include `"lg"` for button sizing
- `theme`
  Example: `"citrusmint-300"`
- `outline`
  Boolean modifier

### Cards

- `card`
  Values: boolean, `"compact"`, `"feature"`, `"interactive"`, `"split"`, `"cta"`
- `card-size`
  Values: `"sm"`, `"md"`, `"lg"`
- `card-padding`
  Values: `"sm"`, `"md"`, `"lg"`
- `card-flow`
  Values: `"vertical"`, `"horizontal"`
- `card-header`
  Boolean region hook
- `card-body`
  Boolean region hook
- `card-actions`
  Boolean region hook
- `card-meta`
  Boolean region hook
- `card-media`
  Boolean region hook
- `card-divider`
  Boolean region hook

For more detail, see [Cards](./juice-cards.md).

### Forms

- `field`
  Boolean form-field marker
- `type`
  Form usage varies by component context

### Navigation

- `sticky`
  Boolean modifier
- `fixed`
  Boolean modifier

## Usage Examples

```html
<section stack gap="2" padding="2rem" bgColor="white-100" rounded="md">
  <h1 font="bebas-neue" fontSize="xl" fontColor="obsidian-900">Title</h1>
  <p font="lato" fontColor="gray-700" align="center">
    Description text with centered alignment.
  </p>

  <div row gap="1" centered>
    <button bgColor="green-500" hover="green-600" fontColor="white-100" padding="1rem">
      Primary
    </button>
    <i icon="check" width="1rem" height="1rem" fontColor="green-600"></i>
    <i icon="github" width="1rem" height="1rem" fontColor="gray-900"></i>
  </div>
</section>

<div card card="cta" card-size="md" bgColor="white-100" shadow="gray-400" depth="sm">
  <div card-header row space="between" centered>
    <h3 font="korolev-rounded-bold">Card Title</h3>
    <i icon="toggle-on" width="2rem" height="2rem" fontColor="red-800"></i>
  </div>
  <div card-body stack gap="1rem">
    <p font="korolev-rounded">Structured card content.</p>
  </div>
  <div card-actions center>
    <button btn="outline" theme="citrusmint-300" scale="lg">Action</button>
  </div>
</div>
```

## Notes

- All numeric spacing and sizing attributes are generated from the utility system.
- Color values must match existing token names.
- Some attributes are boolean, where presence alone enables the behavior.
- Modifiers like `reverse` and `centered` combine with base layout attributes.
- Component attributes are still early compared with the token and utility layers.
