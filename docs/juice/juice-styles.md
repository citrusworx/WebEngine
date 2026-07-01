# Juice Styles

Juice uses attributes as its primary styling API.

The current public shape is best understood as three layers:

- Juice attributes for structure and broad styling hooks
- generated theme CSS for brand identity and semantic defaults
- app selectors for small product-specific exceptions

## Core idea

Instead of stuffing a long class string onto every element, Juice keeps intent in markup:

```html
<section stack gap="1rem" padding="2rem">
  <article card stack gap="0.75rem">
    <h2>Readable structure</h2>
    <p>Juice keeps composition visible in the markup itself.</p>
  </article>
</section>
```

## Current selector categories

Juice usage today usually falls into these groups:

### Layout primitives

- `stack`
- `row`
- `grid`
- `gap`
- spacing and sizing attributes

### Structural surface hooks

- `card`
- `panel`
- `hero`
- `cta`
- `badge`
- `stat`

### Theme scoping

- `theme="..."`
- `surface="..."`

### App selectors

- classes or attribute selectors that belong only to the product

## Theme relationship

Juice core does not try to fully brand every element by itself.

A generated theme provides:

- CSS custom properties such as `--jx-page`, `--jx-text`, `--jx-heading`, `--jx-body-font`, and `--jx-heading-font`
- optional typography variant properties such as `--jx-font-body-condensed` or `--jx-font-display-shadow`
- semantic defaults for sections, articles, nav, footer, and controls
- named surface recipes

That means the most current Juice styling story is not "attributes only everywhere forever."

It is:

- attribute-first structure
- theme-driven identity
- light app-specific extension

## Example: hybrid usage

```html
<body theme="blackwatersound">
  <main stack gap="2rem">
    <section hero surface="bw-stage" stack gap="1rem" padding="2rem">
      <p kicker>Publishing</p>
      <h1 display>Refactoring a storefront into a Juice-native app</h1>
      <p copy="lead">Juice handles structure. The theme handles brand voice.</p>
    </section>

    <section product-grid grid>
      <article product-card stack>
        <div product-media></div>
        <div product-body stack gap="0.75rem">
          <h3 product-title>StinkRat</h3>
          <p product-sub>Germanium Fuzz</p>
        </div>
      </article>
    </section>
  </main>
</body>
```

In that example:

- Juice contributes the structural composition model
- the theme provides the page and surface identity
- the app adds product-specific selectors like `[product-card]` and `[product-title]`

## Typography today

Juice themes define:

- `--jx-body-font`
- `--jx-heading-font`

They may also define optional variant roles through `typography.variants`, which become:

- `--jx-font-body-...`
- `--jx-font-display-...`

The app can then map those to product-specific selectors.

This is how Blackwater Sound uses multiple Citrus Gothic and Noto Sans variants without asking Juice core to guess the exact product roles.

## Named surfaces

Named surfaces are the preferred way to expose branded surface recipes from a theme.

Example:

```html
<section hero surface="bw-stage">...</section>
<aside panel surface="bw-panel">...</aside>
```

This keeps the structural vocabulary stable while letting the theme expose meaningful branded variants.

## Practical guidance

Use Juice for:

- page composition
- spacing
- grid and row structure
- default structural hooks
- responsive behavior

Use the generated theme for:

- palette
- text and heading defaults
- control tone
- named surfaces
- font-role variables

Use app selectors for:

- editorial art direction unique to the app
- product-card presentation details
- route-specific polish
- temporary migration shims while moving away from class-heavy styling

## Common mistakes

- treating Juice as if it must replace every piece of app CSS
- pushing page-specific layout logic into the theme
- inventing new top-level attributes for brand moments that should be `surface="..."`
- assuming only library-owned themes are valid

## Current recommendation

If you are building a real CitrusWorx app, prefer:

1. `@citrusworx/juiceui/styles`
2. an app-generated theme CSS file
3. a small app stylesheet for product-specific polish

That is the current documented direction of the library.
