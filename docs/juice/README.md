# Juice

Juice is CitrusWorx's attribute-driven styling library. It ships a compiled stylesheet, a design-token source tree, and a small TypeScript entrypoint that lets apps consume the package as `@citrusworx/juice`.

Today, the most complete parts of Juice are:

- color tokens and swatches
- font tokens and font selectors
- attribute-based utility styles
- layout primitives such as `stack`, `row`, `grid`, `gap`, and `span`
- icon utilities backed by the FontAwesome Free library
- build tooling for compiling `src/juice.scss` into `dist/index.css`

## What Juice ships

Package entrypoints:

- `@citrusworx/juice` -> `dist/index.mjs`
- `@citrusworx/juice/styles` -> `dist/index.css`

Main source entrypoints:

- `libraries/juice/src/juice.scss`
- `libraries/juice/src/index.ts`
- `libraries/juice/src/styles/styles.scss`
- `libraries/juice/src/tokens`

## Install and use

```bash
yarn add @citrusworx/juice
```

```ts
import "@citrusworx/juice/styles";
```

Once the stylesheet is imported, Juice selectors are available directly in markup:

```html
<section stack gap="2" padding="2rem">
  <h1 font="bebas-neue" fontSize="lg" fontColor="onyx-900">Juice</h1>
  <p font="lato" fontColor="gray-700">
    Attribute-driven styling built from tokens.
  </p>
  <div row gap="1" centered>
    <button bgColor="green-500" hover="green-600" fontColor="white-100" padding="1rem">
      Primary action
    </button>
    <i icon="check" width="1rem" height="1rem" fontColor="green-600"></i>
  </div>
</section>
```

## How Juice is organized

```text
libraries/juice/
  src/
    core/        base layout, typography, mixins, reset
    styles/      attribute selectors that map to token values
    tokens/      SCSS tokens and YAML source data
    themes/      theme definitions, still early
    icons/       FontAwesome Free SVG assets used by the icon system
    juice.scss   master stylesheet entrypoint
  dist/
    index.css    compiled CSS output
    index.mjs    compiled JS entrypoint
  gulp.ts        stylesheet build pipeline
  vite.config.ts JS library build
```

## Documentation map

- [Attributes Reference](./juice-attributes.md): comprehensive list of all supported HTML attributes and their values
- [Colors Reference](./juice-colors.md): complete guide to all available colors and swatches
- [Spacing Reference](./juice-spacing.md): detailed guide to padding, margin, and gap attributes
- [Sizing Reference](./juice-sizing.md): detailed guide to width and height attributes
- [Typography Reference](./juice-typography.md): complete guide to all integrated Google and Adobe fonts
- [Styles](./juice-styles.md): attribute names, examples, and selector conventions
- [Best Practices](./juice-best-practices.md): recommended composition patterns and usage guidance
- [Page Tutorial](./juice-page-tutorial.md): step-by-step walkthrough for building a page with Juice
- [Forms](./juice-forms.md): how to compose forms and field states with Juice
- [Cards](./juice-cards.md): card structure, variants, sizing, and content regions
- [Icons](./juice-icons.md): overview of the Juice icon system and the `icon` attribute
- [Icons - Solid](./juice-icons-solid.md): how the icon attribute maps to FontAwesome Free solid masks
- [Icons - Regular](./juice-icons-regular.md): how the icon attribute maps to FontAwesome Free regular masks
- [Icons - Brands](./juice-icons-brands.md): how the icon attribute maps to FontAwesome Free brand marks
- [Token System](./juice-token-system.md): how tokens are stored and consumed
- [Layout](./juice-layout.md): stacks, rows, grids, spans, and numeric sizing utilities

## Current status

Juice is usable today as a stylesheet and token library. The docs below intentionally describe the code that exists in this repo right now, not the longer-term roadmap.

A few areas are still early:

- the JS exports are minimal
- `themes/` exists but is mostly schema/config data right now
- `components/` is present but there are not yet public component exports
- `juice.config.yaml` is a draft configuration surface rather than a fully wired generator contract

## External resources

Juice uses FontAwesome Free icon naming conventions and asset masks for its icon system. The repo currently includes the Free Solid, Free Regular, and Free Brands collections. For more details, see:

- [FontAwesome Solid](https://fontawesome.com/icons?d=gallery&s=solid)
- [FontAwesome Brands](https://fontawesome.com/icons?d=gallery&s=brands)
- [FontAwesome Regular](https://fontawesome.com/icons?d=gallery&s=regular)
- [FontAwesome home](https://fontawesome.com)
