# Juice Breadcrumb Runtime

This document explains the current breadcrumb runtime in `libraries/juice/src/js/src/breadcrumb/breadcrumb-runtime.ts` (monorepo path; outside this vault).

The key idea is the same as navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, and radio:

> If a user writes valid Juice breadcrumb markup and it exists in the browser, the trail’s current page and landmark name should just work.

That is the standard.

## The Goal

The breadcrumb runtime is not a framework adapter and not a second component API.

It is a browser-side Juice feature that works regardless of how the markup got into the DOM.

That means it should work for:

- raw HTML pages
- Twig or other server-rendered templates
- Sig-rendered DOM
- React-rendered DOM
- any other environment that eventually produces browser DOM

The user should not need to manually initialize breadcrumb behavior in their app code.

There is no `Breadcrumb()` Sig factory. Markup plus the runtime is the contract.

This surface is Emerging, not Stable-ish. Valid markup should work after importing the JS entry, but the API is still likely to evolve. It is on master and is not in the `@citrusworx/juiceui@0.8.0` npm cut. Switch, slider, checkbox, and radio are unpublished on that same cut.

Breadcrumb is a light APG-inspired **Breadcrumb** trail. It is not the site `[nav]` / navigation runtime, not `nav[type="breadcrumb"]`, not tabs, not the wizard step tracker, and not pagination. It is not a router. v1 does not listen to history, clicks, or the keyboard. No focus trap and no Escape handling.

## Markup Contract

The runtime is aligned with Juice’s breadcrumb chrome:

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

`[breadcrumb]` is the trail root. `[breadcrumb-item]` is one crumb. Anchors inside the trail are enough. `[breadcrumb-link]` is optional. `[breadcrumb-separator]` is optional and author-owned; chrome suppresses the generated chevron when it is present. The separator itself is a CSS pseudo-element (`::after`) on every item except the last.

**A boolean `[breadcrumb]` attribute is fine.** There is no HTML global `breadcrumb` attribute.

**What this runtime enhances:**

- A `[breadcrumb]` root. Typical hosts are `<nav breadcrumb>` and `<ol breadcrumb>`. A plain element with `[breadcrumb]` is also enhanced.
- Owned `[breadcrumb-item]` descendants. A crumb belongs to its nearest `[breadcrumb]`.
- When a trail has no `[breadcrumb-item]`, direct-child anchors and `[breadcrumb-link]` elements are the crumbs. That is the same flat markup the chrome styles.

`nav[type="breadcrumb"]` is an older layout pattern. It is not this chrome, and this runtime ignores it. Do not style bare `[aria-current="page"]` outside the trail.

**Landmark:** sync makes the root a navigation landmark only when that is safe.

- `<nav>` is already a landmark. Sync does not add a redundant `role="navigation"`.
- An element with no role that is not a list (`ol`, `ul`, or `menu`) gets `role="navigation"`.
- `role="navigation"` on a list would drop the list semantics, so `<ol breadcrumb>`, `<ul breadcrumb>`, and `<menu breadcrumb>` are left alone. They are not given `aria-label="Breadcrumb"` either.
- An author `role` is never overwritten. A `role="group"` root stays a group and is not labeled.
- Ancestor `<nav>` elements are not relabeled. A parent nav may be a larger landmark than this trail.

**Landmark name:** when the root is a navigation landmark and `aria-label`, `aria-labelledby`, and `title` are all missing or blank, sync sets `aria-label="Breadcrumb"`. A non-empty author name is kept, including a non-empty `title`. Lists and other non-navigation roots are not given that label. That landmark name is the only string this runtime invents. It does not invent names for individual crumbs.

**Current page:** `aria-current="page"` paints the current crumb. Sync keeps a single one inside the trail.

- If the author already set `aria-current="page"`, the first one in tree order stays. Any others in this trail are removed. A current on the trail root itself counts, and it wins when it is first.
- If none is set and the trail has crumbs, the last crumb is marked.
- A crumb that contains a link is marked on that link: the last owned anchor or `[breadcrumb-link]`. Otherwise the crumb element itself is marked.
- Sync does not rewrite the current crumb’s `href`, click behavior, or disabled state. Authors own whether the current page is a link.

Theme paint uses `--juice-breadcrumb-*` roles (`ink`, `ink-current`, `ink-hover`, `separator`, `focus-ring`, `surface`). Core CSS does not give `[breadcrumb]` a z-index. It is inline nav chrome — see [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands). See the [Theme Contract](./juice-theme-contract.md) and [Attributes](./juice-attributes.md). `[breadcrumb]` is an APG-inspired trail, not the site navigation runtime and not the surface `overlay="frost|tint"` utility.

## Automatic Boot

The runtime starts automatically in the browser.

At the bottom of the file, Juice checks whether it is running in a browser environment and then boots the breadcrumb runtime:

```ts
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      startBreadcrumbRuntime();
    });
  } else {
    startBreadcrumbRuntime();
  }
}
```

Importing the Juice JS entrypoint is enough for the normal behavior.

`stopBreadcrumbRuntime()` also cancels a deferred `DOMContentLoaded` boot, so a test or host that stops the singleton before ready does not get a surprise start.

## Public API

The runtime still exposes functions, but they are secondary to the automatic behavior.

```ts
createBreadcrumb(options?)
initBreadcrumb(options?)
startBreadcrumbRuntime()
stopBreadcrumbRuntime()
```

These are useful for internal control, tests, or advanced cases.

`createBreadcrumb()` can run alongside the automatic document runtime. This runtime claims no clicks, keys, or history events, so there is nothing to double-fire.

`initBreadcrumb()` is the same function as `createBreadcrumb()`.

## BreadcrumbOptions

The configurable shape is:

```ts
type BreadcrumbOptions = {
  root?: ParentNode;
  breadcrumbSelector?: string;
  itemSelector?: string;
};
```

By default, Juice uses:

```ts
{
  root: document,
  breadcrumbSelector: '[breadcrumb]',
  itemSelector: '[breadcrumb-item]',
}
```

## BreadcrumbController

```ts
type BreadcrumbController = {
  destroy: () => void;
  sync: () => void;
  setCurrent: (
    itemOrIndex: HTMLElement | number,
    trail?: HTMLElement | null
  ) => void;
};
```

`sync()` walks each managed trail and applies the landmark and current-page rules. `setCurrent()` moves that single `aria-current="page"`. An element target resolves to the crumb that contains it. When that element is a link inside the crumb, the link is marked; otherwise the preferred target is the crumb’s last owned link, or the crumb itself. An index applies to the given trail, or to the first trail when `trail` is omitted. An index that does not match a crumb is a no-op. `setCurrent()` is not a navigation: it does not change the URL, follow a link, or listen to history.

A later `sync()` keeps an existing current. It does not jump back to the last crumb after `setCurrent()` has moved the page marker.

## What the Runtime Actually Does

The runtime performs six main jobs:

1. Find `[breadcrumb]` trails. `nav[type="breadcrumb"]` is ignored. A crumb belongs to its nearest trail
2. Make the root a navigation landmark only when that is safe. `<nav>` is left without a redundant role. A non-list element with no role gets `role="navigation"`. `<ol>`, `<ul>`, and `<menu>` stay lists. An author role is kept. Ancestor navs are not relabeled
3. Name that landmark `Breadcrumb` only when it is a navigation landmark and `aria-label`, `aria-labelledby`, and `title` are missing or blank. A non-empty author name is kept. Lists and other non-navigation roots are not labeled
4. Keep a single `aria-current="page"`. Owned `[breadcrumb-item]` elements are the crumbs. When a trail has none, direct-child anchors and `[breadcrumb-link]` elements are the crumbs. An author current wins: the first in tree order stays and the rest in that trail are removed. If none is set, the last crumb is marked, on its last owned link when it has one. `href`, clicks, and disabled state are left alone
5. `setCurrent()` moves that single current by crumb or index. It is not a navigation. A later `sync()` keeps the first current instead of resetting to the last crumb
6. Leave Escape, clicks, and history alone. Breadcrumb claims no events and does not participate in the overlay / popover / menu / combobox / toast / tooltip yield order. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering).

There is no focus trap. There is no keyboard map. This runtime does not close a modal, drawer, toast, popover, wizard, tooltip, combobox, banner, or menu, and it does not toggle a switch, move a slider, toggle a checkbox, or select a radio.

## Why MutationObserver Is Used

The DOM may change after the initial page load. That is what happens in reactive or server-hydrated environments.

If a breadcrumb appears later, the observer schedules a `sync()` call so Juice can wire the landmark and a single `aria-current="page"`.

The observer watches child list changes and these attributes: `breadcrumb`, `breadcrumb-item`, `breadcrumb-link`, `aria-current`, `aria-label`, `aria-labelledby`, `role`, and `title`.

## Why Sync Is Scheduled

Mutation-heavy environments can change the DOM a lot in a short burst.

So instead of calling `sync()` immediately for every change, the runtime schedules it with `requestAnimationFrame`.

That keeps the runtime from reacting too aggressively while still updating quickly enough for UI behavior.

## Keyboard

Breadcrumb does not listen for keys.

- Escape is not handled. Breadcrumb never steals it. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering).
- Enter, Space, and arrows are not handled
- There is no focus trap. Tab is not wrapped. The runtime does not move focus

Authors own whether a crumb is a link. The runtime does not remove `href` from the current page.

## Limitations

- No `Breadcrumb()` factory. Author markup (or emit it from Sig/React) and let the runtime enhance it.
- This surface is Emerging, not Stable-ish. It is on master and unpublished versus `@citrusworx/juiceui@0.8.0`, along with switch, slider, checkbox, and radio.
- This is not a router. v1 does not listen to history, clicks, or the keyboard, and `setCurrent()` does not navigate.
- The only invented name is `aria-label="Breadcrumb"` on an unlabeled navigation landmark. Crumb names stay author-owned.
- `<nav breadcrumb>` does not get a redundant `role="navigation"`. `<ol>`, `<ul>`, and `<menu>` stay lists and are not labeled. An author role is never overwritten. Ancestor navs are not relabeled.
- `nav[type="breadcrumb"]` is not this chrome and is not enhanced.
- When more than one `aria-current="page"` is set, sync keeps the first in tree order. When none is set, the last crumb is marked, on its last owned link when it has one.
- `setCurrent()` with an index that does not match a crumb is a no-op. It does not fall back to another trail unless `trail` is omitted, in which case the first trail is used.
- A later `sync()` preserves an existing current. It does not move the marker back to the last crumb.
- The runtime does not rewrite `href`, click behavior, or disabled state on the current crumb.
- There is no focus trap and no Escape handling. Breadcrumb is not a layered overlay. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering).
- There is no z-index elevation. Breadcrumb is inline nav chrome. See [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands).
- Centered modal / dialog, edge-docked drawer, toast-stack, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, and radio behavior are not part of this runtime. See [Modal Runtime](./juice-modal-runtime.md), [Drawer Runtime](./juice-drawer-runtime.md), [Toast Runtime](./juice-toast-runtime.md), [Popover Runtime](./juice-popover-runtime.md), [Wizard Runtime](./juice-wizard-runtime.md), [Tooltip Runtime](./juice-tooltip-runtime.md), [Combobox Runtime](./juice-combobox-runtime.md), [Banner Runtime](./juice-banner-runtime.md), [Menu Runtime](./juice-menu-runtime.md), [Switch Runtime](./juice-switch-runtime.md), [Slider Runtime](./juice-slider-runtime.md), [Checkbox Runtime](./juice-checkbox-runtime.md), and [Radio Runtime](./juice-radio-runtime.md).

## Why This Matches Navigation

The breadcrumb runtime copies the navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, and radio lifecycle by convention:

- DOM-first
- automatic boot
- MutationObserver plus rAF `sync()`
- idempotent singleton `start*Runtime` / `stop*Runtime`
- framework-agnostic

It does not copy their event delegation. v1 claims no events.

Shared internals under `libraries/juice/src/js/src/shared/` are not a public multi-feature runtime API.

## Design Rule Going Forward

Interactive Juice browser features should follow this standard:

> If valid Juice markup exists in the browser, the feature should activate automatically and work without app glue.
