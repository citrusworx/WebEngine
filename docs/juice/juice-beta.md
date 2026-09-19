# Juice Beta

Juice Beta is the first release line where the styling system, theme contract, and motion catalog are documented and gated for publish. `@citrusworx/juiceui@0.4.0` is the current public cut on npm. Master is ahead (Tide, surface A–C, theme/icon/type contracts); a future 0.5.0 is the publish lane. See [juice-roadmap.md](./juice-roadmap.md).

## What Beta includes

- Attribute-driven layout, spacing, color, typography, icons, gradients, and components (see [maturity matrix](./juice-maturity-matrix.md)).
- **Modular themes:** `aquaflux`, `kiwipress`, `citrusmint`, and `tide` ship as separate CSS entrypoints (`@citrusworx/juiceui/styles/themes/<id>`). `@citrusworx/juiceui/styles` is **core only** (no theme rules). Activate with `theme="<id>"` on the root after importing core + theme CSS.
- **Responsive reference:** [juice-responsive-reference.md](./juice-responsive-reference.md).
- **Surfaces:** `surfaceTone="soft|strong|muted"`, `borderStrength="soft|bold"`, and standalone `blur="sm|md"` — [juice-surfaces.md](./juice-surfaces.md). Tones and strength use `--juice-surface-*` / `--juice-border-strength-*` theme roles; blur uses fixed lengths (`6px` / `16px`).
- **Motion:** canonical `motion` attribute with P0/P1 values ([juice-animations.md](./juice-animations.md)); `prefers-reduced-motion` respected.
- **Theme authoring:** each shipped theme uses `src/themes/<id>/<id>.scss` + `<id>.yaml` ([juice-theme-authoring.md](./juice-theme-authoring.md)). Required `--juice-*` binds are listed in the [Theme Contract](./juice-theme-contract.md).
- **Auto-start runtimes:** importing `@citrusworx/juiceui` auto-enhances valid navigation, `[accordion]`, and `[tabs]` markup in the browser. See [juice-runtime-behavior.md](./juice-runtime-behavior.md), [juice-navigation-runtime.md](./juice-navigation-runtime.md), [juice-accordion-runtime.md](./juice-accordion-runtime.md), and [juice-tabs-runtime.md](./juice-tabs-runtime.md).

## What Beta does not promise yet

- Full animation roadmap ([juice-animations-roadmap.md](./juice-animations-roadmap.md)).
- Config-driven theme generation from `juice.config.yaml` (optional, draft).
- Draft themes under `src/themes/_draft/` (for example `blush`). YAML-only drafts do not emit CSS; package `exports` and the published tarball do not expose `_draft`.
- A large public JS component API. The documented auto-start runtimes (navigation, accordion, tabs) and the Sig Accordion factory do ship; a broad component library is not the center of Beta.

## Publish gate

```bash
yarn workspace @citrusworx/juiceui verify
```

See [release-checklist.md](./release-checklist.md).

## Positioning

> Juice Beta is a CSS-first, attribute-driven styling and composition system with strong layout, token, typography, icon, and page-structure support, a documented theme contract, and a supported subset of motion attributes.
