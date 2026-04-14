# Juice Icons

Juice ships a CSS-first icon system built on top of the complete FontAwesome Free library. Icons are exposed through the `icon` attribute and rendered as CSS masks, so they inherit color from `currentColor`.

## What is included

Juice currently forwards three FontAwesome Free sets through `libraries/juice/src/styles/icons/icon.scss`:

- `brands.scss`
- `regular.scss`
- `solid.scss`

Together, these files provide the full FontAwesome Free icon surface that exists in this repo.

## How the icon system works

The shared icon entrypoint defines the common icon behavior:

```scss
[icon] {
  display: inline-block;
  background-color: currentColor;
  -webkit-mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  mask-size: contain;
  mask-repeat: no-repeat;
}
```

Each icon set then maps an `icon` attribute value to a specific SVG file:

```scss
[icon="check"] {
  -webkit-mask-image: url('./icons/fontawesome/web/svgs/solid/check.svg');
  mask-image: url('./icons/fontawesome/web/svgs/solid/check.svg');
}
```

## Usage

```html
<i icon="check" width="1rem" height="1rem" iconcolor="green-600"></i>
<i icon="calendar" width="1.25rem" height="1.25rem" iconcolor="obsidian-700"></i>
<i icon="github" width="1.5rem" height="1.5rem" iconcolor="gray-900"></i>
```

Use `iconcolor` to control icon color in Juice.

## Choosing an icon set

- Use `solid` for most UI actions, alerts, controls, and navigation.
- Use `regular` when you want a lighter outlined look and the icon exists in the free regular set.
- Use `brands` for company, platform, and product marks such as GitHub, Shopify, Docker, or Figma.

## Documentation map

- [Icons - Solid](./juice-icons-solid.md)
- [Icons - Regular](./juice-icons-regular.md)
- [Icons - Brands](./juice-icons-brands.md)

## Source files

- `libraries/juice/src/styles/icons/icon.scss`
- `libraries/juice/src/styles/icons/fontawesome/solid.scss`
- `libraries/juice/src/styles/icons/fontawesome/regular.scss`
- `libraries/juice/src/styles/icons/fontawesome/brands.scss`
- `libraries/juice/src/icons/fontawesome/web/svgs/solid/`
- `libraries/juice/src/icons/fontawesome/web/svgs/regular/`
- `libraries/juice/src/icons/fontawesome/web/svgs/brands/`

## Notes

- Icon names follow the FontAwesome file names in this repo.
- If the same name exists in multiple sets, the forwarded order in `icon.scss` determines the selector that wins in the compiled stylesheet.
- Juice treats icons as a stylesheet feature rather than a JavaScript component API.
