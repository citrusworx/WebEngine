# Juice Icons

Juice ships a CSS-first icon system built on the complete FontAwesome Free library. Icons are exposed through the `icon` attribute and rendered as CSS masks.

## Authoring contract

First-class attributes:

| Attribute | Role |
|---|---|
| `icon` | Icon name (FontAwesome file name in this repo) |
| `iconcolor` | Token-backed icon color |
| `iconSize` | Stepped size: `xxs`, `xs`, `sm`, `md`, `lg`, `xl`, `xxl` |

Escape hatch:

- `width` / `height` when you need a size that is not on the `iconSize` scale

Set selection:

- `lib="solid"` selects the solid SVG. Solid rules compile as `[icon="…"][lib="solid"]`, so this value is required for solid icons.
- `lib="regular"` and `lib="brands"` are author annotations. Regular and brands compile as unscoped `[icon="…"]` rules, so they match with or without `lib`.

Do not use `fontColor` to tint icons. It can leak through `currentColor`, but it is not the icon contract.

## Default size

`[icon]` defaults to `1rem × 1rem` when neither `iconSize` nor `width` / `height` is set. That default is for text-adjacent icons. It is not `iconSize="sm"` (`24px`).

There is no mobile remapping. Viewport media queries do not override icon size. Author `iconSize` or `width` / `height` the same way at every breakpoint.

`width` and `height` utilities compile after the icon rules, so an explicit custom size wins over both the default and `iconSize`. Set both axes when you use the escape hatch.

`iconSize` values are pixels and do not change across breakpoints. `width` / `height` rem, vw, and vh values still follow the shared [responsive scale](./juice-responsive-reference.md) (50% below 640px, 75% / 80% in the tablet bands). Use `iconSize` when you want the same glyph size on a phone as on desktop.

## Size scale

| `iconSize` | Rendered size |
|---|---|
| `xxs` | 10px |
| `xs` | 12px |
| `sm` | 24px |
| `md` | 36px |
| `lg` | 48px |
| `xl` | 60px |
| `xxl` | 72px |

```html
<i icon="check" lib="solid" iconSize="sm" iconcolor="green-600"></i>
<i icon="calendar" lib="regular" iconSize="md" iconcolor="obsidian-700"></i>
<i icon="github" lib="brands" width="1.25rem" height="1.25rem" iconcolor="gray-900"></i>
```

## Color

`[icon]` paints the mask with `background-color: currentColor`.

- `iconcolor="green-600"` sets `color` to that token, so the mask uses the swatch.
- With no `iconcolor`, the icon inherits `color` from its parent. That is the honest `currentColor` path: a button that sets text color will tint an unmarked icon the same way.
- `iconcolor` is still the public coloring attribute. Do not treat inherited `color` or `fontColor` as the authored API.

## Choosing an icon set

- Use `solid` for most UI actions, alerts, controls, and navigation. Set `lib="solid"`.
- Use `regular` when you want a lighter outlined look and the name exists in the free regular set.
- Use `brands` for company, platform, and product marks such as GitHub, Shopify, Docker, or Figma.

`icon.scss` forwards brands, then regular, then solid.

Name collision rule:

1. Solid only applies when `lib="solid"`. That selector is more specific than a bare `[icon="…"]`, so solid wins for that name when `lib="solid"` is present.
2. Regular and brands both emit `[icon="…"]`. If the same name exists in both, the later forward wins. Regular is forwarded after brands, so regular wins.
3. Without `lib="solid"`, a name that exists in regular (or brands) uses that unscoped rule. A solid-only name with no `lib` has no mask.

Set `lib` explicitly when a name exists in more than one set (`heart`, `user`, `bell`, `star`, …).

## Icon and text alignment

`[icon]` is `inline-block` with `vertical-align: middle`. Use layout attributes for anything beyond a single inline glyph.

Inline with a label:

```html
<span>
  <i icon="circle-check" lib="solid" iconcolor="green-700"></i>
  Verified publisher
</span>
```

The default `1rem` size sits on the text line. Add `iconSize` only when the label is display type.

Button with icon:

```html
<button btn="flat" theme="citrusmint-300" scale="lg">
  <i icon="plus" lib="solid" iconcolor="white-100"></i>
  Add title
</button>
```

Keep the glyph and label as inline content so they stay on one line. Do not put `row` on the button: `[row]` collapses to a column below 768px. Prefer `iconSize="sm"` or the `1rem` default inside buttons; `lg` / `xl` belong on media regions, not in the label.

Toolbar or nav cluster (flex, and allowed to wrap or stack):

```html
<div row gap="1" centered>
  <i icon="bell" lib="solid" iconSize="sm" iconcolor="obsidian-900"></i>
  <span>Alerts</span>
</div>
```

Stack with gap:

```html
<div stack gap="1" center>
  <i icon="water" lib="solid" iconSize="md" iconcolor="blue-700"></i>
  <h3 font="oswald">The Inlet</h3>
</div>
```

Use `stack` + `gap` for an icon above a caption. `center` (or `centered` on a `row`) is placement, not a new icon attribute.

## What is included

Juice forwards three FontAwesome Free sets through `libraries/juice/src/styles/icons/icon.scss`:

- `brands.scss`
- `regular.scss`
- `solid.scss`

Together, these files provide the full FontAwesome Free icon surface that exists in this repo.

## How the icon system works

The shared icon entrypoint defines the common icon behavior:

```scss
[icon] {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  vertical-align: middle;
  background-color: currentColor;
  -webkit-mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  mask-size: contain;
  mask-repeat: no-repeat;
}
```

Each icon set then maps an `icon` attribute value to a specific SVG file. Solid maps are scoped to `lib="solid"`:

```scss
[icon="check"][lib="solid"] {
  -webkit-mask-image: url('./icons/fontawesome/web/svgs/solid/check.svg');
  mask-image: url('./icons/fontawesome/web/svgs/solid/check.svg');
}
```

Regular and brands map the name alone:

```scss
[icon="calendar"] {
  -webkit-mask-image: url('./icons/fontawesome/web/svgs/regular/calendar.svg');
  mask-image: url('./icons/fontawesome/web/svgs/regular/calendar.svg');
}
```

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
- Juice treats icons as a stylesheet feature rather than a JavaScript component API.
- Roadmap Priority 3 icon authoring (size, color, alignment, library selection) is the current contract. Typography polish is a later slice.
