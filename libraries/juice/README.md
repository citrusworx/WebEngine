# @citrusworx/juiceui

Juice is an attribute-driven styling library for CitrusWorx apps. It packages the compiled Juice stylesheet and a small JS entrypoint so applications can import shared tokens and styles from one place.

## Published Surface

The production package surface is intentionally small:

- `@citrusworx/juiceui`
- `@citrusworx/juiceui/styles` (core CSS only)
- `@citrusworx/juiceui/styles/themes/<id>` (per-theme CSS)
- the built artifacts in `dist/`

These are the stable consumer-facing entrypoints for the package.

## Internal Workspace Assets

The Juice workspace also contains internal-only material that is not part of the published runtime contract:

- `src/native/` playground and experiments
- `src/templates/` HTML examples
- `src/tools/` compiler helpers
- `.mockups/` and `test-results/`
- local build tooling like `gulp.ts`, `vite.config.ts`, and `juice.config.yaml`

Those are useful for monorepo development, but they are not part of the public API of `@citrusworx/juiceui`.

## Install

```bash
yarn add @citrusworx/juiceui
```

## Use the stylesheet

Core utilities and components (no theme identity):

```ts
import "@citrusworx/juiceui/styles";
```

## Themes (Beta)

**Breaking change:** `@citrusworx/juiceui/styles` is **core only**. Import a theme stylesheet explicitly:

```ts
import "@citrusworx/juiceui/styles";
import "@citrusworx/juiceui/styles/themes/aquaflux";
```

```html
<body theme="aquaflux">
  <!-- or theme="kiwipress" | theme="citrusmint" | theme="tide" -->
</body>
```

Built files: `dist/index.css` (core), `dist/themes/<id>.css` (theme). Each theme is authored as `<themeId>.scss` + `<themeId>.yaml` under `src/themes/<themeId>/`. See [docs/juice/juice-theme-authoring.md](../../docs/juice/juice-theme-authoring.md).

## Responsive behavior

Built-in breakpoints, `row` collapse, and scaled spacing are documented in [docs/juice/juice-responsive-reference.md](../../docs/juice/juice-responsive-reference.md).

## Surfaces

Beta-stable: `surfaceTone="soft|strong|muted"`, `borderStrength="soft|bold"`, `blur="sm|md"`, `shadowTone="cool|warm"`, `overlay="frost|tint"`, and `variant="monochromatic|glass|tinted"`. Themes bind `--juice-surface-*`, `--juice-border-strength-*`, `--juice-shadow-tone-*`, and `--juice-overlay-*` roles. Variant recipes compose those same roles. Standalone blur uses fixed `6px` / `16px` lengths. See [docs/juice/juice-surfaces.md](../../docs/juice/juice-surfaces.md).

## Motion (Beta)

Use the `motion` attribute for animations (for example `motion="fade.in"`, `motion="spin::fast"`). See [docs/juice/juice-animations.md](../../docs/juice/juice-animations.md).

## Use the JS API

```ts
import {
  Accordion,
  createAccordion,
  initAccordion,
  startAccordionRuntime,
  stopAccordionRuntime,
  createTabs,
  initTabs,
  startTabsRuntime,
  stopTabsRuntime,
  createModal,
  initModal,
  startModalRuntime,
  stopModalRuntime,
  createDrawer,
  initDrawer,
  startDrawerRuntime,
  stopDrawerRuntime,
  createToast,
  initToast,
  startToastRuntime,
  stopToastRuntime,
  createPopover,
  initPopover,
  startPopoverRuntime,
  stopPopoverRuntime,
  createWizard,
  initWizard,
  startWizardRuntime,
  stopWizardRuntime,
  createTooltip,
  initTooltip,
  startTooltipRuntime,
  stopTooltipRuntime,
  createCombobox,
  initCombobox,
  startComboboxRuntime,
  stopComboboxRuntime,
  createBanner,
  initBanner,
  startBannerRuntime,
  stopBannerRuntime,
  createNavigation,
  initNavigation,
  startNavigationRuntime,
  stopNavigationRuntime,
  tokens
} from "@citrusworx/juiceui";
```

The top-level JS entrypoint is intentionally small. Those named exports are the stable runtime API Juice currently promises.

Importing that entry auto-starts the navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, and banner runtimes in the browser. Valid `[accordion]`, `[tabs]`, `[modal-overlay]`, `[drawer-overlay]`, `[toast-region]`, `[popover-root]`, `[wizard-shell]`, `[tooltip-root]`, `[combobox]`, and `[banner]` markup work without app init. See [docs/juice/juice-accordion-runtime.md](../../docs/juice/juice-accordion-runtime.md), [docs/juice/juice-tabs-runtime.md](../../docs/juice/juice-tabs-runtime.md), [docs/juice/juice-modal-runtime.md](../../docs/juice/juice-modal-runtime.md), [docs/juice/juice-drawer-runtime.md](../../docs/juice/juice-drawer-runtime.md), [docs/juice/juice-toast-runtime.md](../../docs/juice/juice-toast-runtime.md), [docs/juice/juice-popover-runtime.md](../../docs/juice/juice-popover-runtime.md), [docs/juice/juice-wizard-runtime.md](../../docs/juice/juice-wizard-runtime.md), [docs/juice/juice-tooltip-runtime.md](../../docs/juice/juice-tooltip-runtime.md), [docs/juice/juice-combobox-runtime.md](../../docs/juice/juice-combobox-runtime.md), and [docs/juice/juice-banner-runtime.md](../../docs/juice/juice-banner-runtime.md). Banner is an inline alert / callout (`show` / `dismiss`, `[banner-close]`), not a toast stack.

## Use the built files directly

If you are hosting Juice assets yourself, the main built files are:

- `dist/index.css` (core)
- `dist/themes/aquaflux.css`, `dist/themes/kiwipress.css`, `dist/themes/citrusmint.css`, `dist/themes/tide.css`
- `dist/index.js`

Load core plus at least one theme CSS file when using `theme="..."` on the root element.

## Example

```html
<section stack gap="1" padding="2rem">
  <h1 font="bebas-neue" fontColor="obsidian-900">Juice</h1>
  <p font="lato" fontColor="gray-700">
    Attribute-driven styling from shared design tokens.
  </p>
  <button bgColor="green-500" hover="green-600" fontColor="white-100" padding="1rem">
    Get started
  </button>
</section>
```

## What is implemented today

- compiled CSS output at `dist/index.css`
- compiled JS output at `dist/index.js`
- color tokens and swatches
- Google and Adobe font selectors
- attribute selectors for color, spacing, width, height, gradients, shadows, and icons
- layout primitives for `stack`, `row`, `grid`, `gap`, and `span`
- FontAwesome Free icon integration across the solid, regular, and brands sets

## Accessibility

Juice keeps styling attribute-first, but interactive patterns still need accessible relationships and names.

- mobile nav toggles should expose an accessible name and control a sidebar with `aria-controls`
- accordion triggers should use `aria-expanded` and `aria-controls`
- accordion panels should be labeled regions when they contain meaningful content
- accordion chrome colors come from `--juice-accordion-*` roles bound by the active theme (Aquaflux, KiwiPress, Citrusmint, and Tide)
- group FAQ stacks in a card/panel surface (`[aqua-card]` / `[aqua-panel]` under Aquaflux, `[tide-card]` / `[tide-panel]` under Tide) so the accordion wrapper stays structural
- open/closed accordion panels use the native `hidden` attribute; do not use `content="active"` or `content="hidden"` for accordion state (those clash with layout `[content]`)
- optional `[motion="accordion"]` is height easing, not required for show/hide
- tabs live under a `[tabs]` root with `[tabs-list]`, `[tab]` triggers, and `[tab-panel]` panels; orphan triggers and panels are ignored
- tab selection dual-writes Juice `[active]` and `aria-selected`; the runtime also wires `role="tablist"` / `tab` / `tabpanel`, roving tabindex, and labeled panels
- tab chrome colors come from `--juice-tabs-*` roles bound by the active theme (Aquaflux, KiwiPress, Citrusmint, Tide, and generated `--jx-tabs-*` aliases)
- visible vs hidden tab panels use the native `hidden` attribute; do not use `content="active"` or `content="hidden"` for panel state
- modal chrome colors come from `--juice-modal-*` roles bound by the active theme; hide `[modal-overlay]` with the native `hidden` attribute. Openers use `aria-controls` pointing at the overlay id. The dialog runtime auto-enhances that markup (open/close, Escape, focus trap, exclusive). See [docs/juice/juice-modal-runtime.md](../../docs/juice/juice-modal-runtime.md).
- toast chrome colors come from `--juice-toast-*` roles bound by the active theme. `[toast-region]` is a non-modal stack (default `top-right`); hide an individual `[toast]` with the native `hidden` attribute. Status is `[toast="success|error|info|warning"]`. The runtime auto-enhances that markup (`show` / `dismiss`, `[toast-close]`, `toast-duration`, live-region ARIA). It is not a dialog: no focus trap, no `aria-modal`, and stacking is allowed. See [docs/juice/juice-toast-runtime.md](../../docs/juice/juice-toast-runtime.md).
- drawer chrome colors come from `--juice-drawer-*` roles bound by the active theme; hide `[drawer-overlay]` with the native `hidden` attribute. Openers use `aria-controls` pointing at the overlay id. The dialog runtime auto-enhances that markup (open/close, Escape, focus trap, exclusive). Edge is `[drawer]` / `[drawer="left"|"right"]`; optional width is `[drawer-size="sm|lg"]`. See [docs/juice/juice-drawer-runtime.md](../../docs/juice/juice-drawer-runtime.md).
- popover chrome colors come from `--juice-popover-*` roles bound by the active theme; hide `[popover-root]` with the native `hidden` attribute. Openers use `aria-controls` pointing at the root id. The runtime auto-enhances that markup (open/close, Escape, outside click, Tab trap, exclusive, one-axis flip). The panel is a non-modal dialog (`role="dialog"`, no `aria-modal`). Never use a bare `popover` attribute — the surface is `[popover-panel]`. Placement is `[popover-root]` / `[popover-root="bottom"]` (default), `"top"`, `"left"`, `"right"`. See [docs/juice/juice-popover-runtime.md](../../docs/juice/juice-popover-runtime.md).
- wizard chrome colors come from `--juice-wizard-*` roles bound by the active theme. Scope is `[wizard-shell]`. The runtime paints `[step="pending"|"active"|"completed"]`, shows one `[step-page]` with native `hidden`, and wires `[wizard-prev]` / `[wizard-next]` (or unmarked buttons in `[step-nav]`). Default navigation jumps to completed + current; `wizard-shell="linear"` is prev/next only; `wizard-shell="free"` jumps to any step. Do not use `content="active"` or `content="hidden"` for page state. See [docs/juice/juice-wizard-runtime.md](../../docs/juice/juice-wizard-runtime.md).
- tooltip chrome colors come from `--juice-tooltip-*` roles bound by the active theme; hide `[tooltip-root]` with the native `hidden` attribute. Triggers prefer `aria-describedby` pointing at the root id (`aria-controls` is also accepted). The runtime auto-enhances that markup (show/hide, Escape, exclusive, one-axis flip). There is no focus trap; focus never moves into the tip. Never use a bare `tooltip` attribute or native `title` — the surface is `[tooltip-panel]`. Placement is `[tooltip-root]` / `[tooltip-root="top"]` (default), `"bottom"`, `"left"`, `"right"`. See [docs/juice/juice-tooltip-runtime.md](../../docs/juice/juice-tooltip-runtime.md).
- combobox chrome colors come from `--juice-combobox-*` roles bound by the active theme; hide `[combobox-list]` with the native `hidden` attribute. Scope is `[combobox]` with `[combobox-input]`, optional `[combobox-trigger]`, `[combobox-list]`, and `[combobox-option]`. The runtime auto-enhances that markup (`open` / `close` / `toggle` / `select`, case-insensitive substring filter, Arrow/Home/End/Enter/Escape/Tab). `aria-expanded` is written on the input and trigger; `aria-activedescendant` tracks the active option. Select writes option text or `data-value`. Distinct from native `<select>`. Placement is CSS-only (absolute under the field). See [docs/juice/juice-combobox-runtime.md](../../docs/juice/juice-combobox-runtime.md).
- banner chrome colors come from `--juice-banner-*` roles bound by the active theme. `[banner]` is an inline alert / callout, not a toast stack and not a dialog. Hide with the native `hidden` attribute. Layout is `[banner]` / `[banner="full"]`; optional status is `[banner-tone="info|success|warning|error"]`. The runtime auto-enhances that markup (`show` / `dismiss`, `[banner-close]`, optional `banner-persist="session|local"` with `name` / `id`). It is not a dialog: no focus trap, no `aria-modal`, no Escape steal. See [docs/juice/juice-banner-runtime.md](../../docs/juice/juice-banner-runtime.md).

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
```

## Browser Support

Juice currently targets modern evergreen browsers:

- the last 2 Chrome versions
- the last 2 Edge versions
- the last 2 Firefox versions
- the last 2 Safari major versions
- iOS Safari `16.4+`

The CSS build runs through `autoprefixer` against that package-level browserslist target, so supported-browser behavior is part of the build contract rather than an assumption.

## Asset Policy

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

Generate/discover themes directly with:

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

## Docs

Internal project docs live in `docs/juice/`.
