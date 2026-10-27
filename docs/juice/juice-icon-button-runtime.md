# Juice Icon Button Runtime

This document explains the current icon-button runtime in `libraries/juice/src/js/src/icon-button/icon-button-runtime.ts` (monorepo path; outside this vault).

The key idea is the same as navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, breadcrumb, progress, pagination, disclosure, spinner, select, input, textarea, and field:

> If a user writes valid Juice icon-button markup and it exists in the browser, a named control should be usable, and a `[toggle]` should keep its pressed state honest.

That is the standard.

## The Goal

The icon-button runtime is not a framework adapter and not a second component API.

It is a browser-side Juice feature that works regardless of how the markup got into the DOM.

That means it should work for:

- raw HTML pages
- Twig or other server-rendered templates
- Sig-rendered DOM
- React-rendered DOM
- any other environment that eventually produces browser DOM

The user should not need to manually initialize icon-button behavior in their app code.

There is no `IconButton()` Sig factory. Markup plus the runtime is the contract.

This surface is Emerging, not Stable. Valid markup should work after importing the JS entry, but the API is still likely to evolve.

Icon button is a square icon-only control on the existing button chrome. Color, border, and hover fill stay with `button` and `[btn]`. It is not a switch and not a checkbox. Switch stays `[switch]` and is left untouched. Checkbox stays `[checkbox]` and is left untouched. There is no focus trap, no Escape handler, and no Sig IconButton factory.

Icon button is the twenty-sixth Emerging auto-enhance runtime. `@citrusworx/juiceui@0.9.0` shipped eighteen (navigation through progress). `@citrusworx/juiceui@0.9.2` is the live npm cut. `@citrusworx/juiceui@0.9.1` added pagination, the nineteenth. Disclosure is the twentieth. Spinner is the twenty-first. Select is the twenty-second. Input is the twenty-third. Textarea is the twenty-fourth. Field is the twenty-fifth. Disclosure, spinner, select, input, textarea, field, and motion core shipped in 0.9.2. Icon button (chrome and this runtime) is on master and is not in the published npm 0.9.2 release. Avatar is the twenty-seventh Emerging auto-enhance runtime and is on master, not in the published npm 0.9.2 release. Table is the twenty-eighth Emerging auto-enhance runtime and is on master, not in the published npm 0.9.2 release. All twenty-eight stay Emerging.

## Markup Contract

The runtime is aligned with Juice’s icon-button chrome:

```html
<button type="button" icon-button btn="flat" aria-label="Add">
  <i icon="plus" lib="solid"></i>
</button>

<button type="button" icon-button btn="outline" scale="sm" aria-label="Close">
  <i icon="xmark" lib="solid"></i>
</button>

<button type="button" icon-button btn="3d" scale="lg" aria-label="Settings">
  <i icon="gear" lib="solid"></i>
</button>

<button type="button" icon-button="round" btn="text" aria-label="More">
  <i icon="ellipsis" lib="solid"></i>
</button>

<button type="button" icon-button round btn="metallic" aria-label="Favorite">
  <i icon="star" lib="solid"></i>
</button>

<button type="button" icon-button toggle aria-label="Bold">
  <i icon="bold" lib="solid"></i>
</button>

<button type="button" icon-button="round" toggle pressed aria-label="Italic">
  <i icon="italic" lib="solid"></i>
</button>
```

`[icon-button]` is the host. A boolean attribute is fine. There is no HTML global `icon-button` attribute. Any value, including `icon-button="round"`, is still an icon button. Sync does not rewrite that value. `[icon-button][round]` is the same circle as `[icon-button="round"]`. `[scale="sm"|"lg"]` stays CSS. The runtime does not write `scale`.

**What this runtime enhances:**

- A `[icon-button]` host. The usual host is `<button type="button" icon-button>`. A `div`, a `span`, or an `<a href>` with `[icon-button]` is still a host. A node without `[icon-button]` is ignored.
- `[toggle]` on that host. Click flips pressed state. Enter and Space flip it only when the host is not a native button and not an `<a href>`. A native `<button>` already turns those keys into a click, so the runtime leaves them alone and handles the click. An `<a href>` is the same kind of native control: Enter and Space stay with the browser, and a click still flips the toggle.
- `[pressed]` on a toggle, kept in sync with `aria-pressed`. An initial `[pressed]` or `aria-pressed="true"` starts pressed. Anything else starts `aria-pressed="false"`. When both are present and they disagree, `[pressed]` wins, because either signal starts pressed and sync then writes both to match. A non-toggle is not given `aria-pressed`. A `[pressed]` without `[toggle]` stays a visual-only attribute. `getState()` still reports `pressed: true` for that host, and the runtime does not add `aria-pressed`.

**Accessible name.** An accessible name is a non-empty `aria-label`, an `aria-labelledby` that resolves to visible text, or visible text on the host.

- A blank or whitespace-only `aria-label` is not a name. A blank `aria-labelledby` is not a name. An id that is missing, or that points at a hidden, `aria-hidden`, or empty element, is not a name. Several ids are joined when more than one resolves to visible text.
- Visible text is the host's own text, with whitespace collapsed. Hidden and `aria-hidden` subtrees are skipped. SVG subtrees are skipped, including an SVG `<title>`. An icon-only `[icon]` contributes no text.
- `title` is left untouched and is not a name. The same convention is used by input and select.
- This runtime does not invent a label. It does not copy text into `aria-label`, and it does not write `aria-labelledby`.

**Development warning.** When `NODE_ENV === "development"`, an unnamed host warns once per element:

```text
[juice] [icon-button] has no accessible name. Add a non-empty aria-label, an aria-labelledby that resolves to text, or visible text. Icon-only content and title do not count.
```

The element is the second argument to `console.warn`. Production and test stay silent. The warning is once per element: a name added later does not warn again, and dropping that name later does not warn a second time.

**Non-button toggles.** A toggle that is not a `<button>` and not an `<a href>` gets `role="button"` and `tabindex="0"` when those are missing, so Enter and Space can reach it. An author `role` or `tabindex` is kept. Native buttons and links are left alone, including `type` and `href`.

**Disabled.** `[disabled]`, `aria-disabled="true"`, a native disabled `<button>`, or a disabled `<input>` is disabled. Sync still writes the initial `aria-pressed` on a toggle. Click, Enter, Space, and `toggle()` do not flip it. Chrome paints that state at `opacity: 0.5` and sets `pointer-events: none`, so a real pointer click never reaches the host. The runtime no-op is what stops `toggle()` and a key that still arrives.

Theme paint uses the `--juice-icon-button-*` geometry roles below. There is no icon-button fill role. Hover fill stays with the button variant (`btn="flat|outline|text|3d|metallic"` and the default button). Core CSS does not give `[icon-button]` a z-index. It is an inline control — see [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands). See the [Theme Contract](./juice-theme-contract.md) and [Attributes](./juice-attributes.md).

### CSS roles

Core CSS owns the defaults on `:root`. Shipped library themes and generated `--jx-*` themes are not required to bind them. Override a `--juice-icon-button-*` name only when the square box fights that theme.

| Role | Default |
|---|---|
| `--juice-icon-button-padding` / `-sm` / `-lg` | `0.625rem` / `0.4rem` / `0.875rem` (button block padding) |
| `--juice-icon-button-icon-size` / `-sm` / `-lg` | `1.25rem` / `1rem` / `1.5rem` |
| `--juice-icon-button-size` / `-sm` / `-lg` | `calc(icon-size + padding * 2)` |
| `--juice-icon-button-radius` / `-sm` / `-lg` | `0.5rem` / `0.375rem` / `0.625rem` |
| `--juice-icon-button-radius-round` | `999px` |
| `--juice-icon-button-focus-ring` | `currentColor` |

`[scale="sm"|"lg"]` steps size, padding, radius, and the glyph together. Unmarked scale matches a default button. The circle uses `--juice-icon-button-radius-round` and keeps the scale's size. Do not set `iconSize` for that box. The glyph is centered. A theme or UA border stays inside the border-box and does not shrink the icon.

`:focus-visible` paints a `2px` solid outline in `--juice-icon-button-focus-ring`, with `outline-offset: 2px`. `[pressed]` and `[aria-pressed="true"]` paint an inset ring (`box-shadow: inset 0 0 0 2px currentColor`). `:active` presses `translateY(2px)`, the same press as `[btn="3d"]`. Disabled hosts (`:disabled`, `[disabled]`, or `[aria-disabled="true"]`) use `opacity: 0.5`.

Transitions read `--juice-motion-duration-instant` and `--juice-motion-ease-standard` for background, color, border, shadow, and transform. `prefers-reduced-motion: reduce` sets `transition: none` and drops the `:active` translate. That does not clear the `[btn="3d"]` / `[btn="metallic"]` hover transform. That press belongs to the button variant.

## Automatic Boot

The runtime starts automatically in the browser.

At the bottom of the file, Juice checks whether it is running in a browser environment and then boots the icon-button runtime:

```ts
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    bootOnReady = () => {
      bootOnReady = null;
      if (!autoStartSuspended) {
        startIconButtonRuntime();
      }
    };
    document.addEventListener('DOMContentLoaded', bootOnReady);
  } else {
    startIconButtonRuntime();
  }
}
```

Importing the Juice JS entrypoint is enough for the normal behavior.

`stopIconButtonRuntime()` also cancels a deferred `DOMContentLoaded` boot, so a test or host that stops the singleton before ready does not get a surprise start. Outside a browser, `startIconButtonRuntime()` returns `null` and `createIconButton()` returns a controller whose methods do nothing.

## Public API

The runtime still exposes functions, but they are secondary to the automatic behavior.

```ts
createIconButton(options?)
initIconButton(options?)
startIconButtonRuntime()
stopIconButtonRuntime()
```

These are useful for internal control, tests, or advanced cases.

A real change of `pressed`, `disabled`, or `named` dispatches a bubbling, composed `juice:change` from `[icon-button]`. `detail` is `{ runtime: "icon-button", state }`. `state` is `{ pressed: boolean, disabled: boolean, named: boolean }`. `getState()` reads that same shape, or `null` when the host is missing. The first observation of a host is recorded and does not dispatch, so the initial `aria-pressed` write is not a change. A later `sync()` that leaves the state unchanged does not dispatch. A disabled toggle that does not flip does not dispatch. This surface stays Emerging and is on master, unreleased after 0.9.2. See [juice:change](./juice-runtime-behavior.md#juicechange).

`createIconButton()` can run alongside the automatic document runtime. Each click or key is claimed once, so a custom-root controller does not double-fire with the singleton.

`initIconButton()` is the same function as `createIconButton()`.

## IconButtonOptions

The configurable shape is:

```ts
type IconButtonOptions = {
  root?: ParentNode;
  iconButtonSelector?: string;
};
```

By default, Juice uses:

```ts
{
  root: document,
  iconButtonSelector: '[icon-button]',
}
```

A custom `root` limits sync to icon buttons inside that root. When the root itself is an `[icon-button]`, that host is managed too. Hosts outside the root are left alone.

## IconButtonController

```ts
type IconButtonState = {
  pressed: boolean;
  disabled: boolean;
  named: boolean;
};

type IconButtonController = {
  destroy: () => void;
  sync: () => void;
  toggle: (target?: HTMLElement | null) => void;
  getState: (target?: HTMLElement | null) => IconButtonState | null;
};
```

`destroy()` removes the click and keydown listeners, disconnects the observer, and cancels a scheduled sync. It does not strip `aria-pressed`, `[pressed]`, `role`, or `tabindex` already written. `sync()` walks each managed host, writes toggle state, and runs the name check. `toggle()` flips the resolved toggle when it is not disabled. With no target, `toggle()` and `getState()` use the first managed `[icon-button]` in the root. A target inside a host resolves to that host. A node that is not an `[icon-button]` and is not inside one returns `null` from `getState()`, and `toggle()` does nothing.

`pressed` in that state is `aria-pressed="true"` or the `[pressed]` attribute. `disabled` is the disabled check above. `named` is the accessible-name check above. `named: false` does not block a toggle. The development warning is the only response to a missing name.

## What the Runtime Actually Does

The runtime performs five main jobs:

1. Find `[icon-button]` hosts inside the root. Any attribute value, including `icon-button="round"`, stays as authored. A node without `[icon-button]` is ignored
2. Check the accessible name. A non-empty `aria-label`, an `aria-labelledby` that resolves to visible text, or visible text on the host counts. `title`, SVG text, and icon-only content do not. No name is invented. In development, an unnamed host warns once per element
3. On `[toggle]`, write `aria-pressed` `"true"` or `"false"` and mirror `[pressed]`. An initial `[pressed]` or `aria-pressed="true"` starts pressed. Non-toggles are not given `aria-pressed`
4. Flip a toggle on click. Enter and Space flip a non-button, non-link toggle and `preventDefault` on Space so the page does not scroll. Native buttons and `<a href>` keep those keys. A non-button toggle gets `role="button"` and `tabindex="0"` only when the author has not set them. Disabled hosts do not flip
5. Leave Escape to the overlay / popover / menu / combobox / toast / tooltip yield order. Icon button does not participate. There is no focus trap. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering)

There is no focus trap. This runtime does not close a modal, drawer, toast, popover, wizard, tooltip, combobox, banner, or menu, and it does not toggle a switch, move a slider, toggle a checkbox, select a radio, move a breadcrumb or pagination current page, change a progress value, collapse an accordion item or a disclosure, show or hide a spinner, open a select, name an input, name a textarea, name a select, or describe a field.

## Why MutationObserver Is Used

The DOM may change after the initial page load. That is what happens in reactive or server-hydrated environments.

If an icon button appears later, or its name, pressed state, or disabled state changes, the observer schedules a `sync()` call so Juice can wire the toggle and run the name check.

The observer watches child-list changes, character data, and these attributes: `icon-button`, `toggle`, `pressed`, `disabled`, `role`, `tabindex`, `hidden`, `aria-hidden`, `aria-pressed`, `aria-disabled`, `aria-label`, `aria-labelledby`, `title`, `href`, and `id`. `title` is watched and is still not a name. Removing `[icon-button]` drops the host. `destroy()` stops that observation.

## Why Sync Is Scheduled

Mutation-heavy environments can change the DOM a lot in a short burst.

So instead of calling `sync()` immediately for every change, the runtime schedules it with `requestAnimationFrame`.

That keeps the runtime from reacting too aggressively while still updating quickly enough for UI behavior.

## Keyboard

- Click flips `[icon-button][toggle]`. A plain `[icon-button]` click does not write `aria-pressed`
- Enter and Space flip a toggle that is not a `<button>` and not an `<a href>`. Space is `preventDefault`'d. A native button's Enter and Space become a click, and that click flips the toggle. An `<a href>` keeps Enter and Space
- A non-button toggle receives `role="button"` and `tabindex="0"` when those are missing. An author role or tabindex is kept. Native buttons and links are not given a role
- Escape is not handled. Icon button never steals it. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering)
- There is no focus trap. Tab is not wrapped. The runtime does not move focus
- Disabled hosts do not flip

## Sig `bind()`

`@citrusworx/sigjs/juice` `bind(host, runtime?)` accepts icon button. `JuiceRuntimeName` in `libraries/sig/src/juice.ts` includes `"icon-button"`. The host matcher looks for `[icon-button]`, after the earlier matchers, so a host that already matches (for example `[switch]`) stays on that runtime.

`bind(iconButton)` seeds a signal from `getState()`. `bind(iconButton, "icon-button")` does the same. `state.set` calls `toggle` only when the host has `[toggle]` and `pressed` changes, then republishes `getState()`. A disabled host, or a host without `[toggle]`, refuses the write, and the signal snaps back to the host. On a Juice build that does not export `startIconButtonRuntime` (published `@citrusworx/juiceui` 0.9.1 and 0.9.2; the export is on master only), binding icon-button throws `Sig juice bind: "icon-button" needs a newer @citrusworx/juiceui that exports startIconButtonRuntime.` The module still loads, and the other runtimes still bind. Juice does not import Sig, and this runtime does not call `bind`.

`juice:change` and `getState()` still work without Sig. Listen on the host, or call `getState()` on the controller.

## Accessibility

- Give every icon button an accessible name. `aria-label` is the usual one for an icon-only control. `aria-labelledby` works when it points at visible text. Visible text on the host works when the control is not icon-only. `title` does not
- `[toggle]` exposes `aria-pressed="true"` or `"false"`. Do not use `[switch]` or `aria-checked` for this control. A toolbar of bold / italic / underline buttons is a set of pressed toggles, not a switch and not a checkbox
- A non-button toggle is given `role="button"` so it is in the keyboard order. Prefer `<button type="button">` so the platform already supplies that role, the type, and Enter / Space
- Disabled is `disabled` on a native button, `[disabled]`, or `aria-disabled="true"`. The control does not toggle while disabled
- Focus is the `:focus-visible` ring. The runtime does not move focus and does not trap it

## Limitations

- No `IconButton()` factory. Author markup (or emit it from Sig/React) and let the runtime enhance it.
- This surface is Emerging, not Stable. Icon button is the twenty-sixth Emerging auto-enhance runtime. It is on master and is not in the published `@citrusworx/juiceui@0.9.2` npm cut. Field remains the twenty-fifth and shipped in that cut. Disclosure, spinner, select, input, textarea, field, and motion core shipped in 0.9.2. Avatar is the twenty-seventh Emerging auto-enhance runtime and is on master, not in the published npm 0.9.2 release. Table is the twenty-eighth Emerging auto-enhance runtime and is on master, not in the published npm 0.9.2 release. All twenty-eight stay Emerging.
- The runtime does not invent an accessible name. `title`, an SVG `<title>`, and icon-only content do not count. The development warning fires once per unnamed element and is silent in production and test.
- `[toggle]` is what flips `aria-pressed` and `[pressed]`. A `[pressed]` without `[toggle]` is visual only. The runtime does not add `aria-pressed` to it.
- Disabled hosts do not flip. Sync still records the initial pressed value.
- Enter and Space are handled only for non-native hosts. A `<button>` and an `<a href>` keep those keys. `role` and `tabindex` are added only for a non-button, non-link toggle, and only when the author has not set them.
- There is no focus trap and no Escape handling. Icon button is not a layered overlay. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering).
- There is no z-index elevation. Icon button is inline chrome. See [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands).
- Sig `bind()` accepts this runtime. Write-back is `toggle` on a `[toggle]` host when `pressed` changes. A Juice build without `startIconButtonRuntime` throws `needs a newer @citrusworx/juiceui`. See [Sig `bind()`](#sig-bind).
- Centered modal / dialog, edge-docked drawer, toast-stack, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, breadcrumb, progress, pagination, disclosure, spinner, select, input, textarea, field, and accordion behavior are not part of this runtime. See [Modal Runtime](./juice-modal-runtime.md), [Drawer Runtime](./juice-drawer-runtime.md), [Toast Runtime](./juice-toast-runtime.md), [Popover Runtime](./juice-popover-runtime.md), [Wizard Runtime](./juice-wizard-runtime.md), [Tooltip Runtime](./juice-tooltip-runtime.md), [Combobox Runtime](./juice-combobox-runtime.md), [Banner Runtime](./juice-banner-runtime.md), [Menu Runtime](./juice-menu-runtime.md), [Switch Runtime](./juice-switch-runtime.md), [Slider Runtime](./juice-slider-runtime.md), [Checkbox Runtime](./juice-checkbox-runtime.md), [Radio Runtime](./juice-radio-runtime.md), [Breadcrumb Runtime](./juice-breadcrumb-runtime.md), [Progress Runtime](./juice-progress-runtime.md), [Pagination Runtime](./juice-pagination-runtime.md), [Disclosure Runtime](./juice-disclosure-runtime.md), [Spinner Runtime](./juice-spinner-runtime.md), [Select Runtime](./juice-select-runtime.md), [Input Runtime](./juice-input-runtime.md), [Textarea Runtime](./juice-textarea-runtime.md), [Field Runtime](./juice-field-runtime.md), and [Accordion Runtime](./juice-accordion-runtime.md).

## Why This Matches Navigation

The icon-button runtime copies the navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, breadcrumb, progress, pagination, disclosure, spinner, select, input, textarea, and field lifecycle by convention:

- DOM-first
- automatic boot
- event delegation for click and for Enter / Space on non-native toggles
- MutationObserver plus rAF `sync()`
- idempotent singleton `start*Runtime` / `stop*Runtime`
- framework-agnostic

Shared internals under `libraries/juice/src/js/src/shared/` are not a public multi-feature runtime API. `juice:change` comes from that shared helper. Icon button does not import Sig.

## Design Rule Going Forward

Interactive Juice browser features should follow this standard:

> If valid Juice markup exists in the browser, the feature should activate automatically and work without app glue.
