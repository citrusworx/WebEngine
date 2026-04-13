# Juice Icon System - FontAwesome Brands

This page documents the `brands.scss` icon file used by Juice.

Juice uses the FontAwesome icon naming convention and SVG marks for its brand icons.

## File location

`libraries/juice/src/styles/icons/fontawesome/brands.scss`

This file is forwarded by `libraries/juice/src/styles/icons/icon.scss`, which is itself imported by `libraries/juice/src/styles/styles.scss`.

## Purpose

`brands.scss` defines the FontAwesome Brands icon set using attribute selectors. Each entry maps an `icon` attribute value to a brand SVG asset from the FontAwesome Free library.

> These icons are based on the official FontAwesome Brands collection. For more details, visit [FontAwesome Brands](https://fontawesome.com/icons?d=gallery&s=brands).

## How it works

Each icon rule is defined using the `[icon="..."]` selector. For example:

```scss
[icon="github"] {
  -webkit-mask-image: url('./icons/fontawesome/web/svgs/brands/github.svg');
  mask-image: url('./icons/fontawesome/web/svgs/brands/github.svg');
}
```

When the stylesheet is loaded, any element with `icon="github"` will receive that SVG as a mask.

## Naming conventions

- The attribute value is the FontAwesome icon key.
- The icon key is typically the SVG file name without the `.svg` extension.
- Some names include special characters like `:` that are escaped in the selector.

## SVG asset source

Brand SVG assets are stored in:

`libraries/juice/src/icons/fontawesome/web/svgs/brands/`

Each rule in `brands.scss` points to a corresponding file in that directory.

## Usage

Use the `icon` attribute directly in markup:

```html
<i icon="github"></i>
<span icon="airbnb"></span>
<i icon="shopify"></i>
```

A shared icon rule should provide width, height, color, and mask behavior.

## Adding a brand icon

1. Add the SVG to `libraries/juice/src/icons/fontawesome/web/svgs/brands/`.
2. Add a rule to `libraries/juice/src/styles/icons/fontawesome/brands.scss`.
3. Use the same icon key in markup.

## Key details

- `brands.scss` is brand-specific and should only contain FontAwesome Free Brands icons.
- The icon system is class-free; it is driven by the `icon` attribute selector.
- Brand icons are intended for product, company, and platform marks rather than general UI controls.
