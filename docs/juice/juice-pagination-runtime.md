# Pagination

Pagination is a page set on `[pagination]`. Prev and next disable at inferable ends, Arrow, Home, and End move among enabled controls, and the landmark name is `Pagination`. It is not a router.

Emerging. The nineteenth runtime. Shipped in `@citrusworx/juiceui@0.9.2`.

Importing `@citrusworx/juiceui` enhances valid markup. See [Automatic behavior](./juice-runtime-behavior.md#automatic-behavior).

## Markup

```html
<nav pagination>
  <a pagination-prev href="?p=1">Prev</a>
  <a href="?p=1">1</a>
  <a href="?p=2">2</a>
  <a href="?p=3">3</a>
  <a pagination-next href="?p=2">Next</a>
</nav>

<ol pagination aria-label="Result pages">
  <li pagination-item><a pagination-prev href="?p=1">Prev</a></li>
  <li pagination-item><a href="?p=2" aria-current="page">2</a></li>
  <li pagination-item><a pagination-next href="?p=3">Next</a></li>
</ol>

<nav pagination>
  <a pagination-prev href="?p=4">Prev</a>
  <span pagination-ellipsis aria-hidden="true">…</span>
  <a href="?p=5">5</a>
  <a href="?p=6" aria-current="page">6</a>
  <span pagination-status>Page 6 of 12</span>
  <a pagination-next href="?p=7">Next</a>
</nav>
```

`[pagination]` is the page set and `[pagination-item]` is one cell. Anchors and buttons are enough.

## Attributes

| Hook | What it does |
| --- | --- |
| `[pagination]` | Page-set root. Typical hosts are `nav` and `ol`. A plain element is enhanced too. |
| `[pagination-item]` | One cell. Layout only. |
| `[pagination-link]` | Optional control. An anchor or `button` is enough. |
| `[pagination-prev]` | Previous control. The attribute may sit on the control or on the item that wraps it. |
| `[pagination-next]` | Next control. The attribute may sit on the control or on the item that wraps it. |
| `[pagination-ellipsis]` | Gap marker. Not a page control. |
| `[pagination-status]` | Optional text, such as "Page 2 of 12". Ends are not parsed from it. |

A boolean `[pagination]` attribute is enough. There is no HTML global `pagination` attribute. `nav[type="pagination"]` is an older layout and this runtime ignores it. Nested page sets stay independent.

Theme paint uses `--juice-pagination-*` roles (`surface`, `surface-hover`, `surface-current`, `ink`, `ink-hover`, `ink-current`, `ink-disabled`, `border`, `focus-ring`, `ellipsis`). The trail stays transparent; `surface` is the page control, not a bar.

## JavaScript

| Export | What it does |
| --- | --- |
| `createPagination(options?)` | Controller for `options.root`, or the document. |
| `initPagination(options?)` | Same call as `createPagination`. |
| `startPaginationRuntime()` | Document controller. A second call syncs and returns it. Returns `null` when there is no document. |
| `stopPaginationRuntime()` | Destroys that controller and cancels a deferred boot. |

A custom-root controller can run beside the document runtime, and each click or key event is claimed once.

### Options

| Option | Default | Notes |
| --- | --- | --- |
| `root` | `document` | Queries `root`, and includes `root` when it is a page set. The document when omitted. |
| `paginationSelector` | `[pagination]` | Page-set root. |
| `itemSelector` | `[pagination-item]` | Cells. Layout only. |

### Controller

| Method | What it does |
| --- | --- |
| `destroy()` | Removes click and keydown listeners, disconnects the observer, and cancels a scheduled sync. |
| `sync()` | Applies the landmark, current-page, and end rules on each root. |
| `setCurrent(itemOrIndex, pagination?)` | Moves the single `aria-current="page"` to a page control or page index, then refreshes prev and next. It does not change the URL. |
| `getCurrent(target?)` | The 0-based page index, or `-1`. |
| `getState(target?)` | `{ current: number }`, or `null`. |

An element passed to `setCurrent()` resolves to the page control that contains it. A link or button inside the cell is marked when the argument is that element. Otherwise the cell's link or button is marked, or the cell itself.

Prev and next are not page indexes. A non-integer index, or an index that matches no page control, is a no-op. When `pagination` is omitted, an index uses the first root. A later `sync()` keeps an existing current.

### Events

A real page change dispatches a bubbling [juice:change](./juice-runtime-behavior.md#juicechange) from `[pagination]`. `detail` is `{ runtime: "pagination", state: { current: number } }`. `current` is the 0-based page index, or `-1` when none are current; `getCurrent()` and `getState()` read it, and a write that leaves `current` unchanged does not dispatch.

## Accessibility

- Sync makes the root a navigation landmark only when that keeps an author role and list semantics. `nav` does not receive a redundant `role="navigation"`.
- An element with no role that is not `ol`, `ul`, or `menu` gets `role="navigation"`. Those lists stay lists and are not labeled. An author role is kept, including `role="group"`. Ancestor `nav` elements are not relabeled.
- When the root is a navigation landmark and `aria-label`, `aria-labelledby`, and `title` are missing or blank, sync sets `aria-label="Pagination"`. A non-empty author name is kept, including a non-empty `title`. That is the only string this runtime invents.
- One `aria-current="page"` is kept. The runtime does not rewrite `href`.
- ArrowLeft and ArrowUp move focus to the previous enabled control. ArrowRight and ArrowDown move to the next. Home and End move to the first and last enabled control.
- That set is page controls plus prev and next. Ellipsis, status, and disabled controls are skipped. Focus does not wrap. An arrow at an end is handled and focus stays.
- Enter and Space stay with the browser. Alt, Ctrl, Meta, and Shift are ignored. Keys from `input`, `textarea`, `select`, or `contenteditable` are ignored.
- Escape is not handled. See [Escape and layering](./juice-runtime-behavior.md#escape--layering).
- There is no focus trap. Tab is not wrapped. The runtime does not set `tabindex`.
- Core CSS does not give `[pagination]` a z-index. It is inline nav chrome. See [Z-index bands](./juice-runtime-behavior.md#z-index-bands).

## Behavior

1. Find `[pagination]` roots, ignore `nav[type="pagination"]`, and keep nested page sets independent.
2. Make the root a navigation landmark only when that keeps list semantics and an author role.
3. Name an unlabeled navigation landmark `Pagination`.
4. Keep a single `aria-current="page"`, using an author current when one exists, otherwise the first page control.
5. Disable prev and next at the ends when page controls and ellipsis make that inferable.
6. Move focus with Arrow, Home, and End among enabled controls, without wrapping.
7. `setCurrent()` moves the current page by control or index, without navigating, and refreshes the ends.

### Current page

The first `aria-current="page"` in tree order stays, including one on the root. Any others in that root are removed. When none is set, the first page control is marked on its link or button when it has one. A set with no page control is left without a current page. Ellipsis and status are not that fallback. A later `sync()` keeps the first current.

### Ends

Prev is disabled when the current page is the first page control and no ellipsis sits before it. Prev is also disabled when that control's trimmed text or `aria-label` is only digits and equals 1. Next is disabled when the current page is the last page control and no ellipsis sits after it. A single page control with no ellipsis disables both ends.

A set with no page control, or a current that is not on a page control, does not infer either end. Status text is not parsed. Author-owned disabled (`aria-disabled="true"`, native `disabled`, or `[disabled]` already present) is never cleared.

Runtime-owned disabled is `aria-disabled="true"`. A button also gets the `disabled` property. An anchor gets `aria-disabled` only, and a disabled link click is cancelled.

<details>
<summary>Edge cases</summary>

- `setCurrent()` with a non-integer index, or an index that matches no page control, does nothing.
- When `pagination` is omitted, an index applies to the first root. Prev and next are not page indexes.
- A later `sync()` does not move the marker back to the first page control. It does refresh the ends. Runtime-owned disabled clears when the current page leaves that end.
- The observer watches child list changes and `pagination`, `pagination-item`, `pagination-link`, `pagination-prev`, `pagination-next`, `pagination-ellipsis`, `pagination-status`, `aria-current`, `aria-label`, `aria-labelledby`, `aria-disabled`, `disabled`, `role`, and `title`.

</details>

### Limits

- There is no `Pagination()` factory.
- `setCurrent()` does not change the URL, follow a link, or remove `href`.
- `nav[type="pagination"]` is not enhanced.
- Ends come from page controls and ellipsis, not from `[pagination-status]`.
- There is no focus trap and no Escape handling.

Later DOM changes schedule `sync()` on the next animation frame. [Sync](./juice-runtime-behavior.md#sync).

## Not to be confused with

| This | Not this |
| --- | --- |
| Page set, prev and next disabled at inferable ends, Arrow, Home, and End among enabled controls, landmark name `Pagination` | A router |
| `[pagination]` | A breadcrumb |
| `[pagination]` | Site navigation, or `nav[type="pagination"]` |
| `[pagination]` | Tabs, or a wizard step tracker |

## Related

- [Attributes](./juice-attributes.md)
- [Theme contract](./juice-theme-contract.md)
- [Runtime behavior](./juice-runtime-behavior.md)
- [Modal](./juice-modal-runtime.md)
- [Drawer](./juice-drawer-runtime.md)
- [Toast](./juice-toast-runtime.md)
- [Popover](./juice-popover-runtime.md)
- [Wizard](./juice-wizard-runtime.md)
- [Tooltip](./juice-tooltip-runtime.md)
- [Combobox](./juice-combobox-runtime.md)
- [Banner](./juice-banner-runtime.md)
- [Menu](./juice-menu-runtime.md)
- [Switch](./juice-switch-runtime.md)
- [Slider](./juice-slider-runtime.md)
- [Checkbox](./juice-checkbox-runtime.md)
- [Radio](./juice-radio-runtime.md)
- [Breadcrumb](./juice-breadcrumb-runtime.md)
- [Progress](./juice-progress-runtime.md)
