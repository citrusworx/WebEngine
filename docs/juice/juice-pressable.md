# Juice Pressable

This document explains the current pressable chrome in `libraries/juice/src/components/pressable/pressable.scss` and the pressable runtime in `libraries/juice/src/js/src/pressable/pressable-runtime.ts` (monorepo paths; outside this vault). `components.scss` forwards the stylesheet after `popover.scss` and before `pagination.scss`.

Pressable is Mobile-Critical. It is the press feedback a touch page needs on any host: `touch-action: manipulation` (no double-tap delay), no tap highlight, no text selection, a visible ring while the pointer or key is down, and an opt-in long-press. A theme does not have to bind a color for that ring to show.

The key idea is the same as navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, breadcrumb, progress, pagination, disclosure, spinner, select, input, textarea, field, icon button, avatar, and table:

> If a user writes a valid Juice pressable and it exists in the browser, a press should show for the duration of the gesture.

That is the standard. The stylesheet does not require the runtime. `:active` paints the same pressed ring when the JS entry is absent.

## The Goal

The pressable runtime is not a framework adapter and not a second component API.

It is a browser-side Juice feature that works regardless of how the markup got into the DOM.

That means it should work for:

- raw HTML pages
- Twig or other server-rendered templates
- Sig-rendered DOM
- React-rendered DOM
- any other environment that eventually produces browser DOM

The user should not need to manually initialize pressable in their app code.

There is no `Pressable()` Sig factory. Markup plus the runtime is the contract. `@citrusworx/sigjs/juice` `bind()` does not name pressable or touchable-row yet. There is no `JuiceRuntimeName` for either.

This surface is Emerging, not Stable. Valid markup should paint from core CSS, and a press should set transient state after importing the JS entry, but the API is still likely to evolve.

Pressable is a transient press. It is not a latched toggle (`[icon-button][toggle]` owns `[pressed]`). It is not a switch, not a checkbox, and not an icon button. CSS does not add `role` or `tabindex`. There is no focus trap and no Escape handler.

Pressable is the twenty-ninth Emerging auto-enhance runtime. `@citrusworx/juiceui@0.9.0` shipped eighteen (navigation through progress). `@citrusworx/juiceui@0.9.2` is the live npm cut. `@citrusworx/juiceui@0.9.1` added pagination, the nineteenth. Disclosure is the twentieth. Spinner is the twenty-first. Select is the twenty-second. Input is the twenty-third. Textarea is the twenty-fourth. Field is the twenty-fifth. Disclosure, spinner, select, input, textarea, field, and motion core shipped in 0.9.2. Icon button is the twenty-sixth. Avatar is the twenty-seventh. Table is the twenty-eighth. Pressable (chrome in #299 and #301, runtime in #303) is on master and is not in the published npm 0.9.2 release. Touchable row is the thirtieth Emerging auto-enhance runtime and is on master, not in the published npm 0.9.2 release. All thirty stay Emerging.

## Markup

There is no HTML global `pressable` attribute, and there is no `<pressable>` element. `[pressable]` is an attribute selector. One attribute. Boolean `[pressable]` is the ring. The value is the press shape, the same shape as `[badge="square"]` and `[safe-area="top"]`. `[scale]` is button and icon-button size (`sm` / `lg`). It is not reused.

```html
<button type="button" pressable>Save</button>

<div pressable="scale" role="button" tabindex="0">Hold</div>

<li pressable pressable-longpress="700" pressable-slop="16">Row</li>
```

| Attribute | What it is |
|---|---|
| `[pressable]` | Host. Any value, including an empty value, is still a pressable. Pointer, `touch-action: manipulation`, no tap highlight, no text selection. 1px inset ring on hover, and only under `@media (hover: hover)`. 2px inset ring on `:active` and `[pressed]`. |
| `[pressable="scale"]` | The same rings, plus `scale(var(--juice-pressable-scale))` (`0.98`) while `:active` or `[pressed]`. |
| Any other value | The ring only. `pressable="foo"` does not scale. The runtime does not rewrite the value. |
| `[pressed]` | The in-progress press. The runtime sets it for the gesture on hosts that do not already own it as a latched toggle. It is not the icon-button toggle. `:active` paints the same ring when the runtime is absent. |
| `[pressable-longpress]` | Opt-in long-press. Absent, the host does not arm one. Empty or `"true"` uses `longPressDelay` (default 500). A non-negative number is the delay in milliseconds. `"false"` does not arm. Any other value uses the default delay. Pointer only. |
| `[pressable-slop]` | Optional pixel slop for this host. A non-negative number overrides `moveSlop` (default 10). Anything else uses the option. |

`[disabled]`, the `disabled` property, and `[aria-disabled="true"]` drop the cursor to `default`. The hover ring, the pressed ring, and the scale do not paint on those hosts. See [Disabled](#disabled).

Core CSS does not give `[pressable]` a z-index. See [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands).

## Why the ring

Feedback is an inset `box-shadow`, not a background and not a pseudo-element. The shadow sits on the edge. It does not change the fill behind the text, so body-text contrast stays the theme pair.

Citrusmint has no headroom for a background wash. Body ink is `hsl(121, 100%, 25%)` (`--cm-text`, freshgreen-800) on the page `hsl(121, 100%, 90%)` (`--cm-page`, freshgreen-100), which is **4.62:1**. The same ink on the strong surface (`--cm-surface`, white) is **5.17:1**. A 1% `currentColor` wash over that page drops the text pair to **4.56:1**. That is the floor. A wash cannot go further without missing 4.5:1 for the words.

A translucent ring has the same problem against the non-text contrast rule (WCAG 1.4.11, 3:1). Mixing the ink under 80% misses 3:1 on the Citrusmint page: 70% is **2.80:1** and 80% is **3.30:1**. `currentColor` is the full ink, so the ring is the text pair itself: **4.62:1** on the page and **5.17:1** on the strong surface. Hover uses that same ink at 1px. Pressed uses it at 2px. Both clear 3:1 wherever the text pair does.

Those ratios are the body-ink color against each theme's page, and against `--juice-surface-strong-bg` with a translucent plate composited over the page first. They match the compiled theme CSS (Citrusmint strong is `--cm-surface`; KiwiPress strong is `--kw-surface`, which is what `--juice-surface-strong-bg` points at). There is no automated contrast test for the table. The check is the token math in the stylesheet header.

| Theme | Page | Strong |
|---|---:|---:|
| Citrusmint | 4.62 | 5.17 |
| KiwiPress | 7.60 | 7.60 |
| Tide | 15.66 | 15.66 |
| Aquaflux | 10.55 | 10.55 |
| Afterburn | 14.01 | 9.91 |
| Arcade Glow | 16.52 | 11.73 |
| Boardwalk | 13.85 | 12.99 |
| Denim Dial | 13.95 | 13.95 |
| Forest Radio | 14.20 | 14.20 |
| Orchard Club | 14.32 | 14.32 |
| Poolside Pop | 15.64 | 15.64 |
| Signal Garden | 16.72 | 16.72 |
| Sunset Motel | 15.63 | 15.63 |
| Violet Parlor | 15.75 | 15.75 |

Every pressed ring in that table clears 3:1. Hover uses the same ink, so it clears 3:1 too. A KiwiPress default button is white on `--kw-accent` at **3.84:1**. The ring uses that white against the button fill, and the fill itself is unchanged.

## The weak spot

The ring follows the host's ink. This file does not set `color`.

Citrusmint copy rules paint `p`, `span`, `li`, and `label` with muted ink (`--cm-text-muted`, freshgreen-600, `hsl(121, 100%, 40%)`). That pair is **1.95:1** on the page and **2.18:1** on the strong surface. An `li` host's ring is that muted ink. It misses 3:1. A host that keeps body ink (a `button`, a heading, or an author `color`) keeps the table above.

Theme copy for `p` / `span` / `li` / `label`, and `:where(a:hover)`, is `(0, 1, 0)` and sets `color` only. It does not set the ring.

## Roles

Color is restated on `[theme]`. A custom property resolves `var()` on the element that sets it. `currentColor` stays in these values and resolves where the pressable paints. Geometry and motion stay on `:root` only. Shipped library themes and generated `--jx-*` themes are not required to bind `--juice-pressable-*`. Do not add a pressable hue family.

| Role | Where | Default |
|---|---|---|
| `--juice-pressable-hover-ring` | `:root` and `[theme]` | `currentColor` |
| `--juice-pressable-pressed-ring` | `:root` and `[theme]` | `currentColor` |
| `--juice-pressable-focus-ring` | `:root` and `[theme]` | `currentColor` |
| `--juice-pressable-radius` | `:root` only | `0.375rem` |
| `--juice-pressable-duration` | `:root` only | `var(--juice-motion-duration-fast)` |
| `--juice-pressable-easing` | `:root` only | `var(--juice-motion-ease-standard)` |
| `--juice-pressable-scale` | `:root` only | `0.98` |

Focus is a `2px` solid outline, offset `2px`, the same outline as badge and icon-button. Focus does not set `box-shadow`, so the outline and the pressed ring can show together: the outline sits outside and the ring sits inside.

See the [Theme Contract](./juice-theme-contract.md) and [Attributes](./juice-attributes.md).

## Cascade

`:where()` keeps the disabled gate at the same specificity as the ungated rules. A disabled host does not match, and nothing in this file sets `box-shadow: none`.

| Selector | Specificity |
|---|---|
| `[theme] [pressable]:hover` | 0,3,0 |
| `[theme] [pressable]:is(:active, [pressed])` | 0,3,0 |
| `[theme] [pressable]:focus-visible` | 0,3,0 |
| `[theme] [pressable="scale"]:is(:active, [pressed])` | 0,3,0 |
| `[theme] [pressable]` transition | 0,2,0 |

Hover is inside `@media (hover: hover)`. A touch pointer does not get a sticky hover ring.

This file does not edit themes, `[btn]`, `[icon-button]`, `[list]`, or `[table]`. It sets no pseudo-element and no `position`. What that leaves is in [Composition](#composition).

## Automatic Boot

The runtime starts automatically in the browser.

At the bottom of the file, Juice checks whether it is running in a browser environment and then boots the pressable runtime:

```ts
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    bootOnReady = () => {
      bootOnReady = null;
      if (!autoStartSuspended) {
        startPressableRuntime();
      }
    };
    document.addEventListener('DOMContentLoaded', bootOnReady);
  } else {
    startPressableRuntime();
  }
}
```

Importing the Juice JS entrypoint is enough for the normal behavior. The entry re-exports this module, so the boot runs.

`stopPressableRuntime()` also cancels a deferred `DOMContentLoaded` boot, so a test or host that stops the singleton before ready does not get a surprise start. Outside a browser, `startPressableRuntime()` returns `null` and `createPressable()` returns a controller whose methods do nothing (`getState()` returns `null`).

## Public API

The runtime still exposes functions, but they are secondary to the automatic behavior.

```ts
createPressable(options?)
initPressable(options?)
startPressableRuntime()
stopPressableRuntime()
```

These are useful for internal control, tests, or advanced cases.

A real change of `{ pressed, longPressed }` dispatches a bubbling, composed `juice:change` from the host. `detail` is `{ runtime: "pressable", state }`. `state` is `{ pressed: boolean, longPressed: boolean }`. `pressed` is the transient gesture, not a latched attribute. `longPressed` is true only after `juice:longpress` has fired for the current gesture. Both return to false when the gesture ends. `getState()` reads that same shape, or `null` when the host is missing. The first observation of a host is recorded and does not dispatch. A later `sync()` that leaves the state unchanged does not dispatch. This surface stays Emerging and is on master, unreleased after 0.9.2. See [juice:change](./juice-runtime-behavior.md#juicechange).

`createPressable()` can run alongside the automatic document runtime. Each pointer and key is claimed once, so a custom-root controller does not double-fire with the singleton.

`initPressable()` is the same function as `createPressable()`.

`startPressableRuntime()` is an idempotent singleton. A second call syncs and returns the same controller.

## PressableOptions

```ts
type PressableOptions = {
  root?: ParentNode;
  pressableSelector?: string;
  longPressDelay?: number;
  moveSlop?: number;
};
```

By default, Juice uses:

```ts
{
  root: document,
  pressableSelector: '[pressable]',
  longPressDelay: 500,
  moveSlop: 10,
}
```

A custom `root` limits sync to pressables inside that root. When the root itself matches, that host is managed too. Hosts outside the root are left alone. A `longPressDelay` or `moveSlop` that is not a finite number `>= 0` falls back to the default. The attribute on the host still wins when it parses. See [Markup](#markup).

## PressableController

```ts
type PressableState = {
  pressed: boolean;
  longPressed: boolean;
};

type PressableController = {
  destroy: () => void;
  sync: () => void;
  getState: (target?: HTMLElement | null) => PressableState | null;
};
```

`destroy()` ends every open press, drops a pending click suppression, removes the listeners, disconnects the observer, and cancels a scheduled sync. It removes `[pressed]` only when this controller added it. `sync()` releases a press whose host is gone or disabled, then records each managed host. With no target, `getState()` uses the first managed `[pressable]` in the root. A target inside a host resolves to that host. A node that is not a pressable and is not inside one returns `null`.

## What the Runtime Actually Does

The runtime performs six main jobs:

1. Find `[pressable]` hosts inside the root. Any attribute value, including `pressable="scale"`, stays as authored
2. On a primary pointerdown (mouse button 0, touch, or pen), set the transient press. Clear it on pointerup, pointercancel, pointerleave, a pointerout that leaves the host, a pointermove whose target is outside the host, lostpointercapture, and blur of the host itself
3. Cancel the press, and a pending long-press, when the pointer moves farther than the slop, or when a scroll target is the host or an ancestor (including the document). `pointermove` and touch scrolling are not `preventDefault`'d. `touch-action` stays in CSS
4. On Enter or Space, while the key is held on the host itself, set the same transient press, including on a native button. Keyup clears it. Repeat keydowns do not restart the gesture. Long-press is pointer-only
5. When `[pressable-longpress]` arms it, dispatch `juice:longpress` after the delay, and suppress the following click unless that event was canceled
6. Leave `[pressed]` alone on a latched host. Everywhere else, set `[pressed]` only when it was absent, and remove it only when this runtime added it

There is no focus trap. This runtime does not close a modal, drawer, toast, popover, wizard, tooltip, combobox, banner, or menu. Escape is not handled.

## Keyboard

Enter and Space are read on the host itself. The event target has to be the pressable. A keydown on a child does not press the host, and it does not stop a scroll. This runtime does not add `role` or `tabindex`. An author who wants a non-button in the tab order sets those.

Enter is never `preventDefault`'d. A native button's click still fires. A link's Enter activation still fires.

Space is `preventDefault`'d only when the page would scroll and the host is a custom button. Both of these have to be true:

- The host is not a native control that already owns Space: `button`, any `input` (button, submit, reset, image, checkbox, radio, file, and the text-like types), `textarea`, `select`, `summary`, or a contenteditable host. `preventDefault` on those would swallow the click, the toggle, the picker, or the typed space.
- The host's first `role` token is a widget whose keyboard pattern activates on Space: `button`, `switch`, `checkbox`, `radio`, `menuitem`, `menuitemcheckbox`, `menuitemradio`, `option`, `tab`, or `treeitem`.

`role="link"` is not in that set. A link activates on Enter, and Space keeps scrolling. A pressable with no role (a card, a plain `div`, an `li`) also keeps the scroll. An `<a href role="button">` is not in the native Space list, so Space does not scroll. Enter is still untouched, so the link still activates. Prefer a `<button type="button">` or a non-link host with `role="button"`.

A disabled custom button still gets the Space `preventDefault`, so the page does not scroll, and it does not start a press. Repeat Space keydowns keep the `preventDefault` and do not restart the gesture.

| Host | Space | Enter |
|---|---|---|
| `<div pressable role="button">` | `defaultPrevented`. Press starts. | Not `defaultPrevented`. Press starts. |
| `<button pressable>`, `<input type="submit" pressable>`, `<summary pressable>` | Not `defaultPrevented`. Native activation stays. Press still starts on the host. | Not `defaultPrevented`. |
| `<div pressable>` with no button-like role | Not `defaultPrevented`. The page can scroll. Press still starts if the host is focused. | Not `defaultPrevented`. |
| `role="link"` | Not `defaultPrevented`. | Not `defaultPrevented`. |
| `role="switch"` (and the other roles in the set) on a non-native host | `defaultPrevented`. | Not `defaultPrevented`. |
| `role="button"` on a contenteditable host | Not `defaultPrevented`. The space is text. | Not `defaultPrevented`. |

## Long-press

`[pressable-longpress]` arms a timer on pointerdown only. Keyboard holds do not long-press.

After the delay, the host dispatches a bubbling, cancelable, composed `juice:longpress` `CustomEvent`. `detail` is `{ pressed: true, longPressed: true }`.

If that event is not `preventDefault`'d, the click that follows the gesture is suppressed once. The runtime listens for `click` in the capture phase, calls `preventDefault` when the event is cancelable, and `stopPropagation`. If the event is canceled, the click is left alone.

A slop or scroll cancel before the timer fires does not long-press and does not suppress the click. If the long-press already fired, a later cancel still suppresses that one click. The suppress flag expires on that click or on the next turn (`setTimeout` 0), so a later click is not swallowed.

`"false"` does not arm. An empty value or `"true"` uses `longPressDelay`. A non-negative number is the delay in milliseconds.

## Latched `[pressed]`

`[icon-button][toggle]` and any host with `aria-pressed` own `[pressed]` as a latched toggle. This runtime never sets or removes `[pressed]` on those hosts. The gesture is still `getState().pressed` and still dispatches `juice:change`. `:active` paints the ring.

On every other host, `[pressed]` is set only when it was absent, and removed only when this runtime added it. An author `[pressed]` that was already there is left in place. A plain `[icon-button]` without `[toggle]` and without `aria-pressed` is not latched, so the runtime may set `[pressed]` for the gesture and then remove it.

## Disabled

`:disabled` (the `disabled` property), `[disabled]`, and `[aria-disabled="true"]` do not press and do not long-press. A host that becomes disabled during a press is cleared.

The hover ring, the pressed ring, and the scale are gated with:

```css
:where(:not(:disabled):not([disabled]):not([aria-disabled="true"]))
```

`:where()` adds no specificity, so the ring does not outrank a component that already set `box-shadow`. There is no `box-shadow: none` and no `transform: none` on the disabled host. The disabled rule only sets `cursor: default`.

That gate is what keeps a disabled `[icon-button][pressed][pressable]` latched ring. An earlier disabled rule that reset `box-shadow` wiped the icon-button's own inset ring (the Bugbot finding). Icon-button `[pressed]` is an inset 2px `currentColor` shadow at `(0, 3, 1)`. Pressable does not clear it. `pointer-events` stay with the author, the same as list: `aria-disabled` does not swallow the click from here. There is no opacity, so a host that already dims is not dimmed twice.

The focus outline is not inside that gate. A focusable disabled host can still show the 2px outline.

## Reduced motion

`prefers-reduced-motion: reduce` sets `transition: none` on `[pressable]` and `[pressable="scale"]`, and `transform: none` on the scale variant while `:active` or `[pressed]`. The ring still appears. The runtime does not read `prefers-reduced-motion` and does not animate.

## Server render

`createPressable()` returns a no-op controller when `window` or `document` is missing. `destroy`, `sync`, and `getState` do nothing, and `getState()` returns `null`. `startPressableRuntime()` returns `null`. The auto-boot at the bottom of the module is inside the same guard, so importing the module during a server render does not touch a DOM.

## Composition

These conflicts are what the cascade leaves. This file does not edit the other components.

- **Icon button.** `[theme] button[icon-button]:active` is `(0, 3, 1)` and beats the scale variant, so an icon-button keeps `translateY(2px)`. The inset ring still paints on `:active`, because icon-button `:active` does not set `box-shadow`. Icon-button `[pressed]` wins the shadow over this ring at `(0, 3, 1)`. Its focus rule is the same 2px `currentColor` outline. Icon-button transition stays at `(0, 3, 1)`. Disabled opacity, `pointer-events`, and cursor stay at `(0, 3, 1)`.
- **List and table.** List hover and `:active` still paint `--juice-list-hover` / `--juice-list-selected`. This file does not set `background`, so the row wash and the inset ring both show. List `box-shadow: none` ties this ring at `(0, 3, 0)`; this file loads later, so the ring wins. List `transform: none` ties the scale variant and loses on `:active`. List transition ties `(0, 2, 0)` and loses. List disabled cursor (`not-allowed`) ties `cursor: default` and loses. List radius is the same `0.375rem`. Table `tbody` row hover is `(0, 3, 2)` and sets `background` only, so the row wash and the ring both show. Header sticky is `(0, 2, 2)` and this file does not set `position`. Sort-button `:focus-visible` is `(0, 4, 2)` and keeps the same 2px `currentColor` outline. The caret is `::after`. This file does not style it.
- **Theme buttons.** Theme `:where(button:hover, button:focus-visible)` is `(0, 1, 0)`. Hover replaces that `box-shadow` with the 1px ring. Focus does not set `box-shadow`, so a KiwiPress or Tide focus glow stays and the outline is added. KiwiPress `translateY(-1px)` stays, because this file does not set `transform` except on the scale variant. KiwiPress `:where(button)` border-radius (`8px`) loses to the radius role. KiwiPress `:where(button)` transition is `(0, 1, 0)` and loses to this file's transition.
- **`[btn="3d"]` and `[btn="metallic"]`.** Their hover rules are `(0, 2, 0)`. The hover `box-shadow` loses to the inset ring. Their `translateY(2px)` loses to the scale variant while `:active` or `[pressed]`, and stays when the variant is off.
- **Pseudos and position.** There is no `::before` and no `::after`, so spinner, progress, slider, and the accordion open bar keep the pseudos they own. There is no `position`, so `[drawer]`, `[toast-region]`, `nav[fixed]`, `nav[sticky]`, `[badge="ribbon"]`, and sticky table cells keep the boxes they already set.

## Why MutationObserver Is Used

The DOM may change after the initial page load. That is what happens in reactive or server-hydrated environments.

If a pressable appears later, or `disabled`, `aria-disabled`, `aria-pressed`, `[pressed]`, `[icon-button]`, or `[toggle]` changes, the observer drops a press that is no longer allowed and schedules a `sync()`.

The observer watches child-list changes and these attributes: `pressable`, `pressable-longpress`, `pressable-slop`, `pressed`, `disabled`, `aria-disabled`, `aria-pressed`, `icon-button`, and `toggle`. Removing `[pressable]` drops the host. `destroy()` stops that observation.

## Why Sync Is Scheduled

Mutation-heavy environments can change the DOM a lot in a short burst.

So instead of calling `sync()` immediately for every change, the runtime schedules it with `requestAnimationFrame`. A host that becomes disabled is cleared in the observer callback, before that frame.

That keeps the runtime from reacting too aggressively while still updating quickly enough for UI behavior.

## Sig `bind()`

`@citrusworx/sigjs/juice` `bind()` does not include pressable. `JuiceRuntimeName` stops at twenty-eight names, through `table`. Passing `"pressable"` is not a supported name. This runtime does not call `bind`, and Juice does not import Sig.

`juice:change` and `getState()` still work without Sig. Listen on the host, or call `getState()` on the controller. `juice:longpress` is a separate event. `bind` does not listen for it.

## Accessibility

- Prefer `<button type="button" pressable>` so the platform already supplies the role, the type, and Enter / Space. The runtime does not add `role` or `tabindex`
- A non-button that should act as a button needs `role="button"` and `tabindex="0"` from the author. Space on that host does not scroll the page. Enter is not rewritten
- Do not put `[pressable]` on a latched control and expect this runtime to toggle it. `[icon-button][toggle]` and `aria-pressed` keep their own `[pressed]`
- A long-press is pointer-only. Keyboard users do not get `juice:longpress`. Do not hide the only action behind it
- Disabled is the `disabled` property, `[disabled]`, or `aria-disabled="true"`. The press does not start. `aria-disabled` does not remove the click from here
- The ring follows inherited ink. On Citrusmint muted copy the ring misses 3:1. Put the pressable on a host that keeps body ink when the ring has to clear 3:1
- Focus is the `:focus-visible` outline. The runtime does not move focus and does not trap it

## Limitations

- No `Pressable()` factory. Author markup (or emit it from Sig/React) and let the runtime enhance it.
- This surface is Emerging, not Stable. Pressable is the twenty-ninth Emerging auto-enhance runtime. It is on master and is not in the published `@citrusworx/juiceui@0.9.2` npm cut. Table remains the twenty-eighth and is also on master, not in that cut. Touchable row is the thirtieth Emerging auto-enhance runtime and is on master, not in the published npm 0.9.2 release. All thirty stay Emerging.
- `@citrusworx/sigjs/juice` `bind()` does not name pressable or touchable-row. Do not pass `"pressable"` or `"touchable-row"` as a `JuiceRuntimeName`. See [Sig `bind()`](#sig-bind).
- The runtime does not add `role` or `tabindex`. A `div` without them is not a button.
- Enter is never `preventDefault`'d. Space is `preventDefault`'d only for the custom button roles above, and only when the host itself is the event target.
- `[pressed]` on a latched host is not this runtime's attribute. An author `[pressed]` that was already present is left in place.
- Long-press does not run from the keyboard. Canceling `juice:longpress` keeps the click. Not canceling it swallows the next click once.
- Citrusmint muted hosts miss 3:1 on the ring. The file does not set `color`.
- The composition conflicts in [Composition](#composition) are unchanged: icon-button `:active` translate beats scale, list and table washes paint under the ring, theme button hover shadows and `[btn="3d"]` / `[btn="metallic"]` hover shadows lose to the ring, and those translate values lose to scale while pressed.
- There is no focus trap and no Escape handling. Pressable is not a layered overlay. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering).
- There is no z-index elevation. Pressable is inline chrome. See [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands).
- Centered modal / dialog, edge-docked drawer, toast-stack, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, breadcrumb, progress, pagination, disclosure, spinner, select, input, textarea, field, icon button, avatar, table, and accordion behavior are not part of this runtime.

## Why This Matches Navigation

The pressable runtime copies the navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, breadcrumb, progress, pagination, disclosure, spinner, select, input, textarea, field, icon button, avatar, and table lifecycle by convention:

- DOM-first
- automatic boot
- event delegation for pointer and for Enter / Space
- MutationObserver plus rAF `sync()`
- idempotent singleton `start*Runtime` / `stop*Runtime`
- framework-agnostic

Shared internals under `libraries/juice/src/js/src/shared/` are not a public multi-feature runtime API. `juice:change` comes from that shared helper. Pressable does not import Sig.

## Design Rule Going Forward

Interactive Juice browser features should follow this standard:

> Valid Juice markup should work automatically when it reaches the browser.
