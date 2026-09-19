# 03 — Layout as structure

[Previous](./02-tokens.md) · [Course](./README.md) · [Next](./04-surfaces.md)

**Goal:** build page structure with Juice primitives and semantic HTML, instead of solving placement with widths and nested sections. Allow 60 minutes.

## Learning goals

- Choose `stack`, `row`, or `grid` from the relationship between children
- Keep meaning on HTML5 elements and visual grouping on `div`
- Use `gap`, `space`, `content`, and `container` before percentage widths
- Read a page skeleton as a design-system artifact, not a CSS puzzle

## Concepts

Layout is structure. It answers “how do these things relate?” before it answers “how many pixels?”

A vertical relationship is a stack. A horizontal cluster is a row. A set of peers that should share a matrix is a grid. Alignment and distribution (`center`, `space-between`) belong to the parent that owns the relationship. Children should rarely position themselves.

Semantic HTML is a separate axis. `section` means “this is a meaningful region.” It does not mean “I needed a box.” When authors nest `section` to get indentation, they destroy the outline. The design-system rule is:

- **one section per meaning**
- **divs do visual grouping**

Responsive behavior should fall out of the primitive. If every breakpoint is a new width on every child, you do not have a layout system. You have a drawing. Juice’s opinion, expanded in Lesson 7: pick the desktop-shaped primitive and let collapse happen.

Width math fights that. Two `width="50%"` children inside a gapped row overflow or wrap because **gap counts**. Percentage widths also survive after a row becomes a column, which is how sidebars turn into skinny stamps on mobile.

## Juice mapping

Low-level selectors live in [Layout](../juice-layout.md). How to compose them without fighting the system is [Layout flow](../juice-layout-flow.md).

### Flow primitives (shipped)

| Attribute | Meaning |
|---|---|
| `stack` | column flex |
| `row` | row flex |
| `reverse` | reverse direction on stack or row |
| `centered` | centering helpers on the flex parent |
| `grid` | named template |
| `span` | early column/row span helper — treat as unfinished |
| `gap` | space between children |
| `space` | `between`, `around`, `evenly`, `start`, `end` |

Shipped `grid` values from `libraries/juice/src/core/layout/grid/grid.scss`:

`2x1`, `2x2`, `3x1`, `3x2`, `3x3`, `4x1`, `4x3`, `4x4`

Each of those also has a built-in cascade (tablet → 2 columns, mobile → 1) except where the mixin already starts at 2. The attributes reference currently lists a shorter set; the compiled grid file is the contract for this course.

`span` sets both column and row span generators; later CSS can win. Do not build a dashboard on `span`.

### Framing helpers

- `container` — page-level responsive padding and max-width at large viewports
- `content` — readable measure
- `bleed` — full-bleed helper
- `center`, `left`, `right` — wrapper alignment, not “style the heading itself”

Prefer putting `center` on a wrapper around a heading. The heading stays a heading.

### Positioning (exists; use rarely)

`position="toBack|toFront|absolute"`, `float="left"`. These are escapes, not the layout system.

`section[auto]` is an opt-in stacked section (`display: flex; flex-direction: column; gap: 1rem`). A plain `section` stays a semantic block so themes can paint it. Do not sprinkle `auto` to avoid thinking about `stack`.

## Worked example

Harbor Press grows a skeleton: intro, catalog grid, and a subscribe lane. Wrappers own placement. Tokens from Lesson 2 stay on type and surfaces, not on every layout node.

```html
<body theme="citrusmint">
  <main container stack gap="2" padding="2rem">
    <section>
      <div stack gap="1">
        <div center>
          <h1 font="oswald" fontSize="xxl" fontColor="obsidian-900">Harbor Press</h1>
        </div>
        <div content center>
          <p font="lato" fontSize="md" fontColor="gray-700">
            Short-run books, careful typesetting, and a catalog that still fits on one shelf.
          </p>
        </div>
      </div>
    </section>

    <section>
      <div stack gap="1">
        <h2 font="oswald" fontSize="xl">This season</h2>
        <div grid="3x1" gap="1">
          <article stack gap="0.75rem" padding="1.25rem" bgColor="white-100" rounded="md">
            <h3 font="oswald" fontSize="lg">The Inlet</h3>
            <p font="lato">Essays on harbors and tide tables.</p>
          </article>
          <article stack gap="0.75rem" padding="1.25rem" bgColor="white-100" rounded="md">
            <h3 font="oswald" fontSize="lg">Letterpress Hours</h3>
            <p font="lato">A shop diary from a one-room bindery.</p>
          </article>
          <article stack gap="0.75rem" padding="1.25rem" bgColor="white-100" rounded="md">
            <h3 font="oswald" fontSize="lg">Fog Index</h3>
            <p font="lato">Poems that refuse a larger type size.</p>
          </article>
        </div>
      </div>
    </section>

    <section>
      <div row gap="1" space="between">
        <div stack gap="0.5rem">
          <h2 font="oswald" fontSize="xl">The list</h2>
          <p font="lato">Season notes. No tracking pixel.</p>
        </div>
        <div row gap="1" centered>
          <span font="lato">Subscribe</span>
        </div>
      </div>
    </section>
  </main>
</body>
```

What to notice:

- Each `section` is one meaning. The `div stack` / `div grid` inside is structure.
- Catalog titles are `article` because each title is a unit of content, not because Juice requires it.
- `grid="3x1"` is a real shipped template. A `row` of three cards would also work and would collapse to a column below 768px. Grid is the better *peer matrix*; row is the better *cluster*.
- The subscribe lane is a `row` with `space="between"`. We have not built a form yet.

A weaker skeleton:

```html
<section>
  <section width="24%">...</section>
  <section width="74%">...</section>
</section>
```

That mixes meaning with columns and will break when `row` collapse arrives in Lesson 7.

## Exercises

1. Convert the catalog from `grid="3x1"` to `row gap="1"`. Predict what happens under 768px (Lesson 7 confirms). Which primitive still feels right for three peers?
2. Add `width="50%"` to each catalog `article` while they sit in a `row gap="1"`. Explain the wrap.
3. Replace the inner `div stack` of the intro with a second `section`. Say what the document outline just lost.

## Checkpoint

For each region of your page (intro, catalog, subscribe), name the primitive and the semantic element. If you used a width, justify it as an outer constraint, not as spacing.

[Answers](./answers.md#lesson-03)

## Go deeper

- [Layout](../juice-layout.md) — primitives and generation notes
- [Layout flow](../juice-layout-flow.md) — construction guidance from real templates
- [Semantics](../juice-semantics.md) — one section per meaning
- [Attributes](../juice-attributes.md) — layout section
- [Anti-patterns](../juice-anti-patterns.md) — nested sections, width-as-spacing, gap math

## Next lesson

[04 — Surfaces and semantics](./04-surfaces.md) turns anonymous white boxes into roles: hero, card, panel, tone.
