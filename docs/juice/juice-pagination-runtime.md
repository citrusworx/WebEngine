# Juice Pagination Runtime

This document explains the current pagination runtime in `libraries/juice/src/js/src/pagination/pagination-runtime.ts` (monorepo path; outside this vault).

The key idea is the same as navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, breadcrumb, and progress:

> If a user writes valid Juice pagination markup and it exists in the browser, the current page, the landmark name, and disabled prev/next at the ends should just work.

That is the standard.

## The Goal

The pagination runtime is not a framework adapter and not a second component API.

It is a browser-side Juice feature that works regardless of how the markup got into the DOM.

That means it should work for:

- raw HTML pages
- Twig or other server-rendered templates
- Sig-rendered DOM
- React-rendered DOM
- any other environment that eventually produces browser DOM

The user should not need to manually initialize pagination behavior in their app code.

There is no `Pagination()` Sig factory. Markup plus the runtime is the contract.

This surface is Emerging, not Stable-ish. Valid markup should work after importing the JS entry, but the API is still likely to evolve.

Pagination is an APG-inspired **page set**. It is not the site `[nav]` / navigation runtime, not `nav[type="pagination"]`, not a breadcrumb, not tabs, and not the wizard step tracker. It is not a router. v1 does not listen to history, does not remove `href`, and does not trap focus. Escape is not handled.

Pagination is the nineteenth Emerging auto-enhance runtime. `@citrusworx/juiceui@0.9.0` ships eighteen (navigation through progress). Pagination is unpublished versus that cut. All nineteen stay Emerging.

## Markup Contract

The runtime is aligned with Juice’s pagination chrome:

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

`[pagination]` is the page-set root. `[pagination-item]` is one cell and is layout only. Anchors and buttons inside the control are enough. `[pagination-link]` is optional. `[pagination-prev]` and `[pagination-next]` mark those controls; the attribute may sit on the control or on the item that wraps it. `[pagination-ellipsis]` is an optional gap marker. `[pagination-status]` is optional text such as "Page 2 of 12".

**A boolean `[pagination]` attribute is fine.** There is no HTML global `pagination` attribute.

**What this runtime enhances:**

- A `[pagination]` root. Typical hosts are `<nav pagination>` and `<ol pagination>`. A plain element with `[pagination]` is also enhanced.
- Owned parts belong to the nearest `[pagination]`. Nested page sets stay independent.
- Page controls are cells, anchors, buttons, and `[pagination-link]` elements that are not prev, next, ellipsis, or status.

`nav[type="pagination"]` is an older layout pattern. It is not this chrome, and this runtime ignores it. Do not style bare `[aria-current="page"]` outside the page set.

**Landmark:** sync makes the root a navigation landmark only when that is safe.

- `<nav>` is already a landmark. Sync does not add a redundant `role="navigation"`.
- An element with no role that is not a list (`ol`, `ul`, or `menu`) gets `role="navigation"`.
- `role="navigation"` on a list would drop the list semantics, so `<ol pagination>`, `<ul pagination>`, and `<menu pagination>` are left alone. They are not given `aria-label="Pagination"` either.
- An author `role` is never overwritten. A `role="group"` root stays a group and is not labeled.
- Ancestor `<nav>` elements are not relabeled. A parent nav may be a larger landmark than this page set.

**Landmark name:** when the root is a navigation landmark and `aria-label`, `aria-labelledby`, and `title` are all missing or blank, sync sets `aria-label="Pagination"`. A non-empty author name is kept, including a non-empty `title`. Lists and other non-navigation roots are not given that label. That landmark name is the only string this runtime invents. It does not invent names for individual controls.

**Current page:** `aria-current="page"` paints the current control. Sync keeps a single one inside the root when the set has a page control.

- If the author already set `aria-current="page"`, the first one in tree order stays. Any others in this root are removed. A current on the root itself counts, and it wins when it is first.
- If none is set, the first page control is marked, on its link or button when it has one.
- A set with no page control is left without a current page. Ellipsis and status are not page controls, so they are not chosen as that fallback.
- A later `sync()` keeps the first current. It does not jump back to the first page control after `setCurrent()` has moved the marker.
- Sync does not rewrite a control’s `href`.

**Ends:** prev and next are disabled when that is inferable from page controls and optional ellipsis. Status text is not parsed.

- Prev is disabled when the current page is the first page control and no ellipsis sits before it.
- Prev is also disabled when that control’s trimmed text or `aria-label` is the digits `1`, even if an ellipsis sits before it.
- Next is disabled when the current page is the last page control and no ellipsis sits after it. There is no matching “last page number” read from the label.
- A single page control with no ellipsis disables both ends.
- A set with no page control, or a kept current that is not on a page control, does not infer either end.
- Author-owned disabled (`aria-disabled="true"`, native `disabled`, or `[disabled]` already present before this runtime wrote it) is never cleared.
- Runtime-owned disabled is `aria-disabled="true"`. On a button, the runtime also sets the `disabled` property so the button does not activate. An anchor gets `aria-disabled` only. A disabled link’s click is cancelled so it does not navigate.

Theme paint uses `--juice-pagination-*` roles (`surface`, `surface-hover`, `surface-current`, `ink`, `ink-hover`, `ink-current`, `ink-disabled`, `border`, `focus-ring`, `ellipsis`). Core CSS does not give `[pagination]` a z-index. It is inline nav chrome — see [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands). The trail stays transparent; `surface` is the page control, not a bar. See the [Theme Contract](./juice-theme-contract.md) and [Attributes](./juice-attributes.md).

## Automatic Boot

The runtime starts automatically in the browser.

At the bottom of the file, Juice checks whether it is running in a browser environment and then boots the pagination runtime:

```ts
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      startPaginationRuntime();
    });
  } else {
    startPaginationRuntime();
  }
}
```

Importing the Juice JS entrypoint is enough for the normal behavior.

`stopPaginationRuntime()` also cancels a deferred `DOMContentLoaded` boot, so a test or host that stops the singleton before ready does not get a surprise start.

## Public API

The runtime still exposes functions, but they are secondary to the automatic behavior.

```ts
createPagination(options?)
initPagination(options?)
startPaginationRuntime()
stopPaginationRuntime()
```

These are useful for internal control, tests, or advanced cases.

`createPagination()` can run alongside the automatic document runtime. Each click or key event is claimed once, so a custom-root controller does not double-fire with the singleton.

`initPagination()` is the same function as `createPagination()`.

## PaginationOptions

The configurable shape is:

```ts
type PaginationOptions = {
  root?: ParentNode;
  paginationSelector?: string;
  itemSelector?: string;
};
```

By default, Juice uses:

```ts
{
  root: document,
  paginationSelector: '[pagination]',
  itemSelector: '[pagination-item]',
}
```

## PaginationController

```ts
type PaginationController = {
  destroy: () => void;
  sync: () => void;
  setCurrent: (
    itemOrIndex: HTMLElement | number,
    pagination?: HTMLElement | null
  ) => void;
};
```

`sync()` walks each managed root and applies the landmark, current-page, and end rules. `setCurrent()` moves that single `aria-current="page"`. An element target resolves to the page control that contains it. When that element is a link or button inside the cell, the element is marked; otherwise the preferred target is the cell’s link or button, or the cell itself. An index applies to page controls only (prev and next are not pages), on the given root, or on the first root when `pagination` is omitted. A non-integer index, or an index that does not match a page control, is a no-op. `setCurrent()` is not a navigation: it does not change the URL, follow a link, or listen to history.

A later `sync()` keeps an existing current. It does not jump back to the first page control after `setCurrent()` has moved the marker. Moving the current also refreshes disabled prev/next. Runtime-owned disabled clears when the current page leaves that end. Author-owned disabled stays.

## What the Runtime Actually Does

The runtime performs seven main jobs:

1. Find `[pagination]` roots. `nav[type="pagination"]` is ignored. A part belongs to its nearest root. Nested page sets stay independent
2. Make the root a navigation landmark only when that is safe. `<nav>` is left without a redundant role. A non-list element with no role gets `role="navigation"`. `<ol>`, `<ul>`, and `<menu>` stay lists. An author role is kept. Ancestor navs are not relabeled
3. Name that landmark `Pagination` only when it is a navigation landmark and `aria-label`, `aria-labelledby`, and `title` are missing or blank. A non-empty author name is kept. Lists and other non-navigation roots are not labeled
4. Keep a single `aria-current="page"`. An author current wins: the first in tree order stays and the rest in that root are removed. A current on the root itself counts. If none is set, the first page control is marked, on its link or button when it has one. A set with no page control is left without a current page. Ellipsis and status are not that fallback. `href` is left alone
5. Disable prev and next at the ends when page controls and optional ellipsis make that inferable. Status text is not parsed. Page `1` disables prev even when an ellipsis sits before the current control. An ellipsis after the current page keeps next enabled. Author-owned disabled is never cleared. Runtime-owned disabled is `aria-disabled="true"`, and `disabled` on buttons. A disabled link click is cancelled
6. Move focus with ArrowLeft / ArrowUp and ArrowRight / ArrowDown to the previous or next enabled control, and with Home / End to the first or last enabled control. Disabled controls are skipped. Focus does not wrap. Enter and Space stay with the browser. Ellipsis and status are not in that set
7. `setCurrent()` moves that single current by page control or page index. It is not a navigation. A later `sync()` keeps the first current instead of resetting to the first page control, and it refreshes the ends

Escape is not handled. Pagination does not participate in the overlay / popover / menu / combobox / toast / tooltip yield order. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering).

There is no focus trap. This runtime does not close a modal, drawer, toast, popover, wizard, tooltip, combobox, banner, or menu, and it does not toggle a switch, move a slider, toggle a checkbox, select a radio, move a breadcrumb current page, or change a progress value.

## Why MutationObserver Is Used

The DOM may change after the initial page load. That is what happens in reactive or server-hydrated environments.

If a page set appears later, the observer schedules a `sync()` call so Juice can wire the landmark, a single `aria-current="page"`, and disabled prev/next.

The observer watches child list changes and these attributes: `pagination`, `pagination-item`, `pagination-link`, `pagination-prev`, `pagination-next`, `pagination-ellipsis`, `pagination-status`, `aria-current`, `aria-label`, `aria-labelledby`, `aria-disabled`, `disabled`, `role`, and `title`.

## Why Sync Is Scheduled

Mutation-heavy environments can change the DOM a lot in a short burst.

So instead of calling `sync()` immediately for every change, the runtime schedules it with `requestAnimationFrame`.

That keeps the runtime from reacting too aggressively while still updating quickly enough for UI behavior.

## Keyboard

- ArrowLeft and ArrowUp move focus to the previous enabled control
- ArrowRight and ArrowDown move focus to the next enabled control
- Home moves to the first enabled control. End moves to the last
- The set is page controls plus prev and next. Ellipsis and status are skipped. Disabled controls are skipped
- Focus does not wrap. An arrow at an end is handled and focus stays
- Enter and Space are not handled. They stay with the browser
- Escape is not handled. Pagination never steals it. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering)
- Alt, Ctrl, Meta, and Shift are ignored
- Keys from an editable control inside the page set (`input`, `textarea`, `select`, or `contenteditable`) are ignored
- There is no focus trap. Tab is not wrapped. The runtime does not set `tabindex`

Authors own whether a control is a link. The runtime does not remove `href`.

## Limitations

- No `Pagination()` factory. Author markup (or emit it from Sig/React) and let the runtime enhance it.
- This surface is Emerging, not Stable-ish. Pagination is the nineteenth Emerging auto-enhance runtime, unpublished versus `@citrusworx/juiceui@0.9.0`.
- This is not a router. v1 does not listen to history, and `setCurrent()` does not navigate or remove `href`.
- The only invented name is `aria-label="Pagination"` on an unlabeled navigation landmark. Control names stay author-owned.
- `<nav pagination>` does not get a redundant `role="navigation"`. `<ol>`, `<ul>`, and `<menu>` stay lists and are not labeled. An author role is never overwritten. Ancestor navs are not relabeled.
- `nav[type="pagination"]` is not this chrome and is not enhanced.
- When more than one `aria-current="page"` is set, sync keeps the first in tree order. When none is set, the first page control is marked, on its link or button when it has one. A set with no page control gets no current page.
- `setCurrent()` with an index that does not match a page control is a no-op. Prev and next are not page indexes. It does not fall back to another root unless `pagination` is omitted, in which case the first root is used.
- A later `sync()` preserves an existing current. It does not move the marker back to the first page control.
- Ends are inferred from page controls and ellipsis, not from `[pagination-status]` text. Page `1` (digits only, on the control text or `aria-label`) disables prev. An ellipsis after the current page keeps next enabled.
- Author-owned disabled is never cleared. Runtime-owned disabled is `aria-disabled="true"`, plus the `disabled` property on buttons. A disabled link click is cancelled.
- Arrow / Home / End move focus among enabled controls and do not wrap. Enter and Space stay with the browser. There is no focus trap and no Escape handling. Pagination is not a layered overlay. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering).
- There is no z-index elevation. Pagination is inline nav chrome. See [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands).
- Centered modal / dialog, edge-docked drawer, toast-stack, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, breadcrumb, and progress behavior are not part of this runtime. See [Modal Runtime](./juice-modal-runtime.md), [Drawer Runtime](./juice-drawer-runtime.md), [Toast Runtime](./juice-toast-runtime.md), [Popover Runtime](./juice-popover-runtime.md), [Wizard Runtime](./juice-wizard-runtime.md), [Tooltip Runtime](./juice-tooltip-runtime.md), [Combobox Runtime](./juice-combobox-runtime.md), [Banner Runtime](./juice-banner-runtime.md), [Menu Runtime](./juice-menu-runtime.md), [Switch Runtime](./juice-switch-runtime.md), [Slider Runtime](./juice-slider-runtime.md), [Checkbox Runtime](./juice-checkbox-runtime.md), [Radio Runtime](./juice-radio-runtime.md), [Breadcrumb Runtime](./juice-breadcrumb-runtime.md), and [Progress Runtime](./juice-progress-runtime.md).

## Why This Matches Navigation

The pagination runtime copies the navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, breadcrumb, and progress lifecycle by convention:

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
