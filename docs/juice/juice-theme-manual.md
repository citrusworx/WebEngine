# Juice Theme Manual

## Purpose

This document is the practical manual for designing and authoring themes in Juice.

Use it when creating:

* a brand-new theme
* a variation of an existing theme
* a theme contract for a vertical like retail, hospitality, editorial, or wellness

This is not a layout guide.

Themes in Juice do not replace:

* `row`
* `stack`
* `gap`
* `padding`
* `container`
* `content`
* built-in responsiveness

Themes define identity.

Juice defines structure.

---

## What A Theme Must Decide

Before you write any SCSS, choose the theme’s identity deliberately.

Every Juice theme should decide these things.

### 1. Theme Name

Choose:

* theme id
* display name
* selector name

Example:

* id: `aquaflux`
* display name: `Aquaflux`
* selector: `theme="aquaflux"`

This name should be:

* memorable
* reusable
* descriptive of the visual direction

---

### 2. Brand Tone

Choose the emotional/design tone of the theme.

Examples:

* serene
* luxurious
* editorial
* clinical
* playful
* technical
* energetic
* understated

This matters because typography, contrast, and surface style should all reinforce that tone.

Write the tone down in one sentence.

Example:

> Aquaflux is a serene, premium hospitality theme built around luminous water-toned surfaces.

---

### 3. Intended Use Cases

Decide what kinds of pages or products the theme is for.

Examples:

* spas
* bathhouses
* medspas
* recovery studios
* dashboards
* product marketing pages
* e-commerce storefronts

A theme should not try to be for everything.

---

### 4. Typography Pairing

Choose:

* body font
* heading/display font

You should also decide:

* body voice: calm, readable, dense, airy, technical, editorial
* heading voice: bold, elegant, playful, austere, commanding

Recommended rule:

* one body font
* one display font

This is usually enough.

---

### 5. Color Strategy

Choose these categories explicitly.

#### Page colors

* page base
* page tint
* optional page deep tone

#### Text colors

* default text
* muted text
* heading text

#### Accent colors

* primary accent
* secondary accent
* optional soft accent
* optional highlight

#### Surface colors

* default surface
* strong surface
* muted surface
* optional deep surface

Do not choose random colors one block at a time.

Choose a system.

---

### 6. Surface Language

Decide how the theme’s surfaces should feel.

Examples:

* translucent
* frosted
* matte
* editorial paper
* dark glass
* soft neutral panels
* bright retail cards

This affects:

* border treatment
* surface opacity
* shadow softness
* default card behavior
* hero treatment

---

### 7. Semantic Element Defaults

Choose how these elements should feel by default:

* `section`
* `article`
* `aside`
* `nav`
* `header`
* `footer`
* `form`

Also choose what should stay mostly untouched:

* `div`
* `main`

Recommended default:

* semantic elements get theme surfaces
* `div` stays transparent so Juice composition stays flexible

---

### 8. Control Tone

Choose how controls should look:

* buttons
* inputs
* selects
* textareas

You should decide:

* are buttons loud or quiet?
* are inputs neutral or brand-tinted?
* how strong should focus states be?

---

### 9. Named Surfaces

Every real Juice theme should define at least two or three named surfaces.

Examples:

* `aqua-card`
* `aqua-panel`
* `aqua-hero`

These surfaces are the theme’s authored components at the attribute level.

They should each have a clear job.

Example roles:

* card: elevated content module
* panel: softer supporting block
* hero: strongest marquee surface

---

## Required Files

Every full Juice theme should have:

```text
src/themes/
  your-theme/
    your-theme.scss
    your-theme.yaml
```

### `your-theme.scss`

This is the implementation file.

It should contain:

1. imports for the tokens it needs
2. root theme selector
3. custom properties
4. semantic defaults
5. typography hierarchy
6. control styling
7. named surfaces

### `your-theme.yaml`

This is the contract and metadata file.

It should contain:

* id
* name
* selector
* summary
* philosophy
* typography choices
* palette intent
* semantic defaults summary
* named surfaces
* use cases
* authoring rules
* example usage

---

## Theme SCSS Writing Order

Write the SCSS in this order.

### 1. Token Imports

Import only the token families the theme needs.

Example:

```scss
@use '../../tokens/color/blue/blue.scss' as *;
@use '../../tokens/color/purple/purple.scss' as *;
@use '../../tokens/color/white/white.scss' as *;
```

Do not start styling before the token sources are clear.

---

### 2. Theme Comment Header

Add a short comment explaining:

* what the theme is
* what it owns
* what Juice still owns

This helps future theme authors stay disciplined.

---

### 3. Root Theme Selector

Start with:

```scss
[theme="your-theme"] {
  ...
}
```

Inside this selector:

* define custom properties
* define background identity
* set the base text color
* set the base font family

Recommended property groups:

* foundation
* typography
* accents
* surfaces

---

### 4. Theme Root Behavior

Add the rules that keep composition clean.

Typical patterns:

* `main` inherits and stays transparent
* `div` stays transparent

Example:

```scss
[theme="your-theme"] :where(main) {
  background: transparent;
  color: inherit;
}

[theme="your-theme"] :where(div) {
  background-color: transparent;
  color: inherit;
}
```

This prevents the theme from overreaching into layout wrappers.

---

### 5. Semantic Element Defaults

Style the semantic HTML5 elements that should feel themed by default.

Example:

```scss
[theme="your-theme"] :where(section, article, aside, nav, header, footer, form) {
  ...
}
```

This is where you define:

* default background
* border tone
* default shadow
* default surface atmosphere

These defaults should support the theme, not replace component-level authored surfaces.

---

### 6. Typography Hierarchy

Set rules for:

* headings
* body text
* small text
* strong text
* links

At minimum, define:

* heading color
* heading font family
* body text color
* muted text color
* link behavior

---

### 7. Controls

Style:

* buttons
* inputs
* selects
* textareas

Also include:

* placeholder color
* focus-visible behavior
* button hover/focus tone

This is how the theme becomes usable in forms and application screens, not just hero sections.

---

### 8. Named Surfaces

Now define theme-specific surface selectors.

Example:

```scss
[theme="your-theme"] [my-card] {
  ...
}

[theme="your-theme"] [my-panel] {
  ...
}

[theme="your-theme"] [my-hero] {
  ...
}
```

Each surface should have:

* a clear role
* a distinct contrast level
* a relationship to the overall theme

If all named surfaces look the same, the theme is underdeveloped.

---

## SCSS Walkthrough

This section explains what the theme SCSS is doing in actual code terms.

Use Aquaflux as the reference model.

### Step 1: Import only the token families you need

Example:

```scss
@use '../../tokens/color/blue/blue.scss' as *;
@use '../../tokens/color/purple/purple.scss' as *;
@use '../../tokens/color/white/white.scss' as *;
```

Why:

* a theme should be built from Juice tokens
* these imports are the raw color or token sources the theme is allowed to use
* if the theme needs blue, purple, and white, import those families directly

Do not start by hardcoding random hex values everywhere.

---

### Step 2: Define the root theme selector

Example:

```scss
[theme="aquaflux"] {
  ...
}
```

This is the core activation point.

When someone writes:

```html
<body theme="aquaflux">
```

every rule in the theme should derive from that root selector.

---

### Step 3: Create custom properties inside the root

Example:

```scss
[theme="aquaflux"] {
  --aqua-page: #{$white-100};
  --aqua-text: #{$blue-800};
  --aqua-heading: #{$blue-900};
  --aqua-body-font: "Lato", sans-serif;
  --aqua-heading-font: "Archivo Black", sans-serif;
}
```

Why:

* custom properties make the theme easier to reason about
* they separate theme decisions from selector rules
* later selectors can reuse the same property system consistently

Recommended property groups:

* foundation
* typography
* accents
* surfaces

Example structure:

```scss
[theme="your-theme"] {
  /* Foundation */
  --theme-page: ...;
  --theme-surface: ...;
  --theme-border: ...;

  /* Typography */
  --theme-text: ...;
  --theme-heading: ...;
  --theme-body-font: ...;
  --theme-heading-font: ...;

  /* Accents */
  --theme-accent: ...;
  --theme-accent-strong: ...;

  /* Surface recipes */
  --theme-card-background: ...;
  --theme-hero-background: ...;
}
```

This is the preferred writing order.

---

### Step 4: Apply page-level identity

Inside the root theme selector, set:

* page background color
* page background image if needed
* base text color
* base font family

Example:

```scss
[theme="aquaflux"] {
  background-color: var(--aqua-page);
  background-image: var(--aqua-page-background);
  color: var(--aqua-text);
  font-family: var(--aqua-body-font);
}
```

This gives the theme a visible identity the moment it is applied.

---

### Step 5: Keep generic layout wrappers clean

Example:

```scss
[theme="aquaflux"] :where(main) {
  background: transparent;
  color: inherit;
}

[theme="aquaflux"] :where(div) {
  background-color: transparent;
  color: inherit;
}
```

Why:

* `main` should not fight the page background
* `div` is primarily a Juice composition wrapper
* if every `div` becomes a card, the theme will be unusable

This rule is one of the most important parts of good theme authoring.

---

### Step 6: Style semantic elements by default

Example:

```scss
[theme="aquaflux"] :where(section, article, aside, nav, header, footer, form) {
  background-color: var(--aqua-surface);
  color: var(--aqua-text);
  border: 1px solid var(--aqua-border);
  box-shadow: 0 24px 60px -36px var(--aqua-shadow);
  backdrop-filter: blur(14px);
}
```

This gives the theme a base surface language.

It answers:

* what should semantic containers feel like by default?

Do not use this layer to create special-purpose components.

This layer is only the default surface behavior.

---

### Step 7: Add targeted semantic exceptions only when needed

Example:

```scss
[theme="aquaflux"] :where(nav[type="bar"], nav[type="sidebar"]) {
  background-color: var(--aqua-surface-strong);
}
```

Why:

* sometimes a semantic subtype needs a slightly different tone
* navigation bars may need stronger contrast than generic sections

This is appropriate.

What is not appropriate:

* redefining layout behavior
* turning semantic rules into a component system

---

### Step 8: Define the typography hierarchy

Example:

```scss
[theme="aquaflux"] :where(h1, h2, h3, h4, h5, h6) {
  color: var(--aqua-heading);
  font-family: var(--aqua-heading-font);
  font-weight: 900;
  letter-spacing: -0.03em;
  line-height: 0.95;
}
```

Then define:

* body text
* muted text
* strong text
* links

Example:

```scss
[theme="aquaflux"] :where(p, span, li, label, dt, dd, blockquote) {
  color: var(--aqua-text);
  font-family: var(--aqua-body-font);
}

[theme="aquaflux"] :where(small, figcaption) {
  color: var(--aqua-text-muted);
}
```

This is where the page’s reading voice comes from.

---

### Step 9: Style controls

Example:

```scss
[theme="aquaflux"] :where(button, input, textarea, select) {
  background-color: var(--aqua-surface-strong);
  color: var(--aqua-text);
  border: 1px solid var(--aqua-border-strong);
  font-family: var(--aqua-body-font);
}
```

Then add:

* button-specific behavior
* placeholders
* focus-visible states

Example:

```scss
[theme="aquaflux"] :where(button) {
  background-image: var(--aqua-button-background);
  color: white;
}

[theme="aquaflux"] :where(input:focus-visible, textarea:focus-visible, select:focus-visible) {
  outline: 2px solid rgba(...);
}
```

This is where the theme becomes usable for forms and app UI.

---

### Step 10: Write named surfaces

Example:

```scss
[theme="aquaflux"] [aqua-card] {
  background: var(--aqua-card-background);
  border: 1px solid var(--aqua-border-strong);
}

[theme="aquaflux"] [aqua-panel] {
  background: var(--aqua-panel-background);
}

[theme="aquaflux"] [aqua-hero] {
  background: var(--aqua-hero-background);
  color: white;
}
```

Each named surface should answer:

* what is this surface for?
* how does it differ from the default semantic surface?

For Aquaflux:

* `aqua-card` = elevated content module
* `aqua-panel` = quieter supporting panel
* `aqua-hero` = strongest marquee surface

This is the point where the theme stops being a skin and becomes a usable authored system.

---

## Theme YAML Writing Order

Write the metadata file in this order.

### 1. Identity

Include:

* id
* name
* selector
* version
* summary

### 2. Philosophy

State:

* what the theme is for
* what it owns
* what it does not own

### 3. Typography

Document:

* body font
* heading font
* tone of each

### 4. Palette

Document:

* page colors
* text colors
* accents
* surface categories

### 5. Semantic Defaults

Document:

* what semantic elements get default surfaces
* how `div` behaves
* how `main` behaves

### 6. Named Surfaces

For each surface, define:

* name
* purpose

### 7. Use Cases

List:

* page or product categories this theme is suited for

### 8. Authoring Rules

Examples:

* Use semantic HTML first.
* Let Juice handle layout and responsiveness.
* Use the hero surface sparingly.
* Keep accent usage restrained.

### 9. Example

Include simple example strings like:

```yaml
example:
  root: '<body theme="aquaflux">'
  surfaces:
    - '<section aqua-hero>...</section>'
    - '<article aqua-card>...</article>'
```

---

## YAML Walkthrough

This section explains how to actually write the theme YAML and what each block means.

The YAML file is not there just for decoration.

It is the theme contract.

It should make the theme understandable without reading the SCSS first.

### Step 1: Write the identity block

Example:

```yaml
id: aquaflux
name: Aquaflux
selector: theme="aquaflux"
version: 1
summary: Calm hospitality and wellness theme built around luminous water-toned surfaces.
```

What each line means:

* `id`
  the theme’s machine-friendly identifier
* `name`
  the human-readable name
* `selector`
  the actual Juice selector authors use
* `version`
  the current theme contract version
* `summary`
  a one-sentence statement of the theme’s role

This block should be short and unambiguous.

---

### Step 2: Write the philosophy block

Example:

```yaml
philosophy:
  role: "Identity layer for serene, premium, restorative interfaces."
  owns:
    - typography tone
    - color relationships
    - semantic element defaults
    - named themed surfaces
  does_not_own:
    - layout
    - spacing
    - row and stack behavior
    - container and content framing
```

This block defines the boundaries of the theme.

Why this matters:

* it keeps later theme authors disciplined
* it makes it clear that the theme should not become a layout engine

Every real Juice theme should say what it owns and what it does not own.

---

### Step 3: Write the typography block

Example:

```yaml
typography:
  body:
    family: Lato
    fallback: sans-serif
    tone: calm, readable, hospitality-first
  heading:
    family: Archivo Black
    fallback: sans-serif
    tone: bold, upscale, editorial
```

This block answers:

* what fonts are used?
* what is the job of each font?

Do not just list names.

Include tone descriptions.

That makes the theme reusable and explainable.

---

### Step 4: Write the palette block

Example:

```yaml
palette:
  page:
    base: white-100
    tint: blue-100
    deep: blue-900
  text:
    default: blue-800
    muted: blue-600
    heading: blue-900
  accents:
    primary: blue-500
    secondary: purple-700
    soft: purple-300
    highlight: blue-200
  surfaces:
    default: white-100 / blue-100 translucent blend
    strong: white-100 elevated surface
    muted: blue-100 softened panel
    hero: blue-900 to purple-700 atmospheric gradient
```

This block is not meant to be a dump of every token value.

It is meant to describe the palette system the theme is built around.

That means:

* page colors
* text colors
* accents
* surface categories

Use token names where possible.

Use descriptive summaries for surface recipes.

---

### Step 5: Write the semantic defaults block

Example:

```yaml
semantic_elements:
  default_surface_targets:
    - section
    - article
    - aside
    - nav
    - header
    - footer
    - form
  div_behavior: transparent by default
  main_behavior: transparent by default
```

This block tells theme authors and consumers:

* which semantic elements receive the theme’s default surface behavior
* how generic wrappers behave

This is important because Juice separates:

* semantic structure
* visual composition

The YAML should make that explicit.

---

### Step 6: Write the named surfaces block

Example:

```yaml
named_surfaces:
  - name: aqua-card
    purpose: Elevated content card for treatments, pricing, and hospitality modules.
  - name: aqua-panel
    purpose: Softer supporting panel for quieter informational blocks.
  - name: aqua-hero
    purpose: High-contrast marquee surface for hero and lead sections.
```

This block explains the authored theme surfaces.

Every named surface should have:

* a clear name
* a clear purpose

If you cannot describe the purpose in one sentence, the surface probably is not distinct enough.

---

### Step 7: Write the use cases block

Example:

```yaml
recommended_use_cases:
  - spas
  - bathhouses
  - medspas
  - recovery studios
  - boutique hospitality brands
  - serene wellness product sites
```

This tells people where the theme belongs.

It prevents the theme from feeling generic.

---

### Step 8: Write the authoring rules block

Example:

```yaml
authoring_rules:
  - Use semantic HTML for meaning first.
  - Let Juice layout primitives handle structure and responsiveness.
  - Use aqua-card and aqua-panel for supporting surfaces.
  - Use aqua-hero sparingly for the strongest section on the page.
  - Keep accent colors restrained and let surface contrast create hierarchy.
```

This is the usage guidance for the theme.

It tells someone:

* how to use the theme well
* what to avoid

Every theme should have a small set of these rules.

---

### Step 9: Write the example block

Example:

```yaml
example:
  root: '<body theme="aquaflux">'
  surfaces:
    - '<section aqua-hero>...</section>'
    - '<article aqua-card>...</article>'
    - '<aside aqua-panel>...</aside>'
```

This is not the full template.

It is just a minimal usage sketch.

That is enough to show:

* how the root selector is applied
* how the named surfaces are meant to be used

---

## How SCSS And YAML Relate

The SCSS and YAML files should mirror each other.

If the SCSS defines:

* body font
* heading font
* accent colors
* named surfaces

then the YAML should describe those same decisions.

Good relationship:

* SCSS = implementation
* YAML = contract

Bad relationship:

* SCSS contains the real theme
* YAML is outdated or decorative

The YAML must stay truthful to the actual SCSS behavior.

---

## Theme Checklist

Before you consider a theme done, confirm all of this:

* The theme has a clear name and identity.
* The tone is written down.
* The use cases are written down.
* The SCSS file defines custom properties first.
* Semantic elements are styled intentionally.
* `div` is not overloaded with theme surfaces.
* One body font and one heading font are chosen.
* Text, muted text, and heading colors are clear.
* Buttons and form controls are styled.
* At least two named surfaces exist.
* The theme has a YAML contract file.
* The theme still leaves Juice layout visible.

---

## What Not To Do

Avoid these mistakes.

* Do not turn the theme into a layout engine.
* Do not style every `div` like a card.
* Do not define random one-off colors without a palette system.
* Do not create named surfaces with no distinct role.
* Do not bury responsive behavior inside the theme.
* Do not make the theme so loud that all pages look the same.
* Do not skip the YAML contract.

---

## Minimal Starter Template

Use this as a blank pattern.

```scss
@use '../../tokens/color/blue/blue.scss' as *;
@use '../../tokens/color/white/white.scss' as *;

[theme="example"] {
  --example-page: #{$white-100};
  --example-text: #{$blue-800};
  --example-heading: #{$blue-900};
  --example-body-font: "Lato", sans-serif;
  --example-heading-font: "Archivo Black", sans-serif;

  background-color: var(--example-page);
  color: var(--example-text);
  font-family: var(--example-body-font);
}

[theme="example"] :where(main) {
  background: transparent;
  color: inherit;
}

[theme="example"] :where(div) {
  background-color: transparent;
  color: inherit;
}

[theme="example"] :where(section, article, aside, nav, header, footer, form) {
  background-color: rgba(255, 255, 255, 0.9);
}

[theme="example"] :where(h1, h2, h3, h4, h5, h6) {
  color: var(--example-heading);
  font-family: var(--example-heading-font);
}

[theme="example"] [example-card] {
  background: white;
}
```

---

## Reference Model

Use Aquaflux as the current reference for a complete Juice theme.

Files:

* `libraries/juice/src/themes/aquaflux/aquaflux.scss`
* `libraries/juice/src/themes/aquaflux/aquaflux.yaml`

That pair should be treated as the first complete example of how a Juice theme is designed.

---

## Summary

A Juice theme manual can be reduced to this sequence:

1. choose the identity
2. choose the typography
3. choose the palette
4. choose the semantic defaults
5. choose the control tone
6. choose the named surfaces
7. write the SCSS in layers
8. write the YAML contract
9. verify the theme still lets Juice own layout

That is the correct authoring process for themes in Juice.
