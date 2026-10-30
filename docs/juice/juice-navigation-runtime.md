# Navigation

Navigation is the responsive behavior for `nav[type="bar"]`, `nav[type="links"]`, `nav[type="mobile"]`, and `nav[type="sidebar"]`.

Emerging. Shipped in `@citrusworx/juiceui@0.9.2`.

Importing `@citrusworx/juiceui` enhances valid markup. See [Automatic behavior](./juice-runtime-behavior.md#automatic-behavior).

## Markup

```html
<nav type="bar">Primary</nav>
<nav type="links">Sections</nav>
<nav type="mobile">Menu</nav>
<nav type="sidebar">Sections</nav>
```

These four `type` values are the hooks. Sidebar open and closed is the `hidden` attribute.

## Attributes

| Hook | What it does |
| --- | --- |
| `nav[type="bar"]` | Desktop bar. Shown above the breakpoint and hidden on mobile. |
| `nav[type="links"]` | Desktop links. Shown and hidden with the bar. |
| `nav[type="mobile"]` | Mobile toggle. Hidden on desktop and shown on mobile. |
| `nav[type="sidebar"]` | Sidebar. Desktop removes `hidden`. Mobile keeps the current `hidden` state until a toggle changes it. |

## JavaScript

| Export | What it does |
| --- | --- |
| `createNavigation(options?)` | Controller for `options.root`, or the document. |
| `initNavigation(options?)` | Same call as `createNavigation`. |
| `startNavigationRuntime()` | Document controller. A second call syncs and returns it. Returns `null` when there is no document. |
| `stopNavigationRuntime()` | Destroys that controller. It does not cancel a deferred boot. |

### Options

| Option | Default | Notes |
| --- | --- | --- |
| `root` | `document` | Queries descendants. The document when omitted. |
| `navSelector` | `nav[type="bar"], nav[type="links"]` | Desktop navs. |
| `sidebarSelector` | `nav[type="sidebar"]` | Sidebars. |
| `toggleSelector` | `nav[type="mobile"]` | Mobile toggles. |
| `mobileBreakpoint` | `960` | Mobile when `window.innerWidth` is less than or equal to this value. |

### Controller

| Method | What it does |
| --- | --- |
| `destroy()` | Removes the resize, click, and keydown listeners and disconnects the observer. |
| `openSidebar(toggle?)` | Shows the paired sidebar, sets `aria-hidden="false"`, and sets the toggle's `aria-expanded` to `true`. |
| `closeSidebar(toggle?)` | On mobile, hides the sidebar and moves focus to the toggle. Sets `aria-expanded` to `false`. |
| `toggleSidebar(toggle?)` | Opens a closed sidebar and closes an open one. |
| `sync()` | Applies the viewport rules to every match. |
| `isMobile()` | True when `window.innerWidth` is less than or equal to `mobileBreakpoint`. |
| `isOpen(target?)` | True when the paired sidebar lacks `hidden`. |
| `getState(target?)` | `{ open: boolean }` for that sidebar, or `null`. |

### Events

A real open or close dispatches a bubbling [juice:change](./juice-runtime-behavior.md#juicechange) from `nav[type="sidebar"]`. `detail` is `{ runtime: "nav", state: { open: boolean } }`. `open` means the sidebar lacks `hidden`; `isOpen()` and `getState()` read it, and a write that leaves `open` unchanged does not dispatch.

## Accessibility

- Visibility uses `hidden`. A sidebar also gets `aria-hidden`. The toggle gets `aria-expanded`, `aria-controls`, and a generated sidebar id when the sidebar has none.
- An empty toggle with no `aria-label` or `aria-labelledby` is named `Toggle navigation menu`. It receives `data-nav-toggle-icon="default"` when it has no visible content.
- A toggle that is not a `button` or an `a` gets `role="button"` and `tabindex="0"`. Enter and Space toggle it. A `button` or `a` uses click.
- On a mobile viewport, Escape closes every sidebar that lacks `hidden` and returns focus to its toggle. See [Escape and layering](./juice-runtime-behavior.md#escape--layering).
- Sidebar chrome uses `z-index: 30`. That is a structural band. See [Z-index bands](./juice-runtime-behavior.md#z-index-bands).
- There is no focus trap and no click-away close.

## Behavior

1. Treat the viewport as mobile when `window.innerWidth` is less than or equal to `mobileBreakpoint`.
2. Show or hide bar, links, and the mobile toggle for that viewport.
3. Pair each toggle with a sidebar and open or close that sidebar on click.
4. On mobile, close every open sidebar when Escape is pressed.
5. Write `hidden`, `aria-hidden`, and `aria-expanded` from that visibility.

### Viewport

| Viewport | Bar and links | Mobile | Sidebar |
| --- | --- | --- | --- |
| Wider than `mobileBreakpoint` | Shown | Hidden | Visible (`hidden` removed) |
| `innerWidth` at or below `mobileBreakpoint` | Hidden | Shown | Keeps current `hidden` |

On desktop, `sync()` removes `hidden` from each sidebar and sets the toggle's `aria-expanded` to `false`. On mobile, a sidebar that lacks `hidden` stays open. A sidebar that has `hidden` stays closed until a toggle opens it.

### Multiple sets

The runtime queries every match for the desktop, toggle, and sidebar selectors. A page may contain more than one set.

### Pairing

1. Look in the toggle's parent.
2. Walk upward through ancestors.
3. Fall back to the first sidebar.

The same walk finds a toggle from a sidebar.

### Visibility

Shown elements lose `hidden`. Hidden elements get `hidden="true"`. Open state is that attribute, not a second state attribute.

<details>
<summary>Edge cases</summary>

- Resize calls `sync()` immediately. DOM mutations schedule it.
- The observer watches child list changes and the attributes `hidden` and `type`.
- `closeSidebar()` sets `hidden` only while the viewport is mobile. On mobile it then focuses the toggle.
- An empty toggle receives `data-nav-toggle-icon="default"`. A toggle with visible content loses that attribute.

</details>

### Limits

- There is no focus trap, click-away close, or open and close animation.
- There is no Sig navigation factory. The contract is `createNavigation`, `initNavigation`, `startNavigationRuntime`, and `stopNavigationRuntime`.
- `stopNavigationRuntime()` does not remove a pending `DOMContentLoaded` boot.

Later DOM changes schedule `sync()` on the next animation frame. [Sync](./juice-runtime-behavior.md#sync).

## Not to be confused with

| This | Not this |
| --- | --- |
| Responsive nav types `bar`, `links`, `mobile`, and `sidebar` | An APG menu |

## Related

- [Attributes](./juice-attributes.md)
- [Runtime behavior](./juice-runtime-behavior.md)
