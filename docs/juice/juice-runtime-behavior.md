# Juice Runtime Behavior

## Purpose

Juice is not only a CSS system.

It also has a browser runtime layer for built-in interactive behavior.

This document explains how to think about that layer.

## Core Rule

If valid Juice markup exists in the browser, the feature should work automatically.

That is the desired standard for Juice runtime behavior.

Users should not need to manually initialize built-in Juice features in normal cases.

## What This Means

Juice runtime behavior should be:

* browser-driven
* framework-agnostic
* aligned with Juice markup conventions
* automatic when possible

It should not require:

* app glue
* a framework adapter
* custom user bootstrapping for basic behavior

Juice works without Sig. The observation contract below is DOM. Sig’s optional `bind` is a separate import, `@citrusworx/sigjs/juice`, and the runtimes do not load it.

## Current Examples

The navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, breadcrumb, progress, pagination, disclosure, spinner, select, input, textarea, field, icon button, and avatar runtimes are the current examples.

They work by:

* watching for valid Juice nav, `[accordion]`, `[tabs]`, `[modal-overlay]`, `[drawer-overlay]`, `[toast-region]`, `[popover-root]`, `[wizard-shell]`, `[tooltip-root]`, `[combobox]`, `[banner]`, `[menu-root]`, `[switch]`, `[slider]`, `[checkbox]`, `[radiogroup]`, `[breadcrumb]`, `[progress]`, `[pagination]`, `[disclosure]`, `[spinner]`, `<select select>`, `<input input>`, `<textarea textarea>`, `[field]`, `[icon-button]`, or `[avatar]` markup
* booting automatically in the browser
* responding to DOM changes
* applying behavior without user init code

See [Juice Navigation Runtime](./juice-navigation-runtime.md), [Juice Accordion Runtime](./juice-accordion-runtime.md), [Juice Tabs Runtime](./juice-tabs-runtime.md), [Juice Modal Runtime](./juice-modal-runtime.md), [Juice Drawer Runtime](./juice-drawer-runtime.md), [Juice Toast Runtime](./juice-toast-runtime.md), [Juice Popover Runtime](./juice-popover-runtime.md), [Juice Wizard Runtime](./juice-wizard-runtime.md), [Juice Tooltip Runtime](./juice-tooltip-runtime.md), [Juice Combobox Runtime](./juice-combobox-runtime.md), [Juice Banner Runtime](./juice-banner-runtime.md), [Juice Menu Runtime](./juice-menu-runtime.md), [Juice Switch Runtime](./juice-switch-runtime.md), [Juice Slider Runtime](./juice-slider-runtime.md), [Juice Checkbox Runtime](./juice-checkbox-runtime.md), [Juice Radio Runtime](./juice-radio-runtime.md), [Juice Breadcrumb Runtime](./juice-breadcrumb-runtime.md), [Juice Progress Runtime](./juice-progress-runtime.md), [Juice Pagination Runtime](./juice-pagination-runtime.md), [Juice Disclosure Runtime](./juice-disclosure-runtime.md), [Juice Spinner Runtime](./juice-spinner-runtime.md), [Juice Select Runtime](./juice-select-runtime.md), and [Juice Input Runtime](./juice-input-runtime.md), [Juice Textarea Runtime](./juice-textarea-runtime.md), [Juice Field Runtime](./juice-field-runtime.md), and [Juice Icon Button Runtime](./juice-icon-button-runtime.md), and [Avatar](./juice-avatar.md). Toast is a non-modal stack (`[toast-region]` / `[toast]`), not a dialog. Popover is a non-modal anchored dialog (`[popover-root]` / `[popover-panel]`), not a modal, drawer, or toast. Wizard is a multi-step onboarding shell (`[wizard-shell]` / `[step-page]`), not a dialog and not APG Tabs. Tooltip is a hover/focus tip (`[tooltip-root]` / `[tooltip-panel]`), not a popover and not native `title`. Combobox is an input + listbox popup (`[combobox]` / `[combobox-list]`), not a native `<select>` and not a popover. Banner is an inline alert / callout (`[banner]` / `[banner-close]`), not a toast stack and not a dialog. Menu is an APG menu button (`[menu-root]` / `[menu]` / `[menuitem]`), not a popover, not a combobox, and not a menubar. Switch is an APG switch (`[switch]` on a button host, with checkbox hosts as a secondary story), not a form checkbox as the only story and not a layered overlay. Slider is an APG slider (`[slider]` track host, `[slider-thumb]` with `role="slider"`), not a native `<input type="range">` restyle, not a progress meter, and not a layered overlay. Checkbox is an APG checkbox (`[checkbox]` on a button host, with native checkbox hosts as a secondary story), binary `aria-checked`, not `[switch]` and not a layered overlay. Radio is an APG radio (`[radio]` inside `[radiogroup]`, roving tabindex, arrows plus Space/Enter/click), not a checkbox and not a layered overlay. Orphan radios outside a `[radiogroup]` are ignored. Breadcrumb is a light trail (`[breadcrumb]` / `[breadcrumb-item]`, one `aria-current="page"`, unlabeled navigation landmark named `Breadcrumb`), not a router and not a layered overlay. Progress is an APG-inspired progressbar (`[progress]` / `[progress-fill]`, `setValue` / `setIndeterminate`, `aria-valuenow` omitted while `progress="indeterminate"`), not a slider and not a layered overlay. Pagination is a page set (`[pagination]` / `[pagination-item]`, one `aria-current="page"`, unlabeled navigation landmark named `Pagination`, prev/next disabled at inferable ends, Arrow / Home / End among enabled controls), not a router and not a layered overlay. Disclosure is a standalone one-trigger / one-panel control (`[disclosure]` / `[disclosure-trigger]` / `[disclosure-panel]`, `expand` / `collapse` / `toggle`, `aria-expanded` plus native `hidden` and `aria-hidden`, Escape collapses the focused or last-opened disclosure and yields to an open modal, drawer, or popover), not an accordion and not a layered overlay. Spinner is an indeterminate busy indicator (`[spinner]` / optional `[spinner-label]`, `show` / `hide`, `role="status"` and `aria-busy="true"` while shown, `hide` sets native `hidden` and clears both, CSS owns `juice-spinner-spin`, `prefers-reduced-motion` stops the spin), not a progress bar and not a disclosure. Select is a native dropdown (`<select select>` / optional `[select-label]`, `sync`, a visible label names the control when the author has not set one, the open list stays the platform popup), not a combobox. Input is a native text field (`<input input>` / optional `[input-label]`, `sync`, a visible label names text-like controls when the author has not set one, typing, change, and the keyboard stay native), not a combobox and not a select. Textarea is a native multiline field (`<textarea textarea>` / optional `[textarea-label]`, `sync`, a visible label names the control when the author has not set one, typing, change, and the keyboard stay native), not an input, not a select, and not a combobox. Field is a wrapper (`[field]` / `[field-help]` / `[field-error]`, `sync`, visible help and error text describe the first input, textarea, or select when the author has not set `aria-describedby`, and `[invalid]` sets `aria-invalid` when the author has not set it). Naming stays with the input, textarea, and select runtimes. Typing and the keyboard stay native. It is not a validation engine. Disclosure, spinner, select, input, textarea, field, and motion core shipped in 0.9.2. Checkbox and radio are two runtimes. Breadcrumb is a light trail. Progress is a progressbar. Pagination is a page set. Disclosure is a standalone one-trigger / one-panel control, distinct from accordion. Spinner is a standalone indeterminate busy indicator, distinct from progress and disclosure. Select is a styled native `<select>`, distinct from combobox. Input is a styled native `<input>`, distinct from combobox and from select. Textarea is a styled native `<textarea>`, distinct from input, select, and combobox. Field is a wrapper around a control, distinct from input, textarea, select, and combobox. Field is a wrapper around a control, distinct from input, textarea, select, and combobox chrome. Icon button is a square icon-only control on button chrome, distinct from switch and from checkbox, and is on master, not in the published npm 0.9.2 release. Avatar is an initials-or-photo mark (`[avatar]`), distinct from a badge and from `[skeleton="circle"]`, and is on master, not in the published npm 0.9.2 release.

When several of those surfaces are open, [Escape / layering](#escape--layering) decides who owns the key. [Z-index bands](#z-index-bands) are a separate structural paint order.

## Runtime Scope

The runtime should own:

* built-in interaction logic
* automatic behavior tied to Juice markup
* accessibility state where appropriate

It should not try to own:

* business logic
* app-specific workflows
* framework state management

## Good Runtime Features

Shipped built-in runtime features include:

* navigation
* accordion / disclosure behavior
* tabs
* modal / dialog
* drawers
* toasts / snackbars
* popovers
* wizards / multi-step shells
* tooltips / hover-focus tips
* comboboxes / list autocomplete
* banners / inline alerts
* menus / menu buttons
* switches / APG toggles
* sliders / APG sliders
* checkboxes / APG checkboxes
* radios / APG radio groups
* breadcrumbs / light trails
* progress bars / APG progressbars
* pagination / page sets
* disclosures / one trigger, one panel
* spinners / indeterminate busy indicators
* selects / native dropdowns
* inputs / native text fields
* textareas / native multiline fields
* fields / help and error descriptions on a wrapped control
* icon buttons / square and round icon-only controls
* avatars / initials or photo, with image-error fallback

Future built-in runtime features could include:

* additional disclosure patterns

But each should follow the same rule:

* valid Juice markup should be enough

## Escape / layering

When several Emerging surfaces are open, **later bands yield** so a higher band owns Escape. Highest band first. This is the keyboard contract, not the paint order — see [z-index bands](#z-index-bands).

The overlay band is the exception inside itself: modal and drawer do **not** yield to each other. If both overlays are open, one Escape closes both (separate capture handlers and per-runtime claims).

| Order | Surface | Owns Escape when | Yields when |
|---|---|---|---|
| 1 | Modal / drawer | An open `[modal-overlay]:not([hidden])` or `[drawer-overlay]:not([hidden])` | Does not yield to later bands. Modal and drawer stay independently exclusive: both may be open at once, and they do not yield to each other — one Escape closes both. This pass does not make them exclusive across types. |
| 2 | Popover / menu | An open `[popover-root]:not([hidden])` or an open `[menu-root] [menu]:not([hidden])` | An open dialog overlay exists. Popover and menu sit in the same band; they do not yield to each other. Closed vs open for menu is `hidden` on `[menu]`, not on `[menu-root]`. See [Menu Runtime](./juice-menu-runtime.md). |
| 3 | Combobox | An open `[combobox-list]:not([hidden])` | An open dialog overlay, open popover, or open menu exists |
| 4 | Toast / tooltip | See the interaction below | See the interaction below |
| — | Banner | Never. Dismiss stays on `[banner-close]` | — |
| — | Switch | Never. Toggle stays on click / Enter / Space | — |
| — | Slider | Never. Value stays on arrows / Home / End / PageUp / PageDown and pointer | — |
| — | Checkbox | Never. Toggle stays on click / Enter / Space | — |
| — | Radio | Never. Selection stays on click / Enter / Space and arrows inside `[radiogroup]` | — |
| — | Breadcrumb | Never. The trail does not listen for keys or history | — |
| — | Progress | Never. The bar does not listen for keys | — |
| — | Spinner | Never. The spinner does not listen for keys | — |
| — | Select | Never. Change and keys stay on the native `<select>`. The open list is the platform popup | — |
| — | Input | Never. Typing, change, and keys stay on the native `<input>`. Text-like types only | — |
| — | Textarea | Never. Typing, change, and keys stay on the native `<textarea>`. | — |
| — | Field | Never. Typing, change, and keys stay on the wrapped control. | — |
| — | Icon button | Never. Toggle stays on click, and on Enter / Space for a non-button, non-link `[toggle]` | — |
| — | Avatar | Never. The runtime does not listen for keys | — |
| — | Pagination | Never. Arrows / Home / End move focus among enabled controls. Enter and Space stay with the browser | — |
| — | Accordion | The focused open item, or the last opened item, when that accordion context already owns the key. There is no global accordion Escape. | — |
| — | Disclosure | The focused open disclosure, or the last opened disclosure, when that disclosure already owns the key. There is no global disclosure Escape. | An open `[modal-overlay]`, `[drawer-overlay]`, or `[popover-root]` exists. |
| — | Tabs, navigation, wizard | Out of scope. Tabs ignores Escape. Wizard is not a dialog. Navigation does not close on Escape. | — |

**Toast / tooltip interaction:** toast does **not** block tooltip Escape. With both open, the first Escape hides the tip and leaves toasts visible; the next Escape dismisses the most recently shown visible toast. Tooltip yields to an open dialog overlay, popover, menu, or combobox list. Toast yields to those plus an open tooltip.

Yield checks use internal shared overlay queries (`libraries/juice/src/js/src/shared/`); the public create / init / start / stop contract is unchanged.

## Z-index bands

Core chrome sets these stacking values. They are **structural bands**, not a theme contract: there is no `--juice-z-*` token, and authors should not treat the numbers as public API. Visual stacking is also **not** the Escape order (toast paints above tooltip; tooltip still owns Escape first when both are open).

| Band | Surfaces | `z-index` | Notes |
|---|---|---|---|
| Overlay | `[modal-overlay]`, `[drawer-overlay]` | `1000` | Dialog scrims |
| Anchored | `[popover-root]`, `[combobox-list]`, `[menu]` | `1050` | Floating panel, listbox, and menu |
| Tip | `[tooltip-root]` | `1060` | Slightly above anchored chrome |
| Snackbar | `[toast-region]` | `1100` | Highest overlay chrome |
| Wizard chrome | `[wizard-header]` | `50` | Sticky in-page header |
| Nav chrome | `nav[type="sidebar"]` | `30` | Sidebar / mobile panel |
| Banner | `[banner]` | none | Inline callout; no elevation in this cut |
| Switch | `[switch]` | none | Inline control; no elevation in this cut |
| Slider | `[slider]` | none | Inline control; the thumb’s z-index `1` only stacks it above the fill |
| Checkbox | `[checkbox]` | none | Inline control; no elevation in this cut |
| Radio | `[radio]` | none | Inline control; `[radiogroup]` is layout only |
| Breadcrumb | `[breadcrumb]` | none | Inline nav chrome; no elevation in this cut |
| Progress | `[progress]` | none | Inline status chrome; no elevation in this cut |
| Spinner | `[spinner]` | none | Inline status chrome; no elevation in this cut |
| Skeleton | `[skeleton]` | none | Inline placeholder; CSS-only, not one of the twenty-seven runtimes |
| List | `[list]` | none | Inline rows; CSS-only, not one of the twenty-seven runtimes |
| Select | `select[select]` | none | Inline field chrome; the open list is the platform popup |
| Input | `input[input]` | none | Inline field chrome; text-like types only |
| Textarea | `textarea[textarea]` | none | Inline field chrome; no auto-grow |
| Field | `[field]` | none | Inline wrapper chrome; no validation engine |
| Icon button | `[icon-button]` | none | Inline control; no elevation in this cut |
| Avatar | `[avatar]` | none | Inline mark. The photo is `z-index` 1 and the status dot is 2, both inside the avatar. A group stacks the first eight faces from 8 down to 1. Not an overlay band |
| Pagination | `[pagination]` | none | Inline nav chrome; no elevation in this cut |

Tabs, accordion, and disclosure do not set a stacking band.

## juice:change

Interactive runtimes dispatch a bubbling, composed `juice:change` `CustomEvent` from the widget host when observable state actually changes. Clicks, keys, and programmatic writes all count. A write that leaves the previous state unchanged does not dispatch. The first observation of a host is recorded and does not dispatch, so init can normalize ARIA without looking like a change.

```ts
type JuiceChangeDetail<TState> = {
  runtime: string;
  state: TState;
};
```

`JUICE_CHANGE_EVENT` is the string `'juice:change'`. Listen on the host or any ancestor. `detail.state` is a copy of the state below. Each controller also exposes `getState(target)`, which returns that same shape, or `null` when the host is missing. This observation contract stays Emerging. It is on master, unreleased after 0.9.2. It is Juice core. The runtimes do not import Sig.

Juice works without Sig. `juice:change` and `getState()` are a framework-agnostic DOM contract. Any script can listen or call the controller. The optional Sig adapter is `@citrusworx/sigjs/juice` only; see [Sig adapter](#sig-adapter) and [Sig.js + Juice](../sigjs/sig-juice-integration.md#runtime-binding).

```ts
import { startSwitchRuntime } from "@citrusworx/juiceui";

const host = document.querySelector<HTMLElement>("[switch]")!;

host.addEventListener("juice:change", (event) => {
  const { runtime, state } = (event as CustomEvent).detail;
  // runtime === "switch", state === { checked: boolean }
});

startSwitchRuntime()?.getState(host); // { checked: boolean } | null
```

Select, input, and textarea publish value changes through the native `input` and `change` events. They do not dispatch `juice:change`. `getState()` still returns `{ value: string }` (`HTMLSelectElement.value` for select, the control value otherwise).

The twenty-seven rows are the whole contract. Per-runtime pages repeat one row; keep them aligned with this table. The last column is how `@citrusworx/sigjs/juice` `bind` treats `state.set`. Read-only means the signal can update from the host, and `set` does not call a controller. Icon button and avatar dispatch `juice:change` and expose `getState()`. `bind` does not accept either: `"icon-button"` and `"avatar"` are not `JuiceRuntimeName` values, and inference does not match `[icon-button]` or `[avatar]`. A follow-up for avatar is pending. That is not the read-only path. A read-only runtime still seeds a signal.

| Runtime | Host | `detail.state` / `getState()` | Readers | Sig `bind` |
| --- | --- | --- | --- | --- |
| `switch` | `[switch]` | `{ checked: boolean }` | `isChecked`, `getState` | write-back `setChecked` |
| `checkbox` | `[checkbox]` | `{ checked: boolean }` | `isChecked`, `getState` | write-back `setChecked` |
| `disclosure` | `[disclosure]` | `{ expanded: boolean }` | `isExpanded`, `getState` | write-back `expand` / `collapse` |
| `accordion` | `[accordion]` | `{ expanded: boolean[] }` | `isExpanded`, `getState` | read-only |
| `modal` | `[modal-overlay]` | `{ open: boolean }` | `isOpen`, `getState` | write-back `open` / `close` |
| `drawer` | `[drawer-overlay]` | `{ open: boolean }` | `isOpen`, `getState` | read-only |
| `popover` | `[popover-root]` | `{ open: boolean }` | `isOpen`, `getState` | read-only |
| `menu` | `[menu-root]` | `{ open: boolean }` | `isOpen`, `getState` | read-only |
| `combobox` | `[combobox]` | `{ open: boolean, value: string }` | `isOpen`, `getState` | read-only |
| `slider` | `[slider]` | `{ value: number }` | `getValue`, `getState` | read-only |
| `progress` | `[progress]` | `{ value: number, indeterminate: boolean }` | `getValue`, `isIndeterminate`, `getState` | read-only |
| `radio` | `[radiogroup]` | `{ value: string \| null, index: number }` | `getChecked`, `getState` | read-only |
| `tabs` | `[tabs]` | `{ selected: number }` | `selected`, `getState` | read-only |
| `pagination` | `[pagination]` | `{ current: number }` | `getCurrent`, `getState` | read-only |
| `breadcrumb` | `[breadcrumb]` | `{ current: number }` | `getCurrent`, `getState` | read-only |
| `wizard` | `[wizard-shell]` | `{ current: number }` | `current`, `getState` | read-only |
| `toast` | `[toast]` | `{ shown: boolean }` | `isShown`, `getState` | read-only |
| `banner` | `[banner]` | `{ shown: boolean }` | `isShown`, `getState` | read-only |
| `tooltip` | `[tooltip-root]` | `{ shown: boolean }` | `isShown`, `getState` | read-only |
| `spinner` | `[spinner]` | `{ shown: boolean }` | `isShown`, `getState` | read-only |
| `nav` | `nav[type="sidebar"]` | `{ open: boolean }` | `isOpen`, `getState` | read-only |
| `field` | `[field]` | `{ invalid: boolean }` | `isInvalid`, `getState` | read-only |
| `select` | `select[select]` | `{ value: string }` | `getState` (native `input` / `change`) | read-only |
| `input` | `input[input]` | `{ value: string }` | `getState` (native `input` / `change`) | read-only |
| `textarea` | `textarea[textarea]` | `{ value: string }` | `getState` (native `input` / `change`) | read-only |
| `icon-button` | `[icon-button]` | `{ pressed: boolean, disabled: boolean, named: boolean }` | `getState` | not wired |
| `avatar` | `[avatar]` | `{ loaded: boolean, fallback: boolean, hasImage: boolean }` | `getState` | not wired |

Accordion `expanded` follows trigger order. Disclosure `expanded` is the first trigger. Tabs `selected`, pagination `current`, and breadcrumb `current` are 0-based indexes, or `-1` when nothing is current. Radio `value` is the checked option's `value` attribute, and `index` is its position (`-1` when none are checked). `getChecked()` still returns that element. Tabs `selected()` still returns the trigger element. Menu `open` is whether the `[menu]` panel is shown. Nav `open` is whether the sidebar lacks `hidden`. Field `invalid` is the `[invalid]` attribute on the wrapper. Icon button `pressed` is `aria-pressed="true"` or `[pressed]`. `disabled` is `[disabled]`, `aria-disabled="true"`, or a native disabled button or input. `named` is a non-empty `aria-label`, an `aria-labelledby` that resolves to visible text, or visible text on the host. `title` is not a name. Avatar `loaded` is true when at least one image has loaded. `fallback` is true when the avatar has an image, none have loaded, and none are still loading. `hasImage` is true when the avatar has at least one `<img>`. Initials with no image are `{ loaded: false, fallback: false, hasImage: false }`. Toast `shown` is the `[toast]` host, not the region.

## Sig adapter

The hookup is done. It lives in Sig. Juice runtimes still do not import Sig, and Juice still runs when Sig is absent.

```ts
import { bind } from "@citrusworx/sigjs/juice";

const notes = bind(switchHost, "switch");
notes.state.get(); // { checked: boolean }, a Sig signal
notes.state.set({ checked: true }); // write-back: switch, checkbox, disclosure, modal
notes.dispose();
```

`bind(host, runtime?)` returns `{ state, dispose }`. `state` is seeded from `getState()` and follows `juice:change` (native `input` and `change` for select, input, and textarea). Write-back is the four runtimes in the table above. The other twenty-one names `bind` accepts are read-only. Icon button and avatar are not among those names. `bind` on an `[icon-button]` host throws (`could not infer a runtime`), and `bind(host, "icon-button")` throws the same way. `bind` on an `[avatar]` host throws the same way, and `bind(host, "avatar")` throws because `"avatar"` is not a `JuiceRuntimeName`. A follow-up for avatar is pending. `dispose` drops the listeners, including when the binding was created during Sig render and the view unmounts. `@citrusworx/juiceui` is an optional peer of Sig. The main Sig entry does not import it. The subpath shipped in `@citrusworx/sigjs@0.4.0` and is not part of `@citrusworx/juiceui`. `juice:change` and `getState()` are on master, unreleased after 0.9.2. Icon button's and avatar's `getState()` and `juice:change` are on master with that contract, and they are not in the published npm 0.9.2 release.

How to call it, including disposal, is [Runtime binding](../sigjs/sig-juice-integration.md#runtime-binding).

## Summary

Juice runtime behavior should feel like a natural extension of the markup system, not a separate app framework.
