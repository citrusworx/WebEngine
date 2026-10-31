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

The top-level JS entry is small. Thirty-two runtimes stay Emerging.

Navigation through field (twenty-five) shipped in `@citrusworx/juiceui@0.9.2`. Icon button, avatar, and table shipped in 0.9.3. Pressable and touchable row shipped in 0.9.4. Keyboard avoider shipped in 0.9.5. Sheet is the thirty-second, on master, and not in that npm cut.

The full index, including how to choose between similar components, is [Runtime behavior](../../docs/juice/juice-runtime-behavior.md#components).

### Overlays

| Component | Markup | What it is | Docs |
| --- | --- | --- | --- |
| Modal | `[modal-overlay]` | Dialog. Open and close, Escape, focus trap, one open at a time. | [Modal](../../docs/juice/juice-modal-runtime.md) |
| Drawer | `[drawer-overlay]` | Edge dialog (`left` or `right`, optional `drawer-size` of `sm` or `lg`). Escape, focus trap, exclusive. | [Drawer](../../docs/juice/juice-drawer-runtime.md) |
| Sheet | `[sheet-overlay]` | Bottom dialog. Detents `peek`, `half`, `full`. The thirty-second runtime. On master, not in npm 0.9.5. Not a `JuiceRuntimeName`. | [Sheet](../../docs/juice/juice-sheet-runtime.md) |
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
| Icon button | `[icon-button]` | Square control on button chrome (`sync` / `toggle` / `getState`). Not a switch and not a checkbox. The twenty-sixth Emerging runtime. Shipped in 0.9.3. | [Icon button](../../docs/juice/juice-icon-button-runtime.md) |
| Pressable | `[pressable]` | Transient press (`sync` / `getState`). Sets `[pressed]` for the gesture. `[pressable-longpress]` opts into `juice:longpress`. Not a latched toggle. The twenty-ninth Emerging runtime. Shipped in 0.9.4. | [Pressable](../../docs/juice/juice-pressable.md) |
| Touchable row | `[touchable-row]` | 44px row (`sync` / `getState`). `[touchable-row~="select"]` toggles selection. Enter and Space activate an `li` or `div`. Not a single-select group. The thirtieth Emerging runtime. Shipped in 0.9.4. | [Touchable row](../../docs/juice/juice-touchable-row.md) |

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
| Avatar | `[avatar]` | Initials or photo (`sync` / `getState`). Not a badge and not `[skeleton="circle"]`. The twenty-seventh Emerging runtime. Shipped in 0.9.3. | [Avatar](../../docs/juice/juice-avatar.md) |
| Table | `<table table>` | Sortable grid. The twenty-eighth runtime. Shipped in 0.9.3. | [Table](../../docs/juice/juice-table.md) |

### Page chrome

| Component | Markup | What it is | Docs |
| --- | --- | --- | --- |
| Keyboard avoider | `[keyboard-avoider]` | Inset while the software keyboard is open. The thirty-first runtime. Shipped in 0.9.5. Not a `JuiceRuntimeName`. | [Keyboard avoider](../../docs/juice/juice-keyboard-avoider-runtime.md) |

### Auto-start

Importing `@citrusworx/juiceui` enhances the hooks in the tables above. Most apps need no `init` call.

The JS module is optional. Core CSS plus a theme is enough when the page does not use a runtime.

### Naming pattern

Every runtime exports the same four functions. `<Name>` is the component stem, such as `Modal` or `KeyboardAvoider`.

| Export | What it does |
| --- | --- |
| `create<Name>(options?)` | Builds a controller for markup in the document, or under `options.root`. |
| `init<Name>(options?)` | Calls `create<Name>` with the same options. |
| `start<Name>Runtime()` | Boots the document-level controller that enhances matching markup. A second call syncs and returns that controller. Returns `null` when there is no document. |
| `stop<Name>Runtime()` | Destroys that document-level controller. |

Modal shows the four export names. The other thirty-one use the same `create` / `init` / `start` / `stop` names. Controller methods differ by runtime.

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

Icon button, avatar, table, pressable, touchable row, keyboard avoider, and sheet export the same four names. Icon button, avatar, and table shipped in 0.9.3. Pressable and touchable row shipped in 0.9.4. Keyboard avoider shipped in 0.9.5. Sheet is on master and is not in that npm cut.

### `juice:change` and `getState`

Interactive runtimes dispatch a bubbling `juice:change` from the widget host when observable state changes. `detail` is `{ runtime, state }`. `getState()` reads that shape.

Select, input, and textarea publish through native `input` and `change`. They still expose `getState()`.

The contract covers all thirty-two runtimes. `juice:change` and `JUICE_CHANGE_EVENT` shipped in 0.9.3. Pressable and touchable row dispatch that contract from 0.9.4. Keyboard avoider dispatches it from 0.9.5. Sheet dispatches it on master and is not in the 0.9.5 npm cut.

`@citrusworx/sigjs/juice` `bind` names twenty-eight runtimes, through `table`, on master and in `@citrusworx/sigjs@0.7.2`.

- `icon-button`, `avatar`, and `table` are `JuiceRuntimeName` values.
- Pressable, touchable row, keyboard avoider, and sheet are not.
- `@citrusworx/sigjs@0.7.0` and `@citrusworx/sigjs@0.7.1` stop at twenty-five names, through `textarea`.
- Binding `icon-button`, `avatar`, or `table` against `@citrusworx/juiceui@0.9.1` or `@citrusworx/juiceui@0.9.2` throws. Those cuts do not export their start functions. The three exports shipped in 0.9.3.

Juice works without Sig. The optional adapter is `@citrusworx/sigjs/juice` only.

See [`juice:change`](../../docs/juice/juice-runtime-behavior.md#juicechange) and [Sig.js + Juice](../../docs/sigjs/sig-juice-integration.md#runtime-binding).

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

Open and closed state uses native `hidden`, not layout `content="active"` or `content="hidden"`.

Nav hooks are `nav[type="bar"]`, `nav[type="links"]`, `nav[type="mobile"]`, and `nav[type="sidebar"]`.

All 14 shipped themes bind `--juice-accordion-*` and `--juice-tabs-*`.

Attributes, keyboard behavior, and theme roles for each component are on the page linked from the tables above.

[Choosing between similar components](../../docs/juice/juice-runtime-behavior.md#choosing-between-similar-components).

### CSS-only chrome

These do not auto-enhance, do not dispatch `juice:change`, and are not part of the thirty-two runtimes.

| Chrome | Hook | Release | Docs |
| --- | --- | --- | --- |
| Skeleton | `[skeleton]` | Shipped in 0.9.3 | [Skeleton](../../docs/juice/juice-skeleton.md) |
| List | `[list]` | Shipped in 0.9.3 | [List](../../docs/juice/juice-list.md) |
| Badge | `[badge]` | Layout shipped in npm 0.9.2. `--juice-badge-*` roles shipped in 0.9.3 | [Badge](../../docs/juice/juice-badge.md) |
| Safe area | `[safe-area]` | Shipped in 0.9.3 | [Safe area](../../docs/juice/juice-safe-area.md) |

## Layout

Layout primitives are `stack`, `row`, `grid`, `gap`, and `span`. The [quick start](#quick-start) markup uses `stack`, `gap`, `padding`, `font`, `fontColor`, `bgColor`, and `hover`. See [Layout](../../docs/juice/juice-layout.md).

## Responsive behavior

Built-in breakpoints, `row` collapse, and scaled spacing are documented in [Responsive reference](../../docs/juice/juice-responsive-reference.md).

## Surfaces

Beta-stable: `surfaceTone="soft|strong|muted"`, `borderStrength="soft|bold"`, `blur="sm|md"`, `shadowTone="cool|warm"`, `overlay="frost|tint"`, and `variant="monochromatic|glass|tinted"`. Themes bind `--juice-surface-*`, `--juice-border-strength-*`, `--juice-shadow-tone-*`, and `--juice-overlay-*` roles.

Variant recipes compose those same roles. Standalone blur uses fixed `6px` / `16px` lengths.

See [Surfaces](../../docs/juice/juice-surfaces.md).

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
- `dist/themes/aquaflux.css`
- `dist/themes/kiwipress.css`
- `dist/themes/citrusmint.css`
- `dist/themes/tide.css`
- `dist/themes/retro-afterburn.css`
- `dist/themes/retro-arcade-glow.css`
- `dist/themes/retro-boardwalk.css`
- `dist/themes/retro-denim-dial.css`
- `dist/themes/retro-forest-radio.css`
- `dist/themes/retro-orchard-club.css`
- `dist/themes/retro-poolside-pop.css`
- `dist/themes/retro-signal-garden.css`
- `dist/themes/retro-sunset-motel.css`
- `dist/themes/retro-violet-parlor.css`
- `dist/index.js`

Load core plus at least one theme CSS file when using `theme="..."` on the root element.

There is no first-party Juice CDN. Those `dist/` files are on npm, so jsDelivr and unpkg serve them (verified for `@citrusworx/juiceui@0.9.5`):

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@citrusworx/juiceui@0.9.5/dist/index.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@citrusworx/juiceui@0.9.5/dist/themes/kiwipress.css" />
<script type="module" src="https://cdn.jsdelivr.net/npm/@citrusworx/juiceui@0.9.5/dist/index.js"></script>
```

The JS module is optional. Pin a version. You can also copy the same files out of `node_modules/@citrusworx/juiceui/dist/` next to a plain HTML page. unpkg uses the same paths under `https://unpkg.com/@citrusworx/juiceui@0.9.5/`.

### What the build contains

- compiled CSS output at `dist/index.css`
- compiled JS output at `dist/index.js`
- color tokens and swatches
- Google and Adobe font selectors
- attribute selectors for color, spacing, width, height, gradients, shadows, and icons
- layout primitives for `stack`, `row`, `grid`, `gap`, and `span`
- FontAwesome Free icon integration across the solid, regular, and brands sets
- CSS-only `[skeleton]`, `[list]`, `[badge]` (base layout in 0.9.2; `--juice-badge-*` roles in 0.9.3), and `[safe-area]` (shipped in 0.9.3), described above
- `[avatar]` and `[table]` runtimes shipped in 0.9.3. `[pressable]` and `[touchable-row]` shipped in 0.9.4

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
