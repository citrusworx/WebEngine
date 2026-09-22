# Getting Started With Juice

This is the best starting point if you want to use Juice the way the library works today.

## What Juice is

Juice is a CSS-first, attribute-driven styling system.

It gives you:

- layout primitives like `stack`, `row`, `grid`, and `gap`
- spacing and sizing in markup
- structural hooks like `card`, `panel`, `hero`, `cta`, and `badge`
- shared responsive behavior
- a theme contract that can be generated from config

Juice is not a behavior framework. Pair it with Sig.js or app code when the UI needs state and runtime interaction.

## Install

Add the published package with the CLI you already use:

```bash
npm install @citrusworx/juiceui
pnpm add @citrusworx/juiceui
yarn add @citrusworx/juiceui
bun add @citrusworx/juiceui
```

Monorepo contributors already have the workspace package linked — you do not add it again. Workspace scripts such as `yarn workspace @citrusworx/juiceui generate:themes` stay yarn because this repo is a Yarn workspace.

## Plain HTML / CDN (no bundler)

The published files live in `dist/` (`index.css`, `themes/<id>.css`, `index.js`). There is no first-party Juice CDN, but those files are on npm, so jsDelivr and unpkg serve them. Verified against `@citrusworx/juiceui@0.9.0`:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@citrusworx/juiceui@0.9.0/dist/index.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@citrusworx/juiceui@0.9.0/dist/themes/kiwipress.css" />

<body theme="kiwipress">
  <!-- markup -->
  <script type="module" src="https://cdn.jsdelivr.net/npm/@citrusworx/juiceui@0.9.0/dist/index.js"></script>
</body>
```

The JS `<script>` is optional. Loading it auto-enhances Emerging runtimes. Core CSS plus a theme is enough for CSS-first composition. Pin a version — do not rely on a floating `@latest` for production.

unpkg uses the same paths under `https://unpkg.com/@citrusworx/juiceui@0.9.0/`.

If you prefer not to hit a CDN, copy the same files from `node_modules/@citrusworx/juiceui/dist/` (or `libraries/juice/dist/` in this repo) next to your HTML. See the [course first look](./course/00-first-look.md) standalone path.

## Import the core stylesheet

```ts
import "@citrusworx/juiceui/styles";
```

That gives you the shared structural and attribute-driven styling layer.

## Add a theme

Juice core is intentionally separate from theme identity.

You should import either:

- a library theme (`aquaflux`, `kiwipress`, `citrusmint`, `tide`, `retro-afterburn`, `retro-arcade-glow`, `retro-boardwalk`, `retro-denim-dial`, `retro-forest-radio`, `retro-orchard-club`, `retro-poolside-pop`, `retro-signal-garden`, `retro-sunset-motel`, or `retro-violet-parlor`), or
- an app-generated theme

Example with a library theme:

```ts
import "@citrusworx/juiceui/styles";
import "@citrusworx/juiceui/styles/themes/tide";
```

```html
<body theme="tide"></body>
```

Example with an app-generated theme:

```ts
import "@citrusworx/juiceui/styles";
import "./generated/blackwatersound-theme.css";
```

```html
<body theme="blackwatersound"></body>
```

## The mental model

Use Juice with this split:

- Juice attributes control structure and composition
- theme CSS controls identity and defaults
- app CSS handles small brand-specific exceptions
- Sig.js or app code handles behavior

That split is healthier than trying to push every visual decision into either utilities or handwritten one-off CSS.

## First page example

```html
<main stack gap="2rem">
  <section hero surface="brand-stage" padding="2rem" stack gap="1rem">
    <p muted>Publishing</p>
    <h1>Attribute-first UI with app-owned identity</h1>
    <p>
      Juice keeps layout in markup. The theme defines type, color, and surface tone.
    </p>
  </section>

  <section grid gap="1rem">
    <article card padding="1.25rem" stack gap="0.75rem">
      <h2>Structure</h2>
      <p>Use `stack`, `row`, `grid`, `gap`, and spacing attributes first.</p>
    </article>

    <aside panel surface="brand-panel" padding="1.25rem" stack gap="0.75rem">
      <h2>Identity</h2>
      <p>Use the generated theme for typography, colors, and semantic defaults.</p>
    </aside>
  </section>
</main>
```

## App-owned themes

This is one of the most important current updates to Juice.

An app can keep its own theme config, for example:

```text
apps/blackwatersound/front/juice.theme.yaml
```

Then generate local artifacts:

```bash
yarn workspace @citrusworx/juiceui generate:themes \
  --config ../../apps/blackwatersound/front/juice.theme.yaml \
  --css-out ../../apps/blackwatersound/front/src/generated/blackwatersound-theme.css \
  --yaml-out ../../apps/blackwatersound/front/src/generated/blackwatersound-theme.yaml
```

This means:

- the app owns the brand contract
- Juice owns the generator
- Juice still provides the shared layout/styling system

## Theme config shape

The generator currently expects:

- `id`
- `name`
- `typography.body`
- `typography.heading`
- optional `typography.variants`
- `palette`
- optional `named_surfaces`

Typography variants now matter because an app can define additional role fonts beyond just body and heading.

Example roles:

- `body_semicondensed`
- `body_condensed`
- `display_inline`
- `display_rough`
- `display_shadow`
- `display_solid`

The generator emits CSS custom properties for those variants, which the app can then use in its own selectors.

## Hybrid usage

The current recommended pattern for real apps is hybrid:

- attribute-first markup for structure
- theme-generated CSS for identity
- small app selectors for product-specific polish

That is the model Blackwater Sound now demonstrates.

## Built-in runtime vs Sig.js

Importing `@citrusworx/juiceui` auto-starts browser runtimes for valid Juice markup:

- navigation
- accordion / disclosure
- tabs
- modal / dialog
- drawers
- toasts / snackbars
- popovers
- wizards / multi-step shells
- tooltips / hover-focus tips
- comboboxes / list autocomplete
- banners / inline alerts
- menus / menu buttons
- switches / APG toggles
- sliders / APG sliders
- checkboxes / APG checkboxes
- radios / APG radio groups
- breadcrumbs / light trails
- progress bars / APG progressbars
- pagination / page sets (on master; not in the 0.9.0 npm cut)

Those features should work without app init. See [Accordion Runtime](./juice-accordion-runtime.md), [Tabs Runtime](./juice-tabs-runtime.md), [Modal Runtime](./juice-modal-runtime.md), [Drawer Runtime](./juice-drawer-runtime.md), [Toast Runtime](./juice-toast-runtime.md), [Popover Runtime](./juice-popover-runtime.md), [Wizard Runtime](./juice-wizard-runtime.md), [Tooltip Runtime](./juice-tooltip-runtime.md), [Combobox Runtime](./juice-combobox-runtime.md), [Banner Runtime](./juice-banner-runtime.md), [Menu Runtime](./juice-menu-runtime.md), [Switch Runtime](./juice-switch-runtime.md), [Slider Runtime](./juice-slider-runtime.md), [Checkbox Runtime](./juice-checkbox-runtime.md), [Radio Runtime](./juice-radio-runtime.md), [Breadcrumb Runtime](./juice-breadcrumb-runtime.md), [Progress Runtime](./juice-progress-runtime.md), [Pagination Runtime](./juice-pagination-runtime.md), and [Navigation Runtime](./juice-navigation-runtime.md).

Use Sig.js for app-specific state:

- counters
- filters
- route-aware UI
- reactive updates after render

Juice and Sig.js fit well together because Juice owns styling plus a few built-in interactions, and Sig.js owns application behavior.

## What to use first

1. import `@citrusworx/juiceui/styles`
2. import a theme CSS file
3. set `theme="..."` at the app root
4. compose pages with `stack`, `row`, `grid`, `gap`, and semantic surface hooks
5. add app CSS only where brand-specific polish is truly needed
6. add Sig.js only where app-specific runtime behavior is needed

If you are not in a bundler app, use the CDN or copy-dist path under [Plain HTML / CDN](#plain-html--cdn-no-bundler) instead of steps 1–2. The JS module is still optional.

## Best current advice

- Let Juice own structure
- Let the theme own identity
- Keep custom classes or selectors small and intentional
- Do not wait on config to start using Juice
- Do use app-owned theme config when a product needs a real brand system

## Where to go next

- [Styles](./juice-styles.md)
- [Typography Contract](./juice-typography-contract.md)
- [Theme Contract](./juice-theme-contract.md)
- [Theme Authoring](./juice-theme-authoring.md)
- [Theme Manual](./juice-theme-manual.md)
- [Best Practices](./juice-best-practices.md)
