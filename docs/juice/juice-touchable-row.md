# Touchable row

Touchable row is a 44px action row. `createTouchableRow` activates an `li` or `div` from Enter or Space, and toggles selection when the row opts in.

Emerging. The thirtieth runtime. On master. Not in `@citrusworx/juiceui@0.9.2`. Its four exports are not in that cut. `bind` does not name `touchable-row`. Not a `JuiceRuntimeName`.

Importing `@citrusworx/juiceui` enhances valid markup. See [Automatic behavior](./juice-runtime-behavior.md#automatic-behavior). The published `@citrusworx/juiceui@0.9.2` package does not include this runtime.

Touchable row is Mobile-Critical. The stylesheet is `libraries/juice/src/components/touchable-row/touchable-row.scss`. `components.scss` forwards it after `radio.scss` and before `safe-area.scss`.

The stylesheet does not require the runtime. `[selected]`, `aria-selected="true"`, and `aria-current` other than `"false"` paint the start bar when the JS entry is absent. The runtime toggles that state, and gives a non-native interactive row a button role. There is no `TouchableRow()` factory. Press feedback is `[pressable]`. This file does not paint a wash.

## Markup

Plain row.

```html
<div touchable-row>
  <span touchable-row-title>Inbox</span>
</div>
```

Link with a disclosure chevron.

```html
<a href="/settings" touchable-row="chevron">
  <span touchable-row-title>Settings</span>
</a>
```

Dense row.

```html
<li touchable-row="dense">
  <span touchable-row-title>Dense row</span>
</li>
```

No hairline on this boundary.

```html
<div touchable-row="undivided">
  <span touchable-row-title>No hairline on this boundary</span>
</div>
```

Leading avatar, title, subtitle, and a trailing meta line, badge, switch, and icon button.

```html
<div touchable-row>
  <span touchable-row-leading>
    <span avatar>AL</span>
  </span>
  <span touchable-row-content>
    <span touchable-row-title>Ada Lovelace</span>
    <span touchable-row-subtitle>Notes</span>
  </span>
  <span touchable-row-trailing>
    <span>2h</span>
    <span badge>New</span>
    <button type="button" switch aria-label="Pin"></button>
    <button type="button" icon-button aria-label="More"></button>
  </span>
</div>
```

Title and subtitle inside the content column. `="clamp"` is the two-line opt-in.

```html
<div touchable-row>
  <span touchable-row-content>
    <span touchable-row-title>One line, then an ellipsis</span>
    <span touchable-row-subtitle="clamp">Two lines, then a clamp. The rest is hidden.</span>
  </span>
</div>
```

A direct title clamps. It is not wrapped in content.

```html
<div touchable-row>
  <span touchable-row-title="clamp">A direct title clamps. It is not wrapped in content.</span>
</div>
```

Selectable, activate, and pressable rows.

```html
<div touchable-row="select">Pick</div>

<div touchable-row="activate">Open</div>

<div touchable-row="select" pressable pressable-longpress>Hold or tap</div>

<a href="/now" touchable-row="chevron select" pressable="scale">Current</a>
```

There is no HTML global `touchable-row` attribute, and there is no `<touchable-row>` element. Boolean `[touchable-row]` is the row. Any value is still a row. Words compose: `[touchable-row="dense"]` matches `[touchable-row~="dense"]`.

`[leading]` is letter-spacing, so the slot is not `[leading]`. There is no `[touchable-row-meta]`. Meta text is content in the trailing slot. The chevron is not a child.

CSS hosts are `a`, `button`, `li`, and `div`, via `:where(a, button, li, div)[touchable-row]`. The runtime selector is any `[touchable-row]`. A host the stylesheet does not paint can still be enhanced.

Do not nest a `button` in a `button` or an anchor. The icon button and the switch are buttons. Use a `div` or `li` host when the trailing slot has one. The row is the 44px target. The icon button keeps its own box (default `2.5rem`). The switch track stays `2.75rem` by `1.5rem`.

The default title is a single-line ellipsis. `="clamp"` is the multi-line opt-in (2 lines). A title may be a direct child of the host. That direct title truncates, and `="clamp"` clamps. The column flex stays on `[touchable-row-content]`. A direct title is not a flex container, so `display: block` and `display: -webkit-box` apply.

## Attributes

| Hook | What it does |
| --- | --- |
| `[touchable-row]` | Host. Any value, including empty, is still a row. CSS paints `a`, `button`, `li`, and `div`. |
| `[touchable-row~="dense"]` | Tighter padding and gap. Minimum height stays `44px`. |
| `[touchable-row~="chevron"]` | Disclosure mark, drawn with `::after`. Not a child. |
| `[touchable-row~="undivided"]` | No hairline on this boundary. Either side's word removes that line. |
| `[touchable-row~="select"]` | Runtime opt-in. Activation toggles selection. Not styled in the stylesheet. |
| `[touchable-row~="activate"]` | Runtime opt-in. Keyboard button chrome when the row is not `[pressable]` and not selectable. Not styled here. |
| `[touchable-row-leading]` | Direct child. Icon or avatar. The slot does not clip, so a status dot keeps its rim. |
| `[touchable-row-content]` | Direct child. Title plus optional subtitle. Column flex. |
| `[touchable-row-title]` | Primary line. Single-line ellipsis. `="clamp"` clamps. A direct child also truncates and clamps. |
| `[touchable-row-subtitle]` | Second line. Same ellipsis and `="clamp"`. |
| `[touchable-row-trailing]` | Direct child. Meta text, badge, switch, icon button. `white-space: nowrap`. |
| `[selected]` | Selected signal, with `aria-selected="true"` or `aria-current` other than `"false"`. The start border takes the ink. |
| `[pressable]` | Press feedback stays on Pressable. This runtime does not set `[pressed]`. |
| `[pressable-longpress]` | Pressable's long-press. Not implemented in this runtime. |
| Disabled | The `disabled` property, `[disabled]`, and `[aria-disabled="true"]`. Opacity `0.5` and `cursor: default`. `pointer-events` stay with the author. |

Core CSS does not give `[touchable-row]` a z-index. Position is not set. See [Z-index bands](./juice-runtime-behavior.md#z-index-bands).

## JavaScript

| Export | What it does |
| --- | --- |
| `createTouchableRow(options?)` | Builds a controller. Same function as `initTouchableRow`. Without `document`, methods do nothing and `getState()` returns `null`. |
| `initTouchableRow(options?)` | Same call as `createTouchableRow`. |
| `startTouchableRowRuntime()` | Starts the document singleton. A second call syncs and returns it. Returns `null` without `document`. |
| `stopTouchableRowRuntime()` | Destroys the singleton and cancels a deferred boot. |

`createTouchableRow()` can run beside the document runtime. Each click and key is claimed once, so the two do not double-toggle. The entry re-exports this module, so the boot runs on import.

### Options

| Option | Default |
| --- | --- |
| `root` | `document` |
| `touchableRowSelector` | `[touchable-row]` |

A custom `root` limits sync to rows inside that root. When the root itself matches, that host is managed too. Hosts outside the root are left alone. There is no long-press option. Long-press is `[pressable-longpress]` on Pressable.

### Controller

- `destroy()` removes the listeners, disconnects the observer, and cancels a scheduled sync. It does not remove a `role` or `tabindex` this runtime added, and it does not clear `[selected]`.
- `sync()` records each managed host and adds button chrome when the row is interactive.
- `getState(target?)` returns `{ selected: boolean, disabled: boolean }`, or `null` when no managed host matches. After `destroy()`, it returns `null`.

With no target, `getState()` uses the first managed host. A target inside a host resolves to that host.

### Events

A change of `selected` or `disabled` dispatches a bubbling, composed [juice:change](./juice-runtime-behavior.md#juicechange) from the host, with `detail` `{ runtime: "touchable-row", state: { selected: boolean, disabled: boolean } }`. `selected` is `[selected]`, `aria-selected="true"`, or `aria-current` other than `"false"`, not the `select` word.

`disabled` is the `disabled` property, `[disabled]`, or `aria-disabled="true"`. `getState()` returns that shape, or `null` when the host is missing, and the first observation, a later unchanged `sync()`, and a disabled attempt do not dispatch.

## Accessibility

- Prefer `<button type="button" touchable-row>` or `<a href touchable-row>` so the platform supplies the role and the activation. This runtime does not add `role` or `tabindex` on those hosts.
- A `div` or `li` that should act as a button needs `[touchable-row~="select"]`, `[touchable-row~="activate"]`, or `[pressable]`. This runtime then adds `role="button"` and `tabindex="0"` when the author has not set them. A plain row does not enter the tab order.
- Enter on an `li` or `div` is not `preventDefault`'d and dispatches one click. Space on those hosts does not scroll the page.
- A click on a trailing control does not toggle the row. Selectable rows are independent. This is not a radiogroup and not a tablist.
- On a link, the selected signal is `aria-current`, not `aria-selected`. On every other host it is `aria-selected`, plus `[selected]`.
- Disabled is the `disabled` property, `[disabled]`, or `aria-disabled="true"`. The runtime ignores the attempt. `aria-disabled` does not remove the click from here. A disabled custom row does not `preventDefault` Space.
- The label and the bar use registered body ink. The divider is decorative and stays under 3:1. The selected bar clears 3:1 on every theme. Citrusmint is the floor at **4.62:1** on the page and **5.17:1** on the strong surface.
- A touchable row inside a Citrusmint list still takes the list selected wash. Body ink on that wash is **3.84:1**. The bar against that wash is the same **3.84:1** and still clears 3:1. The text pair misses 4.5:1.
- Focus is the `:focus-visible` outline. The runtime does not move focus and does not trap it. See [Escape and layering](./juice-runtime-behavior.md#escape--layering) and [Z-index bands](./juice-runtime-behavior.md#z-index-bands).
- Do not nest a button or an anchor inside a button or an anchor. A trailing `[switch]` or `[icon-button]` wants a `div` or `li` host.

## Behavior

1. Find `[touchable-row]` hosts in the root. Any attribute value stays as authored. `dense`, `chevron`, and `undivided` are CSS words. `select` and `activate` are the two words this runtime owns.
2. Add `role="button"` and `tabindex="0"` only when the row is interactive, the author has not set that attribute, and the host is not native, a menuitem, or disabled.
3. On Enter or Space, on an `li` or `div` (and any other non-native host), dispatch one bubbling click. Repeat keydowns do not. Native `a` and `button` keep the platform click.
4. When `[touchable-row~="select"]` is present, toggle selection on that click. Rows without the word do not toggle. Siblings are not cleared.
5. Ignore the click, the key, and `juice:change` when the host is disabled.
6. Ignore keys and clicks that start in an interactive descendant, so a trailing control works on its own.

There is no focus trap. Escape is not handled. This runtime does not set `[pressed]`.

### When to use it

Use `[touchable-row]` when the row itself is the touch target: a settings row, a disclosure row, a selectable row, or a row whose trailing control is a switch or an icon button. The host is the target. Minimum height stays `44px` at both densities.

Use [list](./juice-list.md) when the job is a stacked list and the row does not need this keyboard contract. `[list]` / `[list-item]` is CSS-only. `[selected]` there is visual only. There is no runtime, no `juice:change`, and no synthesized click. A touchable row can sit on a list item. The list wash still paints.

Use `[menuitem]` inside `[menu-root]` for a menu. The menu runtime owns Enter and Space and clicks the item once. This runtime does not add a second click or a button role on that host. Putting both attributes on one element replaces the menu item's block layout with this flex row, because this file loads later. See [Menu](./juice-menu-runtime.md).

Use [table](./juice-table.md) for a grid. A `tr` is not a touchable-row host, so table row hover and the sort caret stay on the table. Do not put `[touchable-row]` on a table row.

### Keyboard

Enter or Space on a non-native host dispatches one bubbling, cancelable, composed `click`. The event is a `MouseEvent`. Repeat keydowns do not dispatch another. `isComposing` is ignored. Enter is never `preventDefault`'d. `Spacebar` is treated as Space.

Space is `preventDefault`'d only on those non-native hosts, when the event is cancelable, so the page does not scroll. A plain row with no `role` still gets that `preventDefault` if the key target is the row. Native `a` and `button` are not given a second click, and Space is not `preventDefault`'d on them.

An `<a>` without `href` is still native (`HTMLAnchorElement`). Give it an `href`, or use a `div` with `select`, `activate`, or `pressable`.

An editing host is left alone, so Space can type. A `[menuitem]` host (the attribute, or a `menuitem`, `menuitemcheckbox`, or `menuitemradio` role) is left alone on the key. This runtime still sees the menu's click, and a selectable menuitem row toggles on it.

A disabled host returns before any of that. Space is not `preventDefault`'d, no click is synthesized, and selection does not change.

Keys and clicks that start in an interactive descendant do not activate the row. The descendant is a `button`, `a`, `input`, `textarea`, `select`, `summary`, `[switch]`, `[icon-button]`, `[menuitem]`, an editing host, or an element whose first role token is one of the widget roles below. Space on those descendants is not `preventDefault`'d by this runtime.

Widget roles: `button`, `switch`, `checkbox`, `radio`, `link`, `menuitem`, `menuitemcheckbox`, `menuitemradio`, `option`, `tab`, `textbox`, `searchbox`, `combobox`, `slider`, `spinbutton`.

| Host | Space | Enter |
| --- | --- | --- |
| `<div touchable-row>` or `<li touchable-row>` | `defaultPrevented`. One click. | Not `defaultPrevented`. One click. |
| Repeat Enter or Space | No second click. | No second click. |
| `<button touchable-row>`, `<a href touchable-row>` | Not `defaultPrevented`. No synthesized click. | Not `defaultPrevented`. No synthesized click. |
| Disabled `div`, including `aria-disabled="true"` | Not `defaultPrevented`. No click. | Not `defaultPrevented`. No click. |
| `[menuitem]` or `role="menuitem"` | Not `defaultPrevented`. No synthesized click. A later click still selects when the row is selectable. | Same. |
| Contenteditable host | Left alone. The space is text. | Left alone. |
| Key or click on a trailing `button`, `[switch]`, `[icon-button]`, link, or field | The row does not activate. | The row does not activate. |

### Role and tabindex

A plain row is a layout shell. Sync does not give it a role or a tabindex, or it would enter the tab order just by being drawn. `dense` and `chevron` do not make it interactive.

Chrome is added only when the row is interactive, the author has not set that attribute, the host is not native, and the host is not a menuitem:

- `[pressable]` means the row is a press target.
- `[touchable-row~="select"]` means the row toggles selection.
- `[touchable-row~="activate"]` is the explicit opt-in.

The added role is `button` and the added tabindex is `0`. An author role or tabindex is kept, including `role="link"`. Native links and buttons already have a platform role and tab stop. Menuitems keep the role the menu runtime writes. A disabled row is not given a tab stop it did not already have. `destroy()` does not remove a role or tabindex this runtime added.

Pressable's own runtime does not add `role` or `tabindex`. On a `div` or `li` that has both attributes, this runtime supplies them.

### Selection

Independent toggles. There is no single-select group and no container. Activating one selectable row does not clear its siblings. Rows without `[touchable-row~="select"]` do not toggle. A keyboard click on a plain row still fires, so an author listener runs, and `[selected]` stays absent.

List has no runtime, and its `[selected]` wash is author state. Tabs are a different widget. Radio groups use the native `name` on inputs.

The written signal depends on the host:

- An `<a>`, or `role="link"`, gets `[selected]` plus `aria-current="true"` or `"false"`. Turning the row off writes `aria-current="false"` and, if `aria-selected` is still `"true"`, writes that to `"false"` too.
- Every other host gets `[selected]` plus `aria-selected="true"` or `"false"`. Turning the row off removes `[selected]`, writes `aria-selected="false"`, and writes `aria-current="false"` when that attribute is still a selected value.

CSS treats `[selected]`, `aria-selected="true"`, and `aria-current` other than `"false"` as selected. `getState().selected` reads that same trio. A row that was authored selected reports `selected: true` on the first look and does not dispatch. The next activation turns it off and does dispatch.

`aria-current` written by this runtime is the string `"true"`, not `"page"`. An author `aria-current="page"` already counts as selected, so the first toggle turns the row off.

### Long-press

Not implemented here. A row with `[pressable][pressable-longpress]` uses Pressable's `juice:longpress`. Pressable suppresses the click that follows a long-press on the capture phase (`preventDefault` and `stopPropagation`) unless that event was canceled.

Selection listens for `click` on the bubble phase, so the suppressed click never toggles. A later click does. Canceling `juice:longpress` leaves the click alone, and the selectable row toggles.

### Disabled

`:disabled` (the `disabled` property), `[disabled]`, and `[aria-disabled="true"]` are ignored entirely. No click is synthesized, selection does not change, and the attempt does not dispatch `juice:change`. Space is not `preventDefault`'d.

CSS sets `opacity: 0.5`, `cursor: default`, `color: var(--juice-touchable-row-ink)`, `background-color: transparent`, `background-image: none`, and `text-decoration: none`. It does not change `pointer-events`. `aria-disabled` does not swallow the click from here.

Pressable already drops its ring on a disabled host. A disabled `[switch]` inside a disabled row compounds opacity, because opacity multiplies. Disable the row or the switch. The focus outline is not removed. A focusable disabled host can still show the `2px` outline.

### Reduced motion

`prefers-reduced-motion: reduce` sets `transition: none` on the host and on the chevron. There is no motion role and no animation in this file. The runtime does not read the media query.

### Server render

`createTouchableRow()` returns a no-op controller when `window` or `document` is missing. `destroy`, `sync`, and `getState` do nothing, and `getState()` returns `null`. `startTouchableRowRuntime()` returns `null`. The auto-boot is inside the same guard, so a server import does not touch a DOM.

### Layout

The host is a nowrap row, `align-items: stretch`, `gap: 0`, `width: 100%`, `min-width: 0`. The start border is always `--juice-touchable-row-selected-width`. Block borders and the end border are `0`. Background is transparent.

`box-shadow: none` and `transform: none` are `(0, 2, 0)`. Pressable's hover ring and scale are `(0, 3, 0)` and win. Radius is set only without `[pressable]`, so Pressable's radius token wins when both are present. The default is the same `0.375rem`.

The leading slot uses `margin-inline-end` for the gap. The trailing slot uses `padding-inline-start`. The host gap stays `0`, so the hairline boxes touch. A flex gap would split the borders.

The hairline is `border-block-end` on the content slot, the trailing slot, and a direct title. It starts after the leading slot and stops at the row's padding edge. It is not under the chevron.

It paints only when the next sibling is another touchable row that is also not `undivided`. The last row has none. Either side's `undivided` word removes that boundary. A title inside content does not draw a second line.

The chevron is `::after`: `border-width: 0 2px 2px 0`, `rotate(-45deg)`. `::before` is not used. `:dir(rtl)` and `[dir="rtl"]` use `border-width: 0 0 2px 2px` and `rotate(45deg)`.

Pressable, spinner, progress, slider, and the accordion open bar keep `::before`. The mark is not on the trailing control, so `[switch]::after`, `[avatar][status]::after`, `[radio]::after`, and `[checkbox]::after` stay on those elements.

Minimum height is `44px` on every density. Dense padding is `0.5rem 0.75rem`, which is shorter than one line plus that padding, and `min-height` holds the box at `44px`. A title and a subtitle together grow past `44px` in both densities.

A direct `[touchable-row-title]` used to share the content rule. `display: flex` on that child beat `display: block` and `display: -webkit-box`, so the line could not ellipsize and `="clamp"` never became a box. Column flex stays on `[touchable-row-content]`. The direct title still grows (`flex: 1 1 auto`), and the hairline rule still borders it.

### Cascade

`:where()` keeps the host rules from adding element specificity. `[theme]` restates the same selectors one class higher.

| Selector | Specificity |
| --- | --- |
| `[theme] :where(a, button, li, div)[touchable-row]` | 0, 2, 0 |
| `[theme] :where(...)[touchable-row] > [touchable-row-content]` | 0, 3, 0 |
| `[theme] [touchable-row-title="clamp"]` | 0, 2, 0 |
| `[touchable-row-title]` | 0, 1, 0 |

The direct-child rule does not set `display`. The title and the clamp rules do. That is why a direct title truncates and clamps.

Hover, `:active`, and `:focus-visible` set `color` and `text-decoration` only. `background-color` would erase a `[list-item]` wash. `box-shadow` would erase the `[pressable]` ring. `transform` would erase `[pressable="scale"]`.

This file does not edit themes, `[list]`, `[table]`, `[pressable]`, `[switch]`, `[icon-button]`, `[badge]`, `[avatar]`, or `[safe-area]`.

### Why the bar, and why the ink is registered

The selected indicator is a `3px` `border-inline-start` in the body ink. It is not a background. The width is always the selected width. The color is transparent until the row is selected, so the bar does not change the text pair. This file does not paint a wash.

`--juice-touchable-row-ink` is a registered `<color>` (`@property`, `inherits: true`, initial value `#000`, replaced on `:root`). On `[theme]`, `currentColor` resolves to that element's body color, and the computed color inherits as an absolute value. No theme bind is required.

Selected, chevron, and subtitle all point at that ink. Subtitle is not a mix. Full ink leaves the body pair unchanged.

The divider is a 28% mix of that ink, the same weight as `--juice-list-divider`. It is a decorative hairline. It does not clear 3:1. Checked as the composited mix against each theme's page and against `--juice-surface-strong-bg` (translucent plates composited over the page first):

| Theme | Page | Strong |
| --- | ---: | ---: |
| Citrusmint | 1.46 | 1.51 |
| KiwiPress | 1.56 | 1.56 |
| Tide | 2.39 | 2.39 |
| Aquaflux | 1.68 | 1.68 |
| Afterburn | 2.31 | 2.17 |
| Arcade Glow | 2.24 | 2.27 |
| Boardwalk | 1.76 | 1.74 |
| Denim Dial | 1.77 | 1.77 |
| Forest Radio | 1.78 | 1.78 |
| Orchard Club | 1.78 | 1.78 |
| Poolside Pop | 1.81 | 1.81 |
| Signal Garden | 1.86 | 1.86 |
| Sunset Motel | 1.81 | 1.81 |
| Violet Parlor | 1.84 | 1.84 |

The bar is that same body ink against the unchanged plate, so its non-text contrast is the text pair. Every theme clears 3:1. Citrusmint is the floor. The chevron uses the same ink, so it shares these ratios.

| Theme | Page | Strong |
| --- | ---: | ---: |
| Citrusmint | 4.62 | 5.17 |
| KiwiPress | 7.60 | 7.60 |
| Tide | 15.66 | 15.66 |
| Aquaflux | 10.55 | 10.55 |
| Afterburn | 14.01 | 9.91 |
| Arcade Glow | 16.52 | 11.73 |
| Boardwalk | 13.85 | 12.99 |
| Denim Dial | 13.95 | 13.95 |
| Forest Radio | 14.20 | 14.20 |
| Orchard Club | 14.32 | 14.32 |
| Poolside Pop | 15.64 | 15.64 |
| Signal Garden | 16.72 | 16.72 |
| Sunset Motel | 15.63 | 15.63 |
| Violet Parlor | 15.75 | 15.75 |

Citrusmint's section plate (`--cm-surface-muted`) is already **4.22:1** for this ink. The row is transparent, so that pair is unchanged. The bar still clears 3:1 there. Those ratios are the token math in the stylesheet header. There is no automated contrast test for the tables.

<details>
<summary>Why the ink is registered</summary>

An unregistered `currentColor` would resolve on the row. A row inside Citrusmint muted copy (`p`, `span`, `li`, `label`) would then paint at **1.95:1** on the page and **2.18:1** on the strong surface. Registration captures the body ink before that happens.

A 92% `currentColor` mix for the subtitle is **4.03:1** on the Citrusmint page, under 4.5:1. Reaching 3:1 on the divider takes a 75% mix, which reads as a second bar.

</details>

### Roles

Color is restated on `[theme]`. A custom property resolves `var()` on the element that sets it. Geometry stays on `:root` only. Shipped library themes and generated `--jx-*` themes are not required to bind `--juice-touchable-row-*`. Do not add a touchable-row hue family.

| Role | Where | Default |
| --- | --- | --- |
| `--juice-touchable-row-ink` | `:root` and `[theme]` | `currentColor`, registered `<color>` |
| `--juice-touchable-row-divider` | `:root` and `[theme]` | `color-mix(in srgb, var(--juice-touchable-row-ink) 28%, transparent)` |
| `--juice-touchable-row-selected` | `:root` and `[theme]` | `var(--juice-touchable-row-ink)` |
| `--juice-touchable-row-chevron` | `:root` and `[theme]` | `var(--juice-touchable-row-ink)` |
| `--juice-touchable-row-subtitle` | `:root` and `[theme]` | `var(--juice-touchable-row-ink)` |
| `--juice-touchable-row-min-height` | `:root` only | `44px` |
| `--juice-touchable-row-padding` | `:root` only | `0.75rem 1rem` |
| `--juice-touchable-row-padding-dense` | `:root` only | `0.5rem 0.75rem` |
| `--juice-touchable-row-gap` | `:root` only | `0.75rem` |
| `--juice-touchable-row-gap-dense` | `:root` only | `0.5rem` |
| `--juice-touchable-row-radius` | `:root` only | `0.375rem` |
| `--juice-touchable-row-selected-width` | `:root` only | `3px` |
| `--juice-touchable-row-line-clamp` | `:root` only | `2` |

There is no motion role. This file does not set a `transition` on the host. That shorthand would replace `[pressable]`'s `box-shadow` transition. `prefers-reduced-motion: reduce` still sets `transition: none` on the host and on the chevron, so a theme button timing does not run.

The stack gap inside `[touchable-row-content]` is a fixed `0.125rem`. It is not a role. Title weight is `600`. Subtitle size is `0.875em`, weight `400`, line-height `1.35`. The chevron box is `0.45rem` with a `2px` corner. Those are not roles.

Focus is a `2px` solid `currentColor` outline, offset `2px`. Outline does not set `box-shadow`, so Pressable's pressed ring and this outline can both show.

### Composition

These conflicts are what the cascade leaves. This file does not edit the other components.

- **Pressable.** Pressable owns the ring, `[pressed]`, the scale variant, and the radius when both attributes are set. This file does not set a hover wash, a pressed wash, or an inset ring. `box-shadow: none` and `transform: none` are `(0, 2, 0)`. Pressable's hover ring and scale are `(0, 3, 0)` and win.
- Focus is the same `2px` outline and does not set `box-shadow`, so the ring and the outline can both show. A `div` or `li` with both attributes gets `role="button"` and `tabindex="0"` from this runtime when the author has not set them.
- A long-press that is not canceled suppresses the click, so the row does not select. A canceled long-press still selects. See [Pressable](./juice-pressable.md).
- **List.** List's hover and selected washes still paint when the element is a list item or sits inside one. This file does not add a wash. On Citrusmint the list 8% hover wash puts body ink at **4.16:1** and the 14% selected wash at **3.84:1**.
- The start bar against that 14% wash is **3.84:1** and still clears 3:1. List already records that those washes miss 4.5:1 on Citrusmint. That pair is a known issue. It is not fixed here.
- **Switch.** The thumb stays `::after` on the switch. Track size stays `2.75rem` by `1.5rem`. A click or key that starts on the switch does not toggle the row. A disabled switch inside a disabled row compounds opacity.
- **Icon button.** The trailing control keeps its own box (default `2.5rem`, under `44px`). The row is the 44px target. Do not nest a button in a button or an anchor. Use a `div` or `li` host.
- **Badge.** Keeps its own fill and ink. The 1% wash is the badge, not the row.
- **Avatar.** Status `::after` stays on the avatar. The leading slot does not clip it.
- **Safe area.** This file is forwarded before `safe-area.scss`. A row inside `[safe-area]` or `[safe-area="x"]` is `width: 100%` of that padded content box, with no negative margin, so the horizontal inset remains. The row's own padding is a second inset inside it.
- `[safe-area="x"]` on the row itself sets `padding-left` and `padding-right` after this file's shorthand, so those longhands keep the safe-area inset and the block padding stays the row's. See [Safe area](./juice-safe-area.md).
- **Menuitem.** Not this row. The menu runtime owns the key. Combining the attributes replaces the menu item's block layout with this flex row.
- **Table.** `tr` is not a host. The sort caret is `th[sortable] > button::after` and does not match this host.

The observer watches child list and `touchable-row`, `pressable`, `selected`, `disabled`, `role`, `tabindex`, `href`, `aria-disabled`, `aria-selected`, `aria-current`, and `menuitem`. It does not watch character data.

Removing `[touchable-row]` drops the host. `destroy()` stops that observation.

Later DOM changes schedule `sync()` on the next animation frame. [Sync](./juice-runtime-behavior.md#sync).

## Sig

`@citrusworx/sigjs/juice` binds 28 runtimes through `table` on master and in `@citrusworx/sigjs@0.7.2`. Touchable row is not one of them. `bind` does not name `touchable-row` or `pressable`. Neither is a `JuiceRuntimeName`.

This runtime does not call `bind`, and Juice does not import Sig. `juice:change` and `getState()` still work without Sig. State stays `{ selected: boolean, disabled: boolean }`.

## Not to be confused with

| This | Not this |
| --- | --- |
| 44px row | A single-select group |
| 44px row | `[list]` / `[list-item]` |
| 44px row | `[menuitem]` |
| 44px row | A table `tr` |

## Related

- [Attributes](./juice-attributes.md)
- [Theme contract](./juice-theme-contract.md)
- [Runtime behavior](./juice-runtime-behavior.md)
- [Pressable](./juice-pressable.md)
- [List](./juice-list.md)
- [Menu](./juice-menu-runtime.md)
- [Table](./juice-table.md)
- [Safe area](./juice-safe-area.md)
