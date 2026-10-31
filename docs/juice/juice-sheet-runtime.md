# Sheet

A sheet is a bottom-anchored dialog rooted at `[sheet-overlay]`.

Emerging. The thirty-second runtime. On master, and not yet in npm. The latest published cut is `@citrusworx/juiceui@0.9.5`. Do not invent a version number for this surface.

`createSheet`, `initSheet`, `startSheetRuntime`, and `stopSheetRuntime` are on master. `@citrusworx/sigjs/juice` `bind` does not name `sheet`. It is not a `JuiceRuntimeName`.

Importing `@citrusworx/juiceui` enhances valid markup. [Automatic behavior](./juice-runtime-behavior.md#automatic-behavior).

The markup contract, detents, overlay modes, layout roles, and the color fallback are in [Sheet chrome](./juice-sheet.md). The stylesheet works without the runtime: a sheet with no `[hidden]` stays visible, and a missing `[detent]` rests at the height that slice paints.

## Markup

```html
<button type="button" aria-controls="demo-sheet">Open</button>

<div sheet-overlay id="demo-sheet" hidden>
  <div sheet role="dialog" sheet-detents="half full">
    <button type="button" sheet-handle></button>
    <button type="button" sheet-close aria-label="Close">×</button>
    <div sheet-header><h2>Details</h2></div>
    <div sheet-body>…</div>
    <div sheet-footer><button type="button">Done</button></div>
  </div>
</div>
```

Closed vs open is the native `hidden` attribute on `[sheet-overlay]`.

## Attributes

| Hook | What it does |
| --- | --- |
| `[sheet-overlay]` | Root. Boolean and any value other than `none` are modal. |
| `[sheet-overlay="static"]` | Modal backdrop. Backdrop click does not close. |
| `[sheet-overlay="none"]` | Non-modal. No scrim, no focus trap, no scroll lock, no backdrop close. Escape still closes. |
| `[sheet]` | Dialog panel. `role="dialog"`. |
| `[sheet-detents]` | Allowed detents, `~=` words: `peek`, `half`, `full`. Absent, or with no known word, the set is `half full`. |
| `[detent]` | Current detent: `peek`, `half`, or `full`. The runtime writes it. |
| `[dragging]` | Set on `[sheet]` during a committed drag. CSS also honors it on the overlay. |
| `[sheet-handle]` | Drag origin. `44px` hit target inside the sheet. |
| `[sheet-header]` | Drag origin, and the heading that names the dialog. |
| `[sheet-body]` | Scrollport. Hands a downward drag to the sheet only when `scrollTop` is `0`. |
| `[sheet-footer]` | Action row. Owns the bottom inset when it is present. |
| `[sheet-close]` | Dismiss control inside the overlay. An empty name is filled as `aria-label="Close"`. |
| `hidden` | Native closed state on `[sheet-overlay]`. |
| `aria-controls` | Pairs an opener whose token list includes the overlay `id`. |
| `data-motion-state` | `entering`, `entered`, `exiting`, or `exited` on the overlay. |
| `name`, `id` | Overlay `name` or `id` is the slug for generated ids. |

## JavaScript

| Export | What it does |
| --- | --- |
| `createSheet(options?)` | Controller for `options.root`, or the document. |
| `initSheet(options?)` | Same call as `createSheet`. |
| `startSheetRuntime()` | Document controller. A second call syncs and returns it. Returns `null` when there is no document. |
| `stopSheetRuntime()` | Destroys that controller and cancels a deferred boot. |

Types exported with those functions: `SheetOptions`, `SheetController`, `SheetState`, and `SheetDetent` (`"peek" | "half" | "full"`).

No `window` or no `document` is a no-op. `getState()` then returns `null`.

A custom-root controller can run beside the document runtime. Each click or key is claimed once inside this runtime. Sheet, drawer, and modal do not share that claim. See [Known behaviors](#known-behaviors).

### Options

| Option | Default | Notes |
| --- | --- | --- |
| `root` | `document` | Node to search. |
| `overlaySelector` | `[sheet-overlay]` | Overlay query. |
| `dialogSelector` | `[sheet]` | Dialog query. |
| `closeSelector` | `[sheet-close]` | Close control query. |
| `handleSelector` | `[sheet-handle]` | Drag origin. |
| `headerSelector` | `[sheet-header]` | Drag origin, and the heading used for the name. |
| `bodySelector` | `[sheet-body]` | Scroll handoff. |
| `closeOnBackdrop` | `true` | Backdrop click closes. `false` matches `sheet-overlay="static"`. |

### Controller

| Method | What it does |
| --- | --- |
| `destroy()` | Removes listeners, releases scroll locks this controller holds, and cancels an in-flight drag. |
| `sync()` | Wires ids, ARIA, openers, the scroll lock, and a missing `[detent]` for overlays in the root. |
| `open(target?)` | Opens the overlay: removes `hidden`, writes the resting detent, then plays. |
| `close(target?)` | Plays the exit, then sets `hidden`. A modal sheet restores focus. |
| `toggle(target?)` | Opens a closed overlay or closes an open one. |
| `isOpen(target?)` | Reads whether the overlay lacks `hidden`. |
| `getState(target?)` | `{ open, detent, dragging, modal }`, or `null` when there is no `[sheet]`. |

`getState()` resolves the overlay from the target (the overlay, a node inside it, a close control, or an `aria-controls` opener). With no target it uses the first open sheet, then the first sheet in the root. The returned object is a copy.

| Field | Meaning |
| --- | --- |
| `open` | The overlay lacks `hidden`. |
| `detent` | `peek`, `half`, or `full`. The `[detent]` attribute when it is allowed, otherwise the resting detent. |
| `dragging` | `[sheet]` has `[dragging]`. |
| `modal` | `false` only for `sheet-overlay="none"`. Boolean, omitted, and `"static"` are `true`. |

### Events

A change dispatches a bubbling [juice:change](./juice-runtime-behavior.md#juicechange) from `[sheet-overlay]`. `detail` is `{ runtime: "sheet", state }`. `state` is `{ open, detent, dragging, modal }`.

The first observation is silent. Later events fire when that shape changes. There is no second event name. This surface stays Emerging and is not in the published 0.9.5 types.

## Accessibility

- Escape closes the topmost open sheet in DOM order, including `sheet-overlay="none"` and including during exit. Sheet, drawer, and modal each handle Escape. [Escape and layering](./juice-runtime-behavior.md#escape--layering). [Known behaviors](#known-behaviors).
- Tab and Shift+Tab wrap inside an open modal sheet. `sheet-overlay="none"` does not trap focus, does not move focus in, and does not restore it.
- Enter and Space activate non-button openers and `[sheet-close]` controls.
- The runtime sets `role="dialog"`, `aria-modal` (`"true"` for a modal sheet, `"false"` for `none`), and `aria-labelledby` from the header heading when the name is missing.
- Opener `aria-expanded` stays in sync. A missing `aria-haspopup` becomes `"dialog"`. An empty close name becomes `aria-label="Close"`.
- Overlay chrome is `z-index: 1000`. [Z-index bands](./juice-runtime-behavior.md#z-index-bands).
- The handle hit target is `44px` tall and stays inside the sheet. [Sheet chrome](./juice-sheet.md#handle-hit-target).

## Behavior

1. Find `[sheet-overlay]` roots that contain a `[sheet]`. An overlay with no `[sheet]` is ignored. `disabled` or `aria-disabled="true"` on the overlay or the sheet is ignored for open, close, and drag.
2. Pair openers whose `aria-controls` token list includes that overlay `id`. An opener inside a sheet overlay is not an opener.
3. Fill missing overlay, dialog, and title ids from `name` or `id` (`filters-overlay`, `filters-dialog`, `filters-title`).
4. On open, write the resting `[detent]`: half when half is allowed, otherwise full when full is allowed, otherwise peek. While `[keyboard-open]` is set, that rest is `full` when full is allowed, otherwise the highest allowed detent.
5. Enter removes native `hidden`, then plays. Exit plays first. `hidden` is set only after it finishes. Reduced motion, or a computed duration of `0`, does both in the same turn. An in-flight exit stays the open dialog until that commit. A new open of that same overlay cancels the exit.
6. Modal sheets (boolean, omitted, or `"static"`) trap focus, move focus in, restore it when `hidden` is set, and set `aria-modal="true"`. `sheet-overlay="none"` does none of that.
7. Backdrop click closes unless `sheet-overlay="static"`, `sheet-overlay="none"`, or `closeOnBackdrop` is `false`. `[sheet-close]` closes. A click on the panel does not.
8. Drag from the handle or the header after an `8px` slop. `[sheet-body]` hands off only when its `scrollTop` is `0` and the gesture moves down. Release snaps. See [Drag](#drag).

Opening one sheet does not close another. Several sheets may be open together.

Scroll lock is modal only. A shared counter sets `document.body.style.overflow` to `"hidden"` on the first modal sheet and restores the previous inline value when the last one closes. Nested and sibling modal sheets stay locked until all of them close. `destroy()` releases the locks that controller holds. The counter does not touch `documentElement`. `sheet-overlay="none"` does not lock.

`hasOpenDialogOverlay` matches `[sheet-overlay]:not([hidden])` along with modal and drawer, so popover, menu, combobox, toast, and tooltip keep yielding. An open `sheet-overlay="none"` counts.

There is no `Sheet()` factory.

Later DOM changes schedule `sync()` on the next animation frame. Call `sync()` when a host is added and you need that pass immediately. The first observation of a new host is silent. [Sync](./juice-runtime-behavior.md#sync).

### Drag

Pointer events on `[sheet-handle]` and `[sheet-header]` track the finger after an `8px` slop. `[dragging]` is set on the sheet and `data-motion-state` is `entered` so the enter/exit animation does not fight the inline height.

The finger is followed with inline height. Past the highest detent and below the lowest, `translateY` rubber-bands by `0.35` of the overflow. Reduced motion clamps that visual and does not rubber-band. The logical height still tracks so a close can commit.

Release projects the logical height by velocity over `180ms` and snaps to the nearest allowed detent. Velocity is the pointer movement over the last `120ms` of samples. Downward velocity of at least `0.5px/ms` at or below the lowest detent, or a logical height more than `80px` below it, closes. `pointercancel` drops the gesture and restores the detent it started on. A committed drag suppresses the following click. Inline height and transform clear on the next frame after a snap, or immediately when motion is reduced or the gesture is cancelled.

### Keyboard

A `MutationObserver` on `document.documentElement` watches `[keyboard-open]`. While a sheet is open, gaining that attribute snaps it to `full` when full is allowed, otherwise the highest allowed detent. Opening while the attribute is already set uses that same rest. Removing the attribute leaves the sheet there.

`html[keyboard-open]` still shrinks max-height by `--juice-keyboard-inset`. Footer and trailing-body padding drop the keyboard term under that attribute, so the inset is counted once. [Sheet chrome](./juice-sheet.md#safe-area-and-the-keyboard).

### Motion

Enter removes `hidden`, moves focus in on a modal sheet, then sets `data-motion-state="entering"`. The scrim fades in and the panel slides up from `translateY(100%)` on `--juice-motion-duration-base` and `--juice-motion-ease-enter`.

Exit sets `data-motion-state="exiting"` before `hidden`. The scrim fades out and the panel slides down on `--juice-motion-duration-fast` and `--juice-motion-ease-exit`. `hidden` is set only after the exit finishes.

<details>
<summary>Edge cases</summary>

- The focus trap and Escape still apply during exit on a modal sheet. Escape still applies on `sheet-overlay="none"`.
- A second Escape does not start a second close of a sheet that is already exiting.
- A new open cancels an in-flight exit and writes the resting detent again.
- Duration tokens live in [Animations](./juice-animations.md).

</details>

## Known behaviors

These are the current contract. They are easy to misread from the chrome alone.

- **Reopen resets.** Every open transition writes the ranked default detent (half when half is allowed, otherwise full, otherwise peek), including over a previous snap and over an author `[detent]`. A sheet that is already open keeps a valid `[detent]` until a gesture, the keyboard, or the next open replaces it.
- **Keyboard snap stays.** Gaining `[keyboard-open]` snaps to `full`, or to the highest allowed detent when full is not allowed. Closing the keyboard does not restore the previous detent.
- **Escape is per dialog runtime.** Sheet, drawer, and modal each listen for Escape. The claim is per runtime, so one press can close a sheet and a drawer and a modal when all three are open. Within sheets, Escape closes the last open overlay in DOM order.
- **Non-modal still counts as a dialog overlay.** An open `sheet-overlay="none"` is included in `hasOpenDialogOverlay`. Menus, popovers, combobox lists, toasts, and tooltips yield while it is open. It still has no focus trap and no scroll lock.
- **Body handoff reads one scroller.** The gesture reads `[sheet-body].scrollTop` only. A nested scroller inside the body is not a separate handoff.
- **No back button.** History is out of scope. This runtime does not push state and does not listen for `popstate`.

## CSS

Layout roles stay on `:root`. Color falls through `--juice-sheet-*` to `--juice-drawer-*`. There is no required sheet role. Set `--juice-sheet-panel-shadow` with a negative Y offset to aim the shadow up. The drawer fallback points down.

`z-index` on the overlay is `1000`. The handle hit target is `44px` and starts at the sheet's top edge.

`prefers-reduced-motion: reduce` sets `transition: none` on `[sheet]` and `[sheet-close]`.

## Sig `bind()`

`@citrusworx/sigjs/juice` `bind()` does not include sheet. `JuiceRuntimeName` stops at twenty-eight names, through `table`. Passing `"sheet"` is not a supported name. This runtime does not call `bind`, and Juice does not import Sig.

`juice:change` and `getState()` still work without Sig. Listen on the overlay, or call `getState()` on the controller.

## Not to be confused with

| This | Not this |
| --- | --- |
| Bottom-anchored dialog with detents | Edge-docked drawer, or a centered modal |
| `[sheet-overlay]` scrim | Surface `overlay="frost"` or `overlay="tint"` |
| `[detent]` height | `[drawer-size]` width |

## Related

- [Sheet chrome](./juice-sheet.md)
- [Drawer runtime](./juice-drawer-runtime.md)
- [Modal runtime](./juice-modal-runtime.md)
- [Keyboard avoider](./juice-keyboard-avoider-runtime.md)
- [Runtime behavior](./juice-runtime-behavior.md)
- [Attributes](./juice-attributes.md)
