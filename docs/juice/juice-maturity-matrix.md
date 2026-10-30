# Juice Maturity Matrix

This document tracks the current maturity of Juice across its major system areas. It reflects the **0.9.2** public cut on npm (disclosure, spinner, select, input, textarea, field, and motion core on top of the 0.9.1 stack). 0.9.0 shipped eighteen Emerging runtimes, navigation through progress (switch, slider, checkbox, radio, breadcrumb, and progress A→B→C).

Disclosure, spinner, select, input, textarea, field, and motion core shipped in 0.9.2. `juice:change` and `getState()` are on master, unreleased after 0.9.2.

The ten retro themes (`retro-afterburn`, `retro-arcade-glow`, `retro-boardwalk`, `retro-denim-dial`, `retro-forest-radio`, `retro-orchard-club`, `retro-poolside-pop`, `retro-signal-garden`, `retro-sunset-motel`, `retro-violet-parlor`) shipped in 0.9.1. Menu is the twelfth Emerging auto-enhance runtime.

Switch is the thirteenth, slider is the fourteenth, checkbox is the fifteenth, radio is the sixteenth, breadcrumb is the seventeenth, and progress is the eighteenth. Pagination is the nineteenth.

Disclosure is the twentieth, spinner is the twenty-first, select is the twenty-second, input is the twenty-third, textarea is the twenty-fourth, and field is the twenty-fifth. Icon button is the twenty-sixth.

Avatar is the twenty-seventh. Table is the twenty-eighth.

Checkbox and radio are two runtimes. Breadcrumb is a light trail.

Progress is a progressbar. Pagination is a page set.

Disclosure is a standalone one-trigger / one-panel control, distinct from accordion. Spinner is a standalone indeterminate busy indicator, distinct from progress and disclosure.

Select is a styled native `<select>`, distinct from combobox. Input is a styled native `<input>`, distinct from combobox and from select.

Textarea is a styled native `<textarea>`, distinct from input, select, and combobox. Field is a wrapper around a control, distinct from input, textarea, select, and combobox.

Icon button is a square icon-only control on button chrome, distinct from switch and from checkbox, and is on master, not in the published npm 0.9.2 release. Avatar is an initials-or-photo mark (`[avatar]`), distinct from a badge and from `[skeleton="circle"]`, and is on master, not in the published npm 0.9.2 release.

Avatar is the twenty-seventh Emerging auto-enhance runtime and is on master, not in the published npm 0.9.2 release. Table is the twenty-eighth Emerging auto-enhance runtime and is on master, not in the published npm 0.9.2 release.

Pressable is the twenty-ninth Emerging auto-enhance runtime and is on master, not in the published npm 0.9.2 release. Touchable row is the thirtieth Emerging auto-enhance runtime and is on master, not in the published npm 0.9.2 release.

All thirty-one stay Emerging. Skeleton is a CSS-only loading placeholder (`[skeleton]`) on master, not in the published npm 0.9.2 release.

It is not a runtime and does not change that count. See [Skeleton](./juice-skeleton.md).

List is CSS-only stacked rows (`[list]`) on master, not in the published npm 0.9.2 release. It is not a runtime and does not change that count.

See [List](./juice-list.md). Badge is CSS-only label chrome.

The base layout shipped in npm 0.9.2. Core `--juice-badge-*` roles are on master and are not in that cut.

It is not a runtime and does not change that count. See [Badge](./juice-badge.md).

Safe area is CSS-only inset chrome (`[safe-area]`) on master, not in the published npm 0.9.2 release. It is not a runtime and does not change that count.

See [Safe Area](./juice-safe-area.md). Maturity ratings below stay **Emerging** — this pass does not bump anything to Stable. 0.9.1 was the prior public cut.

The goal is to make it easy to answer:

- what is ready today
- what is usable but still evolving
- what is still early or draft

## Maturity levels

### `Stable`

The feature is usable today, central to the Juice experience, and unlikely to change dramatically in basic concept.

### `Emerging`

The feature is useful and present, but the API, conventions, or implementation details are still likely to evolve.

### `Early`

The feature exists, but it is still exploratory, incomplete, or not yet something Juice should strongly promise as a finished public surface.

### `Draft`

The feature is more of a direction or configuration surface than a hardened part of Juice.

## Matrix

| Area | Maturity | Notes |
|---|---|---|
| Attribute-driven styling model | Stable | This is the core identity of Juice and already works well in real markup. |
| Layout primitives (`stack`, `row`, `gap`, `space`, `content`, `container`) | Stable | Central to day-to-day composition and already useful across pages and app views. |
| Spacing and sizing utilities | Stable | Broadly useful and predictable, though still worth continued normalization. |
| Color tokens and swatches | Stable | One of the strongest parts of the system. |
| Typography utilities | Stable | Readable and useful. Authoring contract documents `font`, `fontSize` (`sm`…`xxl`), `fontColor`, `lineHeight`, and `fontWeight`. Author type attrs beat theme `h1`–`h6` / `p` defaults. See [Typography Contract](./juice-typography-contract.md). |
| Icon system | Stable | Strong now that FontAwesome Free solid, regular, and brands are integrated. Authoring contract: default `[icon]` size is `1rem`; `iconSize` is first-class. |
| Responsive core behavior | Emerging | Built-in breakpoints, row collapse, and spacing scale documented in [juice-responsive-reference.md](./juice-responsive-reference.md). |
| Card system | Emerging | Now has a meaningful structure, variants, and content regions, but is still maturing. |
| Button system | Emerging | Useful and expressive, but still early compared to mature design-system button APIs. |
| Form system | Emerging | The scoped field model is strong, but state semantics and composition patterns are still settling. |
| Navigation system | Emerging | Nav variants are growing into a real subsystem, but region semantics and active/current states need refinement. |
| Page-level patterns | Emerging | Tutorials and patterns are now present, which makes Juice more teachable and reusable. |
| Rules engine | Emerging | The philosophy is strong, but only lightly formalized in written protocol docs so far. |
| Docs and onboarding | Emerging to Stable | Much stronger now, with onboarding, best practices, tutorials, and patterns. |
| JS entrypoint | Emerging | Importing `@citrusworx/juiceui` auto-starts the runtimes. Twenty-five shipped in 0.9.2. Six more are on master and are not in that release. See [Runtime behavior](./juice-runtime-behavior.md#components). |
| Public component exports | Emerging | `Accordion()` is the only Sig factory. Every runtime exports `create` / `init` / `start` / `stop`. Markup plus auto-enhance is the contract. Skeleton, list, badge, and safe area are not JS exports. |
| Themes | Emerging | Fourteen bundled themes, each `<id>.scss` plus `<id>.yaml`. Required binds are in the [Theme contract](./juice-theme-contract.md). The retro themes are separate entrypoints, not a `retro.css` bundle. |
| Motion (`motion` attribute) | Emerging | P0/P1 catalog is in [Animations](./juice-animations.md). Motion core shipped in `@citrusworx/juiceui@0.9.2`. Stays Emerging. |
| Skeleton (`[skeleton]`) | Emerging | CSS-only placeholder. On master, not in npm 0.9.2. Not a runtime. See [Skeleton](./juice-skeleton.md). |
| List (`[list]`) | Emerging | CSS-only stacked rows. On master, not in npm 0.9.2. Not a runtime. See [List](./juice-list.md). |
| Badge (`[badge]`) | Emerging | CSS-only pill. Layout shipped in npm 0.9.2. `--juice-badge-*` roles are on master, not in that cut. See [Badge](./juice-badge.md). |
| Safe area (`[safe-area]`) | Emerging | CSS-only inset. On master, not in npm 0.9.2. Not a runtime. See [Safe area](./juice-safe-area.md). |
| Avatar (`[avatar]`) | Emerging | Initials or photo. The twenty-seventh runtime. On master, not in npm 0.9.2. See [Avatar](./juice-avatar.md). |
| Table (`[table]`) | Emerging | Sortable grid. The twenty-eighth runtime. On master, not in npm 0.9.2. See [Table](./juice-table.md). |
| Pressable (`[pressable]`) | Emerging | Transient press. The twenty-ninth runtime. On master, not in npm 0.9.2. See [Pressable](./juice-pressable.md). |
| Touchable row (`[touchable-row]`) | Emerging | 44px row. The thirtieth runtime. On master, not in npm 0.9.2. See [Touchable row](./juice-touchable-row.md). |
| Keyboard avoider (`[keyboard-avoider]`) | Emerging | Software-keyboard inset. The thirty-first runtime. On master, not in npm 0.9.2. Not a `JuiceRuntimeName`. See [Keyboard avoider](./juice-keyboard-avoider-runtime.md). |
| Config-driven branding | Draft | Useful direction, but still not required and not yet a hardened contract. |
| Generator/config pipeline | Draft | The config exists, but the workflow around it is still early and evolving. |

## Summary by category

### Strongest areas

These are the parts of Juice that are already carrying real value:

- attribute-driven styling model
- layout primitives
- spacing and sizing utilities
- color tokens
- typography
- icon system

These form the strongest case for Juice as a CSS-first styling and composition system.

### Most promising emerging areas

These are already useful, but still need refinement before they feel fully settled:

- cards
- forms
- navigation
- accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, breadcrumb, progress, pagination, disclosure, spinner, select, input, textarea, field, icon button, avatar, table, pressable, and touchable row auto-enhance runtimes
- skeleton loading chrome (CSS-only, on master, not in the published npm 0.9.2 release, not a runtime)
- list rows (CSS-only, on master, not in the published npm 0.9.2 release, not a runtime)
- Sig Accordion factory
- responsive defaults
- page-level patterns
- rules engine formalization
- documentation as product surface

These areas are what will most directly move Juice from strong alpha to more mature system status.

### Early or draft areas

These should be treated more carefully in positioning:

- themes (usable, still settling)
- config-driven branding
- generator/config workflow
- a large public JS component API beyond the shipped runtimes and Accordion factory

The JS entrypoint is no longer a stub. Navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, breadcrumb, progress, pagination, disclosure, spinner, select, input, textarea, field, icon button, avatar, table, pressable, and touchable row auto-enhance on import, and `Accordion()` is a real Sig factory.

Checkbox and radio are two runtimes. Breadcrumb is a light trail.

Progress is a progressbar. Pagination is a page set.

Disclosure is a standalone one-trigger / one-panel control, distinct from accordion, and shipped in 0.9.2. Spinner is a standalone indeterminate busy indicator, distinct from progress and disclosure, and shipped in 0.9.2.

Select is a styled native `<select>`, distinct from combobox, and shipped in 0.9.2. Input is a styled native `<input>`, distinct from combobox and from select, and shipped in 0.9.2.

Textarea is a styled native `<textarea>`, distinct from input, select, and combobox, and shipped in 0.9.2. Field is a wrapper around a control, distinct from input, textarea, select, and combobox, and shipped in 0.9.2.

Icon button is a square icon-only control on button chrome, distinct from switch and from checkbox, and is on master, not in the published npm 0.9.2 release. Avatar is an initials-or-photo mark (`[avatar]`), distinct from a badge and from `[skeleton="circle"]`, and is on master, not in the published npm 0.9.2 release.

Skeleton is CSS-only and is not part of that JS layer. List is CSS-only and is not part of that JS layer.

Badge is CSS-only and is not part of that JS layer. Its layout shipped in npm 0.9.2.

Its `--juice-badge-*` roles are on master and are not in that cut. Safe area is CSS-only and is not part of that JS layer.

It is on master and is not in the published npm 0.9.2 release. That layer is Emerging, not the center of the Juice promise.

Interactive hosts dispatch `juice:change` when observable state changes, and `getState()` reads it. That observation contract stays Emerging and is on master, unreleased after 0.9.2.

Select, input, and textarea publish value changes through the native `input` and `change` events.

## Recommended positioning right now

If Juice is being described externally or internally, the most honest current positioning is:

`Juice Beta is a CSS-first, attribute-driven styling and composition system with strong layout, token, typography, icon, and page-structure support, a documented theme contract, and a supported subset of motion attributes.`

That framing matches the strongest current reality. The JS entry is an Emerging extra: importing it auto-enhances nav, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, breadcrumb, progress, pagination, disclosure, spinner, select, input, textarea, field, icon button, avatar, table, pressable, and touchable row.

Disclosure, spinner, select, input, textarea, field, and motion core shipped in 0.9.2. It is not a finished component runtime.

Less accurate positioning right now would be:

- fully mature component framework
- finished theming engine
- deeply featured JS component runtime
- fully stabilized config-driven design system generator

## What would move Juice upward fastest

### To move more areas into `Stable`

Focus on:

1. normalizing attribute conventions
2. hardening cards, buttons, forms, and nav
3. clarifying responsive defaults
4. writing more explicit rules-engine docs
5. keeping examples and docs tightly aligned with the real API

### To move config and theming beyond `Draft`

Focus on:

1. defining what config is responsible for
2. showing how config and expressive attributes work together
3. documenting a stable customization workflow
4. reducing ambiguity around generator behavior

## Practical interpretation

If you are building with Juice today:

- confidently use the CSS-first styling, layout, token, typography, and icon layers
- use cards, forms, nav, and buttons with the understanding that they are still maturing
- use `[skeleton]` from core CSS as Emerging — on master, not in the published npm 0.9.2 release, and not an auto-enhance runtime. See [Skeleton](./juice-skeleton.md)
- use `[list]` from core CSS as Emerging — on master, not in the published npm 0.9.2 release, and not an auto-enhance runtime. See [List](./juice-list.md)
- use `[badge]` from core CSS as Emerging — the base layout shipped in npm 0.9.2, the `--juice-badge-*` roles are on master and are not in that cut, and it is not an auto-enhance runtime. See [Badge](./juice-badge.md)
- use `[safe-area]` from core CSS as Emerging — on master, not in the published npm 0.9.2 release, and not an auto-enhance runtime. See [Safe Area](./juice-safe-area.md)
- use `[avatar]` as Emerging — on master, not in the published npm 0.9.2 release. The twenty-seventh auto-enhance runtime. See [Avatar](./juice-avatar.md)
- use `[table]` as Emerging — on master, not in the published npm 0.9.2 release. The twenty-eighth auto-enhance runtime. See [Table](./juice-table.md)
- use `[pressable]` as Emerging — on master, not in the published npm 0.9.2 release. The twenty-ninth auto-enhance runtime. `bind()` does not name pressable, touchable-row, or keyboard-avoider yet. See [Pressable](./juice-pressable.md)
- use `[touchable-row]` as Emerging — on master, not in the published npm 0.9.2 release. The thirtieth auto-enhance runtime. `bind()` does not name pressable, touchable-row, or keyboard-avoider yet. See [Touchable Row](./juice-touchable-row.md)
- use the shipped auto-enhance runtimes (navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, breadcrumb, progress, pagination, disclosure, spinner, select, input, textarea, field, icon button, avatar, table, pressable, and touchable row) and the Sig Accordion factory as Emerging
- valid markup should work after importing the JS entry, but that surface is not Stable. Checkbox and radio are two runtimes.
- Breadcrumb is a light trail. Progress is a progressbar.
- Pagination is a page set. Disclosure is a standalone one-trigger / one-panel control, distinct from accordion, and shipped in 0.9.2.
- Spinner is a standalone indeterminate busy indicator, distinct from progress and disclosure, and shipped in 0.9.2. Select is a styled native `<select>`, distinct from combobox, and shipped in 0.9.2.
- Input is a styled native `<input>`, distinct from combobox and from select, and shipped in 0.9.2. Textarea is a styled native `<textarea>`, distinct from input, select, and combobox, and shipped in 0.9.2.
- Field is a wrapper around a control, distinct from input, textarea, select, and combobox, and shipped in 0.9.2
- treat config-driven branding and generator workflow as draft

That is the cleanest and most honest adoption model for the current state of the system.
