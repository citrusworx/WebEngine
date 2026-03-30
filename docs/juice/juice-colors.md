# Juice Color Reference

This document provides a comprehensive reference of all available colors and swatches in Juice's design system.

## Overview

Juice organizes colors into families, each containing a base set of 9 shades (100-900) and optional named swatches with their own 9-shade palettes. Colors are defined using HSL values for consistency and accessibility.

## Color Families and Swatches

### Black Family

**Base Black Shades:**
- `black-100` through `black-900`: Grayscale from 50% to 10% lightness

**Swatches:**
- `obsidian`: Deep, rich blacks with blue undertones
- `onyx`: Pure blacks with neutral undertones

### Blue Family

**Base Blue Shades:**
- `blue-100` through `blue-900`: Standard blue palette

**Swatches:**
- `cornflower`: Soft blue with purple undertones
- `morningblue`: Bright, sky-like blue
- `royalblue`: Deep, regal blue
- `skyblue`: Light, airy blue

### Brown Family

**Base Brown Shades:**
- `brown-100` through `brown-900`: Warm brown palette

**Swatches:**
- No additional swatches (uses base brown palette)

### Gray Family

**Base Gray Shades:**
- `gray-100` through `gray-900`: Neutral gray palette from 95% to 55% lightness

**Swatches:**
- `concrete`: Cool-toned grays

### Green Family

**Base Green Shades:**
- `green-100` through `green-900`: Standard green palette

**Swatches:**
- `citrusmint`: Bright, fresh mint green
- `freshgreen`: Vibrant, natural green
- `lime`: Bright, acidic lime green
- `wintergreen`: Cool, muted green

### Orange Family

**Base Orange Shades:**
- `orange-100` through `orange-900`: Standard orange palette

**Swatches:**
- `creamsicle`: Warm, creamy orange
- `peach`: Soft, peachy orange

### Pink Family

**Base Pink Shades:**
- `pink-100` through `pink-900`: Standard pink palette

**Swatches:**
- `bubblegum`: Bright, playful pink
- `neonpink`: Electric, vibrant pink

### Purple Family

**Base Purple Shades:**
- `purple-100` through `purple-900`: Standard purple palette

**Swatches:**
- No additional swatches (uses base purple palette)

### Red Family

**Base Red Shades:**
- `red-100` through `red-900`: Standard red palette

**Swatches:**
- `brickred`: Warm, earthy red
- `burgundy`: Deep, wine-like red
- `candyapple`: Bright, glossy red
- `cherryred`: Classic cherry red
- `crimson`: Deep, blood-like red
- `maroon`: Dark, brownish red
- `scarlett`: Bright, scarlet red

### White Family

**Base White Shades:**
- `white-100` through `white-900`: Off-white palette from 100% to 60% lightness

**Swatches:**
- No additional swatches (uses base white palette)

### Yellow Family

**Base Yellow Shades:**
- `yellow-100` through `yellow-900`: Standard yellow palette

**Swatches:**
- `dandelion`: Warm, golden yellow
- `lemon`: Bright, citrus yellow

## Color Usage in Attributes

Colors can be used in the following Juice attributes:

### Text Color
```html
<p fontColor="cornflower-500">Blue text</p>
<p fontColor="obsidian-900">Dark text</p>
<p fontColor="citrusmint-300">Mint text</p>
```

### Background Color
```html
<div bgColor="white-100">White background</div>
<div bgColor="cherryred-500">Red background</div>
<div bgColor="freshgreen-200">Light green background</div>
```

### Border Color
```html
<div borderColor="gray-300">Gray border</div>
<div borderColor="royalblue-600">Blue border</div>
```

### Hover Effects
```html
<button hover="green-600" bgColor="green-500">Hover to darker green</button>
<button hover="bubblegum-400" bgColor="bubblegum-500">Hover to lighter pink</button>
```

### Shadows
```html
<div shadow="gray-500" depth="md">Gray shadow</div>
<div shadow="purple-300" depth="lg">Purple shadow</div>
```

### Gradients
```html
<div gradient="citrusmint-500">Mint gradient background</div>
<div gradient="cherryred-600">Red gradient background</div>
```

## Shade Reference

Each color and swatch provides 9 shades:

- **100**: Lightest shade (highest lightness)
- **200**: Very light
- **300**: Light
- **400**: Medium-light
- **500**: Medium (base color)
- **600**: Medium-dark
- **700**: Dark
- **800**: Very dark
- **900**: Darkest shade (lowest lightness)

## Color Values

Colors are defined using HSL (Hue, Saturation, Lightness) values for:

- **Consistency**: Uniform color model across all shades
- **Accessibility**: Easier to maintain contrast ratios
- **Flexibility**: Easy to adjust lightness while maintaining hue and saturation

Example HSL values:
- `cornflower-500`: `hsl(223, 73%, 50%)`
- `citrusmint-300`: `hsl(160, 84%, 70%)`
- `cherryred-700`: `hsl(0, 78%, 40%)`

## Implementation Details

### File Structure

Colors are organized in the token system:

```
src/tokens/color/
├── {family}/
│   ├── {family}.yaml      # Base color definition
│   ├── {family}.scss      # SCSS imports
│   └── swatch/
│       └── {swatch}/
│           ├── {swatch}.yaml    # Swatch color values
│           └── {swatch}.scss    # SCSS variables
```

### Generated CSS

Each color generates multiple CSS selectors:

```css
[fontColor="cornflower-100"] { color: hsl(223, 73%, 75%); }
[fontColor="cornflower-200"] { color: hsl(223, 73%, 70%); }
/* ... up to cornflower-900 */

[bgColor="cornflower-100"] { background-color: hsl(223, 73%, 75%); }
/* ... */

[borderColor="cornflower-100"] { border-color: hsl(223, 73%, 75%); }
/* ... */

[hover="cornflower-100"]:hover { background-color: hsl(223, 73%, 75%); border-color: hsl(223, 73%, 75%); }
/* ... */

[shadow="cornflower-100"] { --shadow-color: hsl(223, 73%, 75%); }
/* ... */
```

## Color Naming Convention

### Family Names
- **Descriptive**: Names reflect the color family (black, blue, green, etc.)
- **Consistent**: All lowercase, single word where possible

### Swatch Names
- **Descriptive**: Names evoke the color's character or inspiration
- **Unique**: No duplicate names across families
- **CamelCase**: Multi-word names use camelCase (e.g., `cornflower`, `skyblue`)

### Shade Numbers
- **100-900**: 9 shades per color/swatch
- **Progressive**: Higher numbers = darker shades
- **Standard**: 500 is typically the base/most saturated shade

## Accessibility Considerations

### Contrast Ratios
- **Text on backgrounds**: Ensure sufficient contrast between `fontColor` and `bgColor`
- **Interactive elements**: Maintain contrast for hover states
- **Borders**: Consider contrast for focus indicators

### Color Blindness
- **Avoid relying solely on color**: Use shapes, text, or patterns with color
- **Test combinations**: Verify that color pairs work for different types of color blindness

### High Contrast Mode
- **Respect user preferences**: Colors should adapt to high contrast mode
- **Semantic colors**: Use colors that convey meaning appropriately

## Best Practices

### Semantic Color Usage
```html
<!-- Good: Use descriptive color names -->
<div bgColor="skyblue-100" fontColor="obsidian-900">Light blue background with dark text</div>

<!-- Good: Use consistent shade relationships -->
<button bgColor="freshgreen-500" hover="freshgreen-600" fontColor="white-100">Green button</button>
```

### Color Harmony
```html
<!-- Good: Use colors from the same family -->
<section bgColor="cornflower-50" fontColor="cornflower-900">
  <h1 fontColor="royalblue-700">Blue-themed section</h1>
</section>

<!-- Good: Use complementary colors -->
<div bgColor="citrusmint-100" borderColor="cherryred-300">Mint background with red accent</div>
```

### Consistent Shade Usage
```html
<!-- Good: Use consistent shade patterns -->
<nav bgColor="black-900" fontColor="white-100">
  <a hover="gray-700">Navigation link</a>
</nav>

<!-- Avoid: Inconsistent shade usage -->
<div bgColor="green-200" fontColor="green-800">Inconsistent green shades</div>
```

## Complete Color List

### All Available Colors

**Black Family:**
- black-100, black-200, black-300, black-400, black-500, black-600, black-700, black-800, black-900
- obsidian-100 through obsidian-900
- onyx-100 through onyx-900

**Blue Family:**
- blue-100 through blue-900
- cornflower-100 through cornflower-900
- morningblue-100 through morningblue-900
- royalblue-100 through royalblue-900
- skyblue-100 through skyblue-900

**Brown Family:**
- brown-100 through brown-900

**Gray Family:**
- gray-100 through gray-900
- concrete-100 through concrete-900

**Green Family:**
- green-100 through green-900
- citrusmint-100 through citrusmint-900
- freshgreen-100 through freshgreen-900
- lime-100 through lime-900
- wintergreen-100 through wintergreen-900

**Orange Family:**
- orange-100 through orange-900
- creamsicle-100 through creamsicle-900
- peach-100 through peach-900

**Pink Family:**
- pink-100 through pink-900
- bubblegum-100 through bubblegum-900
- neonpink-100 through neonpink-900

**Purple Family:**
- purple-100 through purple-900

**Red Family:**
- red-100 through red-900
- brickred-100 through brickred-900
- burgundy-100 through burgundy-900
- candyapple-100 through candyapple-900
- cherryred-100 through cherryred-900
- crimson-100 through crimson-900
- maroon-100 through maroon-900
- scarlett-100 through scarlett-900

**White Family:**
- white-100 through white-900

**Yellow Family:**
- yellow-100 through yellow-900
- dandelion-100 through dandelion-900
- lemon-100 through lemon-900

## Migration Notes

### From Other Color Systems
- **Shade mapping**: 100-900 maps roughly to other systems' 50-950 ranges
- **Base colors**: 500 shades typically correspond to base colors in other systems
- **Consistency**: All colors follow the same 9-shade structure

### Legacy Color Names
- **textColor**: Use `fontColor` instead
- **bgColor**: Remains the same
- **borderColor**: Remains the same

## Performance Notes

- **Total colors**: ~300 unique color values (30+ color families/swatches × 9 shades)
- **CSS selectors**: ~1,800 selectors generated (300 colors × 6 attributes)
- **Build time**: Colors are processed at build time, no runtime overhead
- **File size**: Optimized and compressed in final CSS output</content>
<parameter name="filePath">D:\CitrusWorx\docs\juice\juice-colors.md