# @citrusworx/juiceui

## What Juice is

Juice is an attribute-first styling library for CitrusWorx apps. Structure lives in markup (`stack`, `row`, `gap`, `card`), and themes own identity. The package ships the compiled stylesheet and a small JS entry so an app can import shared tokens, styles, and the optional runtimes from one place.

```html
<body theme="aquaflux">
  <section card stack gap="1" padding="1rem">
    <div row gap="1">
      <h1>Harbor</h1>
      <p>Attribute-first structure. The theme owns the color.</p>
    </div>
  </section>
</body>
```

## Install

```bash
npm install @citrusworx/juiceui
```

The same package name works with `pnpm add`, `yarn add`, and `bun add`.

## Quick start

`@citrusworx/juiceui/styles` is core only: utilities and components, with no theme identity. Import a theme stylesheet next to it, and set `theme` on `<body>` (or another root).

```ts
import "@citrusworx/juiceui/styles";
import "@citrusworx/juiceui/styles/themes/aquaflux";
```

```html
<body theme="aquaflux">
  <main stack gap="2rem" padding="2rem">
    <h1 font="bebas-neue" fontColor="obsidian-900">Juice</h1>
    <p font="lato" fontColor="gray-700">
      Attribute-driven styling from shared design tokens.
    </p>
    <button bgColor="green-500" hover="green-600" fontColor="white-100" padding="1rem">
      Get started
    </button>
  </main>
</body>
```

A page that sets `theme` and never imports a theme stylesheet has structure and no brand. The JS module is optional when the page is CSS only. See [Migration](#migration) for the core-only split.

## Themes

Themes are Beta. Set `theme="<id>"` on the root and import that id.

Core:

| Id | Import |
| --- | --- |
| `aquaflux` | `@citrusworx/juiceui/styles/themes/aquaflux` |
| `kiwipress` | `@citrusworx/juiceui/styles/themes/kiwipress` |
| `citrusmint` | `@citrusworx/juiceui/styles/themes/citrusmint` |
| `tide` | `@citrusworx/juiceui/styles/themes/tide` |

Retro:

| Id | Import |
| --- | --- |
| `retro-afterburn` | `@citrusworx/juiceui/styles/themes/retro-afterburn` |
| `retro-arcade-glow` | `@citrusworx/juiceui/styles/themes/retro-arcade-glow` |
| `retro-boardwalk` | `@citrusworx/juiceui/styles/themes/retro-boardwalk` |
| `retro-denim-dial` | `@citrusworx/juiceui/styles/themes/retro-denim-dial` |
| `retro-forest-radio` | `@citrusworx/juiceui/styles/themes/retro-forest-radio` |
| `retro-orchard-club` | `@citrusworx/juiceui/styles/themes/retro-orchard-club` |
| `retro-poolside-pop` | `@citrusworx/juiceui/styles/themes/retro-poolside-pop` |
| `retro-signal-garden` | `@citrusworx/juiceui/styles/themes/retro-signal-garden` |
| `retro-sunset-motel` | `@citrusworx/juiceui/styles/themes/retro-sunset-motel` |
| `retro-violet-parlor` | `@citrusworx/juiceui/styles/themes/retro-violet-parlor` |

Built files are `dist/index.css` (core) and `dist/themes/<id>.css`. Each theme is authored as `<themeId>.scss` + `<themeId>.yaml` under `src/themes/<themeId>/`. Drafts under `src/themes/_draft/` are blocked from package `exports` and left out of the published tarball. See [Theme authoring](../../docs/juice/juice-theme-authoring.md).

## Components and runtimes

The top-level JS entry is intentionally small. The named exports below are the stable runtime API Juice currently promises. All thirty stay Emerging.

Navigation through field (twenty-five runtimes) are in the published `@citrusworx/juiceui@0.9.2` release. Icon button, avatar, table, pressable, and touchable row are on master and are not in that release. Rows marked **master** are those five.

### Overlays

| Component | Markup | What it is | Docs |
| --- | --- | --- | --- |
| Modal | `[modal-overlay]` | Dialog. Open and close, Escape, focus trap, one open at a time. | [Modal](../../docs/juice/juice-modal-runtime.md) |
| Drawer | `[drawer-overlay]` | Edge dialog (`left` or `right`, optional `drawer-size` of `sm` or `lg`). Escape, focus trap, exclusive. | [Drawer](../../docs/juice/juice-drawer-runtime.md) |
| Popover | `[popover-root]` | Anchored non-modal dialog. The surface is `[popover-panel]`, never a bare `popover` attribute. | [Popover](../../docs/juice/juice-popover-runtime.md) |
| Tooltip | `[tooltip-root]` | Hover and focus tip. The surface is `[tooltip-panel]`, never a bare `tooltip` attribute or native `title`. | [Tooltip](../../docs/juice/juice-tooltip-runtime.md) |
| Toast | `[toast-region]` | Non-modal stack (default `top-right`). Not a dialog: no focus trap, no `aria-modal`, stacking is allowed. | [Toast](../../docs/juice/juice-toast-runtime.md) |

### Navigation

| Component | Markup | What it is | Docs |
| --- | --- | --- | --- |
| Navigation | `nav[type="mobile"]` | Mobile toggle for `nav[type="sidebar"]`. Also watches `nav[type="bar"]` and `nav[type="links"]`. | [Navigation](../../docs/juice/juice-navigation-runtime.md) |
| Menu | `[menu-root]` | APG menu button (`open` / `close` / `toggle` / `select`). Not a popover and not a menubar. | [Menu](../../docs/juice/juice-menu-runtime.md) |
| Tabs | `[tabs]` | One selected panel. Orphan `[tab]` triggers and `[tab-panel]` panels are ignored. | [Tabs](../../docs/juice/juice-tabs-runtime.md) |
| Breadcrumb | `[breadcrumb]` | Light trail (`sync` / `setCurrent`). Not a router. | [Breadcrumb](../../docs/juice/juice-breadcrumb-runtime.md) |
| Pagination | `[pagination]` | Page set (`sync` / `setCurrent`). One current page, prev/next disabled at inferable ends, Arrow / Home / End among enabled controls. The nineteenth Emerging runtime. | [Pagination](../../docs/juice/juice-pagination-runtime.md) |

### Forms

| Component | Markup | What it is | Docs |
| --- | --- | --- | --- |
| Input | `<input input>` | Text-like native field (`sync`). Not a combobox and not a select. The twenty-third Emerging runtime. Shipped in 0.9.2. | [Input](../../docs/juice/juice-input-runtime.md) |
| Textarea | `<textarea textarea>` | Native multiline field (`sync`). Not an input, not a select, and not a combobox. The twenty-fourth Emerging runtime. Shipped in 0.9.2. | [Textarea](../../docs/juice/juice-textarea-runtime.md) |
| Select | `<select select>` | Native dropdown (`sync`). The open list stays the platform popup. Not a combobox. The twenty-second Emerging runtime. Shipped in 0.9.2. | [Select](../../docs/juice/juice-select-runtime.md) |
| Combobox | `[combobox]` | Input plus listbox (`open` / `close` / `toggle` / `select`). Distinct from native `<select>`. | [Combobox](../../docs/juice/juice-combobox-runtime.md) |
| Checkbox | `[checkbox]` | APG checkbox (`toggle` / `check` / `uncheck` / `setChecked`). Not a layered overlay. Checkbox and radio are two runtimes. | [Checkbox](../../docs/juice/juice-checkbox-runtime.md) |
| Radio | `[radiogroup]` | APG radio group (`select` / `getChecked`). `[radio]` outside the group is ignored. Not a layered overlay. | [Radio](../../docs/juice/juice-radio-runtime.md) |
| Switch | `[switch]` | APG switch (`toggle` / `check` / `uncheck` / `setChecked`). Not a layered overlay. | [Switch](../../docs/juice/juice-switch-runtime.md) |
| Slider | `[slider]` | APG slider (`setValue` / `getValue` / `increment` / `decrement`). Not a layered overlay. | [Slider](../../docs/juice/juice-slider-runtime.md) |
| Field | `[field]` | Wrapper. Visible help and error describe the first input, textarea, or select. The twenty-fifth Emerging runtime. Shipped in 0.9.2. | [Field](../../docs/juice/juice-field-runtime.md) |
| Icon button (**master**) | `[icon-button]` | Square control on button chrome (`sync` / `toggle` / `getState`). Not a switch and not a checkbox. The twenty-sixth Emerging runtime. Not in npm 0.9.2. | [Icon button](../../docs/juice/juice-icon-button-runtime.md) |
| Pressable (**master**) | `[pressable]` | Transient press (`sync` / `getState`). Sets `[pressed]` for the gesture. `[pressable-longpress]` opts into `juice:longpress`. Not a latched toggle. The twenty-ninth Emerging runtime. Not in npm 0.9.2. | [Pressable](../../docs/juice/juice-pressable.md) |
| Touchable row (**master**) | `[touchable-row]` | 44px row (`sync` / `getState`). `[touchable-row~="select"]` toggles selection. Enter and Space activate an `li` or `div`. Not a single-select group. The thirtieth Emerging runtime. Not in npm 0.9.2. | [Touchable row](../../docs/juice/juice-touchable-row.md) |

### Feedback

| Component | Markup | What it is | Docs |
| --- | --- | --- | --- |
| Banner | `[banner]` | Inline alert / callout (`show` / `dismiss`, `[banner-close]`). Not a toast stack. | [Banner](../../docs/juice/juice-banner-runtime.md) |
| Progress | `[progress]` | APG-inspired progressbar (`setValue` / `getValue` / `setIndeterminate`). Not a slider. | [Progress](../../docs/juice/juice-progress-runtime.md) |
| Spinner | `[spinner]` | Indeterminate busy indicator (`show` / `hide`). Not a progress bar and not a disclosure. The twenty-first Emerging runtime. Shipped in 0.9.2. | [Spinner](../../docs/juice/juice-spinner-runtime.md) |

### Disclosure

| Component | Markup | What it is | Docs |
| --- | --- | --- | --- |
| Accordion | `[accordion]` | Multi-item expand and collapse. Open panels use native `hidden`. | [Accordion](../../docs/juice/juice-accordion-runtime.md) |
| Disclosure | `[disclosure]` | One trigger, one panel. Distinct from accordion. The twentieth Emerging runtime. Shipped in 0.9.2. | [Disclosure](../../docs/juice/juice-disclosure-runtime.md) |
| Wizard | `[wizard-shell]` | Multi-step shell. One `[step-page]` visible. Not a dialog and not tabs. | [Wizard](../../docs/juice/juice-wizard-runtime.md) |

### Data display

| Component | Markup | What it is | Docs |
| --- | --- | --- | --- |
| Avatar (**master**) | `[avatar]` | Initials or photo (`sync` / `getState`). Not a badge and not `[skeleton="circle"]`. The twenty-seventh Emerging runtime. Not in npm 0.9.2. | [Avatar](../../docs/juice/juice-avatar.md) |
| Table (**master**) | `<table table>` | Sortable grid (`createTable` / `sync` / `getState`). The twenty-eighth Emerging runtime. Not in npm 0.9.2. | [Table](../../docs/juice/juice-table.md) |

### Auto-start

Importing `@citrusworx/juiceui` enhances valid markup in the browser. The entry auto-starts navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, breadcrumb, progress, pagination, disclosure, spinner, select, input, textarea, field, icon button, avatar, table, pressable, and touchable row. Most apps need no `init` call.

These hooks work without app init: `[accordion]`, `[tabs]`, `[modal-overlay]`, `[drawer-overlay]`, `[toast-region]`, `[popover-root]`, `[wizard-shell]`, `[tooltip-root]`, `[combobox]`, `[banner]`, `[menu-root]`, `[switch]`, `[slider]`, `[checkbox]`, `[radiogroup]`, `[breadcrumb]`, `[progress]`, `[pagination]`, `[disclosure]`, `[spinner]`, `<select select>`, `<input input>`, `<textarea textarea>`, `[field]`, `[icon-button]`, `[avatar]`, `[table]`, `[pressable]`, `[touchable-row]`, and navigation (`nav[type="bar"]`, `nav[type="links"]`, `nav[type="mobile"]`, `nav[type="sidebar"]`).

The JS module is optional. Core CSS plus a theme is enough when the page does not use a runtime.

### Naming pattern

Every runtime exports the same four functions. `<Name>` is the stem: Navigation, Accordion, Tabs, Modal, Drawer, Toast, Popover, Wizard, Tooltip, Combobox, Banner, Menu, Switch, Slider, Checkbox, Radio, Breadcrumb, Progress, Pagination, Disclosure, Spinner, Select, Input, Textarea, Field, IconButton, Avatar, Table, Pressable, TouchableRow.

| Export | What it does |
| --- | --- |
| `create<Name>(options?)` | Builds a controller for markup in the document, or under `options.root`. |
| `init<Name>(options?)` | Calls `create<Name>` with the same options. |
| `start<Name>Runtime()` | Boots the document-level controller that enhances matching markup. A second call syncs and returns that controller. Returns `null` when there is no document. |
| `stop<Name>Runtime()` | Destroys that document-level controller. |

Modal shows the four export names. The other twenty-nine use the same `create` / `init` / `start` / `stop` names. Controller methods differ by runtime.

```ts
import {
  Accordion,
  createModal,
  initModal,
  startModalRuntime,
  stopModalRuntime,
  tokens,
} from "@citrusworx/juiceui";

const modal = createModal(); // initModal() is this same call
startModalRuntime();
stopModalRuntime();
```

`createModal()` returns a controller with `open`, `close`, `toggle`, `isOpen`, `getState`, `sync`, and `destroy`. `initModal()` is that same call. A normal page never calls them: importing the entry already started the runtime.

`tokens` is the shared token object: color families and swatches, and the `adobe` and `google` font providers. `Accordion` is a Sig component that renders one `[accordion]` section (trigger plus panel). It is not the document runtime. The runtime is `createAccordion` / `startAccordionRuntime`.

Icon button, avatar, table, pressable, and touchable row export the same four names on master. Those twenty functions are not in the published `@citrusworx/juiceui@0.9.2` build: `createIconButton`, `initIconButton`, `startIconButtonRuntime`, `stopIconButtonRuntime`, `createAvatar`, `initAvatar`, `startAvatarRuntime`, `stopAvatarRuntime`, `createTable`, `initTable`, `startTableRuntime`, `stopTableRuntime`, `createPressable`, `initPressable`, `startPressableRuntime`, `stopPressableRuntime`, `createTouchableRow`, `initTouchableRow`, `startTouchableRowRuntime`, and `stopTouchableRowRuntime`.

### `juice:change` and `getState`

Interactive runtimes dispatch a bubbling `juice:change` event from the widget host when observable state actually changes. `detail` is `{ runtime, state }`. `getState()` reads that same shape. Select, input, and textarea publish value changes through the native `input` and `change` events and still expose `getState()`. The contract stays Emerging, covers all thirty runtimes, and is on master, unreleased after 0.9.2. `JUICE_CHANGE_EVENT` is not in the published 0.9.2 types.

`@citrusworx/sigjs/juice` `bind` names twenty-eight runtimes, through `table`. Pressable is the twenty-ninth Emerging runtime and touchable row is the thirtieth. Neither is a `JuiceRuntimeName` yet. `icon-button`, `avatar`, and `table` are `JuiceRuntimeName` values, and `bind` accepts them. That is this workspace and published `@citrusworx/sigjs@0.7.2`. Published `@citrusworx/sigjs@0.7.0` and `@citrusworx/sigjs@0.7.1` still stop at twenty-five names, through `textarea`. Binding `icon-button`, `avatar`, or `table` against `@citrusworx/juiceui@0.9.2` throws, because that cut does not export `startIconButtonRuntime`, `startAvatarRuntime`, or `startTableRuntime`. Juice works without Sig: any page can listen or call `getState()`. The optional Sig adapter is `@citrusworx/sigjs/juice` only. See [`juice:change`](../../docs/juice/juice-runtime-behavior.md#juicechange) and [Sig.js + Juice](../../docs/sigjs/sig-juice-integration.md#runtime-binding).

### Markup examples

```html
<div tabs name="settings">
  <div tabs-list>
    <button type="button" tab active>Account</button>
    <button type="button" tab>Billing</button>
  </div>
  <div tab-panel>Account panel</div>
  <div tab-panel hidden>Billing panel</div>
</div>

<article aqua-card stack gap="0.5rem" padding="0.75rem">
  <section accordion name="faq-account">
    <button
      id="faq-account-trigger"
      type="button"
      accordion-item
      aria-expanded="false"
      aria-controls="faq-account-panel"
    >
      How do I update billing?
    </button>

    <div
      id="faq-account-panel"
      role="region"
      aria-labelledby="faq-account-trigger"
      hidden
    >
      Update billing from the account dashboard.
    </div>
  </section>
</article>

<div modal-overlay id="demo-modal" hidden>
  <div modal role="dialog" aria-modal="true" aria-labelledby="demo-title">
    <button type="button" modal-close aria-label="Close">×</button>
    <div modal-header><h2 id="demo-title">Account</h2></div>
    <div modal-body>Update billing from the account dashboard.</div>
  </div>
</div>
<button type="button" aria-controls="demo-modal">Open account</button>

<div drawer-overlay id="demo-drawer" hidden>
  <div drawer role="dialog" aria-modal="true" aria-labelledby="demo-drawer-title">
    <button type="button" drawer-close aria-label="Close">×</button>
    <div drawer-header><h2 id="demo-drawer-title">Filters</h2></div>
    <div drawer-body>Refine results from the catalog.</div>
  </div>
</div>
<button type="button" aria-controls="demo-drawer">Open filters</button>

<div toast-region>
  <div toast id="demo-toast">
    <div toast-title>Saved</div>
    <div toast-body>Your changes were written.</div>
    <button type="button" toast-close aria-label="Dismiss">×</button>
  </div>
</div>

<button type="button" aria-controls="demo-pop">Open help</button>
<div popover-root id="demo-pop" hidden>
  <div popover-panel role="dialog">
    <button type="button" popover-close aria-label="Close">×</button>
    <div popover-header><h2>Help</h2></div>
    <div popover-body>Account details live on this page.</div>
  </div>
</div>

<div wizard-shell name="onboard">
  <ol steps>
    <li step="active" data-step="welcome">Welcome</li>
    <li step="pending" data-step="plan">Plan</li>
  </ol>
  <main wizard-content>
    <section step-page="welcome">Welcome page</section>
    <section step-page="plan" hidden>Plan page</section>
    <div step-nav>
      <button type="button" wizard-prev>Back</button>
      <button type="button" wizard-next>Continue</button>
    </div>
  </main>
</div>

<button type="button" aria-describedby="demo-tip">Save</button>
<div tooltip-root id="demo-tip" hidden>
  <div tooltip-panel role="tooltip">Saves the current draft.</div>
</div>

<label for="fruit-input">Fruit</label>
<div combobox name="fruit">
  <input id="fruit-input" combobox-input type="text" />
  <button type="button" combobox-trigger aria-label="Show fruits"></button>
  <ul combobox-list hidden>
    <li combobox-option>Apple</li>
    <li combobox-option>Banana</li>
  </ul>
</div>

<div banner="full" banner-tone="warning" name="maintenance" banner-persist="session">
  <div banner-body>Scheduled maintenance tonight.</div>
  <button type="button" banner-close aria-label="Dismiss">×</button>
</div>

<div menu-root>
  <button type="button" menu-button aria-haspopup="menu" aria-controls="file-menu">File</button>
  <div menu id="file-menu">
    <button type="button" menuitem>New</button>
    <button type="button" menuitem>Open…</button>
    <div menu-separator></div>
    <div menu-label>Recent</div>
    <button type="button" menuitem="active">Report.pdf</button>
  </div>
</div>

<button type="button" switch aria-label="Notifications"></button>
```

### Notes

Juice keeps styling attribute-first. Interactive patterns still need accessible relationships and names.

**Navigation.** A mobile nav toggle should expose an accessible name and control a sidebar with `aria-controls`. The runtime watches `nav[type="bar"]`, `nav[type="links"]`, `nav[type="mobile"]` (the toggle), and `nav[type="sidebar"]`.

**Accordion.** Triggers should use `aria-expanded` and `aria-controls`. Panels should be labeled regions when they contain meaningful content. Chrome colors come from `--juice-accordion-*` roles bound by the active theme. Every shipped theme binds them, including the retro family. Group FAQ stacks in a card or panel surface (`[aqua-card]` / `[aqua-panel]` under Aquaflux, `[tide-card]` / `[tide-panel]` under Tide) so the accordion wrapper stays structural. Open and closed panels use the native `hidden` attribute. Do not use `content="active"` or `content="hidden"` for accordion state. Those clash with layout `[content]`. Optional `[motion="accordion"]` is height easing, not required for show and hide.

**Tabs.** Tabs live under a `[tabs]` root with `[tabs-list]`, `[tab]` triggers, and `[tab-panel]` panels. Orphan triggers and panels are ignored. Selection dual-writes Juice `[active]` and `aria-selected`. The runtime also wires `role="tablist"` / `tab` / `tabpanel`, roving tabindex, and labeled panels. Chrome colors come from `--juice-tabs-*` roles bound by the active theme. Every shipped theme binds them, and generated themes bind `--jx-tabs-*` aliases. Visible and hidden panels use the native `hidden` attribute. Do not use `content="active"` or `content="hidden"` for panel state.

**Modal.** Chrome colors come from `--juice-modal-*` roles bound by the active theme. Hide `[modal-overlay]` with the native `hidden` attribute. Openers use `aria-controls` pointing at the overlay id. The dialog runtime auto-enhances that markup (open/close, Escape, focus trap, exclusive).

**Drawer.** Chrome colors come from `--juice-drawer-*` roles bound by the active theme. Hide `[drawer-overlay]` with the native `hidden` attribute. Openers use `aria-controls` pointing at the overlay id. The dialog runtime auto-enhances that markup (open/close, Escape, focus trap, exclusive). Edge is `[drawer]` / `[drawer="left"|"right"]`. Optional width is `[drawer-size="sm|lg"]`.

**Toast.** Chrome colors come from `--juice-toast-*` roles bound by the active theme. `[toast-region]` is a non-modal stack (default `top-right`). Hide an individual `[toast]` with the native `hidden` attribute. Status is `[toast="success|error|info|warning"]`. The runtime auto-enhances that markup (`show` / `dismiss`, `[toast-close]`, `toast-duration`, live-region ARIA). It is not a dialog: no focus trap, no `aria-modal`, and stacking is allowed.

**Popover.** Chrome colors come from `--juice-popover-*` roles bound by the active theme. Hide `[popover-root]` with the native `hidden` attribute. Openers use `aria-controls` pointing at the root id. The runtime auto-enhances that markup (open/close, Escape, outside click, Tab trap, exclusive, one-axis flip). The panel is a non-modal dialog (`role="dialog"`, no `aria-modal`). Never use a bare `popover` attribute. The surface is `[popover-panel]`. Placement is `[popover-root]` / `[popover-root="bottom"]` (default), `"top"`, `"left"`, `"right"`.

**Wizard.** Chrome colors come from `--juice-wizard-*` roles bound by the active theme. Scope is `[wizard-shell]`. The runtime paints `[step="pending"|"active"|"completed"]`, shows one `[step-page]` with native `hidden`, and wires `[wizard-prev]` / `[wizard-next]` (or unmarked buttons in `[step-nav]`). Default navigation jumps to completed plus current. `wizard-shell="linear"` is prev/next only. `wizard-shell="free"` jumps to any step. Do not use `content="active"` or `content="hidden"` for page state.

**Tooltip.** Chrome colors come from `--juice-tooltip-*` roles bound by the active theme. Hide `[tooltip-root]` with the native `hidden` attribute. Triggers prefer `aria-describedby` pointing at the root id (`aria-controls` is also accepted). The runtime auto-enhances that markup (show/hide, Escape, exclusive, one-axis flip). There is no focus trap. Focus never moves into the tip. Never use a bare `tooltip` attribute or native `title`. The surface is `[tooltip-panel]`. Placement is `[tooltip-root]` / `[tooltip-root="top"]` (default), `"bottom"`, `"left"`, `"right"`.

**Combobox.** Chrome colors come from `--juice-combobox-*` roles bound by the active theme. Hide `[combobox-list]` with the native `hidden` attribute. Scope is `[combobox]` with `[combobox-input]`, optional `[combobox-trigger]`, `[combobox-list]`, and `[combobox-option]`. The runtime auto-enhances that markup (`open` / `close` / `toggle` / `select`, case-insensitive substring filter, Arrow/Home/End/Enter/Escape/Tab). `aria-expanded` is written on the input and trigger. `aria-activedescendant` tracks the active option. Select writes option text or `data-value`. Distinct from native `<select>`. Placement is CSS-only (absolute under the field).

**Banner.** Chrome colors come from `--juice-banner-*` roles bound by the active theme. `[banner]` is an inline alert / callout, not a toast stack and not a dialog. Hide with the native `hidden` attribute. Layout is `[banner]` / `[banner="full"]`. Optional status is `[banner-tone="info|success|warning|error"]`. The runtime auto-enhances that markup (`show` / `dismiss`, `[banner-close]`, optional `banner-persist="session|local"` with `name` / `id`). It is not a dialog: no focus trap, no `aria-modal`, no Escape steal.

**Menu.** Chrome colors come from `--juice-menu-*` roles bound by the active theme. `[menu-root]` wraps an opener plus `[menu]`. Hide the panel with the native `hidden` attribute. Optional `[menu-button]` is surface paint, not a CTA. Items are `[menuitem]` (value `"active"` is keyboard focus). Optional `[menu-separator]` / `[menu-label]`. APG Menu Button, not a popover, combobox, native `<select>`, or menubar. Placement is CSS-only (`[menu-root]` / `"bottom"` default, `"top"`, `"left"`, `"right"`). The runtime auto-enhances that markup (`open` / `close` / `toggle` / `select`, roving tabindex, Escape with popover).

**Switch.** Chrome colors come from `--juice-switch-*` roles bound by the active theme. `[switch]` is an APG switch on a button host (checkbox-backed hosts are a secondary story). The runtime auto-enhances that markup (`toggle` / `check` / `uncheck` / `setChecked`, `role="switch"`, binary `aria-checked`). Authors supply the accessible name. It is not a form checkbox as the only story, not menuitemcheckbox, and not a layered overlay: no focus trap, no Escape steal, no tri-state.

**Slider.** Chrome colors come from `--juice-slider-*` roles bound by the active theme. `[slider]` is the track host. `[slider-thumb]` is the APG slider (`role="slider"`). The runtime auto-enhances that markup (`setValue` / `getValue` / `increment` / `decrement`, arrows / Home / End / PageUp / PageDown, pointer jump and drag, `--juice-slider-ratio`). Authors supply the accessible name. It is horizontal and single-thumb: no vertical, no multi-thumb, no native `<input type="range">` restyle, no focus trap, and no Escape.

**Checkbox.** Chrome colors come from `--juice-checkbox-*` roles bound by the active theme. `[checkbox]` is a binary APG checkbox on a button host (a native `<input type="checkbox" checkbox>` is allowed). The runtime auto-enhances that markup (`toggle` / `check` / `uncheck` / `setChecked`, `role="checkbox"`, binary `aria-checked`). Authors supply the accessible name. It is not `[switch]`, not menuitemcheckbox, and not a layered overlay: no focus trap, no Escape steal, no tri-state. Checkbox and radio are two runtimes.

**Radio.** Chrome colors come from `--juice-radio-*` roles bound by the active theme. `[radio]` is an APG radio on a button host inside `[radiogroup]` (a native `<input type="radio" radio>` is allowed). `[radiogroup]` is layout only. The runtime auto-enhances exclusive selection (`select` / `getChecked`, roving tabindex, arrows plus Space/Enter/click). Orphans outside `[radiogroup]` are ignored. Authors supply the accessible name. It is not `[switch]`, not `[checkbox]`, and not a layered overlay: no focus trap and no Escape.

**Breadcrumb.** Chrome colors come from `--juice-breadcrumb-*` roles bound by the active theme. `[breadcrumb]` is an APG-inspired trail on `<nav>` or `<ol>`, with `[breadcrumb-item]` crumbs. Current page is `aria-current="page"` inside the trail. `surface` stays transparent unless crumbs sit on a bar. It is not site nav, `nav[type="breadcrumb"]`, tabs, a wizard step tracker, or pagination, and it is not a layered overlay. The light runtime auto-enhances `[breadcrumb]` (`sync` / `setCurrent`): an unlabeled navigation landmark is named `Breadcrumb`, and a single `aria-current="page"` is filled on the last crumb when none is set. It does not remove `href`, trap focus, steal Escape, or listen to history. `<ol breadcrumb>` stays a list. Not a router. No Sig Breadcrumb factory.

**Progress.** Chrome colors come from `--juice-progress-*` roles bound by the active theme. `[progress]` is an APG-inspired progressbar track on `<div progress>`, with `[progress-fill]` for the completed portion and optional `[progress-label]`. The runtime auto-enhances that markup (`setValue` / `getValue` / `setIndeterminate`, `role="progressbar"`, `aria-valuemin` / `aria-valuemax` / `aria-valuenow`, `--juice-progress-ratio`). `progress="indeterminate"` slides the fill and omits `aria-valuenow`. Authors supply the accessible name. `aria-valuetext` is kept when the author set it. It is not a slider, not a spinner, and not a native `<progress>` restyle. Authors do not style the HTML `<progress>` element alone. Inline status chrome: no overlay, no focus trap, no Escape. No Sig Progress factory.

**Pagination.** Chrome colors come from `--juice-pagination-*` roles bound by the active theme. `[pagination]` is an APG-inspired page set on `<nav pagination>` or `<ol pagination>`, with `[pagination-item]` cells, `[pagination-prev]` / `[pagination-next]`, and optional `[pagination-link]`, `[pagination-ellipsis]`, and `[pagination-status]`. Current page is `aria-current="page"` on the control. Disabled prev/next use `aria-disabled="true"`, native `disabled`, or `[disabled]`. The trail stays transparent. `surface` is the page control, not a bar. It is not site nav, `nav[type="pagination"]`, a breadcrumb, tabs, or a wizard step tracker, and it is not a layered overlay. The runtime auto-enhances `[pagination]` (`sync` / `setCurrent`): an unlabeled navigation landmark is named `Pagination`, a single `aria-current="page"` is kept (author current wins; otherwise the first page control), and prev/next are disabled at ends when page controls and optional ellipsis make that inferable. Author-owned disabled is kept. Arrow / Home / End move focus among enabled controls. It does not remove `href`, trap focus, steal Escape, or activate links on Enter/Space. `<ol pagination>` stays a list. Pagination is the nineteenth Emerging auto-enhance runtime. No Sig Pagination factory.

**Disclosure.** Chrome colors come from `--juice-disclosure-*` roles bound by the active theme. `[disclosure]` is a standalone APG disclosure: one `[disclosure-trigger]` and one `[disclosure-panel]`. Pair the panel with `aria-controls`, or place it as the next sibling of the trigger. Expanded state is `aria-expanded` on the trigger plus native `hidden` and `aria-hidden` on the panel. The runtime never writes layout `content=`. Orphans outside `[disclosure]` are ignored. Click toggles. Enter and Space toggle non-button triggers. Escape collapses the focused or last-opened disclosure and yields to an open modal, drawer, or popover. There is no exclusive group and no arrow roving. It is not an accordion (`[accordion]` / `[accordion-item]` stays multi-item and multi-open) and not a layered overlay. Disclosure is the twentieth Emerging auto-enhance runtime. Shipped in 0.9.2. No Sig Disclosure factory.

**Spinner.** Chrome colors come from `--juice-spinner-*` roles bound by the active theme. `[spinner]` is a standalone indeterminate busy indicator. The ring is `::before` on the host. Optional `[spinner-label]` is author text. CSS owns the spin (`juice-spinner-spin`). `prefers-reduced-motion` stops that animation and leaves the indicator. The runtime auto-enhances `[spinner]` (`sync` / `show` / `hide` / `isShown`): a shown host is `role="status"` and `aria-busy="true"`, and `hide` sets native `hidden` and clears both so a hidden spinner does not announce as busy. The runtime does not invent `aria-label` when there is no visible label, and it does not copy a label into a name. Authors supply the accessible name when there is no visible `[spinner-label]`. It is not a progress bar and not a disclosure. No value, no keyboard, no Escape, no focus trap, and no Sig Spinner factory. Inline status chrome: no overlay. Spinner is the twenty-first Emerging auto-enhance runtime. Shipped in 0.9.2.

**Select.** Chrome colors come from `--juice-select-*` roles bound by the active theme. `<select select>` is a styled native dropdown. Optional `[select-label]` is a visible label. The chevron is a `background-image`. `[multiple]` and `size` listboxes stay native selects. `[multiple]` and `size` other than `1` drop the chevron. The open list stays the platform popup. The runtime auto-enhances `<select select>` (`sync`): a visible associated label, wrapping label, or `[select-label]` names the control when the author has not set `aria-label` or `aria-labelledby`. A separate label is referenced with `aria-labelledby`. A wrapping label is copied into `aria-label` as its visible text excluding the select, so the selected option is not part of the name. Hidden or empty labels are skipped. No name is invented when nothing visible is there. Change events and the keyboard stay native. It is not a combobox. No keyboard rewrite, no Escape, no focus trap, and no Sig Select factory. Inline field chrome: no overlay, no listbox. Select is the twenty-second Emerging auto-enhance runtime. Shipped in 0.9.2.

**Input.** Chrome colors come from `--juice-input-*` roles bound by the active theme. `<input input>` is a styled native text field. Optional `[input-label]` is a visible label. Text-like controls only: missing type, empty type, text, email, password, search, tel, url, and number. Checkbox, radio, range, file, date, time, datetime-local, month, week, color, hidden, button, submit, reset, and image are ignored. The runtime auto-enhances `<input input>` (`sync`): a visible associated label, wrapping label, or `[input-label]` names the control when the author has not set `aria-label` or `aria-labelledby`. A separate label is referenced with `aria-labelledby`. A wrapping label is copied into `aria-label` as its visible text excluding the input's own value. Hidden or empty labels are skipped. No name is invented when nothing visible is there. Typing, change, and the keyboard stay native. It is not a combobox and not a select. Textarea and the field wrapper are not this runtime. No mask, no validation engine, no floating label, no keyboard rewrite, no Escape, no focus trap, and no Sig Input factory. Inline field chrome: no overlay. Input is the twenty-third Emerging auto-enhance runtime. Shipped in 0.9.2.

**Textarea.** Chrome colors come from `--juice-textarea-*` roles bound by the active theme. `<textarea textarea>` is a styled native multiline field. Optional `[textarea-label]` is a visible label. The runtime auto-enhances `<textarea textarea>` (`sync`): a visible associated label, wrapping label, or `[textarea-label]` names the control when the author has not set `aria-label` or `aria-labelledby`. A separate label is referenced with `aria-labelledby`. A wrapping label is copied into `aria-label` as its visible text excluding the textarea's own value. Hidden or empty labels are skipped. No name is invented when nothing visible is there. Typing, change, and the keyboard stay native. It is not an input, not a select, and not a combobox. The field wrapper is not this runtime. No auto-grow, no character count, no validation, no floating label, no keyboard rewrite, no Escape, no focus trap, and no Sig Textarea factory. Inline field chrome: no overlay. Textarea is the twenty-fourth Emerging auto-enhance runtime. Shipped in 0.9.2.

**Field.** Chrome colors come from `--juice-field-*` roles bound by the active theme. `[field]` is a wrapper around a control (`sync`). Optional `[field-label]`, `[field-help]`, and `[field-error]` are parts. `[invalid]` paints the wrapper border. The first input, textarea, or select inside the wrapper is described by visible `[field-help]` and `[field-error]` when the author has not set `aria-describedby`, and `[invalid]` sets `aria-invalid="true"` when the author has not set it. Hidden or empty help and error text are skipped, and missing ids are added only for parts the runtime references. Author `aria-describedby` and `aria-invalid` are kept. Clearing `[invalid]`, removing a part, or calling `destroy` removes only what the runtime wrote. `[field-label]` is chrome only. Naming stays with the input, textarea, and select runtimes. Typing, change, and the keyboard stay native. It is not a validation engine, not a floating label, and not a restyle of input, textarea, select, or combobox. No focus trap, no Escape, and no Sig Field factory. Inline wrapper chrome: no overlay. Field is the twenty-fifth Emerging auto-enhance runtime. Shipped in 0.9.2.

**Icon button.** Square `[icon-button]` on button chrome (`sync` / `toggle` / `getState`). `[toggle]` keeps `aria-pressed` and `[pressed]` in sync. Disabled hosts do not flip. A missing accessible name warns once in development. `title` does not count. No name is invented. It is not a switch and not a checkbox. No focus trap, no Escape, and no Sig IconButton factory. `bind` on current Sig accepts `icon-button`. The published npm 0.9.2 package does not export this runtime, so binding it there throws. Icon button is the twenty-sixth Emerging auto-enhance runtime and is on master, not in the published npm 0.9.2 release.

**Avatar.** Initials-or-photo mark (`[avatar]`, `sync` / `getState`). A broken, empty, or already-failed image sets `[fallback]` and hides the image. A later load clears both. An empty `src` with a real `srcset` waits. `getState()` is `{ loaded, fallback, hasImage }`. `destroy()` keeps the fallback. The runtime does not touch `alt`, labels, or initials. `[avatar-more]` stays plain text. It is not a badge and not `[skeleton="circle"]`. No keyboard, no Escape, and no Sig Avatar factory. `bind` on current Sig accepts `avatar`. The published npm 0.9.2 package does not export this runtime, so binding it there throws. Avatar is the twenty-seventh Emerging auto-enhance runtime and is on master, not in the published npm 0.9.2 release.

**Table.** Native `<table table>` grid (`createTable` / `sync` / `getState`). `th[sortable]` cycles ascending, descending, and none, sets `aria-sort`, and reorders each `tbody`. `column` is null when direction is none. A canceled `juice:sort` updates state without reordering. `cellIndex` is not a visual column. No Sig Table factory. `bind` on current Sig accepts `table`. The published npm 0.9.2 package does not export this runtime, so binding it there throws. Table is the twenty-eighth Emerging auto-enhance runtime and is on master, not in the published npm 0.9.2 release.

**Pressable.** Transient press on `[pressable]` (`createPressable` / `sync` / `getState`). Primary pointerdown sets `[pressed]` until pointerup, pointercancel, pointerleave, a move outside the host, lostpointercapture, or blur. Enter and Space do the same while held, including on a native button. Enter is not `preventDefault`'d, so a native click still fires. Space is `preventDefault`'d on a custom button-like host (`role="button"`, and `switch`, `checkbox`, `radio`, `menuitem`, `menuitemcheckbox`, `menuitemradio`, `option`, `tab`, `treeitem`) that is not a native control which already owns Space (`button`, any `input`, `textarea`, `select`, `summary`, or contenteditable). A move past the slop (default 10px, `[pressable-slop]` or `moveSlop`) or a scroll on the host or an ancestor cancels the press and the long-press timer. `[pressable-longpress]` arms `juice:longpress` (default 500ms, a numeric value or `longPressDelay`). If that event is not canceled, the following click is suppressed once. Disabled hosts (`:disabled`, `[disabled]`, `[aria-disabled="true"]`) do not press. `[icon-button][toggle]` and any host with `aria-pressed` keep their latched `[pressed]`; this runtime does not write that attribute there. `getState()` is `{ pressed, longPressed }`. It is not a toggle and not an icon button. Reduced motion stays in CSS. No Sig Pressable factory. `bind` does not name pressable or touchable-row yet. Pressable is the twenty-ninth Emerging auto-enhance runtime and is on master, not in the published npm 0.9.2 release. See [Pressable](../../docs/juice/juice-pressable.md).

**Touchable row.** 44px row on `[touchable-row]` (`createTouchableRow` / `sync` / `getState`). Hosts are `a`, `button`, `li`, and `div`. `dense` tightens padding and gap and keeps the 44px minimum. `chevron` draws the disclosure mark with `::after`. `undivided` drops the hairline on that boundary. `[touchable-row~="select"]` toggles `[selected]` plus `aria-selected`, or `aria-current` on a link or `role="link"`. Sibling rows stay selected. `[touchable-row~="activate"]` and `[pressable]` add `role="button"` and `tabindex="0"` on a non-native host when the author has not set them. Enter and Space on an `li` or `div` dispatch one click. Enter is not `preventDefault`'d. Space is, on those hosts, so the page does not scroll. Native `a` and `button` keep the platform click. A trailing button, switch, or icon button does not activate the row. A `[pressable-longpress]` that is not canceled suppresses the click, so the row does not select. Canceling `juice:longpress` still selects. `getState()` is `{ selected, disabled }`. Disabled hosts are ignored. There is no motion role. No Sig TouchableRow factory. `bind` does not name pressable or touchable-row yet. Touchable row is the thirtieth Emerging auto-enhance runtime and is on master, not in the published npm 0.9.2 release. See [Touchable row](../../docs/juice/juice-touchable-row.md).

### CSS-only chrome

These are not runtimes. They do not auto-enhance, they do not dispatch `juice:change`, and they are not part of the thirty.

**Skeleton.** `[skeleton]` is a loading placeholder (boolean and `skeleton="rect"` are the rectangle, `skeleton="text"` is a line, `skeleton="circle"` is a circle). `[lines="1"` through `"8"]` or stacked element children supply the lines. A `width` on the last child shortens it. `[scale="sm"|"lg"]` steps the shape. `[static]` and `prefers-reduced-motion` remove the sheen and keep the base. Roles are `--juice-skeleton-*` on core. Color is restated on `[theme]` (inherited ink mixed into the muted surface). The highlight is a translucent white sheen. Tune `--juice-skeleton-highlight` on a pale surface. Shipped themes are not required to bind the roles. Copy stays in the accessibility tree and does not paint. Authors own `aria-busy` on the loading region. On master, not in the published npm 0.9.2 release. See [Skeleton](../../docs/juice/juice-skeleton.md).

**List.** `[list]` on `ul`, `ol`, or `div` stacks rows (`:where(ul, ol, div)[list]`, so `<input list>` is left alone). `[divided]` is a hairline between direct children. `[dense]` tightens row padding and the slot margin and does not change the stack gap. `[list-item]` holds `[list-leading]`, `[list-content]`, `[list-secondary]`, and `[list-trailing]`. `[leading]` stays letter-spacing. An `a` or `button` row hovers, presses, and takes a 2px `currentColor` `:focus-visible` outline, offset 2px. `[selected]` and `aria-current` other than `"false"` share the selected wash. Disabled interactive rows are `opacity: 0.5`. `[selected]` is visual only. Color roles are `--juice-list-*` mixes of `currentColor`, restated on `[theme]`. Layout roles stay on `:root`. Shipped themes are not required to bind them. Background and color use `--juice-motion-duration-fast` and `--juice-motion-ease-standard`, and `prefers-reduced-motion` sets `transition: none`. On master, not in the published npm 0.9.2 release. See [List](../../docs/juice/juice-list.md).

**Badge.** `[badge]` is a pill (`inline-flex`, radius `999px`, `0.8125rem` at weight 600). `[badge="square"]` uses radius `0.375rem`. `[badge="ribbon"]` is absolutely positioned (`top: -0.75rem`, centered). There is no `[scale]`. Color roles are `--juice-badge-bg` (currentColor at 1%), `--juice-badge-ink` (`currentColor`), and `--juice-badge-border` (currentColor at 24%), on `:root` and again on `[theme]`. Layout roles stay on `:root`. Shipped themes are not required to bind them. Outside `[cta]`, KiwiPress still paints the default, `[warm]`, ribbon, and `[wizard-header] [brand] [badge]`. `[card="pricing"]` is the positioned parent for a ribbon. `[dev-hero-header] > [badge]` switches that child to `inline-block`. The base layout shipped in npm 0.9.2. The roles are on master and are not in that cut. See [Badge](../../docs/juice/juice-badge.md).

**Safe area.** `[safe-area]` pads a host clear of the notch and the home indicator. Boolean `[safe-area]` and any value other than `top`, `bottom`, `x`, or `y` pad all four edges. `x` is left and right. `y` is top and bottom. Both are physical. Each edge is `max(var(--juice-safe-area-pad), env(safe-area-inset-*, 0px))`. `--juice-safe-area-pad` is `1rem` on `:root` only and is not restated on `[theme]`. Shipped themes are not required to bind it. The viewport meta tag needs `viewport-fit=cover`. There is no `[safe-area-margin]`. On master, not in the published npm 0.9.2 release. See [Safe area](../../docs/juice/juice-safe-area.md).

## Layout

Layout primitives are `stack`, `row`, `grid`, `gap`, and `span`. The [quick start](#quick-start) markup uses `stack`, `gap`, `padding`, `font`, `fontColor`, `bgColor`, and `hover`. See [Layout](../../docs/juice/juice-layout.md).

## Responsive behavior

Built-in breakpoints, `row` collapse, and scaled spacing are documented in [Responsive reference](../../docs/juice/juice-responsive-reference.md).

## Surfaces

Beta-stable: `surfaceTone="soft|strong|muted"`, `borderStrength="soft|bold"`, `blur="sm|md"`, `shadowTone="cool|warm"`, `overlay="frost|tint"`, and `variant="monochromatic|glass|tinted"`. Themes bind `--juice-surface-*`, `--juice-border-strength-*`, `--juice-shadow-tone-*`, and `--juice-overlay-*` roles. Variant recipes compose those same roles. Standalone blur uses fixed `6px` / `16px` lengths. See [Surfaces](../../docs/juice/juice-surfaces.md).

## Motion

Motion is Beta. Use the `motion` attribute for animations (for example `motion="fade.in"`, `motion="spin::fast"`). See [Animations](../../docs/juice/juice-animations.md).

## Package surface

The production package surface is intentionally small. The stable consumer-facing entrypoints are:

- `@citrusworx/juiceui` (`.`)
- `@citrusworx/juiceui/styles` (`./styles`, core CSS only)
- `@citrusworx/juiceui/styles/themes/<id>` (`./styles/themes/<id>`, per-theme CSS)
- the built artifacts in `dist/`

`package.json` also exports `./themes/<id>.css`. That path is the same file as `dist/themes/<id>.css`.

### Built files

If you are hosting Juice assets yourself, the main built files are:

- `dist/index.css` (core)
- `dist/themes/aquaflux.css`, `dist/themes/kiwipress.css`, `dist/themes/citrusmint.css`, `dist/themes/tide.css`, `dist/themes/retro-afterburn.css`, `dist/themes/retro-arcade-glow.css`, `dist/themes/retro-boardwalk.css`, `dist/themes/retro-denim-dial.css`, `dist/themes/retro-forest-radio.css`, `dist/themes/retro-orchard-club.css`, `dist/themes/retro-poolside-pop.css`, `dist/themes/retro-signal-garden.css`, `dist/themes/retro-sunset-motel.css`, `dist/themes/retro-violet-parlor.css`
- `dist/index.js`

Load core plus at least one theme CSS file when using `theme="..."` on the root element.

There is no first-party Juice CDN. Those `dist/` files are on npm, so jsDelivr and unpkg serve them (verified for `@citrusworx/juiceui@0.9.2`):

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@citrusworx/juiceui@0.9.2/dist/index.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@citrusworx/juiceui@0.9.2/dist/themes/kiwipress.css" />
<script type="module" src="https://cdn.jsdelivr.net/npm/@citrusworx/juiceui@0.9.2/dist/index.js"></script>
```

The JS module is optional. Pin a version. You can also copy the same files out of `node_modules/@citrusworx/juiceui/dist/` next to a plain HTML page. unpkg uses the same paths under `https://unpkg.com/@citrusworx/juiceui@0.9.2/`.

### What the build contains

- compiled CSS output at `dist/index.css`
- compiled JS output at `dist/index.js`
- color tokens and swatches
- Google and Adobe font selectors
- attribute selectors for color, spacing, width, height, gradients, shadows, and icons
- layout primitives for `stack`, `row`, `grid`, `gap`, and `span`
- FontAwesome Free icon integration across the solid, regular, and brands sets
- CSS-only `[skeleton]`, `[list]`, `[badge]` (base layout in 0.9.2; `--juice-badge-*` roles on master), and `[safe-area]`, described above
- `[avatar]`, `[table]`, `[pressable]`, and `[touchable-row]` runtimes, on master, not in npm 0.9.2

<details>
<summary>Internal workspace assets</summary>

The Juice workspace also contains internal-only material that is not part of the published runtime contract:

- `src/native/` playground and experiments
- `src/templates/` HTML examples
- `src/tools/` compiler helpers
- `.mockups/` and `test-results/`
- local build tooling like `gulp.ts`, `vite.config.ts`, and `juice.config.yaml`

Those are useful for monorepo development. They are not part of the public API of `@citrusworx/juiceui`.

</details>

## Migration

`@citrusworx/juiceui/styles` is core only. Older packages put theme identity in that entry. That was a breaking change. Import a theme stylesheet explicitly, then set `theme` on the root, as in [Quick start](#quick-start). The split shipped in 0.4.0.

## Browser support

Juice currently targets modern evergreen browsers:

- the last 2 Chrome versions
- the last 2 Edge versions
- the last 2 Firefox versions
- the last 2 Safari major versions
- iOS Safari `16.4+`

The CSS build runs through `autoprefixer` against that package-level browserslist target, so supported-browser behavior is part of the build contract rather than an assumption.

## Asset policy

Juice ships a large compiled stylesheet plus the icon assets it references.

- `dist/index.css` is the main published stylesheet artifact
- `dist/icons/` is intentionally published and contains the icon SVG payload used by the stylesheet
- texture SVGs are inlined into the compiled CSS during build, so they do not ship as separate runtime files

Current release policy:

- keep `dist/index.css` under the current artifact budget
- keep `dist/icons/` under a separate icon payload budget
- avoid adding new runtime asset directories unless they are part of the published package contract

## Optional config

Juice also includes an optional config surface at `juice.config.yaml`.

This is intended for describing project-level branding concerns like:

- base colors and swatches
- typography roles
- experimental integration options

Juice can also generate full theme artifacts from config.

Library-owned themes can still come from `src/themes/<id>/<id>.config.yaml`.
The generator writes those derived theme contracts into `src/.generated/themes/<id>/` and the build automatically compiles them into `dist/themes/<id>.css`.

App-owned themes can be generated from an app config and committed or imported locally:

```bash
yarn workspace @citrusworx/juiceui generate:themes --config ../../apps/blackwatersound/front/juice.theme.yaml --css-out ../../apps/blackwatersound/front/src/generated/blackwatersound-theme.css
```

That lets an app keep its brand config while still relying on Juice for spacing, layout, surfaces, and responsive structure.

Config is not required to use Juice. The most stable current entrypoint is still the compiled stylesheet plus the existing attribute system.

Generate or discover themes directly with:

```bash
yarn workspace @citrusworx/juiceui generate:themes
```

## Build

```bash
yarn workspace @citrusworx/juiceui build
```

The build runs:

- `gulp.ts` to compile `src/juice.scss` into `dist/index.css`
- `vite` to build the JS entrypoint into `dist/index.js`

## Release

Before publishing a new Juice release, run:

```bash
yarn workspace @citrusworx/juiceui verify
```

That is the minimum publish gate for Juice right now. It rebuilds the package and reruns the package/runtime test suite so the published artifacts, accessibility runtime behavior, and package contract are all checked together.

Release notes and versioning should continue to flow through Changesets. The package changelog is consumer-facing and should describe behavior, package contract changes, and dependency updates in plain language instead of internal-only notes.

## Learn more

Internal project docs live in `docs/juice/`. Start with the course. The pages under it are the lookup set.

### Course

- [Design systems through Juice](../../docs/juice/course/README.md). Do this first.
- [See it in 10 minutes](../../docs/juice/course/00-first-look.md)

### Using Juice

- [Docs index](../../docs/juice/README.md)
- [Getting started](../../docs/juice/juice-getting-started.md)
- [Attributes](../../docs/juice/juice-attributes.md)
- [Layout](../../docs/juice/juice-layout.md)
- [Styles](../../docs/juice/juice-styles.md)
- [Responsive reference](../../docs/juice/juice-responsive-reference.md)
- [Surfaces](../../docs/juice/juice-surfaces.md)
- [Animations](../../docs/juice/juice-animations.md)

### Themes

- [Theme authoring](../../docs/juice/juice-theme-authoring.md)

### Runtimes

- [Runtime behavior](../../docs/juice/juice-runtime-behavior.md#juicechange) (`juice:change` and `getState`)
- [Sig.js + Juice](../../docs/sigjs/sig-juice-integration.md#runtime-binding)
- [Navigation](../../docs/juice/juice-navigation-runtime.md)
- [Accordion](../../docs/juice/juice-accordion-runtime.md)
- [Tabs](../../docs/juice/juice-tabs-runtime.md)
- [Modal](../../docs/juice/juice-modal-runtime.md)
- [Drawer](../../docs/juice/juice-drawer-runtime.md)
- [Toast](../../docs/juice/juice-toast-runtime.md)
- [Popover](../../docs/juice/juice-popover-runtime.md)
- [Wizard](../../docs/juice/juice-wizard-runtime.md)
- [Tooltip](../../docs/juice/juice-tooltip-runtime.md)
- [Combobox](../../docs/juice/juice-combobox-runtime.md)
- [Banner](../../docs/juice/juice-banner-runtime.md)
- [Menu](../../docs/juice/juice-menu-runtime.md)
- [Switch](../../docs/juice/juice-switch-runtime.md)
- [Slider](../../docs/juice/juice-slider-runtime.md)
- [Checkbox](../../docs/juice/juice-checkbox-runtime.md)
- [Radio](../../docs/juice/juice-radio-runtime.md)
- [Breadcrumb](../../docs/juice/juice-breadcrumb-runtime.md)
- [Progress](../../docs/juice/juice-progress-runtime.md)
- [Pagination](../../docs/juice/juice-pagination-runtime.md)
- [Disclosure](../../docs/juice/juice-disclosure-runtime.md)
- [Spinner](../../docs/juice/juice-spinner-runtime.md)
- [Select](../../docs/juice/juice-select-runtime.md)
- [Input](../../docs/juice/juice-input-runtime.md)
- [Textarea](../../docs/juice/juice-textarea-runtime.md)
- [Field](../../docs/juice/juice-field-runtime.md)
- [Icon button](../../docs/juice/juice-icon-button-runtime.md)
- [Avatar](../../docs/juice/juice-avatar.md)
- [Table](../../docs/juice/juice-table.md)

### CSS-only

- [Skeleton](../../docs/juice/juice-skeleton.md)
- [List](../../docs/juice/juice-list.md)
- [Badge](../../docs/juice/juice-badge.md)
- [Safe area](../../docs/juice/juice-safe-area.md)
