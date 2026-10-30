# Table

A table is a sortable grid on `<table table>`. A `th[sortable]` cycles direction and each `tbody` follows.

Emerging. The twenty-eighth runtime. On master. Not in the published `@citrusworx/juiceui@0.9.2` release.

`createTable`, `initTable`, `startTableRuntime`, and `stopTableRuntime` are not in that npm cut.

Importing `@citrusworx/juiceui` enhances valid markup on master. [Automatic behavior](./juice-runtime-behavior.md#automatic-behavior). The published 0.9.2 package does not include this runtime.

## Markup

There is no HTML global `table` attribute. The host selector is `:where(table)[table]`, so `<div table>` is not painted. Do not style `[role="table"]` or `[role="grid"]`. `[aria-sort]` is styled only on `th[sortable]` inside this table. `[selected]` and `[aria-selected="true"]` are scoped to rows inside this table. Tabs own `aria-selected` on their triggers.

```html
<div table-scroll tabindex="0" role="region" aria-label="People">
  <table table striped>
    <caption>People</caption>
    <thead>
      <tr>
        <th sortable>Name</th>
        <th sortable numeric table-align="end">Age</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Ada Lovelace</td>
        <td numeric table-align="end">36</td>
      </tr>
      <tr selected>
        <td>Grace Hopper</td>
        <td numeric table-align="end">85</td>
      </tr>
    </tbody>
  </table>
</div>

<table table dense sticky>
  <thead>
    <tr>
      <th>Harbor</th>
      <th table-align="end" numeric>Boats</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><p>North slip</p></td>
      <td table-align="end" numeric>12</td>
    </tr>
  </tbody>
</table>
```

## Attributes

| Hook | What it does |
|---|---|
| `[table]` | Host, on a `<table>`. Separate borders, one grid, header and footer bands, inherited ink. Caption stays full ink. |
| `[striped]` | On `[table]`. Even `tbody` rows take the stripe wash. |
| `[dense]` | On `[table]`. Tighter cell and caption padding. |
| `[sticky]` | On `[table]`. `thead` cells stick to the top of the scrollport. |
| `[table-scroll]` | Horizontal scroll wrapper. Authors add `tabindex="0"`, `role="region"`, and an accessible name. |
| `[table-align="start"\|"center"\|"end"]` | On a `th` or `td`. Logical alignment. |
| `[numeric]` | On a `th` or `td`. `font-variant-numeric: tabular-nums`. Also marks the column numeric for sort. Does not set alignment. |
| `[selected]` | On a `tr`. Same wash as `aria-selected="true"`. Hover does not replace it. |
| `[sortable]` | On a `th` inside `[table]`. The runtime wraps the label in a button and sets `aria-sort`. |
| `data-sort-value` | On a body cell. The runtime compares this instead of the visible text. |

`[leading]` is letter-spacing. This table has no leading slot.

`[center]`, `[left]`, and `[right]` are layout utilities. Cell alignment is `[table-align]`, not `[center]`.

`[align]` belongs to `p` and `[section-header]`. `nav[sticky]` is a different selector.

Here sticky is `:where(table)[table][sticky]`. `[dense]` and `[selected]` are scoped to this table, the same way list scopes them.

`[striped]`, `[numeric]`, and `[sortable]` were free. Each is scoped so it does not paint outside `[table]`.

`[end]` is an app `[data-table]` hook and is not reused.

The host is `width: 100%`, `border-collapse: separate`, `border-spacing: 0`, no outer border, inherited color and font, `text-align: start`, radius `--juice-table-radius` (`0.375rem`). The plate is `--juice-surface-strong-bg`, with a white fallback (`#fff`) when that role is absent. Washes sit on that plate, not on the page.

Cells take `--juice-table-padding` (`0.75rem 1rem`), `vertical-align: middle`, and a `1px` hairline on the inline end and block end. The first cell in a row also takes the inline-start hairline.

The first row also takes the block-start hairline. Corner cells take the radius.

Header and footer cells are `font-weight: 600` and paint the header wash. Body cells stay transparent so the row wash shows.

The caption sits on top, `font-weight: 600`, full ink, with the same padding as a cell.

`[theme]` companions on those resets beat semantic defaults. `:where()` keeps the element type out of the specificity, so a later padding utility can still override the cell box.

Core CSS does not give the table an overlay `z-index`. Sticky header cells use `z-index: 1` so they paint above body cells in the same table. Nothing here is `z-index: 10` or `1000`. See [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands).

## Scroll, sticky, stripes, and density

`[table-scroll]` is `display: block`, `width: 100%`, `max-width: 100%`, `min-width: 0`, `overflow-x: auto`, and the table radius. Its background stays transparent. This slice does not set `tabindex`, `role`, or a name. Authors do:

```html
<div table-scroll tabindex="0" role="region" aria-labelledby="people-caption">
  <table table>
    <caption id="people-caption">People</caption>
    <!-- … -->
  </table>
</div>
```

`:focus-visible` on the wrapper is `outline: 2px solid currentColor` with `outline-offset: 2px`, the same ring as list. There is no `--juice-table-focus-ring`.

`overflow-x: auto` is a scrollport, and that scrollport also captures vertical sticky. A `[sticky]` head inside `[table-scroll]` sticks to the wrapper, not to the page. Omit the wrapper when the head should stick to the page. Give the wrapper a `max-height` when the body should scroll under the head.

```html
<div table-scroll tabindex="0" role="region" aria-label="Roster" style="max-height: 16rem">
  <table table sticky>
    <thead>
      <tr><th>Name</th><th numeric table-align="end">Age</th></tr>
    </thead>
    <tbody>
      <tr><td>Ada</td><td table-align="end" numeric>36</td></tr>
    </tbody>
  </table>
</div>
```

Sticky `thead` cells use `position: sticky` and `inset-block-start: 0`. One copy of a translucent surface still shows scrolled text.

Tide's strong surface is `0.78` alpha. The sticky plate stacks the strong surface five times and lays the header wash on top, so the scrolled rows disappear.

On an already-opaque plate (Citrusmint's white) the extra copies do not change the color. A selected sticky head uses the selected wash as that top layer.

`[striped]` paints `--juice-table-stripe` on even `tbody` rows (`tr:nth-child(even)`). Header and footer rows are not striped. `[dense]` sets caption and cell padding to `--juice-table-padding-dense` (`0.375rem 0.75rem`). Dense padding is not restated under `[theme]`.

`tbody` rows hover with `--juice-table-hover`. Header and footer rows do not hover. Background color eases with `--juice-motion-duration-fast` and `--juice-motion-ease-standard`. `prefers-reduced-motion: reduce` sets `transition: none` on those rows, on header and footer cells, and on the sort caret. See [Animations](./juice-animations.md#reduced-motion).

## Alignment and numeric cells

`[table-align="start"]`, `"center"`, and `"end"` set `text-align` on that `th` or `td`. Unmarked cells stay `start`.

`[numeric]` sets `font-variant-numeric: tabular-nums`. It does not align the cell. Pair it with `[table-align="end"]` for a figure column.

```html
<th sortable numeric table-align="end">Age</th>
<td numeric table-align="end">36</td>
```

One `[numeric]` cell in a column, on the header or in any body cell at that `cellIndex`, makes the whole column numeric for sorting. That includes every `tbody`. Tabular nums stay a CSS job. The runtime only reads the attribute.

## Selected rows

`[selected]` and `aria-selected="true"` share `--juice-table-selected`. On a `tbody` row the wash paints on the row. On a `thead` or `tfoot` row it paints on the cells, because those cells already have the header wash. Hover does not replace a selected row with the lighter hover wash.

```html
<tr selected>
  <td>Grace Hopper</td>
  <td>85</td>
</tr>
<tr aria-selected="true">
  <td>Ada Lovelace</td>
  <td>36</td>
</tr>
```

The runtime does not set `[selected]` or `aria-selected`. Selection is the author's.

## Sort indicator

`th[sortable]` inside `[table]` is the sort control. The runtime wraps that header's contents in `<button type="button">`. CSS resets the button to header text: no border, no shadow, no gradient, transparent background, inherited color and font, `width: 100%`, `cursor: pointer`. `:focus-visible` is the `2px` `currentColor` outline, offset `2px`.

The indicator is a `currentColor` caret on that button (`::after`). Unsorted, and `aria-sort="none"`, show both carets at `opacity: 0.45`. Ascending keeps the up caret at full opacity. Descending keeps the down caret at full opacity. Opacity is the only motion, and reduced motion removes it. There is no new color role.

`[table-align="center"]` on the header centers the button's contents. `[table-align="end"]` uses `justify-content: flex-end`. Unmarked headers keep the label and caret at the start.

## Cell ink

`p`, `span`, `li`, and `label` inside a cell or the caption use `color: inherit`. They take the body ink, not a theme's muted ink.

Citrusmint muted text is `2.18:1` on the plate. That pair fails body text. Those elements do not keep the muted color. Links, headings, and buttons keep their own color. `[fontColor]` loads later at the same specificity and still wins. The caption stays full ink for the same reason: a muted mix would drop Citrusmint.

## Roles

Color defaults are stated on `:root` and again on `[theme]`. Layout defaults are on `:root` only. Shipped library themes and generated `--jx-*` themes are not required to bind any `--juice-table-*` name. Bundled theme CSS does not contain these names.

A custom property resolves `var()` on the element that sets it. `currentColor` stays inside the color values and resolves where the cell paints. Geometry stays on `:root` so a theme does not have to restate lengths. Color is restated on `[theme]` for that reason. A formula that lived only on `:root` would still carry `currentColor`, and the restatement keeps the mix on the element that paints.

| Role | Where | Default |
|---|---|---|
| `--juice-table-border` | `:root`, `[theme]` | `color-mix(in srgb, currentColor 24%, transparent)` |
| `--juice-table-header-bg` | `:root`, `[theme]` | `color-mix(in srgb, currentColor 6%, transparent)` |
| `--juice-table-stripe` | `:root`, `[theme]` | `color-mix(in srgb, currentColor 4%, transparent)` |
| `--juice-table-hover` | `:root`, `[theme]` | `color-mix(in srgb, currentColor 6%, transparent)` |
| `--juice-table-selected` | `:root`, `[theme]` | `color-mix(in srgb, currentColor 8%, transparent)` |
| `--juice-table-padding` | `:root` only | `0.75rem 1rem` |
| `--juice-table-padding-dense` | `:root` only | `0.375rem 0.75rem` |
| `--juice-table-radius` | `:root` only | `0.375rem` |

See the [Theme Contract](./juice-theme-contract.md) and [Attributes](./juice-attributes.md).

## Theming

The grid, header band, stripe, hover, and selected washes are `currentColor` mixes, so they follow inherited ink on light and dark pages. Shipped themes do not bind `--juice-table-*`. No theme file is overridden.

The plate is the strong surface. Citrusmint body ink is `4.62:1` on its page.

A `currentColor` wash over that page drops under `4.5:1` past `1%`, which is too faint to see. The same ink on Citrusmint's strong surface (white) is `5.17:1`.

A `4%` stripe, a `6%` hover wash, a `6%` header wash, and an `8%` selected wash stay at or above `4.62:1` there. The selected wash is the floor.

Every other shipped theme has more room on both the page and the strong surface. Every shipped theme passes `4.5:1` on the plate.

Those ratios are sRGB alpha composites of the mixes over each theme's `--juice-surface-strong-bg` (alpha stripped). For every shipped theme that composite matches the surface painted over the page.

The border is a `24%` hairline (`1.42:1` on Citrusmint's plate, and under `3:1` on every shipped theme). It is decorative, not a control boundary. Do not use the hairline as the only separation between cells. Padding and the text do that work.

## JavaScript

Outside a browser, `startTableRuntime()` returns `null` and `createTable()` returns a controller whose methods do nothing (`getState()` returns `null`).

| Export | What it does |
| --- | --- |
| `createTable(options?)` | Controller for `options.root`, or the document. |
| `initTable(options?)` | Same call as `createTable`. |
| `startTableRuntime()` | Document controller. A second call syncs and returns it. Returns `null` when there is no document. |
| `stopTableRuntime()` | Destroys that controller and cancels a deferred boot. |

A custom-root controller can run beside the document runtime. Each click is claimed once. The header is wrapped once.

### Events

A real change of `{ column, direction }` dispatches a bubbling, composed [juice:change](./juice-runtime-behavior.md#juicechange) from the `<table>`. `detail` is `{ runtime: "table", state }`.

`getState()` reads that shape, or `null` when the host is missing. The first observation does not dispatch, including the `aria-sort="none"` written on first sync.

A later `sync()` that leaves the state unchanged does not dispatch. This surface stays Emerging and is on master, unreleased after 0.9.2.

Before a reorder, the table also dispatches a bubbling, cancelable, composed `juice:sort`. That event is separate from `juice:change`. [Server-side sort](#server-side-sort).

### Options

```ts
type TableOptions = {
  root?: ParentNode;
  tableSelector?: string;
  sortableSelector?: string;
};
```

By default, Juice uses:

```ts
{
  root: document,
  tableSelector: '[table]',
  sortableSelector: 'th[sortable]',
}
```

A custom `root` limits sync to tables inside that root. When the root itself is a `<table>` that matches `tableSelector`, that host is managed too. Tables outside the root are left alone. A `th[sortable]` outside a managed table is left alone. `<div table>` is not a host.

### Controller

```ts
type TableSortDirection = 'ascending' | 'descending' | 'none';

type TableState = {
  column: number | null;
  direction: TableSortDirection;
};

type TableController = {
  destroy: () => void;
  sync: () => void;
  getState: (target?: HTMLElement | null) => TableState | null;
};
```

`column` is `null` when `direction` is `"none"`. Otherwise it is the active header's `cellIndex`.

`destroy()` removes the click listener, disconnects the observer, and cancels a scheduled sync. It unwraps buttons this runtime created and puts the original header nodes back.

It puts author `aria-sort` back (and removes `aria-sort` when the author had not set it). When this runtime had reordered rows, it puts each `tbody` back in the remembered order.

Shared sort memory for those tables is cleared, so a second live controller re-reads the restored DOM on its next sync. `getState()` returns `null` after destroy.

A second `destroy()` does nothing.

`sync()` walks each managed table, wraps new sortable headers, drops `[sortable]` from headers that lost it, and re-applies a client sort so rows added later join it. With no target, `getState()` uses the first managed `[table]` in the root. A target inside a table, including a cell or the sort button, resolves to that table. A node that is not a managed table and is not inside one returns `null`.

## Behavior

The runtime performs six main jobs:

1. Find `<table>` hosts that match `tableSelector`. Sync does not rewrite `[table]`. `<div table>` is ignored. A sortable cell outside a managed table is ignored
2. Wrap each `th[sortable]` in `<button type="button">`. Wrapping is idempotent. The accessible name is the header text. This runtime does not invent one
3. Cycle that column `ascending`, then `descending`, then `none` on each activation. One column is active. The active `th` gets `aria-sort="ascending"` or `"descending"`. Every other sortable `th` in that table gets `aria-sort="none"`
4. Reorder each `tbody` on its own. The footer stays put. `direction` `"none"` puts the remembered order back. Equal keys keep their original order
5. Adopt an author `aria-sort` of `ascending` or `descending` as the initial state. That adoption is not a client reorder. Server HTML can already be sorted. The next activation continues the cycle. The first such header in the table wins
6. Leave Escape, focus traps, and selection alone. Enter and Space stay with the browser: a native button turns them into a click. A key handler here would sort twice. Table does not participate in the overlay yield order. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering)

A disabled button, `aria-disabled="true"` on that button, `[disabled]` on the `th`, or `aria-disabled="true"` on the `th` does not activate. A header whose `cellIndex` is negative does not activate.

Activating a different column starts that column at `ascending`. The previous column returns to `aria-sort="none"`. Each table keeps its own state.

## Comparison

The sort key for a body cell, in order:

1. `data-sort-value` when that attribute is present, trimmed. An empty attribute is still present and sorts as an empty string
2. Otherwise the cell's text, with whitespace collapsed and trimmed
3. A missing cell at that index is an empty string

Numeric columns parse a finite decimal after trim, with commas removed (`10`, `1,000`, `1.10`, `-2`). A value that does not parse (`n/a`) sorts after every number, in both directions, and ties with other non-numbers. Text columns use `Intl.Collator` with `numeric: true` and `sensitivity: "base"` (case-insensitive, and `item2` before `item10`). Ties keep the original row order in both directions.

The original row order is the DOM order first observed while this runtime is not itself holding a client sort. Rows first seen during a client sort are appended to that memory, then the current sort is applied again. `sync()` after a row is added joins that row to the active sort.

## Column identity

Column identity is the header's `cellIndex`. Colspan and rowspan are not expanded into a visual grid. A body cell is the cell at that same `cellIndex`, or empty when the row has no cell there. A colspan on an earlier cell shifts later `cellIndex` values, so the sorted value can disagree with the painted column.

```html
<table table>
  <thead>
    <tr>
      <th sortable colspan="2">Name</th>
      <th sortable>Age</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>Ada</td><td>Lovelace</td><td>36</td></tr>
    <tr><td>Grace</td><td>Hopper</td><td>85</td></tr>
  </tbody>
</table>
```

The Age header's `cellIndex` is `1`. Sorting it compares `Lovelace` with `Hopper`, not `36` with `85`. Put one cell per column in each body row when the sort must follow the painted grid.

Sortable headers belong in `thead`. A `th[sortable]` inside `tbody` is not special. Its row is sorted with the other rows of that `tbody`.

## Server-side sort

Before a reorder, the table dispatches `juice:sort`. `detail` is `{ column, direction }`. `column` is the activated header's `cellIndex` even when `direction` is `"none"`. The event bubbles, is cancelable, and is composed.

If the listener calls `preventDefault()`, `aria-sort` and state still update and the rows stay put. That is the server-side path: read `detail`, fetch the next order, and leave the DOM to the server. `sync()` while that canceled sort is current refreshes the remembered order from the DOM and still does not reorder. The next activation that is not canceled sorts from the DOM order at that moment.

```ts
table.addEventListener("juice:sort", (event) => {
  event.preventDefault();
  const { column, direction } = event.detail;
  // column is the header cellIndex. direction is "ascending" | "descending" | "none".
});
```

A canceled sort still dispatches `juice:change`, because the state changed.

## DOM updates

Later DOM changes schedule `sync()` on the next animation frame. [Sync](./juice-runtime-behavior.md#sync).

The observer watches child-list changes and `table`, `sortable`, `numeric`, and `data-sort-value`. `[striped]`, `[dense]`, `[sticky]`, and `[table-align]` stay CSS. Removing `[sortable]` unwraps that header. `destroy()` stops that observation.

A click publishes on the event. It is not deferred to that frame.

## Sig `bind()`

`@citrusworx/sigjs/juice` `bind(host, runtime?)` accepts table. `JuiceRuntimeName` in `libraries/sig/src/juice.ts` includes `"table"`, `"avatar"`, and `"icon-button"`. The table matcher looks for a `<table table>` only. A `<div table>` is not a host. That matcher runs after the earlier ones, so a host that already matches stays on that runtime.

`bind(table)` seeds a signal from `getState()`. `bind(table, "table")` does the same.

Table is read-only. There is no Juice API to set sort, and `state.set` does not call a controller.

The next `juice:change` copies the host back over the signal. On a Juice build that does not export `startTableRuntime` (published `@citrusworx/juiceui` 0.9.1 and 0.9.2; the export is on master only), binding table throws `Sig juice bind: "table" needs a newer @citrusworx/juiceui that exports startTableRuntime.` The module still loads, and the other runtimes still bind.

Juice does not import Sig, and this runtime does not call `bind`.

`juice:change`, `juice:sort`, and `getState()` still work without Sig. Listen on the table, or call `getState()` on the controller.

## Accessibility

Authors own the accessible name of the scroll region. `[table-scroll]` does not set `tabindex`, `role`, or a name. A keyboard user needs `tabindex="0"` so the overflow can be scrolled. `role="region"` with `aria-label` or `aria-labelledby` names that region. The caption can be the name (`aria-labelledby` pointing at the caption).

The sort button's name is the header text the runtime wrapped. Do not put a second name on the button. The runtime will not add `aria-label`. `aria-sort` on the `th` is how the direction is exposed: `ascending`, `descending`, or `none`.

Enter and Space activate the native button. This runtime does not listen for those keys.

`[selected]` is visual. When the row is selected in a widget, set `aria-selected="true"` as well. CSS paints both. The runtime writes neither.

The hairline is decorative and sits under `3:1`. It is not a control boundary.

`:focus-visible` on the sort button and on `[table-scroll]` is a `2px` `currentColor` outline, offset `2px`. A static cell has no focus ring because it is not a control.

## Limitations

- There is no `Table()` factory. Author the markup and let the runtime enhance it.
- Hosts are real `<table>` elements only, via `:where(table)[table]`. `<div table>` is not painted and is not sorted.
- `[table-scroll]` does not set `tabindex`, `role`, or an accessible name. Authors do. A sticky head inside that wrapper sticks to the wrapper. Omit the wrapper for page sticky. Set `max-height` on the wrapper when the body should scroll under the head.
- `cellIndex` is not a visual column. Colspan and rowspan are not expanded. A sortable header belongs in `thead`. A `th[sortable]` in `tbody` is sorted with that body's rows.
- One `[numeric]` cell makes the column numeric, in every `tbody`. Values that do not parse sort last, in both directions.
- An author `aria-sort` of `ascending` or `descending` is adopted and does not reorder until the next activation.
- `destroy()` restores header contents, author `aria-sort`, and row order when this runtime had reordered them.
- A canceled `juice:sort` updates `aria-sort` and state and leaves the rows in place.
- Enter and Space stay with the browser. Disabled headers do not sort.
- The runtime does not set `[selected]` or `aria-selected`. It does not invent a header name.
- There is no focus trap and no Escape handling. Table is not a layered overlay. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering).
- Sticky header cells use `z-index: 1` inside the table. There is no overlay z-index. See [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands).
- Sig `bind()` accepts this runtime and stays read-only. A Juice build without `startTableRuntime` throws `needs a newer @citrusworx/juiceui`. See [Sig `bind()`](#sig-bind).
- Shipped themes do not bind `--juice-table-*`. The plate is `--juice-surface-strong-bg`, with white when that role is absent.
- Cell `p`, `span`, `li`, and `label` use body ink. Citrusmint muted text is `2.18:1` on the plate.
- Borders stay a decorative hairline under `3:1`. The selected-wash floor on Citrusmint is `4.62:1`.
- A bare `<table>` without `[table]` is not restyled.

## Not to be confused with

| This | Not this |
| --- | --- |
| Sortable `<table table>` | `[list]`, a stack of rows |
| This grid | The dashboard `[data-table]` hook |
| Attribute host | `[role="table"]` or `[role="grid"]` (CSS does not style those roles) |

## Related

- [Attributes](./juice-attributes.md)
- [Theme contract](./juice-theme-contract.md)
- [Runtime behavior](./juice-runtime-behavior.md)
- [List](./juice-list.md)
