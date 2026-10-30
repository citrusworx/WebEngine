# Drawer

A drawer is an edge-docked dialog rooted at `[drawer-overlay]`.

Emerging. Shipped in `@citrusworx/juiceui@0.9.2`.

Importing `@citrusworx/juiceui` enhances valid markup through [Automatic behavior](./juice-runtime-behavior.md#automatic-behavior).

## Markup

```html
<div drawer-overlay id="demo-drawer" hidden>
  <div drawer role="dialog" aria-modal="true" aria-labelledby="demo-title">
    <button type="button" drawer-close aria-label="Close">×</button>
    <div drawer-header><h2 id="demo-title">Filters</h2></div>
    <div drawer-body>…</div>
  </div>
</div>
<button type="button" aria-controls="demo-drawer">Open</button>
```

Closed vs open is the native `hidden` attribute on `[drawer-overlay]`. Edge is `left` or `right`; optional width is `drawer-size`.

## Attributes

| Hook | What it does |
| --- | --- |
| `[drawer-overlay]` | Root scrim whose open and closed state is native `hidden`. |
| `[drawer]` | Dialog panel with values `left` or `right`, docking right when bare or unspecified. |
| `[drawer-size]` | Optional width of `22rem` by default, `16rem` for `sm`, and `32rem` for `lg`, not a value of `drawer`. |
| `[drawer-header]` | Header slot whose heading supplies the accessible name when `aria-labelledby` is missing. |
| `[drawer-body]` | Body slot for drawer content. |
| `[drawer-close]` | Dismiss control inside the overlay, with an empty name filled as `aria-label="Close"`. |
| `hidden` | Native closed state on `[drawer-overlay]`. |
| `aria-controls` | Pairs an opener whose token list includes the overlay `id`, with no extra opener attribute. |
| `drawer-overlay="static"` | Opts out of backdrop dismiss while Escape and `[drawer-close]` still close. |
| `role="dialog"` | Dialog role on `[drawer]`, set by the runtime when missing. |
| `aria-modal="true"` | Marks the dialog modal, and the runtime sets it when missing. |
| `aria-labelledby` | Names the dialog from the header heading when neither this nor `aria-label` is set. |
| `aria-expanded` | Opener open state, kept in sync by the runtime. |
| `aria-haspopup="dialog"` | Opener popup hint, set by the runtime when missing. |
| `name`, `id` | Overlay `name` or `id` is the slug for generated ids, and a missing overlay id becomes `${slug}-overlay`. |
| `--juice-drawer-*` | Theme paint roles for drawer chrome. |

## JavaScript

| Export | What it does |
| --- | --- |
| `createDrawer(options?)` | Controller for `options.root`, or the document. |
| `initDrawer(options?)` | Same call as `createDrawer`. |
| `startDrawerRuntime()` | Document controller. A second call syncs and returns it. Returns `null` when there is no document. |
| `stopDrawerRuntime()` | Destroys that controller and cancels a deferred boot. |

A custom-root controller can run beside the document runtime; each click or key is claimed once.

### Options

| Option | Default | Notes |
| --- | --- | --- |
| `root` | `document` | Node to search. |
| `overlaySelector` | `[drawer-overlay]` | Overlay query. |
| `dialogSelector` | `[drawer]` | Dialog query. |
| `closeSelector` | `[drawer-close]` | Close control query. |
| `closeOnBackdrop` | `true` | Backdrop click closes, and `false` matches `drawer-overlay="static"`. |

### Controller

| Method | What it does |
| --- | --- |
| `destroy()` | Disconnects this controller. |
| `sync()` | Wires ids, ARIA, and openers for overlays in the root. |
| `open(target?)` | Opens the overlay: removes `hidden`, then plays, and closes any other open drawer overlay. |
| `close(target?)` | Plays the exit, then sets `hidden` and restores focus to the opener. |
| `toggle(target?)` | Opens a closed overlay or closes an open one. |
| `isOpen(target?)` | Reads whether the overlay is open. |
| `getState(target?)` | Reads `{ open: boolean }` for that overlay. |

### Events

A real open or close dispatches a bubbling [juice:change](./juice-runtime-behavior.md#juicechange) from `[drawer-overlay]` with `detail` `{ runtime: "drawer", state: { open: boolean } }`.

`isOpen()` and `getState()` read that state.

An unchanged `open` write does not dispatch, and this surface stays Emerging.

## Accessibility

- Escape closes the open overlay and returns focus to the opener; drawer shares the highest band with modal, and popover, combobox, toast, and tooltip yield. [Escape and layering](./juice-runtime-behavior.md#escape--layering).
- Tab and Shift+Tab wrap inside the open dialog.
- Enter and Space activate non-button openers and `[drawer-close]` controls.
- Prefer `role="dialog"`, `aria-modal="true"`, and a labelled heading, which the runtime fills along with opener `aria-expanded`, `aria-haspopup="dialog"`, and an empty close name `aria-label="Close"`.
- Overlay chrome is `z-index: 1000`. [Z-index bands](./juice-runtime-behavior.md#z-index-bands).
- Arrow-key roving is out of scope.

## Behavior

1. Find `[drawer-overlay]` roots and pair openers whose `aria-controls` token list includes that overlay `id`.
2. Resolve the dialog as `[drawer]`, then `[role="dialog"]`, then the overlay's first element child.
3. Fill missing overlay, dialog, and title ids, plus `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` from the header heading.
4. Fill opener `aria-expanded` and `aria-haspopup="dialog"`, and an empty `[drawer-close]` name (`aria-label="Close"`).
5. Enter removes native `hidden`, then plays; exit plays first, and `hidden` is set only after it finishes, while opening one overlay closes any other open drawer overlay.
6. Trap focus and honor Escape while the overlay is open, including during exit, and restore focus to the opener after `hidden` is set.
7. Handle opener, close, and backdrop clicks, plus Escape, the Tab trap, and Enter or Space on non-button openers and closes.

- Orphan `aria-controls` that do not target a `[drawer-overlay]` are ignored.
- A `name` or `id` on `[drawer-overlay]` is the slug for generated ids (`filters-drawer-dialog`, `filters-drawer-title`), and a missing overlay id is `${slug}-overlay`.
- Opening is exclusive among drawers.
- This runtime does not close a modal, and the modal runtime does not close a drawer.
- Modal and drawer may both be open; one Escape then closes both.
- Overlays use native `hidden`, never layout `content="active"` or `content="hidden"`.
- Clicks on the drawer panel never close.
- `drawer-overlay="static"`, or `closeOnBackdrop: false`, opts out of backdrop click only; Escape and `[drawer-close]` still dismiss.
- There is no `Drawer()` factory.

### Motion

Enter removes `hidden` on `[drawer-overlay]`, moves focus in, then sets `data-motion-state="entering"`. The scrim fades in on `--juice-motion-duration-base` and `--juice-motion-ease-enter`. The panel slides in from the edge: `translateX(100%)` for the default and `right`, `translateX(-100%)` for `left`.

Exit sets `data-motion-state="exiting"` before `hidden`. The scrim fades out and the panel slides back off that edge on `--juice-motion-duration-fast` and `--juice-motion-ease-exit`. `hidden` is set only after the exit finishes (`exited`), and focus restores to the opener then.

<details>
<summary>Edge cases</summary>

- The focus trap and Escape still apply during exit.
- A second Escape does not start a second close.
- Reduced motion, or a computed duration of `0`, does the same steps in the same turn.
- A new open cancels an in-flight exit.
- Duration tokens live in [Animations](./juice-animations.md).

</details>

Later DOM changes schedule `sync()` on the next animation frame. [Sync](./juice-runtime-behavior.md#sync).

## Not to be confused with

| This | Not this |
| --- | --- |
| Edge-docked dialog (`left` or `right`) | Centered modal |
| Optional `drawer-size` of `sm` or `lg` | A size value on `drawer` |
| `[drawer-overlay]` scrim | Surface `overlay="frost"` or `overlay="tint"` |

## Related

- [Attributes](./juice-attributes.md)
- [Theme contract](./juice-theme-contract.md)
- [Runtime behavior](./juice-runtime-behavior.md)
- [Modal Runtime](./juice-modal-runtime.md)
