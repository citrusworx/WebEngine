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
  <!-- or theme="kiwipress" | theme="citrusmint" -->
</body>
```

Built files: `dist/index.css` (core), `dist/themes/<id>.css` (theme). Each theme is authored as `<themeId>.scss` + `<themeId>.yaml` under `src/themes/<themeId>/`. See [docs/juice/juice-theme-authoring.md](../../docs/juice/juice-theme-authoring.md).

## Responsive behavior

Built-in breakpoints, `row` collapse, and scaled spacing are documented in [docs/juice/juice-responsive-reference.md](../../docs/juice/juice-responsive-reference.md).

## Surfaces

Beta-stable: `surfaceTone="soft"`. See [docs/juice/juice-surfaces.md](../../docs/juice/juice-surfaces.md).

## Motion (Beta)

Use the `motion` attribute for animations (for example `motion="fade.in"`, `motion="spin::fast"`). See [docs/juice/juice-animations.md](../../docs/juice/juice-animations.md).

## Use the JS API

```ts
import {
  Accordion,
  createNavigation,
  initNavigation,
  startNavigationRuntime,
  stopNavigationRuntime,
  tokens
} from "@citrusworx/juiceui";
```

The top-level JS entrypoint is intentionally small. Those named exports are the stable runtime API Juice currently promises.

## Use the built files directly

If you are hosting Juice assets yourself, the main built files are:

- `dist/index.css` (core)
- `dist/themes/aquaflux.css`, `dist/themes/kiwipress.css`, `dist/themes/citrusmint.css`
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

```html
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

Config is not required to use Juice. The most stable current entrypoint is still the compiled stylesheet plus the existing attribute system.

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
