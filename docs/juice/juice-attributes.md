# Juice Attributes Reference

This document provides a reference for the HTML attributes currently supported by Juice.

## Overview

Juice uses HTML attributes to apply styles directly in markup. Attributes are grouped by category: layout, typography, colors, spacing, sizing, shadows, gradients, icons, and components.

## Layout Attributes

### Stack and Flow

- `stack`: creates a vertical flex container
- `row`: creates a horizontal flex container
- `reverse`: reverses direction when combined with `stack` or `row`
- `centered`: centers content and applies alignment helpers

### Grid

- `grid`: creates a CSS grid with predefined templates
  Values: `"2x2"`, `"3x2"`, `"3x3"`, `"4x3"`, `"4x4"`
- `span`: spans grid columns or rows
  Values: `"1"`, `"2"`, `"3"`, `"4"`, `"5"`, `"6"`

### Container and Layout Helpers

- `container`: responsive container helper
- `content`: content-width layout helper
- `bleed`: full-bleed layout helper
- `zone`: layout zoning helper
- `center`: centers inline content through wrapper layout helpers
- `left`: left-aligns wrapper content
- `right`: right-aligns wrapper content

### Positioning

- `position`
  Values: `"toBack"`, `"toFront"`, `"absolute"`
- `float`
  Values: `"left"`

### Spacing Within Layout

- `gap`
  Values: `"1"` through `"10"` and generated explicit values like `"2rem"`, `"24px"`, and `"10%"`
- `space`
  Values: `"between"`, `"around"`, `"evenly"`, `"start"`, `"end"`

## Typography Attributes

First-class attributes. The size scale is real CSS, not font-dependent. Canonical rules: [Typography Contract](./juice-typography-contract.md).

- `font`: face alias
  Values: shipped Google, Adobe, and custom aliases such as `"bebas-neue"`, `"lato"`, `"oswald"`, `"playfair-display"`, `"source-code-pro"`, `"korolev-rounded"`, `"korolev-rounded-bold"`
- `fontSize`: stepped size from `libraries/juice/src/core/typography.scss`
  Values: `"sm"` (`0.75rem`), `"md"` (`1.25rem`), `"lg"` (`1.5rem`), `"xl"` (`2rem`), `"xxl"` (`3rem`)
- `fontColor`: token-backed text color
  Values: palette steps such as `"obsidian-900"`, `"gray-700"`, `"white-100"`
- `lineHeight`: explicit leading
  Values: `"1rem"` through `"10rem"`
- `fontWeight`: numeric weight
  Values: `"100"` through `"900"`

Display / title / body / caption are hierarchy roles mapped onto `fontSize` + `font`, not attributes. Under a theme, omit `font=` and let body / heading defaults apply; set `font=` (or `fontColor` / `fontWeight` / `lineHeight`) only for a local override. Those author attrs beat theme semantic defaults on `h1`–`h6` / `p` — see the contract.

Secondary (shipped, limited):

- `weight`: `"normal"` only, and only with `font="Inter"`. Prefer `fontWeight`.
- `align`: `"center"`, `"right"`, `"justify"` — `p` only
- `decoration`: `"underline"` — `p` only
- `leading`: `"1px"` through `"10px"` — this is `letter-spacing`, not line-height

For the full font list, see [Typography Reference](./juice-typography.md).

## Color Attributes

Color attributes use token names from the Juice color system.

- `fontColor`: sets text color
- `bgColor`: sets background color
- `borderColor`: sets border color
- `hover`: sets hover background or border color
- `shadow`: sets the shadow color custom property used by `depth`

Examples:

- `"green-500"`
- `"white-100"`
- `"obsidian-900"`
- `"skyblue-400"`
- `"bubblegum-300"`

For the full palette, see [Colors Reference](./juice-colors.md).

## Shadow Attributes

- `depth`
  Values: `"sm"`, `"md"`, `"lg"`, `"xl"`

Use `depth` together with `shadow="..."` for a tinted shadow.

## Shape Attributes

- `rounded`
  Values: boolean, `"sm"`, `"md"`, `"lg"`

## Gradient Attributes

- `gradient`
  Values depend on the gradient tokens present in Juice, such as `"citrusmint-300"` or other named gradient families.

## Spacing Attributes

Spacing attributes accept values generated from the utility system.

- `padding`
- `margin`
- `margin-top`
- `margin-bottom`
- `margin-left`
- `margin-right`

Examples:

- `padding="2rem"`
- `padding="24px"`
- `margin="10%"`
- `margin-top="1rem"`

For more detail, see [Spacing Reference](./juice-spacing.md).

## Sizing Attributes

- `width`
  Supports generated `%`, `rem`, and `vw` values
- `height`
  Supports generated `%`, `rem`, and `vh` values

Examples:

- `width="50%"`
- `width="24rem"`
- `height="100vh"`
- `height="40vh"`

For more detail, see [Sizing Reference](./juice-sizing.md).

## Surface Attributes

- `surfaceTone`
  Values: `"soft"`, `"strong"`, `"muted"`
- `borderStrength`
  Values: `"soft"`, `"bold"`
- `blur`
  Values: `"sm"` (`6px`), `"md"` (`16px`)
- `shadowTone`
  Values: `"cool"`, `"warm"`
- `overlay`
  Values: `"frost"`, `"tint"`
- `variant`
  Values: `"monochromatic"`, `"glass"`, `"tinted"`

Theme paint uses `--juice-surface-<tone>-bg|border|shadow|blur`, `--juice-border-strength-<soft|bold>-width|color`, `--juice-shadow-tone-<cool|warm>-color|shadow`, and `--juice-overlay-<frost|tint>-wash|layer` roles. Unthemed fallbacks keep the original light frost for `soft` tones, a gray hairline / heavier rule for strength, a bluish / amber-ish drop for shadow tone, and a white veil / bluish wash for overlay. `borderStrength` composes with `surfaceTone` (width only) and optional `borderColor` swatches. Standalone `blur` applies `backdrop-filter` and overrides a tone's blur length when both are set, without wiping tone fill / border / shadow. `shadowTone` paints shadow cast color / temperature only; with `[shadow][depth]` it sets `--shadow-color` and leaves geometry to `depth`. `overlay` paints a frost / tint wash via `background-image` only, so `surfaceTone` fill and `bgColor` swatches stay. `variant` recipes compose those same roles (`glass` = frost overlay + soft-tone frost, `tinted` = tint overlay, `monochromatic` = soft hairline + restrained shadow). When a recipe and a finer attr are both set, the finer attr wins its property. Optional `--juice-blur-sm` / `--juice-blur-md` restyles; themes do not bind a second blur scale or a `--juice-variant-*` family. See [Surfaces](./juice-surfaces.md).

## Icon Attributes

First-class:

- `icon`: applies a FontAwesome Free icon mask
  Values: any icon key that exists in the Juice solid, regular, or brands sets
- `iconcolor`: applies icon color through Juice's icon color selectors
  Values: token-backed color values such as `"red-800"`, `"gray-900"`, or `"freshgreen-600"`
- `iconSize`: stepped icon size
  Values: `"xxs"` (10px), `"xs"` (12px), `"sm"` (24px), `"md"` (36px), `"lg"` (48px), `"xl"` (60px), `"xxl"` (72px)

Set selection:

- `lib`: `"solid"` is required for solid icons. `"regular"` and `"brands"` document intent; those sets match on `icon` alone.

Escape hatch:

- `width` / `height`: custom size when the `iconSize` scale is not enough. Set both. These utilities compile after the icon rules, so they win over the default and `iconSize`. rem / vw / vh values still follow the shared responsive scale; `iconSize` does not.

Default: `[icon]` is `1rem × 1rem` when neither `iconSize` nor `width` / `height` is set. There is no `[icon]` mobile size remap.

Color: `iconcolor` sets `color`; the mask uses `background-color: currentColor`. With no `iconcolor`, the icon inherits parent `color`. Do not use `fontColor` as the icon API.

Examples:

- `"check"`
- `"calendar"`
- `"github"`
- `"shopify"`
- `"shield-halved"`

For more detail, see [Icons](./juice-icons.md).

## Component Attributes

### Buttons

- `btn`
  Values: `"flat"`, `"outline"`, `"text"`, `"3d"`, `"metallic"`
- `scale`
  Values currently include `"lg"` for button sizing
- `theme`
  Example: `"citrusmint-300"`
- `outline`
  Boolean modifier

### Icon button

Square icon-only control on the existing button chrome. Color, border, and hover fill stay with `button` and `btn`. Geometry is `[icon-button]`.

- `icon-button`
  Values: boolean, or `"round"` for a circle
- `round`
  On `[icon-button]`, same circle as `icon-button="round"`
- `scale`
  `"sm"` and `"lg"` keep the control square and step the icon. Unmarked scale matches a default button.
- `pressed`
  Visual toggle. `aria-pressed="true"` paints the same state. On `[icon-button][toggle]`, the runtime keeps `[pressed]` and `aria-pressed` together. Without `[toggle]`, `[pressed]` stays visual.

Core owns the defaults (button block padding, plus the icon default). Shipped themes do not bind them.

| Role | Default |
|---|---|
| `--juice-icon-button-padding` / `-sm` / `-lg` | `0.625rem` / `0.4rem` / `0.875rem` |
| `--juice-icon-button-icon-size` / `-sm` / `-lg` | `1.25rem` / `1rem` / `1.5rem` |
| `--juice-icon-button-size` / `-sm` / `-lg` | icon size + padding × 2 |
| `--juice-icon-button-radius` / `-sm` / `-lg` | `0.5rem` / `0.375rem` / `0.625rem` |
| `--juice-icon-button-radius-round` | `999px` |
| `--juice-icon-button-focus-ring` | `currentColor` |

`:active` uses the same `translateY(2px)` press as `[btn="3d"]`. Transitions use `--juice-motion-*`. Authors supply the accessible name.

```html
<button type="button" icon-button btn="outline" scale="sm" aria-label="Close">
  <i icon="xmark" lib="solid"></i>
</button>
<button type="button" icon-button="round" aria-pressed="true" aria-label="Bold">
  <i icon="bold" lib="solid"></i>
</button>
```

The runtime auto-enhances this markup. `[toggle]` flips `aria-pressed` and `[pressed]`. A missing accessible name warns once in development and is not invented. `title` does not count. See [Icon Button Runtime](./juice-icon-button-runtime.md). Icon button is the twenty-sixth Emerging auto-enhance runtime and is on master, not in the published npm 0.9.2 release.

### Cards

- `card`
  Values: boolean, `"compact"`, `"feature"`, `"interactive"`, `"split"`, `"cta"`, `"pricing"`, `"large"`, `"muted"`, `"hero"`
- `size`
  Values: `"sm"`, `"md"`, `"lg"` (on a `[card]`, scoped via `[card][size="md"]`)
- `padding`
  Values: `"sm"`, `"md"`, `"lg"`, or numeric (`"2rem"`, `"24px"`)
- `flow`
  Values: `"vertical"`, `"horizontal"`

Card region children use bare slot names. Their meaning is scoped through the parent `[card]` selector.

- `header` — top region
- `body` — main content region
- `action` — action row for buttons and CTAs
- `meta` — supporting metadata row
- `media` — icons, illustrations, or images
- `divider` — visual divider

For more detail, see [Cards](./juice-cards.md) and [Naming](./juice-naming.md).

### State flags

Boolean attributes that mark structural state. Themes decide their visual treatment.

- `featured` — emphasized element (e.g. the highlighted pricing tier)
- `active` — currently selected
- `warm` — softer visual emphasis
- `full` — full-width control
- `recommended` — promoted item in a list

### Forms

- `field`
  Boolean form-field marker
- `type`
  Form usage varies by component context

### Navigation

- `sticky`
  Boolean modifier
- `fixed`
  Boolean modifier

### Accordion

- `accordion` — widget root; required for the disclosure runtime
- `accordion-item` — trigger inside an `[accordion]` root

See [Accordion Runtime](./juice-accordion-runtime.md). Theme paint uses `--juice-accordion-*` roles.

### Tabs

- `tabs` — widget root; required for the tabs runtime
- `tabs-list` — horizontal tab strip (`role="tablist"`)
- `tab` — tab trigger (`role="tab"`); may also be a direct-child `button`
- `tab-panel` — panel paired with a trigger (`role="tabpanel"`)
- `active` — selected trigger (dual-written with `aria-selected="true"`)
- `name` — optional root label used for the tablist accessible name and generated ids

See [Tabs Runtime](./juice-tabs-runtime.md). Theme paint uses `--juice-tabs-*` roles (`trigger`, `trigger-hover`, `trigger-active`, `text`, `text-hover`, `text-active`, `indicator`, `list-rule`, `focus-ring`, plus optional `panel` / `panel-rule`).

### Modal

- `modal-overlay` — widget root / full-viewport scrim; required for the dialog runtime. Hide with the native `hidden` attribute. Value `"static"` opts out of backdrop-click close
- `modal` — dialog panel (`role="dialog"`); optional values `"sm"` / `"lg"` for width
- `modal-header` — title / lead region
- `modal-body` — main content region
- `modal-close` — dismiss control (surface paint, not a CTA)
- `name` — optional overlay label used as the slug for generated ids

Openers pair through `aria-controls` pointing at the overlay `id`. There is no extra Juice opener attribute.

See [Modal Runtime](./juice-modal-runtime.md). Theme paint uses `--juice-modal-*` roles (`overlay`, `panel`, `panel-border`, `panel-shadow`, `close`, `close-color`, `close-hover`, `focus-ring`). This is not the surface `overlay="frost|tint"` utility.

### Drawer

- `drawer-overlay` — widget root / full-viewport scrim; required for the dialog runtime. Hide with the native `hidden` attribute. Value `"static"` opts out of backdrop-click close
- `drawer` — edge-docked dialog panel (`role="dialog"`); values `"left"` / `"right"` (bare or unspecified is right)
- `drawer-size` — optional width; values `"sm"` / `"lg"` (default `22rem`, `sm` `16rem`, `lg` `32rem`). Do not put size on the `drawer` attribute
- `drawer-header` — title / lead region
- `drawer-body` — main content region
- `drawer-close` — dismiss control (surface paint, not a CTA)
- `name` — optional overlay label used as the slug for generated ids

Openers pair through `aria-controls` pointing at the overlay `id`. There is no extra Juice opener attribute.

See [Drawer Runtime](./juice-drawer-runtime.md). Theme paint uses `--juice-drawer-*` roles (`overlay`, `panel`, `panel-border`, `panel-shadow`, `close`, `close-color`, `close-hover`, `focus-ring`). This is not the surface `overlay="frost|tint"` utility, and not `[modal-overlay]`.

### Toast

- `toast-region` — fixed stack container (`aria-live="polite"`). Values `"top-right"` / `"top-left"` / `"bottom-right"` / `"bottom-left"` (bare or unspecified is top-right). Stays in the DOM
- `toast` — one notification panel (`role="status"`, or `role="alert"` for `toast="error"` / assertive). Values `"success"` / `"error"` / `"info"` / `"warning"` (bare `[toast]` is neutral). Hide with the native `hidden` attribute
- `toast-title` — optional title line
- `toast-body` — message content
- `toast-close` — dismiss control (surface paint, not a CTA). The toast runtime wires click / keyboard dismiss
- `toast-duration` — optional auto-dismiss override in milliseconds (`"3000"`). `"0"`, `"Infinity"`, or a negative number is sticky
- `toast-live` — optional `"assertive"` on the region or a toast (or set `aria-live="assertive"` in markup)

Toast is non-modal feedback. It is not a dialog overlay and not the surface `overlay="frost|tint"` utility. Authors place `[toast-region]` in markup; the runtime does not invent a portal.

See [Toast Runtime](./juice-toast-runtime.md). Theme paint uses `--juice-toast-*` roles (`panel`, `panel-border`, `panel-shadow`, `ink`, `close`, `close-color`, `close-hover`, `focus-ring`, plus `success` / `success-soft`, `error` / `error-soft`, `info` / `info-soft`, `warning` / `warning-soft`).

### Banner

- `banner` — inline alert / callout (`role="status"`, or `role="alert"` for `banner-tone="error|warning"`). Value `"full"` is edge-to-edge layout (width 100%, no radius). Bare `[banner]` is inset. Hide with the native `hidden` attribute
- `banner-tone` — optional status paint; values `"info"` / `"success"` / `"warning"` / `"error"`. Bare `[banner]` without `banner-tone` is neutral. Do not put status on the `banner` attribute — that slot is layout (`full`)
- `banner-body` — message content
- `banner-close` — dismiss control (surface paint, not a CTA). The banner runtime wires click / keyboard dismiss
- `banner-persist` — optional `"session"` / `"local"` remember-dismiss when `name` or `id` is set
- `name` — optional persist key (falls back to `id`)

Banner is an inline alert / callout. It is not a toast stack, not a dialog overlay, and not the surface `overlay="frost|tint"` utility. Compose layout and status: `<div banner="full" banner-tone="warning">`. The runtime auto-enhances that markup (`show` / `dismiss`); there is no focus trap and no Escape steal.

See [Banner Runtime](./juice-banner-runtime.md). Theme paint uses `--juice-banner-*` roles (`panel`, `panel-border`, `ink`, `close`, `close-color`, `close-hover`, `focus-ring`, plus `success` / `success-soft`, `error` / `error-soft`, `info` / `info-soft`, `warning` / `warning-soft`). There is no panel-shadow role.

### Popover

- `popover-root` — positioning wrapper / widget root. Hide with the native `hidden` attribute. Values `"top"` / `"bottom"` / `"left"` / `"right"` (bare or unspecified is bottom). The runtime positions the root and flips once to the opposite side if the preferred side overflows
- `popover-panel` — floating surface (`role="dialog"` without `aria-modal`). Never a bare `popover` attribute
- `popover-header` — optional title
- `popover-body` — optional body
- `popover-close` — dismiss control (surface paint, not a CTA)

Openers pair through `aria-controls` pointing at the root `id`. There is no extra Juice opener attribute.

Popover is a non-modal anchored panel. It is not a modal dialog, not a drawer, not a toast stack, and not the surface `overlay="frost|tint"` utility.

See [Popover Runtime](./juice-popover-runtime.md). Theme paint uses `--juice-popover-*` roles (`panel`, `panel-border`, `panel-shadow`, `ink`, `close`, `close-color`, `close-hover`, `focus-ring`).

### Tooltip

- `tooltip-root` — positioning wrapper / widget root. Hide with the native `hidden` attribute. Values `"top"` / `"bottom"` / `"left"` / `"right"` (bare or unspecified is top). The runtime positions the root and flips once to the opposite side if the preferred side overflows
- `tooltip-panel` — tip surface (`role="tooltip"`). Never a bare `tooltip` attribute, and not the native `title` attribute

Triggers pair through `aria-describedby` pointing at the root `id` (preferred). `aria-controls` is also accepted. There is no extra Juice trigger attribute.

Tooltip is a hover/focus tip. It is not a popover, not a modal dialog, not a drawer, not a toast stack, and not the surface `overlay="frost|tint"` utility. There is no close button, no focus trap, and focus never moves into the tip.

See [Tooltip Runtime](./juice-tooltip-runtime.md). Theme paint uses `--juice-tooltip-*` roles (`panel`, `panel-border`, `panel-shadow`, `ink`).

### Combobox

- `combobox` — composite root / widget root; required for the listbox runtime
- `combobox-input` — text field (`role="combobox"`). Open on focus or typing. Authors must supply an accessible name (`<label>`, `aria-label`, or `aria-labelledby`); the runtime does not
- `combobox-trigger` — optional chevron button (surface paint, not a CTA). Toggles the list
- `combobox-list` — popup listbox (`role="listbox"`). Hide with the native `hidden` attribute
- `combobox-option` — option row (`role="option"`). Value `"active"` is keyboard / visual focus. Committed choice is `aria-selected="true"`
- `name` — optional root slug for generated ids. Not an accessible name

Filter is a case-insensitive substring against option text and, when present, `data-value`. Non-matches get `hidden`. Select writes option text, or `data-value` when that attribute is present. Single-select only.

Combobox is an input + listbox popup. It is not a native `<select>`, not a popover, not a tooltip, not a dialog overlay, and not the surface `overlay="frost|tint"` utility. Placement is CSS-only (absolute under the field).

See [Combobox Runtime](./juice-combobox-runtime.md). Theme paint uses `--juice-combobox-*` roles (`input`, `input-border`, `input-ink`, `list`, `list-border`, `list-shadow`, `option`, `option-hover`, `option-selected`, `option-ink`, `trigger`, `trigger-ink`, `focus-ring`).

### Menu

- `menu-root` — composite wrapper (opener + panel); required for the menu-button runtime. Values `"top"` / `"bottom"` / `"left"` / `"right"` (bare or unspecified is bottom). CSS-absolute placement of `[menu]`; no Floating UI
- `menu-button` — optional opener chrome (surface paint, not a CTA). Authors who want a themed CTA opener omit this attr and use a plain button inside `[menu-root]`
- `menu` — the menu panel (`role="menu"`). Hide with the native `hidden` attribute. A boolean `[menu]` attribute is fine: there is no HTML global `menu` attribute, and unlike `popover=""` it has no platform behavior. Do not use the HTML `<menu>` element
- `menuitem` — item row (`role="menuitem"`). Value `"active"` is keyboard / visual focus (roving tabindex)
- `menu-separator` — non-interactive divider (`role="separator"`)
- `menu-label` — non-interactive group label
- `name` — optional root slug for generated ids

Pairing is wrapped: `[menu-root]` contains the opener and `[menu]`. The runtime fills opener `aria-haspopup="menu"` plus `aria-controls` pointing at the `[menu]` id. Closed vs open is `hidden` on `[menu]`, not the root.

Menu is an APG menu button. It is not a popover, not a combobox, not a native `<select>`, not a menubar, not a context menu, and not the surface `overlay="frost|tint"` utility. Placement is CSS-only (absolute from the root). No submenus and no typeahead in v1. The runtime auto-enhances that markup (`open` / `close` / `toggle` / `select`); Escape sits with popover (yields to modal/drawer). There is no focus trap and no Sig Menu factory.

See [Menu Runtime](./juice-menu-runtime.md). Theme paint uses `--juice-menu-*` roles (`panel`, `panel-border`, `panel-shadow`, `ink`, `item`, `item-hover`, `item-active`, `separator`, `focus-ring`, `opener`, `opener-ink`).

### Switch

- `switch` — the control root (boolean attr). Primary host is `<button type="button" switch>`. The runtime fills `role="switch"` and `aria-checked` `"true"`|`"false"`. A boolean `[switch]` attribute is fine: there is no HTML global `switch` attribute. WebKit's checkbox `switch` attr is an opt-in on `<input type="checkbox">`, not a global; Juice `[switch]` on that host is a valid secondary story (`:checked` paints it, and the runtime keeps `aria-checked` in lockstep). Do not restyle bare `[role="switch"]`

Checked paint is `aria-checked="true"` so chrome and runtime share one story. There is no `switch="on"`. Track and thumb are CSS pseudo-elements on `[switch]` (the host is the track; `::after` is the thumb). There are no `[switch-track]` / `[switch-thumb]` children, no `switch-size`, and `scale` does not change track/thumb geometry. Visible labels live beside the control (`<label>`, `aria-label`, or `aria-labelledby`). Authors must supply that name — the runtime does not invent one.

Switch is an APG switch (toggle). It is not a form checkbox as the only story, not a native `<input type="checkbox">` restyle as the only story, not a menu `menuitemcheckbox`, and not the surface `overlay="frost|tint"` utility. Inline control — no overlay z-index. The runtime auto-enhances button (and checkbox) `[switch]` markup (`toggle` / `check` / `uncheck` / `setChecked`); there is no focus trap, no Escape steal, and no tri-state. No Sig Switch factory.

See [Switch Runtime](./juice-switch-runtime.md). Theme paint uses `--juice-switch-*` roles (`track`, `track-checked`, `thumb`, `thumb-checked`, `focus-ring`).

### Checkbox

- `checkbox` — the control root (boolean attr). Primary host is `<button type="button" checkbox>`. A native `<input type="checkbox" checkbox>` is allowed when you want `:checked` paint. A boolean `[checkbox]` attribute is fine: there is no HTML global `checkbox` attribute. Do not restyle bare `[role="checkbox"]`

Checked paint is `aria-checked="true"` so chrome and runtime share one story. `:checked` covers the native host. The host is the box; `::after` is the checkmark. There is no `checkbox-size`, and `scale` does not change box geometry. Visible labels live beside the control (`<label>`, `aria-label`, or `aria-labelledby`). Authors must supply that name.

Checkbox is an APG checkbox (binary). It is not `[switch]`, not a native `<input type="checkbox">` restyle as the only story, not a menu `menuitemcheckbox`, and not the surface `overlay="frost|tint"` utility. v1 does not paint `aria-checked="mixed"`. Inline control — no overlay z-index. The runtime auto-enhances button and native `[checkbox]` markup (`toggle` / `check` / `uncheck` / `setChecked` / `isChecked`, binary `aria-checked`). Click and Enter/Space toggle. Native `disabled` and `aria-disabled="true"` are ignored. Authors must supply the accessible name. There is no focus trap, no Escape steal, and no tri-state. No Sig Checkbox factory.

See [Checkbox Runtime](./juice-checkbox-runtime.md). Theme paint uses `--juice-checkbox-*` roles (`control`, `control-checked`, `border`, `border-checked`, `mark`, `focus-ring`).

### Radio

- `radiogroup` — group root. Layout only (`stack` / `row` / `gap`). No `--juice-radiogroup-*` roles. The runtime fills `role="radiogroup"` and exclusive selection
- `radio` — one option (boolean attr). Primary host is `<button type="button" radio>`. A native `<input type="radio" radio>` is allowed when you want `:checked` paint. A boolean `[radio]` attribute is fine: there is no HTML global `radio` attribute. Do not restyle bare `[role="radio"]` or `[role="radiogroup"]`

Checked paint is `aria-checked="true"`. `:checked` covers the native host. The host is the disc; `::after` is the dot. There is no `radio-size`, and `scale` does not change disc geometry. Visible labels live beside the option (`<label>`, `aria-label`, or `aria-labelledby`). Authors must supply the group name and each option name — the runtime does not invent one.

Radio is an APG radio in a radiogroup. It is not `[switch]`, not `[checkbox]`, not a native `<input type="radio">` restyle as the only story, and not the surface `overlay="frost|tint"` utility. Inline control — no overlay z-index. The runtime auto-enhances `[radio]` options inside `[radiogroup]` (`select` / `getChecked`, exclusive selection, roving tabindex). Click, Enter, and Space select. Arrow keys move among enabled options and wrap. Orphans outside `[radiogroup]` are ignored. Exclusivity is the nearest group, not the native input `name`. There is no focus trap and no Escape. No Sig Radio factory.

See [Radio Runtime](./juice-radio-runtime.md). Theme paint uses `--juice-radio-*` roles (`control`, `control-checked`, `border`, `border-checked`, `mark`, `focus-ring`).

### Breadcrumb

- `breadcrumb` — trail root (boolean attr) on `<nav breadcrumb>` or `<ol breadcrumb>`. A boolean `[breadcrumb]` attribute is fine: there is no HTML global `breadcrumb` attribute
- `breadcrumb-item` — one crumb
- `breadcrumb-link` — optional. Anchors inside the trail are enough
- `breadcrumb-separator` — optional explicit separator. When present, it replaces the generated chevron. Authors should aria-hide a custom glyph

The separator is `::after` on every item except the last: a decorative chevron (empty content). Current page is `aria-current="page"` on the last item or its link. Do not style bare `[aria-current="page"]` outside the trail. `nav[type="breadcrumb"]` is an older layout pattern and is not this chrome.

Breadcrumb is an APG-inspired navigation trail. It is not the site `[nav]` / navigation runtime, not tabs, not the wizard step tracker, and not pagination. Inline nav chrome — no overlay z-index. The runtime auto-enhances `[breadcrumb]` (`sync` / `setCurrent`): an unlabeled navigation landmark is named `Breadcrumb`, and a single `aria-current="page"` stays on the trail. It does not remove `href`, trap focus, steal Escape, or listen to history. `<ol breadcrumb>` stays a list. No Sig Breadcrumb factory.

See [Breadcrumb Runtime](./juice-breadcrumb-runtime.md). Theme paint uses `--juice-breadcrumb-*` roles (`ink`, `ink-current`, `ink-hover`, `separator`, `focus-ring`, `surface`). Shipped themes bind `surface` to `transparent` so the trail stays inline. Point that role at a surface token when crumbs sit on a bar.

### Slider

- `slider` — track host. Boolean attr, or `slider="horizontal"`. `slider="vertical"` is later; this slice does not paint or enhance a vertical axis. A boolean `[slider]` attribute is fine: there is no HTML global `slider` attribute. Do not restyle bare `[role="slider"]`
- `slider-fill` — completed portion of the range. Optional
- `slider-thumb` — thumb child. Required for the runtime. The thumb is the APG slider: sync writes `role="slider"`, `aria-valuemin` / `aria-valuemax` / `aria-valuenow`, and `aria-orientation="horizontal"`

There is no `[slider-track]`: `[slider]` is the track host. There is no `slider-value` attribute and no `slider-size`. `scale` does not change track or thumb geometry.

Value paint aligns with ARIA. Integer `aria-valuenow` from 0 through 100 paints the fill and thumb when `aria-valuemin` / `aria-valuemax` are omitted or are `0` / `100`. Put those attributes on `[slider]` or on `[slider-thumb]` (the thumb wins when both are set — that is the APG focus target). The runtime also writes the structural paint hook `--juice-slider-ratio` (unitless 0–1) on `[slider]` for every range. That hook is not a theme role and not an author attribute. Authors must supply the accessible name — the runtime does not invent one, and it does not invent or rewrite `aria-valuetext`.

Slider is an APG slider. It is not a native `<input type="range">` restyle as the only story (a range input cannot host a thumb child), not a progress meter (no thumb / not interactive), not a scrollbar, and not the surface `overlay="frost|tint"` utility. Inline control — no overlay z-index. The runtime auto-enhances horizontal `[slider]` markup that owns a `[slider-thumb]` (`setValue` / `getValue` / `increment` / `decrement`, arrows / Home / End / PageUp / PageDown, pointer jump and drag). v1 is horizontal and single-thumb: no vertical, no multi-thumb, no focus trap, and no Escape. No Sig Slider factory.

See [Slider Runtime](./juice-slider-runtime.md). Theme paint uses `--juice-slider-*` roles (`track`, `track-border`, `fill`, `thumb`, `thumb-border`, `thumb-shadow`, `focus-ring`).

### Progress

- `progress` — track host. Boolean attr is determinate. `progress="indeterminate"` is the busy state. A boolean `[progress]` attribute is fine: there is no HTML global `progress` attribute. `[progress]` is an attribute selector, not the type selector `progress`. Authors write `<div progress>`, not `<progress>`. Do not restyle bare `[role="progressbar"]`
- `progress-fill` — filled portion. Same idea as `slider-fill`. There is no `progress-bar` and no `progress-track`
- `progress-label` — optional value text. Uses ink. Authors own the accessible name

Integer `aria-valuenow` from 0 through 100 on the host paints the fill when min/max are omitted or are `0` / `100`. Other ranges use the structural paint hook `--juice-progress-ratio` (unitless 0–1) on `[progress]`. That hook is not a theme role. Missing `aria-valuenow` is an empty determinate bar, not indeterminate. `progress="indeterminate"` slides `[progress-fill]` and wins over a stale value. `prefers-reduced-motion` stops that animation.

Progress is an APG-inspired progressbar. It is not a slider, not a spinner-only loader, not a native `<progress>` restyle as the only story, and not the surface `overlay="frost|tint"` utility. Inline status chrome — no overlay z-index. The host is usually not focusable. The runtime auto-enhances `[progress]` (`setValue` / `getValue` / `setIndeterminate`, `role="progressbar"`, min / max / now, `--juice-progress-ratio`). Indeterminate markup omits `aria-valuenow`. Authors supply the accessible name. The runtime does not invent or rewrite `aria-valuetext`. There is no Sig Progress factory.

See [Progress Runtime](./juice-progress-runtime.md). Theme paint uses `--juice-progress-*` roles (`track`, `track-border`, `fill`, `ink`, `focus-ring`).

### Pagination

- `pagination` — page-set root (boolean attr) on `<nav pagination>` or `<ol pagination>`. A boolean `[pagination]` attribute is fine: there is no HTML global `pagination` attribute. The trail background stays transparent. Do not restyle bare `[aria-current="page"]`
- `pagination-item` — one cell. Layout only, not a chip
- `pagination-link` — optional. Anchors and buttons inside the control are enough
- `pagination-prev` — previous control. Same chip as a page. Mark the anchor, the button, or the item that wraps it
- `pagination-next` — next control. Same idea as prev
- `pagination-ellipsis` — optional gap marker. Not a chip and not a link. Authors should aria-hide the glyph
- `pagination-status` — optional "Page 2 of 12" text. Uses ink

Current page is `aria-current="page"` on the control or its item. Disabled prev/next is `aria-disabled="true"`, native `disabled`, or `[disabled]`. Hover does not brighten a disabled control. `nav[type="pagination"]` is an older layout pattern and is not this chrome.

Pagination is an APG-inspired page set. It is not the site `[nav]` / navigation runtime, not a breadcrumb, not tabs, not the wizard step tracker, and not the surface `overlay="frost|tint"` utility. Inline nav chrome — no overlay z-index. The runtime auto-enhances `[pagination]` (`sync` / `setCurrent`): an unlabeled navigation landmark is named `Pagination`, and a single `aria-current="page"` stays on the set (author current wins; otherwise the first page control). Prev/next disable at ends when page controls and optional ellipsis make that inferable. Author-owned disabled is kept. Arrow / Home / End move focus among enabled controls. Enter and Space stay with the browser. It does not remove `href`, trap focus, steal Escape, or listen to history. `<ol pagination>` stays a list. No Sig Pagination factory. Pagination is the nineteenth Emerging auto-enhance runtime.

See [Pagination Runtime](./juice-pagination-runtime.md). Theme paint uses `--juice-pagination-*` roles (`surface`, `surface-hover`, `surface-current`, `ink`, `ink-hover`, `ink-current`, `ink-disabled`, `border`, `focus-ring`, `ellipsis`). `surface` is the page control, not a bar.

### Disclosure

- `disclosure` — standalone root (boolean attr). One trigger, one panel. A boolean `[disclosure]` attribute is fine: there is no HTML global `disclosure` attribute. Do not restyle bare `[aria-expanded]`, `<details>`, or `<summary>`
- `disclosure-trigger` — the button. Expanded paint is `aria-expanded="true"`
- `disclosure-panel` — the controlled region. Pair it with `aria-controls`, or place it as the next sibling of the trigger. Closed panels use the native `hidden` attribute

Disclosure is the APG Disclosure pattern. It is not an accordion (`[accordion]` / `[accordion-item]` is multi-item and multi-open) and not the surface `overlay="frost|tint"` utility. Inline chrome — no overlay z-index. The runtime auto-enhances `[disclosure]` (`sync` / `expand` / `collapse` / `toggle`): one trigger toggles one panel with `aria-expanded`, native `hidden`, and `aria-hidden`. Orphans outside the root are ignored. Click toggles. Enter and Space toggle non-button triggers. Escape collapses the focused or last-opened disclosure and yields to an open modal, drawer, or popover. There is no exclusive group, no arrow roving, and no layout `content=`. No Sig Disclosure factory. Disclosure is the twentieth Emerging auto-enhance runtime and shipped in 0.9.2.

See [Disclosure Runtime](./juice-disclosure-runtime.md). Theme paint uses `--juice-disclosure-*` roles (`surface`, `border`, `trigger`, `trigger-hover`, `trigger-open`, `ink`, `chevron`, `focus-ring`). `surface` is the panel, not a bar.

### Spinner

- `spinner` — host. The ring is `::before`. A boolean `[spinner]` attribute is fine: there is no HTML global `spinner` attribute, and there is no `<spinner>` element. Any value, including `spinner="busy"`, is still a spinner. Do not restyle bare `[role="status"]` or `[aria-busy]`
- `spinner-label` — optional visible text. Uses ink. Authors own the accessible name

CSS owns the spin (`juice-spinner-spin`). `prefers-reduced-motion` stops that animation and leaves the indicator. The host is usually not focusable.

Spinner is a standalone indeterminate busy indicator. It is not a progress bar (`[progress]` / `[progress-fill]` is a valued bar) and not a disclosure. Inline status chrome — no overlay z-index. The runtime auto-enhances `[spinner]` (`sync` / `show` / `hide` / `isShown`): a shown host is `role="status"` and `aria-busy="true"`, and `hide` sets native `hidden` and clears both so a hidden spinner does not announce as busy. A visible `[spinner-label]` is author text. The runtime does not invent `aria-label` when there is no visible label. No value, no keyboard, no Escape, and no focus trap. No Sig Spinner factory. Spinner is the twenty-first Emerging auto-enhance runtime and shipped in 0.9.2.

See [Spinner Runtime](./juice-spinner-runtime.md). Theme paint uses `--juice-spinner-*` roles (`track`, `indicator`, `ink`, `focus-ring`). `track` is the inactive ring. `indicator` is the leading arc.

### Skeleton

CSS-only loading placeholder. There is no runtime and no auto-enhance. Core CSS paints it. It is on master, not in the published npm 0.9.2 release, and it is not one of the twenty-eight Emerging auto-enhance runtimes.

- `skeleton` — host. Boolean `[skeleton]` is a rectangle, the same shape as `skeleton="rect"`. `skeleton="text"` is a line. `skeleton="circle"` is a circle. There is no HTML global `skeleton` attribute, and there is no `<skeleton>` element. Do not restyle a bare `[aria-busy]` or `[role="status"]`
- `lines` — on `[skeleton="text"]`, a count from `"1"` through `"8"`. Anything else keeps one bar. There is no `skeleton-line`
- `scale` — `"sm"` or `"lg"` steps rect height, circle size, or text line height and gap. Unmarked scale is the default role
- `static` — shimmer off. The base color stays. `prefers-reduced-motion: reduce` does the same without this attribute

Element children of `[skeleton="text"]` without `[lines]` are the lines. One child, one line. A `width` on the last child shortens it. With `[lines]`, those children are clipped copy and the mask paints the count.

Copy inside stays in the accessibility tree and does not paint. Authors own `aria-busy` on the loading region and the accessible name. Chrome does not set them.

```html
<div skeleton="rect" scale="sm"></div>
<div skeleton="text" lines="3"></div>
<span skeleton="circle" scale="lg"></span>
```

See [Skeleton](./juice-skeleton.md). Core roles are `--juice-skeleton-*` (`base`, `highlight`, `radius`, `line-height` / `-sm` / `-lg`, `line-gap` / `-sm` / `-lg`, `circle-size` / `-sm` / `-lg`, `rect-height` / `-sm` / `-lg`, `duration`). Shipped themes are not required to bind them. The highlight is a translucent white sheen. Tune `--juice-skeleton-highlight` on a pale surface.

### List

CSS-only stacked rows. There is no runtime and no auto-enhance. Core CSS paints it. It is on master, not in the published npm 0.9.2 release, and it is not one of the twenty-eight Emerging auto-enhance runtimes.

- `list` — host, on `ul`, `ol`, or `div`. The selector is `:where(ul, ol, div)[list]`, so `<input list>` is not painted. There is no HTML global `list` attribute, and there is no `<list>` element. Markers and the list’s own padding reset. Do not restyle `[role="list"]` or `[role="listitem"]`
- `divided` — on `[list]`. A hairline between direct children. Ignored without `[list]`
- `dense` — on `[list]`. Tighter row padding and a tighter slot margin. Does not change the stack gap. Ignored without `[list]`
- `list-item` — one row
- `list-leading` — start slot. Not `leading`, which is letter-spacing
- `list-content` — primary line plus an optional `list-secondary`. One unmarked element between the slots is the same primary line
- `list-secondary` — second line, nested in `list-content` or a sibling under the primary
- `list-trailing` — end slot
- `selected` — visual wash on the row or its `a` / `button`. The same wash as `aria-current` other than `"false"`. Does not set ARIA. `aria-selected` does not paint

An `a` or `button` row, or a row that wraps one, hovers, presses, and takes a 2px `currentColor` `:focus-visible` outline, offset 2px. Disabled interactive rows are `opacity: 0.5`. Authors own the accessible name and whether `aria-disabled` swallows a click.

```html
<ul list divided>
  <li list-item>
    <span list-leading><span avatar>AL</span></span>
    <div list-content>
      <span>Ada Lovelace</span>
      <span list-secondary>Analytical engine</span>
    </div>
  </li>
</ul>
```

See [List](./juice-list.md). Color roles are `--juice-list-divider` (currentColor at 28%), `--juice-list-secondary` (92%), `--juice-list-hover` (8%), and `--juice-list-selected` (14%), on `:root` and again on `[theme]`. Layout roles are `--juice-list-gap` (`0`), `--juice-list-padding` (`0.75rem 1rem`), `--juice-list-padding-dense` (`0.375rem 0.75rem`), and `--juice-list-radius` (`0.375rem`), on `:root` only. Shipped themes are not required to bind them.

### Avatar

Initials-or-photo mark. Round by default. Color comes from `--juice-avatar-*`. There is no HTML global `avatar` attribute, and there is no `<avatar>` element.

- `avatar` — host. Boolean `[avatar]` and `avatar="round"` are round. `avatar="square"` is square
- `scale` — `"sm"` or `"lg"` steps the box and the initials. Unmarked scale is `2.5rem`. There is no `"md"`
- `status` — on `[avatar]`: `"online"`, `"away"`, `"busy"`, or `"offline"`. The dot is a `::after`. Any other value does not paint a dot. `[avatar-more]` does not grow one
- `avatar-group` — overlapping row. Not a runtime host. A child `[scale]` wins and does not change the group's overlap
- `avatar-more` — overflow chip. `+N` is the text. `"round"` and `"square"` match the avatar shapes. Not a runtime host
- `fallback` — runtime state on `[avatar]` when no photo is showing and none is still loading. Core CSS does not paint from it

An `<img>` inside `[avatar]` covers the initials. The runtime hides a broken, empty, or already-failed image and sets `[fallback]`. A later load clears both. An empty `src` with a real `srcset` waits.

```html
<span avatar aria-label="Ada Lovelace">AL</span>
<span avatar="square" scale="sm" status="online">
  <img alt="" src="ada.png">
  <span>AL</span>
</span>
<div avatar-group>
  <span avatar>AL</span>
  <span avatar-more>+3</span>
</div>
```

The runtime auto-enhances `[avatar]`. It does not touch `alt`, labels, or initials. The status dot needs a text equivalent. The `+N` chip is plain text. See [Avatar](./juice-avatar.md). Avatar is the twenty-seventh Emerging auto-enhance runtime and is on master, not in the published npm 0.9.2 release.

### Table

Native grid. The host is `<table table>` (`:where(table)[table]`). `<div table>` is not painted. Color comes from `--juice-table-*`. There is no HTML global `table` attribute.

- `table` — host, on `<table>`. Separate borders, one grid. The plate is `--juice-surface-strong-bg` (white fallback)
- `striped` — even `tbody` rows take the stripe wash. Ignored without `[table]`
- `dense` — tighter cell and caption padding. Ignored without `[table]`
- `sticky` — `thead` cells stick to the top of the scrollport. Inside `[table-scroll]` they stick to the wrapper. Omit the wrapper for page sticky. Set `max-height` on the wrapper when the body should scroll under the head
- `table-scroll` — horizontal scroll wrapper. Authors add `tabindex="0"`, `role="region"`, and an accessible name
- `table-align` — `"start"`, `"center"`, or `"end"` on a `th` or `td`. Logical alignment. Not `[center]`, `[left]`, or `[right]`
- `numeric` — `font-variant-numeric: tabular-nums` on a `th` or `td`. Also marks that `cellIndex` numeric for sort. Does not set alignment. Pair it with `table-align="end"`
- `selected` — visual wash on a `tr`, the same wash as `aria-selected="true"`. Hover does not replace it. The runtime does not set it
- `sortable` — on a `th` inside `[table]`. The runtime wraps the label in a button and sets `aria-sort`

`[leading]` is letter-spacing. This table has no leading slot. `[align]` belongs to `p` and `[section-header]`. `nav[sticky]` is a different selector. `[end]` is an app `[data-table]` hook and is not reused. `[dense]` and `[selected]` are scoped to this table, the same way list scopes them.

```html
<div table-scroll tabindex="0" role="region" aria-label="People">
  <table table striped>
    <thead>
      <tr>
        <th sortable>Name</th>
        <th sortable numeric table-align="end">Age</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Ada Lovelace</td>
        <td numeric table-align="end">36</td>
      </tr>
    </tbody>
  </table>
</div>
```

The runtime auto-enhances `<table table>`. `th[sortable]` cycles ascending, then descending, then none. One `[numeric]` cell makes that column numeric. See [Table](./juice-table.md). Table is the twenty-eighth Emerging auto-enhance runtime and is on master, not in the published npm 0.9.2 release. Color roles are `--juice-table-border` (currentColor at 24%), `--juice-table-header-bg` (6%), `--juice-table-stripe` (4%), `--juice-table-hover` (6%), and `--juice-table-selected` (8%), on `:root` and again on `[theme]`. Layout roles are `--juice-table-padding` (`0.75rem 1rem`), `--juice-table-padding-dense` (`0.375rem 0.75rem`), and `--juice-table-radius` (`0.375rem`), on `:root` only. Shipped themes are not required to bind them.

### Select

- `select` — host, on the native element: `<select select>`. A boolean `[select]` attribute is fine: there is no HTML global `select` attribute. Any value, including `select="list"`, is still a select. The open list stays the platform popup. Do not restyle a bare `select`. Do not style `[combobox]`
- `select-label` — optional visible label. Uses ink. Pair it with the control (associated `<label for>`, wrapping label, or `[select-label]`)

`[multiple]` and `size` listboxes stay native selects. The chevron is a `background-image` on the closed dropdown. `size` other than `1` drops that chevron.

Select is a styled native `<select>`. It is not a combobox (`[combobox]` / `[combobox-input]` / `[combobox-list]` is an input plus a listbox popup). Inline field chrome — no overlay z-index. The runtime auto-enhances `<select select>` (`sync`): a visible label names the control when the author has not set `aria-label` or `aria-labelledby`. Order: associated `<label for>`, wrapping `<label>`, then `[select-label]`. A separate label is referenced with `aria-labelledby`. A wrapping label is copied into `aria-label` as its visible text excluding the select, so the selected option is not part of the name. Hidden or empty labels are skipped. No name is invented when nothing visible is there. Change events and the keyboard stay native. There is no listbox, no Escape handler, no focus trap, and no Sig Select factory. Select is the twenty-second Emerging auto-enhance runtime and shipped in 0.9.2.

See [Select Runtime](./juice-select-runtime.md). Theme paint uses `--juice-select-*` roles (`surface`, `border`, `ink`, `chevron`, `focus-ring`).

### Input

- `input` — host, on the native element: `<input input>`. A boolean `[input]` attribute is fine: there is no HTML global `input` attribute. Any value, including `input="text"`, is still an input. Text-like controls only: missing type, empty type, text, email, password, search, tel, url, and number. Do not restyle a bare `input`. Do not style `[combobox-input]`. Do not style `<select select>`
- `input-label` — optional visible label. Uses ink. Pair it with the control (associated `<label for>`, wrapping label, or `[input-label]`)

Checkbox, radio, range, file, date, time, datetime-local, month, week, color, hidden, button, submit, reset, and image are ignored. Textarea and the `[field]` wrapper are not this runtime.

Input is a styled native `<input>`. It is not a combobox (`[combobox]` / `[combobox-input]` / `[combobox-list]` is an input plus a listbox popup) and not a select (`<select select>` is a native dropdown). Inline field chrome — no overlay z-index. The runtime auto-enhances `<input input>` (`sync`): a visible label names the control when the author has not set `aria-label` or `aria-labelledby`. Order: associated `<label for>`, wrapping `<label>`, then `[input-label]`. A separate label is referenced with `aria-labelledby`. A wrapping label is copied into `aria-label` as its visible text excluding the input's own value. Hidden or empty labels are skipped. No name is invented when nothing visible is there. Typing, change, and the keyboard stay native. There is no mask, no validation engine, no floating label, no Escape handler, no focus trap, and no Sig Input factory. Input is the twenty-third Emerging auto-enhance runtime and shipped in 0.9.2.

See [Input Runtime](./juice-input-runtime.md). Theme paint uses `--juice-input-*` roles (`surface`, `border`, `ink`, `placeholder`, `focus-ring`).

### Textarea

- `textarea` — host, on the native element: `<textarea textarea>`. A boolean `[textarea]` attribute is fine: there is no HTML global `textarea` attribute. Any value, including `textarea="note"`, is still a textarea. Do not restyle a bare `textarea`. Do not style `[combobox-input]`. Do not style `<input input>`. Do not style `<select select>`
- `textarea-label` — optional visible label. Uses ink. Pair it with the control (associated `<label for>`, wrapping label, or `[textarea-label]`)

An `<input>`, a `[field]` wrapper, and a combobox field are not this runtime.

Textarea is a styled native `<textarea>`. It is not an input (`<input input>` is a single-line text field), not a select (`<select select>` is a native dropdown), and not a combobox (`[combobox]` / `[combobox-input]` / `[combobox-list]` is an input plus a listbox popup). Inline field chrome — no overlay z-index. The runtime auto-enhances `<textarea textarea>` (`sync`): a visible label names the control when the author has not set `aria-label` or `aria-labelledby`. Order: associated `<label for>`, wrapping `<label>`, then `[textarea-label]`. A separate label is referenced with `aria-labelledby`. A wrapping label is copied into `aria-label` as its visible text excluding the textarea's own value. Hidden or empty labels are skipped. No name is invented when nothing visible is there. Typing, change, and the keyboard stay native. There is no auto-grow, no character count, no validation engine, no floating label, no Escape handler, no focus trap, and no Sig Textarea factory. Textarea is the twenty-fourth Emerging auto-enhance runtime and shipped in 0.9.2.

See [Textarea Runtime](./juice-textarea-runtime.md). Theme paint uses `--juice-textarea-*` roles (`surface`, `border`, `ink`, `placeholder`, `focus-ring`).

### Field

- `field` — host wrapper around a control. A boolean `[field]` attribute is fine: there is no HTML global `field` attribute. Any value, including `field="group"`, is still a field. The control is the first `input`, `textarea`, or `select` inside the wrapper that is not inside a nested field
- `field-label` — optional visible label chrome. Uses label ink. This part does not name the control
- `field-help` — optional help text. Uses help ink
- `field-error` — optional error text. Uses error ink
- `invalid` — on `[field]`, paints the wrapper border

`[field-label]` is chrome only. Name the control with an associated `<label for>`, a wrapping `<label>`, or the control's own label part (`[input-label]`, `[textarea-label]`, `[select-label]`).

Field is a wrapper around a control. It is not an input, not a textarea, not a select, and not a combobox. Inline wrapper chrome — no overlay z-index. The runtime auto-enhances `[field]` (`sync` / `destroy`): visible `[field-help]` and `[field-error]` describe the control when the author has not set `aria-describedby`. `[invalid]` sets `aria-invalid="true"` when the author has not set `aria-invalid`. Hidden or empty parts are skipped. Author values are kept. There is no validation engine, no floating label, no Escape handler, no focus trap, and no Sig Field factory. Field is the twenty-fifth Emerging auto-enhance runtime and shipped in 0.9.2.

See [Field Runtime](./juice-field-runtime.md). Theme paint uses the six `--juice-field-*` roles (`surface`, `gap`, `label-ink`, `help-ink`, `error-ink`, `invalid-border`).

### Wizard

- `wizard-shell` — widget root / multi-step onboarding shell; required for the step runtime. Bare shell jumps to completed + current only. Values `"linear"` (prev/next only) and `"free"` (any step)
- `wizard-header` — sticky header region (theme chrome)
- `wizard-rail` — left / right rail; values `"left"` / `"right"`
- `wizard-body` / `wizard-content` — main column. The runtime writes `data-step` on `[wizard-content]` from the current pairing token
- `step-tracker` / `steps` — optional tracker scopes for `[step]` items
- `step` — tracker item. Values `"pending"` / `"active"` / `"completed"` (bare `[step]` paints as pending). The runtime writes these
- `step-page` — one step panel. Hide inactive pages with the native `hidden` attribute
- `step-nav` — prev/next row. Unmarked buttons are discovered when `[wizard-prev]` / `[wizard-next]` are absent
- `wizard-prev` / `wizard-next` — marked step controls. Prev is disabled on the first step, next on the last
- `wizard-complete` — optional last-step control. Enabled only on the last step. The runtime does not submit or provision
- `name` — optional shell label used as the slug for generated ids

Pairing is `aria-controls` → page `id`, else shared `data-step` / `name` / `[step-page="…"]` / `id`, else index order.

Wizard is a multi-step shell. It is not a dialog overlay, not a toast stack, not APG Tabs, and not the surface `overlay="frost|tint"` utility.

See [Wizard Runtime](./juice-wizard-runtime.md). Theme paint uses `--juice-wizard-*` roles (`shell`, `header`, `header-border`, `rail`, `rail-border`, `step`, `step-border`, `step-ink`, `step-current`, `step-complete`, `step-on`, `step-connector`, `panel`, `panel-border`, `focus-ring`).

## Usage Examples

```html
<section stack gap="2" padding="2rem" bgColor="white-100" rounded="md">
  <h1 font="bebas-neue" fontSize="xl" fontColor="obsidian-900">Title</h1>
  <p font="lato" fontColor="gray-700" align="center">
    Description text with centered alignment.
  </p>

    <div row gap="1" centered>
    <button bgColor="green-500" hover="green-600" fontColor="white-100" padding="1rem">
      Primary
    </button>
    <i icon="check" lib="solid" iconSize="sm" iconcolor="green-600"></i>
    <i icon="github" lib="brands" width="1.25rem" height="1.25rem" iconcolor="gray-900"></i>
  </div>
</section>

<div card="cta" size="md" bgColor="white-100" shadow="gray-400" depth="sm">
  <div header row space="between" centered>
    <h3 font="korolev-rounded-bold">Card Title</h3>
    <i icon="toggle-on" lib="solid" iconSize="md" iconcolor="red-800"></i>
  </div>
  <div body stack gap="1rem">
    <p font="korolev-rounded">Structured card content.</p>
  </div>
  <div action center>
    <button btn="outline" theme="citrusmint-300" scale="lg">Action</button>
  </div>
</div>
```

## Notes

- All numeric spacing and sizing attributes are generated from the utility system.
- Color values must match existing token names.
- Some attributes are boolean, where presence alone enables the behavior.
- Modifiers like `reverse` and `centered` combine with base layout attributes.
- Component attributes are still early compared with the token and utility layers.
