# Juice Icon System — FontAwesome Regular

This page documents the `regular.scss` icon file used by Juice.

Juice uses the FontAwesome icon naming convention and SVG masks for its regular icon set.

## File location

`libraries/juice/src/styles/icons/fontawesome/regular.scss`

This file is imported by `libraries/juice/src/styles/icons/icon.scss`, which is itself used by `libraries/juice/src/styles/styles.scss`.

## Purpose

`regular.scss` defines the FontAwesome Regular icon set using attribute selectors. Each entry maps an `icon` attribute value to a regular-style SVG asset.

> These icons are sourced from the FontAwesome Regular collection. Learn more at [FontAwesome Regular](https://fontawesome.com/icons?d=gallery&p=2&s=regular).

## How it works

The file uses selectors of the form `[icon="..."]`, for example:

```scss
[icon="calendar"]{
    -webkit-mask-image: url('./icons/fontawesome/web/svgs/regular/calendar.svg');
    mask-image: url('./icons/fontawesome/web/svgs/regular/calendar.svg');
}
```

That means any element with `icon="calendar"` will use the calendar SVG as its mask image.

## Asset source

Regular SVG assets are stored in:

`libraries/juice/src/styles/icons/fontawesome/web/svgs/regular/`

Each rule in `regular.scss` maps an icon key to one of these SVG files.

## Usage

```html
<i icon="calendar"></i>
<span icon="heart"></span>
```

For proper rendering, ensure your icon component or global icon rule provides sizing and color handling.

## Adding a regular icon

1. Add the SVG file to `libraries/juice/src/styles/icons/fontawesome/web/svgs/regular/`.
2. Add a matching `[icon="..."]` rule to `libraries/juice/src/styles/icons/fontawesome/regular.scss`.

Example:

```scss
[icon="custom-book"]{
    -webkit-mask-image: url('./icons/fontawesome/web/svgs/regular/custom-book.svg');
    mask-image: url('./icons/fontawesome/web/svgs/regular/custom-book.svg');
}
```

## Key details

- `regular.scss` is the file for FontAwesome Regular icons only.
- It is designed to work with the same `icon` attribute pattern as `brands.scss`.
- This keeps icon usage consistent across the Juice stylesheet.
