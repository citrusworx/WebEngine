# Juice Beta

Juice Beta is the first release line where the styling system, theme contract, and motion catalog are documented and gated for publish.

## What Beta includes

- Attribute-driven layout, spacing, color, typography, icons, gradients, and components (see [maturity matrix](./juice-maturity-matrix.md)).
- **Modular themes:** `aquaflux`, `kiwipress`, `citrusmint` ship as separate CSS entrypoints (`@citrusworx/juiceui/styles/themes/<id>`). `@citrusworx/juiceui/styles` is **core only** (no theme rules). Activate with `theme="<id>"` on the root after importing core + theme CSS.
- **Responsive reference:** [juice-responsive-reference.md](./juice-responsive-reference.md).
- **Surfaces:** `surfaceTone="soft"` — [juice-surfaces.md](./juice-surfaces.md).
- **Motion:** canonical `motion` attribute with P0/P1 values ([juice-animations.md](./juice-animations.md)); `prefers-reduced-motion` respected.
- **Theme authoring:** each shipped theme uses `src/themes/<id>/<id>.scss` + `<id>.yaml` ([juice-theme-authoring.md](./juice-theme-authoring.md)).

## What Beta does not promise yet

- Full animation roadmap ([juice-animations-roadmap.md](./juice-animations-roadmap.md)).
- Config-driven theme generation from `juice.config.yaml` (optional, draft).
- Draft themes under `src/themes/_draft/` (for example `blush`).
- A large public JS component API beyond the exports listed in the package README.

## Publish gate

```bash
yarn workspace @citrusworx/juiceui verify
```

See [release-checklist.md](./release-checklist.md).

## Positioning

> Juice Beta is a CSS-first, attribute-driven styling and composition system with strong layout, token, typography, icon, and page-structure support, a documented theme contract, and a supported subset of motion attributes.
