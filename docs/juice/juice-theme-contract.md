# Juice Theme Contract

Canonical required-versus-optional checklist for Juice themes.

[Theme authoring](./juice-theme-authoring.md) and the [theme manual](./juice-theme-manual.md) keep how-to detail. This page is the list those docs point at. It documents what already ships after Tide, surface language A–C (`surfaceTone`, `borderStrength`, standalone `blur`), remaining depth slices A–C (`shadowTone`, `overlay`, `variant`), modal theme chrome (`--juice-modal-*`), drawer theme chrome (`--juice-drawer-*`), toast theme chrome (`--juice-toast-*`), banner theme chrome (`--juice-banner-*`), popover theme chrome (`--juice-popover-*`), tooltip theme chrome (`--juice-tooltip-*`), combobox theme chrome (`--juice-combobox-*`), menu theme chrome (`--juice-menu-*`), switch theme chrome (`--juice-switch-*`), slider theme chrome (`--juice-slider-*`), checkbox theme chrome (`--juice-checkbox-*`), radio theme chrome (`--juice-radio-*`), breadcrumb theme chrome (`--juice-breadcrumb-*`), progress theme chrome (`--juice-progress-*`), and wizard theme chrome (`--juice-wizard-*`). `libraries/juice/src/juice.theme-contract.test.ts` is the machine check. Dialog behavior is documented in [Modal Runtime](./juice-modal-runtime.md) and [Drawer Runtime](./juice-drawer-runtime.md). Toast is a non-modal stack runtime on `[toast-region]` — see [Toast Runtime](./juice-toast-runtime.md). Banner is an inline alert / callout runtime on `[banner]` — see [Banner Runtime](./juice-banner-runtime.md). Popover is an anchored non-modal dialog runtime on `[popover-root]` — see [Popover Runtime](./juice-popover-runtime.md). Tooltip is a hover/focus tip runtime on `[tooltip-root]` — see [Tooltip Runtime](./juice-tooltip-runtime.md). Combobox is an input + listbox popup runtime on `[combobox]` — see [Combobox Runtime](./juice-combobox-runtime.md). Menu is an APG menu-button runtime on `[menu-root]` / `[menu]` — see [Menu Runtime](./juice-menu-runtime.md). Switch is an APG switch runtime on `[switch]` — see [Switch Runtime](./juice-switch-runtime.md). Slider is an APG slider runtime on `[slider]` / `[slider-thumb]` — see [Slider Runtime](./juice-slider-runtime.md). Checkbox is an APG checkbox runtime on `[checkbox]` — see [Checkbox Runtime](./juice-checkbox-runtime.md). Radio is an APG radio runtime on `[radio]` inside `[radiogroup]` — see [Radio Runtime](./juice-radio-runtime.md). Breadcrumb is a light trail runtime on `[breadcrumb]` — see [Breadcrumb Runtime](./juice-breadcrumb-runtime.md). Progress is an APG-inspired progressbar runtime on `[progress]` — see [Progress Runtime](./juice-progress-runtime.md). Wizard is a multi-step shell runtime on `[wizard-shell]` — see [Wizard Runtime](./juice-wizard-runtime.md).

## 1. Layer rule

Juice owns structure. Themes own identity.

A theme decides brand voice, type pair, page/text/accent/surface color, semantic defaults, named surfaces, and chrome paint. It does not redefine `stack`, `row`, `grid`, `gap`, padding, sizing primitives, or responsive layout. Authors consume the type pair through the [Typography Contract](./juice-typography-contract.md).

## 2. Shipped references

Treat these four library themes as equal references. Each lives at `libraries/juice/src/themes/<id>/` as `<id>.scss` + `<id>.yaml` and ships as `@citrusworx/juiceui/styles/themes/<id>`.

| id | Character | Identity prefix |
|---|---|---|
| `aquaflux` | light hospitality / wellness | `--aqua-*` |
| `kiwipress` | richest product / publishing reference | `--kw-*` |
| `citrusmint` | mint / citrus marketing | `--cm-*` |
| `tide` | dark product / SaaS, teal/lagoon | `--tide-*` |

**Blush** remains `_draft` (`src/themes/_draft/blush/`). It is YAML-only, unpublished, and not a reference for this contract. Package `exports` still block `@citrusworx/juiceui/themes/_draft/*`.

App-owned generated themes are a second, recommended source for product branding. They use the `--jx-*` prefix. See [Theme authoring](./juice-theme-authoring.md).

## 3. Required YAML / identity

Do not invent a second schema. The generator already has one: `ThemeGeneratorConfig` in `libraries/juice/src/tools/theme-generator/index.ts`. `normalizeConfig()` requires `id`, `name`, `typography`, and `palette`. Missing those fields fail generation.

Required shape (same as the authoring “Required config shape”):

```yaml
id: mytheme
name: My Theme
selector: theme="mytheme"   # optional in the generator; defaults to theme="<id>"

typography:
  body:
    family: '"noto-sans"'
    fallback: sans-serif
  heading:
    family: '"citrus-gothic"'
    fallback: sans-serif

palette:
  page:
    background: "#f4f0e8"
  text:
    default: "#211c1b"
    muted: "#6f6660"
    heading: "#211c1b"
  accents:
    primary: "#ff7716"
  surfaces:
    default: "#fffdf8"
    border: "rgba(33, 28, 27, 0.12)"
```

Minimum palette keys the generator reads:

| Group | Required | Optional extras the generator already accepts |
|---|---|---|
| `page` | `background` | `tint`, `deep` |
| `text` | `default`, `muted`, `heading` | `soft`, `inverse` |
| `accents` | `primary` | `primaryStrong`, `secondary`, `secondaryStrong`, `soft`, `tint`, `warm`, `warmSoft`, `warmTint` |
| `surfaces` | `default`, `border` | `muted`, `strong`, `deep`, `borderStrong`, `hero`, `cta`, `panel`, `shadow`, `shadowStrong` |

Optional config sections (not chrome roles): `selector`, `summary`, `philosophy`, `recommended_use_cases`, `authoring_rules`, `typography.variants`, `named_surfaces`, `version`, `example`.

**Named surfaces** are required only when the theme has a branded recipe that Juice primitives (`[hero]`, `[card]`, `[panel]`) should not invent a second layout system for. Aquaflux (`aqua-card` / `aqua-panel` / `aqua-hero`) and Tide (`tide-card` / `tide-panel`) ship them. KiwiPress paints Juice primitives instead. Citrusmint has none.

Library companion YAML (`<id>.yaml` next to `<id>.scss`) is an identity record, not always a generator input. Hand-authored library YAML may use token names and extra sections (`warm`, `semantic_elements`). The **enforceable** CSS contract is the `--juice-*` bind list below. New app-owned themes should follow the generator shape above.

## 4. Required `--juice-*` binds

Set every name in this section on `[theme="…"]` for every shipped library theme. Bind from existing identity tokens. Do not invent a new hue family for chrome. Accordion triggers, tab triggers, `[modal-close]`, `[drawer-close]`, `[toast-close]`, `[banner-close]`, `[popover-close]`, `[combobox-trigger]`, `[menu-button]`, `[switch]`, and `[slider-thumb]` stay surface/text controls, not the CTA button gradient. Breadcrumb links stay ink, not the CTA button gradient. Wizard step indicators stay surfaces the same way.

Core CSS reads `--juice-*`. Identity aliases (`--aqua-*`, `--kw-*`, `--cm-*`, `--tide-*`, `--jx-*`) are how themes name the same values.

### Accordion core

| Role | Job |
|---|---|
| `--juice-accordion-trigger` | idle trigger fill |
| `--juice-accordion-trigger-hover` | hover fill |
| `--juice-accordion-trigger-open` | expanded trigger fill |
| `--juice-accordion-chevron` | chevron pigment |
| `--juice-accordion-panel-rule` | panel divider |
| `--juice-accordion-focus-ring` | focus outline |

Consumed by `accordion.scss`. Aquaflux, KiwiPress, Citrusmint, Tide, and generated `--jx-*` themes all bind this set.

### Tabs core

| Role | Job |
|---|---|
| `--juice-tabs-trigger` | idle trigger fill |
| `--juice-tabs-trigger-hover` | hover fill |
| `--juice-tabs-trigger-active` | selected trigger fill |
| `--juice-tabs-text` | idle label |
| `--juice-tabs-text-hover` | hover label |
| `--juice-tabs-text-active` | selected label |
| `--juice-tabs-indicator` | selected underline |
| `--juice-tabs-list-rule` | strip bottom rule |
| `--juice-tabs-focus-ring` | focus outline |

Consumed by `tabs.scss`. Same four library themes plus generated `--jx-tabs-*`.

### Modal chrome

Structural dialog paint. Required names:

| Role | Job |
|---|---|
| `--juice-modal-overlay` | dimming scrim on `[modal-overlay]` |
| `--juice-modal-panel` | elevated panel fill |
| `--juice-modal-panel-border` | panel hairline |
| `--juice-modal-panel-shadow` | panel elevation |
| `--juice-modal-close` | close-button fill |
| `--juice-modal-close-color` | close-button ink |
| `--juice-modal-close-hover` | close-button hover fill |
| `--juice-modal-focus-ring` | close-button focus outline |

Consumed by `modal.scss` with light fallbacks. Aquaflux, KiwiPress, Citrusmint, Tide, and generated `--jx-modal-*` themes all bind this set from existing surface / page / text tokens. Do not invent a new hue family. Close stays a surface control, not the CTA button gradient.

This is **not** the surface `overlay="frost|tint"` utility. `[modal-overlay]` is a dialog scrim. Optional `surfaceTone` on `[modal]` is allowed; do not force it. Closed vs open uses the native `hidden` attribute so static open markup demos stay visible. Openers pair through `aria-controls`. The dialog runtime auto-enhances that markup — see [Modal Runtime](./juice-modal-runtime.md).

Tide must stay a dark scrim and dark panel, not a white glass dialog.

### Drawer chrome

Structural sliding-panel paint. Required names:

| Role | Job |
|---|---|
| `--juice-drawer-overlay` | dimming scrim on `[drawer-overlay]` |
| `--juice-drawer-panel` | edge-docked panel fill |
| `--juice-drawer-panel-border` | panel hairline |
| `--juice-drawer-panel-shadow` | panel elevation |
| `--juice-drawer-close` | close-button fill |
| `--juice-drawer-close-color` | close-button ink |
| `--juice-drawer-close-hover` | close-button hover fill |
| `--juice-drawer-focus-ring` | close-button focus outline |

Consumed by `drawer.scss` with light fallbacks. Aquaflux, KiwiPress, Citrusmint, Tide, and generated `--jx-drawer-*` themes all bind this set from existing surface / page / text tokens. Do not invent a new hue family. Close stays a surface control, not the CTA button gradient.

This is **not** the surface `overlay="frost|tint"` utility. `[drawer-overlay]` is a drawer scrim. Optional `surfaceTone` on `[drawer]` is allowed; do not force it. Closed vs open uses the native `hidden` attribute so static open markup demos stay visible. Openers pair through `aria-controls`. The dialog runtime auto-enhances that markup — see [Drawer Runtime](./juice-drawer-runtime.md).

Edge and size are separate so they compose: `[drawer]` / `[drawer="right"]` / `[drawer="left"]` dock the panel (bare or unspecified is right). Optional `[drawer-size="sm|lg"]` sets width (default `22rem`, `sm` `16rem`, `lg` `32rem`). Do not put size on the `drawer` attribute — that slot is the edge.

Tide must stay a dark scrim and dark panel, not a white glass drawer.

### Toast chrome

Structural non-modal feedback paint. Required names:

| Role | Job |
|---|---|
| `--juice-toast-panel` | notification panel fill |
| `--juice-toast-panel-border` | panel hairline |
| `--juice-toast-panel-shadow` | panel elevation |
| `--juice-toast-ink` | body / title text |
| `--juice-toast-close` | close-button fill |
| `--juice-toast-close-color` | close-button ink |
| `--juice-toast-close-hover` | close-button hover fill |
| `--juice-toast-focus-ring` | close-button focus outline |
| `--juice-toast-success` | success accent (left bar) |
| `--juice-toast-success-soft` | success soft panel tint |
| `--juice-toast-error` | error accent |
| `--juice-toast-error-soft` | error soft panel tint |
| `--juice-toast-info` | info accent |
| `--juice-toast-info-soft` | info soft panel tint |
| `--juice-toast-warning` | warning accent |
| `--juice-toast-warning-soft` | warning soft panel tint |

Consumed by `toast.scss` with light fallbacks. Aquaflux, KiwiPress, Citrusmint, Tide, and generated `--jx-toast-*` themes all bind this set from existing surface / page / text / accent tokens. Do not invent a new hue family. Status remaps identity tokens (accent, warm, page-deep, secondary) — not a second semantic palette. Close stays a surface control, not the CTA button gradient.

This is **not** a dialog overlay and **not** the surface `overlay="frost|tint"` utility. There is no toast scrim. Optional `surfaceTone` on `[toast]` is allowed; do not force it. The stack (`[toast-region]`) stays in the DOM. Closed vs open for an individual `[toast]` uses the native `hidden` attribute so static open markup demos stay visible. The toast runtime auto-enhances that markup — see [Toast Runtime](./juice-toast-runtime.md).

Region position: `[toast-region]` / `[toast-region="top-right"]` (default), `"top-left"`, `"bottom-right"`, `"bottom-left"`. Status: bare `[toast]` is neutral; `[toast="success|error|info|warning"]` paints a 4px left accent bar plus the matching soft tint.

Tide must stay a dark panel, not a white glass toast.

### Banner chrome

Structural inline-alert / callout paint. Required names:

| Role | Job |
|---|---|
| `--juice-banner-panel` | callout fill |
| `--juice-banner-panel-border` | callout hairline |
| `--juice-banner-ink` | body text |
| `--juice-banner-close` | close-button fill |
| `--juice-banner-close-color` | close-button ink |
| `--juice-banner-close-hover` | close-button hover fill |
| `--juice-banner-focus-ring` | close-button focus outline |
| `--juice-banner-success` | success accent (left bar) |
| `--juice-banner-success-soft` | success soft panel tint |
| `--juice-banner-error` | error accent |
| `--juice-banner-error-soft` | error soft panel tint |
| `--juice-banner-info` | info accent |
| `--juice-banner-info-soft` | info soft panel tint |
| `--juice-banner-warning` | warning accent |
| `--juice-banner-warning-soft` | warning soft panel tint |

Consumed by `banner.scss` with light fallbacks. Aquaflux, KiwiPress, Citrusmint, Tide, and generated `--jx-banner-*` themes all bind this set from existing surface / page / text / accent tokens. Do not invent a new hue family. Status remaps identity tokens (accent, warm, page-deep, secondary) — not a second semantic palette. Close stays a surface control, not the CTA button gradient. There is no `--juice-banner-panel-shadow`; banner is inline, not an elevated snackbar.

Banner is an **inline alert / callout**. It is **not** a toast stack, **not** a dialog overlay, and **not** the surface `overlay="frost|tint"` utility. There is no scrim and no `[banner-region]`. Optional `surfaceTone` on `[banner]` is allowed; do not force it. Closed vs open uses the native `hidden` attribute so static open markup demos stay visible. The banner runtime auto-enhances that markup (`show` / `dismiss`, `[banner-close]`, optional `banner-persist`) — see [Banner Runtime](./juice-banner-runtime.md).

Layout and status stay on separate attributes so `full` does not collide: `[banner]` / `[banner="full"]` (bare is inset; `full` is edge-to-edge). Optional `[banner-tone="info|success|warning|error"]` paints a 4px left accent bar plus the matching soft tint. Bare `[banner]` without `banner-tone` is neutral. Do not put status on the `banner` attribute.

Tide must stay a dark panel, not a white glass banner.

### Popover chrome

Structural anchored-panel paint. Required names:

| Role | Job |
|---|---|
| `--juice-popover-panel` | floating panel fill |
| `--juice-popover-panel-border` | panel hairline |
| `--juice-popover-panel-shadow` | panel elevation |
| `--juice-popover-ink` | header / body text |
| `--juice-popover-close` | close-button fill |
| `--juice-popover-close-color` | close-button ink |
| `--juice-popover-close-hover` | close-button hover fill |
| `--juice-popover-focus-ring` | close-button focus outline |

Consumed by `popover.scss` with light fallbacks. Aquaflux, KiwiPress, Citrusmint, Tide, and generated `--jx-popover-*` themes all bind this set from existing surface / page / text tokens. Do not invent a new hue family. Close stays a surface control, not the CTA button gradient.

This is **Juice chrome**, not the native HTML Popover API. Never use a bare `popover` attribute for the panel — `popover=""` / `popover="manual"` activates the platform API. Juice names are `[popover-root]` (positioning wrapper), `[popover-panel]` (the surface), optional `[popover-header]` / `[popover-body]`, and `[popover-close]`.

Popover is **not** a modal dialog, **not** a drawer, **not** a toast stack, and **not** the surface `overlay="frost|tint"` utility. There is no scrim. Optional `surfaceTone` on `[popover-panel]` is allowed; do not force it. Closed vs open uses the native `hidden` attribute on `[popover-root]` so static open markup demos stay visible. Placement is `[popover-root]` / `[popover-root="bottom"]` (default), `"top"`, `"left"`, `"right"` — CSS stubs transform-origin and a small offset; the runtime positions the root and flips once to the opposite side if the preferred side overflows. The popover runtime auto-enhances that markup — see [Popover Runtime](./juice-popover-runtime.md).

Tide must stay a dark panel, not a white glass popover.

### Tooltip chrome

Structural hover/focus tip paint. Required names:

| Role | Job |
|---|---|
| `--juice-tooltip-panel` | tip fill |
| `--juice-tooltip-panel-border` | tip hairline |
| `--juice-tooltip-panel-shadow` | tip elevation |
| `--juice-tooltip-ink` | tip text |

Consumed by `tooltip.scss` with light fallbacks. Aquaflux, KiwiPress, Citrusmint, Tide, and generated `--jx-tooltip-*` themes all bind this set from existing surface / page / text tokens. Do not invent a new hue family.

This is **Juice chrome**, not the native HTML `title` attribute. Do not restyle or replace `title`. Juice names are `[tooltip-root]` (positioning wrapper) and `[tooltip-panel]` (the tip surface, `role="tooltip"` in markup). Do not use a bare `[tooltip]` attribute.

Tooltip is a **thin cousin of popover**: hover/focus only, no interactive content, no close button, no focus trap, no status variants. It is **not** a popover, **not** a modal dialog, **not** a drawer, **not** a toast stack, and **not** the surface `overlay="frost|tint"` utility. There is no scrim. Optional `surfaceTone` on `[tooltip-panel]` is allowed; do not force it. Closed vs open uses the native `hidden` attribute on `[tooltip-root]` so static open markup demos stay visible. Placement is `[tooltip-root]` / `[tooltip-root="top"]` (default), `"bottom"`, `"left"`, `"right"` — CSS stubs transform-origin and a small offset; the runtime positions the root and flips once to the opposite side if the preferred side overflows. Core CSS paints `[tooltip-root]` at **z-index 1060** (slightly above popover `1050`, below toast `1100`) so a tip can float over an open panel. The tooltip runtime auto-enhances that markup — see [Tooltip Runtime](./juice-tooltip-runtime.md).

Tide must stay a dark tip, not a white glass tooltip.

### Combobox chrome

Structural input + listbox-popup paint. Required names:

| Role | Job |
|---|---|
| `--juice-combobox-input` | text-field fill |
| `--juice-combobox-input-border` | text-field hairline |
| `--juice-combobox-input-ink` | text-field text |
| `--juice-combobox-list` | popup list fill |
| `--juice-combobox-list-border` | popup list hairline |
| `--juice-combobox-list-shadow` | popup list elevation |
| `--juice-combobox-option` | idle option fill |
| `--juice-combobox-option-hover` | hovered option fill |
| `--juice-combobox-option-selected` | selected / active option fill |
| `--juice-combobox-option-ink` | option text |
| `--juice-combobox-trigger` | optional chevron-button fill |
| `--juice-combobox-trigger-ink` | optional chevron-button ink |
| `--juice-combobox-focus-ring` | input / trigger focus outline |

Consumed by `combobox.scss` with light fallbacks. Aquaflux, KiwiPress, Citrusmint, Tide, and generated `--jx-combobox-*` themes all bind this set from existing surface / page / text tokens. Do not invent a new hue family. Trigger stays a surface control, not the CTA button gradient.

This is **Juice chrome**, not a native `<select>` restyle. Do not restyle or replace `<select>`. Juice names are `[combobox]` (composite root), `[combobox-input]` (text field, `role="combobox"` in markup), optional `[combobox-trigger]` (chevron button), `[combobox-list]` (popup, `role="listbox"` in markup), and `[combobox-option]` (row, `role="option"` in markup). Use role in markup; attrs own Juice structure. Do not style `[role="listbox"]`.

Combobox is an **input + listbox popup**. It is **not** a native select, **not** a popover, **not** a tooltip, **not** a modal dialog, and **not** the surface `overlay="frost|tint"` utility. Optional `surfaceTone` on `[combobox-list]` is allowed; do not force it. Closed vs open uses the native `hidden` attribute on `[combobox-list]` so static open markup demos stay visible. Selected / active paint hooks for static demos are `[combobox-option][aria-selected="true"]` and `[combobox-option="active"]`. Core CSS paints `[combobox-list]` at **z-index 1050** (same band as popover, below tooltip `1060` and toast `1100`). Placement is CSS-only (absolute under the field); there is no Floating UI. The combobox runtime auto-enhances that markup — see [Combobox Runtime](./juice-combobox-runtime.md).

Tide must stay a dark field and dark list, not a white glass combobox.

### Menu chrome

Structural APG menu-button paint. Required names:

| Role | Job |
|---|---|
| `--juice-menu-panel` | menu panel fill |
| `--juice-menu-panel-border` | menu panel hairline |
| `--juice-menu-panel-shadow` | menu panel elevation |
| `--juice-menu-ink` | item / label text |
| `--juice-menu-item` | idle item fill |
| `--juice-menu-item-hover` | hovered item fill |
| `--juice-menu-item-active` | keyboard / visual-focus item fill |
| `--juice-menu-separator` | divider rule |
| `--juice-menu-focus-ring` | opener / item focus outline |
| `--juice-menu-opener` | optional `[menu-button]` fill |
| `--juice-menu-opener-ink` | optional `[menu-button]` ink |

Consumed by `menu.scss` with light fallbacks. Aquaflux, KiwiPress, Citrusmint, Tide, and generated `--jx-menu-*` themes all bind this set from existing surface / page / text tokens. Do not invent a new hue family. `[menu-button]` stays a surface control, not the CTA button gradient.

This is **Juice chrome** for the APG **Menu Button** pattern (an opener toggles a menu of menuitems). It is **not** a popover, **not** a combobox, **not** a native `<select>` restyle, and **not** a menubar or context menu (those stay later). Juice names are `[menu-root]` (composite wrapper), optional `[menu-button]` (opener chrome), `[menu]` (the panel), `[menuitem]` (row), optional `[menu-separator]`, and optional `[menu-label]`. Use role in markup; attrs own Juice structure. Do not style bare `[role="menu"]` or `[role="menuitem"]`.

A boolean `[menu]` attribute is fine: there is no HTML global `menu` attribute, and unlike `popover=""` it has no platform behavior. HTML `<menu>` is a list container; Juice `[menu]` is an attribute selector. Authors should write `<div menu>`, not `<menu>`.

Pairing is wrapped: `[menu-root]` contains the opener and `[menu]`. Closed vs open uses the native `hidden` attribute on `[menu]` (not the root — hiding the root would hide the button). Placement is `[menu-root]` / `[menu-root="bottom"]` (default), `"top"`, `"left"`, `"right"` — CSS stubs transform-origin and a small offset; there is no Floating UI. Keyboard / visual focus is `[menuitem="active"]` with roving tabindex. Optional `surfaceTone` on `[menu]` is allowed; do not force it. Core CSS paints `[menu]` at **z-index 1050** (same band as popover / combobox, below tooltip `1060` and toast `1100`). The menu runtime auto-enhances that markup (`open` / `close` / `toggle` / `select`) — see [Menu Runtime](./juice-menu-runtime.md).

Tide must stay a dark panel, not a white glass menu.

### Switch chrome

Structural APG switch (toggle) paint. Required names:

| Role | Job |
|---|---|
| `--juice-switch-track` | idle track fill |
| `--juice-switch-track-checked` | on / checked track fill |
| `--juice-switch-thumb` | idle thumb fill |
| `--juice-switch-thumb-checked` | on / checked thumb fill |
| `--juice-switch-focus-ring` | control focus outline |

Consumed by `switch.scss` with light fallbacks. Aquaflux, KiwiPress, Citrusmint, Tide, and generated `--jx-switch-*` themes all bind this set from existing surface / page / text / accent tokens. Do not invent a new hue family. `[switch]` stays a surface track, not the CTA button gradient.

This is **Juice chrome** for the APG **Switch** pattern (a toggle with `role="switch"` and `aria-checked`). It is **not** a tri-state form checkbox, **not** a native `<input type="checkbox">` restyle as the only story, and **not** a menu `menuitemcheckbox`. Juice name is `[switch]` (boolean attr) on the control root. Primary host is `<button type="button" switch>`. A checkbox-backed host (`<input type="checkbox" switch>`) is allowed; `:checked` paints that path. Use role in markup; attrs own Juice structure. Do not style bare `[role="switch"]`.

A boolean `[switch]` attribute is fine: there is no HTML global `switch` attribute. WebKit's checkbox `switch` attr is an opt-in on `<input type="checkbox">`, not a global; Juice `[switch]` on that host restyles with Juice chrome (`appearance: none`).

Track and thumb are CSS pseudo-elements on `[switch]` (the host is the track; `::after` is the thumb). There are no `[switch-track]` / `[switch-thumb]` children. This slice does not size the control: no `switch-size`, and `scale="sm|lg"` does not change track/thumb geometry (`scale` is ordinary button padding; `*-size` is a layout attr). Visible labels live beside the control (`<label>`, `aria-label`, or `aria-labelledby`).

Checked paint for static demos is `aria-checked="true"` so chrome and runtime share one story. There is no `switch="on"`. Core CSS treats this as an **inline** control — no floating overlay z-index band. Thumb slide honors `prefers-reduced-motion`. The runtime auto-enhances button and checkbox `[switch]` hosts (`createSwitch` / `toggle` / `setChecked`). v1 is binary: `aria-checked="mixed"` coerces to `"false"`. Authors must supply the accessible name. See [Switch Runtime](./juice-switch-runtime.md).

Tide must stay a dark track, not a white pill.

### Slider chrome

Structural APG slider paint. Horizontal only. Required names:

| Role | Job |
|---|---|
| `--juice-slider-track` | groove fill on the host |
| `--juice-slider-track-border` | groove hairline |
| `--juice-slider-fill` | completed portion (`[slider-fill]`) |
| `--juice-slider-thumb` | thumb fill |
| `--juice-slider-thumb-border` | thumb hairline |
| `--juice-slider-thumb-shadow` | thumb shadow |
| `--juice-slider-focus-ring` | host / thumb focus outline |

Consumed by `slider.scss` with light fallbacks. Aquaflux, KiwiPress, Citrusmint, Tide, and generated `--jx-slider-*` themes all bind this set from existing surface / page / text / accent tokens. Do not invent a new hue family. `[slider-thumb]` stays a surface control, not the CTA button gradient.

This is **Juice chrome** for the APG **Slider** pattern (a horizontal slider with `aria-valuenow` / `aria-valuemin` / `aria-valuemax`). It is **not** a native `<input type="range">` restyle as the only story, **not** a progress meter, and **not** a scrollbar. Juice names are `[slider]` (track host), `[slider-fill]` (completed portion), and `[slider-thumb]` (thumb child). Use role in markup; attrs own Juice structure. Do not style bare `[role="slider"]`.

A boolean `[slider]` attribute is fine: there is no HTML global `slider` attribute. `slider="horizontal"` is the same story. `slider="vertical"` is later and is not painted. There is no `[slider-track]` child — the host is the track. There is no `slider-size`, and `scale` does not change track or thumb geometry.

Integer `aria-valuenow` from 0 through 100 paints the fill and thumb when min/max are omitted or are `0` / `100`, on the host or on `[slider-thumb]` (the thumb wins). Other ranges set the structural paint hook `--juice-slider-ratio` (unitless 0–1) on `[slider]`. That hook is not a theme role and not an author attribute named `slider-value`. Core CSS treats this as an **inline** control — no floating overlay z-index band. The thumb uses z-index 1 so it stays above the fill. Fill and thumb motion honor `prefers-reduced-motion`. The runtime auto-enhances `[slider]` hosts that own a `[slider-thumb]` (`createSlider` / `setValue` / `increment` / `decrement`). Focus is the thumb (`role="slider"`). v1 is horizontal only: no vertical, no multi-thumb, no native `<input type="range">` restyle, and no Escape. Authors must supply the accessible name. `--juice-slider-ratio` stays in sync. See [Slider Runtime](./juice-slider-runtime.md).

Tide must stay a dark track, not a white groove. The thumb stays light (`--tide-heading`), not the page color.

### Checkbox chrome

Structural APG checkbox paint. Binary only. Required names:

| Role | Job |
|---|---|
| `--juice-checkbox-control` | unchecked box fill |
| `--juice-checkbox-control-checked` | checked box fill |
| `--juice-checkbox-border` | unchecked box hairline |
| `--juice-checkbox-border-checked` | checked box hairline |
| `--juice-checkbox-mark` | checkmark |
| `--juice-checkbox-focus-ring` | control focus outline |

Consumed by `checkbox.scss` with light fallbacks. Aquaflux, KiwiPress, Citrusmint, Tide, and generated `--jx-checkbox-*` themes all bind this set from existing surface / page / text / accent tokens. Do not invent a new hue family. `[checkbox]` stays a surface box, not the CTA button gradient. There is no ink role: the label sits beside the control and is author-owned.

This is **Juice chrome** for the APG **Checkbox** pattern (a binary check with `aria-checked`). It is **not** `[switch]`, **not** a native `<input type="checkbox">` restyle as the only story, and **not** a menu `menuitemcheckbox`. Juice name is `[checkbox]` (boolean attr) on the control root. Primary host is `<button type="button" checkbox>`. A native host (`<input type="checkbox" checkbox>`) is allowed; `:checked` paints that path. Use role in markup; attrs own Juice structure. Do not style bare `[role="checkbox"]`.

A boolean `[checkbox]` attribute is fine: there is no HTML global `checkbox` attribute.

The box is the host. The checkmark is `::after`. There is no `[checkbox-box]` child. This slice does not size the control: no `checkbox-size`, and `scale` does not change box geometry. Visible labels live beside the control (`<label>`, `aria-label`, or `aria-labelledby`).

Checked paint for static demos is `aria-checked="true"` so chrome and runtime share one story. v1 does not paint `aria-checked="mixed"`. Core CSS treats this as an **inline** control — no floating overlay z-index band. Check motion honors `prefers-reduced-motion`. The runtime auto-enhances button and native `[checkbox]` hosts (`createCheckbox` / `toggle` / `setChecked`). v1 is binary: `aria-checked="mixed"` coerces to `"false"`. Authors must supply the accessible name. See [Checkbox Runtime](./juice-checkbox-runtime.md).

Tide must stay a dark box (`--tide-surface-strong`), not a white square. The checkmark stays `--tide-heading`, not the page color.

### Radio chrome

Structural APG radio paint. Required names:

| Role | Job |
|---|---|
| `--juice-radio-control` | unchecked disc fill |
| `--juice-radio-control-checked` | checked disc fill |
| `--juice-radio-border` | unchecked disc hairline |
| `--juice-radio-border-checked` | checked disc hairline |
| `--juice-radio-mark` | inner dot |
| `--juice-radio-focus-ring` | control focus outline |

Consumed by `radio.scss` with light fallbacks. Aquaflux, KiwiPress, Citrusmint, Tide, and generated `--jx-radio-*` themes all bind this set from existing surface / page / text / accent tokens. Do not invent a new hue family. `[radio]` stays a surface disc, not the CTA button gradient. There is no ink role: the label sits beside the option and is author-owned.

`[radiogroup]` is the group root and is **layout only**. There is no `--juice-radiogroup-*` family. Authors stack options with `stack` / `row` / `gap`. Core CSS resets native fieldset chrome (`margin`, `padding`, `border`) and does not set a gap.

This is **Juice chrome** for the APG **Radio** pattern (an option in a radiogroup, checked with `aria-checked`). It is **not** `[switch]`, **not** `[checkbox]`, and **not** a native `<input type="radio">` restyle as the only story. Juice names are `[radiogroup]` (group root) and `[radio]` (one option). Primary host is `<button type="button" radio>`. A native host (`<input type="radio" radio>`) is allowed; `:checked` paints that path. Use role in markup; attrs own Juice structure. Do not style bare `[role="radio"]` or `[role="radiogroup"]`.

A boolean `[radio]` attribute is fine: there is no HTML global `radio` attribute. Group name and exclusive selection belong to the radio runtime.

The disc is the host. The dot is `::after`. There is no `[radio-dot]` child. This slice does not size the control: no `radio-size`, and `scale` does not change disc geometry. Visible labels live beside the control (`<label>`, `aria-label`, or `aria-labelledby`).

Checked paint for static demos is `aria-checked="true"` so chrome and runtime share one story. Core CSS treats this as an **inline** control — no floating overlay z-index band. Dot motion honors `prefers-reduced-motion`. The runtime auto-enhances `[radio]` options inside `[radiogroup]` (`createRadio` / `select` / `getChecked`, roving tabindex, arrows plus Space/Enter/click). Orphans outside a group are ignored. Authors must supply the accessible name. See [Radio Runtime](./juice-radio-runtime.md).

Tide must stay a dark disc (`--tide-surface-strong`), not a white ring. The dot stays `--tide-accent`, not the page color.

### Breadcrumb chrome

Structural APG-inspired breadcrumb paint. Required names:

| Role | Job |
|---|---|
| `--juice-breadcrumb-ink` | ancestor crumb text |
| `--juice-breadcrumb-ink-current` | current page (`aria-current="page"`) |
| `--juice-breadcrumb-ink-hover` | ancestor hover text |
| `--juice-breadcrumb-separator` | decorative separator |
| `--juice-breadcrumb-focus-ring` | link focus outline |
| `--juice-breadcrumb-surface` | trail background |

Consumed by `breadcrumb.scss` with light fallbacks. Aquaflux, KiwiPress, Citrusmint, Tide, and generated `--jx-breadcrumb-*` themes all bind this set from existing text / heading / accent / border tokens. Do not invent a new hue family. Crumb links stay ink, not the CTA button gradient.

`surface` is the trail background. Shipped themes bind `transparent` so the trail stays inline. Point that role at an existing surface token when crumbs sit on a bar.

This is **Juice chrome** for an APG-inspired **Breadcrumb** trail. It is **not** the site `[nav]` / navigation runtime, **not** `nav[type="breadcrumb"]` (that older layout pattern stays in `nav.scss`), **not** tabs, **not** the wizard step tracker, and **not** pagination. Juice names are `[breadcrumb]` (root: `<nav breadcrumb>` or `<ol breadcrumb>`), `[breadcrumb-item]` (one crumb), optional `[breadcrumb-link]` (anchors inside the trail are enough), and optional `[breadcrumb-separator]`. The separator is `::after` on every item except the last: a decorative chevron with empty content so it is not announced. An explicit `[breadcrumb-separator]` suppresses that chevron; authors should aria-hide a custom glyph. This slice does not invent ARIA.

A boolean `[breadcrumb]` attribute is fine: there is no HTML global `breadcrumb` attribute. Do not style bare `[aria-current="page"]` outside the trail. Current-page paint is `aria-current="page"` on the last item or its link. The runtime keeps a single `aria-current="page"` inside the trail.

Core CSS treats this as **inline** nav chrome — no floating overlay z-index band. Color transitions honor `prefers-reduced-motion`. The runtime auto-enhances `[breadcrumb]` (`createBreadcrumb` / `sync` / `setCurrent`). An unlabeled navigation landmark is named `Breadcrumb`. Lists stay lists. It does not remove `href`, trap focus, steal Escape, or listen to history. No Sig Breadcrumb factory. See [Breadcrumb Runtime](./juice-breadcrumb-runtime.md).

Tide keeps a dark inline trail: ink is `--tide-text-muted`, current is `--tide-heading`, and surface stays `transparent` (not a light bar, not the page color).

### Progress chrome

Structural APG-inspired progressbar paint. Determinate and indeterminate. Required names:

| Role | Job |
|---|---|
| `--juice-progress-track` | groove fill on the host |
| `--juice-progress-track-border` | groove hairline |
| `--juice-progress-fill` | completed portion (`[progress-fill]`) |
| `--juice-progress-ink` | optional value label |
| `--juice-progress-focus-ring` | host focus outline when something is focused |

Consumed by `progress.scss` with light fallbacks. Aquaflux, KiwiPress, Citrusmint, Tide, and generated `--jx-progress-*` themes all bind this set from existing surface / page / text / accent tokens. Do not invent a new hue family. The fill is an accent (Citrusmint uses heading, same as slider fill), not the CTA button gradient. Ink is text, not the accent.

This is **Juice chrome** for an APG-inspired **Progressbar**. It is **not** a slider (no thumb, not interactive), **not** a spinner-only loader, and **not** a native `<progress>` restyle as the only story. Juice names are `[progress]` (track host), `[progress-fill]` (filled portion), and optional `[progress-label]`. There is no `[progress-bar]` and no `[progress-track]` — the host is the track. Use role in markup; attrs own Juice structure. Do not style bare `[role="progressbar"]`.

A boolean `[progress]` attribute is fine: there is no HTML global `progress` attribute. `[progress]` is an attribute selector, not the type selector `progress` (same distinction menu draws for `<menu>`). Authors write `<div progress>`, not `<progress>`. Do not restyle the HTML `<progress>` element alone. `<progress progress>` matches the attribute, but the UA does not show a `[progress-fill]` child, so the Juice fill does not paint on the native element. Native `value` / `max` are not the paint hook.

Determinate is the boolean attribute. Integer `aria-valuenow` from 0 through 100 on the host paints the fill when min/max are omitted or are `0` / `100`. Other ranges set the structural paint hook `--juice-progress-ratio` (unitless 0–1) on `[progress]`. That hook is not a theme role and not an author attribute named `progress-value`. Missing `aria-valuenow` is an empty determinate bar (ratio 0), not indeterminate.

Indeterminate is `progress="indeterminate"` only. That flag wins over a stale `aria-valuenow` for paint. CSS slides `[progress-fill]`. The host clips that motion. `prefers-reduced-motion` stops the animation and leaves a static partial fill. The host is usually not focusable; `focus-ring` paints only on `:focus-visible`. Core CSS treats this as **inline** status chrome — no floating overlay z-index band. The progress runtime auto-enhances that markup (`setValue` / `getValue` / `setIndeterminate`): `role="progressbar"`, `aria-valuemin` / `aria-valuemax` / `aria-valuenow`, and `--juice-progress-ratio`. APG omits `aria-valuenow` while `progress="indeterminate"`. The runtime does not invent `aria-valuetext`. No Sig Progress factory. See [Progress Runtime](./juice-progress-runtime.md).

Tide must stay a dark track (`--tide-surface-muted`), not a white groove. The fill stays `--tide-accent`, not the page color. Ink stays `--tide-text`.

### Wizard chrome

Structural multi-step onboarding paint. Required names:

| Role | Job |
|---|---|
| `--juice-wizard-shell` | page fill on `[wizard-shell]` |
| `--juice-wizard-header` | sticky header fill |
| `--juice-wizard-header-border` | header bottom hairline |
| `--juice-wizard-rail` | left / right rail fill |
| `--juice-wizard-rail-border` | rail divider |
| `--juice-wizard-step` | idle / pending step-indicator fill |
| `--juice-wizard-step-border` | idle / pending step-indicator outline |
| `--juice-wizard-step-ink` | idle / pending step-indicator ink |
| `--juice-wizard-step-current` | active step-indicator fill and outline |
| `--juice-wizard-step-complete` | completed step-indicator fill and outline |
| `--juice-wizard-step-on` | ink on current / complete indicators |
| `--juice-wizard-step-connector` | default connector line between steps |
| `--juice-wizard-panel` | order-summary / feature / placeholder / selected-domain fill |
| `--juice-wizard-panel-border` | those panel hairlines (and summary dividers) |
| `--juice-wizard-focus-ring` | focus outline on step controls |

Consumed by `wizard.scss` with light fallbacks. Aquaflux, KiwiPress, Citrusmint, Tide, and generated `--jx-wizard-*` themes all bind this set from existing surface / page / text / accent tokens. Do not invent a new hue family.

Step progress paint uses the existing `[step="pending"|"active"|"completed"]` values already in KiwiPress markup. Bare `[step]` paints as pending. A completed step's connector uses `--juice-wizard-step-current`. The wizard runtime auto-enhances `[wizard-shell]` markup (`createWizard` / `initWizard` / `startWizardRuntime` / `stopWizardRuntime`) and writes those step attrs plus one visible `[step-page]` with native `hidden` — see [Wizard Runtime](./juice-wizard-runtime.md).

KiwiPress may keep product-local extras (logo, badge, header button, feature-icon, pill, trust dots) on `--kw-*` tokens. Those are not required roles.

Tide must stay a dark shell and dark rails, not a white onboarding page.

### Surface tones

`surfaceTone="soft|strong|muted"`. Each tone binds four roles:

| Role suffix | Used as |
|---|---|
| `-bg` | `background-color` |
| `-border` | tone border color |
| `-shadow` | `box-shadow` |
| `-blur` | `backdrop-filter` length |

Required names:

- `--juice-surface-soft-bg` / `-border` / `-shadow` / `-blur` — frosted / translucent
- `--juice-surface-strong-bg` / `-border` / `-shadow` / `-blur` — opaque elevated panel
- `--juice-surface-muted-bg` / `-border` / `-shadow` / `-blur` — quieter recessed wash

Consumed by `surface.scss` with light fallbacks (unthemed `soft` stays the original near-white frost). Per-theme mapping notes live in [Surfaces](./juice-surfaces.md) and [Theme authoring](./juice-theme-authoring.md). Tide must stay a dark frost, not a white glass.

### Border strength

`borderStrength="soft|bold"`. Required names:

| Role | Job |
|---|---|
| `--juice-border-strength-soft-width` | hairline width (`1px` in every shipped theme) |
| `--juice-border-strength-soft-color` | hairline color |
| `--juice-border-strength-bold-width` | heavier rule (`2px` in every shipped theme) |
| `--juice-border-strength-bold-color` | heavier rule color |

Bind colors from existing `--*-border` / `--*-border-strong` tokens. Citrusmint has no `--cm-border-strong`; bold mixes `--cm-heading` at low alpha. Tide uses `--tide-border` / `--tide-border-strong` so bold is a lagoon line, not a light gray.

Core applies the color roles only when the element has neither `surfaceTone` nor `borderColor`. Combined `[surfaceTone][borderStrength]` refines width only.

### Shadow tone

`shadowTone="cool|warm"`. Required names:

| Role | Job |
|---|---|
| `--juice-shadow-tone-cool-color` | `--shadow-color` for existing `shadow` / `depth` |
| `--juice-shadow-tone-cool-shadow` | standalone / `surfaceTone` `box-shadow` |
| `--juice-shadow-tone-warm-color` | `--shadow-color` for existing `shadow` / `depth` |
| `--juice-shadow-tone-warm-shadow` | standalone / `surfaceTone` `box-shadow` |

Bind from existing identity tokens. Do not invent a new hue family. Aquaflux uses `--aqua-shadow` (cool) and a low-alpha `--aqua-accent-strong` mix (warm). KiwiPress uses `--kw-tier-content` (cornflower) and `--kw-warm` (marmalade). Citrusmint stays in the green family (`wintergreen` / `lime`). Tide mixes `--tide-accent` into `--tide-shadow` plus `--tide-line-glow` for cool, and `--tide-shadow` for warm ink — not a light gray drop.

Core applies the shadow roles on standalone `[shadowTone]` (`:not([depth])` so `[shadow][depth]` geometry wins) and on combined `[surfaceTone][shadowTone]` (shadow only; tone fill / border / blur stay).

### Overlay

`overlay="frost|tint"`. Required names:

| Role | Job |
|---|---|
| `--juice-overlay-frost-wash` | frost pigment (themes mix this into `-layer`) |
| `--juice-overlay-frost-layer` | standalone / `surfaceTone` `background-image` |
| `--juice-overlay-tint-wash` | tint pigment (themes mix this into `-layer`) |
| `--juice-overlay-tint-layer` | standalone / `surfaceTone` `background-image` |

Bind from existing identity tokens. Do not invent a new hue family. Aquaflux uses `--aqua-page` (frost) and `--aqua-page-tint` (tint). KiwiPress uses `--kw-surface` / `--kw-accent-tint`. Citrusmint uses `--cm-surface` / `--cm-surface-muted`. Tide mixes `--tide-page` (frost) and `--tide-page-tint` (tint) into transparent — a dark veil, not a white wash.

Core paints via `background-image` (a `linear-gradient` of the wash), not `background-color` or `background` shorthand, so `[bgColor]` swatches and `--juice-surface-*-bg` stay intact. Combined `[surfaceTone][overlay]` adjusts wash only; tone fill / border / shadow / blur stay.

## 5. Optional hooks

Core consumes these with transparent / no-op fallbacks. Aquaflux, KiwiPress, and Citrusmint omit them. Tide binds several for dark FAQ pill chrome.

### Accordion (optional)

| Role | Job |
|---|---|
| `--juice-accordion-item-border` | idle trigger outline |
| `--juice-accordion-item-border-open` | expanded trigger / wrapping-item outline |
| `--juice-accordion-trigger-accent` | left bar on the open header (`::before`) |
| `--juice-accordion-panel` | recessed answer-well fill |
| `--juice-accordion-open-glow` | soft open-state shadow |
| `--juice-accordion-chevron-size` | CSS chevron silhouette size |
| `--juice-accordion-chevron-weight` | CSS chevron stroke |

Tide binds all of these (`--tide-item-border`, `--tide-trigger-accent`, `--tide-panel-well`, `--tide-open-glow`, plus chevron size `0.7rem` / weight `2.5px`).

### Tabs (optional)

| Role | Job |
|---|---|
| `--juice-tabs-panel` | panel fill |
| `--juice-tabs-panel-rule` | inset panel divider |

Tide binds `--juice-tabs-panel` from `--tide-tabs-panel`. It does not bind `--juice-tabs-panel-rule`. Other shipped themes bind neither.

Generated app themes currently bind required accordion/tabs/modal/drawer/toast/banner/popover/tooltip/combobox/menu/switch/slider/checkbox/radio/breadcrumb/progress/wizard/surface/border-strength/shadow-tone/overlay roles only. They do not emit these optional hooks.

## 6. Identity-prefix alias convention

| Source | Prefix | Example |
|---|---|---|
| Aquaflux | `--aqua-*` | `--aqua-trigger` → `--juice-accordion-trigger` |
| KiwiPress | `--kw-*` | `--kw-tabs-text-active` → `--juice-tabs-text-active` |
| Citrusmint | `--cm-*` | `--cm-surface` → `--juice-surface-strong-bg` |
| Tide | `--tide-*` | `--tide-border-strong` → `--juice-border-strength-bold-color` |
| Generated app themes | `--jx-*` | `--jx-trigger` → `--juice-accordion-trigger` |

`--juice-*` is what core CSS reads. Prefix aliases are theme-local names for the same values. Core accordion/tabs/modal/drawer/toast/popover/tooltip/combobox/menu/switch/slider/checkbox/radio/breadcrumb/progress/wizard helpers also fall back through `--aqua-*` / `--kw-*` / `--cm-*` / `--tide-*` / `--jx-*` if a `--juice-*` bind is missing, but shipped themes must still set the `--juice-*` names. Do not add a fifth library prefix.

## 7. Not theme roles

Standalone `blur="sm|md"` is a **core utility**, not a theme role family.

- Lengths are fixed: `sm` = `6px`, `md` = `16px`
- Optional restyles: `--juice-blur-sm` / `--juice-blur-md` (core fallbacks already supply those lengths)
- Do **not** require a per-theme blur scale
- Tone frost stays on `--juice-surface-<tone>-blur`
- Combined `[surfaceTone][blur]` overrides backdrop-filter length only; tone background / border / shadow stay

See [Surfaces](./juice-surfaces.md).

`variant="monochromatic|glass|tinted"` is also a **core recipe**, not a theme role family.

- `glass` composes `--juice-overlay-frost-*` + `--juice-surface-soft-blur`
- `tinted` composes `--juice-overlay-tint-*`
- `monochromatic` composes `--juice-border-strength-soft-*` + `--juice-surface-soft-shadow`
- Do **not** require a `--juice-variant-*` bind family
- Combined `[surfaceTone][variant]` applies only the recipe's properties; finer `overlay` / `blur` / `borderStrength` / `shadowTone` attrs win their property

See [Surfaces](./juice-surfaces.md).

Also not theme roles: layout primitives, responsive collapse, app state, feature behavior.

## 8. Theme × role-family matrix

| Family | aquaflux | kiwipress | citrusmint | tide |
|---|---|---|---|---|
| Accordion core | bind | bind | bind | bind |
| Tabs core | bind | bind | bind | bind |
| Modal chrome | bind | bind | bind | bind |
| Drawer chrome | bind | bind | bind | bind |
| Toast chrome | bind | bind | bind | bind |
| Banner chrome | bind | bind | bind | bind |
| Popover chrome | bind | bind | bind | bind |
| Tooltip chrome | bind | bind | bind | bind |
| Combobox chrome | bind | bind | bind | bind |
| Menu chrome | bind | bind | bind | bind |
| Switch chrome | bind | bind | bind | bind |
| Slider chrome | bind | bind | bind | bind |
| Checkbox chrome | bind | bind | bind | bind |
| Radio chrome | bind | bind | bind | bind |
| Breadcrumb chrome | bind | bind | bind | bind |
| Progress chrome | bind | bind | bind | bind |
| Wizard chrome | bind | bind | bind | bind |
| Surface tones (`soft` / `strong` / `muted` × bg, border, shadow, blur) | bind | bind | bind | bind |
| Border strength (`soft` / `bold` × width, color) | bind | bind | bind | bind |
| Shadow tone (`cool` / `warm` × color, shadow) | bind | bind | bind | bind |
| Overlay (`frost` / `tint` × wash, layer) | bind | bind | bind | bind |
| Accordion optional | omit (core no-op) | omit | omit | bind all seven |
| Tabs optional | omit | omit | omit | `--juice-tabs-panel` only |
| Standalone blur scale | not a theme role | not a theme role | not a theme role | not a theme role |
| `variant` recipes | not a theme role | not a theme role | not a theme role | not a theme role |

Generated `--jx-*` themes bind the twenty-one required families and omit the optional accordion/tabs hooks. Radiogroup has no role family. Breadcrumb `surface` is required and ships `transparent` (inline trail, not a bar). Progress `focus-ring` is required and paints only on `:focus-visible` (the bar is usually not focusable). `--juice-progress-ratio` is a structural paint hook, not a theme role.

## 9. Authoring checklist

A new theme is done when:

1. Identity is recorded: `id`, `name`, `selector` (`theme="<id>"`), body + heading typography, and palette groups for page, text, accents, and surfaces.
2. Named surfaces exist only when each has a one-sentence job; Juice `[hero]` / `[card]` / `[panel]` still do the structure.
3. Identity tokens use one prefix (`--aqua-*` / `--kw-*` / `--cm-*` / `--tide-*` for a library theme, `--jx-*` for a generated app theme).
4. `[theme="<id>"]` binds every **required** `--juice-*` name in section 4 from those existing tokens — no new hue family, no CTA paint on accordion/tab triggers, `[modal-close]`, `[drawer-close]`, `[toast-close]`, `[banner-close]`, `[popover-close]`, `[combobox-trigger]`, `[menu-button]`, `[switch]`, `[checkbox]`, or `[radio]`. Checkbox chrome binds the `--juice-checkbox-*` set (control / control-checked / border / border-checked / mark / focus-ring) from those tokens; it is a binary APG checkbox, not a switch, menuitemcheckbox, or tri-state. Radio chrome binds the `--juice-radio-*` set (control / control-checked / border / border-checked / mark / focus-ring) from those tokens; it is an APG radio, and `[radiogroup]` stays layout-only (no `--juice-radiogroup-*`). Breadcrumb chrome binds the `--juice-breadcrumb-*` set (ink / ink-current / ink-hover / separator / focus-ring / surface) from those tokens; it is an APG-inspired trail, not site nav, tabs, a wizard step tracker, or pagination. `surface` stays `transparent` unless crumbs sit on a bar. Crumb links stay ink, not a CTA. Progress chrome binds the `--juice-progress-*` set (track / track-border / fill / ink / focus-ring) from those tokens; it is an APG-inspired progressbar (`[progress]` / `[progress-fill]`, `progress="indeterminate"` for the busy state), not a slider, a spinner, or a native `<progress>` restyle as the only story. The fill is accent, not a CTA. Ink is text. Slider chrome binds the `--juice-slider-*` set (track / track-border / fill / thumb / thumb-border / thumb-shadow / focus-ring) from those tokens; it is an APG slider (horizontal only), not a range input, progress meter, or scrollbar. `[slider-thumb]` stays a surface control, not a CTA. Wizard chrome binds from the same identity tokens; step indicators are surfaces, not CTA buttons. Tooltip chrome binds the lean `--juice-tooltip-*` set (panel / panel-border / panel-shadow / ink) from those tokens; there is no close control. Combobox chrome binds the `--juice-combobox-*` set (input / list / option / trigger / focus-ring) from those tokens; it is not a native `<select>` restyle. Menu chrome binds the `--juice-menu-*` set (panel / item / separator / opener / focus-ring) from those tokens; it is an APG menu button, not a popover, combobox, or native `<select>`. Switch chrome binds the `--juice-switch-*` set (track / track-checked / thumb / thumb-checked / focus-ring) from those tokens; it is an APG switch, not a checkbox, menuitemcheckbox, or native checkbox restyle as the only story. Banner chrome binds the lean `--juice-banner-*` set (panel / panel-border / ink / close / status accents — no panel-shadow) from those tokens; layout is `[banner]` / `[banner="full"]`, status is `[banner-tone]`.
5. Optional accordion/tabs hooks are bound only when the chrome needs them (Tide FAQ pills). Omitting them is valid.
6. Standalone `blur="sm|md"` and `variant="monochromatic|glass|tinted"` are left to core. No second per-theme blur scale or `--juice-variant-*` family.
7. Semantic defaults and named-surface recipes stay on the identity layer. `stack` / `row` / `grid` / `gap` are untouched.
8. The app imports core CSS plus the theme stylesheet and sets `theme="<id>"` on the root.
9. Swapping `theme` on unchanged markup retints accordion, tabs, modal chrome, drawer chrome, toast chrome, banner chrome, popover chrome, tooltip chrome, combobox chrome, menu chrome, switch chrome, slider chrome, checkbox chrome, radio chrome, breadcrumb chrome, progress chrome, wizard chrome, `surfaceTone`, `borderStrength`, `shadowTone`, `overlay`, and `variant` recipes without fighting layout.

How to generate, import, and map tokens is in [Theme authoring](./juice-theme-authoring.md) and the [theme manual](./juice-theme-manual.md).

## Status

This is Priority 2 through remaining depth slice C plus modal A→B→C, drawer A→B→C, toast A→B→C, popover A→B→C, wizard A→B→C, tooltip A→B→C, combobox A→B→C, banner A→B→C, menu A→B→C, switch A→B→C, slider A→B→C, checkbox A→B→C, radio A→B→C, breadcrumb A→B→C, and progress A→B→C (theme chrome, runtime, and runtime docs): the checklist plus automated bind tests, including `shadowTone`, `overlay`, `variant` recipes, `--juice-modal-*`, `--juice-drawer-*`, `--juice-toast-*`, `--juice-banner-*`, `--juice-popover-*`, `--juice-tooltip-*`, `--juice-combobox-*`, `--juice-menu-*`, `--juice-switch-*`, `--juice-slider-*`, `--juice-checkbox-*`, `--juice-radio-*`, `--juice-breadcrumb-*`, `--juice-progress-*`, and `--juice-wizard-*`. Checkbox and radio are two runtimes. Breadcrumb is a light trail. Progress is a progressbar. Blush, CLI, and publish are out of scope here.
