# Juice Theme Manual

## Purpose

This is the practical manual for creating or maintaining a Juice theme contract.

Use it when you are:

- creating a new brand theme
- migrating a product from ad hoc CSS into a Juice-compatible theme
- deciding what belongs in the theme config versus app selectors

## The rule to protect

Themes define identity.

Juice defines structure.

If a theme starts replacing layout primitives, it is leaving its layer.

## What a theme must decide

Every real Juice theme should decide:

### 1. Identity

- `id`
- `name`
- optional `summary`
- the page types or brands it serves

### 2. Typography

- body font
- heading font
- optional additional role fonts through `typography.variants`

### 3. Palette

- page colors
- text colors
- accent colors
- surface colors

### 4. Surface language

- what the default page feels like
- what the panel tone is
- what the high-contrast hero tone is
- how strong borders and shadows should feel

### 5. Named surfaces

- what branded surface recipes need first-class names
- which ones should be exposed through `surface="..."`

## The current file shapes

### Library-owned theme

```text
libraries/juice/src/themes/my-theme/
```

### App-owned theme

```text
apps/my-app/juice.theme.yaml
apps/my-app/src/generated/my-theme.css
apps/my-app/src/generated/my-theme.yaml
```

App-owned themes are now a normal, recommended use case.

## Preferred authoring flow

### 1. Write the app or library theme config

Start with:

```yaml
id: my-theme
name: My Theme

typography:
  body:
    family: '"noto-sans"'
    fallback: sans-serif
  heading:
    family: '"citrus-gothic"'
    fallback: sans-serif

palette:
  page:
    background: "#f7f4ef"
  text:
    default: "#1c1a19"
    muted: "#6d665f"
    heading: "#1c1a19"
  accents:
    primary: "#ff7716"
  surfaces:
    default: "#fffdf8"
    border: "rgba(28, 26, 25, 0.12)"
```

### 2. Add optional variants only when they have a real role

Example:

```yaml
typography:
  variants:
    body_condensed:
      family: '"noto-sans-condensed"'
      fallback: sans-serif
    display_shadow:
      family: '"citrus-gothic-shadow"'
      fallback: sans-serif
```

Do not create font variants just because the family exists. Create them because the product has real UI roles for them.

### 3. Add named surfaces only when they have a clear job

Example:

```yaml
named_surfaces:
  - name: brand-stage
    purpose: Loud marquee surface for hero and publishing sections.
  - name: brand-panel
    purpose: Quiet support surface for notes, metadata, and sidebars.
```

If you cannot describe the purpose in one sentence, the surface is probably too vague.

### 4. Generate the artifacts

```bash
yarn workspace @citrusworx/juiceui generate:themes \
  --config ../../apps/my-app/juice.theme.yaml \
  --css-out ../../apps/my-app/src/generated/my-theme.css \
  --yaml-out ../../apps/my-app/src/generated/my-theme.yaml
```

### 5. Import the generated CSS in the app

```ts
import "@citrusworx/juiceui/styles";
import "./generated/my-theme.css";
```

### 6. Apply the theme at the app root

```html
<body theme="my-theme">
```

## What belongs in the theme

Put these in the theme:

- brand palette
- body and heading font choices
- optional font-role variables
- semantic defaults
- default control tone
- named surfaces

## What does not belong in the theme

Do not put these in the theme:

- page-specific layout decisions
- one-off campaign layout hacks
- app routing behavior
- state or interactivity
- product-specific selectors that are only meaningful in one app

Those belong in app code or app CSS.

## Relationship to app CSS

The current best practice is hybrid:

- Juice attributes for structure
- theme CSS for identity
- app CSS for product-specific art direction

This is not a failure of Juice. It is the intended layering model.

## Practical checklist

Before calling a theme "done," verify:

- the root `theme="..."` contract is clear
- the palette is coherent
- body and heading fonts are defined
- optional font variants have real jobs
- named surfaces are distinct and useful
- semantic elements feel intentional
- the theme still leaves Juice layout visible
- the app does not need to fight the theme to compose normal pages

## Blackwater Sound as current reference

Blackwater Sound is the strongest current example of the modern theme model:

- app-owned config
- generated CSS and YAML
- explicit font-role variants
- named surfaces
- hybrid app styling on top of Juice attributes

Use that shape as the reference direction for product themes.
