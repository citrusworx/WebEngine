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

```bash
yarn add @citrusworx/juiceui
```

## Import the core stylesheet

```ts
import "@citrusworx/juiceui/styles";
```

That gives you the shared structural and attribute-driven styling layer.

## Add a theme

Juice core is intentionally separate from theme identity.

You should import either:

- a library theme, or
- an app-generated theme

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

## Use Sig.js for behavior

Juice does not try to own state.

Use Sig.js when the UI needs:

- toggles
- counters
- tabs
- filters
- route-aware UI
- reactive updates after render

Juice and Sig.js fit well together because one owns styling and the other owns behavior.

## What to use first

1. import `@citrusworx/juiceui/styles`
2. import a theme CSS file
3. set `theme="..."` at the app root
4. compose pages with `stack`, `row`, `grid`, `gap`, and semantic surface hooks
5. add app CSS only where brand-specific polish is truly needed
6. add Sig.js only where runtime behavior is needed

## Best current advice

- Let Juice own structure
- Let the theme own identity
- Keep custom classes or selectors small and intentional
- Do not wait on config to start using Juice
- Do use app-owned theme config when a product needs a real brand system

## Where to go next

- [Styles](./juice-styles.md)
- [Theme Authoring](./juice-theme-authoring.md)
- [Theme Manual](./juice-theme-manual.md)
- [Best Practices](./juice-best-practices.md)
