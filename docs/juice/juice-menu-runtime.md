# Juice Menu Runtime

This document explains the current menu runtime in `libraries/juice/src/js/src/menu/menu-runtime.ts` (monorepo path; outside this vault).

The key idea is the same as navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, and banner:

> If a user writes valid Juice menu markup and it exists in the browser, the menu button should just work.

That is the standard.

## The Goal

The menu runtime is not a framework adapter and not a second component API.

It is a browser-side Juice feature that works regardless of how the markup got into the DOM.

That means it should work for:

- raw HTML pages
- Twig or other server-rendered templates
- Sig-rendered DOM
- React-rendered DOM
- any other environment that eventually produces browser DOM

The user should not need to manually initialize menu behavior in their app code.

There is no `Menu()` Sig factory. Markup plus the runtime is the contract.

This surface is Emerging, not Stable-ish. Valid markup should work after importing the JS entry, but the API is still likely to evolve.

Menu is an APG **Menu Button** (an opener toggles a menu of menuitems). It is not a popover, not a combobox, not a native `<select>` restyle, not a menubar, and not a context menu. No submenus and no typeahead in v1.

## Markup Contract

The runtime is aligned with Juice’s menu chrome:

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

It requires a `[menu-root]` wrapper. Closed vs open is the native `hidden` attribute on `[menu]`, not on the root (hiding the root would hide the opener). The runtime does **not** write `content="active"` or `content="hidden"`. Those values clash with Juice layout `[content]`.

**A boolean `[menu]` attribute is fine.** There is no HTML global `menu` attribute, and unlike `popover=""` it has no platform behavior. Do not use the HTML `<menu>` element. Authors should write `<div menu>`, not `<menu>`.

**Placement:** `[menu-root]` / `[menu-root="bottom"]` / `"top"` / `"left"` / `"right"`. Bare or unspecified is bottom. Placement is CSS-absolute from the root. There is no Floating UI.

**Opener:** prefer `[menu-button]` inside the root. Authors who want a themed CTA opener omit that attr and use a plain button (or `[role="button"]` / `a[href]`) inside `[menu-root]`. Pairing is wrapped: the opener lives inside the root with the panel. The runtime fills opener `aria-haspopup="menu"` plus `aria-controls` pointing at the `[menu]` id.

**Parts:**

- `[menu-root]` — composite wrapper (opener + panel)
- `[menu-button]` — optional opener chrome (surface paint, not a CTA)
- `[menu]` — the menu panel (`role="menu"`)
- `[menuitem]` — item row (`role="menuitem"`); value `"active"` is keyboard / visual focus
- `[menu-separator]` — non-interactive divider (`role="separator"`)
- `[menu-label]` — non-interactive group label

Prefer shipping those roles in markup. The runtime fills them if they are missing, plus missing panel / item ids and opener `aria-expanded`. It does **not** set `aria-modal`. Separators get `role="separator"`; labels stay non-interactive and do not get a role.

When `[menu-root]` has a `name` or `id`, that value becomes the slug used for generated ids (`file-menu`, `file-item-1`).

Theme paint uses `--juice-menu-*` roles. Core CSS paints `[menu]` at **z-index 1050** (same band as popover / combobox, below tooltip `1060` and toast `1100`). That is a structural band, not a theme contract — see [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands). See the [Theme Contract](./juice-theme-contract.md) and [Attributes](./juice-attributes.md). `[menu-root]` is an APG menu button, not a popover, not a combobox, not a native `<select>`, not a menubar, not a context menu, and not the surface `overlay="frost|tint"` utility. Optional `surfaceTone` on `[menu]` is allowed; do not force it.

## Automatic Boot

The runtime starts automatically in the browser.

At the bottom of the file, Juice checks whether it is running in a browser environment and then boots the menu runtime:

```ts
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      startMenuRuntime();
    });
  } else {
    startMenuRuntime();
  }
}
```

Importing the Juice JS entrypoint is enough for the normal behavior.

`stopMenuRuntime()` also cancels a deferred `DOMContentLoaded` boot, so a test or host that stops the singleton before ready does not get a surprise start.

## Public API

The runtime still exposes functions, but they are secondary to the automatic behavior.

```ts
createMenu(options?)
initMenu(options?)
startMenuRuntime()
stopMenuRuntime()
```

These are useful for internal control, tests, or advanced cases.

`createMenu()` can run alongside the automatic document runtime. Each click or key event is claimed once, so a custom-root controller does not double-fire with the singleton. A controller claims opener clicks only when it can resolve a panel (a custom `menuSelector` can coexist with the auto singleton).

## MenuOptions

The configurable shape is:

```ts
type MenuOptions = {
  root?: ParentNode;
  rootSelector?: string;
  buttonSelector?: string;
  menuSelector?: string;
  itemSelector?: string;
  separatorSelector?: string;
  labelSelector?: string;
};
```

By default, Juice uses:

```ts
{
  root: document,
  rootSelector: '[menu-root]',
  buttonSelector: '[menu-button]',
  menuSelector: '[menu]',
  itemSelector: '[menuitem]',
  separatorSelector: '[menu-separator]',
  labelSelector: '[menu-label]',
}
```

## MenuController

```ts
type MenuController = {
  destroy: () => void;
  sync: () => void;
  open: (target?: HTMLElement | null) => void;
  close: (target?: HTMLElement | null) => void;
  toggle: (target?: HTMLElement | null) => void;
  select: (target?: HTMLElement | null) => void;
};
```

`open()` / `close()` / `toggle()` toggle native `hidden` on `[menu]`. `select()` activates one enabled menuitem (clicks it) and then closes.

## What the Runtime Actually Does

The runtime performs eight main jobs:

1. Find `[menu-root]` roots and resolve the opener, `[menu]` panel, and `[menuitem]` rows inside that root. Orphan nodes outside a `[menu-root]` are ignored. The opener is `[menu-button]` when present, else `[aria-haspopup="menu"]`, else an `aria-controls` match to the panel id, else the first `button` / `[role="button"]` / `a[href]` that is not inside the panel
2. Fill missing roles (`menu` / `menuitem` / `separator`), panel and item ids, opener `aria-haspopup="menu"` / `aria-controls` / `aria-expanded`, and `role="button"` plus `tabindex="0"` on a non-native opener. It does not set `aria-modal`
3. Toggle native `hidden` on `[menu]` (not the root). Opening one managed menu closes the others
4. Move focus onto a menuitem on open. Keyboard focus is **roving tabindex**: the active row gets `tabindex="0"` plus `menuitem="active"`; siblings get `tabindex="-1"`. Separators and labels are skipped. Disabled items (`aria-disabled="true"` or native `disabled`) are skipped
5. Open on opener click / Enter / Space (native buttons already synthesize a click). ArrowDown on a closed opener opens and focuses the first enabled item (or the previously active item). ArrowUp opens onto the last enabled item
6. Close on Escape (yields when an open `[modal-overlay]` or `[drawer-overlay]` exists — menu sits with popover in the dialog-adjacent band), outside click, Tab (closes without activating; focus returns to the opener so Tab’s default can move to the next / previous control), or after activating an item. Activating an item clicks it and restores focus to the opener. Disabled items are intercepted on capture so author click handlers never run
7. `aria-expanded` on the opener tracks open vs closed
8. Handle click (opener toggle, item activate, outside) and keyboard (Escape, Tab, ArrowUp/Down, Home/End, Enter/Space)

There is no focus trap. Tab is not wrapped. The background stays interactive.

Exclusive open is among menus. This runtime does not close a modal, drawer, or popover, and those runtimes do not close a menu.

## Placement

Placement is CSS-only. There is no Floating UI.

`[menu]` is absolutely positioned from `[menu-root]` (`top|bottom|left|right`, default `bottom`). Core CSS paints it at z-index **1050**. The runtime does not measure, flip, or shift the panel.

## Why MutationObserver Is Used

The DOM may change after the initial page load. That is what happens in reactive or server-hydrated environments.

If a menu appears later, the observer schedules a `sync()` call so Juice can wire ids and ARIA, start handling clicks and keys, and apply roving tabindex on any already-open panel.

## Why Sync Is Scheduled

Mutation-heavy environments can change the DOM a lot in a short burst.

So instead of calling `sync()` immediately for every change, the runtime schedules it with `requestAnimationFrame`.

That keeps the runtime from reacting too aggressively while still updating quickly enough for UI behavior.

## Keyboard

- ArrowDown / ArrowUp on a closed opener open the menu and focus the first / last enabled item. Open, those keys move `menuitem="active"` among enabled items (wrap). Focus moves onto the menuitem itself — this is not combobox `aria-activedescendant`
- Home / End move to the first / last enabled item while the menu is open
- Enter and Space activate the focused menuitem (or toggle a non-button opener)
- Escape closes and returns focus to the opener, but only when no open `[modal-overlay]` or `[drawer-overlay]` exists (those dialogs own Escape). Menu sits with popover in the same Escape band. Combobox, toast, and tooltip yield to an open menu. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering).
- Tab closes without activating the item. Focus returns to the opener so Tab’s default keeps sequential focus. There is no focus trap

Disabled items are skipped by the roving keys. They never fire author click handlers.

## Limitations

- No `Menu()` factory. Author markup (or emit it from Sig/React) and let the runtime enhance it.
- This is an APG Menu Button, not a menubar, not a context menu, and not a submenu tree. No submenus and no typeahead in v1.
- Distinct from popover (generic non-modal dialog), combobox (editable listbox), and native `<select>`. Do not restyle or replace `<select>`.
- Orphan `[menu]` / `[menuitem]` nodes that are not inside `[menu-root]` are ignored.
- Panels use native `hidden` on `[menu]`, never on the root, and never layout `content=`.
- Opening is exclusive among menus. Only one managed menu is open at a time.
- Placement has no Floating UI. The panel stays CSS-absolute from the root.
- Do not use the HTML `<menu>` element. A boolean `[menu]` attribute is the Juice name.
- The panel is not a dialog overlay: no `aria-modal`, no focus trap, and the background stays interactive.
- This surface is Emerging, not Stable-ish.
- Centered modal / dialog, edge-docked drawer, toast-stack, popover, wizard, tooltip, combobox, and banner behavior are not part of this runtime. See [Modal Runtime](./juice-modal-runtime.md), [Drawer Runtime](./juice-drawer-runtime.md), [Toast Runtime](./juice-toast-runtime.md), [Popover Runtime](./juice-popover-runtime.md), [Wizard Runtime](./juice-wizard-runtime.md), [Tooltip Runtime](./juice-tooltip-runtime.md), [Combobox Runtime](./juice-combobox-runtime.md), and [Banner Runtime](./juice-banner-runtime.md).
- Escape dismisses the open menu only when no open modal/drawer overlay exists. Combobox, toast, and tooltip yield to an open menu like they yield to an open popover. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering).
- Panel chrome is `z-index: 1050`. That is a structural band, not a theme contract. See [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands).

## Why This Matches Navigation

The menu runtime copies the navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, and banner lifecycle by convention:

- DOM-first
- automatic boot
- event delegation
- MutationObserver plus rAF `sync()`
- idempotent singleton `start*Runtime` / `stop*Runtime`
- framework-agnostic

Shared internals under `libraries/juice/src/js/src/shared/` are not a public multi-feature runtime API.

## Design Rule Going Forward

Interactive Juice browser features should follow this standard:

> If valid Juice markup exists in the browser, the feature should activate automatically and work without app glue.
