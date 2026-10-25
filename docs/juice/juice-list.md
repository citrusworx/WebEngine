# Juice List

This document explains the current list chrome in `libraries/juice/src/components/list/list.scss` (monorepo path; outside this vault).

List is CSS-only. Importing the core stylesheet is enough. There is no JS entry, no `createList`, no auto-enhance, and no `List()` Sig factory. Markup is the contract.

This surface is Emerging, not Stable. It is on master and is not in the published `@citrusworx/juiceui@0.9.2` npm cut. It is not one of the twenty-eight Emerging auto-enhance runtimes. That count stays twenty-eight. There is no `juice:change`, no `getState()`, and `@citrusworx/sigjs/juice` `bind()` does not accept it. There is no runtime to infer and no `JuiceRuntimeName` for it.

List is a stack of rows. It is distinct from an anchored menu (`[menu]` / `[menuitem]`), a combobox listbox (`[combobox-list]`), a tab strip (`[tabs-list]`), a page set (`[pagination]`), and a trail (`[breadcrumb]`). Those have their own attributes and, except for this list, their own runtimes.

## Markup

HTML `list` is not a global attribute, and there is no `<list>` element. `<input list>` points at a `<datalist>`. The host selector is `:where(ul, ol, div)[list]`, so an input is not painted. Do not style `[role="list"]` or `[role="listitem"]`. `[selected]` paint is scoped to `[list-item]`, so `<option selected>` is a different attribute use. Do not style a bare `[aria-current]` outside this list. Breadcrumb and pagination own theirs.

```html
<ul list>
  <li list-item>
    <span list-leading><span avatar aria-label="Ada Lovelace">AL</span></span>
    <div list-content>
      <span>Ada Lovelace</span>
      <span list-secondary>Analytical engine</span>
    </div>
    <span list-trailing>1843</span>
  </li>
  <li list-item>
    <span>Grace Hopper</span>
    <span list-secondary>Compiler</span>
  </li>
</ul>

<ol list divided>
  <li list-item>First</li>
  <li list-item>Second</li>
</ol>

<div list dense>
  <div list-item>Compact row</div>
</div>
```

| Attribute | What it is |
|---|---|
| `[list]` | Stack on `ul`, `ol`, or `div`. Markers and the list’s own padding reset. Rows stack with `--juice-list-gap` (default `0`, so a divided list’s rules meet). |
| `[divided]` | On `[list]`. A hairline between direct children. Ignored without `[list]`. |
| `[dense]` | On `[list]`. Tighter row padding and a tighter slot margin. Does not change the stack gap. Ignored without `[list]`. |
| `[list-item]` | One row. |
| `[list-leading]` | Start slot. |
| `[list-content]` | Primary line plus an optional `[list-secondary]`. |
| `[list-secondary]` | Second line. |
| `[list-trailing]` | End slot. |
| `[selected]` | Visual wash on the row or its `a` / `button`. |

`[leading]` is letter-spacing (`"1px"` through `"10px"`). The slot is `[list-leading]`, not `[leading]`. See [Attributes](./juice-attributes.md).

The host is a column flex, `width: 100%`, `list-style: none`, margin and padding `0`, transparent background, inherited color and font, `text-align: start`. `[theme]` companions on those resets beat semantic defaults such as `[theme="…"] :where(div)` fills, `:where(li)` color, `:where(a)` link color, and `:where(button)` call-to-action paint. `:where()` keeps the element type out of the specificity, so a later padding or width utility can still override the row box.

Core CSS does not give `[list]` or `[list-item]` a z-index. Rows are inline. Nothing here is `z-index: 10` or `1000`. See [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands).

## Slots

The layout box is the row, unless the row wraps a single `a` or `button`. Then that control is the layout box and the hit target. The box is a grid: `auto minmax(0, 1fr) auto`, two rows, padding `--juice-list-padding` (`0.75rem 1rem`), radius `--juice-list-radius` (`0.375rem`).

```html
<li list-item>
  <span list-leading><span icon>user</span></span>
  <div list-content>
    <span>Primary line</span>
    <span list-secondary>Second line</span>
  </div>
  <span list-trailing>Meta</span>
</li>
```

| Slot | Placement |
|---|---|
| `[list-leading]` | Column 1, both rows. `margin-inline-end: 0.75rem`. |
| `[list-content]` | Column 2, both rows. A column flex. |
| `[list-trailing]` | Column 3, both rows. `margin-inline-start: 0.75rem`. |
| `[list-secondary]` | Second line. Nested in `[list-content]`, or a sibling under the primary element. |

One unmarked element between the slots is the same primary line. `[list-content]` is optional when that is all the row needs.

```html
<li list-item>
  <span list-leading><span avatar>GH</span></span>
  <span>Grace Hopper</span>
  <span list-secondary>Compiler</span>
  <span list-trailing>1952</span>
</li>
```

The grid collapses to one column (`minmax(0, 1fr)`) only when the row has neither a leading slot nor a trailing slot. A row that has only one of those slots keeps the three-column track, so the label stays in column 2.

The slot margin is structural. It is not `--juice-list-gap`. A stack gap of `0` would otherwise glue an avatar to the label. Leading and trailing are `inline-flex` with `gap: 0.5rem` between their own children. `[list-content]` stacks its lines with `gap: 0.125rem`. A sibling `[list-secondary]` uses `margin-top: 0.125rem` instead.

`[list-leading]` and `[list-trailing]` do not size or clip `[avatar]` or `[icon]`. Those components keep their own box (`flex: 0 0 auto`). Overflow on the slot stays visible, so an avatar status dot keeps its rim.

Long primary and secondary lines ellipsize (`overflow: hidden`, `text-overflow: ellipsis`, `white-space: nowrap`). Bare text in `[list-content]` wraps (`overflow-wrap: anywhere`) so an unbreakable string does not widen the row. Secondary ink is `--juice-list-secondary`, at `0.875em` and `line-height: 1.35`. Weight is inherited.

## Divided and dense

`[divided]` and `[dense]` paint only on `:where(ul, ol, div)[list]`. A bare `[divided]` or `[dense]` elsewhere is not this chrome.

`[divided]` draws `border-top: 1px solid var(--juice-list-divider)` between direct children (`> * + *`), not only between `[list-item]`. A divided stack of plain rows still rules between them. The hairline is declared after the list’s `border: none`, and the same rule is restated under `[theme]`, so a theme border reset does not eat it. The default stack gap is `0`, so the rules meet the rows.

```html
<ul list divided>
  <li list-item>Notes</li>
  <li list-item>Letters</li>
</ul>
```

`[dense]` sets row padding to `--juice-list-padding-dense` (`0.375rem 0.75rem`) and the slot margin to `0.5rem`. It does not change `--juice-list-gap`. Dense padding and dense slot margins are not restated under `[theme]`. The divided hairline is.

```html
<ul list dense>
  <li list-item>
    <span list-leading><span icon>folder</span></span>
    <span>Compact</span>
  </li>
</ul>
```

`[list][divided][dense]` is both: the hairline stays, and the rows use the tighter padding.

## Interactive rows

The item is an `a` or `button`, or it wraps one. Hover, `:active`, and `:focus-visible` paint on that control. A static row does not hover.

```html
<ul list>
  <li list-item>
    <a href="/ada">Ada Lovelace</a>
  </li>
  <li list-item>
    <button type="button">Choose a harbor</button>
  </li>
</ul>

<div list>
  <a list-item href="/now">Current page</a>
  <button type="button" list-item>Action row</button>
</div>
```

Prefer `ul` / `ol` with `li` when the rows are a list. A `div[list]` of controls is a stack, and the author sets roles when the stack should be announced as a list. CSS does not set `role`.

Interactive rows clear theme button and link chrome: `appearance: none`, transparent background, no border, no shadow, no transform, `cursor: pointer`, inherited color and font, `text-align: start`, no underline. Theme button lift (`translate`) is cleared. There is no press offset.

| State | Paint |
|---|---|
| Hover | `--juice-list-hover` |
| `:active` | `--juice-list-selected` |
| `:focus-visible` | `outline: 2px solid currentColor` with `outline-offset: 2px` |

The ring is the same 2px `currentColor` outline as the icon-button focus-ring default. There is no `--juice-list-focus-ring`. `:focus-visible` also clears `box-shadow` and `transform` so a theme focus ring does not stack on the outline.

Background and color transition with `--juice-motion-duration-fast` and `--juice-motion-ease-standard`. `prefers-reduced-motion: reduce` sets `transition: none` on those controls. See [Animations](./juice-animations.md#reduced-motion).

## Selected, current, and disabled

`[selected]` and `[aria-current]` other than `"false"` share `--juice-list-selected`. Any other `aria-current` value paints, including `page`, `true`, `step`, `location`, `date`, and `time`. `aria-current="false"` does not.

The wash can sit on a static row, on an `a` or `button` that is the item, on the control inside a row that carries the attribute, or on the inner control itself. When the row wraps a control, the wash paints on the control.

```html
<ul list>
  <li list-item selected>Chosen, static</li>
  <li list-item>
    <a href="/now" aria-current="page">Current page</a>
  </li>
  <li list-item selected>
    <a href="/ada">Selected link</a>
  </li>
</ul>
```

A selected or current control stays on the selected wash while hovered or pressed. Hover does not replace it with the lighter wash.

Disabled is native `:disabled`, `[disabled]`, or `[aria-disabled="true"]`, at `opacity: 0.5`, with `cursor: not-allowed`. The background stays transparent, including on hover and `:active`, so a disabled selected row does not keep the selected wash. The rule matches an `a` or `button` that is the item, a control inside a row that carries `[disabled]` or `[aria-disabled="true"]`, or a disabled control inside the row. A static row with `[disabled]` and no control is not dimmed. `:disabled` matches a native button. An anchor needs `[disabled]` or `[aria-disabled="true"]`.

```html
<ul list>
  <li list-item>
    <button type="button" disabled>Closed</button>
  </li>
  <li list-item aria-disabled="true">
    <a href="/later">Not yet</a>
  </li>
</ul>
```

## Roles

Color defaults are stated on `:root` and again on `[theme]`. Layout defaults are on `:root` only. Shipped library themes and generated `--jx-*` themes are not required to bind any `--juice-list-*` name. Bundled theme CSS does not contain these names.

A custom property resolves `var()` on the element that sets it. `currentColor` stays inside the color values and resolves where the row paints. Geometry stays on `:root` so a theme does not have to restate lengths.

| Role | Where | Default |
|---|---|---|
| `--juice-list-divider` | `:root`, `[theme]` | `color-mix(in srgb, currentColor 28%, transparent)` |
| `--juice-list-secondary` | `:root`, `[theme]` | `color-mix(in srgb, currentColor 92%, transparent)` |
| `--juice-list-hover` | `:root`, `[theme]` | `color-mix(in srgb, currentColor 8%, transparent)` |
| `--juice-list-selected` | `:root`, `[theme]` | `color-mix(in srgb, currentColor 14%, transparent)` |
| `--juice-list-gap` | `:root` only | `0` |
| `--juice-list-padding` | `:root` only | `0.75rem 1rem` |
| `--juice-list-padding-dense` | `:root` only | `0.375rem 0.75rem` |
| `--juice-list-radius` | `:root` only | `0.375rem` |

See the [Theme Contract](./juice-theme-contract.md) and [Attributes](./juice-attributes.md).

## Theming

Divider, secondary ink, and the hover and selected washes are `currentColor` mixes, so they follow inherited ink on light and dark pages. Shipped themes do not bind `--juice-list-*`. This file does not override a theme.

The list file records a check against KiwiPress (light), Tide (dark), and Aquaflux: ink on the 8% hover wash and the 14% selected wash stays above 4.5:1 there. Secondary is `currentColor` at 92% so it still clears that selected wash on KiwiPress, the light pair with the least room. Citrusmint’s body ink is already 4.62:1 on its page, so the same washes drop that pair under 4.5:1.

The divider is a decorative hairline, under 3:1 on the page. It is not a control boundary.

Color is restated on `[theme]` for the same custom-property reason as skeleton. A formula that lived only on `:root` would not be the issue here — these mixes do not read a theme surface token — but `currentColor` still has to stay in the value and resolve on the row. Geometry is not restated.

## Accessibility

Use real list semantics. `ul` / `ol` and `li` announce as a list. CSS does not set `role="list"` or `role="listitem"`, and it does not style those roles. A `div[list]` is a stack until the author adds roles.

`[selected]` is visual only. It does not set `aria-selected` or `aria-current`. Pair it with the attribute that matches the widget: `aria-current` (other than `"false"`) for a current item in a set of links, `aria-selected` when the row is an option in a selection widget. CSS paints `[selected]` and `aria-current`. CSS does not paint `aria-selected`. A selection that should look selected needs `[selected]` as well as `aria-selected`.

Authors own the accessible name. Chrome does not write a label.

Authors own whether `aria-disabled` swallows a click. Opacity does not remove a control from the tab order, and it does not cancel activation. A native `disabled` button does that on its own. An `<a href>` with `[disabled]` or `aria-disabled="true"` is dimmed and still needs the author to keep it from navigating. This chrome does not.

Dividers are borders, not elements. They are decorative and sit under 3:1. Do not use the hairline as the only separation between rows. Padding and the text do that work.

`:focus-visible` is a 2px `currentColor` outline, offset 2px, on the `a` or `button`. A static row has no focus ring because it is not a control.

## Limitations

- CSS-only. No `List()` factory, no `createList`, and no auto-enhance. The JS entry does not boot a list runtime. There is no `juice:change` and no `getState()`. `@citrusworx/sigjs/juice` `bind()` does not accept `[list]`.
- Emerging, not Stable. On master, and not in the published `@citrusworx/juiceui@0.9.2` npm cut. The twenty-eight Emerging auto-enhance runtimes stay twenty-eight.
- Hosts are `ul`, `ol`, and `div` only, via `:where(ul, ol, div)[list]`. `<input list>` is not painted. There is no `<list>` element.
- `[divided]` and `[dense]` apply only with `[list]` on that host. `[dense]` tightens padding and the slot margin. It does not change the stack gap.
- `[leading]` is letter-spacing. The slot is `[list-leading]`.
- `[selected]` and `aria-current` other than `"false"` share one wash. `aria-selected` does not paint. `[selected]` does not write ARIA.
- Disabled opacity `0.5` applies to interactive `a` / `button` rows. A static row with `[disabled]` and no control is not dimmed. Disabled clears the hover and selected washes. The author owns click suppression for `aria-disabled`.
- There is no `--juice-list-focus-ring`. The focus outline is `2px solid currentColor`, offset `2px`. Theme button lift is cleared. There is no press offset.
- Primary and secondary lines ellipsize. Bare text in `[list-content]` wraps.
- There is no z-index elevation. List rows are inline. See [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands).
- Shipped themes do not bind `--juice-list-*`. Color on `[theme]` follows inherited ink. The divider stays a decorative hairline under 3:1. Citrusmint’s body ink on these washes is the pair the list file calls out as under 4.5:1.

## Where this sits

Cards, badges, stats, and skeleton are the other CSS-only structural hooks: markup plus core paint, no runtime. List follows that shape. Skeleton holds a loading shape. List holds the rows that replace it. See [Skeleton](./juice-skeleton.md), [Cards](./juice-cards.md), [Styles](./juice-styles.md), [Attributes](./juice-attributes.md), and the [maturity matrix](./juice-maturity-matrix.md).

Menu, combobox, tabs, pagination, and breadcrumb keep their own names. Do not point `[list]` at those jobs. See [Menu Runtime](./juice-menu-runtime.md), [Combobox Runtime](./juice-combobox-runtime.md), [Tabs Runtime](./juice-tabs-runtime.md), [Pagination Runtime](./juice-pagination-runtime.md), and [Breadcrumb Runtime](./juice-breadcrumb-runtime.md).
