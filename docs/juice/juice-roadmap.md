# Juice Roadmap

## Current Position

`@citrusworx/juiceui@0.9.5` is the live npm Juice Beta cut (published 2026-10-30 15:11 UTC).

**0.9.5 is the public cut.** Keyboard avoider, the thirty-first Emerging runtime, and the `nav[fixed]` footer fix shipped in this lane. They stay Emerging.

**0.9.4** shipped pressable (the twenty-ninth Emerging runtime) and touchable row (the thirtieth). Published 2026-10-29.

**0.9.3** shipped icon button (the twenty-sixth), avatar (the twenty-seventh), table (the twenty-eighth), CSS-only skeleton, list, and safe area, the `--juice-badge-*` roles, and `juice:change` / `getState()`. Published 2026-10-27.

**0.9.2** shipped disclosure, spinner, select, input, textarea, field, and motion core (published 2026-10-14). They stay Emerging.

**0.9.1** shipped pagination A→B→C (theme chrome, runtime, runtime / maturity docs) and the ten retro library themes. 0.9.0 was an earlier public npm cut. 0.9.0 shipped eighteen Emerging runtimes, navigation through progress.

Consumed Juice changesets (the 0.9.1 lane):

| Changeset | Bump | What it records |
|---|---|---|
| `juice-pagination-theme-chrome` | **minor** | Pagination theme chrome roles (`--juice-pagination-*`) |
| `juice-pagination-runtime` | **minor** | DOM-first page-set runtime (`createPagination`, sync / setCurrent) |
| `juice-pagination-runtime-docs` | **patch** | Pagination runtime / maturity docs (slice C) |
| `juice-ship-retro-themes` | **minor** | Ten retro library themes as separate CSS entrypoints |
| `juice-retro-theme-visuals` | **patch** | Retro heading binds, CTA gradients, and outline button chrome |
| `juice-afterburn-theme-quality` | **patch** | Afterburn Theme Quality pass |
| `juice-afterburn-contrast` | **patch** | Retro hero, page wash, and outline-control contrast |
| `juice-arcade-glow-theme-quality` | **patch** | Arcade Glow Theme Quality pass |
| `juice-boardwalk-theme-quality` | **patch** | Boardwalk Theme Quality pass |
| `juice-0-9-0-docs-refresh` | **patch** | Align docs with the live 0.9.0 npm cut (switch through progress) |

Consumed Juice changesets (the 0.9.0 lane):

| Changeset | Bump | What it records |
|---|---|---|
| `juice-switch-theme-chrome` | **minor** | Switch theme chrome roles (`--juice-switch-*`) |
| `juice-switch-runtime` | **minor** | DOM-first APG switch runtime (`createSwitch`, toggle / setChecked) |
| `juice-switch-runtime-docs` | **patch** | Switch runtime / maturity docs (slice C) |
| `juice-slider-theme-chrome` | **minor** | Slider theme chrome roles (`--juice-slider-*`) |
| `juice-slider-runtime` | **minor** | DOM-first APG slider runtime (`createSlider`, setValue / keyboard / pointer) |
| `juice-slider-runtime-docs` | **patch** | Slider runtime / maturity docs (slice C) |
| `juice-checkbox-radio-theme-chrome` | **minor** | Checkbox and radio theme chrome roles (`--juice-checkbox-*`, `--juice-radio-*`) |
| `juice-checkbox-radio-runtime` | **minor** | DOM-first APG checkbox and radio runtimes (`createCheckbox`, `createRadio`, exclusive radiogroup) |
| `juice-checkbox-radio-runtime-docs` | **patch** | Checkbox and radio runtime / maturity docs (slice C) |
| `juice-breadcrumb-theme-chrome` | **minor** | Breadcrumb theme chrome roles (`--juice-breadcrumb-*`) |
| `juice-breadcrumb-runtime` | **minor** | Light DOM-first breadcrumb runtime (`createBreadcrumb`, sync / setCurrent) |
| `juice-breadcrumb-runtime-docs` | **patch** | Breadcrumb runtime / maturity docs (slice C) |
| `juice-progress-theme-chrome` | **minor** | Progress theme chrome roles (`--juice-progress-*`) |
| `juice-progress-runtime` | **minor** | DOM-first APG progress runtime (`createProgress`, setValue / setIndeterminate) |
| `juice-progress-runtime-docs` | **patch** | Progress runtime / maturity docs (slice C) |
| `juice-0-8-0-docs-refresh` | **patch** | Align docs with the live 0.8.0 npm cut (wizard through menu) |

Consumed Juice changesets (the 0.8.0 lane):

| Changeset | Bump | What it records |
|---|---|---|
| `juice-wizard-theme-chrome` | **minor** | Wizard theme chrome roles (`--juice-wizard-*`) |
| `juice-wizard-runtime` | **minor** | DOM-first wizard step runtime (`next` / `prev` / `goTo`, pairing, modes) |
| `juice-wizard-runtime-docs` | **patch** | Wizard runtime / maturity docs (slice C) |
| `juice-tooltip-theme-chrome` | **minor** | Tooltip theme chrome roles (`--juice-tooltip-*`) |
| `juice-tooltip-runtime` | **minor** | DOM-first tooltip runtime (hover/focus show, exclusive, Escape, placement flip) |
| `juice-tooltip-runtime-docs` | **patch** | Tooltip runtime / maturity docs (slice C) |
| `juice-combobox-theme-chrome` | **minor** | Combobox theme chrome roles (`--juice-combobox-*`) |
| `juice-combobox-runtime` | **minor** | DOM-first combobox listbox runtime (filter, keyboard, exclusive) |
| `juice-combobox-runtime-docs` | **patch** | Combobox runtime / maturity docs (slice C) |
| `juice-banner-theme-chrome` | **minor** | Banner theme chrome roles (`--juice-banner-*`) |
| `juice-banner-runtime` | **minor** | DOM-first banner dismiss runtime (`show` / `dismiss`, persist) |
| `juice-banner-runtime-docs` | **patch** | Banner runtime / maturity docs (slice C) |
| `juice-escape-layering` | **patch** | Escape yield order across the eleven Emerging runtimes (polish A) |
| `juice-runtime-shared-primitives` | **patch** | Internal shared runtime primitives under `src/js/src/shared/` (polish B) |
| `juice-runtime-docs-maturity` | **patch** | Docs / Limitations / z-index / maturity consistency (polish C) |
| `juice-menu-theme-chrome` | **minor** | Menu theme chrome roles (`--juice-menu-*`) |
| `juice-menu-runtime` | **minor** | DOM-first APG menu-button runtime (`createMenu`, open/close/toggle/select, Escape with popover) |
| `juice-menu-runtime-docs` | **patch** | Menu runtime / maturity docs (slice C) |

Consumed Juice changesets (the 0.7.0 lane):

| Changeset | Bump | What it records |
|---|---|---|
| `juice-drawer-theme-chrome` | **minor** | Drawer theme chrome roles (`--juice-drawer-*`) |
| `juice-drawer-dialog-runtime` | **minor** | DOM-first drawer dialog runtime (open/close, Escape, focus trap, exclusive) |
| `juice-drawer-runtime-docs` | **patch** | Drawer runtime / maturity docs (slice C) |
| `juice-toast-theme-chrome` | **minor** | Toast theme chrome roles (`--juice-toast-*`) |
| `juice-toast-runtime` | **minor** | DOM-first toast / snackbar runtime (show/dismiss, duration, live region, Escape) |
| `juice-toast-runtime-docs` | **patch** | Toast runtime / maturity docs (slice C) |
| `juice-popover-theme-chrome` | **minor** | Popover theme chrome roles (`--juice-popover-*`) |
| `juice-popover-runtime` | **minor** | DOM-first popover runtime (open/close, placement flip, Escape, outside click) |
| `juice-popover-runtime-docs` | **patch** | Popover runtime / maturity docs (slice C) |

Consumed Juice changesets (the 0.6.0 lane):

| Changeset | Bump | What it records |
|---|---|---|
| `juice-ship-tide-theme` | **minor** | Tide as a fourth library theme |
| `juice-surface-tone-roles` | **minor** | Themeable `surfaceTone` `soft|strong|muted` |
| `juice-border-strength` | **minor** | Composable `borderStrength` `soft|bold` |
| `juice-blur-sm-md` | **minor** | Standalone `blur` `sm|md` (finishes A–C) |
| `juice-theme-contract-tests` | **patch** | Automated `--juice-*` bind tests |
| `juice-icon-authoring-contract` | **patch** | Icon authoring contract (`1rem` default, `iconSize`) |
| `juice-author-type-attrs-beat-theme` | **patch** | Author `font` / `fontColor` / `fontWeight` / `lineHeight` beat theme `h1`–`h6` / `p` defaults |
| `juice-shadow-tone` | **minor** | Themeable `shadowTone` `cool|warm` (remaining depth slice A) |
| `juice-overlay-frost-tint` | **minor** | Themeable `overlay` `frost|tint` (remaining depth slice B) |
| `juice-variant-monochromatic-glass-tinted` | **minor** | Composable `variant` `monochromatic|glass|tinted` (remaining depth slice C) |
| `juice-modal-theme-chrome` | **minor** | Modal theme chrome roles (`--juice-modal-*`) |
| `juice-modal-dialog-runtime` | **minor** | DOM-first modal dialog runtime (open/close, Escape, focus trap, exclusive) |
| `juice-modal-runtime-docs` | **patch** | Modal runtime / maturity docs (slice C) |

Juice is a CSS-first, attribute-driven styling and composition system. It is no longer a layout-utility kit, and it is not a finished component framework.

The visible layers today (npm 0.9.5):

* layout and spacing primitives
* token-driven color, font, and gradient systems. Motion is token-driven (`--juice-motion-*`, the shared helper, overlay enter/exit, and the P0/P1 catalog reading those tokens). That motion core shipped in `@citrusworx/juiceui@0.9.2`. The 0.9.1 tarball still has motion wave 1 as the earlier attribute catalog, not this token-driven core
* fourteen shipped modular themes (`aquaflux`, `kiwipress`, `citrusmint`, `tide`, `retro-afterburn`, `retro-arcade-glow`, `retro-boardwalk`, `retro-denim-dial`, `retro-forest-radio`, `retro-orchard-club`, `retro-poolside-pop`, `retro-signal-garden`, `retro-sunset-motel`, `retro-violet-parlor`), with core CSS separate from theme identity. The ten retro themes shipped in 0.9.1.
* Each is `dist/themes/<id>.css`; there is no `retro.css` bundle
* surface language A–C: themeable `surfaceTone="soft|strong|muted"`, `borderStrength="soft|bold"`, standalone `blur="sm|md"`
* Emerging browser runtimes: navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, breadcrumb, progress, pagination, disclosure, spinner, select, input, textarea, field, icon button, avatar, table, pressable, touchable row, and keyboard avoider auto-enhance when the JS entry is imported.
* Disclosure, spinner, select, input, textarea, field, and motion core shipped in 0.9.2. Icon button shipped in 0.9.3.
* Checkbox and radio are two runtimes. Breadcrumb is a light trail.
* Progress is a progressbar. Pagination is a page set.
* Disclosure is a standalone one-trigger / one-panel control, distinct from accordion. Spinner is a standalone indeterminate busy indicator, distinct from progress and disclosure.
* Select is a styled native `<select>`, distinct from combobox. Input is a styled native `<input>`, distinct from combobox and from select.
* Textarea is a styled native `<textarea>`, distinct from input, select, and combobox. Field is a wrapper around a control, distinct from input, textarea, select, and combobox.
* Icon button is a square icon-only control on button chrome, distinct from switch and from checkbox. Avatar is an initials-or-photo mark and auto-enhances when the JS entry is imported.
* Avatar shipped in 0.9.3. Table is a sortable grid on `<table table>`, shipped in 0.9.3, and auto-enhances when the JS entry is imported.
* a Sig Accordion factory plus create/init/start/stop helpers (no Sig Modal, Sig Drawer, Sig Toast, Sig Popover, Sig Wizard, Sig Tooltip, Sig Combobox, Sig Banner, Sig Menu, Sig Switch, Sig Slider, Sig Checkbox, Sig Radio, Sig Breadcrumb, Sig Progress, Sig Pagination, Sig Disclosure, Sig Spinner, Sig Select, Sig Input, Sig Textarea, or Sig Field, Sig IconButton, Sig Avatar, Sig Table, or Sig Pressable or Sig TouchableRow factory)
* CSS-only `[skeleton]` loading chrome, shipped in 0.9.3. Not a runtime. See [Skeleton](./juice-skeleton.md)
* CSS-only `[list]` stacked rows, shipped in 0.9.3. Not a runtime. See [List](./juice-list.md)
* CSS-only `[badge]` pill, square, and ribbon. The base layout shipped in npm 0.9.2. Core `--juice-badge-*` roles shipped in 0.9.3. Not a runtime. See [Badge](./juice-badge.md)
* CSS-only `[safe-area]` inset, shipped in 0.9.3. Not a runtime. See [Safe Area](./juice-safe-area.md)
* contracts for themes, icons, and typography, including author type overrides
* templates as a stress-test bed

The strongest parts of Juice today are still layout, spacing, color tokens, typography, and icons.

The next strongest areas are now:

* modular shipped themes (KiwiPress is the richest reference; Tide is the dark product/SaaS one; ten retro themes ship as separate entrypoints)
* motion wave 1 (P0 + P1) in the 0.9.1 catalog, plus motion core (tokens, helper, overlay enter/exit, docs, and the P0 CSS gate). Motion core shipped in `@citrusworx/juiceui@0.9.2` and stays Emerging
* surface utilities A–C
* accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, breadcrumb, progress, pagination, disclosure, spinner, select, input, textarea, field, icon button, avatar, table, pressable, touchable row, and keyboard avoider chrome plus DOM-first auto-enhance
* CSS-only skeleton loading chrome (`[skeleton]`), shipped in 0.9.3. Not a runtime. See [Skeleton](./juice-skeleton.md)
* CSS-only list rows (`[list]`), shipped in 0.9.3. Not a runtime. See [List](./juice-list.md)
* CSS-only badge labels (`[badge]`). The base layout shipped in npm 0.9.2. Core `--juice-badge-*` roles shipped in 0.9.3. Not a runtime. See [Badge](./juice-badge.md)
* CSS-only safe-area inset (`[safe-area]`), shipped in 0.9.3. Not a runtime. See [Safe Area](./juice-safe-area.md)
* documented theme / icon / typography contracts
* templates as design proofs

The weakest areas are still:

* remaining surface depth (structural `card="…"` recipes; `shadowTone`, `overlay`, and `variant` utilities are in)
* component maturity beyond the thirty-one auto-enhance runtimes
* blush remaining an unpublished YAML-only draft
* templates as a continuing stress-test surface
* Juice CLI and config / generator workflow
* optional later type size-step (`xs` / `1rem`) if it is ever needed

Theme-contract slice C is vacant: there is no remaining SCSS/YAML hole on the shipped set. Author type attrs already beat theme semantic defaults. Those are not open holes.

Tide is a shipped dark product/SaaS theme under `src/themes/tide/`. Accordion and tabs roles are bound there, and package exports include `@citrusworx/juiceui/styles/themes/tide`. The ten retro themes ship the same way: `src/themes/<id>/<id>.scss`, `dist/themes/<id>.css`, and `@citrusworx/juiceui/styles/themes/<id>`. Blush stays under `src/themes/_draft/`.

For the honest Beta promise, see [Juice Beta](./juice-beta.md) and the [maturity matrix](./juice-maturity-matrix.md).

---

## What Improved Through 0.4.0 and After

### Through 0.4.0

0.4.0 was a real Beta cut, not a packaging bump. It was an earlier public npm cut before 0.6.0.

* **Modular themes, core CSS is core-only.** `@citrusworx/juiceui/styles` carries utilities and components, not theme identity. `aquaflux`, `kiwipress`, and `citrusmint` shipped as separate CSS entrypoints. Activate with `theme="<id>"` after importing core + theme CSS. Each theme follows the `<id>.scss` + `<id>.yaml` authoring contract.
* **Accordion and tabs joined navigation as real runtimes.** Layout chrome, shared `--juice-*` role contracts, DOM-first auto-enhance, and the Sig `Accordion` factory plus create/init/start/stop helpers. All three stay Emerging. Markup plus auto-enhance is the contract, not a large JS component library.
* **Motion wave 1 is documented and gated.** Canonical `motion` covers the P0/P1 catalog. `prefers-reduced-motion` is respected. That is a supported Beta subset, not the full [animations roadmap](./juice-animations-roadmap.md). Token-driven timing was not part of this cut. Motion core (tokens, the shared helper, and overlay enter/exit) landed later and shipped in `@citrusworx/juiceui@0.9.2`.
* **Teal tokens exist.** `teal-100`–`teal-900` and the `lagoon` swatch landed so a dark product theme had something to consume. Tide itself shipped after 0.4.0.
* **Packaging matches the runtime story.** `sideEffects` includes `dist/index.js`. `@citrusworx/sigjs` is a published `^0.3.0` caret range, not `workspace:^`.
* **Docs maturity caught up to the JS entry.** The [maturity matrix](./juice-maturity-matrix.md) marks the JS entrypoint and public component exports as **Emerging**.

### Since 0.4.0 (the 0.6.0 lane)

This is the stack that shipped in 0.6.0.

* **Tide shipped as the fourth library theme** (PR #95, `juice-ship-tide-theme`). Import `@citrusworx/juiceui/styles/themes/tide` and activate with `theme="tide"`. Dark product/SaaS identity, teal/lagoon tokens, accordion and tabs chrome, named `tide-card` / `tide-panel` surfaces. Blush remains a YAML-only draft.
* **Surface language A→B→C.** Themeable `surfaceTone` `soft|strong|muted` (#97), `borderStrength` `soft|bold` (#99), standalone `blur` `sm|md` (#102). A–C utilities are done. Remaining depth slices A (`shadowTone` `cool|warm`), B (`overlay` `frost|tint`), and C (`variant` `monochromatic|glass|tinted`) are in. Structural `card="…"` recipes stay later.
* **Theme contract.** Canonical required-versus-optional checklist (#104) plus automated `--juice-*` bind tests (#105). `yarn workspace @citrusworx/juiceui verify` fails if aquaflux, kiwipress, citrusmint, tide, or the theme generator drops a required accordion, tabs, modal, surface-tone, border-strength, shadow-tone, or overlay bind.
* Modal theme chrome (slice A), dialog runtime (slice B), and runtime docs (slice C) are in.
* **Modal / dialog A→B→C.** Shared `--juice-modal-*` roles for `[modal-overlay]` / `[modal]` / `[modal-close]` (#118 / #119). DOM-first dialog runtime (#121): `createModal` / `initModal` / `startModalRuntime` / `stopModalRuntime`, auto-boot, Escape, focus trap, exclusive open, backdrop click (`modal-overlay="static"` opts out).
* Runtime docs and maturity notes shipped with the cut. Distinct from surface `overlay="frost|tint"`.
* No Sig Modal factory.
* **Typography and icon polish.** Icon authoring contract (#108): default `[icon]` size is `1rem`, `iconSize` (`xxs`…`xxl`) is first-class, `width` / `height` stay the custom-size escape hatch. Typography authoring contract (#110). Author `font` / `fontColor` / `fontWeight` / `lineHeight` beat theme `h1`–`h6` / `p` defaults via `[theme] [attr]` companions (#112), same pattern as `surfaceTone`.

### Since 0.6.0 (the 0.7.0 lane)

This is the stack that shipped in 0.7.0.

* **Drawer A→B→C.** Shared `--juice-drawer-*` roles for `[drawer-overlay]` / `[drawer]` / `[drawer-close]` (#128). DOM-first dialog runtime (#129): `createDrawer` / `initDrawer` / `startDrawerRuntime` / `stopDrawerRuntime`, auto-boot, Escape, focus trap, exclusive drawer open, backdrop click (`drawer-overlay="static"` opts out).
* Runtime docs and maturity notes in #131. Edge is `[drawer]` / `[drawer="left"|"right"]`; optional width is `[drawer-size="sm|lg"]`.
* Distinct from surface `overlay="frost|tint"` and from modal. No Sig Drawer factory.
* **Toast A→B→C.** Shared `--juice-toast-*` roles for `[toast-region]` / `[toast]` / `[toast-close]` (#133).
* DOM-first snackbar runtime (#135): `createToast` / `initToast` / `startToastRuntime` / `stopToastRuntime`, auto-boot, `show` / `dismiss`, `toast-duration` (default 5000; `0` / `Infinity` / negative is sticky), auto-dismiss pause on hover/focus, Escape for the most recent visible toast only when no open modal/drawer overlay exists. Runtime docs and maturity notes shipped with the cut.
* Live region: `aria-live` polite + `aria-relevant`; `role="status"` vs `role="alert"` for error/assertive. Markup-first (no programmatic message factory).
* Distinct from surface `overlay="frost|tint"` and from modal/drawer. No Sig Toast factory.
* **Popover A→B→C.** Shared `--juice-popover-*` roles for `[popover-root]` / `[popover-panel]` / `[popover-close]` (#138).
* DOM-first anchored runtime (#139): `createPopover` / `initPopover` / `startPopoverRuntime` / `stopPopoverRuntime`, auto-boot, open/close/toggle, Escape (yields to modal/drawer), outside click, Tab trap, exclusive popover open, dependency-free placement with one-axis flip (`position: fixed` from opener rect + gap 8).
* Non-modal dialog (`role="dialog"`, no `aria-modal`); focus moves into the panel and restores to the opener. Never a bare `popover` attribute.
* Runtime docs and maturity notes shipped with the cut. Distinct from surface `overlay="frost|tint"` and from modal/drawer/toast.
* No Sig Popover factory.

### Since 0.7.0 (the 0.8.0 lane)

This is the stack that shipped in 0.8.0.

* **Wizard A→B→C.** Shared `--juice-wizard-*` roles for `[wizard-shell]` / `[wizard-header]` / `[wizard-rail]` / `[step]` (#144).
* DOM-first step runtime (#145): `createWizard` / `initWizard` / `startWizardRuntime` / `stopWizardRuntime`, auto-boot, `next` / `prev` / `goTo(index|id)` / `current`, pairing (`aria-controls` → id, else shared `data-step` / `name` / `step-page`, else index), nav modes (bare = completed + current; `linear` = prev/next only; `free` = any step), `[wizard-prev]` / `[wizard-next]` or unmarked `[step-nav]` buttons
* optional `[wizard-complete]` on the last step. Pages use native `hidden`.
* A11y is `aria-current="step"` plus pages as `role="region"` — not APG Tabs. `sync` writes `data-step` on `[wizard-content]`.
* Runtime docs and maturity notes in #146. Distinct from surface `overlay="frost|tint"` and from modal/drawer/toast/popover.
* No Sig Wizard factory.
* **Tooltip A→B→C.** Shared `--juice-tooltip-*` roles for `[tooltip-root]` / `[tooltip-panel]` (#148).
* DOM-first hover/focus runtime (#149): `createTooltip` / `initTooltip` / `startTooltipRuntime` / `stopTooltipRuntime`, auto-boot, `show` / `hide`, pairing (`aria-describedby` preferred → root id; also `aria-controls`), show on mouseover/focusin, hide on mouseout/focusout with a 150ms grace delay, exclusive one tip, Escape (yields to open modal/drawer overlay or popover-root)
* no focus trap (focus never moves into the tip), dependency-free placement with one-axis flip (`position: fixed` from trigger rect + gap 8), z-index 1060. Touch / first-tap later — v1 is hover and keyboard focus.
* Distinct from popover (interactive) and native `title`. Never a bare `tooltip` attribute.
* Runtime docs and maturity notes in #151. Distinct from surface `overlay="frost|tint"` and from modal/drawer/toast/popover/wizard.
* No Sig Tooltip factory.
* **Combobox A→B→C.** Shared `--juice-combobox-*` roles for `[combobox]` / `[combobox-input]` / `[combobox-list]` / `[combobox-option]` (#152).
* DOM-first listbox runtime (#153): `createCombobox` / `initCombobox` / `startComboboxRuntime` / `stopComboboxRuntime`, auto-boot, `open` / `close` / `toggle` / `select`, case-insensitive substring filter on option text / `data-value` (non-matches get `hidden`), keyboard (ArrowUp/Down, Home/End, Enter selects, Escape closes, Tab closes without commit)
* `aria-activedescendant` plus `aria-expanded` on the input (and trigger), exclusive among comboboxes. Select writes option text or `data-value`; committed choice is `aria-selected` plus `combobox-option="active"` for keyboard focus.
* Placement is CSS-only (absolute under the field); no Floating UI. Distinct from native `<select>`.
* Runtime docs and maturity notes in this pass. Distinct from surface `overlay="frost|tint"` and from modal/drawer/toast/popover/wizard/tooltip.
* No Sig Combobox factory. No multi-select / async fetch.
* **Banner A→B→C.** Shared `--juice-banner-*` roles for `[banner]` / `[banner-body]` / `[banner-close]` (#160).
* DOM-first dismiss runtime (#161): `createBanner` / `initBanner` / `startBannerRuntime` / `stopBannerRuntime`, auto-boot, `show` / `dismiss`, `[banner-close]` click / keyboard, `role="status"` (or `role="alert"` for error/warning), optional `banner-persist="session|local"` with `name` / `id` (`juice-banner:<key>`). No focus trap, no Escape steal, no auto-dismiss timer.
* Distinct from toast stack and from modal/drawer. Runtime docs and maturity notes in this pass.
* No Sig Banner factory.
* **Eleven-runtime polish A→B→C.** Escape / layering (#166): modal/drawer → popover → combobox → toast/tooltip as implemented; banner never; accordion contextual; tabs / nav / wizard out of scope. Shared internals (#167) under `libraries/juice/src/js/src/shared/` (not a public API). Docs / Limitations / z-index / maturity consistency in this pass. The eleven stay **Emerging**.
* **Menu A→B→C.** Shared `--juice-menu-*` roles for `[menu-root]` / `[menu]` / `[menuitem]` (#171).
* DOM-first APG menu-button runtime (#174): `createMenu` / `initMenu` / `startMenuRuntime` / `stopMenuRuntime`, auto-boot, `open` / `close` / `toggle` / `select`, opener pairing (`[menu-button]` or a plain control inside the root), roving tabindex on `[menuitem]`, exclusive among menus, Escape with popover (yields to modal/drawer; combobox / toast / tooltip yield to an open menu).
* Boolean `[menu]` attr (no HTML global `menu`; not the `<menu>` element). Placement CSS-absolute from the root (`top|bottom|left|right`); z-index 1050.
* Distinct from popover, combobox, native `<select>`, menubar, and context menu. No submenus, no typeahead, no Sig Menu factory.
* Runtime docs and maturity notes in this pass. Menu is the twelfth Emerging auto-enhance runtime.

### Since 0.8.0 (the 0.9.0 lane)

This is the stack that shipped in 0.9.0.

* **Switch A→B→C.** Shared `--juice-switch-*` roles for `[switch]` (#179). DOM-first APG switch runtime (#181): `createSwitch` / `initSwitch` / `startSwitchRuntime` / `stopSwitchRuntime`, auto-boot, `toggle` / `check` / `uncheck` / `setChecked` / `isChecked`, `role="switch"` plus binary `aria-checked` on button hosts (checkbox-backed hosts stay honest with `:checked`).
* Click and Enter/Space toggle. Disabled / `aria-disabled` ignored.
* Authors must supply the accessible name. No focus trap, no Escape steal, no tri-state, no menuitemcheckbox, no Sig Switch factory.
* Runtime docs and maturity notes shipped with the cut. Switch is the thirteenth Emerging auto-enhance runtime.
* **Slider A→B→C.** Shared `--juice-slider-*` roles for `[slider]` / `[slider-fill]` / `[slider-thumb]` (#183). DOM-first APG slider runtime (#185): `createSlider` / `initSlider` / `startSliderRuntime` / `stopSliderRuntime`, auto-boot, `setValue` / `getValue` / `increment` / `decrement`, `role="slider"` plus `aria-valuemin` / `aria-valuemax` / `aria-valuenow` on `[slider-thumb]`, and `--juice-slider-ratio` on the host.
* Arrows / Home / End / PageUp / PageDown. Pointer jump and drag.
* Disabled / `aria-disabled` ignored. Authors must supply the accessible name.
* No Escape, no vertical, no multi-thumb, no native range restyle, no Sig Slider factory. Runtime docs and maturity notes shipped with the cut.
* Slider is the fourteenth Emerging auto-enhance runtime.
* **Checkbox A→B→C.** Shared `--juice-checkbox-*` roles for `[checkbox]` (#189). DOM-first APG checkbox runtime (#190): `createCheckbox` / `initCheckbox` / `startCheckboxRuntime` / `stopCheckboxRuntime`, auto-boot, `toggle` / `check` / `uncheck` / `setChecked` / `isChecked`, `role="checkbox"` plus binary `aria-checked` on button hosts (native `<input type="checkbox" checkbox>` hosts stay honest with `:checked`).
* Click and Enter/Space toggle. Disabled / `aria-disabled` ignored.
* Authors must supply the accessible name. No focus trap, no Escape steal, no tri-state, no menuitemcheckbox, no Sig Checkbox factory.
* Runtime docs and maturity notes shipped with the cut. Checkbox is the fifteenth Emerging auto-enhance runtime.
* **Radio A→B→C.** Shared `--juice-radio-*` roles for `[radio]` inside layout-only `[radiogroup]` (no `--juice-radiogroup-*`) (#189). DOM-first APG radio runtime (#190): `createRadio` / `initRadio` / `startRadioRuntime` / `stopRadioRuntime`, auto-boot, `select` / `getChecked`, exclusive selection, roving tabindex.
* Click, Enter, and Space select. Arrows move among enabled options and wrap.
* Orphans outside `[radiogroup]` are ignored. Disabled / `aria-disabled` skipped.
* Authors must supply the accessible name. No focus trap, no Escape, no Sig Radio factory.
* Runtime docs and maturity notes shipped with the cut. Radio is the sixteenth Emerging auto-enhance runtime.
* Checkbox and radio are two runtimes.
* **Breadcrumb A→B→C.** Shared `--juice-breadcrumb-*` roles for `[breadcrumb]` / `[breadcrumb-item]` / `[breadcrumb-link]` (#194). Light DOM-first runtime (#196): `createBreadcrumb` / `initBreadcrumb` / `startBreadcrumbRuntime` / `stopBreadcrumbRuntime`, auto-boot, `sync` / `setCurrent`.
* An unlabeled navigation landmark is named `Breadcrumb`. `<nav>` does not get a redundant role.
* `<ol breadcrumb>` stays a list. A single `aria-current="page"` is kept (author current wins; otherwise the last crumb).
* It does not remove `href`, trap focus, steal Escape, or listen to history. Not a router, not site `[nav]`, not `nav[type="breadcrumb"]`, not tabs, not a wizard step tracker, and not pagination.
* No Sig Breadcrumb factory. Runtime docs and maturity notes shipped with the cut.
* Breadcrumb is the seventeenth Emerging auto-enhance runtime.
* **Progress A→B→C.** Shared `--juice-progress-*` roles for `[progress]` / `[progress-fill]` / optional `[progress-label]` (#198). DOM-first APG progress runtime (#199): `createProgress` / `initProgress` / `startProgressRuntime` / `stopProgressRuntime`, auto-boot, `setValue` / `getValue` / `setIndeterminate` / `isIndeterminate`.
* `role="progressbar"` plus `aria-valuemin` / `aria-valuemax` / `aria-valuenow` and `--juice-progress-ratio` on the host. Determinate is the boolean attribute.
* A missing or non-numeric `aria-valuenow` is min (an empty bar), not indeterminate. Values clamp.
* Indeterminate is `progress="indeterminate"` only: that flag clears `aria-valuenow` and restores the last determinate value when the flag clears. CSS owns the sliding fill.
* Authors must supply the accessible name. The runtime does not invent or rewrite `aria-valuetext`.
* No keyboard, no pointer, no tabindex, no focus trap, no Escape, no native `<progress>` restyle, and no Sig Progress factory. Runtime docs and maturity notes shipped with the cut.
* Progress is the eighteenth Emerging auto-enhance runtime.

### Since 0.9.0 (the 0.9.1 lane)

This is the stack that shipped in 0.9.1.

* **Pagination A→B→C.** Shared `--juice-pagination-*` roles for `[pagination]` / `[pagination-item]` / `[pagination-prev]` / `[pagination-next]` / optional `[pagination-ellipsis]` / `[pagination-status]` (#204). DOM-first page-set runtime (#205): `createPagination` / `initPagination` / `startPaginationRuntime` / `stopPaginationRuntime`, auto-boot, `sync` / `setCurrent`.
* An unlabeled navigation landmark is named `Pagination`. `<nav>` does not get a redundant role.
* `<ol pagination>` stays a list. An author role is kept.
* A single `aria-current="page"` is kept (author first current wins; otherwise the first page control). Prev/next disable at ends when page controls and optional ellipsis make that inferable.
* A current whose text or `aria-label` is the digits `1` disables prev even when an ellipsis sits before it. An ellipsis after the current page keeps next enabled.
* Status text is not parsed. Author-owned disabled is left.
* Runtime-owned disabled is `aria-disabled="true"`, plus `disabled` on buttons. Arrow / Home / End move focus among enabled controls and do not wrap.
* Enter and Space stay with the browser. A disabled link click is cancelled.
* It does not remove `href`, trap focus, steal Escape, or listen to history. Not a router, not site `[nav]`, not `nav[type="pagination"]`, not a breadcrumb, not tabs, and not a wizard step tracker.
* No Sig Pagination factory. Runtime docs and maturity notes shipped with the cut.
* Pagination is the nineteenth Emerging auto-enhance runtime.
* **Ten retro library themes.** `retro-afterburn`, `retro-arcade-glow`, `retro-boardwalk`, `retro-denim-dial`, `retro-forest-radio`, `retro-orchard-club`, `retro-poolside-pop`, `retro-signal-garden`, `retro-sunset-motel`, and `retro-violet-parlor` ship as separate CSS entrypoints (`@citrusworx/juiceui/styles/themes/<id>`, `dist/themes/<id>.css`). There is no `retro.css` bundle. Blush stays under `src/themes/_draft/`.

### Since 0.9.1 (published through 0.9.5)

Disclosure, spinner, select, input, textarea, field, and motion core shipped in 0.9.2. Icon button A→B→C shipped in 0.9.3.

Avatar A→B→C shipped in 0.9.3. Table A→B→C shipped in 0.9.3.

Table is a runtime. Skeleton chrome and docs shipped in 0.9.3.

Skeleton is CSS-only and is not a runtime. List chrome and docs shipped in 0.9.3.

List is CSS-only and is not a runtime. Badge layout shipped in npm 0.9.2.

Core `--juice-badge-*` roles and the badge doc are shipped in 0.9.3. Badge is CSS-only and is not a runtime.

Safe area chrome shipped in 0.9.3. Safe area is CSS-only and is not a runtime.

`juice:change` / `getState()` shipped in 0.9.3.

* **Disclosure A→B→C.** Shared `--juice-disclosure-*` roles for `[disclosure]` / `[disclosure-trigger]` / `[disclosure-panel]` (#216). DOM-first disclosure runtime (#217): `createDisclosure` / `initDisclosure` / `startDisclosureRuntime` / `stopDisclosureRuntime`, auto-boot, `sync` / `expand` / `collapse` / `toggle`.
* One trigger toggles one panel. Pairing is `aria-controls` inside the root, otherwise the next sibling panel.
* Orphans outside `[disclosure]` are ignored. Open/closed state is `aria-expanded` plus native `hidden` and `aria-hidden`.
* Layout `content=` is never written. Click toggles.
* Enter and Space toggle non-button triggers that are not anchors with `href`. Escape collapses the focused open disclosure, or the last opened one, returns focus to that trigger, and yields to an open modal, drawer, or popover.
* There is no exclusive group, no arrow roving, and no global disclosure Escape. Not an accordion (`[accordion]` / `[accordion-item]` stays multi-item and multi-open).
* No Sig Disclosure factory. Runtime docs and maturity notes in this pass.
* Disclosure is the twentieth Emerging auto-enhance runtime. Shipped in 0.9.2.
* **Spinner A→B→C.** Shared `--juice-spinner-*` roles for `[spinner]` / optional `[spinner-label]` (#219). DOM-first indeterminate busy-indicator runtime (#220): `createSpinner` / `initSpinner` / `startSpinnerRuntime` / `stopSpinnerRuntime`, auto-boot, `sync` / `show` / `hide` / `isShown`.
* Shown hosts get `role="status"` and `aria-busy="true"`. `hide` sets native `hidden` and clears both so a hidden spinner does not announce as busy.
* A visible `[spinner-label]` is author text. The runtime does not invent `aria-label` when there is no visible label, and it does not copy a label into a name.
* CSS owns the spin (`juice-spinner-spin`). `prefers-reduced-motion` stops that animation and leaves the indicator.
* No value, no keyboard, no Escape, no focus trap, and no Sig Spinner factory. Distinct from progress (a valued bar) and from disclosure.
* Runtime docs and maturity notes in this pass. Spinner is the twenty-first Emerging auto-enhance runtime.
* Shipped in 0.9.2.
* **Select A→B→C.** Shared `--juice-select-*` roles for `<select select>` / optional `[select-label]` (#222). DOM-first native-select runtime (#223): `createSelect` / `initSelect` / `startSelectRuntime` / `stopSelectRuntime`, auto-boot, `sync`.
* A visible label names the control when the author has not set `aria-label` or `aria-labelledby`. Order: associated `<label for>`, wrapping `<label>`, then `[select-label]` (`for` / `id`, a wrapping element, or the nearest preceding sibling).
* A separate label is referenced with `aria-labelledby`. A wrapping label is copied into `aria-label` as its visible text excluding the select, so the selected option is not part of the name.
* Hidden or empty labels are skipped. No name is invented when nothing visible is there.
* A name this runtime wrote is removed if that label goes away. `title` is left untouched and does not block a visible label.
* Change events and the keyboard stay native. `[multiple]` and `size` listboxes stay native selects.
* The open list stays the platform popup. There is no listbox, no Escape handler, no focus trap, and no Sig Select factory.
* Distinct from combobox. Runtime docs and maturity notes in this pass.
* Select is the twenty-second Emerging auto-enhance runtime. Shipped in 0.9.2.
* **Input A→B→C.** Shared `--juice-input-*` roles for `<input input>` / optional `[input-label]` (#229). DOM-first native-input runtime (#230): `createInput` / `initInput` / `startInputRuntime` / `stopInputRuntime`, auto-boot, `sync`.
* `createInput` and `initInput` are the same function. A visible label names the control when the author has not set `aria-label` or `aria-labelledby`.
* Order: associated `<label for>`, wrapping `<label>`, then `[input-label]` (`for` / `id`, a wrapping element, or the nearest preceding sibling). A separate label is referenced with `aria-labelledby`.
* A wrapping label is copied into `aria-label` as its visible text excluding the input's own value. Hidden or empty labels are skipped.
* No name is invented when nothing visible is there. A name this runtime wrote is removed if that label goes away.
* `title` is left untouched and does not block a visible label. Typing, change, and the keyboard stay native.
* Text-like controls only: missing type, empty type, text, email, password, search, tel, url, and number. Checkbox, radio, range, file, date, time, datetime-local, month, week, color, hidden, button, submit, reset, and image are ignored.
* There is no mask, no validation engine, no floating label, no Escape handler, no focus trap, and no Sig Input factory. Distinct from combobox and from select.
* Textarea and the `[field]` wrapper are not this runtime. Runtime docs and maturity notes in this pass.
* Input is the twenty-third Emerging auto-enhance runtime. Shipped in 0.9.2.
* **Textarea A→B→C.** Shared `--juice-textarea-*` roles for `<textarea textarea>` / optional `[textarea-label]` (#232). DOM-first native-textarea runtime (#233): `createTextarea` / `initTextarea` / `startTextareaRuntime` / `stopTextareaRuntime`, auto-boot, `sync`.
* `createTextarea` and `initTextarea` are the same function. A visible label names the control when the author has not set `aria-label` or `aria-labelledby`.
* Order: associated `<label for>`, wrapping `<label>`, then `[textarea-label]` (`for` / `id`, a wrapping element, or the nearest preceding sibling). A separate label is referenced with `aria-labelledby`.
* A wrapping label is copied into `aria-label` as its visible text excluding the textarea's own value. Hidden or empty labels are skipped.
* No name is invented when nothing visible is there. A name this runtime wrote is removed if that label goes away.
* `title` is left untouched and does not block a visible label. Typing, change, and the keyboard stay native.
* There is no auto-grow, no character count, no validation engine, no floating label, no Escape handler, no focus trap, and no Sig Textarea factory. Distinct from input, select, and combobox.
* The `[field]` wrapper is not this runtime. Runtime docs and maturity notes in this pass.
* Textarea is the twenty-fourth Emerging auto-enhance runtime. Shipped in 0.9.2.
* **Motion core.** Duration and ease tokens (`--juice-motion-duration-instant|fast|base|slow`, `--juice-motion-ease-standard|enter|exit|linear`), derived in-out and steps, and spinner / progress duration hooks. Durations collapse to `0.01ms` under reduced motion.
* Shared helper (`prefersReducedMotion`, `subscribeReducedMotion`, `createMotionCancelToken`, `runMotion`, `createElementMotion`) drives `data-motion-state` (`entering` / `entered` / `exiting` / `exited`). Modal, drawer, popover, and toast play enter and exit; `hidden` is set after exit, and the trap and Escape still apply until then.
* Focus restores after `hidden` is set. Accordion and disclosure height animation runs when `[motion="accordion"]` is on the panel.
* Toast auto-dismiss and the tooltip hide delay stay reading time. Docs and the P0 catalog CSS gate are in.
* Stays Emerging. Shipped in 0.9.2.
* See [Animations](./juice-animations.md).
* **Field A→B→C.** Shared `--juice-field-*` roles for `[field]` / optional `[field-label]`, `[field-help]`, and `[field-error]`, plus `[invalid]` on the wrapper (#235). DOM-first field runtime (#236): `createField` / `initField` / `startFieldRuntime` / `stopFieldRuntime`, auto-boot, `sync`.
* `createField` and `initField` are the same function. The controller is `destroy` and `sync`.
* The first input, textarea, or select inside the wrapper is described by visible `[field-help]` and `[field-error]` when the author has not set `aria-describedby`. Nested fields keep their own parts.
* Hidden or empty parts are skipped. An id is added only when a referenced part has none.
* `[invalid]` sets `aria-invalid="true"` on that control when the author has not set `aria-invalid`. A blank value is not a description and not an invalid state.
* Clearing `[invalid]`, removing a part, or calling `destroy` removes only what the runtime wrote. `[field-label]` is chrome only.
* Name the control with `<label for>`, a wrapping `<label>`, or `[input-label]`, `[textarea-label]`, or `[select-label]`. Naming stays with the input, textarea, and select runtimes.
* Typing, change, and the keyboard stay native. There is no validation engine, no floating label, no Escape handler, no focus trap, and no Sig Field factory.
* Distinct from input, textarea, select, and combobox. Runtime docs and maturity notes in this pass.
* Field is the twenty-fifth Emerging auto-enhance runtime. Shipped in 0.9.2.
* **Icon button A→B→C.** Core `--juice-icon-button-*` geometry on `[icon-button]` (#259): square, `[icon-button="round"]` / `[round]`, `[scale="sm"|"lg"]`, `[pressed]` / `[aria-pressed="true"]` inset ring, `:focus-visible` 2px ring, disabled `opacity: 0.5`, `:active` `translateY(2px)`, motion tokens with reduced motion off. Color stays on `button` / `[btn]`.
* Shipped themes are not required to bind the geometry. DOM-first runtime (#263): `createIconButton` / `initIconButton` / `startIconButtonRuntime` / `stopIconButtonRuntime`, auto-boot.
* `createIconButton` and `initIconButton` are the same function. The controller is `destroy`, `sync`, `toggle`, and `getState`.
* State is `{ pressed, disabled, named }`. `[toggle]` flips `aria-pressed` and `[pressed]`.
* An initial `[pressed]` or `aria-pressed="true"` starts pressed. A non-toggle is not given `aria-pressed`.
* Disabled hosts do not flip. Enter and Space flip a toggle only when the host is not a native button and not an `<a href>`.
* Those hosts get `role="button"` and `tabindex="0"` only when the author has not set them. An accessible name is a non-empty `aria-label`, an `aria-labelledby` that resolves to visible text, or visible text on the host.
* `title` does not count. No name is invented.
* In development, an unnamed host warns once per element. A real change dispatches bubbling `juice:change` with `runtime: "icon-button"`.
* There is no focus trap, no Escape handler, and no Sig IconButton factory. Distinct from switch and from checkbox.
* Runtime docs and maturity notes in this pass. Icon button is the twenty-sixth Emerging auto-enhance runtime, shipped in 0.9.3.
* **Skeleton chrome and docs.** Core `--juice-skeleton-*` roles on `[skeleton]` / `[skeleton="rect"]` / `[skeleton="text"]` / `[skeleton="circle"]` (#269). `[lines="1"`…`"8"]` or stacked element children (a `width` shortens the last line).
* `[scale="sm"|"lg"]`. `[static]` and `prefers-reduced-motion` remove the sheen and keep the base.
* Color is restated on `[theme]` (inherited ink mixed into the muted surface). The highlight is a translucent white sheen.
* Shipped themes are not required to bind the roles. No runtime, no JS export, and no Sig Skeleton factory.
* Authors own `aria-busy`. Distinct from spinner and from progress.
* Docs in this pass. Skeleton shipped in 0.9.3.
* Not one of the thirty-one Emerging auto-enhance runtimes. See [Skeleton](./juice-skeleton.md).
* **List chrome and docs.** Core `--juice-list-*` roles on `:where(ul, ol, div)[list]` (#283). `[divided]` and `[dense]` apply only with `[list]`.
* `[list-item]` holds `[list-leading]`, `[list-content]`, `[list-secondary]`, and `[list-trailing]`. `[leading]` stays letter-spacing.
* Interactive `a` / `button` rows hover, press, and take a 2px `currentColor` `:focus-visible` outline, offset 2px. `[selected]` and `aria-current` other than `"false"` share the selected wash.
* Disabled interactive rows are `opacity: 0.5`. Color roles are `currentColor` mixes, restated on `[theme]`.
* Layout roles stay on `:root`. Shipped themes are not required to bind the roles.
* Background and color use `--juice-motion-duration-fast` and `--juice-motion-ease-standard`. `prefers-reduced-motion` sets `transition: none`.
* No runtime, no JS export, no `juice:change`, no `getState()`, and no Sig List factory. `[selected]` is visual only.
* Distinct from menu, combobox, tabs, pagination, and breadcrumb. `<input list>` is not painted.
* Shipped in 0.9.3. Not one of the thirty-one Emerging auto-enhance runtimes.
* See [List](./juice-list.md).
* **Badge chrome and docs.** Core layout on `[badge]` / `[badge="square"]` / `[badge="ribbon"]` shipped in npm 0.9.2 (`badge.scss`, compiled into `dist/index.css`).
* Core `--juice-badge-*` roles shipped in 0.9.3: color (`--juice-badge-bg` at 1% `currentColor`, `--juice-badge-ink` as `currentColor`, `--juice-badge-border` at 24%) on `:root` and again on `[theme]`, layout (padding, radius, square radius, font size, gap) on `:root` only. `[theme] [badge]` is `(0, 2, 0)` and keeps that ink and `line-height: 1` over theme copy rules.
* `[theme] [cta] [badge]` is `(0, 3, 0)`. An `a` or `button` badge takes a 2px `currentColor` focus outline.
* KiwiPress still paints the default, `[warm]`, ribbon, and `[wizard-header] [brand] [badge]` outside `[cta]`. `[dev-hero-header] > [badge]` and `[wizard-header] [brand] [badge]` adjust the box.
* `[card="pricing"]` is the positioned parent for a ribbon. No runtime, no JS export, no `juice:change`, no `getState()`, and no Sig Badge factory.
* Not one of the thirty-one Emerging auto-enhance runtimes. See [Badge](./juice-badge.md).
* **Safe area chrome and docs.** CSS-only padding on `[safe-area]` / `[safe-area="top"]` / `[safe-area="bottom"]` / `[safe-area="x"]` / `[safe-area="y"]` (#294). An empty or unknown value pads all four edges.
* Each edge is `max(var(--juice-safe-area-pad), env(safe-area-inset-*, 0px))`. `--juice-safe-area-pad` is `1rem` on `:root` only and is not restated on `[theme]`.
* The all-four selector is a `:not()` chain at `(0, 5, 0)`. `nav[fixed] > [container][safe-area]` and the sticky twin, and `[wizard-header] > [container][safe-area]`, restate the host.
* `x` and `y` are physical. There is no margin mode and no runtime.
* `viewport-fit=cover` is required on the viewport meta tag. Shipped themes do not bind the role.
* Docs in this pass. Safe area shipped in 0.9.3.
* Not one of the thirty-one Emerging auto-enhance runtimes. See [Safe Area](./juice-safe-area.md).
* **Avatar A→B→C.** Core `--juice-avatar-*` roles on `[avatar]` (#275): round by default, `[avatar="square"]`, `[scale="sm"|"lg"]`, an `<img>` covering the initials, `[status="online|away|busy|offline"]` as a `::after` dot, and `[avatar-group]` with `[avatar-more]` as a `+N` chip. Shipped themes are not required to bind the roles.
* Tide lifts `--juice-avatar-status-away` only. DOM-first image-fallback runtime (#277): `createAvatar` / `initAvatar` / `startAvatarRuntime` / `stopAvatarRuntime`, auto-boot.
* `createAvatar` and `initAvatar` are the same function. The controller is `destroy`, `sync`, and `getState`.
* State is `{ loaded, fallback, hasImage }`. A broken, empty, or already-failed image sets `[fallback]` on the avatar and `hidden` on the image.
* A later successful load clears both. An empty `src` with a real `srcset` waits.
* `destroy()` keeps the fallback. The runtime does not touch `alt`, labels, or initials.
* A real change dispatches bubbling `juice:change` with `runtime: "avatar"`. There is no keyboard handler, no focus trap, no Escape handler, and no Sig Avatar factory.
* `@citrusworx/sigjs/juice` `bind` accepts this runtime and stays read-only. A Juice build that does not export the matching `start*Runtime` throws `needs a newer @citrusworx/juiceui`.
* Runtime docs and maturity notes in this pass. Avatar is the twenty-seventh Emerging auto-enhance runtime, shipped in 0.9.3.
* See [Avatar](./juice-avatar.md).
* **Table A→B→C.** Core `--juice-table-*` roles on `:where(table)[table]` (#287): `[striped]`, `[dense]`, `[sticky]` (inside `[table-scroll]` the head sticks to the wrapper; omit the wrapper for page sticky), `[table-scroll]` (authors add `tabindex="0"`, `role="region"`, and an accessible name), `[table-align="start|center|end"]`, `[numeric]` (`tabular-nums`), and `[selected]` / `aria-selected="true"`.
* The plate is `--juice-surface-strong-bg` (white fallback). Cell `p`, `span`, `li`, and `label` use body ink.
* Color roles are `currentColor` mixes, restated on `[theme]`. Layout roles stay on `:root`.
* Shipped themes are not required to bind the roles. DOM-first sortable runtime (#289): `createTable` / `initTable` / `startTableRuntime` / `stopTableRuntime`, auto-boot.
* `createTable` and `initTable` are the same function. The controller is `destroy`, `sync`, and `getState`.
* State is `{ column, direction }`. `column` is null when direction is none.
* `th[sortable]` cycles ascending, then descending, then none, sets `aria-sort`, and reorders each `tbody`. Comparison uses `data-sort-value` when present, otherwise collapsed text, with `Intl.Collator` (`numeric: true`, `sensitivity: "base"`) or a numeric parse.
* Non-numbers sort last both ways. Ties keep original order.
* A cancelable `juice:sort` (`{ column, direction }`) fires before reorder. `preventDefault()` updates `aria-sort` and state and leaves the rows.
* A real change dispatches bubbling `juice:change` with `runtime: "table"`. `cellIndex` is not a visual column.
* An author `aria-sort` of ascending or descending is adopted and does not reorder until the next activation. `destroy()` restores headers, author `aria-sort`, and row order.
* There is no focus trap, no Escape handler, and no Sig Table factory. `@citrusworx/sigjs/juice` `bind` accepts this runtime and stays read-only.
* A Juice build that does not export the matching `start*Runtime` throws `needs a newer @citrusworx/juiceui`. Runtime docs and maturity notes in this pass.
* Table is the twenty-eighth Emerging auto-enhance runtime, shipped in 0.9.3. See [Table](./juice-table.md).
* **Pressable A→B→C.** Core `--juice-pressable-*` roles on `[pressable]` / `[pressable="scale"]` (#299, ring in #301). Hover is a 1px inset `currentColor` ring under `@media (hover: hover)`.
* Pressed is a 2px inset ring on `:active` and `[pressed]`. Focus is a 2px `currentColor` outline, offset 2px.
* `[pressable="scale"]` uses `scale(0.98)`. Color rings are restated on `[theme]`.
* Radius, duration, easing, and scale stay on `:root`. Shipped themes are not required to bind the roles and may restate them.
* The ring is full ink: Citrusmint's 1% wash is 4.56:1, and a mix under 80% misses 3:1. Body ink is 4.62:1 on the page and 5.17:1 on the strong surface.
* Muted copy on an `li` host is 1.95:1 / 2.18:1. DOM-first runtime (#303): `createPressable` / `initPressable` / `startPressableRuntime` / `stopPressableRuntime`, auto-boot.
* The controller is `destroy`, `sync`, and `getState`. State is `{ pressed, longPressed }`.
* `[pressable-longpress]` opts into `juice:longpress` (default 500ms). A canceled long-press keeps the next click.
* Otherwise that click is suppressed once. Space on a custom button host is `preventDefault`'d so the page does not scroll.
* Native buttons, inputs, textareas, selects, summaries, and contenteditable hosts keep Space. Enter is never `preventDefault`'d.
* The runtime does not add `role` or `tabindex`. `[icon-button][toggle]` and `aria-pressed` keep latched `[pressed]`.
* Disabled hosts do not press, and the `:where()` gate does not clear a latched icon-button ring. No pseudo-element and no position.
* No Sig Pressable factory. `bind()` does not name pressable, touchable-row, or keyboard-avoider yet.
* Docs in this pass. Pressable shipped in 0.9.4.
* The twenty-ninth Emerging auto-enhance runtime. See [Pressable](./juice-pressable.md).

* **Touchable row A→B→C.** Core `--juice-touchable-row-*` roles on `[touchable-row]` (#306). Hosts are `a`, `button`, `li`, and `div`.
* Words are `dense`, `chevron`, `undivided`, plus runtime `select` and `activate`. Slots are leading, content, title, subtitle, and trailing.
* A direct title truncates, and `="clamp"` uses the line clamp (2). Minimum height stays `44px`.
* The selected state is a 3px start border in registered body ink, not a wash. Every theme clears 3:1.
* Citrusmint is the floor at 4.62:1 on the page and 5.17:1 on the strong surface. The divider is a 28% mix and stays under 3:1.
* There is no motion role, because a host `transition` would replace Pressable's `box-shadow` timing. DOM-first runtime (#308): `createTouchableRow` / `initTouchableRow` / `startTouchableRowRuntime` / `stopTouchableRowRuntime`, auto-boot.
* The controller is `destroy`, `sync`, and `getState`. State is `{ selected, disabled }`.
* `[touchable-row~="select"]` toggles `[selected]` plus `aria-selected`, or `aria-current` on a link. Rows do not clear their siblings.
* Enter and Space on an `li` or `div` dispatch one click. Space on those hosts is `preventDefault`'d.
* Native `a` and `button` keep their click. A canceled `[pressable-longpress]` still selects.
* A suppressed long-press click does not. No Sig TouchableRow factory.
* `bind()` does not name pressable, touchable-row, or keyboard-avoider yet. Docs in this pass.
* Shipped in 0.9.4. The thirtieth Emerging auto-enhance runtime.
* See [Touchable Row](./juice-touchable-row.md).

* **KeyboardAvoider A→B→C.** Layout roles on `:root` only (`[keyboard-avoider]`, #310). Not restated on `[theme]`. `--juice-keyboard-inset` is a registered `<length>` (`0px`).
* Padding, translate, and footer compose with `~=`. `noscroll` is a runtime word. Safe Area padding mode uses `max()` of the floor, the home indicator, and the keyboard inset.
* Translate-only and footer-only keep Safe Area's own padding. Footer mode on `nav[fixed]` sets `bottom: auto`, so the bar does not stretch. Put padding mode on a drawer's scroll body.
* DOM-first runtime (#311): `createKeyboardAvoider` / `initKeyboardAvoider` / `startKeyboardAvoiderRuntime` / `stopKeyboardAvoiderRuntime`. State is `{ open, inset }`.
* `open` is the overlap greater than `threshold` (default 80) and an editable field focused. There is no MutationObserver. No Sig KeyboardAvoider factory.
* `bind()` does not name keyboard-avoider, pressable, or touchable-row yet. Shipped in 0.9.5. The thirty-first Emerging auto-enhance runtime.
* See [Keyboard avoider](./juice-keyboard-avoider-runtime.md) and the [layout contract](./juice-keyboard-avoider.md).

* **Mobile-Critical.** Safe area shipped in 0.9.3. Pressable and touchable row shipped in 0.9.4. Keyboard avoider shipped in 0.9.5.

Sheet, SwipeActions, and PullToRefresh remain. They are not in this tree. This note does not describe their markup.

* **Sig hookup is done.** All thirty-one runtimes expose `getState()`. Twenty-eight dispatch `juice:change`; select, input, and textarea publish through native `input` and `change` (#247).
* Icon button, avatar, table, pressable, touchable row, and keyboard avoider are six of the twenty-eight. Pressable, touchable row, and keyboard avoider are not `JuiceRuntimeName` values yet.
* The table is [Runtime Behavior](./juice-runtime-behavior.md#juicechange). Juice works without Sig: that contract is DOM, and the runtimes do not import Sig.
* The optional adapter is `@citrusworx/sigjs/juice` `bind(host, runtime?)` (#249), documented in [Sig.js + Juice](../sigjs/sig-juice-integration.md#runtime-binding). Write-back is switch, checkbox, disclosure, modal, and icon-button (`pressed`, `[toggle]` hosts only; a refused write snaps the signal back).
* Avatar and table are read-only. `JuiceRuntimeName` is twenty-eight names, including icon-button, avatar, and table (PR #295, npm `@citrusworx/sigjs@0.7.2`).
* On a Juice build that does not export `startIconButtonRuntime`, `startAvatarRuntime`, or `startTableRuntime` (published `@citrusworx/juiceui` 0.9.1 and 0.9.2 do not export them; they shipped in 0.9.3), binding that runtime throws `needs a newer @citrusworx/juiceui`. The module still loads, and the other runtimes still bind.
* This is not a Juice subpath and not a per-runtime Sig factory. `juice:change` and `getState()` shipped in 0.9.3, including icon button, avatar, and table. Pressable and touchable row dispatch them from 0.9.4.
* `bind` shipped in `@citrusworx/sigjs@0.4.0` and names all twenty-eight in **0.7.2**.

See [Surfaces](./juice-surfaces.md) [Theme Contract](./juice-theme-contract.md)

[Icons](./juice-icons.md) and [Typography Contract](./juice-typography-contract.md).

---

## Foundations That Still Stand

These were true before 0.4.0 and remain true:

* Layout and spacing are the identity of Juice. Plain `<section>` is a neutral semantic block; auto-responsive section layout is opt-in via `section[auto]`.
* Typography is a usable system layer (semantic text sizes, `lineHeight`, `fontWeight`, font loading), not a thin add-on. Author attrs now win over theme heading/paragraph defaults when set.
* Numeric sizing includes practical fractional rem values.
* Token/style split for gradients is the pattern to keep repeating.
* Templates (SaaS, retail, delivery, social feed, spa/marketing, hosting dashboard, FAQ) are still the best stress tests of aesthetic range and layout semantics.

---

## What Is Still Holding Juice Back

### 1. Remaining Surface Depth

Surface language A–C and remaining depth slices A–C ship. `shadowTone`, `overlay`, and `variant` utilities are **done**. See [Surfaces](./juice-surfaces.md).

Still later (light cross-link, not a hole in the utility pass):

* structural `card="…"` recipes in the [Surface Spec](./juice-surface-spec.md) / [Cards](./juice-cards.md)

Authors can compose visual character with the shipped utilities. Structural card recipes would still reduce hand-assembly for cards, panels, and heroes.

### 2. Components Are Uneven Beyond the Runtimes

Accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, breadcrumb, progress, pagination, disclosure, spinner, select, input, textarea, field, icon button, avatar, table, pressable, and touchable row have chrome plus auto-enhance. Navigation still exists and is still Emerging.

The Sig Accordion factory is real. There is no Sig Modal, Sig Drawer, Sig Toast, Sig Popover, Sig Wizard, Sig Tooltip, Sig Combobox, Sig Banner, Sig Menu, Sig Switch, Sig Slider, Sig Checkbox, Sig Radio, Sig Breadcrumb, Sig Progress, Sig Pagination, Sig Disclosure, Sig Spinner, Sig Select, Sig Input, Sig Textarea, or Sig Field, Sig IconButton, Sig Avatar, Sig Table, or Sig Pressable or Sig TouchableRow factory.

Checkbox and radio are two runtimes. Breadcrumb is a light trail.

Progress is a progressbar. Pagination is a page set.

Disclosure is a standalone one-trigger / one-panel control, distinct from accordion, and shipped in 0.9.2. Spinner is a standalone indeterminate busy indicator, distinct from progress and disclosure, and shipped in 0.9.2.

Select is a styled native `<select>`, distinct from combobox, and shipped in 0.9.2. Input is a styled native `<input>`, distinct from combobox and from select, and shipped in 0.9.2.

Textarea is a styled native `<textarea>`, distinct from input, select, and combobox, and shipped in 0.9.2. Field is a wrapper around a control, distinct from input, textarea, select, and combobox, and shipped in 0.9.2.

Icon button is a square icon-only control on button chrome, distinct from switch and from checkbox, and shipped in 0.9.3. Avatar is an initials-or-photo mark (`[avatar]`), distinct from a badge and from `[skeleton="circle"]`, and shipped in 0.9.3.

Table is a sortable grid on `<table table>`, and shipped in 0.9.3. Skeleton is CSS-only loading chrome (`[skeleton]`) shipped in 0.9.3, and is not a runtime.

List is CSS-only stacked rows (`[list]`) shipped in 0.9.3, and is not a runtime. Badge is CSS-only label chrome.

The base layout shipped in npm 0.9.2. Core `--juice-badge-*` roles shipped in 0.9.3.

Safe area is CSS-only inset chrome (`[safe-area]`) shipped in 0.9.3, and is not a runtime. Motion core shipped in 0.9.2.

That is not the same as a polished component library. Cards, buttons, forms, and nav variants are useful and still settling. Prop contracts for styling internal parts are still being figured out. Juice should not pretend the exported component surface is broader or more mature than it is.

### 3. Blush Is Still Draft

Tide is a shipped library theme. The ten retro themes (`retro-afterburn`, `retro-arcade-glow`, `retro-boardwalk`, `retro-denim-dial`, `retro-forest-radio`, `retro-orchard-club`, `retro-poolside-pop`, `retro-signal-garden`, `retro-sunset-motel`, `retro-violet-parlor`) are shipped library themes on master, each under `src/themes/<id>/`.

Blush is further back (YAML-only, no emitted CSS). Package `exports` and the published tarball still do not expose `_draft`.

### 4. Templates Still Expose Proportional Weaknesses

Juice can express many aesthetics, but dense layouts still reveal weaknesses in column math, containment, and app-style shell composition. That is useful signal, not failure. Templates should keep doing that job after each system improvement.

### 5. CLI and Generator Remain a Separate Track

The Juice CLI (`tooling/cli/juice`) and config-driven generation from `juice.config.yaml` are draft. They must not block the next runtime / component work. The theme contract on the shipped references (including the ten retro themes) is already documented and tested; the generator workflow is a different problem.

### 6. Optional Later Type Size-Step

The authoring contract is in. Author type attrs already beat theme semantic defaults. Remaining typography work, if any, is a later `xs` / `1rem` `fontSize` step or type-token gap — not the theme-versus-author cascade, and not a hole that should reorder this list.

---

## Revised Priorities

Lock this build order. Do not reorder it because a later item is more exciting.

### Closed / done (old P1–P3, plus the 0.6.0 through 0.9.5 publishes)

These were the lock order after 0.4.0. Surfaces, the theme contract, and typography / icon polish shipped in the 0.6.0 public cut.

Drawer / toast / popover shipped in 0.7.0. Wizard A→B→C, tooltip A→B→C, combobox A→B→C, banner A→B→C, eleven-runtime polish A→B→C, and menu A→B→C shipped in 0.8.0.

Switch A→B→C, slider A→B→C, checkbox A→B→C, radio A→B→C, breadcrumb A→B→C, and progress A→B→C shipped in 0.9.0. Those eighteen stay Emerging.

Pagination A→B→C and the ten retro library themes shipped in 0.9.1. Disclosure A→B→C, spinner A→B→C, select A→B→C, input A→B→C, textarea A→B→C, and field A→B→C shipped in 0.9.2.

Motion core shipped in 0.9.2 and stays Emerging. Switch is the thirteenth Emerging auto-enhance runtime.

Slider is the fourteenth. Checkbox is the fifteenth.

Radio is the sixteenth. Breadcrumb is the seventeenth.

Progress is the eighteenth. Pagination is the nineteenth.

Disclosure is the twentieth. Spinner is the twenty-first.

Select is the twenty-second. Input is the twenty-third.

Textarea is the twenty-fourth. Field is the twenty-fifth.

Icon button is the twenty-sixth. Avatar is the twenty-seventh.

Table is the twenty-eighth. Checkbox and radio are two runtimes.

Breadcrumb is a light trail. Progress is a progressbar.

Pagination is a page set. Disclosure is a standalone one-trigger / one-panel control, distinct from accordion.

Spinner is a standalone indeterminate busy indicator, distinct from progress and disclosure. Select is a styled native `<select>`, distinct from combobox.

Input is a styled native `<input>`, distinct from combobox and from select. Textarea is a styled native `<textarea>`, distinct from input, select, and combobox.

Field is a wrapper around a control, distinct from input, textarea, select, and combobox. Icon button is a square icon-only control on button chrome, distinct from switch and from checkbox, and shipped in 0.9.3.

Avatar is an initials-or-photo mark (`[avatar]`), distinct from a badge and from `[skeleton="circle"]`, and shipped in 0.9.3. Icon button is the twenty-sixth Emerging auto-enhance runtime.

Avatar is the twenty-seventh Emerging auto-enhance runtime and shipped in 0.9.3. Table is the twenty-eighth Emerging auto-enhance runtime and shipped in 0.9.3.

Pressable is the twenty-ninth Emerging auto-enhance runtime and shipped in 0.9.4. Touchable row is the thirtieth Emerging auto-enhance runtime and shipped in 0.9.4.

All thirty-one stay Emerging. Skeleton chrome and docs shipped in 0.9.3 (CSS-only, not a runtime).

List chrome and docs shipped in 0.9.3 (CSS-only, not a runtime). Badge `--juice-badge-*` roles shipped in 0.9.3 (CSS-only, not a runtime; the base layout shipped in npm 0.9.2).

Safe area chrome shipped in 0.9.3 (CSS-only, not a runtime).

* **Old P1 — Expand surfaces A–C.** `surfaceTone`, `borderStrength`, and standalone `blur` ship. Theme roles and bind tests cover the first two; blur is a core utility.
* **Old P2 — Formalize the theme contract.** [Theme Contract](./juice-theme-contract.md) is the canonical checklist. `libraries/juice/src/juice.theme-contract.test.ts` fails verify if a shipped library theme drops a required `--juice-*` bind. Slice C is vacant.
* **Old P3 — Typography / icon polish.** Icon contract, typography contract, and author type attrs beating theme defaults are in. See [Icons](./juice-icons.md) and [Typography Contract](./juice-typography-contract.md).
* **Old P4 — Publish the pending Juice stack.** `@citrusworx/juiceui@0.9.0` was an earlier public npm cut (switch / slider / checkbox / radio / breadcrumb / progress). `@citrusworx/juiceui@0.9.1` shipped pagination and the ten retro library themes.
* `@citrusworx/juiceui@0.9.5` is live on npm (published 2026-10-30 15:11 UTC). `@citrusworx/juiceui@0.9.2` shipped disclosure, spinner, select, input, textarea, field, and motion core. `juice:change` / `getState()` shipped in 0.9.3.
* Do not invent a next version number; the next cut happens when new Juice changesets exist.
* **Sig hookup.** `juice:change` and `getState()` shipped in 0.9.3 and cover the thirty-one runtimes as of 0.9.5.
* Pressable is the twenty-ninth. Touchable row is the thirtieth.
* `bind` does not name pressable, touchable-row, or keyboard-avoider yet. Optional `bind` lives at `@citrusworx/sigjs/juice` and names all twenty-eight (`JuiceRuntimeName` includes icon-button, avatar, and table).
* Icon-button writes back on a `[toggle]` host. Avatar and table are read-only.
* A Juice build that does not export those three start functions throws `needs a newer @citrusworx/juiceui` for that runtime only. Juice still runs with no Sig import.
* See [Runtime Behavior](./juice-runtime-behavior.md#juicechange).

### Priority 1. Remaining Surface Depth

A–C utilities and remaining depth slices A–C (`shadowTone`, `overlay`, `variant`) are **done**. Structural `card="…"` recipes can stay later — a light cross-link, not the next required library build.

See [Surfaces](./juice-surfaces.md) and [Cards](./juice-cards.md).

### Priority 2. Next Runtime / Component, Carefully

The browser behavior layer should keep growing, but slowly.

Modal / dialog **A→B→C shipped in 0.6.0**: theme chrome (`--juice-modal-*`), dialog runtime, and runtime / maturity docs. Valid `[modal-overlay]` markup auto-enhances.

Drawer **A→B→C shipped in 0.7.0**: theme chrome (`--juice-drawer-*`), dialog runtime, and runtime / maturity docs. Valid `[drawer-overlay]` markup auto-enhances.

Toast **A→B→C shipped in 0.7.0**: theme chrome (`--juice-toast-*`), snackbar runtime, and runtime / maturity docs. Valid `[toast-region]` markup auto-enhances.

Popover **A→B→C shipped in 0.7.0**: theme chrome (`--juice-popover-*`), anchored runtime, and runtime / maturity docs. Valid `[popover-root]` markup auto-enhances.

Wizard **A→B→C shipped in 0.8.0**: theme chrome (`--juice-wizard-*`), step runtime, and runtime / maturity docs. Valid `[wizard-shell]` markup auto-enhances. Wizard is the eighth Emerging auto-enhance runtime.

Tooltip **A→B→C shipped in 0.8.0**: theme chrome (`--juice-tooltip-*`), hover/focus runtime, and runtime / maturity docs. Valid `[tooltip-root]` markup auto-enhances. Tooltip is the ninth Emerging auto-enhance runtime.

Combobox **A→B→C shipped in 0.8.0**: theme chrome (`--juice-combobox-*`), listbox runtime, and runtime / maturity docs. Valid `[combobox]` markup auto-enhances. Combobox is the tenth Emerging auto-enhance runtime.

Banner **A→B→C shipped in 0.8.0**: theme chrome (`--juice-banner-*`), dismiss runtime, and runtime / maturity docs. Valid `[banner]` markup auto-enhances. Banner is the eleventh Emerging auto-enhance runtime.

**Eleven-runtime polish A→B→C shipped in 0.8.0.** Escape / layering, shared internals, and docs / Limitations / z-index consistency. Those eleven stay Emerging.

Menu **A→B→C shipped in 0.8.0**: theme chrome (`--juice-menu-*`), APG menu-button runtime, and runtime / maturity docs. Valid `[menu-root]` markup auto-enhances. Menu is the twelfth Emerging auto-enhance runtime.

Switch **A→B→C shipped in 0.9.0**: theme chrome (`--juice-switch-*`), APG switch runtime, and runtime / maturity docs. Valid `[switch]` markup auto-enhances. Switch is the thirteenth Emerging auto-enhance runtime. No tri-state. Authors must supply the accessible name. No Sig Switch factory.

Slider **A→B→C shipped in 0.9.0**: theme chrome (`--juice-slider-*`), APG slider runtime, and runtime / maturity docs. Valid `[slider]` markup auto-enhances. Slider is the fourteenth Emerging auto-enhance runtime. Horizontal only. No vertical, no multi-thumb, no native `<input type="range">` restyle, and no Escape. Authors must supply the accessible name. No Sig Slider factory.

Checkbox **A→B→C shipped in 0.9.0**: theme chrome (`--juice-checkbox-*`), APG checkbox runtime, and runtime / maturity docs. Valid `[checkbox]` markup auto-enhances. Checkbox is the fifteenth Emerging auto-enhance runtime. Binary only. No tri-state. Authors must supply the accessible name. No Sig Checkbox factory.

Radio **A→B→C shipped in 0.9.0**: theme chrome (`--juice-radio-*`), APG radio runtime, and runtime / maturity docs. Valid `[radio]` markup inside `[radiogroup]` auto-enhances.

Radio is the sixteenth Emerging auto-enhance runtime. Checkbox and radio are two runtimes.

Exclusive selection, roving tabindex, arrows plus Space/Enter/click. Orphans outside `[radiogroup]` are ignored.

No Escape. Authors must supply the accessible name.

No Sig Radio factory.

Breadcrumb **A→B→C shipped in 0.9.0**: theme chrome (`--juice-breadcrumb-*`), light trail runtime, and runtime / maturity docs. Valid `[breadcrumb]` markup auto-enhances. Breadcrumb is the seventeenth Emerging auto-enhance runtime. Light landmark labeling and a single `aria-current="page"`. No router, no Escape, no focus trap, and no history listener. `<ol breadcrumb>` stays a list. No Sig Breadcrumb factory.

Progress **A→B→C shipped in 0.9.0**: theme chrome (`--juice-progress-*`), APG progress runtime, and runtime / maturity docs. Valid `[progress]` markup auto-enhances.

Progress is the eighteenth Emerging auto-enhance runtime. Determinate sync writes `aria-valuemin` / `aria-valuemax` / `aria-valuenow` and `--juice-progress-ratio`.

`progress="indeterminate"` clears `aria-valuenow` and restores the last value when cleared. Authors own the accessible name and `aria-valuetext`.

No keyboard, no focus trap, and no Escape. Authors write `<div progress>`, not `<progress>`.

No Sig Progress factory.

Pagination **A→B→C shipped in 0.9.1**: theme chrome (`--juice-pagination-*`), page-set runtime, and runtime / maturity docs. Valid `[pagination]` markup auto-enhances.

Pagination is the nineteenth Emerging auto-enhance runtime. An unlabeled navigation landmark is named `Pagination`.

One `aria-current="page"` is kept (author current wins; otherwise the first page control). Prev/next disable at inferable ends.

Author-owned disabled is kept. Arrow / Home / End move focus among enabled controls.

Enter and Space stay with the browser. `<ol pagination>` stays a list.

No router, no focus trap, and no Escape. No Sig Pagination factory.

Disclosure **A→B→C shipped in 0.9.2**: theme chrome (`--juice-disclosure-*`), disclosure runtime, and runtime / maturity docs. Valid `[disclosure]` markup auto-enhances.

Disclosure is the twentieth Emerging auto-enhance runtime. One trigger toggles one panel (`aria-expanded`, native `hidden`, `aria-hidden`).

Orphans outside the root are ignored. Escape collapses the focused or last-opened disclosure and yields to an open modal, drawer, or popover.

There is no exclusive group and no arrow roving. Distinct from accordion.

No Sig Disclosure factory.

Spinner **A→B→C shipped in 0.9.2**: theme chrome (`--juice-spinner-*`), spinner runtime, and runtime / maturity docs. Valid `[spinner]` markup auto-enhances.

Spinner is the twenty-first Emerging auto-enhance runtime. Shown hosts are `role="status"` and `aria-busy="true"`.

`hide` sets native `hidden` and clears both. A visible `[spinner-label]` is author text.

No invented `aria-label` when there is no visible label. CSS owns the spin.

`prefers-reduced-motion` stops it. No value, no keyboard, no Escape, and no focus trap.

Distinct from progress and disclosure. No Sig Spinner factory.

Select **A→B→C shipped in 0.9.2**: theme chrome (`--juice-select-*`), select runtime, and runtime / maturity docs. Valid `<select select>` markup auto-enhances.

Select is the twenty-second Emerging auto-enhance runtime. A visible label names the control when the author has not set `aria-label` or `aria-labelledby`.

A separate label is referenced with `aria-labelledby`. A wrapping label is copied into `aria-label` as its visible text excluding the select.

Hidden or empty labels are skipped. No name is invented when nothing visible is there.

Change events and the keyboard stay native. `[multiple]` and `size` listboxes stay native selects.

The open list stays the platform popup. Distinct from combobox.

No listbox, no Escape handler, no focus trap, and no Sig Select factory.

Input **A→B→C shipped in 0.9.2**: theme chrome (`--juice-input-*`), input runtime, and runtime / maturity docs. Valid `<input input>` markup auto-enhances.

Input is the twenty-third Emerging auto-enhance runtime. `createInput` and `initInput` are the same function.

`startInputRuntime` / `stopInputRuntime` boot and stop it. The controller is `destroy` and `sync`.

A visible label names the control when the author has not set `aria-label` or `aria-labelledby`. A separate label is referenced with `aria-labelledby`.

A wrapping label is copied into `aria-label` as its visible text excluding the input's own value. Hidden or empty labels are skipped.

No name is invented when nothing visible is there. Typing, change, and the keyboard stay native.

Text-like controls only. Distinct from combobox and from select.

Textarea and the field wrapper are not this runtime. No mask, no validation engine, no floating label, no Escape handler, no focus trap, and no Sig Input factory.

Textarea **A→B→C shipped in 0.9.2**: theme chrome (`--juice-textarea-*`), textarea runtime, and runtime / maturity docs. Valid `<textarea textarea>` markup auto-enhances.

Textarea is the twenty-fourth Emerging auto-enhance runtime. `createTextarea` and `initTextarea` are the same function.

`startTextareaRuntime` / `stopTextareaRuntime` boot and stop it. The controller is `destroy` and `sync`.

A visible label names the control when the author has not set `aria-label` or `aria-labelledby`. A separate label is referenced with `aria-labelledby`.

A wrapping label is copied into `aria-label` as its visible text excluding the textarea's own value. Hidden or empty labels are skipped.

No name is invented when nothing visible is there. Typing, change, and the keyboard stay native.

Distinct from input, select, and combobox. No auto-grow, no character count, no validation engine, no floating label, no Escape handler, no focus trap, and no Sig Textarea factory.

Field **A→B→C shipped in 0.9.2**: theme chrome (`--juice-field-*`), field runtime, and runtime / maturity docs. Valid `[field]` markup auto-enhances.

Field is the twenty-fifth Emerging auto-enhance runtime. `createField` and `initField` are the same function.

`startFieldRuntime` / `stopFieldRuntime` boot and stop it. The controller is `destroy` and `sync`.

Visible `[field-help]` and `[field-error]` describe the first input, textarea, or select when the author has not set `aria-describedby`. `[invalid]` sets `aria-invalid="true"` when the author has not set `aria-invalid`.

Hidden or empty parts are skipped. Author values are kept.

Runtime-written state is removed when its source goes away or on destroy. `[field-label]` is chrome only.

Name the control with `<label for>`, a wrapping `<label>`, or `[input-label]`, `[textarea-label]`, or `[select-label]`. Typing, change, and the keyboard stay native.

Distinct from input, textarea, select, and combobox. No validation engine, no floating label, no Escape handler, no focus trap, and no Sig Field factory.

Motion core shipped in 0.9.2 and stays Emerging. Tokens, the shared helper, overlay enter/exit, accordion and disclosure height when `[motion="accordion"]` is on the panel, docs, and the P0 CSS gate are in.

Motion core is not a runtime of its own. See [Animations](./juice-animations.md).

Icon button **A→B→C shipped in 0.9.3**: core geometry (`--juice-icon-button-*`), icon-button runtime, and runtime / maturity docs. Valid `[icon-button]` markup auto-enhances.

Icon button is the twenty-sixth Emerging auto-enhance runtime. `createIconButton` and `initIconButton` are the same function.

`startIconButtonRuntime` / `stopIconButtonRuntime` boot and stop it. The controller is `destroy`, `sync`, `toggle`, and `getState`.

State is `{ pressed, disabled, named }`. `[toggle]` keeps `aria-pressed` and `[pressed]` in sync.

Disabled hosts do not flip. Enter and Space are handled only for a non-button, non-link toggle.

An accessible name is a non-empty `aria-label`, an `aria-labelledby` that resolves to visible text, or visible text. `title` does not count.

No name is invented. Development warns once per unnamed element.

A real change dispatches `juice:change` with runtime `"icon-button"`. Distinct from switch and from checkbox.

No focus trap, no Escape handler, and no Sig IconButton factory. `@citrusworx/sigjs/juice` `bind` accepts this runtime.

`state.set` calls `toggle` only on a `[toggle]` host when `pressed` changes, and a refused write snaps the signal back. A Juice build without `startIconButtonRuntime` throws `needs a newer @citrusworx/juiceui`.

Avatar **A→B→C shipped in 0.9.3**: core roles (`--juice-avatar-*`), avatar runtime, and runtime / maturity docs. Valid `[avatar]` markup auto-enhances.

Avatar is the twenty-seventh Emerging auto-enhance runtime. `createAvatar` and `initAvatar` are the same function.

`startAvatarRuntime` / `stopAvatarRuntime` boot and stop it. The controller is `destroy`, `sync`, and `getState`.

State is `{ loaded, fallback, hasImage }`. A broken, empty, or already-failed image sets `[fallback]` and hides the image.

A later load clears both. An empty `src` with a real `srcset` waits.

`destroy()` keeps the fallback. The runtime does not touch `alt`, labels, or initials.

The status dot needs a text equivalent. The `+N` chip is plain text.

A real change dispatches `juice:change` with runtime `"avatar"`. Tide lifts `--juice-avatar-status-away` only.

No focus trap, no Escape handler, and no Sig Avatar factory. `@citrusworx/sigjs/juice` `bind` accepts this runtime and stays read-only.

A Juice build that does not export the matching `start*Runtime` throws `needs a newer @citrusworx/juiceui`. See [Avatar](./juice-avatar.md).

Table **A→B→C shipped in 0.9.3**: core roles (`--juice-table-*`), table runtime, and runtime / maturity docs. Valid `<table table>` markup auto-enhances.

Table is the twenty-eighth Emerging auto-enhance runtime. `createTable` and `initTable` are the same function.

`startTableRuntime` / `stopTableRuntime` boot and stop it. The controller is `destroy`, `sync`, and `getState`.

State is `{ column, direction }`. `column` is null when direction is none.

`th[sortable]` cycles ascending, descending, and none, sets `aria-sort`, and reorders each `tbody`. A canceled `juice:sort` updates state without reordering.

`cellIndex` is not a visual column. One `[numeric]` cell makes the column numeric, and non-numbers sort last both ways.

An author `aria-sort` is adopted and does not reorder until the next activation. `destroy()` restores headers, author `aria-sort`, and row order.

Enter and Space stay with the browser. No focus trap, no Escape handler, and no Sig Table factory.

`@citrusworx/sigjs/juice` `bind` accepts this runtime and stays read-only. A Juice build that does not export the matching `start*Runtime` throws `needs a newer @citrusworx/juiceui`.

See [Table](./juice-table.md).

Pressable **A→B→C shipped in 0.9.4**: core roles (`--juice-pressable-*`), pressable runtime, and these docs. Valid `[pressable]` markup auto-enhances.

Pressable is the twenty-ninth Emerging auto-enhance runtime. `createPressable` and `initPressable` are the same function.

`startPressableRuntime` / `stopPressableRuntime` boot and stop it. The controller is `destroy`, `sync`, and `getState`.

State is `{ pressed, longPressed }`. `[pressed]` is transient except on a latched `[icon-button][toggle]` or a host with `aria-pressed`, where this runtime does not write the attribute.

`[pressable-longpress]` dispatches cancelable `juice:longpress` and suppresses the next click unless that event is canceled. Space on a custom button host does not scroll the page.

Enter is left alone. The runtime does not add `role` or `tabindex`.

A disabled pressable does not clear an icon-button's latched ring. No focus trap, no Escape handler, and no Sig Pressable factory.

`@citrusworx/sigjs/juice` `bind` does not name pressable, touchable-row, or keyboard-avoider yet. See [Pressable](./juice-pressable.md).

Touchable row **A→B→C shipped in 0.9.4**: core roles (`--juice-touchable-row-*`), touchable-row runtime, and these docs. Valid `[touchable-row]` markup auto-enhances.

Touchable row is the thirtieth Emerging auto-enhance runtime. `createTouchableRow` and `initTouchableRow` are the same function.

`startTouchableRowRuntime` / `stopTouchableRowRuntime` boot and stop it. The controller is `destroy`, `sync`, and `getState`.

State is `{ selected, disabled }`. `[touchable-row~="select"]` toggles an independent row.

Enter and Space on an `li` or `div` dispatch one click. Space on those hosts does not scroll.

There is no motion role and no single-select group. No focus trap, no Escape handler, and no Sig TouchableRow factory.

`@citrusworx/sigjs/juice` `bind` does not name pressable, touchable-row, or keyboard-avoider yet. See [Touchable Row](./juice-touchable-row.md).

Do not oversell a component roadmap. A Sig Modal, Sig Drawer, Sig Toast, Sig Popover, Sig Wizard, Sig Tooltip, Sig Combobox, Sig Banner, Sig Menu, Sig Switch, Sig Slider, Sig Checkbox, Sig Radio, Sig Breadcrumb, Sig Progress, Sig Pagination, Sig Disclosure, Sig Spinner, Sig Select, Sig Input, Sig Textarea, Sig Field, Sig IconButton, Sig Avatar, Sig Table, or Sig Pressable or Sig TouchableRow factory stays later.

Grow the next runtime only when that markup contract stays honest.

Short-term focus remains:

* keep navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, breadcrumb, progress, pagination, disclosure, spinner, select, input, textarea, field, icon button, avatar, table, pressable, and touchable row documented as Emerging until they settle
* improve component authoring patterns
* ensure anything newly exported is actually ready
* grow the next runtime only when that markup contract stays honest

### Priority 3. Templates as Stress Tests; Juice CLI as a Separate Track

Keep using templates to test:

* dense app shells
* marketing sites
* retail / product merchandising
* themed experiences
* FAQ / product pages under shipped Tide

The Juice CLI (`tooling/cli/juice`) is a parallel track. It must not block the next runtime / component work.

### Priority 4. CSS-only components

Skeleton **chrome and docs shipped in 0.9.3**. `[skeleton]` is a CSS-only loading placeholder: rect, text (`[lines="1"`…`"8"]` or stacked children), and circle, plus `[scale]` and `[static]`.

There is no runtime slice. It is not one of the thirty-one Emerging auto-enhance runtimes.

Valid markup paints from core CSS. Authors own `aria-busy`.

Shipped themes are not required to bind `--juice-skeleton-*`. The highlight is a translucent white sheen.

See [Skeleton](./juice-skeleton.md).

List **chrome shipped in 0.9.3**. `[list]` is CSS-only stacked rows on `ul`, `ol`, or `div`: `[divided]`, `[dense]`, and `[list-item]` with `[list-leading]`, `[list-content]`, `[list-secondary]`, and `[list-trailing]`.

There is no runtime slice. It is not one of the thirty-one Emerging auto-enhance runtimes.

Valid markup paints from core CSS. `[selected]` is visual only.

Shipped themes are not required to bind `--juice-list-*`. See [List](./juice-list.md).

Badge **`--juice-badge-*` roles shipped in 0.9.3**. The base layout shipped in npm 0.9.2.

Core `--juice-badge-*` roles shipped in 0.9.3. `[badge]` is a CSS-only pill: `[badge="square"]`, `[badge="ribbon"]`, and theme-owned `[warm]`.

There is no runtime slice. It is not one of the thirty-one Emerging auto-enhance runtimes.

KiwiPress default, warm, and ribbon text stay under 4.5:1 outside `[cta]`. See [Badge](./juice-badge.md).

Safe area **chrome shipped in 0.9.3**. `[safe-area]` is CSS-only padding clear of the notch, the home indicator, and rounded corners: all four edges, or `top`, `bottom`, `x`, or `y`.

An empty or unknown value pads all four edges. There is no runtime slice and no margin mode.

It is not one of the thirty-one Emerging auto-enhance runtimes. `--juice-safe-area-pad` is `1rem` on `:root` only.

Shipped themes are not required to bind it. `viewport-fit=cover` is required on the viewport meta tag.

There is no bottom-bar component. See [Safe Area](./juice-safe-area.md).

Table **A→B→C shipped in 0.9.3**, and it is not a CSS-only component. Chrome shipped in #287 and the sortable runtime shipped in #289.

It is the twenty-eighth Emerging auto-enhance runtime. Valid `<table table>` markup paints from core CSS and sorts after the JS entry is imported.

Skeleton, list, badge, and safe area stay CSS-only. See [Table](./juice-table.md) and Priority 2.

---

## Recommended Build Order

1. Remaining surface depth utilities are done (`shadowTone`, `overlay`, `variant`). Structural `card="…"` recipes can stay later.
2. Modal / dialog A→B→C shipped in 0.6.0 (chrome, runtime, docs). Drawer A→B→C, toast A→B→C, and popover A→B→C shipped in 0.7.0 (chrome, runtime, docs).
2. Wizard A→B→C, tooltip A→B→C, combobox A→B→C, banner A→B→C, eleven-runtime polish A→B→C, and menu A→B→C shipped in 0.8.0 (chrome, runtime, docs). Switch A→B→C, slider A→B→C, checkbox A→B→C, radio A→B→C, breadcrumb A→B→C, and progress A→B→C shipped in 0.9.0 (chrome, runtime, docs).
2. Pagination A→B→C shipped in 0.9.1 (chrome, runtime, docs), along with the ten retro library themes. Disclosure A→B→C, spinner A→B→C, select A→B→C, input A→B→C, textarea A→B→C, and field A→B→C shipped in 0.9.2 (chrome, runtime, docs).
2. Icon button A→B→C shipped in 0.9.3 (chrome, runtime, and docs). Avatar A→B→C shipped in 0.9.3 (chrome, runtime, and docs).
2. Table A→B→C shipped in 0.9.3 (chrome, runtime, and docs). Keep the thirty-one runtimes Emerging, including keyboard avoider (shipped in 0.9.5).
2. Grow the next runtime only when that markup contract stays honest. Do not oversell this.
3. Keep template-driven stress testing after each improvement. Treat the Juice CLI as a parallel track.
4. Skeleton chrome shipped in 0.9.3 (CSS-only; not a runtime). List chrome shipped in 0.9.3 (CSS-only; not a runtime).
4. Badge `--juice-badge-*` roles shipped in 0.9.3 (CSS-only; not a runtime; the base layout shipped in npm 0.9.2). Safe area chrome shipped in 0.9.3 (CSS-only, not a runtime).
4. Table A→B→C shipped in 0.9.3 as the twenty-eighth runtime, not as a CSS-only component. Pressable A→B→C shipped in 0.9.4 as the twenty-ninth runtime, not as a CSS-only component.
4. Touchable row A→B→C shipped in 0.9.4 as the thirtieth runtime, not as a CSS-only component. Keyboard avoider is the thirty-first runtime and shipped in 0.9.5. The thirty-one Emerging runtimes stay Emerging.

Closed:

- Expand surfaces A–C, the theme contract, and typography / icon polish (author type attrs beat theme defaults)
- Modal / dialog A→B→C, and the 0.6.0 npm publish
- Drawer, toast, and popover A→B→C in the 0.7.0 npm publish
- Wizard, tooltip, combobox, banner, polish, and menu A→B→C in the 0.8.0 npm publish
- Switch, slider, checkbox, radio, breadcrumb, and progress A→B→C in the 0.9.0 npm publish
- Pagination A→B→C and the ten retro library themes in the 0.9.1 npm publish
- Disclosure, spinner, select, input, textarea, and field A→B→C in the 0.9.2 npm publish
- Icon button, avatar, and table shipped in 0.9.3. Pressable and touchable row shipped in 0.9.4. Keyboard avoider shipped in 0.9.5
- Skeleton, list, and safe area shipped in 0.9.3 (CSS-only)
- Badge layout shipped in npm 0.9.2. Core `--juice-badge-*` roles shipped in 0.9.3

Do not invent a next version number. The next cut happens when new Juice changesets exist.

---

## Summary

0.4.0 was a real Beta cut. It shipped modular themes, motion wave 1, accordion and tabs runtimes, teal tokens, and packaging that matches the auto-enhance story. It was an earlier public npm cut.

**0.6.0 was an earlier public npm cut** for Tide, surfaces + depth, contracts, and modal / dialog A→B→C. Blush remains draft.

**0.7.0 was an earlier public npm cut** for drawer, toast, and popover A→B→C.

**0.8.0 was an earlier public npm cut** for wizard, tooltip, combobox, banner, eleven-runtime polish, and menu A→B→C.

**0.9.0 was an earlier public npm cut** for switch, slider, checkbox, radio, breadcrumb, and progress A→B→C. Switch is the thirteenth Emerging auto-enhance runtime. Slider is the fourteenth. Checkbox is the fifteenth. Radio is the sixteenth. Breadcrumb is the seventeenth. Progress is the eighteenth. Those eighteen stay Emerging.

**0.9.1** shipped pagination A→B→C and the ten retro library themes. Pagination is the nineteenth Emerging auto-enhance runtime. It stays Emerging.

**0.9.5 is the live npm cut** (published 2026-10-30 15:11 UTC). Keyboard avoider and the `nav[fixed]` footer fix shipped in 0.9.5. Pressable and touchable row shipped in 0.9.4. Icon button, avatar, table, skeleton, list, safe area, the `--juice-badge-*` roles, and `juice:change` / `getState()` shipped in 0.9.3.

**0.9.2** shipped disclosure, spinner, select, input, textarea, field, and motion core. Disclosure A→B→C, spinner A→B→C, select A→B→C, input A→B→C, textarea A→B→C, and field A→B→C shipped in 0.9.2.

Disclosure is the twentieth Emerging auto-enhance runtime. Spinner is the twenty-first.

Select is the twenty-second. Input is the twenty-third.

Textarea is the twenty-fourth. Field is the twenty-fifth.

Icon button is the twenty-sixth. Avatar is the twenty-seventh.

Table is the twenty-eighth. Checkbox and radio are two runtimes.

Breadcrumb is a light trail. Progress is a progressbar.

Pagination is a page set. Disclosure is a standalone one-trigger / one-panel control, distinct from accordion.

Spinner is a standalone indeterminate busy indicator, distinct from progress and disclosure. Select is a styled native `<select>`, distinct from combobox.

Input is a styled native `<input>`, distinct from combobox and from select. Textarea is a styled native `<textarea>`, distinct from input, select, and combobox.

Field is a wrapper around a control, distinct from input, textarea, select, and combobox. Icon button is a square icon-only control on button chrome, distinct from switch and from checkbox, and shipped in 0.9.3.

Avatar is an initials-or-photo mark (`[avatar]`), distinct from a badge and from `[skeleton="circle"]`, and shipped in 0.9.3. Icon button is the twenty-sixth Emerging auto-enhance runtime.

Avatar is the twenty-seventh Emerging auto-enhance runtime and shipped in 0.9.3. Table is the twenty-eighth Emerging auto-enhance runtime and shipped in 0.9.3.

Pressable is the twenty-ninth Emerging auto-enhance runtime and shipped in 0.9.4. Touchable row is the thirtieth Emerging auto-enhance runtime and shipped in 0.9.4.

All thirty-one stay Emerging. Skeleton chrome and docs shipped in 0.9.3 (CSS-only, not a runtime).

List chrome and docs shipped in 0.9.3 (CSS-only, not a runtime). Badge `--juice-badge-*` roles shipped in 0.9.3 (CSS-only, not a runtime; the base layout shipped in npm 0.9.2).

Safe area chrome shipped in 0.9.3 (CSS-only, not a runtime). Table A→B→C shipped in 0.9.3 (chrome, runtime, and docs; the twenty-eighth Emerging auto-enhance runtime).

Do not invent a next version number.

The next stage is post-0.9.5 refinement:

* remaining surface depth utilities are done (`shadowTone`, `overlay`, `variant`); structural `card="…"` recipes can stay later
* the Sig hookup is done (`juice:change` + `getState()` for all thirty-one runtimes, optional `@citrusworx/sigjs/juice` `bind` for twenty-eight (through `table`; pressable is not a `JuiceRuntimeName` yet)). Icon-button writes back on a `[toggle]` host.
* Avatar and table are read-only. Binding one of those three on published `@citrusworx/juiceui` 0.9.1 or 0.9.2 throws `needs a newer @citrusworx/juiceui`, because those npm cuts do not export their start functions. The three exports shipped in 0.9.3.
* The thirty-one Juice runtimes are in npm 0.9.5. Juice still runs without Sig
* modal / dialog A→B→C is in 0.6.0 drawer A→B→C, toast A→B→C, and popover A→B→C are in 0.7.0
* wizard A→B→C, tooltip A→B→C, combobox A→B→C, banner A→B→C, eleven-runtime polish A→B→C, and menu A→B→C are in 0.8.0 switch A→B→C, slider A→B→C, checkbox A→B→C, radio A→B→C, breadcrumb A→B→C, and progress A→B→C are in 0.9.0
* pagination A→B→C and the ten retro themes are in 0.9.1 disclosure A→B→C, spinner A→B→C, select A→B→C, input A→B→C, textarea A→B→C, and field A→B→C shipped in 0.9.2
* icon button A→B→C shipped in 0.9.3. Avatar A→B→C shipped in 0.9.3
* table A→B→C shipped in 0.9.3. Skeleton chrome shipped in 0.9.3 (CSS-only, not a runtime)
* list chrome and docs shipped in 0.9.3 (CSS-only, not a runtime) badge `--juice-badge-*` roles shipped in 0.9.3 (CSS-only, not a runtime; the base layout shipped in npm 0.9.2)
* safe area chrome shipped in 0.9.3 (CSS-only, not a runtime). Pressable A→B→C shipped in 0.9.4 (the twenty-ninth Emerging auto-enhance runtime)
* touchable row A→B→C shipped in 0.9.4 (the thirtieth Emerging auto-enhance runtime; `bind()` does not name pressable, touchable-row, or keyboard-avoider yet). Keyboard avoider shipped in 0.9.5. Grow the next runtime only when the markup contract is honest
* keep templates as stress tests; CLI in parallel

That is a strong place to be.
