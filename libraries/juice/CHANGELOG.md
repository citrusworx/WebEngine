# @citrusworx/juiceui

## 0.9.0

### Minor Changes

- **Switch theme chrome and APG switch runtime.** Shared `--juice-switch-*` roles paint `[switch]`. The DOM-first runtime auto-enhances valid markup (`createSwitch` / `initSwitch` / `startSwitchRuntime` / `stopSwitchRuntime`): `toggle` / `check` / `uncheck` / `setChecked` / `isChecked`, `role="switch"` plus binary `aria-checked` on button hosts (checkbox-backed hosts stay honest with `:checked`). Click and Enter/Space toggle. Disabled / `aria-disabled` ignored. Authors must supply the accessible name. No focus trap, no Escape steal, no tri-state. No Sig Switch factory.
- **Slider theme chrome and APG slider runtime.** Shared `--juice-slider-*` roles paint `[slider]` / `[slider-fill]` / `[slider-thumb]`. The DOM-first runtime auto-enhances valid markup (`createSlider` / `initSlider` / `startSliderRuntime` / `stopSliderRuntime`): `setValue` / `getValue` / `increment` / `decrement`, `role="slider"` plus `aria-valuemin` / `aria-valuemax` / `aria-valuenow` on `[slider-thumb]`, and `--juice-slider-ratio` on the host. Arrows / Home / End / PageUp / PageDown. Pointer jump and drag. Horizontal only. Disabled / `aria-disabled` ignored. Authors must supply the accessible name. No Escape, no vertical, no multi-thumb, no native range restyle. No Sig Slider factory.
- **Checkbox and radio theme chrome and APG runtimes.** Shared `--juice-checkbox-*` roles paint `[checkbox]`. Shared `--juice-radio-*` roles paint `[radio]` inside layout-only `[radiogroup]` (no `--juice-radiogroup-*`). Checkbox (`createCheckbox` / `initCheckbox` / `startCheckboxRuntime` / `stopCheckboxRuntime`): `toggle` / `check` / `uncheck` / `setChecked` / `isChecked`, `role="checkbox"` plus binary `aria-checked` on button hosts (native checkbox hosts stay honest with `:checked`). Radio (`createRadio` / `initRadio` / `startRadioRuntime` / `stopRadioRuntime`): `select` / `getChecked`, exclusive selection, roving tabindex. Click, Enter, and Space select. Arrows move among enabled options and wrap. Orphans outside `[radiogroup]` are ignored. Checkbox and radio are two runtimes. Binary only. No tri-state, no Escape. Authors must supply the accessible name. No Sig Checkbox or Sig Radio factory.
- **Breadcrumb theme chrome and light trail runtime.** Shared `--juice-breadcrumb-*` roles paint `[breadcrumb]` / `[breadcrumb-item]` / `[breadcrumb-link]`. The DOM-first runtime auto-enhances valid markup (`createBreadcrumb` / `initBreadcrumb` / `startBreadcrumbRuntime` / `stopBreadcrumbRuntime`): `sync` / `setCurrent`. An unlabeled navigation landmark is named `Breadcrumb`. `<nav>` does not get a redundant role. `<ol breadcrumb>` stays a list. A single `aria-current="page"` is kept (author current wins; otherwise the last crumb). It does not remove `href`, trap focus, steal Escape, or listen to history. Not a router. No Sig Breadcrumb factory.
- **Progress theme chrome and APG progress runtime.** Shared `--juice-progress-*` roles paint `[progress]` / `[progress-fill]` / optional `[progress-label]`. The DOM-first runtime auto-enhances valid markup (`createProgress` / `initProgress` / `startProgressRuntime` / `stopProgressRuntime`): `setValue` / `getValue` / `setIndeterminate` / `isIndeterminate`. `role="progressbar"` plus `aria-valuemin` / `aria-valuemax` / `aria-valuenow` and `--juice-progress-ratio` on the host. Determinate is the boolean attribute. A missing or non-numeric `aria-valuenow` is min (an empty bar), not indeterminate. Values clamp. Indeterminate is `progress="indeterminate"` only: that flag clears `aria-valuenow` and restores the last determinate value when the flag clears. Authors must supply the accessible name. The runtime does not invent or rewrite `aria-valuetext`. No keyboard, no focus trap, no Escape, no native `<progress>` restyle. No Sig Progress factory.

### Patch Changes

- Document the APG switch runtime as an Emerging auto-enhance (`docs/juice/juice-switch-runtime.md`).
- Document the APG slider runtime as an Emerging auto-enhance (`docs/juice/juice-slider-runtime.md`).
- Document the APG checkbox and radio runtimes as Emerging auto-enhances (`docs/juice/juice-checkbox-runtime.md`, `docs/juice/juice-radio-runtime.md`).
- Document the light breadcrumb runtime as an Emerging auto-enhance (`docs/juice/juice-breadcrumb-runtime.md`).
- Document the APG progress runtime as an Emerging auto-enhance (`docs/juice/juice-progress-runtime.md`).
- Align Juice docs with the live `@citrusworx/juiceui@0.8.0` npm cut (wizard, tooltip, combobox, banner, eleven-runtime polish, and menu A→B→C). The eighteen stay **Emerging**.

## 0.8.0

### Minor Changes

- **Wizard theme chrome and step runtime.** Shared `--juice-wizard-*` roles paint `[wizard-shell]` / `[wizard-header]` / `[wizard-rail]` / `[step]`. The DOM-first runtime auto-enhances valid shell markup (`createWizard` / `initWizard` / `startWizardRuntime` / `stopWizardRuntime`): `next` / `prev` / `goTo(index|id)` / `current`, pairing (`aria-controls` → id, else shared `data-step` / `name` / `step-page`, else index), nav modes (bare = completed + current; `linear` = prev/next only; `free` = any step), `[wizard-prev]` / `[wizard-next]` or unmarked `[step-nav]` buttons, optional `[wizard-complete]` on the last step. Pages use native `hidden`. A11y is `aria-current="step"` plus pages as `role="region"` — not APG Tabs. Distinct from modal/drawer/toast/popover. No Sig Wizard factory.
- **Tooltip theme chrome and hover/focus runtime.** Shared `--juice-tooltip-*` roles paint `[tooltip-root]` / `[tooltip-panel]`. The DOM-first runtime auto-enhances valid root markup (`createTooltip` / `initTooltip` / `startTooltipRuntime` / `stopTooltipRuntime`): `show` / `hide`, pairing (`aria-describedby` preferred), show on mouseover/focusin, hide on mouseout/focusout with a 150ms grace delay, exclusive one tip, Escape (yields to open modal/drawer overlay or popover-root), no focus trap, dependency-free placement with one-axis flip. Touch / first-tap later. Distinct from popover (interactive) and native `title`. Never a bare `tooltip` attribute. No Sig Tooltip factory.
- **Combobox theme chrome and listbox runtime.** Shared `--juice-combobox-*` roles paint `[combobox]` / `[combobox-input]` / `[combobox-list]` / `[combobox-option]`. The DOM-first runtime auto-enhances valid markup (`createCombobox` / `initCombobox` / `startComboboxRuntime` / `stopComboboxRuntime`): `open` / `close` / `toggle` / `select`, case-insensitive substring filter, keyboard (ArrowUp/Down, Home/End, Enter selects, Escape closes, Tab closes without commit), `aria-activedescendant` plus `aria-expanded`, exclusive among comboboxes. Placement is CSS-only (absolute under the field). Distinct from native `<select>`. No multi-select / async fetch. No Sig Combobox factory.
- **Banner theme chrome and dismiss runtime.** Shared `--juice-banner-*` roles paint `[banner]` / `[banner-body]` / `[banner-close]`. The DOM-first runtime auto-enhances valid markup (`createBanner` / `initBanner` / `startBannerRuntime` / `stopBannerRuntime`): `show` / `dismiss`, `[banner-close]` click / keyboard, `role="status"` (or `role="alert"` for error/warning), optional `banner-persist="session|local"` with `name` / `id`. No focus trap, no Escape steal, no auto-dismiss timer. Distinct from toast stack and from modal/drawer. No Sig Banner factory.
- **Menu theme chrome and APG menu-button runtime.** Shared `--juice-menu-*` roles paint `[menu-root]` / `[menu]` / `[menuitem]`. The DOM-first runtime auto-enhances valid root markup (`createMenu` / `initMenu` / `startMenuRuntime` / `stopMenuRuntime`): `open` / `close` / `toggle` / `select`, opener pairing, roving tabindex on `[menuitem]`, exclusive among menus, Escape with popover (yields to modal/drawer). Boolean `[menu]` attr (no HTML global `menu`; not the `<menu>` element). Placement CSS-absolute from the root (`top|bottom|left|right`). Distinct from popover, combobox, native `<select>`, menubar, and context menu. No submenus, no typeahead, no Sig Menu factory.

### Patch Changes

- Document the wizard step runtime as an Emerging auto-enhance (`docs/juice/juice-wizard-runtime.md`).
- Document the tooltip hover/focus runtime as an Emerging auto-enhance (`docs/juice/juice-tooltip-runtime.md`).
- Document the combobox listbox runtime as an Emerging auto-enhance (`docs/juice/juice-combobox-runtime.md`).
- Document the banner dismiss runtime as an Emerging auto-enhance (`docs/juice/juice-banner-runtime.md`).
- Document the APG menu-button runtime as an Emerging auto-enhance (`docs/juice/juice-menu-runtime.md`).
- Tighten Emerging runtime Escape yield: dialogs, then popover, then combobox, then toast / tooltip. Banner never steals Escape. Menu yields with popover.
- Extract internal shared runtime primitives (event claim, escapeId, overlay queries, focus trap) under `src/js/src/shared/` (not a public API).
- Document Escape / z-index bands and honest Limitations for the Emerging auto-enhance runtimes (polish C). The twelve stay **Emerging**.

## 0.7.0

### Minor Changes

- **Drawer theme chrome and dialog runtime.** Shared `--juice-drawer-*` roles paint `[drawer-overlay]` / `[drawer]` / `[drawer-close]`. The DOM-first runtime auto-enhances valid overlay markup (`createDrawer` / `initDrawer` / `startDrawerRuntime` / `stopDrawerRuntime`): opener pairing via `aria-controls`, native `hidden` for open vs closed, focus trap, Escape and backdrop click (`drawer-overlay="static"` opts out), and exclusive open. Edge is `[drawer]` / `[drawer="left"|"right"]`; optional width is `[drawer-size="sm|lg"]`. Distinct from surface `overlay="frost|tint"` and from modal. No Sig Drawer factory.
- **Toast theme chrome and snackbar runtime.** Shared `--juice-toast-*` roles paint `[toast-region]` / `[toast]` / `[toast-close]`. The DOM-first runtime auto-enhances valid region markup (`createToast` / `initToast` / `startToastRuntime` / `stopToastRuntime`): authors place the region and toast nodes; `show` / `dismiss`; `toast-duration` (default 5000; `0` / `Infinity` / negative is sticky); auto-dismiss pause on hover/focus; Escape for the most recent visible toast only when no open modal/drawer overlay exists. Not a dialog (no focus trap, no `aria-modal`). Distinct from surface `overlay="frost|tint"` and from modal/drawer. No Sig Toast factory.
- **Popover theme chrome and anchored runtime.** Shared `--juice-popover-*` roles paint `[popover-root]` / `[popover-panel]` / `[popover-close]`. The DOM-first runtime auto-enhances valid root markup (`createPopover` / `initPopover` / `startPopoverRuntime` / `stopPopoverRuntime`): open/close/toggle, Escape (yields to modal/drawer), outside click, Tab trap, exclusive popover open, dependency-free placement with one-axis flip. Non-modal dialog (`role="dialog"`, no `aria-modal`). Names avoid the native HTML `popover` attribute. Distinct from modal/drawer/toast. No Sig Popover factory.

### Patch Changes

- Document the drawer dialog runtime as an Emerging auto-enhance (`docs/juice/juice-drawer-runtime.md`).
- Document the toast / snackbar runtime as an Emerging auto-enhance (`docs/juice/juice-toast-runtime.md`).
- Document the popover runtime as an Emerging auto-enhance (`docs/juice/juice-popover-runtime.md`).

## 0.6.0

Public npm cut of the 0.5.0 versioned stack (Tide, surfaces + depth, contracts, modal runtime). Workspace `package.json` on master still read 0.5.0; this records the published lineage before the next minor.

## 0.5.0

### Minor Changes

- **Tide is a fourth library theme.** Import `@citrusworx/juiceui/styles/themes/tide` (or `themes/tide.css`) and activate with `theme="tide"`. Dark product/SaaS identity with teal/lagoon tokens, accordion and tabs chrome, and named `tide-card` / `tide-panel` surfaces. Blush remains a draft under `src/themes/_draft/`.
- **Surface language A–C plus remaining depth.** Themeable `surfaceTone="soft|strong|muted"`, composable `borderStrength="soft|bold"`, standalone `blur="sm|md"` (`6px` / `16px`), themeable `shadowTone="cool|warm"`, themeable `overlay="frost|tint"`, and composable `variant="monochromatic|glass|tinted"` recipes. Aquaflux, KiwiPress, Citrusmint, Tide, and generated themes bind the `--juice-*` roles from existing tokens. Finer overlay / blur / borderStrength / shadowTone attrs win their property when combined with a tone or variant.
- **Modal theme chrome and dialog runtime.** Shared `--juice-modal-*` roles paint `[modal-overlay]` / `[modal]` / `[modal-close]`. The DOM-first runtime auto-enhances valid overlay markup (`createModal` / `initModal` / `startModalRuntime` / `stopModalRuntime`): opener pairing via `aria-controls`, native `hidden` for open vs closed, focus trap, Escape and backdrop click (`modal-overlay="static"` opts out), and exclusive open. Distinct from surface `overlay="frost|tint"`. No Sig Modal factory.

### Patch Changes

- Lock the Theme Contract required `--juice-*` binds with automated tests. `yarn workspace @citrusworx/juiceui verify` fails if aquaflux, kiwipress, citrusmint, tide, or the theme generator drops a required accordion, tabs, modal, surface-tone, border-strength, shadow-tone, or overlay bind.
- Honor the icon authoring contract: default `[icon]` size is `1rem`, `iconSize` (`xxs`…`xxl`) is first-class, and `width` / `height` remain the custom-size escape hatch. Mobile `[icon]` size remaps no longer clobber author sizing.
- Author `font=`, `fontColor=`, `fontWeight=`, and `lineHeight=` beat theme semantic defaults on headings and paragraphs via `[theme] [attr]` companions.
- Document the modal dialog runtime as an Emerging auto-enhance (`docs/juice/juice-modal-runtime.md`).

## 0.4.0

### Breaking Changes

- **`@citrusworx/juiceui/styles` is core-only.** It now ships `dist/index.css` (utilities and components, no theme identity). Import a published theme separately via `@citrusworx/juiceui/styles/themes/<id>` (`aquaflux`, `kiwipress`, or `citrusmint`).

### Minor Changes

- Added modular theme builds: `dist/themes/aquaflux.css`, `kiwipress.css`, `citrusmint.css`.
- Added motion wave 1: `fade.in.down/up`, `fade.out.down/up`, `slideOut.left/right/up/down` (P1).
- Documented responsive defaults, `surfaceTone="soft"`, and an expanded motion catalog.
- Added accordion layout chrome (`[accordion]`, `[accordion-item]`) and Aquaflux surface styling so FAQ triggers read as stacked controls, not primary CTA buttons.
- Added a shared accordion chrome role contract (`--juice-accordion-*`, with `--aqua-*` / `--kw-*` / `--cm-*` / `--jx-*` aliases) so library and generated themes bind trigger/chevron/panel/focus paint from existing tokens.
- Added a DOM-first accordion runtime that auto-enhances valid `[accordion]` markup (click toggle, Escape, late DOM sync) without app init.
- Added tabs layout chrome (`[tabs]`, `[tabs-list]`, `[tab]`, `[tab-panel]`) and a shared `--juice-tabs-*` role contract so library and generated themes bind strip/trigger/indicator/focus paint from existing tokens, with CTA overrides so tab buttons are not primary gradient buttons.
- Added a DOM-first tabs runtime that auto-enhances valid `[tabs]` markup (exclusive panels, APG keyboard, dual-write `[active]`/`aria-selected`, late DOM sync) without app init.
- Added a teal/cyan color family (`teal-100`–`teal-900`, `lagoon` swatch). Draft dark Tide (and blush) remain **unpublished**: they live under `src/themes/_draft/`, are blocked from package `exports`, and are omitted from the published tarball.

### Patch Changes

- Bind accordion chrome roles in generated Juice themes so app-owned `--jx-*` stylesheets paint `[accordion-item]` from existing surface and accent tokens.
- Mark `dist/index.js` as a `sideEffects` entry so auto-start navigation, accordion, and tabs runtimes survive bundler tree-shaking. Depend on a published `@citrusworx/sigjs` `^0.2.0` caret range so npm consumers do not receive `workspace:^`. Document those runtimes as Emerging in Beta.
- Close Tide FAQ accordion chrome toward the dark navy mock (local draft only — Tide is not a published theme).

## 0.3.0

### Minor Changes

- Updated Grid built-in responsiveness.

## 0.1.1

### Patch Changes

- Replace monorepo-only internal dependency ranges with published semver ranges so consumers outside the workspace can install these packages correctly.

## 0.1.0

### Minor Changes

- Added READMEs to each

### Patch Changes

- Updated dependencies
  - @citrusworx/sigjs@0.1.0

## 0.0.2

### Patch Changes

- e7a1584: Release preparation
- e7a1584: Standardize library package manifests for independent publishing, align build outputs with published entrypoints, and add Changesets-based release automation for the monorepo.
- Updated dependencies [e7a1584]
- Updated dependencies [e7a1584]
  - @citrusworx/sigjs@0.0.2
