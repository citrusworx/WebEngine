# Juice surfaces (Beta)

Surfaces describe **how a region looks** without replacing structural attributes (`card`, `hero`, etc.). Themes still own brand-specific painting of those structures.

## Beta-stable: `surfaceTone`

### `surfaceTone="soft"`

Implemented in [`surface.scss`](../../libraries/juice/src/styles/surface/surface.scss).

Frosted panel treatment:

- Near-white translucent background
- Light gray border
- Soft shadow and `backdrop-filter` blur

```html
<section
  bgColor="white-100"
  rounded="xl"
  padding="1rem"
  shadow
  depth="xs"
  surfaceTone="soft"
>
  …
</section>
```

Combine with layout attributes (`stack`, `gap`, `padding`) and optional `theme="..."` on an ancestor.

## Planned

### `surfaceTone="strong"`

Described in [Surface spec](./juice-surface-spec.md) but **not implemented** yet. Do not rely on it in production markup until it ships.

## Relationship to themes

| Layer | Owns |
|-------|------|
| Juice utilities | `surfaceTone`, `shadow`, `rounded`, `bgColor`, … |
| Theme | Colors, typography, how `[card]`, `[hero]`, and semantic elements render under `theme="..."` |

```html
<body theme="aquaflux">
  <article card="feature" surfaceTone="soft">…</article>
</body>
```

Import core + theme CSS separately (see [Theme authoring](./juice-theme-authoring.md)).
