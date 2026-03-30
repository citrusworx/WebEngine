# Juice Typography Reference

This document provides a comprehensive reference of all integrated fonts in Juice's typography system, including Google Fonts and Adobe Fonts.

## Overview

Juice integrates a curated selection of high-quality fonts from Google Fonts and Adobe Fonts (via Typekit). Fonts are loaded automatically when Juice is imported, providing consistent typography across applications.

## Font Loading

### Google Fonts
Most Google Fonts are loaded via `@font-face` declarations with optimized WOFF2 files for better performance. The Inter font family is loaded via Google Fonts CSS API for variable font support.

### Adobe Fonts
Adobe Fonts are loaded via Typekit with a single CSS import, providing access to premium fonts.

## Google Fonts

Juice includes 32 Google Fonts, organized by category:

### Display/Serif Fonts
- **Abril Fatface**: Elegant, high-contrast serif for headlines
  - Usage: `font="abril-fatface"`
  - Category: Display, Serif
  - Styles: Normal 400

- **Archivo Black**: Bold, geometric sans-serif
  - Usage: `font="archivo-black"`
  - Category: Sans Serif
  - Styles: Black 900

- **Bebas Neue**: Ultra-bold condensed sans-serif
  - Usage: `font="bebas-neue"`
  - Category: Display, Sans Serif
  - Styles: Normal 400

- **Playfair Display**: Classic serif with excellent readability
  - Usage: `font="playfair-display"`
  - Category: Serif
  - Styles: Normal 400, 500, 600, 700, 800, 900

- **Oswald**: Narrow, condensed sans-serif
  - Usage: `font="oswald"`
  - Category: Sans Serif
  - Styles: Normal 400, 500, 600, 700

### Script/Cursive Fonts
- **Architects Daughter**: Handwritten, playful script
  - Usage: `font="architects-daughter"`
  - Category: Handwriting
  - Styles: Normal 400

- **Caveat**: Casual, handwritten script
  - Usage: `font="caveat"`
  - Category: Handwriting
  - Styles: Normal 400, 500, 600, 700

- **Dancing Script**: Elegant, flowing script
  - Usage: `font="dancing-script"`
  - Category: Handwriting
  - Styles: Normal 400, 500, 600, 700

- **Homemade Apple**: Childlike, handwritten style
  - Usage: `font="homemade-apple"`
  - Category: Handwriting
  - Styles: Normal 400

- **Indie Flower**: Casual, handwritten marker style
  - Usage: `font="indie-flower"`
  - Category: Handwriting
  - Styles: Normal 400

- **Lobster**: Bold, script font
  - Usage: `font="lobster"`
  - Category: Display
  - Styles: Normal 400

- **Pacifico**: Playful, cursive script
  - Usage: `font="pacifico"`
  - Category: Handwriting
  - Styles: Normal 400

- **Reenie Beanie**: Casual, handwritten style
  - Usage: `font="reenie-beanie"`
  - Category: Handwriting
  - Styles: Normal 400

- **Satisfy**: Elegant, script font
  - Usage: `font="satisfy"`
  - Category: Handwriting
  - Styles: Normal 400

### Sans Serif Fonts
- **Acme**: Rounded, friendly sans-serif
  - Usage: `font="acme"`
  - Category: Sans Serif
  - Styles: Normal 400

- **Anton**: Ultra-bold, condensed sans-serif
  - Usage: `font="anton"`
  - Category: Display, Sans Serif
  - Styles: Normal 400

- **Comfortaa**: Rounded, humanist sans-serif
  - Usage: `font="comfortaa"`
  - Category: Sans Serif
  - Styles: Normal 400, 500, 600, 700

- **Inter**: Highly readable, variable font
  - Usage: `font="Inter"` with `weight="normal"`
  - Category: Sans Serif
  - Styles: Variable (400-700)
  - Special: Supports `weight` attribute

- **Josefin Sans**: Clean, geometric sans-serif
  - Usage: `font="josefin-sans"`
  - Category: Sans Serif
  - Styles: Normal 400, 500, 600, 700

- **Lato**: Warm, humanist sans-serif
  - Usage: `font="lato"`
  - Category: Sans Serif
  - Styles: Normal 400, 500, 600, 700, 800, 900

- **Montserrat**: Geometric, modern sans-serif
  - Usage: `font="montserrat"`
  - Category: Sans Serif
  - Styles: Normal 400, 500, 600, 700, 800, 900

- **Open Sans**: Highly legible, humanist sans-serif
  - Usage: `font="open-sans"`
  - Category: Sans Serif
  - Styles: Normal 400, 500, 600, 700, 800

- **Play**: Rounded, friendly sans-serif
  - Usage: `font="play"`
  - Category: Display, Sans Serif
  - Styles: Normal 400, 500, 600, 700

- **Poppins**: Geometric, rounded sans-serif
  - Usage: `font="poppins"`
  - Category: Sans Serif
  - Styles: Normal 400, 500, 600, 700, 800, 900
  - Special: `poppins-light` variant available

- **Poppins Light**: Light weight variant of Poppins
  - Usage: `font="poppins-light"`
  - Category: Sans Serif
  - Styles: Light 300

- **Raleway**: Elegant, humanist sans-serif
  - Usage: `font="raleway"`
  - Category: Sans Serif
  - Styles: Normal 400, 500, 600, 700, 800, 900

- **Roboto**: Google's signature font, highly legible
  - Usage: `font="roboto"`
  - Category: Sans Serif
  - Styles: Normal 400, 500, 600, 700, 800, 900

- **Titillium Web**: Geometric, friendly sans-serif
  - Usage: `font="titillium-web"`
  - Category: Sans Serif
  - Styles: Normal 400, 500, 600, 700

- **Ubuntu**: Warm, humanist sans-serif
  - Usage: `font="ubuntu"`
  - Category: Sans Serif
  - Styles: Normal 400, 500, 600, 700

- **Yanone Kaffeesatz**: Geometric, friendly sans-serif
  - Usage: `font="yanone-kaffeesatz"`
  - Category: Sans Serif
  - Styles: Normal 400, 500, 600, 700

### Monospace Fonts
- **Source Code Pro**: Excellent monospace for code
  - Usage: `font="source-code-pro"`
  - Category: Monospace
  - Styles: Normal 400, 500, 600, 700

### Decorative Fonts
- **Lilita One**: Bold, condensed display font
  - Usage: `font="lilita-one"`
  - Category: Display
  - Styles: Normal 400

- **Luckiest Guy**: Bold, playful display font
  - Usage: `font="luckiest-guy"`
  - Category: Display
  - Styles: Normal 400

- **Macondo**: Decorative, script-like font
  - Usage: `font="macondo"`
  - Category: Display
  - Styles: Normal 400

## Adobe Fonts

Juice includes 7 Adobe Fonts loaded via Typekit:

- **Korolev Rounded**: Modern, rounded sans-serif
  - Usage: `font="korolev-rounded"`, `font="korolev-rounded-light"`, `font="korolev-rounded-bold"`
  - Category: Sans Serif
  - Styles: Light 300, Normal 500, Bold 700

- **Alien Tz**: Geometric, futuristic sans-serif
  - Usage: `font="alientz"`
  - Category: Display, Sans Serif
  - Styles: Normal 400

- **Darka**: Bold, condensed serif
  - Usage: `font="darka"`
  - Category: Serif
  - Styles: Normal 400

- **Grange**: Rustic, display serif
  - Usage: `font="grange"`
  - Category: Display, Serif
  - Styles: Normal 400

- **P22 Sting**: Classic, serif font
  - Usage: `font="p22-sting"`
  - Category: Serif
  - Styles: Normal 400

- **Private Sans**: Clean, modern sans-serif
  - Usage: `font="private-sans"`
  - Category: Sans Serif
  - Styles: Normal 400

## Usage Examples

### Basic Font Usage
```html
<!-- Google Fonts -->
<h1 font="bebas-neue">Bold Headline</h1>
<p font="lato">Body text in Lato</p>
<code font="source-code-pro">const code = true;</code>

<!-- Adobe Fonts -->
<h2 font="korolev-rounded">Modern Heading</h2>
<p font="private-sans">Clean body text</p>

<!-- Inter with weight -->
<h3 font="Inter" weight="normal">Inter font with normal weight</h3>
```

### Font Combinations
```html
<!-- Serif headline with sans-serif body -->
<article>
  <h1 font="playfair-display">Elegant Headline</h1>
  <p font="lato">This is the body text in a highly readable sans-serif font.</p>
</article>

<!-- Script accent -->
<section>
  <h2 font="montserrat">Section Title</h2>
  <p font="lato">Regular content with <span font="caveat">script accent</span> for emphasis.</p>
</section>
```

### Responsive Typography
```html
<!-- Different fonts for different contexts -->
<header>
  <h1 font="bebas-neue" fontSize="xl">Site Title</h1>
  <nav font="montserrat" fontSize="md">
    <a href="/">Home</a>
  </nav>
</header>

<main font="lato" fontSize="md">
  <p>Body content</p>
</main>
```

## Font Categories and Use Cases

### Headlines and Display
- **Bebas Neue**: Ultra-bold, condensed headlines
- **Abril Fatface**: Elegant, high-contrast display
- **Oswald**: Strong, narrow headlines
- **Playfair Display**: Classic, readable serif headlines

### Body Text
- **Lato**: Warm, humanist sans-serif
- **Roboto**: Clean, highly legible
- **Open Sans**: Friendly, readable
- **Inter**: Modern, variable font

### Accents and Special Text
- **Caveat**: Handwritten notes, signatures
- **Dancing Script**: Elegant flourishes
- **Pacifico**: Playful branding
- **Lobster**: Bold script elements

### Code and Technical
- **Source Code Pro**: Monospace for code blocks
- **Roboto Mono**: Alternative monospace (if needed)

## Implementation Details

### Font Loading Strategy
- **Google Fonts**: Mix of `@font-face` declarations and CSS imports
- **Adobe Fonts**: Single Typekit CSS import
- **Performance**: Optimized WOFF2 format, subset fonts where possible

### CSS Generation
Each font generates a CSS selector:
```css
[font="lato"] { font-family: 'Lato', sans-serif; }
[font="bebas-neue"] { font-family: 'Bebas Neue', sans-serif; }
```

### File Structure
```
src/
├── tokens/fonts/
│   ├── google/
│   │   ├── faces.scss     # @font-face declarations
│   │   └── variables.scss # Font family variables
│   └── adobe/
│       ├── faces.scss     # Typekit import
│       └── variables.scss # Font family variables
└── styles/fonts/
    ├── google.scss        # Font attribute selectors
    └── adobe.scss         # Font attribute selectors
```

## Font Stacks

All fonts include fallback font stacks for better compatibility:

- **Sans Serif**: `sans-serif`
- **Serif**: `serif`
- **Cursive/Script**: `cursive`
- **Monospace**: `monospace`

## Accessibility Considerations

### Readability
- Choose fonts appropriate for content type
- Ensure sufficient contrast with background colors
- Consider font size and line height

### Performance
- Fonts are loaded asynchronously where possible
- Use `font-display: swap` for better loading experience
- Consider font loading impact on Core Web Vitals

### Inclusive Design
- Test fonts across different devices and browsers
- Consider users with dyslexia (avoid overly decorative fonts for body text)
- Ensure fonts work well at different sizes

## Best Practices

### Font Selection
1. **Limit font families**: Use 2-3 fonts maximum per project
2. **Establish hierarchy**: Use different fonts for different text levels
3. **Consider context**: Choose fonts appropriate for brand and content
4. **Test readability**: Ensure fonts work well at various sizes

### Performance Optimization
1. **Use system fonts** when appropriate for better performance
2. **Limit weights**: Only load needed font weights
3. **Consider preload** for critical fonts
4. **Monitor font loading** impact on page speed

### Cross-Platform Consistency
1. **Test on devices**: Fonts may render differently across platforms
2. **Use fallbacks**: Font stacks provide safety nets
3. **Consider licensing**: Ensure fonts are properly licensed for use

## Complete Font List

### Google Fonts (32 fonts)
- Abril Fatface, Acme, Anton, Architects Daughter, Archivo Black, Bebas Neue
- Caveat, Comfortaa, Dancing Script, Homemade Apple, Indie Flower, Inter
- Josefin Sans, Lato, Lilita One, Lobster, Luckiest Guy, Macondo
- Montserrat, Open Sans, Oswald, Pacifico, Play, Playfair Display
- Poppins, Poppins Light, Raleway, Reenie Beanie, Roboto, Satisfy
- Source Code Pro, Titillium Web, Ubuntu, Yanone Kaffeesatz

### Adobe Fonts (7 fonts)
- Alien Tz, Darka, Grange, Korolev Rounded (3 weights), P22 Sting, Private Sans

## Migration Notes

### From Other Font Systems
- **Font names**: Use the attribute values listed above
- **Weight support**: Only Inter currently supports the `weight` attribute
- **Fallbacks**: All fonts include appropriate fallback fonts

### Legacy Font Usage
- **Direct font-family**: Replace with Juice font attributes
- **Custom fonts**: Add to the token system following existing patterns
- **Web fonts**: Ensure proper licensing and loading strategy</content>
<parameter name="filePath">D:\CitrusWorx\docs\juice\juice-typography.md