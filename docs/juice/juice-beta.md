# Juice Beta

Juice Beta is the first release line where the styling system, theme contract, and motion catalog are documented and gated for publish. `@citrusworx/juiceui@0.6.0` is the public Beta cut on npm (Tide, surfaces + depth, contracts, modal runtime). Master is ahead with unpublished drawer and toast runtimes. 0.4.0 was the prior public cut. See [juice-roadmap.md](./juice-roadmap.md).

## What Beta includes

- Attribute-driven layout, spacing, color, typography, icons, gradients, and components (see [maturity matrix](./juice-maturity-matrix.md)).
- **Modular themes:** `aquaflux`, `kiwipress`, `citrusmint`, and `tide` ship as separate CSS entrypoints (`@citrusworx/juiceui/styles/themes/<id>`). `@citrusworx/juiceui/styles` is **core only** (no theme rules). Activate with `theme="<id>"` on the root after importing core + theme CSS.
- **Responsive reference:** [juice-responsive-reference.md](./juice-responsive-reference.md).
- **Surfaces:** `surfaceTone="soft|strong|muted"`, `borderStrength="soft|bold"`, standalone `blur="sm|md"`, `shadowTone="cool|warm"`, `overlay="frost|tint"`, and `variant="monochromatic|glass|tinted"` — [juice-surfaces.md](./juice-surfaces.md). Tones, strength, shadow tone, and overlay use `--juice-surface-*` / `--juice-border-strength-*` / `--juice-shadow-tone-*` / `--juice-overlay-*` theme roles; blur uses fixed lengths (`6px` / `16px`); variant recipes compose those same roles.
- **Motion:** canonical `motion` attribute with P0/P1 values ([juice-animations.md](./juice-animations.md)); `prefers-reduced-motion` respected.
- **Theme authoring:** each shipped theme uses `src/themes/<id>/<id>.scss` + `<id>.yaml` ([juice-theme-authoring.md](./juice-theme-authoring.md)). Required `--juice-*` binds are listed in the [Theme Contract](./juice-theme-contract.md).
- **Auto-start runtimes:** importing `@citrusworx/juiceui` auto-enhances valid navigation, `[accordion]`, `[tabs]`, `[modal-overlay]`, `[drawer-overlay]`, and `[toast-region]` markup in the browser. See [juice-runtime-behavior.md](./juice-runtime-behavior.md), [juice-navigation-runtime.md](./juice-navigation-runtime.md), [juice-accordion-runtime.md](./juice-accordion-runtime.md), [juice-tabs-runtime.md](./juice-tabs-runtime.md), [juice-modal-runtime.md](./juice-modal-runtime.md), [juice-drawer-runtime.md](./juice-drawer-runtime.md), and [juice-toast-runtime.md](./juice-toast-runtime.md).

## What Beta does not promise yet

- Full animation roadmap ([juice-animations-roadmap.md](./juice-animations-roadmap.md)).
- Config-driven theme generation from `juice.config.yaml` (optional, draft).
- Draft themes under `src/themes/_draft/` (for example `blush`). YAML-only drafts do not emit CSS; package `exports` and the published tarball do not expose `_draft`.
- A large public JS component API. The documented auto-start runtimes (navigation, accordion, tabs, modal, drawer, toast) and the Sig Accordion factory do ship; there is no Sig Modal, Sig Drawer, or Sig Toast factory. A broad component library is not the center of Beta.

## Publish gate

```bash
yarn workspace @citrusworx/juiceui verify
```

See [release-checklist.md](./release-checklist.md).

## Positioning

> Juice Beta is a CSS-first, attribute-driven styling and composition system with strong layout, token, typography, icon, and page-structure support, a documented theme contract, and a supported subset of motion attributes.
