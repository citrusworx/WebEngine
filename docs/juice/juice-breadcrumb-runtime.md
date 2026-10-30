# Breadcrumb

Breadcrumb is a light trail on `[breadcrumb]`, with one `aria-current="page"` and landmark name `Breadcrumb`. It is not a router.

Emerging. Shipped in `@citrusworx/juiceui@0.9.2`.

Importing `@citrusworx/juiceui` enhances valid markup. See [Automatic behavior](./juice-runtime-behavior.md#automatic-behavior).

## Markup

```html
<nav breadcrumb>
  <span breadcrumb-item><a href="/">Home</a></span>
  <span breadcrumb-item><a href="/docs">Docs</a></span>
  <span breadcrumb-item><a href="/docs/breadcrumb">Breadcrumb</a></span>
</nav>

<ol breadcrumb aria-label="You are here">
  <li breadcrumb-item><a href="/">Home</a></li>
  <li breadcrumb-item>Page</li>
</ol>

<nav breadcrumb>
  <a href="/">Home</a>
  <a href="/docs">Docs</a>
</nav>
```

`[breadcrumb]` is the trail and `[breadcrumb-item]` is one crumb. Anchors inside the trail are enough.

## Attributes

| Hook | What it does |
| --- | --- |
| `[breadcrumb]` | Trail root. Typical hosts are `nav` and `ol`. A plain element is enhanced too. |
| `[breadcrumb-item]` | One crumb. It belongs to the nearest `[breadcrumb]`. |
| `[breadcrumb-link]` | Optional. An anchor in the trail is enough. |
| `[breadcrumb-separator]` | Optional and author-owned. It suppresses the generated chevron. |

A boolean `[breadcrumb]` attribute is enough. There is no HTML global `breadcrumb` attribute. The separator chevron is `::after` on every item except the last. `nav[type="breadcrumb"]` is an older layout and this runtime ignores it.

Theme paint uses `--juice-breadcrumb-*` roles (`ink`, `ink-current`, `ink-hover`, `separator`, `focus-ring`, `surface`).

## JavaScript

| Export | What it does |
| --- | --- |
| `createBreadcrumb(options?)` | Controller for `options.root`, or the document. |
| `initBreadcrumb(options?)` | Same call as `createBreadcrumb`. |
| `startBreadcrumbRuntime()` | Document controller. A second call syncs and returns it. Returns `null` when there is no document. |
| `stopBreadcrumbRuntime()` | Destroys that controller and cancels a deferred boot. |

### Options

| Option | Default | Notes |
| --- | --- | --- |
| `root` | `document` | Queries `root`, and includes `root` when it is a trail. The document when omitted. |
| `breadcrumbSelector` | `[breadcrumb]` | Trail root. |
| `itemSelector` | `[breadcrumb-item]` | Crumbs. When a trail has none, direct-child anchors and `[breadcrumb-link]` are the crumbs. |

### Controller

| Method | What it does |
| --- | --- |
| `destroy()` | Disconnects the observer and cancels a scheduled sync. |
| `sync()` | Applies the landmark and current-page rules on each trail. |
| `setCurrent(itemOrIndex, trail?)` | Moves the single `aria-current="page"`. An index uses `trail`, or the first trail when `trail` is omitted. It does not change the URL. |
| `getCurrent(target?)` | The 0-based crumb index, or `-1`. |
| `getState(target?)` | `{ current: number }`, or `null`. |

An element passed to `setCurrent()` resolves to the crumb that contains it. A link inside that crumb is marked when the argument is that link. Otherwise the crumb's last owned link is marked, or the crumb itself. An index that matches no crumb is a no-op. A later `sync()` keeps an existing current.

### Events

A real current-crumb change dispatches a bubbling [juice:change](./juice-runtime-behavior.md#juicechange) from `[breadcrumb]`. `detail` is `{ runtime: "breadcrumb", state: { current: number } }`. `current` is the 0-based crumb index, or `-1` when none are current; `getCurrent()` and `getState()` read it, and a write that leaves `current` unchanged does not dispatch.

## Accessibility

- Sync makes the root a navigation landmark only when that keeps an author role and list semantics. `nav` does not receive a redundant `role="navigation"`.
- An element with no role that is not `ol`, `ul`, or `menu` gets `role="navigation"`. Those lists stay lists and are not labeled. An author role is kept, including `role="group"`. Ancestor `nav` elements are not relabeled.
- When the root is a navigation landmark and `aria-label`, `aria-labelledby`, and `title` are missing or blank, sync sets `aria-label="Breadcrumb"`. A non-empty author name is kept, including a non-empty `title`. That is the only string this runtime invents.
- One `aria-current="page"` is kept. The runtime does not rewrite `href`, click behavior, or disabled state. Authors own whether the current crumb is a link.
- Breadcrumb does not listen for keys. Escape, Enter, Space, and arrows are not handled. See [Escape and layering](./juice-runtime-behavior.md#escape--layering).
- There is no focus trap. The runtime does not move focus or set `tabindex`.
- Core CSS does not give `[breadcrumb]` a z-index. It is inline nav chrome. See [Z-index bands](./juice-runtime-behavior.md#z-index-bands).

## Behavior

1. Find `[breadcrumb]` trails, ignore `nav[type="breadcrumb"]`, and assign each crumb to its nearest trail.
2. Make the root a navigation landmark only when that keeps list semantics and an author role.
3. Name an unlabeled navigation landmark `Breadcrumb`.
4. Keep a single `aria-current="page"`, using an author current when one exists, otherwise the last crumb.
5. `setCurrent()` moves that current by crumb or index and does not navigate.
6. Leave clicks, keys, history, and Escape alone.

### Landmark

`nav` is already a landmark. A non-list element with no role gets `role="navigation"`. `ol`, `ul`, and `menu` stay lists and do not receive `aria-label="Breadcrumb"`. A parent `nav` may be a larger landmark than this trail, so it is left as authored.

### Current page

The first `aria-current="page"` in tree order stays, including one on the trail root. Any others in that trail are removed. When none is set and the trail has crumbs, the last crumb is marked on its last owned anchor or `[breadcrumb-link]`, or on the crumb when it has no link. When a trail has no `[breadcrumb-item]`, direct-child anchors and `[breadcrumb-link]` elements are the crumbs.

<details>
<summary>Edge cases</summary>

- `setCurrent()` with an index that matches no crumb does nothing.
- When `trail` is omitted, an index applies to the first trail.
- A later `sync()` does not move the marker back to the last crumb.
- The observer watches child list changes and `breadcrumb`, `breadcrumb-item`, `breadcrumb-link`, `aria-current`, `aria-label`, `aria-labelledby`, `role`, and `title`.

</details>

### Limits

- There is no `Breadcrumb()` factory.
- `setCurrent()` does not change the URL, follow a link, or listen to history.
- `nav[type="breadcrumb"]` is not enhanced.
- There is no focus trap and no Escape handling.

Later DOM changes schedule `sync()` on the next animation frame. [Sync](./juice-runtime-behavior.md#sync).

## Not to be confused with

| This | Not this |
| --- | --- |
| Light trail, one `aria-current="page"`, landmark name `Breadcrumb` | A router |
| `[breadcrumb]` | Pagination |
| `[breadcrumb]` | Site navigation, or `nav[type="breadcrumb"]` |
| `[breadcrumb]` | Tabs, or a wizard step tracker |

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
