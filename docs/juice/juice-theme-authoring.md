# Juice Theme Authoring

## Purpose

This document explains how to think about themes in Juice.

Themes are not meant to replace Juice layout and spacing.

Themes define:

* typography tone
* color relationships
* semantic element presentation
* named surface patterns

Juice defines:

* layout
* spacing
* structural primitives
* reusable visual utilities

## Theme Responsibilities

A Juice theme should focus on:

* base text color
* heading treatment
* body font choices
* section/article/aside/nav/header/footer defaults
* surface identity for named components

Good theme-level examples:

* `theme="aquaflux"`
* `aqua-card`
* `aqua-hero`

## What Themes Should Not Own

Themes should not replace:

* `row`
* `stack`
* `gap`
* `padding`
* `container`
* `content`

Those belong to Juice.

## Theme Structure

A healthy theme usually has:

1. root theme selector
2. semantic element styling
3. text hierarchy styling
4. named themed surfaces

## Example Contract

```html
<body theme="aquaflux">
  <main>
    <section aqua-hero>
      ...
    </section>

    <section aqua-card>
      ...
    </section>
  </main>
</body>
```

## Theme Authoring Questions

When building a theme, ask:

* what is the body font?
* what is the display font?
* what is the neutral text color?
* what is the background/surface relationship?
* how should sections and articles feel by default?
* what named surfaces does the theme need?

## Good Theme Output

A good Juice theme should make pages feel coherent even before a lot of one-off styling is added.

That means:

* typography feels intentional
* surfaces feel related
* element defaults support the theme instead of fighting it

## Summary

Themes in Juice define identity, not layout.

They should shape tone and surface language while letting Juice remain the owner of structure and spacing.
