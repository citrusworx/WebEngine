# Juice Beta

Juice Beta is the first release line where the styling system, theme contract, and motion catalog are documented and gated for publish. `@citrusworx/juiceui@0.9.2` is the public Beta cut on npm (disclosure, spinner, select, input, textarea, field, and motion core on top of the 0.9.1 stack). 0.9.0 shipped eighteen Emerging runtimes, navigation through progress.

Disclosure, spinner, select, input, textarea, field, and motion core shipped in 0.9.2. `juice:change` and `getState()` are on master, unreleased after 0.9.2.

The ten retro themes (`retro-afterburn`, `retro-arcade-glow`, `retro-boardwalk`, `retro-denim-dial`, `retro-forest-radio`, `retro-orchard-club`, `retro-poolside-pop`, `retro-signal-garden`, `retro-sunset-motel`, `retro-violet-parlor`) shipped in 0.9.1. Menu is the twelfth Emerging auto-enhance runtime.

Switch is the thirteenth, slider is the fourteenth, checkbox is the fifteenth, radio is the sixteenth, breadcrumb is the seventeenth, and progress is the eighteenth. Pagination is the nineteenth.

Disclosure is the twentieth, spinner is the twenty-first, select is the twenty-second, input is the twenty-third, textarea is the twenty-fourth, and field is the twenty-fifth. Checkbox and radio are two runtimes.

Breadcrumb is a light trail. Progress is a progressbar.

Pagination is a page set. Disclosure is a standalone one-trigger / one-panel control, distinct from accordion.

Spinner is a standalone indeterminate busy indicator, distinct from progress and disclosure. Select is a styled native `<select>`, distinct from combobox.

Input is a styled native `<input>`, distinct from combobox and from select. Textarea is a styled native `<textarea>`, distinct from input, select, and combobox.

Field is a wrapper around a control, distinct from input, textarea, select, and combobox. Icon button is a square icon-only control on button chrome, distinct from switch and from checkbox.

Avatar is an initials-or-photo mark (`[avatar]`), distinct from a badge and from `[skeleton="circle"]`, and is on master, not in the published npm 0.9.2 release. Icon button is the twenty-sixth Emerging auto-enhance runtime and is on master, not in the published npm 0.9.2 release.

Avatar is the twenty-seventh Emerging auto-enhance runtime and is on master, not in the published npm 0.9.2 release. Table is the twenty-eighth Emerging auto-enhance runtime and is on master, not in the published npm 0.9.2 release.

Pressable is the twenty-ninth Emerging auto-enhance runtime and is on master, not in the published npm 0.9.2 release. Touchable row is the thirtieth Emerging auto-enhance runtime and is on master, not in the published npm 0.9.2 release.

All thirty-one stay **Emerging**. Skeleton is a CSS-only loading placeholder (`[skeleton]`) on master, not in the published npm 0.9.2 release, and is not one of those thirty-one runtimes.

See [Skeleton](./juice-skeleton.md). List is CSS-only stacked rows (`[list]`) on master, not in the published npm 0.9.2 release, and is not one of those thirty-one runtimes.

See [List](./juice-list.md). Badge (`[badge]`) is CSS-only chrome.

The base layout shipped in npm 0.9.2. Core `--juice-badge-*` roles are on master and are not in that cut.

It is not one of those thirty-one runtimes. See [Badge](./juice-badge.md).

Safe area (`[safe-area]`) is CSS-only inset chrome on master, not in the published npm 0.9.2 release, and is not one of those thirty-one runtimes. See [Safe Area](./juice-safe-area.md). 0.9.1 was the prior public cut.

See [juice-roadmap.md](./juice-roadmap.md).

## What Beta includes

- Attribute-driven layout, spacing, color, typography, icons, gradients, and components (see [maturity matrix](./juice-maturity-matrix.md)).
- **Modular themes:** `aquaflux`, `kiwipress`, `citrusmint`, `tide`, `retro-afterburn`, `retro-arcade-glow`, `retro-boardwalk`, `retro-denim-dial`, `retro-forest-radio`, `retro-orchard-club`, `retro-poolside-pop`, `retro-signal-garden`, `retro-sunset-motel`, and `retro-violet-parlor` ship as separate CSS entrypoints (`@citrusworx/juiceui/styles/themes/<id>`). The ten retro themes shipped in the 0.9.1 npm cut.
- `@citrusworx/juiceui/styles` is **core only** (no theme rules). Activate with `theme="<id>"` on the root after importing core + theme CSS.
- There is no `retro.css` bundle.
- **Responsive reference:** [juice-responsive-reference.md](./juice-responsive-reference.md).
- **Surfaces:** `surfaceTone="soft|strong|muted"`, `borderStrength="soft|bold"`, standalone `blur="sm|md"`, `shadowTone="cool|warm"`, `overlay="frost|tint"`, and `variant="monochromatic|glass|tinted"` — [juice-surfaces.md](./juice-surfaces.md).
- Tones, strength, shadow tone, and overlay use `--juice-surface-*` / `--juice-border-strength-*` / `--juice-shadow-tone-*` / `--juice-overlay-*` theme roles; blur uses fixed lengths (`6px` / `16px`); variant recipes compose those same roles.
- **Motion:** canonical `motion` attribute with P0/P1 values ([juice-animations.md](./juice-animations.md)); `prefers-reduced-motion` respected. Motion core (tokens, the shared helper, overlay enter/exit, and the P0 CSS gate) shipped in `@citrusworx/juiceui@0.9.2` and stays Emerging. The 0.9.1 tarball has the earlier attribute catalog.
- **Avatar:** `[avatar]` initials-or-photo mark (round by default, `[avatar="square"]`, `[scale]`, status dot, `[avatar-group]` / `[avatar-more]`). The image-fallback runtime auto-enhances it. It is on master, not in the published npm 0.9.2 release, and it is the twenty-seventh Emerging auto-enhance runtime. See [juice-avatar.md](./juice-avatar.md).
- **Table:** `<table table>` sortable grid (`[striped]`, `[dense]`, `[sticky]`, `[table-scroll]`, `[table-align]`, `[numeric]`, `th[sortable]`). The sortable runtime auto-enhances it. It is on master, not in the published npm 0.9.2 release, and it is the twenty-eighth Emerging auto-enhance runtime. See [juice-table.md](./juice-table.md).
- **Pressable:** `[pressable]` transient press (`[pressable="scale"]`, `[pressable-longpress]`, `[pressable-slop]`). The runtime auto-enhances it. It is on master, not in the published npm 0.9.2 release, and it is the twenty-ninth Emerging auto-enhance runtime. `@citrusworx/sigjs/juice` `bind()` does not name pressable or touchable-row yet. See [juice-pressable.md](./juice-pressable.md).
- **Touchable row:** `[touchable-row]` 44px row (`dense`, `chevron`, `undivided`, `select`, `activate`, leading / content / title / subtitle / trailing). The runtime auto-enhances it.
- It is on master, not in the published npm 0.9.2 release, and it is the thirtieth Emerging auto-enhance runtime. Mobile-Critical.
- `@citrusworx/sigjs/juice` `bind()` does not name pressable or touchable-row yet. See [juice-touchable-row.md](./juice-touchable-row.md).
- **Skeleton:** CSS-only `[skeleton]` loading placeholder (rect, text, circle, `[lines]`, `[scale]`, `[static]`). Core CSS paints it. There is no runtime. It is on master, not in the published npm 0.9.2 release, and it does not change the thirty Emerging runtime count. See [juice-skeleton.md](./juice-skeleton.md).
- **List:** CSS-only `[list]` stacked rows (`ul` / `ol` / `div`, `[divided]`, `[dense]`, `[list-item]` slots). Core CSS paints it. There is no runtime. It is on master, not in the published npm 0.9.2 release, and it does not change the thirty Emerging runtime count. See [juice-list.md](./juice-list.md).
- **Badge:** CSS-only `[badge]` pill (`[badge="square"]`, `[badge="ribbon"]`). Core roles paint a 1% `currentColor` wash. KiwiPress still paints its own colors outside `[cta]`. There is no runtime. The base layout shipped in npm 0.9.2. The `--juice-badge-*` roles are on master and are not in that cut. It does not change the thirty Emerging runtime count. See [juice-badge.md](./juice-badge.md).
- **Safe area:** CSS-only `[safe-area]` inset (`top`, `bottom`, `x`, `y`). Core CSS pads the host. There is no runtime. It is on master, not in the published npm 0.9.2 release, and it does not change the thirty Emerging runtime count. The viewport meta tag needs `viewport-fit=cover`. See [juice-safe-area.md](./juice-safe-area.md).
- **Theme authoring:** each shipped theme uses `src/themes/<id>/<id>.scss` + `<id>.yaml` ([juice-theme-authoring.md](./juice-theme-authoring.md)). Required `--juice-*` binds are listed in the [Theme Contract](./juice-theme-contract.md).
- **Auto-start runtimes:** importing `@citrusworx/juiceui` auto-enhances valid navigation, `[accordion]`, `[tabs]`, `[modal-overlay]`, `[drawer-overlay]`, `[toast-region]`, `[popover-root]`, `[wizard-shell]`, `[tooltip-root]`, `[combobox]`, `[banner]`, `[menu-root]`, `[switch]`, `[slider]`, `[checkbox]`, `[radiogroup]`, `[breadcrumb]`, `[progress]`, `[pagination]`, `[disclosure]`, `[spinner]`, `<select select>`
- `<input input>`, `<textarea textarea>`, `[field]`, `[icon-button]`, `[avatar]`, `[table]`, `[pressable]`, and `[touchable-row]` markup in the browser. `[disclosure]`, `[spinner]`, `<select select>`, `<input input>`, `<textarea textarea>`, `[field]`, and motion core shipped in 0.9.2.
- Checkbox and radio are two runtimes. Breadcrumb is a light trail.
- Progress is a progressbar. Pagination is a page set.
- Disclosure is a standalone one-trigger / one-panel control, distinct from accordion. Spinner is a standalone indeterminate busy indicator, distinct from progress and disclosure.
- Select is a styled native `<select>`, distinct from combobox. The open list stays the platform popup.
- Input is a styled native `<input>`, distinct from combobox and from select. Textarea is a styled native `<textarea>`, distinct from input, select, and combobox.
- Field is a wrapper around a control, distinct from input, textarea, select, and combobox. Icon button is a square icon-only control on button chrome, distinct from switch and from checkbox, and is on master, not in the published npm 0.9.2 release.
- Avatar is an initials-or-photo mark (`[avatar]`), distinct from a badge and from `[skeleton="circle"]`, and is on master, not in the published npm 0.9.2 release. Table is a native `<table table>` grid.
- `th[sortable]` cycles ascending, descending, and none. It is on master, not in the published npm 0.9.2 release.
- Pressable is transient press chrome on `[pressable]`. It is the twenty-ninth Emerging auto-enhance runtime, on master, not in that cut.
- Touchable row is a 44px row on `[touchable-row]`. It is the thirtieth Emerging auto-enhance runtime, on master, not in that cut.
- `bind()` does not name pressable or touchable-row yet. Typing, change, and the keyboard stay native on select, input, and textarea.
- Enter and Space on a sort button stay with the browser. Escape / layering and z-index bands are documented in [juice-runtime-behavior.md](./juice-runtime-behavior.md#escape--layering).
- See also [juice-navigation-runtime.md](./juice-navigation-runtime.md), [juice-accordion-runtime.md](./juice-accordion-runtime.md), [juice-tabs-runtime.md](./juice-tabs-runtime.md)
- [juice-modal-runtime.md](./juice-modal-runtime.md), [juice-drawer-runtime.md](./juice-drawer-runtime.md), [juice-toast-runtime.md](./juice-toast-runtime.md)
- [juice-popover-runtime.md](./juice-popover-runtime.md), [juice-wizard-runtime.md](./juice-wizard-runtime.md), [juice-tooltip-runtime.md](./juice-tooltip-runtime.md)
- [juice-combobox-runtime.md](./juice-combobox-runtime.md), [juice-banner-runtime.md](./juice-banner-runtime.md), [juice-menu-runtime.md](./juice-menu-runtime.md)
- [juice-switch-runtime.md](./juice-switch-runtime.md), [juice-slider-runtime.md](./juice-slider-runtime.md), [juice-checkbox-runtime.md](./juice-checkbox-runtime.md)
- [juice-radio-runtime.md](./juice-radio-runtime.md), [juice-breadcrumb-runtime.md](./juice-breadcrumb-runtime.md), [juice-progress-runtime.md](./juice-progress-runtime.md)
- [juice-pagination-runtime.md](./juice-pagination-runtime.md), [juice-disclosure-runtime.md](./juice-disclosure-runtime.md), [juice-spinner-runtime.md](./juice-spinner-runtime.md)
- [juice-select-runtime.md](./juice-select-runtime.md), and [juice-input-runtime.md](./juice-input-runtime.md), and [juice-textarea-runtime.md](./juice-textarea-runtime.md)
- [juice-field-runtime.md](./juice-field-runtime.md), and [juice-icon-button-runtime.md](./juice-icon-button-runtime.md), and [juice-avatar.md](./juice-avatar.md)
- and [juice-table.md](./juice-table.md), and [juice-pressable.md](./juice-pressable.md), and [juice-touchable-row.md](./juice-touchable-row.md).

## What Beta does not promise yet

- Full animation roadmap ([juice-animations-roadmap.md](./juice-animations-roadmap.md)).
- Config-driven theme generation from `juice.config.yaml` (optional, draft).
- Draft themes under `src/themes/_draft/` (for example `blush`). YAML-only drafts do not emit CSS; package `exports` and the published tarball do not expose `_draft`.
- A large public JS component API. The documented auto-start runtimes (navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, breadcrumb, progress, pagination, disclosure, spinner, select, input, textarea, field, icon button, avatar, table, pressable, and touchable row) and the Sig Accordion factory do ship
- disclosure, spinner, select, input, textarea, field, and motion core shipped in 0.9.2. Checkbox and radio are two runtimes.
- Breadcrumb is a light trail. Progress is a progressbar.
- Pagination is a page set. Disclosure is a standalone one-trigger / one-panel control, distinct from accordion.
- Spinner is a standalone indeterminate busy indicator, distinct from progress and disclosure. Select is a styled native `<select>`, distinct from combobox.
- Input is a styled native `<input>`, distinct from combobox and from select. Textarea is a styled native `<textarea>`, distinct from input, select, and combobox.
- Field is a wrapper around a control, distinct from input, textarea, select, and combobox. Icon button is a square icon-only control on button chrome, distinct from switch and from checkbox, and is on master, not in the published npm 0.9.2 release.
- Avatar is an initials-or-photo mark (`[avatar]`), distinct from a badge and from `[skeleton="circle"]`, and is on master, not in the published npm 0.9.2 release.
- There is no Sig Modal, Sig Drawer, Sig Toast, Sig Popover, Sig Wizard, Sig Tooltip, Sig Combobox, Sig Banner, Sig Menu, Sig Switch, Sig Slider, Sig Checkbox, Sig Radio, Sig Breadcrumb, Sig Progress, Sig Pagination, Sig Disclosure, Sig Spinner, Sig Select, Sig Input, Sig Textarea, or Sig Field, Sig IconButton, Sig Avatar, Sig Table, or Sig Pressable or Sig TouchableRow factory.
- A broad component library is not the center of Beta.

## Publish gate

```bash
yarn workspace @citrusworx/juiceui verify
```

See [release-checklist.md](./release-checklist.md).

## Positioning

> Juice Beta is a CSS-first, attribute-driven styling and composition system with strong layout, token, typography, icon, and page-structure support, a documented theme contract, and a supported subset of motion attributes.
