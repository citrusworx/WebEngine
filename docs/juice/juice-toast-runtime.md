# Toast

A toast is a non-modal stack rooted at `[toast-region]`.

Emerging. Shipped in `@citrusworx/juiceui@0.9.2`.

Importing `@citrusworx/juiceui` enhances valid markup through [Automatic behavior](./juice-runtime-behavior.md#automatic-behavior).

## Markup

```html
<div toast-region>
  <div toast id="demo-toast">
    <div toast-title>Saved</div>
    <div toast-body>Your changes were written.</div>
    <button type="button" toast-close aria-label="Dismiss">×</button>
  </div>
</div>
```

Authors place `[toast-region]` in markup. Closed vs open for each `[toast]` is native `hidden`.

## Attributes

| Hook | What it does |
| --- | --- |
| `[toast-region]` | Stack root with values `top-right`, `top-left`, `bottom-right`, `bottom-left`, defaulting to `top-right` when bare. |
| `[toast]` | Snackbar with values `success`, `error`, `info`, `warning`, and neutral when bare. |
| `[toast-title]` | Optional title slot. |
| `[toast-body]` | Optional body slot. |
| `[toast-close]` | Dismiss control inside the toast, with an empty name filled as `aria-label="Dismiss"`. |
| `hidden` | Native closed state on an individual `[toast]`, while the region stays in the DOM. |
| `toast-duration` | Per-toast milliseconds, such as `3000`, otherwise `defaultDuration` of `5000`, where `0`, `Infinity`, or a negative number is sticky. |
| `toast-live` | Value `assertive` on the region or a toast opts into an assertive live region. |
| `aria-live` | Prefer `polite` in markup; the runtime fills `polite`, or `assertive` when `toast-live="assertive"`. |
| `aria-relevant` | The runtime fills `additions` on the region when it is missing. |
| `role` | `status` on the toast, or `alert` for `toast="error"` or assertive live. |
| `--juice-toast-*` | Theme paint roles for toast chrome. |

## JavaScript

| Export | What it does |
| --- | --- |
| `createToast(options?)` | Controller for `options.root`, or the document. |
| `initToast(options?)` | Same call as `createToast`. |
| `startToastRuntime()` | Document controller. A second call syncs and returns it. Returns `null` when there is no document. |
| `stopToastRuntime()` | Destroys that controller and cancels a deferred boot. |

A custom-root controller can run beside the document runtime; each click or key is claimed once.

### Options

| Option | Default | Notes |
| --- | --- | --- |
| `root` | `document` | Node to search. |
| `regionSelector` | `[toast-region]` | Region query. |
| `toastSelector` | `[toast]` | Toast query. |
| `closeSelector` | `[toast-close]` | Close control query. |
| `defaultDuration` | `5000` | Milliseconds before auto-dismiss, where `0`, `Infinity`, or a negative number is sticky. |

### Controller

| Method | What it does |
| --- | --- |
| `destroy()` | Disconnects this controller. |
| `sync()` | Wires live-region ARIA and dismiss handling for toasts in the root. |
| `show(target?)` | Removes `hidden` on a `[toast]` and never hides siblings. |
| `dismiss(target?)` | Dismisses a `[toast]`, setting `hidden` after the exit. |
| `isShown(target?)` | Reads `shown` on that toast, not the region. |
| `getState(target?)` | Reads `{ shown: boolean }` on that toast, not the region. |

### Events

A real show or dismiss dispatches a bubbling [juice:change](./juice-runtime-behavior.md#juicechange) from `[toast]` with `detail` `{ runtime: "toast", state: { shown: boolean } }`.

`isShown()` and `getState()` read that host, not the region.

An unchanged `shown` write does not dispatch, and this surface stays Emerging.

## Accessibility

- Escape dismisses the most recently shown visible toast only when no open `[modal-overlay]`, `[drawer-overlay]`, `[popover-root]`, `[menu-root] [menu]:not([hidden])`, `[combobox-list]`, or `[tooltip-root]` exists. [Escape and layering](./juice-runtime-behavior.md#escape--layering).
- An open tip hides while toasts remain, because toast does not block tooltip Escape.
- Enter and Space activate non-button `[toast-close]` controls.
- There is no focus trap: Tab is not wrapped, and show does not move focus into the toast.
- Prefer `aria-live="polite"` on the region, which the runtime fills along with toast `role="status"` or `role="alert"` and `aria-label="Dismiss"` on an empty close.
- `[toast-region]` is `z-index: 1100`. [Z-index bands](./juice-runtime-behavior.md#z-index-bands).
- Arrow-key roving is out of scope.

## Behavior

1. Find `[toast-region]` roots and `[toast]` descendants.
2. Fill missing `aria-live` (`polite`, or `assertive` when `toast-live="assertive"`) and `aria-relevant="additions"` on the region.
3. Set toast `role="status"`, or `role="alert"` for `toast="error"` or assertive live.
4. Fill an empty `[toast-close]` name (`aria-label="Dismiss"`) and button role and tabindex on non-native closes.
5. Enter removes native `hidden`, then plays; exit plays first, and `hidden` is set only after it finishes, while the region stays, `show()` never hides siblings, and show does not move focus into the toast.
6. Auto-dismiss after `defaultDuration` (`5000`) or `toast-duration`; that timer is reading time, so reduced motion does not shorten it, it pauses while pointer or focus is inside the toast, and `0`, `Infinity`, or a negative number is sticky.
7. Handle `[toast-close]` clicks, Escape for the most recently shown visible toast when no open modal or drawer overlay, popover, menu, combobox list, or tooltip exists, and Enter or Space on non-button closes.

- Orphan `[toast]` nodes that are not inside `[toast-region]` are ignored.
- Toast is not exclusive: this runtime does not close a modal or a drawer, and those dialog runtimes do not close a toast.
- Individual toasts use native `hidden`, never layout `content="active"` or `content="hidden"`, and the region stays in the DOM.
- The runtime does not invent a portal; authors place `[toast-region]` and `[toast]` nodes.
- There is no `Toast()` factory and no programmatic message factory.

### Motion

Enter removes `hidden` on `[toast]`, then sets `data-motion-state="entering"`. The toast fades and travels `0.75rem`: up for top regions (the default, `top-right`, and `top-left`), down for `bottom-right` and `bottom-left`. Enter uses `--juice-motion-duration-base` and `--juice-motion-ease-enter`.

Exit uses `--juice-motion-duration-fast` and `--juice-motion-ease-exit`, then sets `hidden`.

<details>
<summary>Edge cases</summary>

- Escape still dismisses the most recently shown visible toast while an exit has not yet set `hidden`.
- A second dismiss on a toast that is already exiting does not start a second exit.
- Showing a toast that is exiting cancels the exit and leaves it open.
- `toast-duration` and `defaultDuration` are reading time, so reduced motion does not shorten them.
- Reduced motion, or a computed duration of `0`, makes the enter and exit instant.
- Duration tokens live in [Animations](./juice-animations.md).

</details>

Later DOM changes schedule `sync()` on the next animation frame. [Sync](./juice-runtime-behavior.md#sync).

## Not to be confused with

| This | Not this |
| --- | --- |
| Non-modal stack | Dialog (no focus trap, no `aria-modal`) |
| Corner snackbar | Inline banner or callout |
| `[toast-region]` | `[modal-overlay]` or `[drawer-overlay]` |
| Region chrome | Surface `overlay="frost"` or `overlay="tint"` |

## Related

- [Attributes](./juice-attributes.md)
- [Theme contract](./juice-theme-contract.md)
- [Runtime behavior](./juice-runtime-behavior.md)
- [Modal Runtime](./juice-modal-runtime.md)
- [Drawer Runtime](./juice-drawer-runtime.md)
- [Banner Runtime](./juice-banner-runtime.md)
