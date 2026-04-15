# Juice Maturity Matrix

This document tracks the current maturity of Juice across its major system areas.

The goal is to make it easy to answer:

- what is ready today
- what is usable but still evolving
- what is still early or draft

## Maturity levels

### `Stable-ish`

The feature is usable today, central to the Juice experience, and unlikely to change dramatically in basic concept.

### `Emerging`

The feature is useful and present, but the API, conventions, or implementation details are still likely to evolve.

### `Early`

The feature exists, but it is still exploratory, incomplete, or not yet something Juice should strongly promise as a finished public surface.

### `Draft`

The feature is more of a direction or configuration surface than a hardened part of Juice.

## Matrix

| Area | Maturity | Notes |
|---|---|---|
| Attribute-driven styling model | Stable-ish | This is the core identity of Juice and already works well in real markup. |
| Layout primitives (`stack`, `row`, `gap`, `space`, `content`, `container`) | Stable-ish | Central to day-to-day composition and already useful across pages and app views. |
| Spacing and sizing utilities | Stable-ish | Broadly useful and predictable, though still worth continued normalization. |
| Color tokens and swatches | Stable-ish | One of the strongest parts of the system. |
| Typography utilities | Stable-ish | Readable and useful, with good practical value in page-building. |
| Icon system | Stable-ish | Strong now that FontAwesome Free solid, regular, and brands are integrated and documented. |
| Responsive core behavior | Emerging | Improving, but still an area where defaults and exceptions need more hardening. |
| Card system | Emerging | Now has a meaningful structure, variants, and content regions, but is still maturing. |
| Button system | Emerging | Useful and expressive, but still early compared to mature design-system button APIs. |
| Form system | Emerging | The scoped field model is strong, but state semantics and composition patterns are still settling. |
| Navigation system | Emerging | Nav variants are growing into a real subsystem, but region semantics and active/current states need refinement. |
| Page-level patterns | Emerging | Tutorials and patterns are now present, which makes Juice more teachable and reusable. |
| Rules engine | Emerging | The philosophy is strong, but only lightly formalized in written protocol docs so far. |
| Docs and onboarding | Emerging to Stable-ish | Much stronger now, with onboarding, best practices, tutorials, and patterns. |
| JS entrypoint | Early | Present, but still minimal compared with the styling layer. |
| Public component exports | Early | Components exist in the style system more than in a hardened JS/component API. |
| Themes | Early | Present in the tree, but still not one of the most mature public surfaces. |
| Config-driven branding | Draft | Useful direction, but still not required and not yet a hardened contract. |
| Generator/config pipeline | Draft | The config exists, but the workflow around it is still early and evolving. |

## Summary by category

### Strongest areas

These are the parts of Juice that are already carrying real value:

- attribute-driven styling model
- layout primitives
- spacing and sizing utilities
- color tokens
- typography
- icon system

These form the strongest case for Juice as a CSS-first styling and composition system.

### Most promising emerging areas

These are already useful, but still need refinement before they feel fully settled:

- cards
- forms
- navigation
- responsive defaults
- page-level patterns
- rules engine formalization
- documentation as product surface

These areas are what will most directly move Juice from strong alpha to more mature system status.

### Early or draft areas

These should be treated more carefully in positioning:

- JS entrypoint
- public component exports
- themes
- config-driven branding
- generator/config workflow

These can absolutely be valuable, but they should not yet be the center of the Juice promise.

## Recommended positioning right now

If Juice is being described externally or internally, the most honest current positioning is:

`Juice is a CSS-first, attribute-driven styling and composition system with strong layout, token, typography, icon, and page-structure support.`

That framing matches the strongest current reality.

Less accurate positioning right now would be:

- fully mature component framework
- finished theming engine
- deeply featured JS component runtime
- fully stabilized config-driven design system generator

## What would move Juice upward fastest

### To move more areas into `Stable-ish`

Focus on:

1. normalizing attribute conventions
2. hardening cards, buttons, forms, and nav
3. clarifying responsive defaults
4. writing more explicit rules-engine docs
5. keeping examples and docs tightly aligned with the real API

### To move config and theming beyond `Draft`

Focus on:

1. defining what config is responsible for
2. showing how config and expressive attributes work together
3. documenting a stable customization workflow
4. reducing ambiguity around generator behavior

## Practical interpretation

If you are building with Juice today:

- confidently use the CSS-first styling, layout, token, typography, and icon layers
- use cards, forms, nav, and buttons with the understanding that they are still maturing
- treat themes, config, and JS export surfaces as optional or evolving

That is the cleanest and most honest adoption model for the current state of the system.
