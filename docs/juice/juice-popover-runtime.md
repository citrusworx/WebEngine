# Popover

A popover is an anchored panel rooted at `[popover-root]`.

Emerging. Shipped in `@citrusworx/juiceui@0.9.2`.

Importing `@citrusworx/juiceui` enhances valid markup through [Automatic behavior](./juice-runtime-behavior.md#automatic-behavior).

## Markup

```html
<button type="button" aria-controls="demo-pop">Open help</button>
<div popover-root id="demo-pop" hidden>
  <div popover-panel role="dialog">
    <button type="button" popover-close aria-label="Close">×</button>
    <div popover-header><h2>Help</h2></div>
    <div popover-body>Account details live on this page.</div>
  </div>
</div>
```

Closed vs open is the native `hidden` attribute on `[popover-root]`. The floating surface is `[popover-panel]`.

## Attributes

| Hook | What it does |
| --- | --- |
| `[popover-root]` | Anchored wrapper with values `bottom`, `top`, `left`, `right`, defaulting to `bottom` when bare. |
| `[popover-panel]` | Floating surface inside the root. |
| `[popover-header]` | Header slot whose heading supplies the accessible name when `aria-labelledby` is missing. |
| `[popover-body]` | Body slot for panel content. |
| `[popover-close]` | Dismiss control inside the root, with an empty name filled as `aria-label="Close"`. |
| `hidden` | Native closed state on `[popover-root]`. |
| `aria-controls` | Pairs an opener whose token list includes the root `id`, with no extra opener attribute. |
| `role="dialog"` | Dialog role on `[popover-panel]`, set by the runtime when missing. |
| `aria-modal` | Not set by the runtime, though authors may set it, because the background stays interactive. |
| `aria-labelledby` | Names the panel from the header heading when neither this nor `aria-label` is set. |
| `aria-expanded` | Opener open state, kept in sync by the runtime. |
| `aria-haspopup="dialog"` | Opener popup hint, set by the runtime when missing. |
| `popover` | Bare `popover`, including `popover=""` and `popover="manual"`, starts the native Popover API. |
| `name`, `id` | Root `name` or `id` is the slug for generated ids, and a missing root id becomes `${slug}-root`. |
| `--juice-popover-*` | Theme paint roles for popover chrome. |

## JavaScript

| Export | What it does |
| --- | --- |
| `createPopover(options?)` | Controller for `options.root`, or the document. |
| `initPopover(options?)` | Same call as `createPopover`. |
| `startPopoverRuntime()` | Document controller. A second call syncs and returns it. Returns `null` when there is no document. |
| `stopPopoverRuntime()` | Destroys that controller and cancels a deferred boot. |

A custom-root controller can run beside the document runtime; each click or key is claimed once.

### Options

| Option | Default | Notes |
| --- | --- | --- |
| `root` | `document` | Node to search. |
| `rootSelector` | `[popover-root]` | Root query. |
| `panelSelector` | `[popover-panel]` | Panel query. |
| `closeSelector` | `[popover-close]` | Close control query. |
| `gap` | `8` | Pixels between the opener and the root. |

### Controller

| Method | What it does |
| --- | --- |
| `destroy()` | Disconnects this controller. |
| `sync()` | Wires ids, ARIA, and openers, and places any already-open root. |
| `open(target?)` | Opens the root: removes `hidden`, places the panel, moves focus in, then plays, and closes any other open popover. |
| `close(target?)` | Plays the exit, then sets `hidden`, clears placement, and restores focus. |
| `toggle(target?)` | Opens a closed root or closes an open one. |
| `isOpen(target?)` | Reads whether the root is open. |
| `getState(target?)` | Reads `{ open: boolean }` for that root. |

### Events

A real open or close dispatches a bubbling [juice:change](./juice-runtime-behavior.md#juicechange) from `[popover-root]` with `detail` `{ runtime: "popover", state: { open: boolean } }`.

`isOpen()` and `getState()` read that state.

An unchanged `open` write does not dispatch, and this surface stays Emerging.

## Accessibility

- Escape closes the open popover and returns focus to the opener only when no `[modal-overlay]` or `[drawer-overlay]` is open; menu shares that band, and combobox, toast, and tooltip yield. [Escape and layering](./juice-runtime-behavior.md#escape--layering).
- Tab and Shift+Tab wrap inside the open panel, and the background is not inert.
- Enter and Space activate non-button openers and `[popover-close]` controls.
- Prefer `role="dialog"` and a labelled heading, which the runtime fills along with opener `aria-expanded`, `aria-haspopup="dialog"`, and an empty close name `aria-label="Close"`, without setting `aria-modal`.
- `[popover-root]` is `z-index: 1050`, above modal and drawer `1000` and below toast `1100`. [Z-index bands](./juice-runtime-behavior.md#z-index-bands).
- Arrow-key roving is out of scope, because this is not `role="menu"`.

## Behavior

1. Find `[popover-root]` roots and pair openers whose `aria-controls` token list includes that root `id`.
2. Resolve the panel as `[popover-panel]`, then `[role="dialog"]`, then the root's first element child.
3. Fill missing root, panel, and title ids, plus `role="dialog"` and `aria-labelledby` from the header heading, and do not set `aria-modal`.
4. Fill opener `aria-expanded` and `aria-haspopup="dialog"`, and an empty `[popover-close]` name (`aria-label="Close"`).
5. Enter removes native `hidden`, places the panel, then plays; exit plays first, and `hidden` plus placement cleanup run only after it finishes, while opening one managed popover closes any other open popover.
6. On open, focus moves to `[autofocus]`, else the first focusable, else `tabindex="-1"` on the panel; Tab and Escape apply while open, including during exit, and focus returns to the opener after `hidden` is set.
7. Place the root with `position: fixed` from the opener's `getBoundingClientRect` plus an 8px gap, flip once if the preferred side overflows, and reposition on open, window resize, and capture scroll.
8. Handle opener toggle, close, and outside clicks, plus Escape, the Tab trap, and Enter or Space on non-button openers and closes.

- Orphan `aria-controls` that do not target a `[popover-root]` are ignored.
- A `name` or `id` on `[popover-root]` is the slug for generated ids (`help-panel`, `help-title`), and a missing root id is `${slug}-root`.
- Opening is exclusive among popovers, so only one managed popover is open at a time.
- This runtime does not close a modal, drawer, or toast, and those runtimes do not close a popover.
- Roots use native `hidden`, never layout `content="active"` or `content="hidden"`.
- Clicks inside the root stay open; a click outside the open root and outside its opener closes.
- The floating surface is `[popover-panel]`; a bare `popover` attribute starts the native Popover API.
- The panel is a non-modal dialog: `role="dialog"` without `aria-modal`, and the background stays interactive.
- Placement has no Floating UI.
- There is no `Popover()` factory.

### Placement

Placement reads `[popover-root="top|bottom|left|right"]` (default `bottom`) and sets the root to `position: fixed` from the opener's `getBoundingClientRect`. The gap is `8` unless `createPopover({ gap })` overrides it.

`fixed` uses viewport coordinates and needs no scroll offset. If the preferred side overflows that axis, the runtime flips once (`bottom` with `top`, `left` with `right`), does not shift or resize, and repositions open roots on window resize and capture-phase scroll with `requestAnimationFrame`.

### Motion

Enter removes `hidden` on `[popover-root]`, places the panel, moves focus in, then sets `data-motion-state="entering"`. The root fades in. Enter uses `--juice-motion-duration-base` and `--juice-motion-ease-enter`.

The panel shifts `0.5rem` from the trigger side. `bottom` and the default use `translateY(-0.5rem)`, and `top` uses `translateY(0.5rem)`. `left` uses `translateX(0.5rem)`, and `right` uses `translateX(-0.5rem)`.

Exit sets `data-motion-state="exiting"` before `hidden`. The root fades out and the panel shifts back toward the trigger on `--juice-motion-duration-fast` and `--juice-motion-ease-exit`. `hidden`, placement cleanup, and focus restore run only after the exit finishes (`exited`).

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
| Anchored panel `[popover-panel]` | A bare `popover` attribute |
| Non-modal dialog beside its opener | Modal, drawer, or toast |
| `[popover-root]` positioning wrapper | Surface `overlay="frost"` or `overlay="tint"` |

## Related

- [Attributes](./juice-attributes.md)
- [Theme contract](./juice-theme-contract.md)
- [Runtime behavior](./juice-runtime-behavior.md)
- [Modal Runtime](./juice-modal-runtime.md)
- [Drawer Runtime](./juice-drawer-runtime.md)
- [Toast Runtime](./juice-toast-runtime.md)
