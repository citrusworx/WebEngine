# Juice Responsive Philosophy

## Core Idea

Responsive behavior is built into Juice.

That means authors should not approach Juice as a framework where every breakpoint must be manually orchestrated.

Instead, the system is designed so that:

* core primitives already adapt
* layouts should collapse naturally
* spacing scales with the system
* authors only intervene when they want to override Juice's default responsive decisions

## What This Means in Practice

When using Juice:

* trust `row` to collapse
* trust `grid` to cascade down to simpler layouts
* trust spacing to scale
* trust layout primitives before reaching for manual width math

Do not start by trying to outsmart the responsive system.

## Default Responsive Ownership

In Juice, responsive behavior belongs to the primitive itself.

That means:

* `row` owns how a row collapses
* `grid="3x1"` owns how that grid steps down at smaller widths
* `content` owns framing behavior, not breakpoint micromanagement

Authors should be able to write the desktop shape once and let Juice define the natural collapse path.

Example:

```html
<div grid="3x1">
```

That should already carry a built-in responsive cascade.

The author should not need to write the first responsive version by hand.

## Overrides, Not Breakpoint Choreography

Juice may expose explicit breakpoint override hooks, but those are not the primary responsive system.

They are escape hatches.

The intended model is:

* primitives define the default responsive cascade
* optional override attributes only exist for cases where the author wants to change that default

Example shape:

```html
<div grid="3x1" adapt tablet="3x1" mobile="2x1">
```

In that model:

* `grid="3x1"` already has built-in responsive behavior
* `adapt` enables override attributes
* `tablet`, `mobile`, and `laptop` are only meaningful when `adapt` is present

Without `adapt`, those override attributes should do nothing.

This keeps Juice opinionated by default while still allowing controlled exceptions.

## Default Authoring Mindset

Build the structure first.

Then ask:

* what should remain a vertical lane?
* what should split horizontally on larger screens?
* what needs a true fixed or partial width?

That is different from:

* mobile breakpoint rules first
* desktop width math everywhere
* manual overrides on every section

## What Authors Should Usually Trust

Authors should generally trust Juice for:

* `row` collapse
* grid cascade
* `stack` remaining vertical
* spacing rhythm
* content framing with `content`
* grouping behavior when primitives are chosen correctly

## What Still Requires Care

Built-in responsiveness does not cancel explicit width instructions.

If a child has:

* `width="24%"`

and the outer `row` collapses to a column, the child still keeps that width unless the layout changes or the width is removed.

So the rule is:

* built-in responsiveness handles layout behavior
* explicit width attributes still need to be used carefully
* override attributes should only be used when the built-in cascade is not the desired result

## Good Pattern

```html
<div content row gap="1">
  <aside stack gap="1">...</aside>
  <div stack gap="1">...</div>
</div>
```

This lets Juice decide how the row collapses.

Another good pattern:

```html
<div grid="3x1">
  <article>...</article>
  <article>...</article>
  <article>...</article>
</div>
```

This lets Juice define the natural cascade for the grid instead of forcing the author to manually restate each breakpoint.

## Risky Pattern

```html
<div content row gap="1">
  <aside width="24%" stack gap="1">...</aside>
  <div width="74%" stack gap="1">...</div>
</div>
```

This may look right on desktop, but it can break badly once the row stacks on smaller screens.

## Config vs Markup

Juice should remain opinionated by default.

If deeper responsive behavior needs tuning, the long-term expectation is:

* defaults come from Juice
* project-wide overrides come from config
* markup should not become a breakpoint battlefield
* per-element breakpoint overrides should remain opt-in and constrained

## Summary

Juice responsiveness is a feature, not a fallback.

The best results usually come from:

* choosing the right primitive
* avoiding unnecessary width constraints
* letting the system collapse naturally
* only using `adapt` when overriding the default cascade is genuinely necessary
