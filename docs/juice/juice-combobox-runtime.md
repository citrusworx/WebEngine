# Juice Combobox Runtime

This document explains the current combobox runtime in `libraries/juice/src/js/src/combobox/combobox-runtime.ts` (monorepo path; outside this vault).

The key idea is the same as navigation, accordion, tabs, modal, drawer, toast, popover, wizard, and tooltip:

> If a user writes valid Juice combobox markup and it exists in the browser, the listbox should just work.

That is the standard.

## The Goal

The combobox runtime is not a framework adapter and not a second component API.

It is a browser-side Juice feature that works regardless of how the markup got into the DOM.

That means it should work for:

- raw HTML pages
- Twig or other server-rendered templates
- Sig-rendered DOM
- React-rendered DOM
- any other environment that eventually produces browser DOM

The user should not need to manually initialize combobox behavior in their app code.

There is no `Combobox()` Sig factory. Markup plus the runtime is the contract.

This surface is Emerging, not Stable-ish. Valid markup should work after importing the JS entry, but the API is still likely to evolve.

Combobox is an editable input plus a listbox popup (APG list autocomplete, manual selection). It is not a native `<select>` restyle, not a popover, not a tooltip, and not a dialog overlay. Single-select only. No async / remote fetch, no creatable options, and no multi-select.

## Markup Contract

The runtime is aligned with Juice’s combobox chrome:

```html
<div combobox name="fruit">
  <input combobox-input type="text" />
  <button type="button" combobox-trigger aria-label="Show fruits"></button>
  <ul combobox-list hidden>
    <li combobox-option>Apple</li>
    <li combobox-option>Banana</li>
    <li combobox-option data-value="apricot">Apricot</li>
  </ul>
</div>
```

It requires a `[combobox]` root. Closed vs open is the native `hidden` attribute on `[combobox-list]`. The runtime does **not** write `content="active"` or `content="hidden"`. Those values clash with Juice layout `[content]`.

**Do not restyle or replace native `<select>`.** Combobox is Juice chrome: an input plus a listbox popup. Use role in markup; attrs own Juice structure.

**Parts:**

- `[combobox]` — composite root
- `[combobox-input]` — text field (`role="combobox"`)
- `[combobox-trigger]` — optional chevron button
- `[combobox-list]` — popup (`role="listbox"`)
- `[combobox-option]` — row (`role="option"`)

Prefer shipping those roles in markup. The runtime fills them if they are missing, plus a missing list / option id, `aria-controls` from the input (and trigger) to the list, `aria-autocomplete="list"` on the input, and `aria-haspopup="listbox"` on the trigger.

When `[combobox]` has a `name` or `id`, that value becomes the slug used for generated ids (`fruit-list`, `fruit-option-1`).

Theme paint uses `--juice-combobox-*` roles. Core CSS paints `[combobox-list]` at **z-index 1050** (same band as popover, below tooltip `1060` and toast `1100`). See the [Theme Contract](./juice-theme-contract.md) and [Attributes](./juice-attributes.md). `[combobox]` is an input + listbox popup, not a native select, not a popover, not a tooltip, not a dialog overlay, and not the surface `overlay="frost|tint"` utility. Optional `surfaceTone` on `[combobox-list]` is allowed; do not force it.

## Automatic Boot

The runtime starts automatically in the browser.

At the bottom of the file, Juice checks whether it is running in a browser environment and then boots the combobox runtime:

```ts
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      startComboboxRuntime();
    });
  } else {
    startComboboxRuntime();
  }
}
```

Importing the Juice JS entrypoint is enough for the normal behavior.

`stopComboboxRuntime()` also cancels a deferred `DOMContentLoaded` boot, so a test or host that stops the singleton before ready does not get a surprise start.

## Public API

The runtime still exposes functions, but they are secondary to the automatic behavior.

```ts
createCombobox(options?)
initCombobox(options?)
startComboboxRuntime()
stopComboboxRuntime()
```

These are useful for internal control, tests, or advanced cases.

`createCombobox()` can run alongside the automatic document runtime. Each click, focus, input, or key event is claimed once, so a custom-root controller does not double-fire with the singleton.

## ComboboxOptions

The configurable shape is:

```ts
type ComboboxOptions = {
  root?: ParentNode;
  rootSelector?: string;
  inputSelector?: string;
  triggerSelector?: string;
  listSelector?: string;
  optionSelector?: string;
};
```

By default, Juice uses:

```ts
{
  root: document,
  rootSelector: '[combobox]',
  inputSelector: '[combobox-input]',
  triggerSelector: '[combobox-trigger]',
  listSelector: '[combobox-list]',
  optionSelector: '[combobox-option]',
}
```

## ComboboxController

```ts
type ComboboxController = {
  destroy: () => void;
  sync: () => void;
  open: (target?: HTMLElement | null) => void;
  close: (target?: HTMLElement | null) => void;
  toggle: (target?: HTMLElement | null) => void;
  select: (target?: HTMLElement | null) => void;
};
```

`open()` / `close()` / `toggle()` toggle native `hidden` on `[combobox-list]`. `select()` commits one option and then closes.

## What the Runtime Actually Does

The runtime performs eight main jobs:

1. Find `[combobox]` roots and resolve the input, optional trigger, list, and options inside that root. Orphan nodes outside a `[combobox]` are ignored
2. Fill missing roles (`combobox` / `listbox` / `option`), list and option ids, `aria-autocomplete="list"`, `aria-controls`, and trigger `aria-haspopup="listbox"`
3. Open on input focus, typing, or trigger click. Close on Escape, outside click, blur (unless focus stays inside the combobox), Tab, or after select. Option `mousedown` is prevented so the input keeps focus through click-to-select
4. Filter visible options with a case-insensitive substring against option text and, when present, `data-value`. Non-matches get `hidden`. An empty match set stays open
5. Write `aria-expanded` on the input and, when present, the trigger. Visual / keyboard focus on a row is `aria-activedescendant` plus `combobox-option="active"`
6. Select is single-select only. The input value becomes option text, or `data-value` when that attribute is present. The chosen option gets `aria-selected="true"`; siblings are cleared
7. Opening one managed combobox closes the others. Exclusive open is among comboboxes
8. Closing (including after select, Tab, or Escape) clears `combobox-option="active"` and `aria-activedescendant` so a later Enter cannot commit a stale option

Focus stays on the input. There is no focus trap. Disabled inputs are ignored.

Exclusive open is among comboboxes. This runtime does not close a modal, drawer, toast, popover, wizard, or tooltip, and those runtimes do not close a combobox.

## Filter

Filter is case-insensitive substring match.

The query is the current input value. Each option matches when its text includes that query, or when a `data-value` attribute includes it. Non-matches get the native `hidden` attribute. An empty query shows every option. An empty match set leaves the list open with no visible rows.

Closing reveals hidden options again so the next open starts from a full list, then re-filters from the current input.

## Placement

Placement is CSS-only. There is no Floating UI.

`[combobox-list]` is absolutely positioned under the field. Core CSS paints it at z-index **1050**. The runtime does not measure, flip, or shift the list.

## Why MutationObserver Is Used

The DOM may change after the initial page load. That is what happens in reactive or server-hydrated environments.

If a combobox appears later, the observer schedules a `sync()` call so Juice can wire ids and ARIA, start handling focus / typing / keys, and filter any already-open list.

## Why Sync Is Scheduled

Mutation-heavy environments can change the DOM a lot in a short burst.

So instead of calling `sync()` immediately for every change, the runtime schedules it with `requestAnimationFrame`.

That keeps the runtime from reacting too aggressively while still updating quickly enough for UI behavior.

## Keyboard

- ArrowDown / ArrowUp open the list if needed, then move `combobox-option="active"` among visible options (no wrap). Focus stays on the input; `aria-activedescendant` tracks the active row
- Home / End move to the first / last visible option while the list is open. Closed, those keys keep native input-cursor behavior
- Enter selects the active option
- Escape closes without changing the input value
- Tab closes without committing the active option (APG manual selection). Focus moves on
- IME composition keys are ignored
- Enter / Space on a non-button trigger toggles the list

There is no focus trap. Tab is not wrapped. The runtime does not move focus into the list.

## Limitations

- No `Combobox()` factory. Author markup (or emit it from Sig/React) and let the runtime enhance it.
- Distinct from native `<select>`. Do not restyle or replace `<select>`.
- Single-select only. No multi-select, no async / remote fetch, and no creatable options.
- Orphan `[combobox-input]` / `[combobox-list]` / `[combobox-option]` nodes that are not inside `[combobox]` are ignored.
- Lists use native `hidden`, never layout `content=`.
- Opening is exclusive among comboboxes. Only one managed list is open at a time.
- Placement has no Floating UI. The list stays CSS-absolute under the field.
- Centered modal / dialog, edge-docked drawer, toast-stack, popover, wizard, and tooltip behavior are not part of this runtime. See [Modal Runtime](./juice-modal-runtime.md), [Drawer Runtime](./juice-drawer-runtime.md), [Toast Runtime](./juice-toast-runtime.md), [Popover Runtime](./juice-popover-runtime.md), [Wizard Runtime](./juice-wizard-runtime.md), and [Tooltip Runtime](./juice-tooltip-runtime.md).

## Why This Matches Navigation

The combobox runtime copies the navigation, accordion, tabs, modal, drawer, toast, popover, wizard, and tooltip lifecycle by convention:

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
