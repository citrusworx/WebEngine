# Juice

Attribute-first UI for CitrusWorx apps.

Juice is a styling library that keeps structure and visual intent in markup through attributes like `stack`, `row`, `grid`, `gap`, `padding`, `card`, `panel`, `hero`, and `surface`.

The current model is:

- Juice owns shared structure, spacing, responsive behavior, and primitive surface hooks
- themes own brand identity, typography, color relationships, and semantic defaults
- app CSS can still add small product-specific polish where needed

Juice is strongest when you treat it as a shared structural language, not as a class utility clone and not as a heavyweight component runtime.

## Core ideas

- Attribute-first composition instead of utility-class soup
- CSS-first consumption with a small optional JS entrypoint
- Themeable by config, with generated CSS contracts
- Works well with Sig.js for behavior and local reactivity
- Supports hybrid setups where Juice handles structure and the app adds brand-specific selectors

## Current setup shape

Most apps should use Juice like this:

```ts
import "@citrusworx/juiceui/styles";
import "./generated/my-theme.css";
```

```html
<body theme="my-theme">
  <main stack gap="2rem">
    <section hero surface="brand-stage" padding="2rem">
      <h1>Brand headline</h1>
      <p>Juice owns structure. The theme owns identity.</p>
    </section>
  </main>
</body>
```

## Themes now

Juice themes can come from two places:

- library-owned themes inside `libraries/juice/src/themes/`
- app-owned theme configs such as `apps/my-app/juice.theme.yaml`

The important current shift is that app-owned themes are first-class. An app can keep its own brand config, generate its own CSS and YAML artifacts, and still rely on Juice for the structural system.

That is now the recommended direction for product-specific branding.

## Theme generation

Generate library themes:

```bash
yarn workspace @citrusworx/juiceui generate:themes
```

Generate an app-owned theme:

```bash
yarn workspace @citrusworx/juiceui generate:themes \
  --config ../../apps/blackwatersound/front/juice.theme.yaml \
  --css-out ../../apps/blackwatersound/front/src/generated/blackwatersound-theme.css \
  --yaml-out ../../apps/blackwatersound/front/src/generated/blackwatersound-theme.yaml
```

That flow lets the app own:

- theme identity
- font pairings and variants
- palette
- named surfaces

while Juice still owns:

- layout primitives
- spacing system
- responsive composition
- base surface hooks like `[card]`, `[panel]`, `[hero]`, and `[cta]`

## Hybrid styling

Juice is intentionally compatible with hybrid styling.

Recommended split:

- Juice attributes for layout, spacing, composition, and broad semantics
- generated theme CSS for identity and defaults
- app selectors for brand-specific art direction that should not become shared framework behavior

Blackwater Sound is the current practical example of this model.

## Suggested reading order

- [Getting Started](./juice-getting-started.md)
- [Attributes](./juice-attributes.md)
- [Layout](./juice-layout.md)
- [Styles](./juice-styles.md)
- [Theme Authoring](./juice-theme-authoring.md)
- [Theme Manual](./juice-theme-manual.md)
- [Best Practices](./juice-best-practices.md)

## Status

Juice is still evolving, but the current public direction is stable enough to describe clearly:

- core stylesheet import
- attribute-first structure
- explicit theme import
- app-owned theme generation
- hybrid app usage with small product CSS layers
