# Juice Sizing Reference

This document provides detailed information about Juice's sizing system, including all available sizing attributes, their value ranges, units, and usage examples.

## Overview

Juice provides a comprehensive sizing system through HTML attributes that generate CSS properties for width and height. The system uses numeric values with different units to provide flexible dimension control for responsive design.

## Sizing Attributes

### Width

The `width` attribute controls the width of elements.

- **Attribute**: `width`
- **Values**: `"1"` through `"100"`
- **Units**: `rem`, `%`, `vw`
- **CSS Property**: `width`

```html
<!-- REM units (recommended for fixed widths) -->
<div width="20rem">Fixed width container</div>

<!-- Percentage units (responsive to parent) -->
<div width="50%">Half-width element</div>

<!-- Viewport width units (responsive to screen) -->
<div width="80vw">Full-width hero</div>
```

**Available Units:**
- `rem`: Relative to root font size (recommended for consistent, scalable widths)
- `%`: Percentage of parent container width
- `vw`: Percentage of viewport width (1vw = 1% of viewport width)

**Generated Selectors:**
```css
[width="1rem"] { width: 1rem; }
[width="2rem"] { width: 2rem; }
/* ... up to */
[width="100rem"] { width: 100rem; }

[width="1%"] { width: 1%; }
/* ... up to */
[width="100%"] { width: 100%; }

[width="1vw"] { width: 1vw; }
/* ... up to */
[width="100vw"] { width: 100vw; }
```

### Height

The `height` attribute controls the height of elements.

- **Attribute**: `height`
- **Values**: `"1"` through `"100"`
- **Units**: `rem`, `%`, `vh`
- **CSS Property**: `height`

```html
<!-- REM units (recommended for fixed heights) -->
<div height="10rem">Fixed height container</div>

<!-- Percentage units (responsive to parent) -->
<div height="100%">Full height element</div>

<!-- Viewport height units (responsive to screen) -->
<div height="50vh">Half-screen height</div>
```

**Available Units:**
- `rem`: Relative to root font size (recommended for consistent, scalable heights)
- `%`: Percentage of parent container height
- `vh`: Percentage of viewport height (1vh = 1% of viewport height)

**Generated Selectors:**
```css
[height="1rem"] { height: 1rem; }
[height="2rem"] { height: 2rem; }
/* ... up to */
[height="100rem"] { height: 100rem; }

[height="1%"] { height: 1%; }
/* ... up to */
[height="100%"] { height: 100%; }

[height="1vh"] { height: 1vh; }
/* ... up to */
[height="100vh"] { height: 100vh; }
```

## Implementation Details

### Generator Function

All sizing attributes are generated using the `attribute-generator` mixin in `src/core/mixins.scss`:

```scss
@mixin attribute-generator($property, $unit) {
    @for $i from 1 through 100 {
        [#{$property}="#{$i}#{$unit}"] {
            #{$property}: #{$i}#{$unit};
        }
    }
}
```

### File Structure

Sizing attributes are organized in the following files:

```
src/styles/
├── width/
│   ├── width.scss (forwards to unit files)
│   ├── rem/
│   │   └── rem.scss (@include attribute-generator("width", "rem"))
│   ├── per/
│   │   └── percent.scss (@include attribute-generator("width", "%"))
│   └── vw/
│       └── vw.scss (@include attribute-generator("width", "vw"))
├── height/
│   ├── height.scss (forwards to unit files)
│   ├── rem/
│   │   └── rem.scss (@include attribute-generator("height", "rem"))
│   ├── per/
│   │   └── percent.scss (@include attribute-generator("height", "%"))
│   └── vh/
│       └── vh.scss (@include attribute-generator("height", "vh"))
```

## Usage Guidelines

### Recommended Units

1. **REM units** (`rem`): Preferred for consistent sizing
   - Scales with root font size
   - Consistent across different screen sizes
   - Recommended for fixed dimensions
   - Good for component sizing

2. **Percentage units** (`%`): Use for responsive, proportional sizing
   - When size should scale with container
   - For fluid layouts
   - When you need relative dimensions

3. **Viewport units** (`vw`, `vh`): Use for full-screen layouts
   - When you need screen-relative sizing
   - For hero sections, full-screen elements
   - For responsive typography and spacing
   - Be careful of mobile viewport issues

### Best Practices

```html
<!-- Good: Use REM for consistent component sizing -->
<div width="20rem" height="10rem" bgColor="white-100">
  Fixed-size card
</div>

<!-- Good: Use percentages for fluid layouts -->
<div width="50%" height="100%">
  Half-width, full-height section
</div>

<!-- Good: Use viewport units for full-screen elements -->
<header width="100vw" height="100vh" gradient="citrusmint-500">
  Full-screen hero
</header>

<!-- Good: Mix units for responsive design -->
<div width="80vw" height="60vh" padding="2rem">
  Responsive container with fixed padding
</div>
```

### Common Patterns

```html
<!-- Card with fixed dimensions -->
<div width="300rem" height="200rem" bgColor="white-100" shadow="gray-500" depth="md">
  <img width="100%" height="60%" src="..." alt="..." />
  <div padding="1rem">
    <h3>Card Title</h3>
    <p>Card content</p>
  </div>
</div>

<!-- Responsive grid items -->
<section grid="3x2" gap="2">
  <article width="100%" height="200rem" bgColor="blue-500">Item 1</article>
  <article width="100%" height="200rem" bgColor="green-500">Item 2</article>
  <article width="100%" height="200rem" bgColor="red-500">Item 3</article>
</section>

<!-- Full-screen layout -->
<div width="100vw" height="100vh">
  <nav width="100%" height="60rem" bgColor="black-900">Navigation</nav>
  <main width="100%" height="calc(100vh - 60rem)">Main content</main>
</div>

<!-- Aspect ratio containers -->
<div width="16rem" height="9rem" bgColor="gray-200">
  16:9 aspect ratio container
</div>

<div width="4rem" height="3rem" bgColor="gray-200">
  4:3 aspect ratio container
</div>
```

## Value Ranges

- **Width/Height**: 1-100 (rem, %, vw/vh)

## CSS Output

Each attribute selector generates a single CSS rule:

```css
[width="50%"] { width: 50%; }
[height="100vh"] { height: 100vh; }
```

## Performance Notes

- All sizing selectors are generated at build time
- No runtime JavaScript required
- CSS is highly optimized and compressed
- Total selectors: ~600 sizing selectors (width: 300, height: 300)

## Responsive Design Considerations

### Mobile Viewport Units
Viewport units (`vw`, `vh`) can be problematic on mobile devices due to dynamic browser UI. Consider using media queries or fallbacks:

```html
<!-- Use with caution on mobile -->
<div width="100vw">Full width on all devices</div>

<!-- Better: Use percentage for mobile-friendly -->
<div width="100%">Full width, mobile-friendly</div>
```

### REM vs Fixed Units
REM units scale with user font preferences, making them more accessible:

```html
<!-- Good: Scales with user preferences -->
<div width="20rem" height="15rem">Scalable component</div>

<!-- Less ideal: Fixed size -->
<div width="320px" height="240px">Fixed component</div>
```

### Container Queries
When using percentage units, consider the context:

```html
<!-- Percentage of parent container -->
<div width="50%">Half of parent width</div>

<!-- Percentage of viewport -->
<div width="50vw">Half of viewport width</div>
```

## Troubleshooting

### Common Issues

1. **Sizing not applying**: Check that the unit is included in the attribute value
   ```html
   <!-- Wrong -->
   <div width="50">Content</div>
   
   <!-- Right -->
   <div width="50%">Content</div>
   ```

2. **Viewport units not working as expected**: Remember that `vw`/`vh` include browser UI on mobile
   ```html
   <!-- May be larger than expected on mobile -->
   <div width="100vw">Content</div>
   
   <!-- Better for mobile -->
   <div width="100%">Content</div>
   ```

3. **Height not working**: Check if parent has defined height
   ```html
   <!-- Wrong: Parent has no height -->
   <div height="50%">Child content</div>
   
   <!-- Right: Parent has defined height -->
   <div height="400rem">
     <div height="50%">Child content</div>
   </div>
   ```

4. **REM units too small/large**: Adjust root font size or use different units
   ```html
   <!-- If 20rem is too big -->
   <div width="20rem">Content</div>
   
   <!-- Try percentage or viewport units -->
   <div width="50%">Content</div>
   ```

### Debugging Tips

- Use browser dev tools to inspect computed styles
- Check parent container dimensions when using percentages
- Test on multiple screen sizes, especially mobile
- Consider using `box-sizing: border-box` (already included in Juice reset)

## Advanced Usage

### Aspect Ratios
Create consistent aspect ratios using width and height:

```html
<!-- 16:9 video container -->
<div width="16rem" height="9rem" bgColor="black-900">
  <video width="100%" height="100%" src="..."></video>
</div>

<!-- Square container -->
<div width="10rem" height="10rem" bgColor="gray-200">
  Square content
</div>
```

### Fluid Typography
Combine with font sizing for responsive text containers:

```html
<!-- Container that scales with viewport -->
<div width="50vw" height="20vh" fontSize="xl" padding="2rem">
  Responsive text container
</div>
```

### Grid Layouts
Use with Juice's grid system for responsive layouts:

```html
<section grid="3x1" gap="2">
  <div width="100%" height="200rem">Column 1</div>
  <div width="100%" height="200rem">Column 2</div>
  <div width="100%" height="200rem">Column 3</div>
</section>
```</content>
<parameter name="filePath">D:\CitrusWorx\docs\juice\juice-sizing.md