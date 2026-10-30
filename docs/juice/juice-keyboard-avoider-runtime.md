# Keyboard avoider

Keyboard avoider pads or shifts a host at `[keyboard-avoider]` when the on-screen keyboard covers the page.

Emerging. The thirty-first runtime. On master. Not in the published `@citrusworx/juiceui@0.9.2` release.

`createKeyboardAvoider`, `initKeyboardAvoider`, `startKeyboardAvoiderRuntime`, and `stopKeyboardAvoiderRuntime` are not in that npm cut. `@citrusworx/sigjs/juice` `bind` does not name `keyboard-avoider`. It is not a `JuiceRuntimeName`.

Importing `@citrusworx/juiceui` enhances valid markup on master. [Automatic behavior](./juice-runtime-behavior.md#automatic-behavior). The published 0.9.2 package does not include this runtime.

The layout contract, Safe Area composition, and examples are in [Keyboard avoider layout](./juice-keyboard-avoider.md). The stylesheet works without the runtime: the inset role stays `0px`, and Chromium can use `env(keyboard-inset-height)`.

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

`getState().inset` is the measured overlap and can stay non-zero after blur. Only the custom property is cleared when the keyboard closes. Open is page-wide. Scroll runs only for a focus inside a host.

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
| Text-like input, same set as Input: missing type, empty type, text, email, password, search, tel, url, number | Every other input type: checkbox, radio, range, date, time, datetime-local, month, week, color, file, hidden, button, submit, reset, image |
| `textarea`, `select` | A `<button>` |
| `[contenteditable]`, including a focused descendant (`""`, `true`, or `plaintext-only`) | `contenteditable="false"` |

Chrome Android with `interactive-widget=resizes-content` shrinks `innerHeight` with the keyboard, so the formula is about `0` and this runtime does not pad on top of the layout viewport.

Pinch zoom (`visualViewport.scale` other than `1`) skips the update and leaves the previous inset.

Listeners are `visualViewport` `resize` and `scroll`, `window` `resize` and `orientationchange`, and `focusin` / `focusout` on the root. Updates coalesce on the next animation frame. This runtime does not set `navigator.virtualKeyboard.overlaysContent`.

### Scroll into view

Scroll into view is on by default. `focusin` inside a host remembers the focused element.

The scroll runs two frames after geometry events go quiet, so a resize burst settles before the element moves. A focus that never resizes still scrolls on that quiet window.

`[keyboard-avoider~="noscroll"]` or `scrollIntoView: false` opts out. `destroy()` cancels a pending scroll.

There is no `KeyboardAvoider()` factory.

There is no `MutationObserver`. Call `sync()` when a host is added and no geometry or focus event will follow. The first time that host is seen, `juice:change` is silent.

## CSS

Roles stay on `:root`. They are not restated on `[theme]`.

| Role | Default |
| --- | --- |
| `--juice-keyboard-inset` | `0px`. Registered `<length>`. |
| `--juice-keyboard-duration` | `var(--juice-motion-duration-base)` |
| `--juice-keyboard-easing` | `var(--juice-motion-ease-enter)` |

Padding mode sets `padding-bottom` and `box-sizing: border-box`. It does not transition. Translate mode uses `translateY(calc(-1 * var(--juice-keyboard-inset)))`. Footer mode is `position: sticky` with `bottom` set to the inset.

`@supports (height: env(keyboard-inset-height))` sets the inset to `env(keyboard-inset-height, 0px)`. The query omits the fallback, so only Chromium's Virtual Keyboard variable matches. An inline length on `<html>` beats that fallback while open.

`prefers-reduced-motion: reduce` sets `transition: none` on translate mode only.

## Safe area

Padding mode on a bare `[safe-area]`, `[safe-area="bottom"]`, or `[safe-area="y"]` host uses one `max()`, not a sum:

```css
padding-bottom: max(var(--juice-safe-area-pad), env(safe-area-inset-bottom, 0px), var(--juice-keyboard-inset));
```

Translate-only and footer-only hosts keep Safe Area's own padding. A padding word composed with translate or footer still takes the max.

## Viewport

`interactive-widget=resizes-content` on the viewport meta tag is an alternative on Chrome Android 108+. The layout viewport shrinks, the inset formula is about `0`, and this host is unnecessary there. iOS and Chrome Android's default (`resizes-visual`) do not shrink the layout viewport.

## Footer, fixed nav, and drawer

Do not put footer mode on `nav[fixed]`. `position: fixed` and `top: 0` stay, and `bottom` becomes the inset, so the bar stretches. A separate fix is planned.

Footer mode on `[drawer]` replaces the drawer's `position` and `bottom`. Put padding mode on the scrolling body inside the drawer.

## Examples

Scrolling form.

```html
<form keyboard-avoider>
  <label>Name <input name="name"></label>
</form>
```

Chat composer.

```html
<div keyboard-avoider="translate">
  <input name="message">
</div>
```

Sticky action bar, with Safe Area. The footer keeps Safe Area's padding. The form takes the `max()`.

```html
<div safe-area="bottom" keyboard-avoider>
  <textarea></textarea>
</div>
<footer safe-area="bottom" keyboard-avoider="footer">
  <button type="button">Done</button>
</footer>
```

## Not to be confused with

| This | Not this |
| --- | --- |
| Inset while the software keyboard is open | Safe area, which pads the notch and home indicator |
| Padding, translate, or a sticky footer | A dialog or layered overlay |

## Related

- [Safe area](./juice-safe-area.md)
- [Runtime behavior](./juice-runtime-behavior.md)
- [Attributes](./juice-attributes.md)
