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

The canonical required-versus-optional list is the [Theme Contract](./juice-theme-contract.md). Use this manual for the authoring flow; use the contract for the bind checklist and theme × role-family matrix.

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

### 6. Chrome roles

Required `--juice-*` accordion, tabs, modal, drawer, toast, popover, tooltip, combobox, wizard, surface-tone, border-strength, shadow-tone, and overlay binds, plus optional Tide-style hooks, are listed in the [Theme Contract](./juice-theme-contract.md). Bind them from existing identity tokens. Do not invent a new hue family.

## The current file shapes

### Library-owned theme

```text
libraries/juice/src/themes/my-theme/
```

Shipped library themes today: `aquaflux`, `kiwipress`, `citrusmint`, and `tide`. Remaining drafts live under `src/themes/_draft/` (currently blush).

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
- accordion chrome role bindings (`--juice-accordion-*`)
- tabs chrome role bindings (`--juice-tabs-*`)
- modal chrome role bindings (`--juice-modal-*`)
- drawer chrome role bindings (`--juice-drawer-*`)
- toast chrome role bindings (`--juice-toast-*`)
- banner chrome role bindings (`--juice-banner-*`)
- popover chrome role bindings (`--juice-popover-*`)
- tooltip chrome role bindings (`--juice-tooltip-*`)
- combobox chrome role bindings (`--juice-combobox-*`)
- menu chrome role bindings (`--juice-menu-*`)
- switch chrome role bindings (`--juice-switch-*`)
- slider chrome role bindings (`--juice-slider-*`)
- checkbox chrome role bindings (`--juice-checkbox-*`)
- radio chrome role bindings (`--juice-radio-*`)
- breadcrumb chrome role bindings (`--juice-breadcrumb-*`)
- progress chrome role bindings (`--juice-progress-*`)
- wizard chrome role bindings (`--juice-wizard-*`)
- surface tone, border strength, shadow tone, and overlay role bindings (`--juice-surface-*`, `--juice-border-strength-*`, `--juice-shadow-tone-*`, `--juice-overlay-*`) — see the [Theme Contract](./juice-theme-contract.md). `variant` recipes consume those same roles; do not add a `--juice-variant-*` family. Modal chrome is a dialog scrim / panel / close contract, not `overlay="frost|tint"`. Drawer chrome is the same contract for an edge-docked panel (`[drawer]` / `[drawer="left"|"right"]`, optional `[drawer-size="sm|lg"]`), not `overlay="frost|tint"`. Toast chrome is a non-modal stack (`[toast-region]` / `[toast="success|error|info|warning"]`), not a dialog overlay and not `overlay="frost|tint"`. Banner chrome is an inline alert / callout (`[banner]` / `[banner="full"]`, optional `[banner-tone="info|success|warning|error"]`), not a toast stack and not `overlay="frost|tint"`. Popover chrome is an anchored floating panel (`[popover-root]` / `[popover-panel]`; never a bare `popover` attribute), not a modal dialog, drawer, toast, or `overlay="frost|tint"`. Tooltip chrome is a hover/focus tip (`[tooltip-root]` / `[tooltip-panel]`; not the native `title` attribute), not a popover, dialog, drawer, toast, or `overlay="frost|tint"`. Combobox chrome is an input + listbox popup (`[combobox]` / `[combobox-input]` / `[combobox-list]`; not a native `<select>` restyle), not a popover, tooltip, dialog, or `overlay="frost|tint"`. Menu chrome is an APG menu button (`[menu-root]` / `[menu]` / `[menuitem]`; boolean `[menu]` attr, not the HTML `<menu>` element), not a popover, combobox, native `<select>`, or `overlay="frost|tint"`. Switch chrome is an APG switch (`[switch]` on a button host; `aria-checked="true"` for on), not a form checkbox, menuitemcheckbox, native checkbox restyle as the only story, or `overlay="frost|tint"`. Checkbox chrome is a binary APG checkbox (`[checkbox]` on a button host; `aria-checked="true"` for checked; native `<input type="checkbox" checkbox>` is allowed), not a switch, menuitemcheckbox, tri-state, or `overlay="frost|tint"`. The checkbox runtime auto-enhances that markup (binary toggle) — see [Checkbox Runtime](./juice-checkbox-runtime.md). Radio chrome is an APG radio (`[radio]` inside `[radiogroup]`; `aria-checked="true"` for the selected option; native `<input type="radio" radio>` is allowed), not a switch, checkbox, or `overlay="frost|tint"`. `[radiogroup]` is layout only — no `--juice-radiogroup-*`. The radio runtime auto-enhances exclusive keyboard inside `[radiogroup]` — see [Radio Runtime](./juice-radio-runtime.md). Breadcrumb chrome is an APG-inspired trail (`[breadcrumb]` on `<nav>` or `<ol>`, `[breadcrumb-item]`, optional `[breadcrumb-link]`), not site nav, `nav[type="breadcrumb"]`, tabs, a wizard step tracker, or pagination. Current page is `aria-current="page"` inside the trail. `surface` stays `transparent` unless crumbs sit on a bar. The breadcrumb runtime auto-enhances that markup (`sync` / `setCurrent`, a single `aria-current="page"`, light landmark labeling) — see [Breadcrumb Runtime](./juice-breadcrumb-runtime.md). Progress chrome is an APG-inspired progressbar (`[progress]` track host + `[progress-fill]`; `progress="indeterminate"` animates the fill; integer `aria-valuenow` 0–100 paints determinate width), not a slider, not a spinner, and not a native `<progress>` restyle as the only story. Authors write `<div progress>`, not the HTML `<progress>` element alone. The progress runtime auto-enhances `[progress]` (`setValue` / `setIndeterminate`; `aria-valuenow` is omitted while indeterminate) — see [Progress Runtime](./juice-progress-runtime.md). Slider chrome is an APG slider (`[slider]` track host + `[slider-thumb]`; horizontal only; integer `aria-valuenow` 0–100 paints the fill), not a native `<input type="range">` restyle as the only story, a progress meter, a scrollbar, or `overlay="frost|tint"`. Wizard chrome is a multi-step onboarding shell (`[wizard-shell]` / `[step="pending"|"active"|"completed"]`), not a dialog overlay, toast stack, or `overlay="frost|tint"`. Closed vs open uses native `hidden`; the dialog runtimes auto-enhance valid modal and drawer markup — see [Modal Runtime](./juice-modal-runtime.md) and [Drawer Runtime](./juice-drawer-runtime.md). Toast runtime auto-enhances `[toast-region]` markup the same way — see [Toast Runtime](./juice-toast-runtime.md). Banner runtime auto-enhances `[banner]` markup the same way — see [Banner Runtime](./juice-banner-runtime.md). Popover runtime auto-enhances `[popover-root]` markup the same way — see [Popover Runtime](./juice-popover-runtime.md). Wizard runtime auto-enhances `[wizard-shell]` markup the same way — see [Wizard Runtime](./juice-wizard-runtime.md). Tooltip runtime auto-enhances `[tooltip-root]` markup the same way — see [Tooltip Runtime](./juice-tooltip-runtime.md). Combobox runtime auto-enhances `[combobox]` markup the same way — see [Combobox Runtime](./juice-combobox-runtime.md). Menu runtime auto-enhances `[menu-root]` markup the same way — see [Menu Runtime](./juice-menu-runtime.md). Switch runtime auto-enhances `[switch]` markup the same way — see [Switch Runtime](./juice-switch-runtime.md). Slider runtime auto-enhances `[slider]` markup the same way — see [Slider Runtime](./juice-slider-runtime.md). Checkbox runtime auto-enhances `[checkbox]` markup the same way — see [Checkbox Runtime](./juice-checkbox-runtime.md). Radio runtime auto-enhances `[radiogroup]` markup the same way — see [Radio Runtime](./juice-radio-runtime.md). Breadcrumb runtime auto-enhances `[breadcrumb]` markup the same way — see [Breadcrumb Runtime](./juice-breadcrumb-runtime.md). Progress runtime auto-enhances `[progress]` markup the same way — see [Progress Runtime](./juice-progress-runtime.md).

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

Before calling a theme "done," walk the numbered list in the [Theme Contract](./juice-theme-contract.md). In short:

- the root `theme="..."` contract is clear
- the palette is coherent
- body and heading fonts are defined
- every required `--juice-*` family is bound on `[theme="..."]`
- optional accordion/tabs hooks are bound only when the chrome needs them
- standalone `blur="sm|md"` is left to core
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
