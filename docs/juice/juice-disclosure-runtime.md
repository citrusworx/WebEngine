# Juice Disclosure Runtime

This document explains the current disclosure runtime in `libraries/juice/src/js/src/disclosure/disclosure-runtime.ts` (monorepo path; outside this vault).

The key idea is the same as navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, breadcrumb, progress, and pagination:

> If a user writes valid Juice disclosure markup and it exists in the browser, the trigger, the panel, and Escape should just work.

That is the standard.

## The Goal

The disclosure runtime is not a framework adapter and not a second component API.

It is a browser-side Juice feature that works regardless of how the markup got into the DOM.

That means it should work for:

- raw HTML pages
- Twig or other server-rendered templates
- Sig-rendered DOM
- React-rendered DOM
- any other environment that eventually produces browser DOM

The user should not need to manually initialize disclosure behavior in their app code.

There is no `Disclosure()` Sig factory. Markup plus the runtime is the contract.

This surface is Emerging, not Stable-ish. Valid markup should work after importing the JS entry, but the API is still likely to evolve.

Disclosure is the APG **Disclosure** pattern: one trigger, one panel. It is not an accordion. Accordion stays multi-item `[accordion]` / `[accordion-item]` (multi-open). Disclosure is not a layered overlay. There is no exclusive group and no arrow-key roving tabindex.

Disclosure is the twentieth Emerging auto-enhance runtime. `@citrusworx/juiceui@0.9.0` shipped eighteen (navigation through progress). `@citrusworx/juiceui@0.9.1` is the live npm cut and adds pagination, the nineteenth. Spinner is the twenty-first. Select is the twenty-second. Input is the twenty-third. Textarea is the twenty-fourth. Disclosure, spinner, select, input, and textarea are unpublished versus 0.9.1. All twenty-four stay Emerging.

## Markup Contract

The runtime is aligned with Juice’s disclosure chrome:

```html
<section disclosure name="shift-notes">
  <button type="button" disclosure-trigger aria-expanded="false">
    Shift notes
  </button>
  <div disclosure-panel hidden>
    Gate B closes at 9.
  </div>
</section>

<section disclosure>
  <button type="button" disclosure-trigger aria-controls="gate-panel">
    Gate
  </button>
  <div id="gate-panel" disclosure-panel hidden>
    Use gate C.
  </div>
</section>
```

`[disclosure]` is the root. `[disclosure-trigger]` is the button. `[disclosure-panel]` is the controlled region. A boolean `[disclosure]` attribute is fine. There is no HTML global `disclosure` attribute.

**What this runtime enhances:**

- A `[disclosure]` root. A plain element with `[disclosure]` is enhanced. Typical hosts are `<section disclosure>` and `<div disclosure>`.
- Triggers and panels belong to the nearest `[disclosure]`. Nested disclosures stay independent.
- Orphan `[disclosure-trigger]` and `[disclosure-panel]` nodes outside a `[disclosure]` root are ignored. Accordion markup (`[accordion]` / `[accordion-item]`) is not enhanced here.

**Pairing:** each trigger owns one panel.

- If the trigger has `aria-controls`, the element with that id inside the same root is the panel. The lookup stays inside the root. A control id that points at the trigger itself is ignored.
- Otherwise the next sibling is the panel when it is a `[disclosure-panel]`, or when it is not another trigger and not a nested `[disclosure]`. An unmarked next sibling is enough.
- A later sibling is used when the immediate next sibling is another trigger or a nested disclosure.

**Ids and names:** sync fills missing ids and the pair relationship. Author ids are kept.

- A `name` on the root becomes the slug (`shift-notes` → `shift-notes-trigger` / `shift-notes-panel`). The slug is trimmed, lowercased, and non-alphanumeric runs become dashes.
- Without a name, generated ids are `juice-disclosure-trigger-N` and `juice-disclosure-panel-N`.
- More than one trigger in the same root is not an exclusive group. Generated ids gain a numeric suffix (`name-trigger-1`, `name-panel-1`). The contract is still one trigger and one panel. Extra triggers in one root stay independent.

**Accessibility wiring:** sync writes the pair, not a second component API.

- `aria-controls` on the trigger is set to the panel id.
- The panel gets `role="region"` and `aria-labelledby` pointing at the trigger.
- A trigger that is not a `<button>` and not an `<a href>` gets `role="button"`. It gets `tabindex="0"` only when `tabindex` is missing. Buttons and links with `href` keep their native role and tabindex.

**Open and closed:** state is `aria-expanded` on the trigger plus native `hidden` and `aria-hidden` on the panel. This runtime never writes layout `content="active"` or `content="hidden"`.

- When a panel is paired, native `hidden` is the source of truth. Sync writes `aria-expanded` and `aria-hidden` to match. An author `aria-expanded="true"` on a still-hidden panel is corrected to closed.
- A trigger with no panel and no `aria-expanded` becomes `aria-expanded="false"`. An author `aria-expanded` without a panel is kept.
- Expanded paint is `aria-expanded="true"` on the trigger. Closed panels use the native `hidden` attribute.

There is no exclusive group. Opening one disclosure does not collapse another. Arrow keys do not move a roving tabindex.

Theme paint uses `--juice-disclosure-*` roles (`surface`, `border`, `trigger`, `trigger-hover`, `trigger-open`, `ink`, `chevron`, `focus-ring`). Core CSS does not give `[disclosure]` a z-index. It is inline chrome — see [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands). `surface` is the panel, not a bar. The trigger is a surface, not the CTA button gradient. See the [Theme Contract](./juice-theme-contract.md) and [Attributes](./juice-attributes.md).

## Automatic Boot

The runtime starts automatically in the browser.

At the bottom of the file, Juice checks whether it is running in a browser environment and then boots the disclosure runtime:

```ts
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      startDisclosureRuntime();
    });
  } else {
    startDisclosureRuntime();
  }
}
```

Importing the Juice JS entrypoint is enough for the normal behavior.

`stopDisclosureRuntime()` also cancels a deferred `DOMContentLoaded` boot, so a test or host that stops the singleton before ready does not get a surprise start.

## Public API

The runtime still exposes functions, but they are secondary to the automatic behavior.

```ts
createDisclosure(options?)
initDisclosure(options?)
startDisclosureRuntime()
stopDisclosureRuntime()
```

These are useful for internal control, tests, or advanced cases.

`createDisclosure()` can run alongside the automatic document runtime. Each click or key event is claimed once, so a custom-root controller does not double-fire with the singleton.

`initDisclosure()` is the same function as `createDisclosure()`.

## DisclosureOptions

The configurable shape is:

```ts
type DisclosureOptions = {
  root?: ParentNode;
  disclosureSelector?: string;
  triggerSelector?: string;
};
```

By default, Juice uses:

```ts
{
  root: document,
  disclosureSelector: '[disclosure]',
  triggerSelector: '[disclosure-trigger]',
}
```

## DisclosureController

```ts
type DisclosureController = {
  destroy: () => void;
  sync: () => void;
  expand: (trigger?: HTMLElement | null) => void;
  collapse: (trigger?: HTMLElement | null) => void;
  toggle: (trigger?: HTMLElement | null) => void;
};
```

`sync()` walks each managed root and applies pairing, ids, and open/closed state. `expand()`, `collapse()`, and `toggle()` act on one trigger. An element argument resolves to that trigger when it matches `[disclosure-trigger]` inside a root, or to the closest trigger. When the argument is omitted, the first trigger in tree order is used. A node that is not inside a `[disclosure]` root is ignored.

`expand()` opens that pair and remembers it as the last opened disclosure. `collapse()` closes it. If that trigger was the last opened one, the last-opened memory moves to another disclosure that is still open, or clears. `toggle()` expands when the panel is hidden and collapses when it is open. These methods do not close siblings. They never write layout `content=`.

## What the Runtime Actually Does

The runtime performs seven main jobs:

1. Find `[disclosure]` roots. Orphans outside a root are ignored. A part belongs to its nearest root. Nested disclosures stay independent. `[accordion]` markup is not enhanced
2. Pair each trigger with one panel. `aria-controls` inside the root wins. Otherwise the next sibling panel is used, including an unmarked sibling that is not another trigger or a nested disclosure
3. Fill missing ids from the root `name` when it is set, otherwise from `juice-disclosure-trigger-N` / `juice-disclosure-panel-N`. Author ids are kept. Extra triggers in one root stay independent and get a numeric suffix. They are not an exclusive group
4. Wire `aria-controls`, `role="region"`, and `aria-labelledby`. A non-button trigger that is not an anchor with `href` gets `role="button"` and `tabindex="0"` when tabindex is missing
5. Keep open/closed state on `aria-expanded`, native `hidden`, and `aria-hidden`. When a panel exists, `hidden` wins and sync rewrites the other two to match. Layout `content=` is never written
6. Toggle on click. Enter and Space toggle only non-button triggers that are not anchors with `href`. Buttons and those anchors keep the browser activation path
7. Escape collapses the focused open disclosure, or the last opened one, and returns focus to that trigger. It yields to an open modal, drawer, or popover, and to an already-handled Escape. There is no global disclosure Escape

There is no focus trap and no arrow-key roving tabindex. This runtime does not close a modal, drawer, toast, popover, wizard, tooltip, combobox, banner, or menu, and it does not toggle a switch, move a slider, toggle a checkbox, select a radio, move a breadcrumb or pagination current page, change a progress value, or collapse an accordion item.

## Why MutationObserver Is Used

The DOM may change after the initial page load. That is what happens in reactive or server-hydrated environments.

If a disclosure appears later, the observer schedules a `sync()` call so Juice can wire the pair and the open/closed state.

The observer watches child list changes and these attributes: `hidden`, `aria-expanded`, `aria-controls`, `disclosure`, `disclosure-trigger`, and `disclosure-panel`.

## Why Sync Is Scheduled

Mutation-heavy environments can change the DOM a lot in a short burst.

So instead of calling `sync()` immediately for every change, the runtime schedules it with `requestAnimationFrame`.

That keeps the runtime from reacting too aggressively while still updating quickly enough for UI behavior.

## Keyboard

- Click toggles the trigger’s panel
- Enter and Space toggle a trigger that is not a `<button>` and not an `<a href>`. Those keys are prevented so the host does not do something else
- Enter and Space on a `<button>` or an `<a href>` stay with the browser. A button’s activation still arrives as a click, and that click toggles
- Arrow keys are not handled. There is no roving tabindex
- Escape collapses the focused open disclosure, or the disclosure whose panel contains the event target. If neither applies, it collapses the last opened disclosure that is still open. Focus returns to that trigger
- Escape does nothing when no disclosure is open. It does not collapse every open disclosure
- Escape yields when the event is already handled, or when an open `[modal-overlay]`, `[drawer-overlay]`, or `[popover-root]` exists. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering)
- There is no focus trap. Tab is not wrapped

Authors own the accessible name on the trigger. The runtime does not invent a visible label. It does label the panel with `aria-labelledby`.

## Limitations

- No `Disclosure()` factory. Author markup (or emit it from Sig/React) and let the runtime enhance it.
- This surface is Emerging, not Stable-ish. Disclosure is the twentieth Emerging auto-enhance runtime, unpublished versus `@citrusworx/juiceui@0.9.1`. Pagination shipped in that cut and remains the nineteenth. Spinner is the twenty-first and is also unpublished versus that cut. Select is the twenty-second and is also unpublished versus that cut. Input is the twenty-third and is also unpublished versus that cut. Textarea is the twenty-fourth and is also unpublished versus that cut. All twenty-four stay Emerging.
- This is not an accordion. `[accordion]` / `[accordion-item]` is a different runtime. The two do not toggle each other.
- Orphan triggers and panels outside `[disclosure]` are ignored.
- There is no exclusive group. Opening one disclosure leaves the others open. Arrow-key roving tabindex is out of scope.
- The contract is one trigger and one panel. Extra triggers inside one root are paired independently. They are not a stack and not an accordion.
- When a panel is paired, native `hidden` wins over a conflicting `aria-expanded`. Sync rewrites `aria-expanded` and `aria-hidden` to match. Layout `content=` is never written.
- Generated ids use the root `name` when it is set. Author ids are kept. `aria-controls`, panel `role`, and `aria-labelledby` are written to the pair.
- A non-native trigger gets `role="button"`. `tabindex="0"` is added only when `tabindex` is missing. Buttons and anchors with `href` are left to the browser for Enter and Space.
- The runtime does not special-case `disabled` or `aria-disabled`. A native disabled button does not click. An `aria-disabled` trigger still toggles.
- A link trigger’s click is not cancelled, so an `<a href disclosure-trigger>` can navigate and toggle.
- Escape collapses one disclosure: the focused open one, the one whose panel contains focus, or the last opened. It yields to an open modal, drawer, or popover. There is no global disclosure Escape and no focus trap. Disclosure is not a layered overlay. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering).
- There is no z-index elevation. Disclosure is inline chrome. Tabs, accordion, and disclosure do not set a stacking band. See [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands).
- Centered modal / dialog, edge-docked drawer, toast-stack, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, breadcrumb, progress, pagination, and accordion behavior are not part of this runtime. See [Modal Runtime](./juice-modal-runtime.md), [Drawer Runtime](./juice-drawer-runtime.md), [Toast Runtime](./juice-toast-runtime.md), [Popover Runtime](./juice-popover-runtime.md), [Wizard Runtime](./juice-wizard-runtime.md), [Tooltip Runtime](./juice-tooltip-runtime.md), [Combobox Runtime](./juice-combobox-runtime.md), [Banner Runtime](./juice-banner-runtime.md), [Menu Runtime](./juice-menu-runtime.md), [Switch Runtime](./juice-switch-runtime.md), [Slider Runtime](./juice-slider-runtime.md), [Checkbox Runtime](./juice-checkbox-runtime.md), [Radio Runtime](./juice-radio-runtime.md), [Breadcrumb Runtime](./juice-breadcrumb-runtime.md), [Progress Runtime](./juice-progress-runtime.md), [Pagination Runtime](./juice-pagination-runtime.md), and [Accordion Runtime](./juice-accordion-runtime.md).

## Why This Matches Navigation

The disclosure runtime copies the navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, breadcrumb, progress, and pagination lifecycle by convention:

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
