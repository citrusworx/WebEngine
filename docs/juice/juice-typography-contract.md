# Juice Typography Contract

Canonical authoring rules for type in Juice markup.

[Typography Reference](./juice-typography.md) is the full face catalog. This page is the contract those docs, [Attributes](./juice-attributes.md), and the course point at. It documents what `libraries/juice/src/core/typography.scss` and the font/color stylesheets already emit. It does not invent a type-token system or new attributes.

## 1. First-class attributes

| Attribute | Role | Shipped values |
|---|---|---|
| `font` | Face alias | Catalog names such as `lato`, `oswald`, `playfair-display`, `korolev-rounded`, `bebas-neue`. Full list: [Typography Reference](./juice-typography.md) |
| `fontSize` | Stepped size | `sm`, `md`, `lg`, `xl`, `xxl` |
| `fontColor` | Token-backed text color | Palette steps such as `obsidian-900`, `gray-700`, `white-100`. Full list: [Colors](./juice-colors.md) |
| `lineHeight` | Explicit leading | `"1rem"` through `"10rem"` |
| `fontWeight` | Numeric weight | `"100"` through `"900"` |

```html
<h1 font="oswald" fontSize="xxl" fontColor="obsidian-900">Harbor Press</h1>
<p font="lato" fontSize="md" fontColor="gray-700" lineHeight="2rem">
  Short-run books, careful typesetting, one shelf.
</p>
```

`lineHeight` and `fontWeight` ship. Use them when the default leading or face weight is wrong. They are not a named scale (`tight` / `normal`) and they are not unitless (`1.4`).

## 2. Size scale

From `$text--*` in `libraries/juice/src/core/typography.scss`. The steps are real attribute selectors, not font-dependent.

| `fontSize` | Computed size |
|---|---|
| `sm` | `0.75rem` |
| `md` | `1.25rem` |
| `lg` | `1.5rem` |
| `xl` | `2rem` |
| `xxl` | `3rem` |

There is no `xs`, `xxs`, or `1rem` step. `md` is `1.25rem`, not “browser medium.”

Without `fontSize`, core element defaults still apply:

| Element | Default size |
|---|---|
| `h1` | `clamp(1.8rem, 2.5vw, 3rem)` |
| `h2` | `clamp(1.5rem, 2vw, 2.5rem)` |
| `p` | `clamp(1rem, 1.5vw, 1.25rem)` |
| `h3`–`h6` | browser default (no core rule) |

`[fontSize]` is more specific than those element rules, so an explicit step wins over the `h1` / `h2` / `p` clamps. Themes do not restyle `font-size` on headings.

`fontSize` values are rem and do not remap across breakpoints. The shared [responsive scale](./juice-responsive-reference.md) does not apply to this attribute.

## 3. Hierarchy (roles, not attributes)

Display / title / body / caption are **guidance**. They are not attributes. Do not write `display="…"` or `role="caption"`. Map the role onto `fontSize` plus a face.

| Role | Typical `fontSize` | Typical face |
|---|---|---|
| Display | `xxl` | Heading or display face (`oswald`, `bebas-neue`, `playfair-display`, `archivo-black`, theme heading) |
| Title | `xl` or `lg` | Same heading face as display |
| Body | `md`, or omit and use the `p` clamp | Reading face (`lato`, `korolev-rounded`, theme body) |
| Caption | `sm` | Same reading face as body |

```html
<p font="lato" fontSize="sm" fontColor="gray-700">Independent publishing</p>
<h1 font="oswald" fontSize="xxl">Harbor Press</h1>
<p font="lato" fontSize="md">Short-run books, careful typesetting, one shelf.</p>
<h2 font="oswald" fontSize="xl">This season</h2>
<h3 font="oswald" fontSize="lg">The Inlet</h3>
```

That pairing is the same advice as [Visual design language](./juice-visual-design-language.md): one display voice, one reading voice. Two or three faces per page. Script and mono (`caveat`, `source-code-pro`) are accents, not a third body.

## 4. Theme fonts vs `font=`

Themes own the default pair. Authors override locally.

Library themes bind `--<prefix>-body-font` and `--<prefix>-heading-font` (`--cm-*`, `--kw-*`, `--aqua-*`, `--tide-*`). Generated app themes bind `--jx-body-font` and `--jx-heading-font` from `typography.body` / `typography.heading`. Optional `typography.variants` become `--jx-font-…` for app selectors. Juice core does not consume those variants. See [Theme Authoring](./juice-theme-authoring.md) and the [Theme Contract](./juice-theme-contract.md).

Under `[theme="…"]` the usual defaults are:

- theme root, plus `p`, `span`, `li`, `label` (and extras such as `dt` / `blockquote` on KiwiPress): body face
- `h1`–`h6`: heading face
- some themes also set heading `font-weight` and `line-height` (KiwiPress: `700` / `1.1` on headings, `1.6` on body copy)

**When to omit `font=`.** After a theme is on the root, a plain `<h1>` and `<p>` already have the brand pair. Lesson 6 is this rule: identity lives on the theme, not on every heading.

**When to set `font=`.** One-off voice that is not the theme pair: a code sample (`source-code-pro`), a script accent, a display lockup that should stay Oswald after a Tide swap. Keep those local. Do not restamp the theme pair on every node.

**Cascade.** Bare `[font]`, `[fontColor]`, `[fontWeight]`, and `[lineHeight]` are `(0,1,0)`. Theme semantic rules are `[theme="…"] :where(h1, …)` — also `(0,1,0)`, because `:where()` zeroes the element. Core therefore pairs each author type attribute with `[theme] [attr]`, the same raise as `[theme] [surfaceTone]`. That companion is `(0,2,0)`, so **author attrs win on themed `h1`–`h6` / `p` (and similar) when present**. Omit the attr and only the theme semantic rule matches, so the brand face / color / weight / leading still apply. `font=` on nodes the theme does not restyle (`div`, `code`, unmarked wrappers) keeps winning at `(0,1,0)`.

`fontSize` is not in that fight. Themes do not set `font-size` on headings, so the scale always applies.

## 5. Color

`fontColor` paints text through the color token sheets. It is the text API. Do not use it to tint icons; that is `iconcolor`. See [Icons](./juice-icons.md).

Theme `color` on `h1`–`h6` and body copy yields to `fontColor=` the same way `font=` yields the face: `[theme] [fontColor]` beats `[theme="…"] :where(h1, p, …)`. Prefer theme text roles (`palette.text.heading`, `--*-heading`) for identity. Keep local `fontColor` for a warning line, a muted caption, or inverse type on a dark fill.

## 6. Shipped, but not first-class

These compile. They are not the hierarchy API.

| Attribute | What it actually does | Limit |
|---|---|---|
| `weight="normal"` | Sets Inter to 400 | Only `[font="Inter"][weight="normal"]`. There is no general `weight` scale. Bare `font="Inter"` does nothing. |
| `leading` | `letter-spacing` | `"1px"` through `"10px"`. The name is tracking, not line-height. |
| `align` | `text-align` | `center`, `right`, `justify` — **`p` only** |
| `decoration="underline"` | underline | **`p` only** |

Prefer `fontWeight` over `weight`. Prefer `lineHeight` over `leading` when you mean leading.

Adobe faces that encode weight in the alias (`korolev-rounded-light`, `korolev-rounded`, `korolev-rounded-bold`) are `font` values, not `fontWeight` steps.

## 7. Specified, not shipped

Do not author these. They are not in the stylesheet.

- `display`, `title`, `body`, or `caption` as typography attributes
- `fontSize="xs"` / `"xxs"` / `"1rem"`
- named or unitless `lineHeight` (`tight`, `1.4`)
- a general `weight="bold"` / `"light"` API
- new font families in this contract
- a `--juice-type-*` token layer

Font loading, face aliases, and the catalog stay on [Typography Reference](./juice-typography.md). Author type attrs already beat theme semantic defaults. A `1rem` size step and any later type tokens remain later work.

## 8. Source files

- `libraries/juice/src/core/typography.scss` — size scale, Inter + `weight`, `align`, `decoration`, `leading`, `lineHeight`, `fontWeight`, `h1` / `h2` / `p` clamps, `[theme]` companions for `fontWeight` / `lineHeight`
- `libraries/juice/src/styles/fonts/google.scss` — `[font]` plus `[theme] [font]`
- `libraries/juice/src/styles/fonts/adobe.scss` — `[font]` plus `[theme] [font]`
- `libraries/juice/src/styles/color/**/text.scss` — `fontColor` plus `[theme] [fontColor]`
- `libraries/juice/src/themes/<id>/<id>.scss` — body / heading font defaults
- `libraries/juice/src/tools/theme-generator/index.ts` — `--jx-body-font` / `--jx-heading-font`

## Documentation map

- [Typography Reference](./juice-typography.md) — shipped faces
- [Attributes](./juice-attributes.md) — compact API list
- [Theme Contract](./juice-theme-contract.md) — theme identity checklist
- [Theme Authoring](./juice-theme-authoring.md) — body / heading / variants
- [Visual design language](./juice-visual-design-language.md) — display + body pairing
- [Colors](./juice-colors.md) — `fontColor` tokens
- [Icons](./juice-icons.md) — sibling Priority 3 contract
