# Juice public contract

Classification of the `@citrusworx/juiceui` public surface for 1.0. This page records what is **Frozen**, what is **Emerging**, and what is **not contract**. It does not change runtime, CSS, themes, or package exports.

The audited surface is master `7f24f46f` and npm `@citrusworx/juiceui@0.9.7` (published 2026-11-03, `gitHead` `403cbdb9`). Those two match on the public surface. Behavior stays on the pages linked below. The machine check for required theme binds is `requiredJuiceBinds()` in `libraries/juice/src/juice.theme-contract.ts`, exercised by `juice.theme-contract.test.ts`. The Frozen surface guard is `libraries/juice/src/juice.public-contract.test.ts`.

## How to read the classes

| Class | Meaning for 1.0 |
| --- | --- |
| Frozen | The name or shape is part of the 1.0 contract. A minor does not remove or rename it. Token *values* stay with the theme or with the core default, as the linked page already says. |
| Emerging | Public. A minor may change it. |
| Not contract | Present in the package or the docs, and not a promise. Internal modules live here too. |

The thirty-two component runtimes (CRTs) stay **Emerging**. That maturity decision is the CRT freeze of 2026-11-05. A Frozen host-hook name does not promote the runtime. Importing `@citrusworx/juiceui` still auto-enhances the hooks in [Runtime behavior](./juice-runtime-behavior.md#components).

Rows below that were not waiting on a decision keep the class from the 0.9.7 public-surface inventory. The decision items are collected again at the [end](#decision-index).

## Runtimes

All thirty-two stay Emerging. The host hook in the components table is a Frozen name. Part and modifier attributes that the runtime reads are Frozen names. CSS-only modifiers are Emerging and are listed under [Attributes](#attributes).

| Runtime | Frozen host hook | Page |
| --- | --- | --- |
| Navigation | `nav[type="bar\|links\|mobile\|sidebar"]` | [Navigation](./juice-navigation-runtime.md) |
| Menu | `[menu-root]` | [Menu](./juice-menu-runtime.md) |
| Tabs | `[tabs]` | [Tabs](./juice-tabs-runtime.md) |
| Breadcrumb | `[breadcrumb]` | [Breadcrumb](./juice-breadcrumb-runtime.md) |
| Pagination | `[pagination]` | [Pagination](./juice-pagination-runtime.md) |
| Modal | `[modal-overlay]` | [Modal](./juice-modal-runtime.md) |
| Drawer | `[drawer-overlay]` | [Drawer](./juice-drawer-runtime.md) |
| Sheet | `[sheet-overlay]` | [Sheet](./juice-sheet-runtime.md) |
| Popover | `[popover-root]` | [Popover](./juice-popover-runtime.md) |
| Tooltip | `[tooltip-root]` | [Tooltip](./juice-tooltip-runtime.md) |
| Toast | `[toast-region]` | [Toast](./juice-toast-runtime.md) |
| Input | `<input input>` | [Input](./juice-input-runtime.md) |
| Textarea | `<textarea textarea>` | [Textarea](./juice-textarea-runtime.md) |
| Select | `<select select>` | [Select](./juice-select-runtime.md) |
| Combobox | `[combobox]` | [Combobox](./juice-combobox-runtime.md) |
| Checkbox | `[checkbox]` | [Checkbox](./juice-checkbox-runtime.md) |
| Radio | `[radiogroup]` | [Radio](./juice-radio-runtime.md) |
| Switch | `[switch]` | [Switch](./juice-switch-runtime.md) |
| Slider | `[slider]` | [Slider](./juice-slider-runtime.md) |
| Field | `[field]` | [Field](./juice-field-runtime.md) |
| Icon button | `[icon-button]` | [Icon button](./juice-icon-button-runtime.md) |
| Pressable | `[pressable]` | [Pressable](./juice-pressable.md) |
| Touchable row | `[touchable-row]` | [Touchable row](./juice-touchable-row.md) |
| Banner | `[banner]` | [Banner](./juice-banner-runtime.md) |
| Progress | `[progress]` | [Progress](./juice-progress-runtime.md) |
| Spinner | `[spinner]` | [Spinner](./juice-spinner-runtime.md) |
| Accordion | `[accordion]` | [Accordion](./juice-accordion-runtime.md) |
| Disclosure | `[disclosure]` | [Disclosure](./juice-disclosure-runtime.md) |
| Wizard | `[wizard-shell]` | [Wizard](./juice-wizard-runtime.md) |
| Avatar | `[avatar]` | [Avatar](./juice-avatar.md) |
| Table | `<table table>` | [Table](./juice-table.md) |
| Keyboard avoider | `[keyboard-avoider]` | [Keyboard avoider](./juice-keyboard-avoider-runtime.md) |

Navigation's contract is those four `type` values plus sidebar `hidden`. `[nav-brand]`, `[nav-links]`, and `[nav-actions]` are [not contract](#not-contract).

Choosing between similar components stays on [Runtime behavior](./juice-runtime-behavior.md#choosing-between-similar-components).

## Observation

`juice:change` and `getState()` shapes for the twenty-nine runtimes that publish them, and the native `input` / `change` value shape for select, input, and textarea, are Frozen. The table, including the keyboard-avoider threshold note, is [juice:change](./juice-runtime-behavior.md#juicechange).

`JUICE_CHANGE_EVENT` (the string `'juice:change'`) and `JuiceChangeDetail` are Frozen exports from `@citrusworx/juiceui`. They are re-exported from `shared/change.ts`. The change bookkeeping functions (`createJuiceChanges`, `dispatchJuiceChange`, `juiceStatesEqual`) stay internal.

`juice:sort` (table) and `juice:longpress` (pressable) are Emerging. Neither event name is an exported constant. `juice:sort` is described on [Table](./juice-table.md). `juice:longpress` is described on [Pressable](./juice-pressable.md). `bind` follows `juice:change`.

## Lifecycle exports

Each runtime's `create*`, `init*`, `start*`, and `stop*` functions are Frozen, as are its `*Options`, `*Controller`, and `*State` types. `init*` is the same call as `create*`. Every Options type includes `*Selector` overrides; those keys are Frozen with the type. The pattern is [Automatic behavior](./juice-runtime-behavior.md#automatic-behavior). Each runtime page lists its own keys.

`stopNavigationRuntime()` is one of those Frozen exports. The page above records that it does not cancel a deferred boot.

`Accordion`, the Sig factory in `libraries/juice/src/components/accordion/accordion.tsx`, is Emerging. It is the only Sig factory. See [Accordion](./juice-accordion-runtime.md#accordion).

These helper type aliases are Emerging. They are exported next to the Frozen Options, Controller, and State types.

| Type | Declaration |
| --- | --- |
| `PopoverPlacement` | `'top' \| 'bottom' \| 'left' \| 'right'` in `popover-runtime.ts` |
| `TooltipPlacement` | `'top' \| 'bottom' \| 'left' \| 'right'` in `tooltip-runtime.ts` |
| `TableSortDirection` | `'ascending' \| 'descending' \| 'none'` in `table-runtime.ts`. [Table](./juice-table.md) uses the same union in its controller sketch |
| `SheetDetent` | `'peek' \| 'half' \| 'full'` in `sheet-runtime.ts`. [Sheet](./juice-sheet-runtime.md) names this export |

Skeleton, list, badge, and safe area are not JS exports.

## Motion

### Frozen: `[motion]` catalog and `data-motion-state`

The `[motion]` attribute catalog is Frozen: naming (`family`, `family.variant`, `family::speed`, `family:modifier`), the deprecated blink-only `animation` / `animate` aliases, and the P0 and P1 values. The catalog text is [Animations](./juice-animations.md#canonical-attribute-motion). Planned names in [the animations roadmap](./juice-animations-roadmap.md) are not part of that catalog.

`data-motion-state` is Frozen. `runMotion` writes `entering`, `entered`, `exiting`, and `exited`, as [the helper section](./juice-animations.md#data-motion-state-and-the-helper-api) describes. Accordion and disclosure set the same attribute. Overlay enter and exit for modal, drawer, sheet, popover, and toast stay on that page.

### Emerging: helpers, types, and `--juice-motion-*`

These five functions are public exports of `@citrusworx/juiceui`. They are Emerging. They live in `libraries/juice/src/js/src/shared/motion.ts` and are re-exported from `libraries/juice/src/index.ts`.

| Export | Signature |
| --- | --- |
| `prefersReducedMotion` | `() => boolean` |
| `subscribeReducedMotion` | `(listener: (reduced: boolean) => void) => () => void` |
| `createMotionCancelToken` | `() => MotionCancelToken` |
| `runMotion` | `(element, direction, token?) => MotionResult` |
| `createElementMotion` | `() => MotionPlayer` |

`prefersReducedMotion` reads `matchMedia('(prefers-reduced-motion: reduce)')` and returns `false` when `matchMedia` is missing or throws. `subscribeReducedMotion` returns an unsubscribe that is a no-op in those same environments. `direction` is `'enter'` or `'exit'`.

These five types are public and Emerging. Definitions are the `export type` aliases in `motion.ts`, copied on [Animations](./juice-animations.md#motion-types):

| Type | Shape |
| --- | --- |
| `MotionState` | `'entering' \| 'entered' \| 'exiting' \| 'exited'` |
| `MotionDirection` | `'enter' \| 'exit'` |
| `MotionCancelToken` | `{ readonly cancelled: boolean; cancel: () => void }` |
| `MotionResult` | `{ immediate: boolean; finished: Promise<{ completed: boolean }> }` |
| `MotionPlayer` | `{ enter, exit, cancel, destroy }` as declared on that page |

All ten `--juice-motion-*` tokens are Emerging. Values remain optional overrides. Core owns the defaults. Shipped themes are not required to bind them. The eight pass-through roles and the two derived curves are [Theme contract §5 Motion](./juice-theme-contract.md#motion-optional-override) and [Animations](./juice-animations.md#duration-and-ease):

| Token | Default |
| --- | --- |
| `--juice-motion-duration-instant` | `0.15s` |
| `--juice-motion-duration-fast` | `0.2s` |
| `--juice-motion-duration-base` | `0.3s` |
| `--juice-motion-duration-slow` | `1s` |
| `--juice-motion-ease-standard` | `ease` |
| `--juice-motion-ease-enter` | `ease-out` |
| `--juice-motion-ease-exit` | `ease-in` |
| `--juice-motion-ease-linear` | `linear` |
| `--juice-motion-ease-in-out` | `ease-in-out` (derived, `:root` only; generated themes do not pass it through) |
| `--juice-motion-ease-steps` | `steps(2, end)` (derived, `:root` only; generated themes do not pass it through) |

`--juice-spinner-spin-duration` and `--juice-progress-indeterminate-duration` stay optional overrides on the theme contract. They are not part of this ten.

## `tokens` export

The `tokens` value export is Emerging. It is `export { tokens } from "./tokens/index.js"` in `libraries/juice/src/index.ts`. The object in `libraries/juice/src/tokens/index.ts` is:

| Key | Contents |
| --- | --- |
| `colors.families` | `"black"`, `"blue"`, `"brown"`, `"gray"`, `"green"`, `"orange"`, `"pink"`, `"purple"`, `"red"`, `"teal"`, `"white"`, `"yellow"` |
| `colors.<family>` | That family's step object from `src/tokens/color/<family>/<family>.json` (steps `"100"` through `"900"`, HSL strings) |
| `sizing` | `{}` |
| `spacing` | `{}` |
| `typography` | `{ providers: ["adobe", "google"] }` |
| `themes` | `{}` |

`tokens.themes` is currently `{}`. CSS custom properties are a separate contract. See [CSS tokens](#css-tokens) and [Token system](./juice-token-system.md).

## CSS tokens

### Frozen names: required `--juice-*` binds

The required chrome token **names** are Frozen. Theme **values** stay with each theme. Every shipped library theme declares every required name. The list is [Theme contract §4](./juice-theme-contract.md#4-required---juice--binds). `requiredJuiceBinds()` is the machine check. Nav, icon-button, avatar, table, pressable, touchable-row, keyboard-avoider, and sheet have no required family. Sheet color falls through to drawer. That is the theme contract, not a gap in the freeze.

### Emerging: optional hooks and core defaults

Optional and override tokens in [Theme contract §5](./juice-theme-contract.md#5-optional-hooks) are Emerging. That includes the optional accordion hooks (7) and tabs hooks (2), the two standalone blur lengths in [§7](./juice-theme-contract.md#7-not-theme-roles), sheet paint that falls through to drawer, spinner and progress duration hooks, and the core-default families (icon-button, skeleton, list, badge, avatar, table, pressable, touchable-row, keyboard, sheet layout, safe area). `--juice-safe-area-pad` is a core layout length, not a theme bind. `--juice-avatar-status-away` is the Tide-only override of an Emerging avatar token.

Per-host paint hooks `--juice-slider-ratio` and `--juice-progress-ratio` are Emerging. They are written on the host, not declared as theme binds.

### Emerging: retro `--juice-color-*`

These nine names are optional Emerging tokens. All ten retro themes declare them (`retro-afterburn`, `retro-arcade-glow`, `retro-boardwalk`, `retro-denim-dial`, `retro-forest-radio`, `retro-orchard-club`, `retro-poolside-pop`, `retro-signal-garden`, `retro-sunset-motel`, `retro-violet-parlor`). Core CSS under `libraries/juice/src/components/` and `libraries/juice/src/styles/` does not read them. Aquaflux, KiwiPress, Citrusmint, and Tide do not declare them. This page does not edit theme files.

| Token |
| --- |
| `--juice-color-page` |
| `--juice-color-surface` |
| `--juice-color-text` |
| `--juice-color-text-muted` |
| `--juice-color-heading` |
| `--juice-color-accent` |
| `--juice-color-on-accent` |
| `--juice-color-border` |
| `--juice-color-highlight` |

Afterburn's block, which the others follow with their own prefix, is `--juice-color-page: var(--afb-page)` through `--juice-color-highlight: var(--afb-highlight)`, with `--juice-color-on-accent` set from the theme's on-accent value.

### Frozen: identity-prefix fallback

The core fallback chain is Frozen. Role helpers read `--juice-*` first, then `--aqua-*`, `--kw-*`, `--cm-*`, `--tide-*`, `--jx-*`, then the helper's own fallback. Retro identity prefixes (`--afb-*`, `--acg-*`, and the rest) are not in that chain. The alias table is [Theme contract §6](./juice-theme-contract.md#6-identity-prefix-alias-convention).

Helpers that contain the chain: accordion (short names, `--aqua-trigger` rather than an `--aqua-accordion-` infix), banner, breadcrumb, checkbox, combobox, disclosure, drawer, field, input, menu, modal, pagination, popover, progress, radio, select, slider, spinner, switch, tabs, textarea, toast, tooltip, and wizard.

## Attributes

Runtime-read attributes on each runtime page are Frozen names. The host hooks are the table [above](#runtimes). CSS-only modifiers below are Emerging even when a component page already shows them.

`font`, `fontSize`, `fontColor`, `lineHeight`, and `fontWeight` are Frozen. They are already Stable on the [maturity matrix](./juice-maturity-matrix.md). The scale is the [Typography contract](./juice-typography-contract.md), checked by `juice.typography-contract.test.ts`.

`surfaceTone`, `borderStrength`, `blur`, `shadowTone`, `overlay`, and `variant` are Frozen. Values and recipes are [Surfaces](./juice-surfaces.md) and theme contract §4 and §7.

Icon files shipped for `[icon]` / `iconSize` are Frozen. The contract test is `juice.icon-contract.test.ts`. Usage is [Icons](./juice-icons.md).

### Emerging CSS-only modifiers

| Component | Emerging attributes |
| --- | --- |
| Avatar | `[avatar-group]`, `[avatar-more]`, `[scale]`, `[status]` |
| Banner | `[banner-body]` |
| Breadcrumb | `[breadcrumb-separator]` |
| Drawer | `[drawer-body]`, `[drawer-size]` |
| Field | `[field-label]` |
| Icon button | `[icon]`, `[round]`, `[scale]` |
| Keyboard avoider | `[container]`, `[fixed]`, `[safe-area]`, `[sticky]`, `[wizard-header]` |
| Modal | `[modal-body]` |
| Nav | `[container]`, `[cta]`, `[fixed]`, `[gradient]`, `[sticky]` |
| Popover | `[popover-body]` |
| Progress | `[progress-fill]`, `[progress-label]` |
| Sheet | `[sheet-footer]` |
| Slider | `[slider-fill]` |
| Spinner | `[spinner-label]` |
| Table | `[dense]`, `[sticky]`, `[striped]`, `[table-align]`, `[table-scroll]` |
| Toast | `[toast-body]`, `[toast-title]` |
| Touchable row | `[avatar]`, `[badge]`, `[icon]`, `[touchable-row-content]`, `[touchable-row-leading]`, `[touchable-row-subtitle]`, `[touchable-row-title]`, `[touchable-row-trailing]` |
| Wizard | `[badge]`, `[brand]`, `[container]`, `[feature]`, `[features]`, `[wizard-header]`, `[wizard-rail]` |

`[data-nav-toggle-icon]` is Frozen. It is the toggle icon the navigation runtime writes.

### CSS-only four

Skeleton, list, badge, and safe area are Emerging. They are not runtimes. Hooks and modifiers:

| Component | Attributes | Page |
| --- | --- | --- |
| Skeleton | `[skeleton]`, `[lines]`, `[scale]`, `[static]` | [Skeleton](./juice-skeleton.md) |
| List | `[list]`, `[list-item]`, `[list-leading]`, `[list-content]`, `[list-secondary]`, `[list-trailing]`, `[divided]`, `[dense]`, `[avatar]`, `[icon]` | [List](./juice-list.md) |
| Badge | `[badge]`, `[cta]` | [Badge](./juice-badge.md) |
| Safe area | `[safe-area]`, `[container]`, `[fixed]`, `[sticky]`, `[wizard-header]` | [Safe area](./juice-safe-area.md) |

### Button `theme` attribute

`theme` on a button is Emerging. Core CSS matches one value, `citrusmint-300`, on `[btn="flat"]`, `[btn="outline"]`, and `[btn="text"]` in `libraries/juice/src/components/button/button.scss`. Those rules set freshgreen swatch colors.

The attribute name is the same name as the page theme attribute (`theme="<id>"` on a root, [Theme contract §2](./juice-theme-contract.md#2-shipped-references)). A rename is a Post-v1 consideration. This page does not rename it.

### Wizard checkout chrome

These twenty-five attributes are Emerging. They are selectors in `libraries/juice/src/components/wizard/wizard.scss`. The wizard runtime does not read them. `[wizard-content]`, `[step]`, `[step-page]`, `[step-nav]`, `[wizard-prev]`, `[wizard-next]`, and `[wizard-complete]` stay the Frozen runtime names on [Wizard](./juice-wizard-runtime.md).

Several selectors are not nested under `[wizard-shell]`, so they match any element that carries the attribute.

| Attribute | What `wizard.scss` does with it |
| --- | --- |
| `[wizard-body]` | Flex container (`display: flex`, `flex: 1`, `min-height: 0`). The file comment calls this the body that becomes three columns, two, then one |
| `[step-indicator]` | 2.5rem circle. Pending, active, and completed fills use the wizard step roles |
| `[step-body]` | `flex: 1`, `min-width: 0`, `padding-top: 0.375rem`. A direct `h4` is 0.9375rem and a direct `p` is 0.75rem |
| `[step-header]` | Block under a step page. Its `h1` uses the page title size |
| `[lede]` | Under `[step-page]` or `[step-header]`: 1.125rem, line-height 1.6 |
| `[order-summary]` | Sticky rail (`top: 4rem`, padding `2rem`) |
| `[summary-card]` | Bordered card. Fill is the wizard panel role |
| `[summary-mode]` | Block above a bottom border inside the card |
| `[mode-row]` | Flex row, `gap: 0.75rem` |
| `[summary-items]` | Vertical stack, `gap: 1rem` |
| `[line-item]` | Flex row, `gap: 0.75rem` |
| `[line-body]` | Inside `[line-item]`: flexible text column |
| `[line-cost]` | Inside `[line-item]`: monospace cost |
| `[summary-total]` | Flex row with a top border |
| `[total-amount]` | 1.5rem monospace amount |
| `[trust]` | Borderless list with a top border. Directly under `[step-page]` it becomes a wrapping row |
| `[dot]` | Inside `[trust]`: 0.375rem round mark |
| `[domain-summary]` | Block with `margin-bottom: 1.5rem` |
| `[selected-domain]` | Bordered flex row. Fill is the wizard panel role |
| `[feature-icon]` | 2.75rem rounded box |
| `[eyebrow]` | Uppercase 0.6875rem label. Also styled under `[step-tracker]` |
| `[subtle]` | 0.875rem text. Nested copies under the summary use smaller sizes |
| `[actions]` | Under `[step-page]`: `margin: 0 0 3rem` and `flex-wrap: wrap` |
| `[logo]` | Under `[wizard-header] [brand]`: 1.125rem, weight 700 |
| `[pill="accent"]` | Inline pill, `border-radius: 9999px` |

`[step-indicator]` is also the paint target described in the theme contract's wizard roles and in [Theme authoring](./juice-theme-authoring.md). `[wizard-body]` is named in [Attributes](./juice-attributes.md). Both stay Emerging.

## Themes and package entries

### Frozen theme paths

Fourteen themes ship. Both spellings are Frozen:

- `@citrusworx/juiceui/themes/<id>.css`
- `@citrusworx/juiceui/styles/themes/<id>`

`<id>` is `aquaflux`, `kiwipress`, `citrusmint`, `tide`, `retro-afterburn`, `retro-arcade-glow`, `retro-boardwalk`, `retro-denim-dial`, `retro-forest-radio`, `retro-orchard-club`, `retro-poolside-pop`, `retro-signal-garden`, `retro-sunset-motel`, `retro-violet-parlor`. There is no `retro.css` bundle. The character of each theme is [Theme contract §2](./juice-theme-contract.md#2-shipped-references).

`package.json` `exports` for `./themes/*.css` and `./styles/themes/*` are Frozen too. Both wildcards map at the CSS condition to `./dist/themes/*.css`. The wildcard also matches a path that has no theme file. `@citrusworx/juiceui/themes/index.css` is one of those: the pattern resolves toward `dist/themes/index.css`, and that CSS file is not one of the fourteen themes. `dist/themes/index.d.ts` is a different file. It is `export {}`, and the comment in it says theme metadata for JS consumers is not part of the Beta public API. `./styles` points its `types` condition at that file and its default condition at `dist/index.css`.

`.` and `./styles` are Frozen style entries. `./styles` is core CSS only, as [Juice Beta](./juice-beta.md) says.

Export keys that are `null` and block `_draft` are Frozen as a block: `./themes/_draft`, `./themes/_draft/*`, `./themes/_draft/*.css`, `./styles/themes/_draft`, `./styles/themes/_draft/*`. Blush (`src/themes/_draft/blush/`) is Post-v1. It is YAML-only, unpublished, and not a reference theme.

### Post-v1: generator and branding config

`juice.config.yaml` and the theme generator under `libraries/juice/src/tools/theme-generator` are Post-v1. The generator is not in the published package. The maturity matrix marks config-driven branding Draft. App-owned `--jx-*` themes are described in [Theme authoring](./juice-theme-authoring.md). That authoring guide is how to build a theme. It is not a Frozen generator API.

## CSS folders in core

`libraries/juice/src/components/components.scss` forwards component SCSS into core `index.css`.

These nine are Emerging, and they already have docs: button, card, cta, form, hero, panel, plan, section-header, stat. Cards are [Juice Cards](./juice-cards.md). Surfaces cover hero, panel, and cta recipes. Button `theme="citrusmint-300"` is the [button attribute](#button-theme-attribute) above.

These six are Emerging. They have no component page of their own. File comments and top-level selectors:

| Folder | What the SCSS says it owns | Top-level hooks |
| --- | --- | --- |
| `dashboard` | Logged-in customer cloud chrome: shell, sidebar, nav, page header. Structure only | `[dashboard-shell]`, `[dashboard-sidebar]`, `[sidebar-brand]`, `[sidebar-nav]`, `[nav-group]`, `[nav-divider]`, `[nav-link]`, `[sidebar-footer]`, `[dashboard-main]`, `[page-header]` |
| `developers` | Developer hub: hero, quickstart card, categories grid, resources strip | `[developers-hero]`, `[dev-hero-header]`, `[dev-hero-actions]`, `[quickstart-card]`, `[install-grid]`, `[install-card]`, `[categories-grid]`, `[category-card]`, `[resources-grid]`, `[resource-tile]` |
| `how-it-works` | Three-tier architecture explainer: hero, tier diagram, philosophy, four steps, architecture stack, comparison, engineers, final CTA | `[architecture-hero]`, `[tier-diagram]`, `[tier]`, `[philosophy-grid]`, `[four-steps-list]`, `[arch-stack]`, `[two-ways-grid]`, `[engineers]`, `[final-cta]`. Also styles `[section-header][centered]` |
| `login` | Centered sign-in card: page, card, header, fields, submit, providers, footer | `[login-page]`, `[login-card]`, `[login-header]`, `[login-brand]`, `[login-form]`, `[login-field]`, `[login-submit]`, `[login-divider]`, `[login-providers]`, `[login-footer]` |
| `search-panel` | Centered search panel, input row, result list | `[search-panel]`, `[search-panel-header]`, `[search-input-group]`, `[search-results]`, `[search-result]` |
| `workflow` | Three-column step row. The connector's `::after` is the character `→` | `[workflow]`, `[workflow-step]`, `[workflow-step-marker]`, `[workflow-connector]` |

## Behavior that stays Emerging

[Nesting and Escape](./juice-runtime-behavior.md#nesting-and-escape) is Emerging. That is the shared overlay stack shipped in 0.9.7: last-opened-wins Escape and outside pointer for modal, drawer, sheet, popover, menu, and combobox; dismiss reason `'cascade'`; tooltip and toast off that stack. The order on that page is the description. This classification does not copy it.

[Z-index bands](./juice-runtime-behavior.md#z-index-bands) are Emerging. They are structural bands. There is no `--juice-z-*` token.

The layer bookkeeping under `libraries/juice/src/js/src/shared/` (`layer-stack`, `dialog-layer`, `light-layer`, `overlays`, `focus`, `events`, `ids`) is internal. `package.json` `exports` has no subpath that reaches those modules.

## Not contract

### Nav region attributes

`[nav-brand]`, `[nav-links]`, and `[nav-actions]` are not contract. `nav.scss` gives them flex layout, and it hides `[nav-links]` and `[nav-actions]` below 960px. The navigation runtime does not read them. The contract is `nav[type="bar|links|mobile|sidebar"]` plus sidebar `hidden`, as [Navigation](./juice-navigation-runtime.md) states. Example markup in [Safe area](./juice-safe-area.md) uses plain elements inside `nav[fixed]` so those three names are not shown as hooks.

### Portal

No portal exists in Juice today. [Banner](./juice-banner-runtime.md) says there is no `[banner-region]` and no portal. [Toast](./juice-toast-runtime.md) says the runtime does not invent a portal: authors place `[toast-region]` and `[toast]`. Portal work for 1.0 is planned separately and needs its own plan. This page does not describe a portal API.

### RTL

RTL is not a 1.0 contract. The current limit, for this release, is what core CSS does today:

- Touchable-row is the only component that handles `:dir(rtl)` and `[dir="rtl"]`. It mirrors the chevron (`border-width: 0 0 2px 2px`, `rotate(45deg)`). See [Touchable row](./juice-touchable-row.md).
- Drawer edges are physical. `[drawer="left"]` sets `left: 0` and `right: auto`. The default edge is right. Enter and exit use `translateX(100%)` and `translateX(-100%)`. See [Drawer](./juice-drawer-runtime.md) and [Animations](./juice-animations.md).
- Toast corners are physical. `[toast-region]` values `top-right`, `top-left`, `bottom-right`, and `bottom-left` set `left` or `right` to `0`. See [Toast](./juice-toast-runtime.md).

A full RTL audit is Post-v1.

Safe-area insets are a different fact. `env(safe-area-inset-*)` is a physical viewport inset, already stated on [Safe area](./juice-safe-area.md). That is not an RTL contract.

### Unreachable `.d.ts` files

These files are in the package `dist/` tree and are not keys in `package.json` `exports`:

- `dist/js/juice.d.ts`
- `dist/components/index.d.ts`
- `dist/components/form/cc/cc.d.ts`

They will stop shipping before 1.0, in a separate packaging change. This page does not change packaging. They are not part of the public contract.

`dist/js/src/shared/*.d.ts` can be present because the runtime build emits them. No `exports` subpath reaches them. They stay internal.

## Decision index

Every item from the 2026-11-12 contract decisions, and the class this page gives it.

| Decision | Class |
| --- | --- |
| `[nav-brand]`, `[nav-links]`, `[nav-actions]` | Not contract |
| Wizard checkout attributes (25), listed [above](#wizard-checkout-chrome) | Emerging |
| CSS folders `dashboard`, `developers`, `how-it-works`, `login`, `search-panel`, `workflow` | Emerging |
| `runMotion`, `createElementMotion`, `createMotionCancelToken`, `prefersReducedMotion`, `subscribeReducedMotion` | Emerging |
| `MotionCancelToken`, `MotionResult`, `MotionState`, `MotionPlayer`, `MotionDirection` | Emerging |
| `tokens` JS export | Emerging |
| `[motion]` catalog and `data-motion-state` | Frozen |
| `--juice-color-page`, `--juice-color-surface`, `--juice-color-text`, `--juice-color-text-muted`, `--juice-color-heading`, `--juice-color-accent`, `--juice-color-on-accent`, `--juice-color-border`, `--juice-color-highlight` | Emerging |
| `--juice-motion-duration-instant`, `--juice-motion-duration-fast`, `--juice-motion-duration-base`, `--juice-motion-duration-slow`, `--juice-motion-ease-standard`, `--juice-motion-ease-enter`, `--juice-motion-ease-exit`, `--juice-motion-ease-linear`, `--juice-motion-ease-in-out`, `--juice-motion-ease-steps` | Emerging |
| `./themes/*.css` and `./styles/themes/*` | Frozen |
| `dist/js/juice.d.ts`, `dist/components/index.d.ts`, `dist/components/form/cc/cc.d.ts` | Not contract. Packaging change is separate |
| Identity-prefix fallback `--aqua-*` / `--kw-*` / `--cm-*` / `--tide-*` / `--jx-*` | Frozen |
| Button `theme="citrusmint-300"` | Emerging. Rename is Post-v1 |
| Portal | Not a current contract. 1.0 work is planned separately. No API is described here |
| RTL | Not a 1.0 contract. Current limits are [above](#rtl). Full audit is Post-v1 |
