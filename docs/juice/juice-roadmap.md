# Juice Roadmap

## Current Position

`@citrusworx/juiceui@0.8.0` is the live npm Juice Beta cut.

**0.8.0 is the public cut.** Wizard A→B→C, tooltip A→B→C, combobox A→B→C, banner A→B→C, eleven-runtime polish A→B→C, and menu A→B→C (theme chrome, runtime, runtime / maturity docs) shipped in this lane. 0.7.0 was the prior public npm cut.

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

Pending Juice changesets on master (consume them at the next cut; Juice-only if the lane stays Juice-only):

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

The visible layers today (0.8.0 plus unreleased master):

* layout and spacing primitives
* token-driven color, font, gradient, and motion systems
* four shipped modular themes (`aquaflux`, `kiwipress`, `citrusmint`, `tide`), with core CSS separate from theme identity
* surface language A–C: themeable `surfaceTone="soft|strong|muted"`, `borderStrength="soft|bold"`, standalone `blur="sm|md"`
* Emerging browser runtimes: navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, and breadcrumb auto-enhance when the JS entry is imported. Switch, slider, checkbox, radio, and breadcrumb are on master and are not in the 0.8.0 npm cut. Checkbox and radio are two runtimes. Breadcrumb is a light trail
* a Sig Accordion factory plus create/init/start/stop helpers (no Sig Modal, Sig Drawer, Sig Toast, Sig Popover, Sig Wizard, Sig Tooltip, Sig Combobox, Sig Banner, Sig Menu, Sig Switch, Sig Slider, Sig Checkbox, Sig Radio, or Sig Breadcrumb factory)
* contracts for themes, icons, and typography, including author type overrides
* templates as a stress-test bed

The strongest parts of Juice today are still layout, spacing, color tokens, typography, and icons.

The next strongest areas are now:

* modular shipped themes (KiwiPress is the richest reference; Tide is the dark product/SaaS one)
* motion wave 1 (P0 + P1)
* surface utilities A–C
* accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, and breadcrumb chrome plus DOM-first auto-enhance
* documented theme / icon / typography contracts
* templates as design proofs

The weakest areas are still:

* remaining surface depth (structural `card="…"` recipes; `shadowTone`, `overlay`, and `variant` utilities are in)
* component maturity beyond the seventeen auto-enhance runtimes
* blush remaining an unpublished YAML-only draft
* templates as a continuing stress-test surface
* Juice CLI and config / generator workflow
* optional later type size-step (`xs` / `1rem`) if it is ever needed

Theme-contract slice C is vacant: there is no remaining SCSS/YAML hole on the shipped set. Author type attrs already beat theme semantic defaults. Those are not open holes.

Tide is a shipped dark product/SaaS theme under `src/themes/tide/`. Accordion and tabs roles are bound there, and package exports include `@citrusworx/juiceui/styles/themes/tide`. Blush stays under `src/themes/_draft/`.

For the honest Beta promise, see [Juice Beta](./juice-beta.md) and the [maturity matrix](./juice-maturity-matrix.md).

---

## What Improved Through 0.4.0 and After

### Through 0.4.0

0.4.0 was a real Beta cut, not a packaging bump. It was an earlier public npm cut before 0.6.0.

* **Modular themes, core CSS is core-only.** `@citrusworx/juiceui/styles` carries utilities and components, not theme identity. `aquaflux`, `kiwipress`, and `citrusmint` shipped as separate CSS entrypoints. Activate with `theme="<id>"` after importing core + theme CSS. Each theme follows the `<id>.scss` + `<id>.yaml` authoring contract.
* **Accordion and tabs joined navigation as real runtimes.** Layout chrome, shared `--juice-*` role contracts, DOM-first auto-enhance, and the Sig `Accordion` factory plus create/init/start/stop helpers. All three stay Emerging. Markup plus auto-enhance is the contract, not a large JS component library.
* **Motion wave 1 is documented and gated.** Canonical `motion` covers the P0/P1 catalog. `prefers-reduced-motion` is respected. That is a supported Beta subset, not the full [animations roadmap](./juice-animations-roadmap.md).
* **Teal tokens exist.** `teal-100`–`teal-900` and the `lagoon` swatch landed so a dark product theme had something to consume. Tide itself shipped after 0.4.0.
* **Packaging matches the runtime story.** `sideEffects` includes `dist/index.js`. `@citrusworx/sigjs` is a published `^0.3.0` caret range, not `workspace:^`.
* **Docs maturity caught up to the JS entry.** The [maturity matrix](./juice-maturity-matrix.md) marks the JS entrypoint and public component exports as **Emerging**.

### Since 0.4.0 (the 0.6.0 lane)

This is the stack that shipped in 0.6.0.

* **Tide shipped as the fourth library theme** (PR #95, `juice-ship-tide-theme`). Import `@citrusworx/juiceui/styles/themes/tide` and activate with `theme="tide"`. Dark product/SaaS identity, teal/lagoon tokens, accordion and tabs chrome, named `tide-card` / `tide-panel` surfaces. Blush remains a YAML-only draft.
* **Surface language A→B→C.** Themeable `surfaceTone` `soft|strong|muted` (#97), `borderStrength` `soft|bold` (#99), standalone `blur` `sm|md` (#102). A–C utilities are done. Remaining depth slices A (`shadowTone` `cool|warm`), B (`overlay` `frost|tint`), and C (`variant` `monochromatic|glass|tinted`) are in. Structural `card="…"` recipes stay later.
* **Theme contract.** Canonical required-versus-optional checklist (#104) plus automated `--juice-*` bind tests (#105). `yarn workspace @citrusworx/juiceui verify` fails if aquaflux, kiwipress, citrusmint, tide, or the theme generator drops a required accordion, tabs, modal, surface-tone, border-strength, shadow-tone, or overlay bind. Modal theme chrome (slice A), dialog runtime (slice B), and runtime docs (slice C) are in.
* **Modal / dialog A→B→C.** Shared `--juice-modal-*` roles for `[modal-overlay]` / `[modal]` / `[modal-close]` (#118 / #119). DOM-first dialog runtime (#121): `createModal` / `initModal` / `startModalRuntime` / `stopModalRuntime`, auto-boot, Escape, focus trap, exclusive open, backdrop click (`modal-overlay="static"` opts out). Runtime docs and maturity notes shipped with the cut. Distinct from surface `overlay="frost|tint"`. No Sig Modal factory.
* **Typography and icon polish.** Icon authoring contract (#108): default `[icon]` size is `1rem`, `iconSize` (`xxs`…`xxl`) is first-class, `width` / `height` stay the custom-size escape hatch. Typography authoring contract (#110). Author `font` / `fontColor` / `fontWeight` / `lineHeight` beat theme `h1`–`h6` / `p` defaults via `[theme] [attr]` companions (#112), same pattern as `surfaceTone`.

### Since 0.6.0 (the 0.7.0 lane)

This is the stack that shipped in 0.7.0.

* **Drawer A→B→C.** Shared `--juice-drawer-*` roles for `[drawer-overlay]` / `[drawer]` / `[drawer-close]` (#128). DOM-first dialog runtime (#129): `createDrawer` / `initDrawer` / `startDrawerRuntime` / `stopDrawerRuntime`, auto-boot, Escape, focus trap, exclusive drawer open, backdrop click (`drawer-overlay="static"` opts out). Runtime docs and maturity notes in #131. Edge is `[drawer]` / `[drawer="left"|"right"]`; optional width is `[drawer-size="sm|lg"]`. Distinct from surface `overlay="frost|tint"` and from modal. No Sig Drawer factory.
* **Toast A→B→C.** Shared `--juice-toast-*` roles for `[toast-region]` / `[toast]` / `[toast-close]` (#133). DOM-first snackbar runtime (#135): `createToast` / `initToast` / `startToastRuntime` / `stopToastRuntime`, auto-boot, `show` / `dismiss`, `toast-duration` (default 5000; `0` / `Infinity` / negative is sticky), auto-dismiss pause on hover/focus, Escape for the most recent visible toast only when no open modal/drawer overlay exists. Runtime docs and maturity notes shipped with the cut. Live region: `aria-live` polite + `aria-relevant`; `role="status"` vs `role="alert"` for error/assertive. Markup-first (no programmatic message factory). Distinct from surface `overlay="frost|tint"` and from modal/drawer. No Sig Toast factory.
* **Popover A→B→C.** Shared `--juice-popover-*` roles for `[popover-root]` / `[popover-panel]` / `[popover-close]` (#138). DOM-first anchored runtime (#139): `createPopover` / `initPopover` / `startPopoverRuntime` / `stopPopoverRuntime`, auto-boot, open/close/toggle, Escape (yields to modal/drawer), outside click, Tab trap, exclusive popover open, dependency-free placement with one-axis flip (`position: fixed` from opener rect + gap 8). Non-modal dialog (`role="dialog"`, no `aria-modal`); focus moves into the panel and restores to the opener. Never a bare `popover` attribute. Runtime docs and maturity notes shipped with the cut. Distinct from surface `overlay="frost|tint"` and from modal/drawer/toast. No Sig Popover factory.

### Since 0.7.0 (the 0.8.0 lane)

This is the stack that shipped in 0.8.0.

* **Wizard A→B→C.** Shared `--juice-wizard-*` roles for `[wizard-shell]` / `[wizard-header]` / `[wizard-rail]` / `[step]` (#144). DOM-first step runtime (#145): `createWizard` / `initWizard` / `startWizardRuntime` / `stopWizardRuntime`, auto-boot, `next` / `prev` / `goTo(index|id)` / `current`, pairing (`aria-controls` → id, else shared `data-step` / `name` / `step-page`, else index), nav modes (bare = completed + current; `linear` = prev/next only; `free` = any step), `[wizard-prev]` / `[wizard-next]` or unmarked `[step-nav]` buttons, optional `[wizard-complete]` on the last step. Pages use native `hidden`. A11y is `aria-current="step"` plus pages as `role="region"` — not APG Tabs. `sync` writes `data-step` on `[wizard-content]`. Runtime docs and maturity notes in #146. Distinct from surface `overlay="frost|tint"` and from modal/drawer/toast/popover. No Sig Wizard factory.
* **Tooltip A→B→C.** Shared `--juice-tooltip-*` roles for `[tooltip-root]` / `[tooltip-panel]` (#148). DOM-first hover/focus runtime (#149): `createTooltip` / `initTooltip` / `startTooltipRuntime` / `stopTooltipRuntime`, auto-boot, `show` / `hide`, pairing (`aria-describedby` preferred → root id; also `aria-controls`), show on mouseover/focusin, hide on mouseout/focusout with a 150ms grace delay, exclusive one tip, Escape (yields to open modal/drawer overlay or popover-root), no focus trap (focus never moves into the tip), dependency-free placement with one-axis flip (`position: fixed` from trigger rect + gap 8), z-index 1060. Touch / first-tap later — v1 is hover and keyboard focus. Distinct from popover (interactive) and native `title`. Never a bare `tooltip` attribute. Runtime docs and maturity notes in #151. Distinct from surface `overlay="frost|tint"` and from modal/drawer/toast/popover/wizard. No Sig Tooltip factory.
* **Combobox A→B→C.** Shared `--juice-combobox-*` roles for `[combobox]` / `[combobox-input]` / `[combobox-list]` / `[combobox-option]` (#152). DOM-first listbox runtime (#153): `createCombobox` / `initCombobox` / `startComboboxRuntime` / `stopComboboxRuntime`, auto-boot, `open` / `close` / `toggle` / `select`, case-insensitive substring filter on option text / `data-value` (non-matches get `hidden`), keyboard (ArrowUp/Down, Home/End, Enter selects, Escape closes, Tab closes without commit), `aria-activedescendant` plus `aria-expanded` on the input (and trigger), exclusive among comboboxes. Select writes option text or `data-value`; committed choice is `aria-selected` plus `combobox-option="active"` for keyboard focus. Placement is CSS-only (absolute under the field); no Floating UI. Distinct from native `<select>`. Runtime docs and maturity notes in this pass. Distinct from surface `overlay="frost|tint"` and from modal/drawer/toast/popover/wizard/tooltip. No Sig Combobox factory. No multi-select / async fetch.
* **Banner A→B→C.** Shared `--juice-banner-*` roles for `[banner]` / `[banner-body]` / `[banner-close]` (#160). DOM-first dismiss runtime (#161): `createBanner` / `initBanner` / `startBannerRuntime` / `stopBannerRuntime`, auto-boot, `show` / `dismiss`, `[banner-close]` click / keyboard, `role="status"` (or `role="alert"` for error/warning), optional `banner-persist="session|local"` with `name` / `id` (`juice-banner:<key>`). No focus trap, no Escape steal, no auto-dismiss timer. Distinct from toast stack and from modal/drawer. Runtime docs and maturity notes in this pass. No Sig Banner factory.
* **Eleven-runtime polish A→B→C.** Escape / layering (#166): modal/drawer → popover → combobox → toast/tooltip as implemented; banner never; accordion contextual; tabs / nav / wizard out of scope. Shared internals (#167) under `libraries/juice/src/js/src/shared/` (not a public API). Docs / Limitations / z-index / maturity consistency in this pass. The eleven stay **Emerging**.
* **Menu A→B→C.** Shared `--juice-menu-*` roles for `[menu-root]` / `[menu]` / `[menuitem]` (#171). DOM-first APG menu-button runtime (#174): `createMenu` / `initMenu` / `startMenuRuntime` / `stopMenuRuntime`, auto-boot, `open` / `close` / `toggle` / `select`, opener pairing (`[menu-button]` or a plain control inside the root), roving tabindex on `[menuitem]`, exclusive among menus, Escape with popover (yields to modal/drawer; combobox / toast / tooltip yield to an open menu). Boolean `[menu]` attr (no HTML global `menu`; not the `<menu>` element). Placement CSS-absolute from the root (`top|bottom|left|right`); z-index 1050. Distinct from popover, combobox, native `<select>`, menubar, and context menu. No submenus, no typeahead, no Sig Menu factory. Runtime docs and maturity notes in this pass. Menu is the twelfth Emerging auto-enhance runtime.

### Since 0.8.0 (pending the next cut)

This is the stack on master that is not in the 0.8.0 tarball.

* **Switch A→B→C.** Shared `--juice-switch-*` roles for `[switch]` (#179). DOM-first APG switch runtime (#181): `createSwitch` / `initSwitch` / `startSwitchRuntime` / `stopSwitchRuntime`, auto-boot, `toggle` / `check` / `uncheck` / `setChecked` / `isChecked`, `role="switch"` plus binary `aria-checked` on button hosts (checkbox-backed hosts stay honest with `:checked`). Click and Enter/Space toggle. Disabled / `aria-disabled` ignored. Authors must supply the accessible name. No focus trap, no Escape steal, no tri-state, no menuitemcheckbox, no Sig Switch factory. Runtime docs and maturity notes are on master. Switch is the thirteenth Emerging auto-enhance runtime. Still unpublished vs 0.8.0.
* **Slider A→B→C.** Shared `--juice-slider-*` roles for `[slider]` / `[slider-fill]` / `[slider-thumb]` (#183). DOM-first APG slider runtime (#185): `createSlider` / `initSlider` / `startSliderRuntime` / `stopSliderRuntime`, auto-boot, `setValue` / `getValue` / `increment` / `decrement`, `role="slider"` plus `aria-valuemin` / `aria-valuemax` / `aria-valuenow` on `[slider-thumb]`, and `--juice-slider-ratio` on the host. Arrows / Home / End / PageUp / PageDown. Pointer jump and drag. Disabled / `aria-disabled` ignored. Authors must supply the accessible name. No Escape, no vertical, no multi-thumb, no native range restyle, no Sig Slider factory. Runtime docs and maturity notes are on master. Slider is the fourteenth Emerging auto-enhance runtime. Still unpublished vs 0.8.0.
* **Checkbox A→B→C.** Shared `--juice-checkbox-*` roles for `[checkbox]` (#189). DOM-first APG checkbox runtime (#190): `createCheckbox` / `initCheckbox` / `startCheckboxRuntime` / `stopCheckboxRuntime`, auto-boot, `toggle` / `check` / `uncheck` / `setChecked` / `isChecked`, `role="checkbox"` plus binary `aria-checked` on button hosts (native `<input type="checkbox" checkbox>` hosts stay honest with `:checked`). Click and Enter/Space toggle. Disabled / `aria-disabled` ignored. Authors must supply the accessible name. No focus trap, no Escape steal, no tri-state, no menuitemcheckbox, no Sig Checkbox factory. Runtime docs and maturity notes are on master. Checkbox is the fifteenth Emerging auto-enhance runtime. Still unpublished vs 0.8.0.
* **Radio A→B→C.** Shared `--juice-radio-*` roles for `[radio]` inside layout-only `[radiogroup]` (no `--juice-radiogroup-*`) (#189). DOM-first APG radio runtime (#190): `createRadio` / `initRadio` / `startRadioRuntime` / `stopRadioRuntime`, auto-boot, `select` / `getChecked`, exclusive selection, roving tabindex. Click, Enter, and Space select. Arrows move among enabled options and wrap. Orphans outside `[radiogroup]` are ignored. Disabled / `aria-disabled` skipped. Authors must supply the accessible name. No focus trap, no Escape, no Sig Radio factory. Runtime docs and maturity notes are on master. Radio is the sixteenth Emerging auto-enhance runtime. Checkbox and radio are two runtimes. Still unpublished vs 0.8.0.
* **Breadcrumb A→B→C.** Shared `--juice-breadcrumb-*` roles for `[breadcrumb]` / `[breadcrumb-item]` / `[breadcrumb-link]` (#194). Light DOM-first runtime (#196): `createBreadcrumb` / `initBreadcrumb` / `startBreadcrumbRuntime` / `stopBreadcrumbRuntime`, auto-boot, `sync` / `setCurrent`. An unlabeled navigation landmark is named `Breadcrumb`. `<nav>` does not get a redundant role. `<ol breadcrumb>` stays a list. A single `aria-current="page"` is kept (author current wins; otherwise the last crumb). It does not remove `href`, trap focus, steal Escape, or listen to history. Not a router, not site `[nav]`, not `nav[type="breadcrumb"]`, not tabs, not a wizard step tracker, and not pagination. No Sig Breadcrumb factory. Runtime docs and maturity notes in this pass. Breadcrumb is the seventeenth Emerging auto-enhance runtime. Still unpublished vs 0.8.0.

See [Surfaces](./juice-surfaces.md), [Theme Contract](./juice-theme-contract.md), [Icons](./juice-icons.md), and [Typography Contract](./juice-typography-contract.md).

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

Accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, and breadcrumb have chrome plus auto-enhance. Navigation still exists and is still Emerging. The Sig Accordion factory is real. There is no Sig Modal, Sig Drawer, Sig Toast, Sig Popover, Sig Wizard, Sig Tooltip, Sig Combobox, Sig Banner, Sig Menu, Sig Switch, Sig Slider, Sig Checkbox, Sig Radio, or Sig Breadcrumb factory. Switch, slider, checkbox, radio, and breadcrumb are unpublished versus 0.8.0. Checkbox and radio are two runtimes. Breadcrumb is a light trail.

That is not the same as a polished component library. Cards, buttons, forms, and nav variants are useful and still settling. Prop contracts for styling internal parts are still being figured out. Juice should not pretend the exported component surface is broader or more mature than it is.

### 3. Blush Is Still Draft

Tide is a fourth shipped library theme. Blush is further back (YAML-only, no emitted CSS). Package `exports` and the published tarball still do not expose `_draft`.

### 4. Templates Still Expose Proportional Weaknesses

Juice can express many aesthetics, but dense layouts still reveal weaknesses in column math, containment, and app-style shell composition. That is useful signal, not failure. Templates should keep doing that job after each system improvement.

### 5. CLI and Generator Remain a Separate Track

The Juice CLI (`tooling/cli/juice`) and config-driven generation from `juice.config.yaml` are draft. They must not block the next runtime / component work. The theme contract on the four shipped references is already documented and tested; the generator workflow is a different problem.

### 6. Optional Later Type Size-Step

The authoring contract is in. Author type attrs already beat theme semantic defaults. Remaining typography work, if any, is a later `xs` / `1rem` `fontSize` step or type-token gap — not the theme-versus-author cascade, and not a hole that should reorder this list.

---

## Revised Priorities

Lock this build order. Do not reorder it because a later item is more exciting.

### Closed / done on master (old P1–P3, plus 0.6.0, 0.7.0, and 0.8.0 publish)

These were the lock order after 0.4.0. Surfaces, the theme contract, and typography / icon polish shipped in the 0.6.0 public cut. Drawer / toast / popover shipped in 0.7.0. Wizard A→B→C, tooltip A→B→C, combobox A→B→C, banner A→B→C, eleven-runtime polish A→B→C, and menu A→B→C shipped in 0.8.0. Those twelve stay Emerging. Switch A→B→C, slider A→B→C, checkbox A→B→C, radio A→B→C, and breadcrumb A→B→C are done on master (unpublished vs 0.8.0). Switch is the thirteenth Emerging auto-enhance runtime. Slider is the fourteenth. Checkbox is the fifteenth. Radio is the sixteenth. Breadcrumb is the seventeenth. Checkbox and radio are two runtimes. Breadcrumb is a light trail.

* **Old P1 — Expand surfaces A–C.** `surfaceTone`, `borderStrength`, and standalone `blur` ship. Theme roles and bind tests cover the first two; blur is a core utility.
* **Old P2 — Formalize the theme contract.** [Theme Contract](./juice-theme-contract.md) is the canonical checklist. `libraries/juice/src/juice.theme-contract.test.ts` fails verify if a shipped library theme drops a required `--juice-*` bind. Slice C is vacant.
* **Old P3 — Typography / icon polish.** Icon contract, typography contract, and author type attrs beating theme defaults are in. See [Icons](./juice-icons.md) and [Typography Contract](./juice-typography-contract.md).
* **Old P4 — Publish the pending Juice stack.** `@citrusworx/juiceui@0.7.0` was the prior public npm cut. `@citrusworx/juiceui@0.8.0` is live on npm (wizard / tooltip / combobox / banner / polish / menu). Do not invent a next version number; the next cut happens when new Juice changesets exist.

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

Switch **A→B→C is done on master** (still unpublished vs 0.8.0): theme chrome (`--juice-switch-*`), APG switch runtime, and runtime / maturity docs. Valid `[switch]` markup auto-enhances. Switch is the thirteenth Emerging auto-enhance runtime. No tri-state. Authors must supply the accessible name. No Sig Switch factory.

Slider **A→B→C is done on master** (still unpublished vs 0.8.0): theme chrome (`--juice-slider-*`), APG slider runtime, and runtime / maturity docs. Valid `[slider]` markup auto-enhances. Slider is the fourteenth Emerging auto-enhance runtime. Horizontal only. No vertical, no multi-thumb, no native `<input type="range">` restyle, and no Escape. Authors must supply the accessible name. No Sig Slider factory.

Checkbox **A→B→C is done on master** (still unpublished vs 0.8.0): theme chrome (`--juice-checkbox-*`), APG checkbox runtime, and runtime / maturity docs. Valid `[checkbox]` markup auto-enhances. Checkbox is the fifteenth Emerging auto-enhance runtime. Binary only. No tri-state. Authors must supply the accessible name. No Sig Checkbox factory.

Radio **A→B→C is done on master** (still unpublished vs 0.8.0): theme chrome (`--juice-radio-*`), APG radio runtime, and runtime / maturity docs. Valid `[radio]` markup inside `[radiogroup]` auto-enhances. Radio is the sixteenth Emerging auto-enhance runtime. Checkbox and radio are two runtimes. Exclusive selection, roving tabindex, arrows plus Space/Enter/click. Orphans outside `[radiogroup]` are ignored. No Escape. Authors must supply the accessible name. No Sig Radio factory.

Breadcrumb **A→B→C is done on master** (still unpublished vs 0.8.0): theme chrome (`--juice-breadcrumb-*`), light trail runtime, and runtime / maturity docs. Valid `[breadcrumb]` markup auto-enhances. Breadcrumb is the seventeenth Emerging auto-enhance runtime. Light landmark labeling and a single `aria-current="page"`. No router, no Escape, no focus trap, and no history listener. `<ol breadcrumb>` stays a list. No Sig Breadcrumb factory. Do not oversell a component roadmap. A Sig Modal, Sig Drawer, Sig Toast, Sig Popover, Sig Wizard, Sig Tooltip, Sig Combobox, Sig Banner, Sig Menu, Sig Switch, Sig Slider, Sig Checkbox, Sig Radio, or Sig Breadcrumb factory stays later. Grow the next runtime only when that markup contract stays honest.

Short-term focus remains:

* keep navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, and breadcrumb documented as Emerging until they settle
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

---

## Recommended Build Order

1. Remaining surface depth utilities are done (`shadowTone`, `overlay`, `variant`). Structural `card="…"` recipes can stay later.
2. Modal / dialog A→B→C shipped in 0.6.0 (chrome, runtime, docs). Drawer A→B→C, toast A→B→C, and popover A→B→C shipped in 0.7.0 (chrome, runtime, docs). Wizard A→B→C, tooltip A→B→C, combobox A→B→C, banner A→B→C, eleven-runtime polish A→B→C, and menu A→B→C shipped in 0.8.0 (chrome, runtime, docs). Switch A→B→C, slider A→B→C, checkbox A→B→C, radio A→B→C, and breadcrumb A→B→C are done on master (chrome, runtime, docs; unpublished vs 0.8.0). Keep nav / accordion / tabs / modal / drawer / toast / popover / wizard / tooltip / combobox / banner / menu / switch / slider / checkbox / radio / breadcrumb Emerging. Grow the next runtime only when that markup contract stays honest. Do not oversell this.
3. Keep template-driven stress testing after each improvement. Treat the Juice CLI as a parallel track.

Closed: expand surfaces A–C, formalize the theme contract, typography / icon polish (including author type attrs beating theme defaults), modal / dialog A→B→C, the 0.6.0 npm publish, drawer / toast / popover A→B→C in the 0.7.0 npm publish, wizard / tooltip / combobox / banner / polish / menu A→B→C in the 0.8.0 npm publish, and switch A→B→C, slider A→B→C, checkbox A→B→C, radio A→B→C, plus breadcrumb A→B→C on master (unpublished vs 0.8.0). Do not invent a next version number; the next cut happens when new Juice changesets exist.

---

## Summary

0.4.0 was a real Beta cut. It shipped modular themes, motion wave 1, accordion and tabs runtimes, teal tokens, and packaging that matches the auto-enhance story. It was an earlier public npm cut.

**0.6.0 was an earlier public npm cut** for Tide, surfaces + depth, contracts, and modal / dialog A→B→C. Blush remains draft.

**0.7.0 was the prior public npm cut** for drawer, toast, and popover A→B→C.

**0.8.0 is the live npm cut** for wizard, tooltip, combobox, banner, eleven-runtime polish, and menu A→B→C. Those twelve stay Emerging.

Master is ahead of that cut. Switch A→B→C, slider A→B→C, checkbox A→B→C, radio A→B→C, and breadcrumb A→B→C are on master and unpublished. Switch is the thirteenth Emerging auto-enhance runtime. Slider is the fourteenth. Checkbox is the fifteenth. Radio is the sixteenth. Breadcrumb is the seventeenth. Checkbox and radio are two runtimes. Breadcrumb is a light trail. Do not invent a next version number.

The next stage is post-0.8.0 refinement:

* remaining surface depth utilities are done (`shadowTone`, `overlay`, `variant`); structural `card="…"` recipes can stay later
* modal / dialog A→B→C is in 0.6.0; drawer A→B→C, toast A→B→C, and popover A→B→C are in 0.7.0; wizard A→B→C, tooltip A→B→C, combobox A→B→C, banner A→B→C, eleven-runtime polish A→B→C, and menu A→B→C are in 0.8.0; switch A→B→C, slider A→B→C, checkbox A→B→C, radio A→B→C, and breadcrumb A→B→C are done on master (still unpublished vs 0.8.0); grow the next runtime only when the markup contract is honest
* keep templates as stress tests; CLI in parallel

That is a strong place to be.
