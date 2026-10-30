# Menu

Menu is an APG menu button. `[menu-root]` holds an opener and a `[menu]` of `[menuitem]` rows.

Emerging. Shipped in `@citrusworx/juiceui@0.9.2`.

Importing `@citrusworx/juiceui` enhances valid markup. See [Automatic behavior](./juice-runtime-behavior.md#automatic-behavior).

## Markup

```html
<div menu-root name="file">
  <button type="button" menu-button>File</button>
  <div menu hidden>
    <button type="button" menuitem>New</button>
    <button type="button" menuitem>Open…</button>
    <div menu-separator></div>
    <div menu-label>Recent</div>
    <button type="button" menuitem>Report.pdf</button>
  </div>
</div>
```

The root holds the opener and the panel. Open and closed is native `hidden` on `[menu]`, and authors write `<div menu>` rather than the HTML `<menu>` element.

## Attributes

| Hook | What it does |
| --- | --- |
| `[menu-root]` | Opener plus panel. Placement is bare, `bottom`, `top`, `left`, or `right`. Bare means bottom. |
| `[menu-button]` | Optional opener. Otherwise `[aria-haspopup="menu"]`, an `aria-controls` match, or the first `button`, `[role="button"]`, or `a[href]` outside the panel. |
| `[menu]` | Panel. `hidden` on this element is closed. Missing `role="menu"` is filled. |
| `[menuitem]` | Item. `menuitem="active"` is keyboard and visual focus. Missing `role="menuitem"` is filled. |
| `[menu-separator]` | Non-interactive divider. Missing `role="separator"` is filled. |
| `[menu-label]` | Non-interactive group label. It receives no role. |
| `name` | On the root, `name` or `id` is the slug for generated ids such as `file-menu` and `file-item-1`. |

A boolean `[menu]` attribute is enough. There is no HTML global `menu` attribute. Optional `surfaceTone` on `[menu]` is allowed. Theme paint uses `--juice-menu-*` roles.

## JavaScript

| Export | What it does |
| --- | --- |
| `createMenu(options?)` | Controller for `options.root`, or the document. |
| `initMenu(options?)` | Same call as `createMenu`. |
| `startMenuRuntime()` | Document controller. A second call syncs and returns it. Returns `null` when there is no document. |
| `stopMenuRuntime()` | Destroys that controller and cancels a deferred boot. |

A custom-root controller can run beside the document runtime, and each click or key event is claimed once.

### Options

| Option | Default | Notes |
| --- | --- | --- |
| `root` | `document` | Queries descendants. The document when omitted. |
| `rootSelector` | `[menu-root]` | Composite wrapper. |
| `buttonSelector` | `[menu-button]` | Optional opener chrome. |
| `menuSelector` | `[menu]` | Panel. Opener clicks are claimed only when a panel resolves. |
| `itemSelector` | `[menuitem]` | Item rows. |
| `separatorSelector` | `[menu-separator]` | Dividers. |
| `labelSelector` | `[menu-label]` | Group labels. |

### Controller

| Method | What it does |
| --- | --- |
| `destroy()` | Removes the document listeners and disconnects the observer. |
| `sync()` | Fills ids and ARIA, and applies roving tabindex on an open panel. |
| `open(target?)` | Shows `[menu]` and moves focus to an enabled item. |
| `close(target?)` | Hides `[menu]` and returns focus to the opener. |
| `toggle(target?)` | Opens a closed menu and closes an open one. |
| `select(target?)` | Clicks one enabled menuitem. That click closes the menu. |
| `isOpen(target?)` | True when `[menu]` lacks `hidden`. |
| `getState(target?)` | `{ open: boolean }`, or `null`. |

### Events

A real open or close dispatches a bubbling [juice:change](./juice-runtime-behavior.md#juicechange) from `[menu-root]`. `detail` is `{ runtime: "menu", state: { open: boolean } }`. `open` means the `[menu]` panel is shown; `isOpen()` and `getState()` read it, and a write that leaves `open` unchanged does not dispatch.

## Accessibility

- ArrowDown on a closed opener opens the menu and focuses the first enabled item. ArrowUp opens onto the last enabled item.
- When the menu is open, ArrowDown and ArrowUp move `menuitem="active"` among enabled items and wrap. Focus moves onto the menuitem. This is roving tabindex, not `aria-activedescendant`.
- Home and End move to the first and last enabled item while the menu is open.
- Enter and Space activate the focused menuitem. On a non-native opener they toggle the menu. A native button uses click.
- Escape closes and returns focus to the opener, unless an open `[modal-overlay]` or `[drawer-overlay]` exists. Menu sits with popover in that band. Combobox, toast, and tooltip yield to an open menu. See [Escape and layering](./juice-runtime-behavior.md#escape--layering).
- Tab closes without activating. Focus returns to the opener so Tab continues from there. There is no focus trap.
- Disabled items (`aria-disabled="true"`, or a disabled `button` or `input`) and hidden items are skipped. A disabled item click is cancelled before author handlers run.
- Sync fills `role="menu"`, `role="menuitem"`, and `role="separator"`, plus `aria-haspopup="menu"`, `aria-controls`, and `aria-expanded`. It does not set `aria-modal`. A non-native opener gets `role="button"` and `tabindex="0"` when `tabindex` is missing.
- `[menu]` is painted at z-index 1050, the same band as popover and combobox, below tooltip 1060 and toast 1100. See [Z-index bands](./juice-runtime-behavior.md#z-index-bands).

## Behavior

1. Find each `[menu-root]` and ignore orphan `[menu]` and `[menuitem]` nodes.
2. Resolve the opener, the `[menu]` panel, and the `[menuitem]` rows inside that root.
3. Fill missing roles, ids, `aria-haspopup`, `aria-controls`, and `aria-expanded`.
4. Toggle native `hidden` on `[menu]`, and close other open menus when one opens.
5. Move focus to an enabled menuitem on open, with roving tabindex.
6. Open from the opener, and close on Escape, outside click, Tab, or item activation.

A click, Enter, or Space that opens the menu focuses the previously active enabled item when it is still enabled, otherwise the first. ArrowDown and ArrowUp on a closed opener force the first and last enabled items.

### Placement

Placement is CSS absolute from `[menu-root]`. Values are `top`, `bottom`, `left`, and `right`. Bare means bottom. The runtime does not measure, flip, or shift the panel. There is no Floating UI.

<details>
<summary>Edge cases</summary>

- Opening one menu also closes other open menus found in the document.
- Exclusive open is among menus. This runtime does not close a modal, drawer, or popover.
- When no enabled item exists, the panel receives `tabindex="-1"` and takes focus.
- Escape does nothing when the event default is already prevented.
- The observer watches child list changes and `hidden`, `aria-controls`, `aria-expanded`, `aria-disabled`, `aria-haspopup`, `disabled`, `menu-root`, `menu-button`, `menu`, `menuitem`, `menu-separator`, and `menu-label`.

</details>

### Limits

- There is no `Menu()` factory.
- There are no submenus and no typeahead.
- Orphan `[menu]` and `[menuitem]` nodes outside `[menu-root]` are ignored.
- `hidden` stays on `[menu]`, not on the root. The runtime does not write layout `content`.
- The background stays interactive. There is no focus trap and no `aria-modal`.

Later DOM changes schedule `sync()` on the next animation frame. [Sync](./juice-runtime-behavior.md#sync).

## Not to be confused with

| This | Not this |
| --- | --- |
| APG menu button | A popover |
| APG menu button | A combobox |
| APG menu button | A menubar |
| APG menu button | A native `<select>` |
| APG menu button | A context menu |
| `<div menu>` | The HTML `<menu>` element |

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
