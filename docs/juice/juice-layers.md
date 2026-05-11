# Juice Layers

Juice and Themes are two distinct layers with non-overlapping responsibilities. The same JSX should render differently under different themes — only the visual treatment changes, not the structure.

## The split

| Layer | Owns |
| --- | --- |
| **Juice** | Layout, spacing, padding, margins, responsiveness, the *structural* attribute vocabulary (slot names, variant names, state flags) |
| **Themes** | Brand colors, typography, additional brand-specific components, the *visual treatment* of Juice's structural attributes |

## Juice owns

### Layout and spacing mechanics

- `stack`, `row`, `grid`, `container`, `content`
- `gap`, `padding`, `margin`, `paddingY`, `paddingX`
- `width`, `height`
- responsive collapse behavior

### Structural vocabulary

The names that describe what a thing *is* and how its parts relate.

- Parent variants: `card="pricing"`, `card="feature"`, `card="cta"`, `card="hero"`, `btn="outline"`, `badge="ribbon"`
- Child slots: `heading`, `content`, `action`, `header`, `body`, `footer`, `media`, `meta`, `name`, `price`, `description`, `features`, etc.
- State flags: `featured`, `active`, `warm`, `full`, `disabled`

The *names* and their *structural meaning* are Juice's responsibility. A `<div card="pricing" featured>` has a known shape no matter which theme is loaded.

### Token scaffolding

Scale tokens (`sm`, `md`, `lg`, `cozy`, `comfortable`, `roomy`) and how they cascade into spacing, sizing, and radii. The *values* a theme assigns to those tokens is a theme decision; the *vocabulary* is Juice.

## Themes own

### Brand expression

- Color palettes, brand slots (primary/secondary/tertiary), alert types (success/warning/information/error)
- Typography (font families, weights, sources)
- Surface tone, shadow language, border character

### Visual treatment of Juice's slots

When a theme styles `[card="pricing"][featured]`, it decides:

- whether `featured` means a gradient, a border, a scale-up, or a glow
- whether the card has a shadow, a flat surface, or a glassmorphic background
- whether `[price] [amount]` is rendered in a display font or a body font

The attribute names are not Theme decisions. The visual realization of those attributes is.

### Additional brand-specific components

A theme may add new components on top of Juice's structural primitives — branded compositions that combine existing slots into a recognizable theme pattern. Theme-specific components should still follow the parent/child/sibling naming rule from [Juice Naming](./juice-naming.md).

## What this looks like

The same markup, two themes:

```html
<div card="pricing" featured>
  <span badge="ribbon">Most Popular</span>
  <div plan>
    <div header>
      <div name>Pro</div>
      <div price>
        <span currency>$</span>
        <span amount>20</span>
        <span period>/month</span>
      </div>
    </div>
    <ul features>...</ul>
    <div action><button full>Start Free Trial</button></div>
  </div>
</div>
```

Under one theme this might be a warm gradient card with a serif display amount. Under another it might be a glass-morphic card with a monospace amount. The structure does not change; only the rendering does.

## How to decide where something belongs

When considering a new attribute or rule, ask:

| Question | Layer |
| --- | --- |
| Does it describe *how things sit on the page*? | Juice |
| Does it describe *how things look*? | Theme |
| Is it a structural slot name? | Juice |
| Is it a color, font, shadow, gradient, or radius value? | Theme |
| Is it a token scale (sm/md/lg)? | Juice owns the scale, theme owns the values |
| Is it a brand-specific component? | Theme (built on Juice primitives) |

## Why this split

Three reasons:

1. **Themes become swappable.** A KiwiPress app and a Stencil app can ship the same Juice markup with two completely different brands. The brand layer is the only thing that changes.
2. **Structure stays predictable.** Authors learn one vocabulary. Theme variation does not require relearning what `[header]` or `[action]` mean.
3. **Juice stays opinionated about the right things.** Juice has strong opinions about layout, spacing, responsiveness, and naming. It has no opinions about color, type, or surface tone — those are brand decisions.

## Common drift to avoid

- **Do not put colors or fonts in Juice.** Even one-off brand colors. They belong in a theme.
- **Do not put layout or spacing in themes.** A theme should never override `stack`, `gap`, or `padding` semantics.
- **Do not let a theme rename a structural attribute.** If a theme wants its own variant, add it as a `card="..."` value, not as a new top-level attribute that replaces `card`.
- **Do not invent BEM-style theme prefixes for structural slots.** `[aqua-header]` is wrong; `[theme="aquaflux"] [card] [header]` is right. Themes scope through the theme attribute, not through prefixed names.

## See also

- [Naming](./juice-naming.md) — the parent/child/sibling rule used by both Juice and themes
- [Theme Authoring](./juice-theme-authoring.md) — how to build a theme
- [Surface Spec](./juice-surface-spec.md) — the surface model that sits on top of this split
