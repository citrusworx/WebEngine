# Juice Beta

Juice Beta is the first release line where the styling system, theme contract, and motion catalog are documented and gated for publish. `@citrusworx/juiceui@0.9.0` is the versioned Beta cut (switch, slider, checkbox, radio, breadcrumb, and progress A→B→C on top of the 0.8.0 stack). **0.8.0 remains the public npm cut** until someone runs `yarn release-packages` after this version lands. Menu is the twelfth Emerging auto-enhance runtime in 0.8.0. Switch is the thirteenth, slider is the fourteenth, checkbox is the fifteenth, radio is the sixteenth, breadcrumb is the seventeenth, and progress is the eighteenth. Checkbox and radio are two runtimes. Breadcrumb is a light trail. Progress is a progressbar. All eighteen stay **Emerging**. See [juice-roadmap.md](./juice-roadmap.md).

## What Beta includes

- Attribute-driven layout, spacing, color, typography, icons, gradients, and components (see [maturity matrix](./juice-maturity-matrix.md)).
- **Modular themes:** `aquaflux`, `kiwipress`, `citrusmint`, and `tide` ship as separate CSS entrypoints (`@citrusworx/juiceui/styles/themes/<id>`). `@citrusworx/juiceui/styles` is **core only** (no theme rules). Activate with `theme="<id>"` on the root after importing core + theme CSS.
- **Responsive reference:** [juice-responsive-reference.md](./juice-responsive-reference.md).
- **Surfaces:** `surfaceTone="soft|strong|muted"`, `borderStrength="soft|bold"`, standalone `blur="sm|md"`, `shadowTone="cool|warm"`, `overlay="frost|tint"`, and `variant="monochromatic|glass|tinted"` — [juice-surfaces.md](./juice-surfaces.md). Tones, strength, shadow tone, and overlay use `--juice-surface-*` / `--juice-border-strength-*` / `--juice-shadow-tone-*` / `--juice-overlay-*` theme roles; blur uses fixed lengths (`6px` / `16px`); variant recipes compose those same roles.
- **Motion:** canonical `motion` attribute with P0/P1 values ([juice-animations.md](./juice-animations.md)); `prefers-reduced-motion` respected.
- **Theme authoring:** each shipped theme uses `src/themes/<id>/<id>.scss` + `<id>.yaml` ([juice-theme-authoring.md](./juice-theme-authoring.md)). Required `--juice-*` binds are listed in the [Theme Contract](./juice-theme-contract.md).
- **Auto-start runtimes:** importing `@citrusworx/juiceui` auto-enhances valid navigation, `[accordion]`, `[tabs]`, `[modal-overlay]`, `[drawer-overlay]`, `[toast-region]`, `[popover-root]`, `[wizard-shell]`, `[tooltip-root]`, `[combobox]`, `[banner]`, `[menu-root]`, `[switch]`, `[slider]`, `[checkbox]`, `[radiogroup]`, `[breadcrumb]`, and `[progress]` markup in the browser. `[switch]`, `[slider]`, `[checkbox]`, `[radio]`, `[breadcrumb]`, and `[progress]` are in 0.9.0 and are not yet on npm. Checkbox and radio are two runtimes. Breadcrumb is a light trail. Progress is a progressbar. Escape / layering and z-index bands are documented in [juice-runtime-behavior.md](./juice-runtime-behavior.md#escape--layering). See also [juice-navigation-runtime.md](./juice-navigation-runtime.md), [juice-accordion-runtime.md](./juice-accordion-runtime.md), [juice-tabs-runtime.md](./juice-tabs-runtime.md), [juice-modal-runtime.md](./juice-modal-runtime.md), [juice-drawer-runtime.md](./juice-drawer-runtime.md), [juice-toast-runtime.md](./juice-toast-runtime.md), [juice-popover-runtime.md](./juice-popover-runtime.md), [juice-wizard-runtime.md](./juice-wizard-runtime.md), [juice-tooltip-runtime.md](./juice-tooltip-runtime.md), [juice-combobox-runtime.md](./juice-combobox-runtime.md), [juice-banner-runtime.md](./juice-banner-runtime.md), [juice-menu-runtime.md](./juice-menu-runtime.md), [juice-switch-runtime.md](./juice-switch-runtime.md), [juice-slider-runtime.md](./juice-slider-runtime.md), [juice-checkbox-runtime.md](./juice-checkbox-runtime.md), [juice-radio-runtime.md](./juice-radio-runtime.md), [juice-breadcrumb-runtime.md](./juice-breadcrumb-runtime.md), and [juice-progress-runtime.md](./juice-progress-runtime.md).

## What Beta does not promise yet

- Full animation roadmap ([juice-animations-roadmap.md](./juice-animations-roadmap.md)).
- Config-driven theme generation from `juice.config.yaml` (optional, draft).
- Draft themes under `src/themes/_draft/` (for example `blush`). YAML-only drafts do not emit CSS; package `exports` and the published tarball do not expose `_draft`.
- A large public JS component API. The documented auto-start runtimes (navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, breadcrumb, and progress) and the Sig Accordion factory do ship; switch, slider, checkbox, radio, breadcrumb, and progress are in 0.9.0 (not yet on npm). Checkbox and radio are two runtimes. Breadcrumb is a light trail. Progress is a progressbar. There is no Sig Modal, Sig Drawer, Sig Toast, Sig Popover, Sig Wizard, Sig Tooltip, Sig Combobox, Sig Banner, Sig Menu, Sig Switch, Sig Slider, Sig Checkbox, Sig Radio, Sig Breadcrumb, or Sig Progress factory. A broad component library is not the center of Beta.

## Publish gate

```bash
yarn workspace @citrusworx/juiceui verify
```

See [release-checklist.md](./release-checklist.md).

## Positioning

> Juice Beta is a CSS-first, attribute-driven styling and composition system with strong layout, token, typography, icon, and page-structure support, a documented theme contract, and a supported subset of motion attributes.
