# Tooltip

A tooltip is a hover and focus tip rooted at `[tooltip-root]`.

Emerging. Shipped in `@citrusworx/juiceui@0.9.2`.

Importing `@citrusworx/juiceui` enhances valid markup through [Automatic behavior](./juice-runtime-behavior.md#automatic-behavior).

## Markup

```html
<button type="button" aria-describedby="demo-tip">Save</button>
<div tooltip-root id="demo-tip" hidden>
  <div tooltip-panel role="tooltip">Saves the current draft.</div>
</div>
```

Closed vs open is the native `hidden` attribute on `[tooltip-root]`. The floating surface is `[tooltip-panel]`.

## Attributes

| Hook | What it does |
| --- | --- |
| `[tooltip-root]` | Anchored wrapper with values `top`, `bottom`, `left`, `right`, defaulting to `top` when bare. |
| `[tooltip-panel]` | Floating tip inside the root. |
| `hidden` | Native closed state on `[tooltip-root]`. |
| `aria-describedby` | Preferred trigger pairing, whose token list includes the root `id`. |
| `aria-controls` | Also pairs a trigger whose token list includes the root `id`. |
| `role="tooltip"` | Tip role on `[tooltip-panel]`, set by the runtime when missing. |
| `tooltip` | Not a Juice hook; the floating surface is `[tooltip-panel]`. |
| `title` | Native HTML tooltip that this runtime does not restyle or replace. |
| `name`, `id` | Root `name` or `id` is the slug for generated ids, and a missing root id becomes `${slug}-root`. |
| `--juice-tooltip-*` | Theme paint roles for tooltip chrome. |

## JavaScript

| Export | What it does |
| --- | --- |
| `createTooltip(options?)` | Controller for `options.root`, or the document. |
| `initTooltip(options?)` | Same call as `createTooltip`. |
| `startTooltipRuntime()` | Document controller. A second call syncs and returns it. Returns `null` when there is no document. |
| `stopTooltipRuntime()` | Destroys that controller and cancels a deferred boot. |

A custom-root controller can run beside the document runtime; each pointer or key is claimed once.

### Options

| Option | Default | Notes |
| --- | --- | --- |
| `root` | `document` | Node to search. |
| `rootSelector` | `[tooltip-root]` | Root query. |
| `panelSelector` | `[tooltip-panel]` | Panel query. |
| `gap` | `8` | Pixels between the trigger and the root. |
| `hideDelay` | `150` | Milliseconds before hide after pointer leave or blur. |

### Controller

| Method | What it does |
| --- | --- |
| `destroy()` | Disconnects this controller. |
| `sync()` | Wires ids and ARIA, and places any already-open tip. |
| `show(target?)` | Removes `hidden` on `[tooltip-root]` and never moves focus into the tip. |
| `hide(target?)` | Sets `hidden` on `[tooltip-root]`. |
| `isShown(target?)` | Reads whether the tip is shown. |
| `getState(target?)` | Reads `{ shown: boolean }` for that tip. |

### Events

A real show or hide dispatches a bubbling [juice:change](./juice-runtime-behavior.md#juicechange) from `[tooltip-root]` with `detail` `{ runtime: "tooltip", state: { shown: boolean } }`.

`isShown()` and `getState()` read that state.

An unchanged `shown` write does not dispatch, and this surface stays Emerging.

## Accessibility

- Escape hides the open tip only when no `[modal-overlay]`, `[drawer-overlay]`, `[popover-root]`, `[menu-root] [menu]:not([hidden])`, or `[combobox-list]` is open, and toast does not block that Escape. [Escape and layering](./juice-runtime-behavior.md#escape--layering).
- There is no focus trap: Tab is not wrapped, and focus never moves into the tip.
- Show and hide use hover (`mouseover` / `mouseout`) and keyboard focus (`focusin` / `focusout`).
- Prefer `role="tooltip"` on the panel, which the runtime fills, along with a missing root id and a trigger `aria-describedby` that includes that id.
- `[tooltip-root]` is `z-index: 1060`, above popover `1050` and below toast `1100`. [Z-index bands](./juice-runtime-behavior.md#z-index-bands).
- Arrow-key roving is out of scope.

## Behavior

1. Find `[tooltip-root]` roots and pair triggers whose `aria-describedby` token list (preferred) or `aria-controls` token list includes that root `id`.
2. Resolve the panel as `[tooltip-panel]`, then `[role="tooltip"]`, then the root's first element child.
3. Fill a missing root id and `role="tooltip"` on the panel, and ensure the trigger `aria-describedby` token list includes that id.
4. Show on `mouseover` or `focusin` of the trigger, and hide on `mouseout` or `focusout` after a grace delay (default 150ms) so a brief leave does not flicker.
5. Opening one managed tooltip hides any other open tooltip.
6. Do not move focus into the tip or trap focus; the tip has `pointer-events: none` in chrome, so the delay is not a hover bridge onto the tip.
7. Place the root with `position: fixed` from the trigger's `getBoundingClientRect` plus an 8px gap, flip once if the preferred side overflows, and reposition on show, window resize, and capture scroll.
8. Hide the open tip on Escape, yielding to an open `[modal-overlay]`, `[drawer-overlay]`, `[popover-root]`, `[menu-root] [menu]:not([hidden])`, or `[combobox-list]`, while toast does not block that Escape.

- Orphan `aria-describedby` or `aria-controls` that do not target a `[tooltip-root]` are ignored.
- A `name` or `id` on `[tooltip-root]` is the slug for generated ids (`help-root`), and a missing root id is `${slug}-root`.
- Opening is exclusive among tooltips, so only one managed tip is open at a time.
- This runtime does not close a modal, drawer, toast, popover, or wizard, and those runtimes do not close a tooltip.
- Roots use native `hidden`, never layout `content="active"` or `content="hidden"`.
- The floating surface is `[tooltip-panel]`, and native `title` stays a platform tooltip.
- There is no interactive content, no close button, and no focus trap.
- Placement has no Floating UI.
- Touch and first-tap are later; v1 is hover and keyboard focus only.
- There is no `Tooltip()` factory.

### Placement

Placement reads `[tooltip-root="top|bottom|left|right"]` (default `top`) and sets the root to `position: fixed` from the trigger's `getBoundingClientRect`. The gap is `8` unless `createTooltip({ gap })` overrides it, and `fixed` uses viewport coordinates and needs no scroll offset.

If the preferred side overflows that axis, the runtime flips once (`top` with `bottom`, `left` with `right`) and does not shift or resize. Open tips reposition on window resize and capture-phase scroll, scheduled with `requestAnimationFrame`.

<details>
<summary>Edge cases</summary>

- If a transformed or filtered ancestor is the fixed containing block, the runtime subtracts that origin.

</details>

Later DOM changes schedule `sync()` on the next animation frame. [Sync](./juice-runtime-behavior.md#sync).

## Not to be confused with

| This | Not this |
| --- | --- |
| Hover and focus tip `[tooltip-panel]` | Native `title` |
| Non-interactive tip | Popover |
| Focus stays on the trigger | A panel that takes focus |

## Related

- [Attributes](./juice-attributes.md)
- [Theme contract](./juice-theme-contract.md)
- [Runtime behavior](./juice-runtime-behavior.md)
- [Modal Runtime](./juice-modal-runtime.md)
- [Drawer Runtime](./juice-drawer-runtime.md)
- [Toast Runtime](./juice-toast-runtime.md)
- [Popover Runtime](./juice-popover-runtime.md)
- [Wizard Runtime](./juice-wizard-runtime.md)
