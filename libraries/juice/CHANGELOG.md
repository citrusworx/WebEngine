# @citrusworx/juiceui

0.9.1 through 0.9.5 below were backfilled from changesets whose introducing commits are ancestors of the published `gitHead`. `changeset version` was not run. Docs-only notes are not files in the npm tarball (`package.json` `files` is `dist`); they are listed because that commit is in the published git tree.

## 0.9.5

Published to npm **2026-10-30** (`gitHead` `442041cadbf1c07928b1ae190b57d021c81db3f4`, npm time `2026-10-30T15:11:27.228Z`).

### Patch Changes

- Add keyboard-avoider chrome (`[keyboard-avoider]`, `[keyboard-avoider~="padding"]`, `[keyboard-avoider~="translate"]`, `[keyboard-avoider~="footer"]`) and the `--juice-keyboard-inset`, `--juice-keyboard-duration`, and `--juice-keyboard-easing` roles on `:root`. Padding mode sets `padding-bottom` from the inset. Translate shifts with `translateY`. Footer is `position: sticky` with `bottom` set to the inset. With `[safe-area]` in padding mode, bottom padding is `max(var(--juice-safe-area-pad), env(safe-area-inset-bottom, 0px), var(--juice-keyboard-inset))`. No runtime. Shipped themes do not bind the roles. `interactive-widget=resizes-content` is a documented alternative on Chrome Android 108+.
- Add the keyboard-avoider runtime (`createKeyboardAvoider` / `initKeyboardAvoider` / `startKeyboardAvoiderRuntime` / `stopKeyboardAvoiderRuntime`). It writes `--juice-keyboard-inset` on `<html>` from the visual viewport and sets `[keyboard-open]` while an editable field is covered. It does not set `navigator.virtualKeyboard.overlaysContent`.
- Document keyboard-avoider chrome and the runtime (slice C). Keyboard avoider is the thirty-first Emerging auto-enhance runtime, on master and not in the published npm 0.9.2 release. `@citrusworx/sigjs/juice` `bind()` does not name keyboard-avoider, pressable, or touchable-row yet.
- Footer mode on `nav[fixed]` sets `bottom: auto`, so a fixed top bar does not stretch down to the keyboard inset. Other footer hosts stay `position: sticky` with `bottom` set to the inset. `nav[sticky]` is unchanged: a sticky box is sized in flow, and that `bottom` does not stretch it.

## 0.9.4

Published to npm **2026-10-29** (`gitHead` `f6c44d079a2902728d3369f4f3989246f0cd5128`, npm time `2026-10-29T21:05:36.261Z`).

### Patch Changes

- Document the CSS-only safe-area inset and align maturity, roadmap, and coverage notes (slice C). Safe area is on master and is not in the published npm 0.9.2 release. It is not an auto-enhance runtime.
- Add pressable chrome (`[pressable]`, `[pressable="scale"]`) and the `--juice-pressable-*` roles. Hover is a 1px inset ring and pressed is a 2px inset ring, both `currentColor`, so the fill behind the text does not change. `[pressed]` is styled here and set by the runtime in slice B. The scale variant is opt-in. No pseudo-element and no position. No runtime. Shipped themes do not bind the roles.
- Add a DOM-first pressable runtime that sets transient `[pressed]` for the duration of a press (`createPressable` / `initPressable` / `startPressableRuntime` / `stopPressableRuntime`). `[pressable-longpress]` opts into `juice:longpress`. A disabled pressable no longer clears an icon-button's latched pressed ring.
- Document pressable chrome and the runtime (slice C), and stop Space from scrolling a custom pressable button. Pressable is the twenty-ninth Emerging auto-enhance runtime, on master and not in the published npm 0.9.2 release. `@citrusworx/sigjs/juice` `bind()` does not name it yet.
- Add touchable-row chrome (`[touchable-row]` on `a`, `button`, `li`, or `div`, with leading, content, title, subtitle, and trailing slots) and the `--juice-touchable-row-*` roles. Dense stays at a 44px min height. The disclosure chevron is `::after`. The inset divider is a currentColor mix and the selected state is a start border, so the row does not paint a wash. Press feedback stays on `[pressable]`. No runtime. Shipped themes do not bind the roles.
- Add the touchable-row runtime (`createTouchableRow` / `initTouchableRow` / `startTouchableRowRuntime` / `stopTouchableRowRuntime`). `[touchable-row~="select"]` toggles selection. Enter and Space activate `li` and `div` rows. A direct `[touchable-row-title]` can ellipsize, and `="clamp"` uses the line clamp.
- Document touchable-row chrome and the runtime (slice C). Touchable row is the thirtieth Emerging auto-enhance runtime, on master and not in the published npm 0.9.2 release. `@citrusworx/sigjs/juice` `bind()` does not name pressable or touchable-row yet.

## 0.9.3

Published to npm **2026-10-27** (`gitHead` `c794c06f421f3682e1efd1e96465cffc0a6404d1`, npm time `2026-10-27T15:29:20.010Z`).

### Minor Changes

- Dispatch a bubbling `juice:change` event from Juice runtime hosts when observable state changes, and add `getState` plus the missing open, expanded, selected, current, shown, and invalid readers. Select, input, and textarea stay on the native `input` and `change` events. Maturity stays Emerging.
- Add icon-button chrome (`[icon-button]`, `[icon-button="round"]` / `[round]`, `[scale]`, `[pressed]` / `[aria-pressed="true"]`) and core `--juice-icon-button-*` geometry roles. Defaults follow button padding. Shipped themes keep button color and do not need per-theme binds.
- Add a DOM-first icon-button runtime that auto-enhances `[icon-button]` (`createIconButton` / `initIconButton` / `startIconButtonRuntime` / `stopIconButtonRuntime`). `[toggle]` keeps `aria-pressed` and `[pressed]` in sync. Unnamed hosts warn once in development. No label is invented.
- Add skeleton loading chrome (`[skeleton]`, `[skeleton="text"|"circle"|"rect"]`, `[lines="1"…"8"]`, stacked text lines, `[scale]`, `[static]`) and core `--juice-skeleton-*` roles. Defaults mix inherited ink into the muted surface, so shipped themes do not need per-theme binds. The sweep uses `--juice-motion-*` and stops under `prefers-reduced-motion`.
- Add avatar chrome (`[avatar]`, `[avatar="square"]`, `[scale]`, `[status="online|away|busy|offline"]`, `[avatar-group]`, `[avatar-more]`) and core `--juice-avatar-*` roles. Defaults come from the muted surface, inherited ink, and banner status hues. KiwiPress and Aquaflux need no overrides. Tide lifts `--juice-avatar-status-away` so the warning dot stays visible on the dark muted surface. The status color transition uses `--juice-motion-*` and stops under `prefers-reduced-motion`.
- Add a DOM-first avatar runtime that auto-enhances `[avatar]` (`createAvatar` / `initAvatar` / `startAvatarRuntime` / `stopAvatarRuntime`). A child image that errors, is empty, or is already broken sets `[fallback]` and is hidden so initials show. A successful load clears that fallback. Accessible names are left untouched.
- Add list chrome (`[list]` on `ul` / `ol` / `div`, `[divided]`, `[dense]`, `[list-item]`, `[list-leading]`, `[list-content]`, `[list-secondary]`, `[list-trailing]`, `[selected]` / `aria-current`) and core `--juice-list-*` roles. Defaults mix inherited ink for the divider, secondary line, and hover / selected washes, so shipped themes do not need per-theme binds. Interactive rows use the 2px `currentColor` focus outline. Their background transition uses `--juice-motion-*` and stops under `prefers-reduced-motion`.
- Add table chrome (`[table]` on `<table>`, `[striped]`, `[dense]`, `[sticky]`, `[table-scroll]`, `[table-align]`, `[numeric]`, `[selected]` / `aria-selected="true"`) and core `--juice-table-*` roles. Defaults mix inherited ink for the border, header, stripe, hover, and selected washes over the strong surface, so shipped themes do not need per-theme binds. The scroll wrapper uses the 2px `currentColor` focus outline. Row background transitions use `--juice-motion-*` and stop under `prefers-reduced-motion`.
- Add a DOM-first table sort runtime that auto-enhances `th[sortable]` inside `[table]` (`createTable` / `initTable` / `startTableRuntime` / `stopTableRuntime`). Activating a header cycles ascending, descending, and none, sets `aria-sort`, and reorders each `tbody`. A canceled `juice:sort` updates that state without reordering.
- Add badge chrome roles (`--juice-badge-bg`, `--juice-badge-ink`, `--juice-badge-border`, plus padding, radius, font size, and gap). Defaults mix inherited body ink, so shipped themes do not need per-theme binds. `[badge]` keeps that ink and `line-height: 1` over theme copy rules. A `[cta]` companion keeps the badge fill with the ink. Link and button badges use the 2px `currentColor` focus outline.

### Patch Changes

- Document the icon-button runtime and align maturity / Beta / roadmap notes (slice C). Icon button is the twenty-sixth Emerging auto-enhance runtime, on master and not in the published npm 0.9.2 release.
- Document the CSS-only skeleton loading placeholder and align maturity, roadmap, and coverage notes (slice C). Skeleton is on master and is not in the published npm 0.9.2 release. It is not an auto-enhance runtime.
- Document the avatar chrome and image-fallback runtime and align maturity / Beta / roadmap notes (slice C). Avatar is the twenty-seventh Emerging auto-enhance runtime, on master and not in the published npm 0.9.2 release.
- Document the CSS-only list chrome and align maturity, roadmap, and coverage notes (slice C). List is on master and is not in the published npm 0.9.2 release. It is not an auto-enhance runtime.
- Document the table chrome and sortable runtime and align maturity / Beta / roadmap notes (slice C). Table is the twenty-eighth Emerging auto-enhance runtime, on master and not in the published npm 0.9.2 release.
- Document the CSS-only badge chrome and align maturity, roadmap, and coverage notes (slice C). Badge layout and KiwiPress paint shipped in npm 0.9.2. It is not an auto-enhance runtime.
- Document the core badge chrome roles and align maturity, roadmap, and coverage notes (slice C). The base `[badge]` layout shipped in npm 0.9.2. The `--juice-badge-*` roles are on master and are not in that cut. Badge is not an auto-enhance runtime.
- Add safe-area chrome (`[safe-area]`, `[safe-area="top"]`, `[safe-area="bottom"]`, `[safe-area="x"]`, `[safe-area="y"]`) and the `--juice-safe-area-pad` role on `:root`. Each edge is `max(var(--juice-safe-area-pad), env(safe-area-inset-*))`, so a device with no inset still keeps the base pad. No runtime. Shipped themes do not bind the role. `viewport-fit=cover` is required on the viewport meta tag for the insets to be non-zero.

## 0.9.2

Published to npm **2026-10-14** (`gitHead` `03cf749c8e8ddc740e7613f398840864bc5ba827`, npm time `2026-10-14T17:26:03.121Z`).

### Minor Changes

- Add disclosure theme chrome roles (`--juice-disclosure-*`) and bind them on Aquaflux, KiwiPress, Citrusmint, Tide, the retro library themes, and generated `--jx-*` themes.
- Add a DOM-first disclosure runtime that auto-enhances `[disclosure]` (`createDisclosure` / `initDisclosure` / `startDisclosureRuntime` / `stopDisclosureRuntime`): one trigger toggles one panel with `aria-expanded` and native `hidden`, orphans outside the root are ignored, and Escape collapses only the focused or last-opened disclosure.
- Add spinner theme chrome roles (`--juice-spinner-*`) and bind them on Aquaflux, KiwiPress, Citrusmint, Tide, the retro library themes, and generated `--jx-*` themes.
- Add a DOM-first spinner runtime that auto-enhances `[spinner]` (`createSpinner` / `initSpinner` / `startSpinnerRuntime` / `stopSpinnerRuntime`): `role="status"` and `aria-busy` while shown, `show` / `hide` via the native `hidden` attribute, and a hidden spinner does not announce as busy.
- Add select theme chrome roles (`--juice-select-*`) and bind them on Aquaflux, KiwiPress, Citrusmint, Tide, the retro library themes, and generated `--jx-*` themes.
- Add a DOM-first select runtime that auto-enhances native `<select select>` (`createSelect` / `initSelect` / `startSelectRuntime` / `stopSelectRuntime`). A visible label names the control when the author has not set one. The open list stays the platform popup.
- Add input theme chrome roles (`--juice-input-*`) and bind them on Aquaflux, KiwiPress, Citrusmint, Tide, the retro library themes, and generated `--jx-*` themes.
- Add a DOM-first input runtime that auto-enhances native `<input input>` (`createInput` / `initInput` / `startInputRuntime` / `stopInputRuntime`). A visible label names text-like controls when the author has not set one. Typing and the keyboard stay native.
- Add textarea theme chrome roles (`--juice-textarea-*`) and bind them on Aquaflux, KiwiPress, Citrusmint, Tide, the retro library themes, and generated `--jx-*` themes.
- Add a DOM-first textarea runtime that auto-enhances native `<textarea textarea>` (`createTextarea` / `initTextarea` / `startTextareaRuntime` / `stopTextareaRuntime`). A visible label names the control when the author has not set one. Typing and the keyboard stay native.
- Add field theme chrome roles (`--juice-field-*`) and bind them on Aquaflux, KiwiPress, Citrusmint, Tide, the retro library themes, and generated `--jx-*` themes.
- Add a DOM-first field runtime that auto-enhances `[field]` wrappers (`createField` / `initField` / `startFieldRuntime` / `stopFieldRuntime`). Visible help and error text describe the control when the author has not set `aria-describedby`, and `[invalid]` mirrors `aria-invalid` when the author has not set it. Typing and the keyboard stay native.
- Add Emerging motion tokens (`--juice-motion-duration-instant|fast|base|slow` and `--juice-motion-ease-standard|enter|exit|linear`). Duration tokens collapse to `0.01ms` under `prefers-reduced-motion: reduce`. Component, animation, and gradient timing reads those tokens. Generated `--jx-*` themes pass the same defaults through. Shipped themes are not retimed.
- Add an Emerging motion helper and play tokenized enter/exit motion on modal, drawer, popover, and toast. `hidden` is applied after the exit finishes. Accordion and disclosure panels with `[motion="accordion"]` animate height from measured `scrollHeight`. Reduced motion makes those lifecycles instant. Toast auto-dismiss duration and the tooltip hide delay stay reading-time timers.

### Patch Changes

- Tighten Boardwalk to the Theme Quality bar: a soft/inverse ink ladder on cream, a stepped light surface stack with a navy footer, a calm coral/mint/sunshine hero, Juice `[hero]` / `[card]` / `[panel]` / `[cta]` paints, and full Lato / Archivo Black fallback stacks.
- Document the disclosure runtime and align maturity / Beta / roadmap notes (slice C). Disclosure is the twentieth Emerging auto-enhance runtime, unpublished versus 0.9.1.
- Document the spinner runtime and align maturity / Beta / roadmap notes (slice C). Spinner is the twenty-first Emerging auto-enhance runtime, unpublished versus 0.9.1.
- Document the select runtime and align maturity / Beta / roadmap notes (slice C). Select is the twenty-second Emerging auto-enhance runtime, unpublished versus 0.9.1.
- Align Juice docs with the live `@citrusworx/juiceui@0.9.1` npm cut. 0.9.0 shipped eighteen Emerging runtimes, navigation through progress. 0.9.1 adds pagination (the nineteenth) and the ten retro library themes. Disclosure, spinner, and select stay unpublished versus 0.9.1. All twenty-two stay Emerging.
- Document the input runtime and align maturity / Beta / roadmap notes (slice C). Input is the twenty-third Emerging auto-enhance runtime, unpublished versus 0.9.1.
- Document the textarea runtime and align maturity / Beta / roadmap notes (slice C). Textarea is the twenty-fourth Emerging auto-enhance runtime, unpublished versus 0.9.1.
- Document the field runtime and align maturity / Beta / roadmap notes (slice C). Field is the twenty-fifth Emerging auto-enhance runtime, unpublished versus 0.9.1.
- Document the Emerging motion core: tokens, reduced motion, `data-motion-state`, overlay enter and exit, and the P0 catalog CSS gate. Motion stays unpublished versus 0.9.1.

## 0.9.1

Published to npm **2026-10-04** (`gitHead` `b937099dc23e6d4da63a062b02984de09e2b4cc7`, npm time `2026-10-04T16:59:28.296Z`).

### Minor Changes

- Add pagination theme chrome roles (`--juice-pagination-*`) and bind them on Aquaflux, KiwiPress, Citrusmint, Tide, and generated `--jx-*` themes.
- Add a DOM-first pagination runtime that auto-enhances `[pagination]` (`createPagination` / `initPagination` / `startPaginationRuntime` / `stopPaginationRuntime`): an unlabeled navigation landmark is named `Pagination`, one `aria-current="page"` is kept, prev/next disable at inferable ends, and Arrow/Home/End move focus among enabled controls.
- Ship ten retro library themes as separate CSS entrypoints: `retro-afterburn`, `retro-arcade-glow`, `retro-boardwalk`, `retro-denim-dial`, `retro-forest-radio`, `retro-orchard-club`, `retro-poolside-pop`, `retro-signal-garden`, `retro-sunset-motel`, and `retro-violet-parlor`. Import `@citrusworx/juiceui/styles/themes/<id>` (or `themes/<id>.css`) and activate with `theme="<id>"`. Each theme is `dist/themes/<id>.css`. There is no `retro.css` bundle. Blush remains a draft under `src/themes/_draft/`.

### Patch Changes

- Align Juice docs with the live `@citrusworx/juiceui@0.9.0` npm cut (switch, slider, checkbox, radio, breadcrumb, and progress A→B→C).
- Document the pagination page-set runtime and align maturity / Beta / roadmap notes (slice C). Pagination is the nineteenth Emerging auto-enhance runtime.
- Fix retro theme chrome binds: headings use the Sass heading token (readable on dark pages), CTA gradients stay in the accent family, and `btn="outline"` / `btn="secondary"` clear the CTA gradient so showcase theme chips render as bordered surface controls.
- Tighten Afterburn to the Theme Quality bar: a soft/inverse ink ladder, a stepped charcoal-and-steel surface stack, Juice `[hero]` / `[card]` / `[panel]` / `[cta]` paints, and full Lato / Archivo Black fallback stacks.
- Tighten Arcade Glow to the Theme Quality bar: a soft/inverse ink ladder, a stepped violet surface stack, Juice `[hero]` / `[card]` / `[panel]` / `[cta]` paints, and full Lato / Archivo Black fallback stacks.
- Keep Afterburn and Arcade Glow readable on their own dark surfaces: calmer hero and page washes, light ink on those fields, and outline controls that no longer inherit primary on-accent ink. The same outline fix applies to the other retro faces.

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
