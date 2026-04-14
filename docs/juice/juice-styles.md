# Juice Styles

Juice uses HTML attributes as its primary styling API. Instead of piling utility classes onto an element, Juice lets markup describe intent with attributes like `font`, `fontColor`, `bgColor`, `grid`, `gap`, `padding`, `card`, and `icon`.

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

## Typography selectors

Examples:

```html
<h1 font="bebas-neue">Display</h1>
<p font="lato">Body copy</p>
<code font="source-code-pro">const juice = true;</code>
<span font="korolev-rounded-bold">Brand text</span>
<p fontSize="lg">Large copy</p>
```

Notes:

- Google font selectors live in `src/styles/fonts/google.scss`
- Adobe font selectors live in `src/styles/fonts/adobe.scss`
- the current size presets come from `src/core/typography.scss`

## Color selectors

Text color uses `fontColor`:

```html
<p fontColor="obsidian-700">Text token</p>
<div bgColor="green-500" fontColor="white-100">Background token</div>
<div borderColor="green-700">Border token</div>
<button hover="green-600" bgColor="green-500">Filled hover</button>
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

## Icon selectors

Juice icons are also attribute-driven. The `icon` attribute maps to FontAwesome Free SVG masks from the solid, regular, and brands sets.

Examples:

```html
<i icon="check" width="1rem" height="1rem" iconcolor="green-600"></i>
<i icon="calendar" width="1.25rem" height="1.25rem" iconcolor="obsidian-700"></i>
<i icon="github" width="1.5rem" height="1.5rem" iconcolor="gray-900"></i>
```

Important details:

- icons are tinted through the `iconcolor` attribute in Juice
- the shared icon behavior lives in `src/styles/icons/icon.scss`
- the current icon sources are `src/icons/fontawesome/web/svgs/{solid,regular,brands}`

For the set-by-set docs, see [Icons](./juice-icons.md).

## Card selectors

Juice cards are structural selectors rather than visual skins. The card layer is meant to handle width, padding, content flow, and content regions while leaving theme styling to normal Juice attributes.

Examples:

```html
<div card card-size="md" bgColor="white-100" shadow="gray-400" depth="sm">
  <div card-header row space="between" centered>
    <h3 font="korolev-rounded-bold">Card title</h3>
    <i icon="check" width="1rem" height="1rem" iconcolor="green-600"></i>
  </div>

  <div card-body stack gap="1rem">
    <p font="korolev-rounded">Card content</p>
  </div>

  <div card-actions center>
    <button btn="outline" theme="citrusmint-300" scale="lg">Action</button>
  </div>
</div>
```

Important details:

- `card` enables the base card container behavior
- variants such as `card="feature"` or `card="interactive"` adjust structure and behavior
- `card-size`, `card-padding`, and `card-flow` refine the layout without hardcoding brand styling
- `card-header`, `card-body`, `card-actions`, `card-meta`, `card-media`, and `card-divider` are semantic region hooks

For the dedicated card guide, see [Cards](./juice-cards.md).

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

## Practical guidance

Use Juice attributes for:

- typography
- token-backed colors
- spacing
- size
- layout primitives
- icons

Keep regular classes for:

- JS state
- component state names
- app-specific styling outside the shared Juice system

## Known limitations

The docs in this file reflect the selectors that exist today. A few things to keep in mind:

- selector names are not fully normalized yet, so use the names from source
- some older docs used `textColor`; the current code uses `fontColor`
- component-level APIs are still emerging, so most Juice usage today is at the token and utility-selector level
