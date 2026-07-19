# Blackwater Sound Theme Manual

This manual explains how to design and build new Blackwater Sound UI using the current Juice theme setup.

## Purpose

Blackwater Sound is a brand-heavy Juice app with a clear split of responsibilities:

- Juice owns structure, spacing, responsive layout, and primitive composition.
- The Blackwater Sound theme owns brand voice, palette, typography, surfaces, and tone.
- App CSS adds product-specific polish where the generic Juice contract stops.

If you are building a new route, component, card, panel, nav, or campaign section, start here before adding new styling.

## Source Of Truth

These files define the theme:

- Config: [juice.theme.yaml](/D:/CitrusWorx/apps/blackwatersound/front/juice.theme.yaml)
- Generated CSS: [blackwatersound-theme.css](/D:/CitrusWorx/apps/blackwatersound/front/src/generated/blackwatersound-theme.css)
- Generated YAML: [blackwatersound-theme.yaml](/D:/CitrusWorx/apps/blackwatersound/front/src/generated/blackwatersound-theme.yaml)
- Generated reference: [blackwatersound-theme-reference.md](/D:/CitrusWorx/apps/blackwatersound/front/src/generated/blackwatersound-theme-reference.md)
- App styling layer: [index.css](/D:/CitrusWorx/apps/blackwatersound/front/src/styles/index.css)

## Core Rule

Blackwater Sound should be authored attribute-first, not class-first.

Use:

```tsx
<section shell stack gap="1rem">
  <p kicker>Publishing</p>
  <h1 heading="xl">Launch Story</h1>
  <p copy="lead">Editorial intro copy.</p>
</section>
```

Avoid writing new markup like:

```tsx
<section className="hero hero--blackwater">
```

Legacy `.bw-*` selectors still exist in CSS as compatibility shims, but new markup should use attributes.

## Brand Character

Blackwater Sound should feel:

- loud
- editorial
- boutique
- tactile
- warm-paper rather than sterile SaaS
- music-native rather than generic ecommerce

The visual mix is:

- off-white paper surfaces
- dark ink text
- sharp accent bars
- poster-style display typography
- dense but readable body copy

## Palette

Do not reduce the palette to abstract buckets like "accent" in component APIs. In Blackwater Sound, the named colors matter.

Use these names in app-facing attributes and conventions:

- `bw-orange`: primary hot brand orange
- `bw-blue`: bright electric blue
- `bw-cyan`: alias of the electric blue family when needed in existing UI
- `bw-lime`: acid green highlight
- `bw-yellow`: warm signal yellow
- `bw-red`: urgent retail red
- `bw-dark`: deep charcoal surface
- `bw-ink`: dark text/ink role
- `bw-paper`: warm paper surface

Current foundation values:

- page background: `#f4f0e8`
- paper: `#fffdf8`
- ink: `#211c1b`
- muted text: `#6f6660`
- orange: `#ff7716`
- blue/cyan: `#16dcff`
- lime: `#96ff16`
- yellow: `#fff048`
- red: `#ff4848`

## Typography System

### Body Family

Primary reading family:

- `"noto-sans", sans-serif`

Use Noto Sans for:

- paragraph copy
- labels
- controls
- metadata
- support text

Available body variants:

- `"noto-sans-semicondensed", sans-serif`
  - use for editorial reading, metadata, and slightly tighter paragraphs
- `"noto-sans-condensed", sans-serif`
  - use for controls, nav items, tags, chips, and uppercase UI
- `"noto-sans-extracondensed", sans-serif`
  - use for counters, compact labels, and compressed utility text

### Display Family

Primary display family:

- `"citrus-gothic", sans-serif`

Use Citrus Gothic for:

- page titles
- section titles
- hero text
- product prices
- branded pull-quotes

Available display variants and intended usage:

- `"citrus-gothic-inline", sans-serif`
  - best for logo wordmarks, section titles, and stylized headings
- `"citrus-gothic-rough", sans-serif`
  - best for lessons, textured editorial moments, and expressive route titles
- `"citrus-gothic-shadow", sans-serif`
  - best for dramatic hero copy over photography
- `"citrus-gothic-solid", sans-serif`
  - best for prices, counters, loud product names, and dense impact display

### Typography Usage Rules

- Keep long-form reading in Noto Sans.
- Keep navigation and controls in condensed Noto variants.
- Reserve Citrus Gothic for headings and highlighted branded moments.
- Do not set entire content-heavy panels in Citrus Gothic.
- Do not use the rough or shadow variants for small utility labels.

## Named Surfaces

These are the primary Blackwater Sound branded surfaces:

### `surface="bw-stage"`

Use for:

- marquee hero sections
- publishing hero blocks
- promotional store callouts
- dark, cinematic product stories

Character:

- dark
- high contrast
- dramatic
- foreground text should generally be white or inverse

### `surface="bw-panel"`

Use for:

- sidebars
- metadata cards
- notes
- supporting editorial blocks
- lesson course cards

Character:

- warm
- paper-like
- soft contrast
- appropriate for readable support information

## Navigation

`site-nav` accepts named color values. It should use real palette names, not vague semantic buckets.

Examples:

```tsx
<header site-nav="bw-orange">
```

```tsx
<header site-nav="bw-blue">
```

```tsx
<header site-nav="bw-dark">
```

Supported values right now:

- `bw-paper`
- `bw-orange`
- `bw-blue`
- `bw-cyan`
- `bw-lime`
- `bw-yellow`
- `bw-red`
- `bw-dark`
- `bw-ink`

Current reference implementation:

- [SiteNav.tsx](/D:/CitrusWorx/apps/blackwatersound/front/src/components/brand/SiteNav.tsx)

Nav composition pattern:

- left: brand
- center: primary links
- right: CTA

Current CTA direction:

- sign-up / join / newsletter / conversion action

## Attribute Patterns

These are the preferred authoring patterns for new Blackwater Sound UI.

### Route Header

```tsx
<section shell route-head stack gap="1rem">
  <p kicker>Store</p>
  <h1 heading="xl">Blackwater Sound Store</h1>
  <p copy="lead">Route intro.</p>
</section>
```

### Editorial Hero Over Image

```tsx
<section article-hero>
  <div media-frame="banner">
    <img src={hero} alt="" media-image />
  </div>
  <div article-hero-content>
    <div shell article-hero-overlay stack gap="0.8rem">
      <p kicker>Publishing</p>
      <h1 display="article">Refactoring a Flashy Mockup Into a Kiwi-Native Frontend</h1>
      <p copy="inverse lead">Supporting deck.</p>
    </div>
  </div>
</section>
```

### Product Card

Reference:

- [ProductCard.tsx](/D:/CitrusWorx/apps/blackwatersound/front/src/components/catalog/ProductCard.tsx)

Pattern:

```tsx
<article product-card stack data-tone="orange">
  <div product-media>
    <img src={img} alt={name} product-image />
    <span product-tone />
    <span pill>New</span>
  </div>

  <div product-body stack gap="0.9rem">
    <h3 product-title>{name}</h3>
    <p product-sub>{sub}</p>
    <p copy="sm">{blurb}</p>
  </div>
</article>
```

### Supporting Panel

```tsx
<aside panel surface="bw-panel" stack gap="0.6rem">
  <span spec-label>Collection</span>
  <h2 section-title>Current lineup</h2>
  <p copy="sm">Supporting description.</p>
</aside>
```

### Dark Story Block

```tsx
<section surface="bw-stage" product-story stack gap="0.75rem">
  <p kicker="light">Featured gear</p>
  <h2 heading="solid">Studio-grade signal chain</h2>
  <p copy="inverse sm">Story-driven support copy.</p>
</section>
```

## Component Guidance

### Products

Product UI should feel standard enough to shop, but still branded.

- Keep cards consistent in size.
- Use a clear image area first.
- Use `product-tone` for fast category color signaling.
- Use `product-price` in a Citrus Gothic display treatment.
- Keep supporting blurbs and tags in Noto Sans variants.

Reference:

- [ProductsPage.tsx](/D:/CitrusWorx/apps/blackwatersound/front/src/routes/ProductsPage.tsx)

### Lessons

Lessons should feel structured and instructional, not chaotic.

- Use rough display for large lesson titles.
- Keep progress, tabs, and outline text clean and restrained.
- Use panel surfaces for the sidebar.
- Use strong image/video framing with readable overlays.

Reference:

- [CourseLesson.tsx](/D:/CitrusWorx/apps/blackwatersound/front/src/routes/CourseLesson.tsx)

### Publishing

Publishing pages should feel cinematic and editorial.

- Full-width imagery is allowed.
- Overlay text should stay readable without moving the entire layout around.
- Use white/inverse text over dark photography.
- Shadow display can be used sparingly for hero headlines.

## Hybrid Setup

Blackwater Sound is intentionally hybrid.

That means:

- Juice attributes handle layout and primitive structure.
- The generated theme provides fonts, tokens, surface colors, and brand defaults.
- App CSS in [index.css](/D:/CitrusWorx/apps/blackwatersound/front/src/styles/index.css) sharpens route-specific UI when needed.

This is the preferred model for product apps:

1. Start with Juice attributes.
2. Apply Blackwater Sound theme surfaces and typography.
3. Add small app-local selectors only when the generic theme contract is not enough.

## Do And Don't

Do:

- use semantic HTML
- use Juice structural attributes like `stack`, `row`, `grid`, `shell`, `gap`
- use Blackwater Sound attribute hooks like `kicker`, `heading`, `copy`, `product-card`, `site-nav`
- use named color values like `bw-orange` and `bw-blue`
- keep body copy readable
- use Citrus Gothic variants intentionally

Don't:

- introduce new `className` styling as the default API
- create abstract color names that hide the actual brand palette
- use display fonts for long paragraphs
- add one-off layout hacks before trying Juice structure
- overload every component with multiple loud display treatments at once

## When To Extend The Theme

Extend the theme config when you need:

- a reusable new named surface
- a reusable new font role
- a new palette role that will appear across multiple components
- a generator-backed token that belongs to the brand, not a single page

Do not extend the theme config for:

- one-off spacing adjustments
- a single route-only visual exception
- experimental page polish that is not yet a repeatable pattern

## Recommended Build Workflow

After editing the theme config:

```bash
yarn workspace @citrusworx/blackwater-sound generate:theme
```

Then verify the app:

```bash
yarn workspace @citrusworx/blackwater-sound build
```

## Quick Summary

If you only remember five things, remember these:

- author Blackwater Sound with attributes, not classes
- use real `bw-*` palette names in component-facing APIs
- keep reading text in Noto Sans and display moments in Citrus Gothic
- use `bw-stage` for loud marquee moments and `bw-panel` for readable support blocks
- let Juice own structure and let the Blackwater Sound theme own identity

## Artist Hub (`hub.css`)

The Artist Hub at `/artist` uses a **separate visual system** from the Blackwater marketing theme:

- Dark SaaS sidebar (`#0f0e17`), violet accent (`#7c3aed`), light canvas (`#f4f3f8`)
- Selectors live in [hub.css](src/styles/hub.css) with `[hub-*]` attributes
- Components live in [src/components/hub/](src/components/hub/)

This is **app-owned CSS by design**. Do not promote `hub.css` into the Juice library until a second CitrusWorx app needs the same hub chrome. Until then, extend `hub.css` and hub components in this app only.

## Hub charts

Artist Hub charts use **lightweight SVG and CSS bar primitives** in app components (for example `HubGrowthChart`, audience bar rows). We intentionally do **not** add Recharts or a Juice `[chart]` primitive for Blackwater Sound:

- Figma parity is sufficient with SVG polylines and `[hub-bar-*]` rows
- Recharts would add bundle weight and a second styling system to reconcile
- If a future screen needs interactive chart tooling, add Recharts at the **app** layer first; only extract shared markup into Juice when multiple apps need it

When adding a new hub chart, follow the existing pattern: seed data in [src/data/hub.ts](src/data/hub.ts), render with SVG or bar rows, style with `hub.css`.
