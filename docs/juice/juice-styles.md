# Juice Styles

Juice uses HTML attributes as its primary styling API. Instead of piling utility classes onto an element, Juice lets markup describe intent with attributes like `font`, `fontColor`, `bgColor`, `grid`, `gap`, and `padding`.

## Core idea

The stylesheet is built from selectors such as:

```scss
[font="lato"] { font-family: $lato; }
[fontColor="green-700"] { color: $green-700; }
[bgColor="green-500"] { background-color: $green-500; }
[width="50%"] { width: 50%; }
```

That gives you HTML like this:

```html
<article stack gap="1" padding="2rem" bgColor="white-100">
  <h2 font="playfair-display" fontColor="obsidian-900">Readable markup</h2>
  <p font="lato" fontColor="gray-700">
    Juice keeps visual intent close to the element.
  </p>
</article>
```

## Selector conventions

Juice currently uses three kinds of selectors:

- attributes for styling
- classes for app-specific state or behavior
- ids for unique elements

Examples:

```html
<button font="lato" bgColor="green-500" class="is-loading" id="checkout-button">
  Checkout
</button>
```

## Typography selectors

Font family:

```html
<h1 font="bebas-neue">Display</h1>
<p font="lato">Body copy</p>
<code font="source-code-pro">const juice = true;</code>
<span font="korolev-rounded-bold">Brand text</span>
```

Font size:

```html
<p fontSize="sm">Small</p>
<p fontSize="md">Medium</p>
<p fontSize="lg">Large</p>
```

Notes:

- Google font selectors live in `src/styles/fonts/google.scss`
- Adobe font selectors live in `src/styles/fonts/adobe.scss`
- the current size presets come from `src/core/typography.scss`

## Color selectors

Text color uses `fontColor`:

```html
<p fontColor="black-100">black-100</p>
<p fontColor="obsidian-700">obsidian-700</p>
<p fontColor="citrusmint-500">Not valid unless that token exists as a color token</p>
```

Background and border colors:

```html
<div bgColor="green-500" fontColor="white-100">Background token</div>
<div borderColor="green-700">Border token</div>
```

Hover states:

```html
<button hover="green-600" bgColor="green-500">Filled hover</button>
<button hover="green-600" outline borderColor="green-500">Outline hover</button>
```

Shadow color plus depth:

```html
<div shadow="green-500" depth="md">Shadowed card</div>
```

Notes:

- `shadow="..."` sets `--shadow-color`
- `depth="sm|md|lg|xl"` applies the actual box shadow
- most color families expose `fontColor`, `bgColor`, `borderColor`, `hover`, and `shadow`

## Gradient selectors

Gradients are also attribute-driven:

```html
<section gradient="citrusmint-500" padding="2rem">
  Gradient background
</section>
```

Gradient selectors currently live under `src/styles/gradients`.

## Spacing selectors

Juice generates numeric spacing attributes in `rem`, `px`, and `%` depending on the folder.

Examples:

```html
<div margin="2rem" padding="1rem">Box</div>
<div margin-top="24px">Top margin</div>
<div padding="10%">Percent padding</div>
```

Important detail:

- the generated directional selectors are hyphenated, such as `margin-top`, `margin-left`, and `margin-right`
- these are literal HTML attributes, not React-style camelCase props

## Sizing selectors

Width and height utilities are generated numerically from mixins.

Examples:

```html
<div width="50%" height="20rem"></div>
<div width="80vw" height="100vh"></div>
```

The generator comes from `src/core/mixins.scss`, which creates selectors from `1` through `100` for each supported unit.

## Practical guidance

Use Juice attributes for:

- typography
- token-backed colors
- spacing
- size
- layout primitives

Keep regular classes for:

- JS state
- component state names
- app-specific styling outside the shared Juice system

## Known limitations

The docs in this file reflect the selectors that exist today. A few things to keep in mind:

- selector names are not fully normalized yet, so use the names from source
- some older docs used `textColor`; the current code uses `fontColor`
- component-level APIs are still emerging, so most Juice usage today is at the token and utility-selector level
