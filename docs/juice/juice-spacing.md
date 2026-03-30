# Juice Spacing Reference

This document provides detailed information about Juice's spacing system, including all available spacing attributes, their value ranges, units, and usage examples.

## Overview

Juice provides a comprehensive spacing system through HTML attributes that generate CSS properties for padding, margin, and gap. The system uses numeric values with different units to provide flexible spacing control.

## Spacing Attributes

### Gap

The `gap` attribute controls spacing between flex or grid children.

- **Attribute**: `gap`
- **Values**: `"1"` through `"10"`
- **Unit**: `rem`
- **CSS Property**: `gap`
- **Applies to**: Flex containers (`stack`, `row`) and grid containers (`grid`)

```html
<!-- Flex gap -->
<section stack gap="2">
  <div>Item 1</div>
  <div>Item 2</div>
</section>

<!-- Grid gap -->
<section grid="3x3" gap="1">
  <div>Cell 1</div>
  <div>Cell 2</div>
</section>
```

**Generated CSS Examples:**
```css
[gap="1"] { gap: 1rem; }
[gap="2"] { gap: 2rem; }
/* ... up to */
[gap="10"] { gap: 10rem; }
```

### Padding

The `padding` attribute controls internal spacing within elements.

- **Attribute**: `padding`
- **Values**: `"1"` through `"100"`
- **Units**: `rem`, `px`, `%`
- **CSS Property**: `padding`

```html
<!-- REM units (recommended) -->
<div padding="2rem">Content</div>

<!-- Pixel units -->
<button padding="16px">Button</button>

<!-- Percentage units -->
<div padding="10%">Full width padding</div>
```

**Available Units:**
- `rem`: Relative to root font size (recommended for responsive design)
- `px`: Fixed pixels
- `%`: Percentage of parent width

**Generated Selectors:**
```css
[padding="1rem"] { padding: 1rem; }
[padding="2rem"] { padding: 2rem; }
/* ... up to */
[padding="100rem"] { padding: 100rem; }

[padding="1px"] { padding: 1px; }
/* ... up to */
[padding="100px"] { padding: 100px; }

[padding="1%"] { padding: 1%; }
/* ... up to */
[padding="100%"] { padding: 100%; }
```

### Margin

The `margin` attribute controls external spacing around elements.

- **Attribute**: `margin` (and directional variants)
- **Values**: `"1"` through `"100"`
- **Units**: `rem`, `px`, `%`
- **CSS Property**: `margin` (and directional properties)

**Directional Variants:**
- `margin-top`
- `margin-bottom`
- `margin-left`
- `margin-right`

```html
<!-- General margin -->
<div margin="2rem">Spaced element</div>

<!-- Directional margins -->
<article margin-top="3rem" margin-bottom="2rem">
  <h1>Article Title</h1>
  <p>Article content</p>
</article>

<!-- Mixed units -->
<div margin="10px" margin-top="2rem">Mixed spacing</div>
```

**Generated Selectors:**
```css
[margin="1rem"] { margin: 1rem; }
[margin-top="1rem"] { margin-top: 1rem; }
[margin-bottom="1rem"] { margin-bottom: 1rem; }
[margin-left="1rem"] { margin-left: 1rem; }
[margin-right="1rem"] { margin-right: 1rem; }

/* Same pattern for px and % units */
```

## Implementation Details

### Generator Function

All spacing attributes are generated using the `attribute-generator` mixin in `src/core/mixins.scss`:

```scss
@mixin attribute-generator($property, $unit) {
    @for $i from 1 through 100 {
        [#{$property}="#{$i}#{$unit}"] {
            #{$property}: #{$i}#{$unit};
        }
    }
}
```

### Gap Generator

Gap uses a separate generator with a smaller range:

```scss
@mixin gap-generator(){
    @for $i from 1 through 10 {
        [gap="#{$i}"]{
            gap: #{$i}rem;
        }
    }
}
```

### File Structure

Spacing attributes are organized in the following files:

```
src/styles/
├── padding/
│   ├── padding.scss (forwards to unit files)
│   ├── rem/
│   │   └── rem.scss (@include attribute-generator("padding", "rem"))
│   ├── px/
│   │   └── px.scss (@include attribute-generator("padding", "px"))
│   └── per/
│       └── percent.scss (@include attribute-generator("padding", "%"))
├── margin/
│   ├── margin.scss (forwards to unit files)
│   ├── rem/
│   │   └── rem.scss (includes directional generators)
│   ├── px/
│   │   └── px.scss
│   └── per/
│       └── percent.scss
```

## Usage Guidelines

### Recommended Units

1. **REM units** (`rem`): Preferred for responsive design
   - Scales with root font size
   - Consistent across different screen sizes
   - Recommended for most spacing needs

2. **Pixel units** (`px`): Use for fixed, precise spacing
   - When you need exact pixel values
   - For borders, small details
   - When working with fixed-size components

3. **Percentage units** (`%`): Use for fluid, proportional spacing
   - When spacing should scale with container width
   - For full-width layouts
   - Responsive padding/margins

### Best Practices

```html
<!-- Good: Use REM for consistent spacing -->
<section stack gap="2" padding="2rem">
  <article padding="1rem" margin-bottom="2rem">
    <h1 margin-bottom="1rem">Title</h1>
    <p margin="0">Content</p>
  </article>
</section>

<!-- Good: Use pixels for precise control -->
<button padding="12px 24px" border="2px solid">Button</button>

<!-- Good: Use percentages for fluid layouts -->
<div padding="5%">Responsive container</div>
```

### Common Patterns

```html
<!-- Card with internal padding -->
<div bgColor="white-100" padding="2rem" shadow="gray-500" depth="md">
  <h3 margin-bottom="1rem">Card Title</h3>
  <p margin="0">Card content</p>
</div>

<!-- Form spacing -->
<form stack gap="1" padding="2rem">
  <input field padding="1rem" margin-bottom="0.5rem">
  <button padding="1rem 2rem">Submit</button>
</form>

<!-- Navigation spacing -->
<nav row gap="2" padding="1rem 2rem">
  <a href="/">Home</a>
  <a href="/about">About</a>
</nav>
```

## Value Ranges

- **Gap**: 1-10 (rem only)
- **Padding/Margin**: 1-100 (rem, px, %)

## CSS Output

Each attribute selector generates a single CSS rule:

```css
[padding="16px"] { padding: 16px; }
[margin-top="2rem"] { margin-top: 2rem; }
[gap="3"] { gap: 3rem; }
```

## Performance Notes

- All spacing selectors are generated at build time
- No runtime JavaScript required
- CSS is highly optimized and compressed
- Total selectors: ~900 spacing selectors (gap: 10, padding/margin: 300 each × 3 units)

## Troubleshooting

### Common Issues

1. **Spacing not applying**: Check that the unit is included in the attribute value
   ```html
   <!-- Wrong -->
   <div padding="2">Content</div>
   
   <!-- Right -->
   <div padding="2rem">Content</div>
   ```

2. **Directional margins not working**: Ensure you're using the correct attribute name
   ```html
   <!-- Wrong -->
   <div margin-left="1rem">Content</div>
   
   <!-- Right (if supported) -->
   <div margin-left="1rem">Content</div>
   ```

3. **Gap not working**: Gap only works on flex and grid containers
   ```html
   <!-- Wrong -->
   <div gap="1">
     <span>Item 1</span>
     <span>Item 2</span>
   </div>
   
   <!-- Right -->
   <div row gap="1">
     <span>Item 1</span>
     <span>Item 2</span>
   </div>
   ```</content>
<parameter name="filePath">D:\CitrusWorx\docs\juice\juice-spacing.md