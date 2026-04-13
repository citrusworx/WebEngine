# Juice Icon System - FontAwesome Solid

This page documents the `solid.scss` icon file used by Juice.

Juice uses the FontAwesome naming convention and SVG masks for its solid icon set. This is the primary icon layer for general product UI, actions, states, and interface chrome.

## File location

`libraries/juice/src/styles/icons/fontawesome/solid.scss`

This file is forwarded by `libraries/juice/src/styles/icons/icon.scss`, which is itself imported by `libraries/juice/src/styles/styles.scss`.

## Purpose

`solid.scss` defines the FontAwesome Solid icon set using attribute selectors. Each entry maps an `icon` attribute value to a solid-style SVG asset from the FontAwesome Free library.

## How it works

The file uses selectors of the form `[icon="..."]`, for example:

```scss
[icon="check"] {
  -webkit-mask-image: url('./icons/fontawesome/web/svgs/solid/check.svg');
  mask-image: url('./icons/fontawesome/web/svgs/solid/check.svg');
}
```

That means any element with `icon="check"` will use the solid check SVG as its mask image.

## Asset source

Solid SVG assets are stored in:

`libraries/juice/src/icons/fontawesome/web/svgs/solid/`

Each rule in `solid.scss` maps an icon key to one of these SVG files.

## Usage

```html
<i icon="check"></i>
<i icon="user"></i>
<i icon="shield-halved"></i>
<i icon="arrow-right"></i>
```

For proper rendering, ensure the element also receives width, height, and color styling.

## Adding or refreshing solid icons

1. Add or update SVG files in `libraries/juice/src/icons/fontawesome/web/svgs/solid/`.
2. Regenerate or update the map in `libraries/juice/src/styles/icons/fontawesome/solid.scss`.
3. Confirm `libraries/juice/src/styles/icons/icon.scss` forwards `solid.scss`.

## Key details

- `solid.scss` now represents the complete FontAwesome Free solid asset set present in this repo.
- It is designed to work with the same `icon` attribute pattern as the regular and brands icon sets.
- Solid icons are the default recommendation for most app UI usage in Juice.
