# Juice Tabs Runtime

This document explains the current tabs runtime in `libraries/juice/src/js/src/tabs/tabs-runtime.ts` (monorepo path; outside this vault).

The key idea is the same as navigation and accordion:

> If a user writes valid Juice tabs markup and it exists in the browser, the tab selection behavior should just work.

That is the standard.

## The Goal

The tabs runtime is not a framework adapter and not a second component API.

It is a browser-side Juice feature that works regardless of how the markup got into the DOM.

That means it should work for:

- raw HTML pages
- Twig or other server-rendered templates
- Sig-rendered DOM
- React-rendered DOM
- any other environment that eventually produces browser DOM

The user should not need to manually initialize tabs behavior in their app code.

There is no `Tabs()` Sig factory. Markup plus the runtime is the contract.

## Markup Contract

The runtime is aligned with Juice’s tabs chrome:

```html
<div tabs name="settings">
  <div tabs-list>
    <button type="button" tab active>Account</button>
    <button type="button" tab>Billing</button>
  </div>
  <div tab-panel>Account panel</div>
  <div tab-panel hidden>Billing panel</div>
</div>
```

It requires a `[tabs]` root. Orphan `[tab]` / `[tab-panel]` nodes outside a root are ignored.

Triggers are `[tab]` nodes, `[role="tab"]` nodes, or direct-child `button` elements in `[tabs-list]` (or, for legacy strip markup, on `[tabs]` itself). Buttons inside `[tab-panel]` stay ordinary controls.

A root may use `[tabs-list]` for the strip, or legacy markup:

- strip-only: `[tabs]` with direct `[tab]` / `button` children and no panels
- mixed: direct triggers plus `[tab-panel]` children, without `[tabs-list]`

Selection is exclusive. One trigger is selected per root. Visible vs hidden panels use native `hidden` plus ARIA. The runtime does **not** write `content="active"` or `content="hidden"`. Those values clash with Juice layout `[content]`.

Selected state is dual-written: Juice `[active]` and `aria-selected="true"` together. CSS paints both. Prefer shipping both in markup; the runtime fills the other if only one is present.

## Automatic Boot

The runtime starts automatically in the browser.

At the bottom of the file, Juice checks whether it is running in a browser environment and then boots the tabs runtime:

```ts
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      startTabsRuntime();
    });
  } else {
    startTabsRuntime();
  }
}
```

Importing the Juice JS entrypoint is enough for the normal behavior.

## Public API

The runtime still exposes functions, but they are secondary to the automatic behavior.

```ts
createTabs(options?)
initTabs(options?)
startTabsRuntime()
stopTabsRuntime()
```

These are useful for internal control, tests, or advanced cases.

`createTabs()` can run alongside the automatic document runtime. Each click or key event is claimed once, so a custom-root controller does not double-select with the singleton.

## TabsOptions

The configurable shape is:

```ts
type TabsOptions = {
  root?: ParentNode;
  tabsSelector?: string;
  listSelector?: string;
  triggerSelector?: string;
  panelSelector?: string;
};
```

By default, Juice uses:

```ts
{
  root: document,
  tabsSelector: '[tabs]',
  listSelector: '[tabs-list]',
  triggerSelector: '[tab]',
  panelSelector: '[tab-panel]',
}
```

## TabsController

```ts
type TabsController = {
  destroy: () => void;
  sync: () => void;
  select: (trigger?: HTMLElement | null) => void;
};
```

## What the Runtime Actually Does

The runtime performs six main jobs:

1. Find `[tabs]` roots, their `[tabs-list]` (when present), `[tab]` triggers, and `[tab-panel]` panels
2. Pair each trigger with its panel (`aria-controls`, then same-index panel, then the next sibling)
3. Fill missing ids, `role="tablist"` / `role="tab"` / `role="tabpanel"`, `aria-controls`, and `aria-labelledby`
4. Dual-write Juice `[active]` and `aria-selected`, plus roving `tabindex` (`0` selected, `-1` others)
5. Show the selected panel and hide the others with native `hidden` plus `aria-hidden`
6. Handle click and APG keyboard on the tab strip

If no trigger is already `[active]` or `aria-selected="true"`, the first trigger is selected.

When `[tabs]` has a `name`, that value becomes the tablist `aria-label` (unless one is already set) and the slug used for generated ids (`settings-tab-1`, `settings-panel-1`).

## Why MutationObserver Is Used

The DOM may change after the initial page load. That is what happens in reactive or server-hydrated environments.

If a tabs widget appears later, the observer schedules a `sync()` call so Juice can wire ids and ARIA and start handling clicks.

## Why Sync Is Scheduled

Mutation-heavy environments can change the DOM a lot in a short burst.

So instead of calling `sync()` immediately for every change, the runtime schedules it with `requestAnimationFrame`.

That keeps the runtime from reacting too aggressively while still updating quickly enough for UI behavior.

## Keyboard

The strip uses WAI-ARIA APG tabs with **horizontal automatic activation**: moving focus also selects that tab and shows its panel.

- ArrowRight / ArrowLeft wrap to the next / previous trigger, then select and focus it
- Home / End jump to the first / last trigger
- Enter and Space activate non-button `[tab]` triggers (native buttons already synthesize a click)

Escape, ArrowUp, and ArrowDown are intentionally out of scope. There is no vertical orientation.

## Limitations

- No `Tabs()` factory. Author markup (or emit it from Sig/React) and let the runtime enhance it.
- Orphan `[tab]` / `[tab-panel]` nodes outside `[tabs]` are ignored.
- Selection is exclusive per root. Multi-select tabs are not part of this runtime.
- Panels use native `hidden`, never layout `content=`.
- Keyboard is horizontal only.

## Why This Matches Navigation

The tabs runtime copies the navigation and accordion lifecycle by convention:

- DOM-first
- automatic boot
- event delegation
- MutationObserver plus rAF `sync()`
- idempotent singleton `start*Runtime` / `stop*Runtime`
- framework-agnostic

It does not introduce a shared multi-feature runtime module.

## Design Rule Going Forward

Interactive Juice browser features should follow this standard:

> If valid Juice markup exists in the browser, the feature should activate automatically and work without app glue.
