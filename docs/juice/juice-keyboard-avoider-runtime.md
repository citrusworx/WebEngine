# Keyboard avoider

Keyboard avoider pads or shifts a host at `[keyboard-avoider]` when the on-screen keyboard covers the page.

Emerging. The thirty-first runtime. On master. Not in the published `@citrusworx/juiceui@0.9.2` release.

`createKeyboardAvoider`, `initKeyboardAvoider`, `startKeyboardAvoiderRuntime`, and `stopKeyboardAvoiderRuntime` are not in that npm cut. `@citrusworx/sigjs/juice` `bind` does not name `keyboard-avoider`. It is not a `JuiceRuntimeName`.

Importing `@citrusworx/juiceui` enhances valid markup on master. [Automatic behavior](./juice-runtime-behavior.md#automatic-behavior). The published 0.9.2 package does not include this runtime.

## Markup

```html
<div keyboard-avoider>
  <input id="field">
</div>

<div keyboard-avoider="footer noscroll"></div>
```

Words compose. Any unknown value is still a host. CSS ignores `noscroll`.

## Attributes

| Hook | What it does |
| --- | --- |
| `[keyboard-avoider]` | Host. Boolean and any other value use padding mode. |
| `[keyboard-avoider~="padding"]` | Padding mode. Same as a boolean host. |
| `[keyboard-avoider~="translate"]` | `translateY` by the inset. |
| `[keyboard-avoider~="footer"]` | Sticky host. Bottom is the inset. |
| `[keyboard-avoider~="noscroll"]` | This runtime does not `scrollIntoView` a focus inside that host. |
| `[keyboard-open]` | Set on `<html>` and on each host while the keyboard is open. |
| `--juice-keyboard-inset` | Written on `<html>` as `<n>px` while open, then removed. Hosts inherit it. |

A closed keyboard must not leave an inline length. An inline value would beat the `0px` role on `:root` and the `env(keyboard-inset-height)` fallback.

## JavaScript

| Export | What it does |
| --- | --- |
| `createKeyboardAvoider(options?)` | Controller for `options.root`, or the document. |
| `initKeyboardAvoider(options?)` | Same call as `createKeyboardAvoider`. |
| `startKeyboardAvoiderRuntime()` | Document controller. A second call syncs and returns it. Returns `null` when there is no document. |
| `stopKeyboardAvoiderRuntime()` | Destroys that controller and cancels a deferred boot. |

No `window`, or no `visualViewport`, is a no-op. `getState()` then returns `{ open: false, inset: 0 }`.

### Options

| Option | Default | Notes |
| --- | --- | --- |
| `root` | `document` | Node to search. |
| `keyboardAvoiderSelector` | `[keyboard-avoider]` | Host query. |
| `threshold` | `80` | Pixels. A non-finite or negative value falls back to `80`. |
| `scrollIntoView` | `true` | Set `false` to skip scrolling a focused element into view. |

### Controller

| Method | What it does |
| --- | --- |
| `destroy()` | Removes listeners and cancels a pending scroll. |
| `sync()` | Reads the viewport and updates hosts. |
| `getState(target?)` | Returns `{ open: boolean, inset: number }`, or `null`. |

`getState().inset` is the measured overlap. Only the custom property is cleared when the keyboard closes.

### Events

A change dispatches a bubbling [juice:change](./juice-runtime-behavior.md#juicechange) from each host. `detail` is `{ runtime: "keyboard-avoider", state: { open, inset } }`.

The first observation is silent. Later events fire when `open` flips, or when `inset` has moved by at least `threshold` pixels from the last published inset while open.

Smaller steps still update the custom property and `getState()`. They accumulate, so a slow drift still publishes once it is stale by `threshold`. This surface stays Emerging and is on master, unreleased after 0.9.2.

## Accessibility

- The runtime does not trap focus and does not listen for Escape. [Escape and layering](./juice-runtime-behavior.md#escape--layering).
- There is no overlay z-index. [Z-index bands](./juice-runtime-behavior.md#z-index-bands).
- Scroll uses `element.scrollIntoView({ block: "nearest" })`. Behavior is `auto` when reduced motion is set, and `smooth` otherwise.

## Behavior

The overlap is `max(0, round(innerHeight - (visualViewport.height + visualViewport.offsetTop)))`. iOS reports part of that overlap as `offsetTop`. Leaving it out counts the keyboard twice.

`open` is inset greater than `threshold` and an editable element has focus. A hardware keyboard does not shrink the visual viewport, so a focused field stays closed.

| Editable | Not editable here |
| --- | --- |
| Text-like input: missing type, empty type, text, email, password, search, tel, url, number | Checkbox, radio, range, date, and button inputs |
| `textarea`, `select` | |
| `[contenteditable]`, including a focused descendant (`""`, `true`, or `plaintext-only`) | |

Chrome Android with `interactive-widget=resizes-content` shrinks `innerHeight` with the keyboard, so the formula is about `0` and this runtime does not pad on top of the layout viewport.

Pinch zoom (`visualViewport.scale` other than `1`) skips the update and leaves the previous inset.

Listeners are `visualViewport` `resize` and `scroll`, `window` `resize` and `orientationchange`, and `focusin` / `focusout` on the root. Updates coalesce on the next animation frame. This runtime does not set `navigator.virtualKeyboard.overlaysContent`.

### Scroll into view

Scroll into view is on by default. `focusin` inside a host remembers the focused element.

The scroll runs two frames after geometry events go quiet, so a resize burst settles before the element moves. A focus that never resizes still scrolls on that quiet window.

`[keyboard-avoider~="noscroll"]` or `scrollIntoView: false` opts out. `destroy()` cancels a pending scroll.

There is no `KeyboardAvoider()` factory.

Later DOM changes schedule `sync()` on the next animation frame. [Sync](./juice-runtime-behavior.md#sync).

## Not to be confused with

| This | Not this |
| --- | --- |
| Inset while the software keyboard is open | Safe area, which pads the notch and home indicator |
| Padding, translate, or a sticky footer | A dialog or layered overlay |

## Related

- [Safe area](./juice-safe-area.md)
- [Runtime behavior](./juice-runtime-behavior.md)
- [Attributes](./juice-attributes.md)
