# @citrusworx/juice

Juice is an attribute-driven styling library for CitrusWorx apps. It packages the compiled Juice stylesheet and a small JS entrypoint so applications can import shared tokens and styles from one place.

## Install

```bash
yarn add @citrusworx/juice
```

## Use the stylesheet

```ts
import "@citrusworx/juice/styles";
```

## Use the built files directly

If you are hosting Juice assets yourself, the main built files are:

- `dist/index.css`
- `dist/index.mjs`

These can be served from a CDN or static asset host and loaded directly into a project.

## Example

```html
<section stack gap="1" padding="2rem">
  <h1 font="bebas-neue" fontColor="obsidian-900">Juice</h1>
  <p font="lato" fontColor="gray-700">
    Attribute-driven styling from shared design tokens.
  </p>
  <button bgColor="green-500" hover="green-600" fontColor="white-100" padding="1rem">
    Get started
  </button>
</section>
```

## What is implemented today

- compiled CSS output at `dist/index.css`
- compiled JS output at `dist/index.mjs`
- color tokens and swatches
- Google and Adobe font selectors
- attribute selectors for color, spacing, width, height, gradients, shadows, and icons
- layout primitives for `stack`, `row`, `grid`, `gap`, and `span`
- FontAwesome Free icon integration across the solid, regular, and brands sets

## Optional config

Juice also includes an optional config surface at `juice.config.yaml`.

This is intended for describing project-level branding concerns like:

- base colors and swatches
- typography roles
- experimental integration options

Config is not required to use Juice. The most stable current entrypoint is still the compiled stylesheet plus the existing attribute system.

## Build

```bash
yarn workspace @citrusworx/juice build
```

The build runs:

- `gulp.ts` to compile `src/juice.scss` into `dist/index.css`
- `vite` to build the JS entrypoint into `dist/index.mjs`

## Docs

Internal project docs live in `docs/juice/`.
