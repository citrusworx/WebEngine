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

## Summary

The most common Juice failures come from:

* misused semantics
* over-constrained widths
* incorrect primitive choice
* over-painted surfaces

Most of the time, the fix is to simplify the structure and trust the system more.
