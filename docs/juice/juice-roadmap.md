# Juice Roadmap

## Current Position

Juice is no longer just a collection of layout utilities.

It is now becoming a broader UI system with five visible layers:

* layout and spacing primitives
* token-driven color, font, and gradient systems
* emerging surface and theme contracts
* browser runtime behavior for built-in features like navigation
* early component exports

The strongest part of Juice today is still its layout and spacing model.
The next strongest areas are now themes, typography expansion, templates, and visual token structure.

The weakest areas are still:

* component maturity
* icon contract stability
* semantic layout behavior on standard HTML elements
* polish and consistency in the runtime/component layer

---

## What Has Improved

### 1. Themes Are Now Real

Juice now has a meaningful theme direction instead of only utility styling.

The Aquaflux theme demonstrates the intended model:

* `theme="aquaflux"` establishes color and typography tone
* standard HTML elements like `main`, `section`, `article`, `aside`, `nav`, `header`, and `footer` can be themed directly
* headings and general text are styled at the theme level
* theme-specific surface attributes like `aqua-card` and `aqua-hero` now exist

This means the roadmap no longer needs to treat themes as purely conceptual. Theming is now an active design layer in Juice.

### 2. Surface Work Has Started

Juice now has the beginning of a surface language.

The current first example is:

* `surfaceTone="soft"`

That is important because it confirms the intended split:

* Juice controls layout, spacing, and reusable visual utilities
* themes and component attributes can define more opinionated surface patterns

The surface system is still early, but it is no longer hypothetical.

### 3. Typography Has Expanded

Typography is noticeably further along than before.

Juice now includes:

* semantic text size attributes
* `lineHeight`
* `fontWeight`
* broader font imports and selector mapping
* improved font loading with Google font `@import` usage instead of invalid remote `@font-face` definitions

Typography is still not complete, but it has moved from “thin support” into “usable system layer.”

### 4. Numeric Sizing Is Better

Sizing support is stronger than it was previously.

Juice now supports more practical fractional values like:

* `1.25rem`
* `1.75rem`

This improves real-world authoring for:

* width
* height
* gap
* padding
* margin

That reduces friction and makes the utility system feel more credible for production work.

### 5. Gradient Architecture Is Getting Cleaner

The gradient system is becoming more structurally consistent.

Blue gradient work helped confirm a better split:

* tokens define design data
* styles emit the actual selectors

That better matches the broader Juice architecture and should be repeated across other token groups where needed.

### 6. Templates Are Now a Real Test Bed

Juice now has enough template work to meaningfully stress-test its aesthetic range.

Current templates show that Juice can reach several different visual directions:

* SaaS
* retail
* pizza delivery
* social feed
* spa / themed marketing
* hosting dashboard

This is important because templates are now exposing where Juice is strong and where it still breaks down.

### 7. Browser Runtime Work Has Started

Juice is no longer CSS-only.

The built-in navigation runtime shows that Juice can support framework-agnostic browser behavior that:

* runs automatically
* works with raw HTML, server-rendered markup, and reactive environments
* aligns with Juice markup conventions

That is a meaningful step forward, even though the runtime layer is still young.

---

## What Is Still Holding Juice Back

### 1. Components Are Not Mature Yet

Juice now exports components, but the component layer is not yet strong enough to be considered stable.

The Accordion work showed the current weak points:

* reactive attribute mapping only recently improved
* component authoring patterns are still settling
* prop contracts for styling internal parts are still being figured out
* the exported component surface is ahead of the component quality

This means Juice can expose components, but it is not yet a polished component library.

### 2. The Icon Contract Is Still Settling

Icons work, but the public authoring contract still feels transitional.

The system has been moving from mixed class-based patterns toward a more native attribute-driven contract.

What still needs clarification:

* canonical sizing pattern
* canonical coloring pattern
* alignment expectations for icon + text composition
* which icon attributes are first-class and which are legacy carryover

This is now better than before, but it still needs formalization.

### 3. Semantic Elements Carry Too Much Layout Assumption

This is one of the most important findings from recent template work.

In Juice today, elements like `section` are not neutral semantic elements. They carry built-in layout behavior.

That created a real issue in the Facebook-style template:

* the feed needed to be a `stack`
* using `section` caused it to behave like a wrapping responsive container
* the layout only became correct when the feed container was switched to a stacked element

This reveals a framework-level problem:

* some semantic HTML elements currently carry layout opinions that are too aggressive

That should be revisited because it can produce surprising behavior and makes certain layouts harder than they need to be.

### 4. Surface Language Is Still Early

Juice now has the beginning of surface utilities, but not yet a full surface system.

What is still missing:

* more surface tones
* stronger border semantics
* better depth/shadow language
* clearer glass / overlay / tint patterns
* more ready-made component surface attributes

Right now, authors still need to hand-assemble too much of the visual character for cards, panels, and heroes.

### 5. Templates Still Expose Proportional Weaknesses

Juice can now express many aesthetics, but dense layouts still reveal weaknesses in:

* column math
* containment
* layout semantics
* app-style shell composition

The Facebook-style work was useful because it showed:

* Juice can produce the pieces
* but getting a highly recognizable, dense application layout still takes careful manual correction

That is not failure, but it does show where the system still needs refinement.

---

## Revised Status

If Juice is viewed as a full UI system, its current maturity looks roughly like this:

* Layout and spacing system: strong
* Tokens and visual primitives: solid early platform
* Themes: emerging and credible
* Surface model: early but real
* Templates as design proofs: strong and useful
* Browser runtime behavior: promising
* Components: early and uneven
* Production-ready system cohesion: not there yet, but clearly taking shape

In practical terms:

* Juice already feels like a real design system direction
* Juice does not yet feel like a fully stable, polished UI framework

That is still very good progress.

---

## Revised Priorities

### Priority 1. Stabilize Semantic Layout Rules

Before adding too many more patterns, Juice should revisit where layout behavior lives.

This especially applies to:

* `section`
* other standard semantic HTML elements

The goal should be:

* semantic tags should not unexpectedly fight explicit layout primitives like `stack` and `row`

This is now a top priority because recent template work exposed it as a real usability problem.

### Priority 2. Expand the Surface System

Juice should build out the surface model that has already started.

Recommended next additions:

* more `surfaceTone` variants
* `borderStrength`
* `variant`
* `blur`
* more component-style surface attrs like `card-large`, `card-muted`, `hero-panel`

This would make templates feel far more polished with less manual assembly.

### Priority 3. Formalize the Theme Contract

Themes are now real enough that they need a clearer contract.

A first-class theme system should define:

* typography choices
* semantic text colors
* semantic surface colors
* hero/card/panel variants
* element-level defaults for headings, text, sections, forms, and nav

Aquaflux is the first real example, but the system should become easier to repeat and document.

### Priority 4. Finish the Typography Layer

Typography is in a much better place, but it still needs more systemization.

Likely next steps:

* clearer font-size contract
* more complete display/body hierarchy patterns
* better naming consistency for type utilities
* better documentation for font families and usage rules

Typography is no longer a weak point, but it still has room to become more deliberate.

### Priority 5. Stabilize the Icon Contract

Juice should settle on one canonical icon authoring model.

The likely direction is:

* attribute-first
* no dependency on template-local icon sizing classes
* clear rules for size, color, alignment, and library selection

This will help templates and components feel more native to Juice.

### Priority 6. Strengthen the Runtime and Component Layer

The browser behavior layer should keep growing, but carefully.

Short-term focus:

* stabilize navigation behavior
* improve component authoring patterns
* make reactive attribute usage more predictable
* ensure exported components are actually ready before treating them as first-class

Juice should avoid pretending the component layer is more mature than it is.

### Priority 7. Keep Using Templates as Stress Tests

Template work is now one of the most valuable tools in Juice development.

Templates should continue to be used to test:

* dense app shells
* marketing sites
* retail/product merchandising
* themed experiences
* social layouts

Templates are currently doing a better job than abstract planning at revealing what Juice still needs.

---

## Recommended Build Order

1. Revisit semantic element layout behavior, especially `section`.
2. Expand `surfaceTone` and related surface utilities.
3. Formalize the theme contract using Aquaflux as the reference pattern.
4. Tighten typography and naming consistency.
5. Stabilize the icon API.
6. Improve runtime/component maturity.
7. Continue template-driven stress testing after each improvement.

---

## Summary

Juice is in a meaningfully stronger place than it was before.

It now has:

* a credible layout and spacing identity
* better typography support
* cleaner token/style separation in important areas
* a real theme example
* the beginning of a surface language
* a browser runtime direction
* a growing template library that exposes real strengths and weaknesses

The next stage is not inventing Juice from scratch anymore.

The next stage is refinement:

* make layout semantics safer
* make surface language richer
* formalize themes
* settle icons
* stabilize components and runtime behavior

That is a strong place to be.
