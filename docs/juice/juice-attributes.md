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
