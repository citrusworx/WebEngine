# Juice responsive reference

This document lists **built-in** responsive behavior in Juice. For authoring mindset, see [Responsive philosophy](./juice-responsive-philosophy.md).

## Breakpoints

Defined in [`breakpoints.scss`](../../libraries/juice/src/core/breakpoints/breakpoints.scss):

| Name | Min width |
|------|-----------|
| xs | 0 |
| sm | 640px |
| md | 768px |
| lg | 1024px |
| xl | 1280px |
| xxl | 1536px |

Juice uses **max-width** bands for scaling utilities and a **min-width** rule for `row` collapse (see below).

## Layout primitives

### `[row]` collapse

From [`layout.scss`](../../libraries/juice/src/core/layout/layout.scss):

- **Below 768px (`md`)**: `[row]` and `[row][centered]` switch to `flex-direction: column` with wrap.

Authors should prefer `row` + `gap` and avoid fixed child widths unless intentional.

### `[container]` padding

| Viewport | Behavior |
|----------|----------|
| `min-width: md` | `padding: 2rem`, `gap: 1.5rem` |
| `min-width: lg` | `padding: 3rem`, `gap: 2rem` |
| `min-width: xxl` | `max-width: 1280px`, centered |

### `section[auto]`

Opt-in responsive section: `display: flex`, column direction, `gap: 1rem`. Plain `<section>` without `[auto]` stays a neutral semantic block for themes.

## Spacing and sizing scale

Padding, margin, gap, width, and height attributes generated with `responsive-attribute-generator` in [`mixins.scss`](../../libraries/juice/src/core/mixins.scss) scale **rem / vw / vh** values at smaller viewports:

| Band | Approximate viewport | Scale factor |
|------|----------------------|--------------|
| Desktop (lg+) | ≥ 1024px | 100% |
| Tablet (md–lg) | 768px – 1023px | 80% |
| Small tablet (sm–md) | 640px – 767px | 75% |
| Mobile (below sm) | &lt; 640px | 50% |

**Note:** `%` and other units are not auto-scaled by this generator.

## What is not automatic

- Explicit `width="24%"` (or similar) on children is **not** removed when a `row` collapses.
- Themes do not change breakpoints.
- Motion attributes are disabled under `prefers-reduced-motion` (see [juice-animations.md](./juice-animations.md)).

## Quick examples

```html
<div content row gap="1">
  <aside stack gap="1">Sidebar</aside>
  <div stack gap="1">Main</div>
</div>
```

```html
<section auto padding="2rem">
  <h1>Stacks vertically with consistent gap</h1>
  <p>Without manual breakpoint attributes.</p>
</section>
```
