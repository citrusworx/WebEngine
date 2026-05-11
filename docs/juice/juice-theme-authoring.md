# Juice Theme Authoring

## Purpose

This document explains how a Juice theme should actually be constructed.

Themes are not alternate layout systems.

Themes define identity.

Juice defines structure.

That means the theme layer should answer questions like:

* what does the page feel like?
* what is the font voice?
* what is the surface language?
* how should semantic elements present by default?
* what named themed surfaces are available?

Juice itself still owns:

* `row`
* `stack`
* `gap`
* `padding`
* `container`
* `content`
* responsive layout behavior

---

## Theme Responsibilities

A healthy Juice theme should own:

* base text color
* heading treatment
* body font choices
* page background relationship
* semantic element defaults
* control styling tone
* visual treatment of Juice's structural attributes
* brand-specific structural variants (added as values on existing Juice attributes)

Good theme-level examples:

* `theme="aquaflux"` — the theme root selector
* visual treatment of `[card]`, `[card="hero"]`, `[card="cta"]`, `[featured]`, etc. — the theme decides what these look like
* theme-specific variants like `card="aqua-hero"` — when a theme needs its own structural pattern beyond Juice's defaults

Themes should **not** introduce parallel top-level attributes that replace structural primitives. `<section aqua-hero>` is the wrong shape; `<section card="hero" theme="aquaflux">` (or `card="aqua-hero"` if the theme needs its own variant) is the right shape. See [Layers](./juice-layers.md) and [Anti-Patterns](./juice-anti-patterns.md).

---

## What Themes Should Not Own

Themes should not redefine the core Juice layout model.

That means a theme should not try to replace:

* `row`
* `stack`
* `gap`
* `padding`
* `container`
* `content`
* built-in responsiveness

If the theme starts dictating how pages should split, wrap, or space themselves structurally, it is drifting out of the identity layer and into framework behavior.

---

## The First Real Contract

Aquaflux should be treated as the first fully formed Juice theme contract.

That means it should establish the pattern all later themes follow:

1. a theme SCSS file
2. a theme metadata file
3. semantic defaults
4. typography hierarchy
5. named surfaces

Recommended folder shape:

```text
src/themes/
  aquaflux/
    aquaflux.scss
    aquaflux.yaml
```

---

## Theme File Roles

### `*.scss`

The SCSS file is the implementation.

It should contain:

* theme custom properties
* semantic element defaults
* control styling
* named surface selectors

### `*.yaml`

The YAML file is the contract and metadata.

It should describe:

* theme id and selector
* typography choices
* palette intent
* named surfaces
* recommended use cases
* authoring rules

This matters because a theme should be readable as a system, not just as a stylesheet.

---

## Recommended Theme Structure

A healthy Juice theme usually has these layers.

### 1. Root Theme Selector

Example:

```scss
[theme="aquaflux"] {
  ...
}
```

This is where the theme defines its custom properties and page-level identity.

### 2. Semantic Element Defaults

Example targets:

* `section`
* `article`
* `aside`
* `nav`
* `header`
* `footer`
* `form`

These defaults should make semantic elements feel coherent without turning them into layout hacks.

### 3. Typography Hierarchy

Themes should set:

* body font
* heading font
* text color
* muted text color
* heading color

This is one of the biggest quality differences between a real theme and a demo skin.

### 4. Control Styling

Themes should define the tone of:

* buttons
* inputs
* textareas
* selects

They should not invent separate layout behavior for them.

### 5. Named Surfaces

These are the theme-specific authored surfaces — added as values on existing Juice structural attributes, not as new top-level attributes.

Examples:

* `card="aqua-hero"` — a theme-specific hero pattern
* `card="aqua-panel"` — a theme-specific panel pattern

The theme also styles Juice's default structural attributes directly (`[theme="aquaflux"] [card]`, `[theme="aquaflux"] [card="cta"]`, etc.) — those do not need new names.

This gives authors higher-level theme surfaces without forcing every page to be assembled from raw background and border decisions, while keeping the structural vocabulary consistent across themes.

---

## Example Contract

```html
<body theme="aquaflux">
  <main stack gap="1">
    <section card="hero">
      <div heading>...</div>
      <div content>...</div>
    </section>

    <section>
      <div row wrap gap="1">
        <article card>
          <div header>...</div>
          <div body>...</div>
        </article>

        <aside card="aqua-panel">
          ...
        </aside>
      </div>
    </section>
  </main>
</body>
```

This is the right relationship:

* Juice controls layout and structural vocabulary (`card`, `header`, `body`, `heading`, `content`)
* the theme controls identity, surface tone, and may add its own variants (`card="aqua-panel"`)
* the theme attribute (`theme="aquaflux"`) scopes the visual treatment without renaming structure

---

## Theme Authoring Questions

When building a theme, ask:

* what is the body font?
* what is the display font?
* what is the page background/surface relationship?
* what is the neutral text color?
* what is the accent strategy?
* how should semantic sections feel by default?
* what named surfaces does the theme need?
* what kinds of brands or pages is this theme for?

If those questions are not clearly answerable, the theme is probably not formed enough yet.

---

## A Good Theme Feels Coherent Early

A strong Juice theme should make a page feel more coherent before a lot of one-off styling is added.

That means:

* typography feels intentional
* surfaces feel related
* semantic defaults support the page type
* buttons and controls feel on-brand
* the theme has a clear identity

If the page still feels like raw utilities plus random color after the theme is applied, the theme is not doing enough.

---

## A Good Theme Still Leaves Juice Visible

A good theme should not bury Juice.

It should still allow the author to think in terms of:

* `stack`
* `row`
* `container`
* `content`
* responsive structure

The theme should make those structures feel branded, not replace the structures themselves.

---

## Recommended Rule Set

For every new theme:

* use one root `theme="..."` selector
* define custom properties first
* style semantic elements, not generic layout wrappers
* leave `div` mostly free for composition
* define at least two named surfaces
* pair one body font with one display font
* document the theme in YAML
* describe what types of pages the theme is meant for

---

## Summary

Themes in Juice define identity, not layout.

The first complete pattern should be:

* SCSS implementation
* YAML contract
* semantic defaults
* typography hierarchy
* named surfaces

Aquaflux should now be treated as the reference model for how a Juice theme is designed.
