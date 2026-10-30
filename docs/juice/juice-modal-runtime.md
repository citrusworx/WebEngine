# Modal

A modal is a centered dialog rooted at `[modal-overlay]`.

Emerging. Shipped in `@citrusworx/juiceui@0.9.2`.

Importing `@citrusworx/juiceui` enhances valid markup through [Automatic behavior](./juice-runtime-behavior.md#automatic-behavior).

## Markup

```html
<div modal-overlay id="demo-modal" hidden>
  <div modal role="dialog" aria-modal="true" aria-labelledby="demo-title">
    <button type="button" modal-close aria-label="Close">×</button>
    <div modal-header><h2 id="demo-title">Account</h2></div>
    <div modal-body>…</div>
  </div>
</div>
<button type="button" aria-controls="demo-modal">Open</button>
```

Closed vs open is the native `hidden` attribute on `[modal-overlay]`.

## Attributes

| Hook | What it does |
| --- | --- |
| `[modal-overlay]` | Root scrim whose open and closed state is native `hidden`. |
| `[modal]` | Dialog panel inside the overlay. |
| `[modal-header]` | Header slot whose heading supplies the accessible name when `aria-labelledby` is missing. |
| `[modal-body]` | Body slot for dialog content. |
| `[modal-close]` | Dismiss control inside the overlay, with an empty name filled as `aria-label="Close"`. |
| `hidden` | Native closed state on `[modal-overlay]`. |
| `aria-controls` | Pairs an opener whose token list includes the overlay `id`, with no extra opener attribute. |
| `modal-overlay="static"` | Opts out of backdrop dismiss while Escape and `[modal-close]` still close. |
| `role="dialog"` | Dialog role on `[modal]`, set by the runtime when missing. |
| `aria-modal="true"` | Marks the dialog modal, and the runtime sets it when missing. |
| `aria-labelledby` | Names the dialog from the header heading when neither this nor `aria-label` is set. |
| `aria-expanded` | Opener open state, kept in sync by the runtime. |
| `aria-haspopup="dialog"` | Opener popup hint, set by the runtime when missing. |
| `name`, `id` | Overlay `name` or `id` is the slug for generated ids, and a missing overlay id becomes `${slug}-overlay`. |
| `--juice-modal-*` | Theme paint roles for modal chrome. |

## JavaScript

| Export | What it does |
| --- | --- |
| `createModal(options?)` | Controller for `options.root`, or the document. |
| `initModal(options?)` | Same call as `createModal`. |
| `startModalRuntime()` | Document controller. A second call syncs and returns it. Returns `null` when there is no document. |
| `stopModalRuntime()` | Destroys that controller and cancels a deferred boot. |

A custom-root controller can run beside the document runtime; each click or key is claimed once.

### Options

| Option | Default | Notes |
| --- | --- | --- |
| `root` | `document` | Node to search. |
| `overlaySelector` | `[modal-overlay]` | Overlay query. |
| `dialogSelector` | `[modal]` | Dialog query. |
| `closeSelector` | `[modal-close]` | Close control query. |
| `closeOnBackdrop` | `true` | Backdrop click closes, and `false` matches `modal-overlay="static"`. |

### Controller

| Method | What it does |
| --- | --- |
| `destroy()` | Disconnects this controller. |
| `sync()` | Wires ids, ARIA, and openers for overlays in the root. |
| `open(target?)` | Opens the overlay: removes `hidden`, then plays, and closes any other open overlay. |
| `close(target?)` | Plays the exit, then sets `hidden` and restores focus to the opener. |
| `toggle(target?)` | Opens a closed overlay or closes an open one. |
| `isOpen(target?)` | Reads whether the overlay is open. |
| `getState(target?)` | Reads `{ open: boolean }` for that overlay. |

### Events

A real open or close dispatches a bubbling [juice:change](./juice-runtime-behavior.md#juicechange) from `[modal-overlay]` with `detail` `{ runtime: "modal", state: { open: boolean } }`.

`isOpen()` and `getState()` read that state.

An unchanged `open` write does not dispatch, and this surface stays Emerging.

## Accessibility

- Escape closes the open overlay and returns focus to the opener; modal shares the highest band with drawer, and popover, combobox, toast, and tooltip yield. [Escape and layering](./juice-runtime-behavior.md#escape--layering).
- Tab and Shift+Tab wrap inside the open dialog.
- Enter and Space activate non-button openers and `[modal-close]` controls.
- Prefer `role="dialog"`, `aria-modal="true"`, and a labelled heading, which the runtime fills along with opener `aria-expanded`, `aria-haspopup="dialog"`, and an empty close name `aria-label="Close"`.
- Overlay chrome is `z-index: 1000`. [Z-index bands](./juice-runtime-behavior.md#z-index-bands).
- Arrow-key roving is out of scope.

## Behavior

1. Find `[modal-overlay]` roots and pair openers whose `aria-controls` token list includes that overlay `id`.
2. Resolve the dialog as `[modal]`, then `[role="dialog"]`, then the overlay's first element child.
3. Fill missing overlay, dialog, and title ids, plus `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` from the header heading.
4. Fill opener `aria-expanded` and `aria-haspopup="dialog"`, and an empty `[modal-close]` name (`aria-label="Close"`).
5. Enter removes native `hidden`, then plays; exit plays first, and `hidden` is set only after it finishes, while opening one overlay closes any other open overlay.
6. Trap focus and honor Escape while the overlay is open, including during exit, and restore focus to the opener after `hidden` is set.
7. Handle opener, close, and backdrop clicks, plus Escape, the Tab trap, and Enter or Space on non-button openers and closes.

- Orphan `aria-controls` that do not target a `[modal-overlay]` are ignored.
- A `name` or `id` on `[modal-overlay]` is the slug for generated ids (`seats-modal-dialog`, `seats-modal-title`), and a missing overlay id is `${slug}-overlay`.
- Opening is exclusive among modals.
- Modal and drawer stay independently exclusive: both may be open, and one Escape then closes both.
- Overlays use native `hidden`, never layout `content="active"` or `content="hidden"`.
- Clicks on the dialog panel never close.
- `modal-overlay="static"`, or `closeOnBackdrop: false`, opts out of backdrop click only; Escape and `[modal-close]` still dismiss.
- There is no `Modal()` factory.

### Motion

Enter removes `hidden` on `[modal-overlay]`, moves focus in, then sets `data-motion-state="entering"`. The scrim fades in and the panel rises from `translateY(0.75rem)` on `--juice-motion-duration-base` and `--juice-motion-ease-enter`. The state becomes `entered` when that finishes.

Exit sets `data-motion-state="exiting"` before `hidden`. The scrim fades out and the panel drops to `translateY(0.75rem)` on `--juice-motion-duration-fast` and `--juice-motion-ease-exit`. `hidden` is set only after the exit finishes (`exited`), and focus restores to the opener then.

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
| Centered dialog on `[modal-overlay]` | Surface `overlay="frost"` or `overlay="tint"` |
| Modal scrim and focus trap | Drawer or sheet |

## Related

- [Attributes](./juice-attributes.md)
- [Theme contract](./juice-theme-contract.md)
- [Runtime behavior](./juice-runtime-behavior.md)
- [Drawer Runtime](./juice-drawer-runtime.md)
