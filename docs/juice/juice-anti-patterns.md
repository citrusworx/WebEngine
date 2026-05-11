# Juice Anti-Patterns

## Purpose

This document collects the most common ways to fight Juice instead of working with it.

These are useful because many layout and template failures in Juice come from a few repeated mistakes.

## 1. Using Semantic Elements as Generic Layout Wrappers

Bad:

```html
<section>
  <section>
    <section>...</section>
  </section>
</section>
```

Why it is bad:

* semantics become meaningless
* layout and meaning get mixed together

Better:

* use one semantic section for the meaning
* use `div` for the layout inside it

## 2. Building a Feed With `section`

A feed is usually a vertical lane.

That means it should be `div stack`, not `section`.

## 3. Leaving Desktop Widths on Mobile-Collapsing Shells

Bad:

```html
<div row>
  <aside width="24%">...</aside>
  <div width="74%">...</div>
</div>
```

Why it is bad:

* Juice will collapse the row
* the children keep their widths
* the mobile stack becomes unusably narrow

## 4. Using Width to Solve Spacing Problems

If the issue is comfort or breathing room, use:

* padding
* `container`

not width.

## 5. Forgetting That Gap Counts in Width Math

Two children at `50%` inside a gapped row will often wrap.

That is correct.

Use lighter percentages when gap is present.

## 6. Overusing Loud Surfaces Everywhere

When every card is brightly tinted:

* hierarchy disappears
* professionalism drops
* the page feels noisy

Use neutral surfaces more often.
Let accent color carry meaning.

## 7. Using Class-Based Escape Hatches Instead of the Juice Contract

If a pattern should be native to Juice, do not keep it in a half-class, half-attribute state forever.

This has been a recurring issue around icon sizing and similar areas.

## 8. BEM-Style Compound Child Names

Bad:

```html
<div card="pricing">
  <div plan>
    <div plan-header>
      <div plan-price>
        <span plan-amount>20</span>
      </div>
    </div>
    <ul plan-features>...</ul>
  </div>
</div>
```

Why it is bad:

* the parent attribute already establishes scope
* CSS selectors like `[card="pricing"] [plan] [header]` handle context natively
* compound names like `plan-header` and `plan-price` repeat the scope the selector already gives you
* the universal slot vocabulary (`header`, `body`, `action`, `name`, `price`) becomes unusable across components

Better:

```html
<div card="pricing">
  <div plan>
    <div header>
      <div price>
        <span amount>20</span>
      </div>
    </div>
    <ul features>...</ul>
  </div>
</div>
```

See [Naming](./juice-naming.md) for the full rule.

## 9. Putting Brand Colors or Fonts in Juice

Themes own brand expression. Juice owns structural mechanics. If a value is a color, font, shadow, gradient, or radius treatment, it belongs in a theme — not in a Juice attribute name or default.

See [Layers](./juice-layers.md) for the ownership split.

## 10. Theme Attributes That Replace Structural Names

Bad:

```html
<section aqua-hero>...</section>
```

Better:

```html
<section card="hero" theme="aquaflux">...</section>
```

Themes can add new *values* to existing structural attributes (`card="aqua-hero"` if a theme-specific hero is needed). Themes should not introduce parallel top-level attributes that replace `card`, `btn`, or other Juice structural primitives.

## Summary

The most common Juice failures come from:

* misused semantics
* over-constrained widths
* incorrect primitive choice
* over-painted surfaces
* BEM-style compound names instead of parent-scoped bare slots
* brand expression leaking into Juice instead of staying in the theme

Most of the time, the fix is to simplify the structure and trust the system more.
