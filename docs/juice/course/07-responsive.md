# 07 — Responsive systems

[Previous](./06-themes.md) · [Course](./README.md) · [Next](./08-hybrid-authoring.md)

**Goal:** trust Juice’s built-in collapse and scale, and only constrain width when you mean to constrain the box. Allow 50 minutes.

## Learning goals

- Explain why a design system owns default responsive behavior
- Predict `row` collapse and grid cascade from shipped rules
- Find leftover desktop widths after a collapse
- Distinguish philosophy (mindset) from reference (numbers)

## Concepts

Responsive work is often taught as “write a breakpoint for each layout.” That produces a second copy of the page at every width. A design system can instead attach a **default cascade** to each primitive: a row becomes a column; a 3-column grid becomes 2, then 1; spacing steps down.

Authors then write the **desktop-shaped structure once**. They override only when the default is wrong. Overrides are escapes. If every node has `mobile=`, you have rebuilt utility soup on a second axis.

Two failure modes show up constantly:

1. **Fighting the cascade** — fixed child widths, min-heights on text, grids rebuilt by hand at each band
2. **Ignoring the cascade** — assuming the desktop row is the only shape, then shipping a 24% sidebar that stays 24% when the row stacks

A system is working when a narrow viewport looks intentional without a media-query file named after the page.

## Juice mapping

Read both documents. They are not duplicates.

- [Responsive philosophy](../juice-responsive-philosophy.md) — mindset, ownership, intended override model
- [Responsive reference](../juice-responsive-reference.md) — shipped breakpoints and behavior

### Breakpoints (shipped)

From `libraries/juice/src/core/breakpoints/breakpoints.scss`:

| Name | Min width |
|---|---|
| xs | 0 |
| sm | 640px |
| md | 768px |
| lg | 1024px |
| xl | 1280px |
| xxl | 1536px |

### What actually happens

**`[row]`** below 768px (`md`): `flex-direction: column` (including `[row][centered]`).

**`[grid="..."]`** common templates cascade via `adaptive-grid-cascade` in `grid.scss`: tablet (sm–lg) → 2 columns, mobile (below sm) → 1 column. This is compiled behavior, not an attribute you turn on.

**`[container]`** gains padding/gap at `md` / `lg`, and a 1280px max-width at `xxl`.

**Spacing/sizing** generated with `responsive-attribute-generator` scales **rem / vw / vh** (not `%`):

| Band | Scale |
|---|---|
| lg+ | 100% |
| md–lg | 80% |
| sm–md | 75% |
| below sm | 50% |

**`section[auto]`** — opt-in stacked section. Plain `section` stays semantic.

### What does not happen

- Child `width="24%"` is **not** cleared when a row collapses
- Themes do not change breakpoints
- Author-facing `adapt` + `tablet` / `mobile` / `laptop` overrides appear in the philosophy doc as the *intended* escape hatch. They are **specified, not the primary shipped authoring API**. Do not write `adapt tablet="3x1"` in this course and expect a documented public contract
- `prefers-reduced-motion` disables motion attributes; that is [Animations](../juice-animations.md), not layout

### Authoring rules that follow

- Prefer `row` + `gap` over sibling percentage widths
- Prefer `content` / `container` / `padding` over `width` for comfort
- When you need a width, plan for the stacked state (full-width children, or no width)
- `field width="40vw"` from the search pattern is a known sharp edge on small screens

## Worked example

Take the Lesson 5/6 Harbor Press page and audit it as a responsive system.

**Keep**

```html
<div grid="3x1" gap="1">
  <article card="feature">...</article>
  <article card="feature">...</article>
  <article card="feature">...</article>
</div>
```

Three peers. The cascade will step this down. You do not write a second catalog.

**Fix the subscribe row**

Bad (desktop leftover):

```html
<div row gap="1" centered width="100%">
  <div field width="40vw">
    <input type="email" scale="lg" rounded />
  </div>
  <button btn="flat" theme="citrusmint-300" scale="lg">Subscribe</button>
</div>
```

When the row becomes a column, `40vw` is still 40% of the viewport — a narrow field sitting in a stacked form.

Better:

```html
<form type="search" stack gap="1">
  <div field>
    <input type="email" placeholder="you@harbor.press" scale="lg" rounded />
  </div>
  <div action>
    <button btn="flat" theme="citrusmint-300" scale="lg" full>Subscribe</button>
  </div>
</form>
```

`stack` is already a column; there is nothing to collapse. `full` is a state flag for a full-width control. On a wide CTA card you can wrap the same fields in `row gap="1"` *without* the viewport width if a horizontal cluster is the real desktop intent.

**Fix a sidebar instinct**

```html
<!-- Bad: widths survive collapse -->
<div row gap="1">
  <aside width="24%" panel>...</aside>
  <div width="74%" stack>...</div>
</div>
```

```html
<!-- Better: let the row become a column; use min-content structure -->
<div row gap="1">
  <aside panel padding="1.25rem" stack gap="0.75rem">...</aside>
  <div stack gap="1">...</div>
</div>
```

If the aside must stay a fraction on desktop, you are choosing a constraint. Document it, and test the stacked state. Do not copy 24/74 from a desktop mock and leave town.

**Hero**

Do not set `height="80vh"` to make the hero feel large. Use `padding` (and `paddingY` if you want vertical interior only). Text plus padding survives wrap; a fixed height crops it.

## Exercises

1. Narrow the workbench below 768px. List every `row` and whether its children still carry a `%` / `vw` width.
2. Put three catalog cards in a `row gap="1"` instead of `grid="3x1"`. Compare the two narrow-viewport results. Write one line on cluster vs matrix.
3. Add `width="50%"` to two children of a `row gap="2"`. Predict wrap before you resize.

## Checkpoint

In one paragraph: what does Juice own at 500px on your page, and what leftover author constraint still fights it? Name the file you would change first — markup primitive, a width attribute, or a theme?

[Answers](./answers.md#lesson-07)

## Go deeper

- [Responsive philosophy](../juice-responsive-philosophy.md)
- [Responsive reference](../juice-responsive-reference.md)
- [Layout flow](../juice-layout-flow.md)
- [Anti-patterns](../juice-anti-patterns.md) — collapsing shells, gap math, width-as-spacing
- [Padding over box size](<../rules/003-Padding Over Box Size.md>)

## Next lesson

[08 — Hybrid styling and authoring](./08-hybrid-authoring.md) decides when a custom selector is honest, and when it is a second system.
