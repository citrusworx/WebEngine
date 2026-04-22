# Juice Responsive Philosophy

## Core Idea

Responsive behavior is built into Juice.

That means authors should not approach Juice as a framework where every breakpoint must be manually orchestrated.

Instead, the system is designed so that:

* core primitives already adapt
* layouts should collapse naturally
* spacing scales with the system
* authors only intervene when they are intentionally defining the outer box

## What This Means in Practice

When using Juice:

* trust `row` to collapse
* trust spacing to scale
* trust layout primitives before reaching for manual width math

Do not start by trying to outsmart the responsive system.

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

## Good Pattern

```html
<div content row gap="1">
  <aside stack gap="1">...</aside>
  <div stack gap="1">...</div>
</div>
```

This lets Juice decide how the row collapses.

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

## Summary

Juice responsiveness is a feature, not a fallback.

The best results usually come from:

* choosing the right primitive
* avoiding unnecessary width constraints
* letting the system collapse naturally
