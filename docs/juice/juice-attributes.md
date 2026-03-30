# Juice Attributes Reference

This document provides a comprehensive reference of all HTML attributes supported by Juice, the attribute-driven styling library for CitrusWorx apps.

## Overview

Juice uses HTML attributes to apply styles directly in markup. Attributes are grouped by category: layout, typography, colors, spacing, sizing, shadows, gradients, and components.

## Layout Attributes

### Stack and Flow
- `stack` (boolean): Creates a vertical flex container (`display: flex; flex-direction: column`)
- `reverse` (modifier): Reverses direction when combined with `stack` or `row`
- `centered` (modifier): Centers content and applies auto margins
- `row` (boolean): Creates a horizontal flex container (`display: flex; flex-direction: row`)

### Grid
- `grid`: Creates a CSS grid with predefined templates
  - Values: `"2x2"`, `"3x2"`, `"3x3"`, `"4x3"`, `"4x4"`
- `span`: Spans grid columns or rows
  - Values: `"1"`, `"2"`, `"3"`, `"4"`, `"5"`, `"6"`

### Spacing
- `gap`: Sets gap between flex/grid items
  - Values: `"1"`, `"2"`, `"3"`, `"4"`, `"5"`, `"6"`, `"7"`, `"8"`, `"9"`, `"10"` (in rem units)

### Positioning
- `position`: Basic positioning
  - Values: `"toBack"` (z-index: -1), `"toFront"` (z-index: 1), `"absolute"`
- `float`: Float positioning
  - Values: `"left"`

## Typography Attributes

### Font Family
- `font`: Sets font family
  - Google Fonts: `"abril-fatface"`, `"acme"`, `"anton"`, `"architects-daughter"`, `"archivo-black"`, `"bebas-neue"`, `"caveat"`, `"comfortaa"`, `"dancing-script"`, `"homemade-apple"`, `"indie-flower"`, `"josefin-sans"`, `"lato"`, `"lilita-one"`, `"lobster"`, `"luckiest-guy"`, `"macondo"`, `"montserrat"`, `"open-sans"`, `"oswald"`, `"pacifico"`, `"play"`, `"playfair-display"`, `"poppins"`, `"poppins-light"`, `"raleway"`, `"reenie-beanie"`, `"roboto"`, `"satisfy"`, `"source-code-pro"`, `"titillium-web"`, `"ubuntu"`, `"yanone-kaffeesatz"`
  - Adobe Fonts: `"korolev-rounded-light"`, `"korolev-rounded"`, `"korolev-rounded-bold"`, `"alientz"`, `"darka"`, `"grange"`, `"p22-sting"`, `"private-sans"`
  - Other: `"Inter"` (with weight support)

*For a complete guide to all integrated fonts, see [Typography Reference](./juice-typography.md)*

### Font Properties
- `weight`: Font weight (currently only for Inter)
  - Values: `"normal"`
- `fontSize`: Preset font sizes
  - Values: `"sm"`, `"md"`, `"lg"`, `"xl"`, `"xxl"`

### Text Alignment and Decoration
- `align`: Text alignment (for `<p>` elements)
  - Values: `"center"`, `"right"`, `"justify"`
- `decoration`: Text decoration (for `<p>` elements)
  - Values: `"underline"`

## Color Attributes

Colors are organized by families with swatches. Each swatch provides 9 shades (100-900).

### Color Families and Swatches

#### Black
- Swatches: `obsidian`, `onyx`
- Example values: `"obsidian-100"`, `"obsidian-200"`, ..., `"obsidian-900"`, `"onyx-100"`, etc.

#### Blue
- Swatches: `cornflower`, `morningblue`, `royalblue`, `skyblue`
- Example values: `"cornflower-100"`, `"cornflower-200"`, ..., `"cornflower-900"`, etc.

#### Brown
- Swatches: `chocolate`, `sienna`
- Example values: `"chocolate-100"`, `"chocolate-200"`, ..., `"chocolate-900"`, etc.

#### Gray
- Swatches: `gray`
- Example values: `"gray-100"`, `"gray-200"`, ..., `"gray-900"`

#### Green
- Swatches: `freshgreen`, `lime`, `wintergreen`
- Example values: `"freshgreen-100"`, `"freshgreen-200"`, ..., `"freshgreen-900"`, etc.

#### Orange
- Swatches: `carrot`, `tangerine`
- Example values: `"carrot-100"`, `"carrot-200"`, ..., `"carrot-900"`, etc.

#### Pink
- Swatches: `bubblegum`
- Example values: `"bubblegum-100"`, `"bubblegum-200"`, ..., `"bubblegum-900"`

#### Purple
- Swatches: `eggplant`, `lavender`
- Example values: `"eggplant-100"`, `"eggplant-200"`, ..., `"eggplant-900"`, etc.

#### Red
- Swatches: `cherryred`, `strawberry`
- Example values: `"cherryred-100"`, `"cherryred-200"`, ..., `"cherryred-900"`, etc.

#### White
- Swatches: `white`
- Example values: `"white-100"`, `"white-200"`, ..., `"white-900"`

#### Yellow
- Swatches: `banana`, `lemon`
- Example values: `"banana-100"`, `"banana-200"`, ..., `"banana-900"`, etc.

### Color Application Attributes
- `fontColor`: Sets text color
  - Values: Any color swatch value (e.g., `"green-500"`, `"obsidian-900"`)
- `bgColor`: Sets background color
  - Values: Any color swatch value
- `borderColor`: Sets border color
  - Values: Any color swatch value
- `hover`: Sets hover background/border color
  - Values: Any color swatch value
- `shadow`: Sets shadow color (sets CSS custom property `--shadow-color`)
  - Values: Any color swatch value
*For a complete list of all available colors and swatches, see [Colors Reference](./juice-colors.md)*
## Shadow Attributes

- `depth`: Applies box shadow when combined with `shadow` attribute
  - Values: `"sm"`, `"md"`, `"lg"`, `"xl"`

## Gradient Attributes

Gradients are applied as background images.

- `gradient`: Sets gradient background
  - Values: `"citrusmint-100"`, `"citrusmint-200"`, ..., `"citrusmint-900"`, `"greenblue-100"`, etc.

## Spacing Attributes

Spacing attributes accept numeric values from 1-100 with units.

### Padding
- `padding`: All padding
  - Units: `rem`, `px`, `%`
  - Example: `padding="2rem"`, `padding="24px"`, `padding="10%"`

### Margin
- `margin`: All margins
  - Units: `rem`, `px`, `%`
  - Example: `margin="2rem"`, `margin="24px"`, `margin="10%"`
- `margin-top`: Top margin only
- `margin-bottom`: Bottom margin only
- `margin-left`: Left margin only
- `margin-right`: Right margin only

*For detailed spacing information including gap, see [Spacing Reference](./juice-spacing.md)*

## Sizing Attributes

Sizing attributes accept numeric values from 1-100 with units.

### Width
- `width`: Element width
  - Units: `%`, `rem`, `vw`
  - Example: `width="50%"`, `width="20rem"`, `width="80vw"`

### Height
- `height`: Element height
  - Units: `%`, `rem`, `vh`
  - Example: `height="100%"`, `height="20rem"`, `height="100vh"`

*For detailed sizing information including width and height, see [Sizing Reference](./juice-sizing.md)*

## Component Attributes

### Buttons
- `btn`: Button style
  - Values: `"flat"`
- `scale`: Size variant
  - Values: `"lg"`
- `theme`: Theme color
  - Values: `"citrusmint-300"`
- `outline`: Boolean attribute for outline style

### Forms
- `type`: Form type
  - Values: `"signin"`, `"signup"`, `"search"`
- `scale`: Size variant
  - Values: `"lg"`
- `field`: Boolean attribute for form fields

### Navigation
- `type`: Navigation type
  - Values: `"bar"`, `"strip"`
- `theme`: Theme color
  - Values: `"citrusmint-300"`
- `gradient`: Gradient theme
  - Values: `"citrusmint-300"`
- `sticky`: Boolean attribute for sticky positioning
- `fixed`: Boolean attribute for fixed positioning

## Usage Examples

```html
<!-- Layout -->
<section stack gap="2" padding="2rem">
  <h1 font="bebas-neue" fontSize="xl" fontColor="obsidian-900">Title</h1>
  <p font="lato" fontColor="gray-700" align="center">
    Description text with centered alignment.
  </p>
  <div row gap="1" centered>
    <button bgColor="green-500" hover="green-600" fontColor="white-100" padding="1rem">
      Primary
    </button>
    <button borderColor="green-500" hover="green-500" outline fontColor="green-700" padding="1rem">
      Secondary
    </button>
  </div>
</section>

<!-- Grid -->
<section grid="3x3" gap="2">
  <div span="2" bgColor="blue-500" padding="1rem">Wide item</div>
  <div bgColor="green-500" padding="1rem">Normal item</div>
  <div bgColor="red-500" padding="1rem">Normal item</div>
</section>

<!-- Shadows -->
<div shadow="gray-500" depth="md" padding="2rem" bgColor="white-100">
  Shadowed card
</div>

<!-- Gradients -->
<header gradient="citrusmint-500" padding="3rem" fontColor="white-100">
  <h1 font="playfair-display">Gradient Header</h1>
</header>
```

## Notes

- All numeric spacing and sizing attributes generate selectors from 1-100
- Color values must match existing token names
- Some attributes are boolean (presence indicates application)
- Modifiers like `reverse` and `centered` combine with base attributes
- Component attributes may have limited values based on current implementation</content>
<parameter name="filePath">D:\CitrusWorx\docs\juice\juice-attributes.md