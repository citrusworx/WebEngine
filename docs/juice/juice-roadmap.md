# Juice Roadmap

This document captures the current roadmap direction for Juice based on recent template work, theme experiments, and framework philosophy decisions.

## Core Position

Juice is strongest when it stays opinionated.

- Juice owns spacing and layout primitives.
- Juice owns baked-in responsive scaling.
- Themes own typography, color, and visual tone.
- User overrides should happen through config, not through inline per-element breakpoint sprawl.

That means the roadmap is not about making Juice behave like a utility-first breakpoint system. It is about making Juice more expressive while preserving its structured defaults.

## What Is Already Working

- Attribute-based layout and spacing are productive.
- Built-in responsive compression is a feature, not a bug.
- Template work proves Juice can move quickly across very different page types.
- Theming is starting to become a meaningful layer, especially with experiments like `theme="aquaflux"`.

## What Is Holding Templates Back

The main limitation is that Juice currently has stronger layout primitives than visual primitives.

In practice, this means templates can be structured well, but they still need more help with:

- typography systems
- semantic surfaces
- reusable theme variants
- richer visual treatment
- media presentation
- interaction states
- component-level patterns

## Priority Roadmap

### 1. First-Class Theme System

Themes should become a real contract, not just a loose SCSS convention.

Themes should define:

- semantic text colors
- semantic surface colors
- border colors
- accent colors
- heading fonts
- body fonts
- visual variants like `hero`, `card`, `panel`, `muted`, `cta`

Themes should not define spacing and layout. That remains Juice territory.

Target outcome:

- `theme="aquaflux"` sets the full color and typography language
- theme surfaces like `aqua-card` and `aqua-hero` become first-class patterns
- future themes follow the same structure

### 2. Typography Expansion

Typography is one of the biggest things limiting template quality.

Juice should add stronger support for:

- font weight
- line height
- letter spacing
- text transform
- text measure / readable line width
- semantic heading scales
- display typography patterns

Target outcome:

- stronger brand voice
- better hierarchy
- cleaner marketing pages, dashboards, and editorial sections

### 3. Semantic Surface Primitives

Right now, too much visual polish has to be hand-authored in theme CSS.

Juice should grow native support for:

- border widths
- border styles
- border opacity
- layered shadows
- glass / blur surfaces
- surface variants
- richer gradient controls
- overlays

Target outcome:

- cards, heroes, sidebars, promo panels, and forms feel more intentional without custom CSS

### 4. Config-Driven Responsive Overrides

Responsive behavior should remain baked into Juice by default.

That default is a feature.

The goal is not to introduce noisy inline responsive overrides. The goal is to give users a clean config layer for changing the default behavior when needed.

Config should be able to influence things like:

- global scaling ratios
- container behavior
- typography scaling curves
- how much cards compress on smaller screens
- how much heroes preserve vertical space
- minimum button sizing rules
- section-level compression behavior

Target outcome:

- Juice stays opinionated
- teams can still tune behavior at the project level
- responsive overrides remain structured and predictable

### 5. Better Media Handling

Templates need stronger image and media support.

Juice should add better primitives for:

- image sizing
- aspect ratios
- object fit
- object position
- media masks
- overlays
- hero image handling
- product image blocks

Target outcome:

- templates can present real content cleanly once assets are introduced

### 6. Interaction and State Styling

Juice needs a clearer story for interactive UI states.

This includes:

- hover
- focus
- active
- selected
- disabled
- pressed
- simple transitions

Target outcome:

- buttons, tabs, cards, inputs, and nav elements feel complete

### 7. Better Icon Contract

Icons work, but the authoring model still feels a little improvised.

Juice should make icon usage more consistent by defining:

- native sizing patterns
- alignment expectations
- common icon wrappers
- icon + text pair patterns

Target outcome:

- templates stop needing ad hoc icon treatment
- dashboards, navs, and cards feel more systemized

### 8. Component-Level Pattern Library

Juice has primitives, but it still needs more repeatable higher-level patterns.

Good candidates:

- hero shells
- navbar/header shells
- dashboards
- pricing tables
- product shelves
- feature grids
- sidebars
- promo banners
- section wrappers

Target outcome:

- faster template creation
- more consistency across projects
- better starting points without locking users into rigid components

## Recommended Order

If the roadmap needs a practical build order, this is the suggested sequence:

1. First-class theme system
2. Typography expansion
3. Semantic surface primitives
4. Config-driven responsive overrides
5. Better media handling
6. Interaction and state styling
7. Better icon contract
8. Component-level pattern library

## Design Principle to Protect

One principle should stay stable as Juice grows:

> Juice should become more expressive without becoming noisier.

That means:

- more power through structure
- more flexibility through config
- more visual identity through themes
- not more inline complexity

## Short Version

The next phase of Juice should focus on making the system visually expressive at the same level that it is already layout-expressive.

The biggest moves are:

- real themes
- better typography
- better surfaces
- config-level responsive tuning
- stronger media, state, and icon systems

That is what will make future templates feel less like well-laid-out HTML and more like finished products.
