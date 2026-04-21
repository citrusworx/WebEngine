# Juice Protocol - Rule #003: Padding Over Box Size

## Overview

In Juice, padding is the primary way to size the internal white-space of interface elements such as heroes, buttons, cards, banners, and panels.

Height and width are not the default tools for creating that interior breathing room.

This rule exists to preserve Juice's built-in responsive behavior and keep component sizing fluid across screen sizes.

---

## Rule #003 - Use `padding` as the primary interior sizing mechanism

When a user wants to control the perceived size of a hero, button, card, or similar UI surface, they should primarily do so with:

- `padding`
- `paddingX`
- `paddingY`

They should not default to `height` or `width` when the real goal is to create the element's internal white-space.

`height` and `width` still have an important role in Juice, but that role is to define the outer box when a deliberate box constraint is actually needed.

### Valid Usage

```html
<section hero paddingX="4rem" paddingY="6rem">
  <h1>Calm infrastructure</h1>
  <p>Built-in responsiveness keeps this breathing room fluid.</p>
</section>

<button paddingX="1.25rem" paddingY="1rem" rounded="full">
  Book a ritual
</button>

<div card paddingX="2rem" paddingY="2rem">
  <h3>Growth Plan</h3>
  <p>Pricing and features</p>
</div>
```

### Not the Default Usage

```html
<!-- box sizing used when the goal is really interior breathing room -->
<button height="4rem" width="12rem">
  Book a ritual
</button>

<!-- fixed height used to make the hero feel roomier -->
<section height="30rem" width="100%">
  <h1>Calm infrastructure</h1>
</section>
```

---

## Behavior

Padding in Juice is responsive by design.

Juice already applies a sliding-scale model to spacing values so that padding compresses and adapts across viewport sizes. That means padding preserves the intended visual rhythm while still responding to smaller screens.

Height and width serve a different purpose:

- `width` controls the outer horizontal box constraint
- `height` controls the outer vertical box constraint
- `padding` controls the interior breathing room

This distinction matters.

If a hero or button is sized with padding:

- the content can breathe naturally
- the element scales more gracefully
- the built-in responsive system works with the element instead of fighting it

If a hero or button is sized with fixed height by default:

- content becomes easier to clip or crowd
- the visual result becomes more rigid
- the responsive behavior becomes less natural

---

## Why this rule exists

Juice bakes responsiveness into the system.

That means authors should lean on the attributes that participate naturally in that responsive model.

Padding is one of those core responsive attributes.

Using padding for interior sizing keeps:

- heroes expansive without becoming brittle
- buttons comfortably sized without hard box constraints
- cards and panels readable across breakpoints
- layouts visually consistent as the screen shrinks

Using height and width for the same purpose as padding works against the system when interior comfort is the real goal.

---

## Recommended mental model

Use this rule of thumb:

- use `padding` to create breathing room
- use `width` to define span or outer constraint
- use `height` to define an outer vertical box only when that box is intentional

Examples of when `height` or `width` are appropriate:

- icon buttons
- media placeholders
- image frames
- charts
- maps
- square or deliberately rigid UI boxes
- dashboard widgets
- deliberate full-screen or section-height treatments
- skeleton and loading blocks
- widgets whose box dimensions are part of the design

Examples of when `height` is not the right default tool:

- making a button feel larger
- making a hero feel roomier
- adding white-space around text
- creating panel comfort

---

## Design implication

This rule helps preserve one of Juice's core ideas:

> spacing should stay fluid and responsive by default

Padding is the interior spacing primitive that best supports that philosophy.

Height and width are still valid tools, but they should be used intentionally for outer-box definition rather than as the first answer to spacing.

This is a default Juice rule, not an absolute ban.

When an element's outer dimensions are part of the design, `width` and `height` are appropriate. When the goal is simply to make an element feel roomier, `padding` should usually be the first tool.

---

*Juice Protocol - Rules Engine v0.1*  
*Part of the CitrusWorx ecosystem.*
