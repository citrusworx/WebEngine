# Juice Layout

Juice includes a small but useful layout layer in `src/core/layout`. This is where stack, row, grid, span, and gap behavior is defined.

## Layout primitives

Current attribute selectors include:

- `stack`
- `reverse`
- `centered`
- `row`
- `grid`
- `span`
- `gap`

## Stack and row

Basic vertical and horizontal flow:

```html
<section stack gap="1">
  <h2>Heading</h2>
  <p>Body copy</p>
</section>

<nav row gap="1">
  <a href="/">Home</a>
  <a href="/work">Work</a>
</nav>
```

What they do today:

- `[stack]` -> `display: flex; flex-direction: column`
- `[stack][reverse]` -> column reverse
- `[stack][centered]` -> centered flex column with auto horizontal margin
- `[row]` -> `display: flex; flex-direction: row`

## Grid

The grid mixins generate a fixed set of named configurations:

```html
<section grid="2x2" gap="2">
  <div>One</div>
  <div>Two</div>
  <div>Three</div>
  <div>Four</div>
</section>
```

Generated grid templates currently include:

- `grid="2x2"`
- `grid="3x2"`
- `grid="3x3"`
- `grid="4x3"`
- `grid="4x4"`

These are generated from `src/core/layout/grid/grid.scss` via the `grid-generator` mixin in `src/core/mixins.scss`.

## Span

Juice also generates numeric spans:

```html
<section grid="4x4" gap="1">
  <article span="2">Feature</article>
  <aside>Sidebar</aside>
</section>
```

Important caveat:

`src/core/mixins.scss` currently defines both `grid-column` and `grid-row` spans using the same `span` attribute. Because the selectors overlap, the later definition can win in the compiled CSS. That means span behavior is not yet fully separated into distinct column and row APIs.

For docs and day-to-day usage, treat `span` as an early grid helper rather than a finalized layout contract.

## Gap

Gap utilities are generated numerically:

```html
<div row gap="1"></div>
<div grid="3x3" gap="3"></div>
```

Current behavior:

- `gap="1"` -> `gap: 1rem`
- `gap="2"` -> `gap: 2rem`
- up through `gap="10"`

## Numeric sizing utilities

Juice also provides width, height, margin, and padding selectors generated from the same mixin pattern.

Examples:

```html
<div width="100%" height="20rem"></div>
<div margin="2rem" padding="24px"></div>
```

These utilities are generated across several files under `src/styles`, including:

- `src/styles/width`
- `src/styles/height`
- `src/styles/margin`
- `src/styles/padding`

## Implementation notes

The shared generator is `attribute-generator($property, $unit)` in `src/core/mixins.scss`. It creates selectors from `1` through `100` for a given CSS property and unit.

That is why selectors are literal attribute/value pairs like:

```html
<div width="80vw"></div>
<div margin-top="12rem"></div>
```

## Recommended usage

Juice layout works best when used for:

- page sections
- simple card grids
- content stacks
- horizontal action groups

For more advanced responsive layout behavior, it is reasonable to combine Juice with app-level CSS until the layout API grows further.
