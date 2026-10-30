# Pressable

Pressable is transient press feedback on any host. `createPressable` shows that press for the gesture and can fire an opt-in long-press.

Emerging. The twenty-ninth runtime. Shipped in 0.9.4. Its four exports shipped in that cut. `@citrusworx/sigjs/juice` `bind` does not name `pressable`. It is not a `JuiceRuntimeName`.

Importing `@citrusworx/juiceui` enhances valid markup. See [Automatic behavior](./juice-runtime-behavior.md#automatic-behavior).

Pressable is Mobile-Critical. The stylesheet is `libraries/juice/src/components/pressable/pressable.scss`. `components.scss` forwards it after `popover.scss` and before `pagination.scss`.

The stylesheet does not require the runtime. `:active` paints the same pressed ring when the JS entry is absent. A theme does not have to bind a color for that ring to show. There is no `Pressable()` factory. CSS does not add `role` or `tabindex`.

## Markup

Boolean ring.

```html
<button type="button" pressable>Save</button>
```

Scale while pressed.

```html
<div pressable="scale" role="button" tabindex="0">Hold</div>
```

Long-press with a custom slop.

```html
<li pressable pressable-longpress="700" pressable-slop="16">Row</li>
```

There is no HTML global `pressable` attribute, and there is no `<pressable>` element. `[pressable]` is an attribute selector. `[scale]` is button and icon-button size (`sm` / `lg`). It is not reused.

## Attributes

| Hook | What it does |
| --- | --- |
| `[pressable]` | Host. Any value, including empty, is still a pressable. Pointer, `touch-action: manipulation`, no tap highlight, no text selection. |
| Hover ring | `1px` inset ring, and only under `@media (hover: hover)`. |
| Pressed ring | `2px` inset ring on `:active` and `[pressed]`. |
| `[pressable="scale"]` | The same rings, plus `scale(var(--juice-pressable-scale))` (`0.98`) while `:active` or `[pressed]`. |
| Other values | Ring only. `pressable="foo"` does not scale. The runtime does not rewrite the value. |
| `[pressed]` | The in-progress press. Set for the gesture on hosts that do not already own it as a latched toggle. |
| `[pressable-longpress]` | Opt-in. Absent, the host does not arm one. Empty or `"true"` uses `longPressDelay` (default 500). |
| Long-press number | A non-negative number is the delay in milliseconds. `"false"` does not arm. Any other value uses the default delay. Pointer only. |
| `[pressable-slop]` | Optional pixel slop. A non-negative number overrides `moveSlop` (default 10). Anything else uses the option. |
| Disabled | `[disabled]`, the `disabled` property, and `[aria-disabled="true"]` set `cursor: default`. The hover ring, the pressed ring, and the scale do not paint. |

Core CSS does not give `[pressable]` a z-index. See [Z-index bands](./juice-runtime-behavior.md#z-index-bands).

## JavaScript

| Export | What it does |
| --- | --- |
| `createPressable(options?)` | Builds a controller. Same function as `initPressable`. Without `document`, methods do nothing and `getState()` returns `null`. |
| `initPressable(options?)` | Same call as `createPressable`. |
| `startPressableRuntime()` | Starts the document singleton. A second call syncs and returns it. Returns `null` without `document`. |
| `stopPressableRuntime()` | Destroys the singleton and cancels a deferred boot. |

`createPressable()` can run beside the document runtime. Each pointer and key is claimed once, so the two do not double-fire. The entry re-exports this module, so the boot runs on import.

### Options

| Option | Default |
| --- | --- |
| `root` | `document` |
| `pressableSelector` | `[pressable]` |
| `longPressDelay` | `500` |
| `moveSlop` | `10` |

A custom `root` limits sync to hosts inside that root. When the root itself matches, that host is managed too. Hosts outside the root are left alone. A `longPressDelay` or `moveSlop` that is not a finite number `>= 0` falls back to the default. The attribute on the host still wins when it parses.

### Controller

- `destroy()` ends every open press, drops a pending click suppression, removes the listeners, disconnects the observer, and cancels a scheduled sync. It removes `[pressed]` only when this controller added it.
- `sync()` releases a press whose host is gone or disabled, then records each managed host.
- `getState(target?)` returns `{ pressed: boolean, longPressed: boolean }`, or `null` when no managed host matches. After `destroy()`, it returns `null`.

With no target, `getState()` uses the first managed host. A target inside a host resolves to that host.

### Events

A change of `pressed` or `longPressed` dispatches a bubbling, composed [juice:change](./juice-runtime-behavior.md#juicechange) from the host, with `detail` `{ runtime: "pressable", state: { pressed: boolean, longPressed: boolean } }`. `pressed` is the transient gesture, not a latched attribute.

`longPressed` is true only after `juice:longpress` for the current gesture, and both flags return to false when the gesture ends. `getState()` returns that shape, or `null` when the host is missing, and the first observation and a later unchanged `sync()` do not dispatch.

`juice:longpress` is a bubbling, cancelable, composed `CustomEvent` with `detail` `{ pressed: true, longPressed: true }`. If that event is not canceled, the following click is suppressed once.

## Accessibility

- Prefer `<button type="button" pressable>` so the platform supplies the role, the type, and Enter / Space. The runtime does not add `role` or `tabindex`.
- A non-button that should act as a button needs `role="button"` and `tabindex="0"` from the author. Space on that host does not scroll the page. Enter is not rewritten.
- Do not put `[pressable]` on a latched control and expect this runtime to toggle it. `[icon-button][toggle]` and `aria-pressed` keep their own `[pressed]`.
- A long-press is pointer-only. Keyboard users do not get `juice:longpress`. Do not hide the only action behind it.
- Disabled is the `disabled` property, `[disabled]`, or `aria-disabled="true"`. The press does not start. `aria-disabled` does not remove the click from here.
- The ring follows inherited ink. On Citrusmint muted copy the ring misses 3:1. Put the pressable on a host that keeps body ink when the ring has to clear 3:1.
- Focus is the `:focus-visible` outline. The runtime does not move focus and does not trap it. See [Escape and layering](./juice-runtime-behavior.md#escape--layering) and [Z-index bands](./juice-runtime-behavior.md#z-index-bands).

## Behavior

1. Find `[pressable]` hosts in the root. Any attribute value, including `pressable="scale"`, stays as authored.
2. On a primary pointerdown (mouse button 0, touch, or pen), set the transient press, and clear it when the gesture ends.
3. Cancel the press, and a pending long-press, when the pointer moves farther than the slop, or when a scroll target is the host or an ancestor.
4. On Enter or Space, while the key is held on the host itself, set the same transient press, including on a native button. Keyup clears it.
5. When `[pressable-longpress]` arms it, dispatch `juice:longpress` after the delay, and suppress the following click unless that event was canceled.
6. Leave `[pressed]` alone on a latched host. Everywhere else, set `[pressed]` only when it was absent, and remove it only when this runtime added it.

The press clears on pointerup, pointercancel, pointerleave, a pointerout that leaves the host, a pointermove whose target is outside the host, lostpointercapture, and blur of the host itself. `pointermove` and touch scrolling are not `preventDefault`'d. `touch-action` stays in CSS. Repeat keydowns do not restart the gesture. Long-press is pointer-only.

### Keyboard

Enter and Space are read on the host itself. The event target has to be the pressable. A keydown on a child does not press the host, and it does not stop a scroll. This runtime does not add `role` or `tabindex`.

Enter is never `preventDefault`'d. A native button's click still fires. A link's Enter activation still fires.

Space is `preventDefault`'d only when the page would scroll and the host is a custom button. Both of these have to be true:

- The host is not a native control that already owns Space: `button`, any `input`, `textarea`, `select`, `summary`, or a contenteditable host.
- The host's first `role` token is `button`, `switch`, `checkbox`, `radio`, `menuitem`, `menuitemcheckbox`, `menuitemradio`, `option`, `tab`, or `treeitem`.

`role="link"` is not in that set. A link activates on Enter, and Space keeps scrolling. A pressable with no role (a card, a plain `div`, an `li`) also keeps the scroll. An `<a href role="button">` is not in the native Space list, so Space does not scroll. Enter is still untouched, so the link still activates. Prefer a `<button type="button">` or a non-link host with `role="button"`.

A disabled custom button still gets the Space `preventDefault`, so the page does not scroll, and it does not start a press. Repeat Space keydowns keep that `preventDefault` and do not restart the gesture. `Spacebar` is treated as Space.

| Host | Space | Enter |
| --- | --- | --- |
| `<div pressable role="button">` | `defaultPrevented`. Press starts. | Not `defaultPrevented`. Press starts. |
| `<button pressable>`, `<input type="submit" pressable>`, `<summary pressable>` | Not `defaultPrevented`. Native activation stays. Press still starts on the host. | Not `defaultPrevented`. |
| `<div pressable>` with no button-like role | Not `defaultPrevented`. The page can scroll. Press still starts if the host is focused. | Not `defaultPrevented`. |
| `role="link"` | Not `defaultPrevented`. | Not `defaultPrevented`. |
| `role="switch"` (and the other roles in the set) on a non-native host | `defaultPrevented`. | Not `defaultPrevented`. |
| `role="button"` on a contenteditable host | Not `defaultPrevented`. The space is text. | Not `defaultPrevented`. |

`preventDefault` on a native Space owner would swallow the click, the toggle, the picker, or the typed space. Checkbox, radio, file, and the text-like input types are in that native list.

### Long-press

`[pressable-longpress]` arms a timer on pointerdown only. Keyboard holds do not long-press. After the delay, the host dispatches `juice:longpress`.

If that event is not `preventDefault`'d, the click that follows is suppressed once. The runtime listens for `click` in the capture phase, calls `preventDefault` when the event is cancelable, and `stopPropagation`. If the event is canceled, the click is left alone.

A slop or scroll cancel before the timer fires does not long-press and does not suppress the click. If the long-press already fired, a later cancel still suppresses that one click. The suppress flag expires on that click or on the next turn (`setTimeout` 0), so a later click is not swallowed.

`"false"` does not arm. An empty value or `"true"` uses `longPressDelay`. A non-negative number is the delay in milliseconds.

### Latched pressed

`[icon-button][toggle]` and any host with `aria-pressed` own `[pressed]` as a latched toggle. This runtime never sets or removes `[pressed]` on those hosts. The gesture is still `getState().pressed` and still dispatches `juice:change`. `:active` paints the ring.

On every other host, `[pressed]` is set only when it was absent, and removed only when this runtime added it. An author `[pressed]` that was already there is left in place. A plain `[icon-button]` without `[toggle]` and without `aria-pressed` is not latched, so the runtime may set `[pressed]` for the gesture and then remove it.

### Disabled

`:disabled` (the `disabled` property), `[disabled]`, and `[aria-disabled="true"]` do not press and do not long-press. A host that becomes disabled during a press is cleared.

The hover ring, the pressed ring, and the scale are gated with:

```css
:where(:not(:disabled):not([disabled]):not([aria-disabled="true"]))
```

`:where()` adds no specificity, so the ring does not outrank a component that already set `box-shadow`. There is no `box-shadow: none` and no `transform: none` on the disabled host. The disabled rule only sets `cursor: default`.

That gate keeps a disabled `[icon-button][pressed][pressable]` latched ring. Pressable does not clear the icon-button inset ring (`inset 0 0 0 2px currentColor` at `(0, 3, 1)`). `pointer-events` stay with the author. `aria-disabled` does not swallow the click from here. There is no opacity, so a host that already dims is not dimmed twice.

The focus outline is not inside that gate. A focusable disabled host can still show the `2px` outline.

### Reduced motion

`prefers-reduced-motion: reduce` sets `transition: none` on `[pressable]` and `[pressable="scale"]`, and `transform: none` on the scale variant while `:active` or `[pressed]`. The ring still appears. The runtime does not read `prefers-reduced-motion` and does not animate.

### Server render

`createPressable()` returns a no-op controller when `window` or `document` is missing. `destroy`, `sync`, and `getState` do nothing, and `getState()` returns `null`. `startPressableRuntime()` returns `null`. The auto-boot is inside the same guard, so a server import does not touch a DOM.

### Cascade

`:where()` keeps the disabled gate at the same specificity as the ungated rules. A disabled host does not match, and nothing in this file sets `box-shadow: none`.

| Selector | Specificity |
| --- | --- |
| `[theme] [pressable]:hover` | 0,3,0 |
| `[theme] [pressable]:is(:active, [pressed])` | 0,3,0 |
| `[theme] [pressable]:focus-visible` | 0,3,0 |
| `[theme] [pressable="scale"]:is(:active, [pressed])` | 0,3,0 |
| `[theme] [pressable]` transition | 0,2,0 |

Hover is inside `@media (hover: hover)`. A touch pointer does not get a sticky hover ring.

This file does not edit themes, `[btn]`, `[icon-button]`, `[list]`, or `[table]`. It sets no pseudo-element and no `position`.

### Why the ring

Feedback is an inset `box-shadow`, not a background and not a pseudo-element. The shadow sits on the edge. Hover is `1px`. Pressed is `2px`. Both use `currentColor`, the full ink.

| Theme | Page | Strong |
| --- | ---: | ---: |
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

Every pressed ring in that table clears 3:1. Hover uses the same ink, so it clears 3:1 too. Citrusmint is the floor: **4.62:1** on the page and **5.17:1** on the strong surface.

Those ratios are body ink against each theme's page, and against `--juice-surface-strong-bg` with a translucent plate composited over the page first. Citrusmint strong is `--cm-surface`. KiwiPress strong is `--kw-surface`, which is what `--juice-surface-strong-bg` points at. There is no automated contrast test. The check is the token math in the stylesheet header.

A KiwiPress default button is white on `--kw-accent` at **3.84:1**. The ring uses that white against the button fill, and the fill itself is unchanged.

<details>
<summary>Why not a wash</summary>

Citrusmint body ink is `hsl(121, 100%, 25%)` (`--cm-text`, freshgreen-800) on the page `hsl(121, 100%, 90%)` (`--cm-page`, freshgreen-100). The same ink on the strong surface (`--cm-surface`, white) is **5.17:1**.

A 1% `currentColor` wash over that page drops the text pair to **4.56:1**. That is the floor. A wash cannot go further without missing 4.5:1 for the words.

A translucent ring has the same problem against WCAG 1.4.11 (3:1). Mixing the ink under 80% misses 3:1 on the Citrusmint page: 70% is **2.80:1** and 80% is **3.30:1**.

</details>

### The weak spot

The ring follows the host's ink. This file does not set `color`.

Citrusmint copy rules paint `p`, `span`, `li`, and `label` with muted ink (`--cm-text-muted`, freshgreen-600, `hsl(121, 100%, 40%)`). That pair is **1.95:1** on the page and **2.18:1** on the strong surface. An `li` host's ring is that muted ink. It misses 3:1. A host that keeps body ink (a `button`, a heading, or an author `color`) keeps the table above.

Theme copy for `p` / `span` / `li` / `label`, and `:where(a:hover)`, is `(0, 1, 0)` and sets `color` only. It does not set the ring.

### Roles

Color is restated on `[theme]`. A custom property resolves `var()` on the element that sets it. `currentColor` stays in these values and resolves where the pressable paints. Geometry and motion stay on `:root` only. Shipped library themes and generated `--jx-*` themes are not required to bind `--juice-pressable-*`. Do not add a pressable hue family.

| Role | Where | Default |
| --- | --- | --- |
| `--juice-pressable-hover-ring` | `:root` and `[theme]` | `currentColor` |
| `--juice-pressable-pressed-ring` | `:root` and `[theme]` | `currentColor` |
| `--juice-pressable-focus-ring` | `:root` and `[theme]` | `currentColor` |
| `--juice-pressable-radius` | `:root` only | `0.375rem` |
| `--juice-pressable-duration` | `:root` only | `var(--juice-motion-duration-fast)` |
| `--juice-pressable-easing` | `:root` only | `var(--juice-motion-ease-standard)` |
| `--juice-pressable-scale` | `:root` only | `0.98` |

Focus is a `2px` solid outline, offset `2px`, the same outline as badge and icon-button. Focus does not set `box-shadow`, so the outline and the pressed ring can show together: the outline sits outside and the ring sits inside.

### Composition

These conflicts are what the cascade leaves. This file does not edit the other components.

- **Icon button.** `[theme] button[icon-button]:active` is `(0, 3, 1)` and beats the scale variant, so an icon-button keeps `translateY(2px)`. The inset ring still paints on `:active`, because icon-button `:active` does not set `box-shadow`.
- Icon-button `[pressed]` wins the shadow over this ring at `(0, 3, 1)`. Its focus rule is the same `2px` `currentColor` outline. Icon-button transition stays at `(0, 3, 1)`. Disabled opacity, `pointer-events`, and cursor stay at `(0, 3, 1)`.
- **List.** List hover and `:active` still paint `--juice-list-hover` / `--juice-list-selected`. This file does not set `background`, so the row wash and the inset ring both show.
- List `box-shadow: none` ties this ring at `(0, 3, 0)`; this file loads later, so the ring wins. List `transform: none` ties the scale variant and loses on `:active`. List transition ties `(0, 2, 0)` and loses.
- List disabled cursor (`not-allowed`) ties `cursor: default` and loses. List radius is the same `0.375rem`.
- **Table.** `tbody` row hover is `(0, 3, 2)` and sets `background` only, so the row wash and the ring both show. Header sticky is `(0, 2, 2)` and this file does not set `position`.
- Sort-button `:focus-visible` is `(0, 4, 2)` and keeps the same `2px` `currentColor` outline. The caret is `::after`. This file does not style it.
- **Theme buttons.** Theme `:where(button:hover, button:focus-visible)` is `(0, 1, 0)`. Hover replaces that `box-shadow` with the `1px` ring. Focus does not set `box-shadow`, so a KiwiPress or Tide focus glow stays and the outline is added.
- KiwiPress `translateY(-1px)` stays, because this file does not set `transform` except on the scale variant. KiwiPress `:where(button)` border-radius (`8px`) loses to the radius role. Its transition is `(0, 1, 0)` and loses to this file's transition.
- **`[btn="3d"]` and `[btn="metallic"]`.** Their hover rules are `(0, 2, 0)`. The hover `box-shadow` loses to the inset ring. Their `translateY(2px)` loses to the scale variant while `:active` or `[pressed]`, and stays when the variant is off.
- **Pseudos and position.** There is no `::before` and no `::after`, so spinner, progress, slider, and the accordion open bar keep the pseudos they own. There is no `position`, so `[drawer]`, `[toast-region]`, `nav[fixed]`, `nav[sticky]`, `[badge="ribbon"]`, and sticky table cells keep the boxes they already set.

The observer watches child list and `pressable`, `pressable-longpress`, `pressable-slop`, `pressed`, `disabled`, `aria-disabled`, `aria-pressed`, `icon-button`, and `toggle`. It does not watch character data.

A host that becomes disabled, or that is no longer managed, is released in the observer callback, before the frame. Removing `[pressable]` drops the host. `destroy()` stops that observation.

Later DOM changes schedule `sync()` on the next animation frame. [Sync](./juice-runtime-behavior.md#sync).

## Sig

`@citrusworx/sigjs/juice` binds 28 runtimes through `table` on master and in `@citrusworx/sigjs@0.7.2`. Pressable is not one of them. `bind` does not name `pressable`. Passing `"pressable"` is not a `JuiceRuntimeName`.

This runtime does not call `bind`, and Juice does not import Sig. `juice:change` and `getState()` still work without Sig. `juice:longpress` is a separate event. `bind` does not listen for it. State stays `{ pressed: boolean, longPressed: boolean }`.

## Not to be confused with

| This | Not this |
| --- | --- |
| Transient press | A latched toggle (`[icon-button][toggle]` owns `[pressed]`) |

## Related

- [Attributes](./juice-attributes.md)
- [Theme contract](./juice-theme-contract.md)
- [Runtime behavior](./juice-runtime-behavior.md)
- [Icon button](./juice-icon-button-runtime.md)
- [Touchable row](./juice-touchable-row.md)
