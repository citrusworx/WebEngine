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
- color tokens and swatches
- Google and Adobe font selectors
- attribute selectors for color, spacing, width, height, gradients, and shadows
- layout primitives for `stack`, `row`, `grid`, `gap`, and `span`

## Build

```bash
yarn workspace @citrusworx/juice build
```

The build runs:

- `gulp.ts` to compile `src/juice.scss` into `dist/index.css`
- `vite` to build the JS entrypoint into `dist/index.mjs`

## Docs

Internal project docs live in `docs/juice/`.
