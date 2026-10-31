# Juice Keyboard Avoider

This document explains the current keyboard-avoider chrome in `libraries/juice/src/components/keyboard-avoider/keyboard-avoider.scss` and the keyboard-avoider runtime in `libraries/juice/src/js/src/keyboard-avoider/keyboard-avoider-runtime.ts` (monorepo paths; outside this vault). `components.scss` forwards the stylesheet after `safe-area.scss` and before `search-panel.scss`.

Keyboard avoider is Mobile-Critical. It keeps a field, a composer, or a bottom bar clear of the software keyboard. There is no paint, so there is nothing for a theme to bind. The stylesheet does not require the runtime. A closed keyboard and a browser with no inset are the same: the role stays `0px`, and the host does not pad or shift.

The key idea is the same as navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, breadcrumb, progress, pagination, disclosure, spinner, select, input, textarea, field, icon button, avatar, table, pressable, and touchable row:

> If a user writes a valid Juice keyboard avoider and it exists in the browser, an open software keyboard should move that host by the overlap.

That is the standard. The runtime writes the overlap. The stylesheet turns that length into padding, a shift, or a sticky bottom.

## The Goal

The keyboard-avoider runtime is not a framework adapter and not a second component API.

It is a browser-side Juice feature that works regardless of how the markup got into the DOM.

That means it should work for:

- raw HTML pages
- Twig or other server-rendered templates
- Sig-rendered DOM
- React-rendered DOM
- any other environment that eventually produces browser DOM

The user should not need to manually initialize keyboard avoider in their app code.

There is no `KeyboardAvoider()` Sig factory. Markup plus the runtime is the contract. `@citrusworx/sigjs/juice` `bind()` does not name keyboard-avoider, pressable, touchable-row, or sheet yet. There is no `JuiceRuntimeName` for any of those four. `JuiceRuntimeName` stops at twenty-eight names, through `table`.

This surface is Emerging, not Stable. Valid markup should lay out from core CSS, and an open keyboard should set the inset after importing the JS entry, but the API is still likely to evolve.

Keyboard avoider is layout. It is not a dialog, not a focus trap, and not a restyle of input, textarea, or select. It does not own Enter, Space, or Escape.

Keyboard avoider is the thirty-first Emerging auto-enhance runtime. `@citrusworx/juiceui@0.9.5` is the live npm cut (published 2026-10-30 15:11 UTC). `@citrusworx/juiceui@0.9.0` shipped eighteen (navigation through progress). `@citrusworx/juiceui@0.9.1` added pagination, the nineteenth. Disclosure is the twentieth. Spinner is the twenty-first. Select is the twenty-second. Input is the twenty-third. Textarea is the twenty-fourth. Field is the twenty-fifth. Disclosure, spinner, select, input, textarea, field, and motion core shipped in 0.9.2. Icon button is the twenty-sixth, avatar is the twenty-seventh, and table is the twenty-eighth; those three shipped in 0.9.3. Pressable (chrome in #299 and #301, runtime in #303) is the twenty-ninth and shipped in 0.9.4. Touchable row (chrome in #306, runtime in #308) is the thirtieth and shipped in 0.9.4. Keyboard avoider (chrome in #310, runtime in #311) shipped in 0.9.5. Sheet (chrome in #316, runtime in #317) is the thirty-second, on master, and not in the 0.9.5 npm cut. All thirty-two stay Emerging.

## When to use it

Use `[keyboard-avoider]` when a software keyboard covers the page and something at the bottom has to stay reachable: the last field in a scrolling form, a chat composer, or a sticky action bar.

iOS, and Chrome Android's default (`interactive-widget` of `resizes-visual`), do not shrink the layout viewport. The keyboard covers the page. The inset is that overlap. This host is for that case.

Chrome Android 108+ can shrink the layout viewport instead. Put `interactive-widget=resizes-content` on the viewport meta tag and this host is unnecessary there. See [Viewport](#viewport).

Do not use it for a hardware keyboard. A hardware keyboard does not shrink the visual viewport, so a focused field stays closed. See [Platforms](#platforms).

Use [Safe Area](./juice-safe-area.md) for the notch and the home indicator. Keyboard avoider composes with that padding in padding mode. It does not replace `[safe-area]`.

## Markup

There is no HTML global `keyboard-avoider` attribute, and there is no `<keyboard-avoider>` element. `[keyboard-avoider]` is an attribute selector. One attribute. Words compose with `~=`, the same shape as `[touchable-row~="dense"]`. Boolean `[keyboard-avoider]` is padding mode, the same way boolean `[safe-area]` is all four edges.

```html
<div keyboard-avoider>
  <label>Name <input name="name"></label>
</div>

<div keyboard-avoider="padding">
  <textarea name="note"></textarea>
</div>

<form keyboard-avoider="translate">
  <input name="message" input>
</form>

<div keyboard-avoider="footer">
  <button type="button">Send</button>
</div>

<div keyboard-avoider="footer noscroll">
  <input name="quiet">
</div>
```

| Attribute | What it is |
|---|---|
| `[keyboard-avoider]` | Host. Padding mode. Any unknown value, including an empty value, is still padding mode. |
| `[keyboard-avoider="padding"]` | Padding mode. Matches `~=`. |
| `[keyboard-avoider~="translate"]` | `translateY` by the inset. A floating composer or toolbar. |
| `[keyboard-avoider~="footer"]` | `position: sticky`. `bottom` is the inset. A bottom-pinned action bar. |
| `[keyboard-avoider~="noscroll"]` | Runtime word. This runtime does not `scrollIntoView` a focus inside that host. Not a layout mode. CSS ignores it. |
| `[keyboard-open]` | Set on `<html>` and on each host while the keyboard is open. The stylesheet does not select it. The inset is the layout input. |

The boolean rule does not match a host that already carries `padding`, `translate`, or `footer`. A bare `[keyboard-avoider]` would otherwise pad every valued host, and the word would only add to that. `"padding translate"` matches both words and not the bare chain. `"noscroll"` alone is not one of those three words, so `[keyboard-avoider="noscroll"]` is padding mode and does not scroll. `[keyboard-avoider="footer noscroll"]` is footer mode and does not scroll.

`[keyboard-open]` is a boolean attribute (the value is the empty string). A missing attribute and a closed keyboard look the same in CSS, because this file does not select `[keyboard-open]`.

Core CSS does not give `[keyboard-avoider]` a z-index. See [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands).

## Roles

Layout roles, on `:root` only. They are not color roles, so they are not restated on `[theme]`. A custom property set on `[theme]` would re-resolve on the themed element. These lengths and timings do not depend on the theme. Shipped library themes and generated `--jx-*` themes are not required to bind them. Do not add a keyboard hue family. Do not put these roles on `[theme]`.

| Role | Where | Default |
|---|---|---|
| `--juice-keyboard-inset` | `:root` only | `0px`. Registered `<length>` (`@property`, `inherits: true`, initial value `0px`). |
| `--juice-keyboard-duration` | `:root` only | `var(--juice-motion-duration-base)` (`0.3s`) |
| `--juice-keyboard-easing` | `:root` only | `var(--juice-motion-ease-enter)` (`ease-out`) |

`--juice-keyboard-inset` is registered so `translateY` can interpolate when the variable changes. `inherits` is true so a value written on `<html>` reaches the host. The initial value is `0px`. `:root` also sets the custom property to `0px`, so a closed keyboard and a browser with no inset are the same: no extra pad, no shift.

Duration and easing point at the motion scale. Base (`0.3s`) is the entrance used by drawer, modal, popover, and toast. Enter (`ease-out`) is the curve that settles a panel into place. Fast (`0.2s`) and standard (`ease`) are the press and color timings, and they are shorter than a keyboard. One easing role covers both directions.

The runtime writes `--juice-keyboard-inset` on `<html>` while the keyboard is open, as `<n>px`. An inline value beats both the `0px` role and the `@supports` override below. While the keyboard is closed the runtime removes that inline property. It does not write `0px`. An inline `0px` would hide the `env()` fallback. `getState().inset` is still the measured overlap. Only the custom property is cleared. See [Inset and open](#inset-and-open).

See the [Theme Contract](./juice-theme-contract.md) and [Attributes](./juice-attributes.md).

## Modes

Padding mode sets the `padding-bottom` longhand to the inset, so a scroll container can reach its last field. It does not set the padding shorthand. A lower-specificity shorthand on the same element keeps the edges this mode does not set. `box-sizing` is `border-box` so the pad stays inside a `width: 100%` host. There is no transition on the padding. Reflow is the point. Translate mode is the one that moves.

```css
padding-bottom: var(--juice-keyboard-inset);
box-sizing: border-box;
```

Translate mode is for a floating composer or toolbar:

```css
transform: translateY(calc(-1 * var(--juice-keyboard-inset)));
transition: transform var(--juice-keyboard-duration) var(--juice-keyboard-easing);
```

The transition uses `--juice-keyboard-duration` and `--juice-keyboard-easing`. It replaces a lower-specificity `transition` on that host. It does not set padding.

Footer mode is the bottom-pinned action bar. It is the only mode that sets `position`:

```css
position: sticky;
bottom: var(--juice-keyboard-inset);
```

It does not set `top`, so a bar that already has `top: 0` keeps that top. See [Footer, fixed nav, and drawer](#footer-fixed-nav-and-drawer).

There is no margin mode. No z-index. No width, height, display, or `inset` shorthand. `nav[fixed]`, `nav[sticky]`, `[drawer]`, and `[wizard-header]` keep the boxes they already set, except the footer tie with `[drawer]` below.

A padding word composed with `translate` or `footer` still takes padding, because the author asked for the padding. Translate still shifts. Footer still sticks. Those are two moves. Use one layout word unless both are meant.

### Specificity

The boolean padding chain is `[keyboard-avoider]` plus three `:not([keyboard-avoider~="…"])` selectors, `(0, 4, 0)`. `[theme]` plus that chain is `(0, 5, 0)`. Each `:not()` counts as one attribute. A word (`[keyboard-avoider~="padding"]`, and the same for `translate` and `footer`) stays `(0, 1, 0)`. `[theme] [keyboard-avoider~="padding"]` stays `(0, 2, 0)`.

`nav > [container]` sets `padding: 0` at `(0, 1, 1)`. That loses to the bare chain `(0, 4, 0)`. It beats a word at `(0, 1, 0)`, which is why the word rules restate the container host. `[wizard-header] > [container]` sets a padding shorthand at `(0, 2, 0)`, earlier than this file. It loses to the bare chain and to `[theme]` plus that chain. It beats a word at `(0, 1, 0)` / `(0, 2, 0)`, which is why those rules restate the container host too.

With the `:not()` chain included, `nav[fixed] > [container][keyboard-avoider]` and the sticky twin are `(0, 6, 1)` for padding mode's bare form. `[wizard-header] > [container][keyboard-avoider]` is `(0, 6, 0)`. A word on that container is `(0, 3, 1)` and `(0, 3, 0)`.

`nav.scss` and `wizard.scss` are not edited. The restatements live here.

## Safe area

Safe-area composition is always on for padding mode. Bottom padding on a host that is also a `[safe-area]` bottom, `y`, or bare form is one `max()`, never a sum:

```css
padding-bottom: max(
  var(--juice-safe-area-pad),
  env(safe-area-inset-bottom, 0px),
  var(--juice-keyboard-inset)
);
```

A sum would stack the home-indicator pad on the keyboard. The max keeps whichever is larger. `safe-area.scss` is not edited. The combined selectors live in this file and load later, so they beat safe area's own bottom padding.

The safe-area combined rule has to beat both files. Bare `[safe-area]` is `(0, 5, 0)` and its nav host is `(0, 7, 1)`. Padding mode's bare chain is `(0, 4, 0)` and its nav host is `(0, 6, 1)`. `[safe-area]:not(the four edges)[keyboard-avoider]:not(the three words)` is `(0, 9, 0)`, and the same chain on `nav[fixed] > [container]` is `(0, 11, 1)`. `[safe-area="bottom"]` plus the bare keyboard chain is `(0, 5, 0)`. `[safe-area="bottom"]` plus the padding word is `(0, 2, 0)`, which still beats the padding word alone at `(0, 1, 0)` and safe area's own bottom rule at `(0, 1, 0)`. The nav forms add the same two attributes and stay ahead of both parents. `y` matches bottom. `[theme]` adds one attribute on each.

Translate-only and footer-only do not take that formula. They already move by the inset, and folding the inset into padding would move twice. They keep safe area's own padding. A padding word composed with `translate` or `footer` still takes the max, because the author asked for the padding.

`[safe-area="top"]` and `[safe-area="x"]` do not set `padding-bottom`, so they are not restated.

See [Safe Area](./juice-safe-area.md).

## `env(keyboard-inset-height)`

Pure CSS fallback, Chromium only. The Virtual Keyboard environment variable `keyboard-inset-height` (Chrome 108+) is applied inside `@supports`. The query does not pass a fallback, so a browser that only understands `env()` with a fallback does not match. Elsewhere the block is a no-op and the role stays `0px`. Inside the block the declaration still carries the `0px` fallback:

```css
@supports (height: env(keyboard-inset-height)) {
  :root {
    --juice-keyboard-inset: env(keyboard-inset-height, 0px);
  }
}
```

`env(keyboard-inset-height, 0px)` as the query would match every current browser that accepts an `env()` fallback. The name alone matches Chromium's Virtual Keyboard variable and nowhere else. iOS Safari does not match. There the role stays `0px` until the runtime writes an inline length.

An inline `--juice-keyboard-inset` on `<html>` beats this override while the keyboard is open. Removing that inline property when the keyboard closes is what lets the fallback show through.

## Viewport

`interactive-widget=resizes-content` is a documented alternative on Chrome Android 108+. It asks the browser to shrink the layout viewport when the keyboard opens, so this host is unnecessary there. That token lives on the viewport meta tag. Juice does not change the meta tag.

```html
<meta name="viewport" content="width=device-width, initial-scale=1, interactive-widget=resizes-content">
```

With that token, `window.innerHeight` shrinks with the keyboard. The runtime's inset formula is about `0`, so it does not pad on top of the layout viewport. iOS and Chrome Android's default (`resizes-visual`) do not shrink the layout viewport. Leave the meta token off there and use this host.

`viewport-fit=cover` is safe area's token, not this one. A page that uses both still needs `viewport-fit=cover` for the device inset. See [Safe Area](./juice-safe-area.md#viewport-fitcover).

## Footer, fixed nav, and drawer

`nav[fixed]` is `position: fixed` and `top: 0` at `(0, 1, 1)`. That beats the footer word at `(0, 1, 0)`, so an unthemed fixed nav stays fixed. A fixed box with `top`, `bottom`, and `height: auto` stretches from the viewport top to the keyboard. Footer mode does not leave that `bottom` on the nav. A later rule sets `bottom: auto` on `nav[fixed][keyboard-avoider~="footer"]` at `(0, 2, 1)`, and the same declaration on `[theme] nav[fixed][keyboard-avoider~="footer"]` at `(0, 3, 1)`. `(0, 2, 1)` already beats the footer word and `[theme] [keyboard-avoider~="footer"]` at `(0, 2, 0)`. The reset does not set `position`. `[theme] [keyboard-avoider~="footer"]` still beats `nav[fixed]` on `position`, so a themed fixed nav becomes `sticky`. `bottom: auto` means that box does not stretch either. A container inside the nav (`nav[fixed] > [container][keyboard-avoider~="footer"]`) is a different element. It still takes `position: sticky` and the inset.

`[drawer]` is `position: absolute` and `bottom: 0` at `(0, 1, 0)`. This file loads later, so footer mode on the drawer itself replaces both `position` and `bottom`. That undocks the panel. Put padding mode on the scrolling body inside the drawer (`[drawer-body]`, or the element that actually scrolls) instead.

```html
<div drawer>
  <div drawer-body keyboard-avoider>
    <label>Note <textarea></textarea></label>
  </div>
</div>
```

`nav[sticky]` is `position: sticky` and `top: 0` at `(0, 1, 1)`. Footer mode's `bottom` still applies, because the sticky rule does not set `bottom`. A sticky box is sized in flow. That `bottom` is a sticky constraint, not a stretch, so `nav[sticky]` is not in the reset. `[wizard-header]` is `position: sticky` and `top: 0` at `(0, 1, 0)`. `wizard.scss` loads later than keyboard-avoider, so the unthemed tie keeps that position. It does not set `bottom`. The footer `bottom` stays, and the box does not stretch. The restated `nav[fixed] > [container]` and `nav[sticky] > [container]` selectors are for a container that is the host. They do not move the nav's own box.

## Reduced motion

`prefers-reduced-motion: reduce` sets `transition: none` on translate mode, at the same specificity as the transition, later in the file. The motion scale also collapses durations to `0.01ms`. `transition: none` is the one this component owns.

Padding mode sets no transition, so a reduced-motion rule on every host would erase a button transition the author did not ask to replace. Footer mode sets no transition.

The runtime reads the same preference for scroll. When `prefersReducedMotion()` is true, `scrollIntoView` uses `behavior: "auto"`. Otherwise it uses `"smooth"`. See [Focus and scroll](#focus-and-scroll).

## Automatic Boot

The runtime starts automatically in the browser.

At the bottom of the file, Juice checks whether it is running in a browser environment and then boots the keyboard-avoider runtime:

```ts
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    bootOnReady = () => {
      bootOnReady = null;
      if (!autoStartSuspended) {
        startKeyboardAvoiderRuntime();
      }
    };
    document.addEventListener('DOMContentLoaded', bootOnReady);
  } else {
    startKeyboardAvoiderRuntime();
  }
}
```

Importing the Juice JS entrypoint is enough for the normal behavior. The entry re-exports this module, so the boot runs.

`stopKeyboardAvoiderRuntime()` also cancels a deferred `DOMContentLoaded` boot, so a test or host that stops the singleton before ready does not get a surprise start. Outside a browser, `startKeyboardAvoiderRuntime()` returns `null`. `createKeyboardAvoider()` returns a no-op controller when `window` or `document` is missing, or when `visualViewport` is missing. `getState()` on that no-op returns `{ open: false, inset: 0 }`. See [Server render](#server-render).

## Public API

The runtime still exposes functions, but they are secondary to the automatic behavior.

```ts
createKeyboardAvoider(options?)
initKeyboardAvoider(options?)
startKeyboardAvoiderRuntime()
stopKeyboardAvoiderRuntime()
```

These are useful for internal control, tests, or advanced cases.

A qualifying change of `{ open, inset }` dispatches a bubbling `juice:change` from each host. `detail` is `{ runtime: "keyboard-avoider", state }`. `state` is `{ open: boolean, inset: number }`. The first observation of a host is recorded and does not dispatch. Later events fire when `open` flips, or when the inset has moved by at least `threshold` pixels from the last published inset while the keyboard stays open. This surface stays Emerging and shipped in 0.9.5. See [juice:change](#juicechange).

`initKeyboardAvoider()` is the same function as `createKeyboardAvoider()`.

`startKeyboardAvoiderRuntime()` is an idempotent singleton. A second call syncs and returns the same controller. `stopKeyboardAvoiderRuntime()` destroys that controller and suspends auto-start. A later `startKeyboardAvoiderRuntime()` creates a new controller. That new controller's first look is silent.

## KeyboardAvoiderOptions

```ts
type KeyboardAvoiderOptions = {
  root?: ParentNode;
  keyboardAvoiderSelector?: string;
  threshold?: number;
  scrollIntoView?: boolean;
};
```

By default, Juice uses:

```ts
{
  root: document,
  keyboardAvoiderSelector: '[keyboard-avoider]',
  threshold: 80,
  scrollIntoView: true,
}
```

A custom `root` limits hosts to elements inside that root. When the root itself matches, that host is managed too. Hosts outside the root are left alone. The focus listeners are on that root. The open check still reads `document.activeElement`, so once an update runs the focused field can sit anywhere in the document. Scroll runs only for a focus inside a managed host.

`threshold` is a pixel count. `open` is `inset > threshold`, not `>=`. At the default, an overlap of `80` stays closed and `81` opens. A value that is not a finite number, or a value below `0`, falls back to `80`. `0` is kept: any positive overlap can open.

`scrollIntoView: false` opts out of scrolling for every host this controller manages. Any other value, including omitting the option, leaves scrolling on. `[keyboard-avoider~="noscroll"]` opts out one host.

## KeyboardAvoiderController

```ts
type KeyboardAvoiderState = {
  open: boolean;
  inset: number;
};

type KeyboardAvoiderController = {
  destroy: () => void;
  sync: () => void;
  getState: (target?: HTMLElement | null) => KeyboardAvoiderState | null;
};
```

`destroy()` removes the listeners, cancels a scheduled update, cancels a pending scroll, removes the inline `--juice-keyboard-inset`, and clears `[keyboard-open]` on `<html>` and on hosts this controller marked. A second `destroy()` does nothing. After `destroy()`, `getState()` returns `null`.

`sync()` reads geometry and focus immediately and writes the result. It is not scheduled on a frame. Call it when a host is added and nothing else will resize or focus. See [Hosts added later](#hosts-added-later).

`getState()` reads one shared measurement, not a per-host inset. With no target, it uses the first managed `[keyboard-avoider]` in the root. A target inside a host resolves to that host. A node that is not a host and is not inside one returns `null`. When there is no managed host, `getState()` returns `null`. The returned object is a copy of `{ open, inset }`. Every host sees the same pair. `inset` is the measured overlap in CSS pixels. It can stay non-zero after blur, while `open` is false and the inline property is gone.

The no-op controller (no `window`, or no `visualViewport`) is different: `getState()` returns `{ open: false, inset: 0 }` and ignores the target. It does not return `null`. `destroy()` on that no-op does not remove an author inline property.

## What the Runtime Actually Does

The runtime performs six main jobs:

1. Find `[keyboard-avoider]` hosts inside the root. Any attribute value stays as authored. `padding`, `translate`, and `footer` are CSS words. `noscroll` is the word this runtime owns
2. Measure the keyboard overlap from `visualViewport` and `innerHeight`
3. Treat the keyboard as open only when that overlap is greater than `threshold` and an editable field is focused
4. While open, write `--juice-keyboard-inset` on `<html>` and set `[keyboard-open]` on `<html>` and on each host. While closed, remove the inline property and the attribute
5. Scroll a focused element inside a host into view after geometry settles, unless the host says `noscroll` or the controller opted out
6. Dispatch `juice:change` from each host when `open` flips, or when the inset drifts by at least `threshold` while open

There is no focus trap. This runtime does not close a modal, drawer, toast, popover, wizard, tooltip, combobox, banner, or menu. Escape is not handled. This runtime does not set `navigator.virtualKeyboard.overlaysContent`.

Listeners are `visualViewport` `resize` and `scroll`, `window` `resize` and `orientationchange`, and `focusin` and `focusout` on the root. Updates are coalesced with `requestAnimationFrame`. `focusout` schedules an update. It does not cancel a pending scroll. Some browsers deliver `focusout` after `focusin` for the same move, which would drop the scroll `focusin` just armed. The scroll frame checks that the element is still focused, so a real blur does not scroll.

## Inset and open

The overlap is the layout viewport minus the visual viewport:

```ts
inset = max(0, round(innerHeight - (visualViewport.height + visualViewport.offsetTop)))
```

iOS reports part of that overlap as `offsetTop`. Leaving it out counts the keyboard twice. An iOS-shaped viewport of `innerHeight` 812, `visualViewport.height` 500, and `offsetTop` 100 is `212`, not `312`.

Chrome Android with `interactive-widget=resizes-content` shrinks `innerHeight` with the keyboard, so the same formula is about `0`. A negative overlap clamps to `0`. Non-finite `innerHeight`, `height`, or `offsetTop` reads as `0`. The value is rounded to integer pixels.

`open` is `inset > threshold` and an editable element has focus. Editable is the same text-like set as the Input runtime, plus textarea, select, and contenteditable:

- an `<input>` with a missing `type`, an empty `type`, or `text`, `email`, `password`, `search`, `tel`, `url`, or `number` (the type is compared in lower case)
- a `<textarea>`
- a `<select>`
- `[contenteditable]` on the focused element or an ancestor, including the empty attribute, `"true"`, and `"plaintext-only"`. `isContentEditable` counts, including an inherited ancestor. The attribute is checked too

Checkbox, radio, range, file, date, time, datetime-local, month, week, color, hidden, button, submit, reset, and image inputs are not editable. A `<button>` is not editable. `contenteditable="false"` is not editable. A hardware keyboard does not shrink the visual viewport, so a focused field stays closed even when the control is editable.

While open, the inset is written as `<n>px` on `document.documentElement` (the `<html>` element), not on each host. `--juice-keyboard-inset` inherits. When the keyboard is not open the inline property is removed, even if the measured overlap is still non-zero. `getState().inset` reports that measured overlap. A blur that leaves the keyboard covering the page is `{ open: false, inset: 300 }` with no inline property and no `[keyboard-open]`. The `0px` role and the `env()` fallback can apply. The next open writes the property again.

Pinch zoom skips the update. When `visualViewport.scale` is a number other than `1`, the runtime leaves the previous inset, the previous `open`, and the inline property. The pending scroll is skipped too. The next geometry event after `scale` returns to `1` measures again.

`[keyboard-open]` is set on `<html>` and on every managed host while open, and removed from all of them when closed. A host that was open and is no longer in the root loses the attribute on that update.

## Focus and scroll

Open is page-wide. The focused editable field does not have to sit inside a host. A field outside every host still opens the inset and sets `[keyboard-open]` on `<html>` and on the hosts.

Scroll is not page-wide. `focusin` inside a managed host remembers that element. A focus outside a host, a `noscroll` host, or a controller with `scrollIntoView: false` clears the pending scroll and does not call `scrollIntoView`.

The scroll runs two frames after geometry events go quiet. A resize burst settles before the element moves, and the inset written on the first of those frames is the one layout sees. A focus that never resizes still scrolls on that quiet window. A geometry event before the second frame restarts the wait.

```ts
element.scrollIntoView({
  block: 'nearest',
  behavior: prefersReducedMotion() ? 'auto' : 'smooth',
});
```

`destroy()` cancels a pending scroll. The element is scrolled only if it is still connected and still focused (itself, or an ancestor of `document.activeElement`).

## juice:change

`juice:change` bubbles from each host. `detail` is `{ runtime: "keyboard-avoider", state }` with `state` `{ open, inset }`.

The first observation of a host is silent, including a host that appears while the keyboard is already open. Later events fire when `open` flips, or when the inset has moved by at least `threshold` pixels from the last published inset while both the previous and the next state are open. Smaller steps still update the custom property and `getState()`. They accumulate against the last published inset, so a slow drift still publishes once it is stale by `threshold`. An inset change while the keyboard is closed does not publish. A blur that flips `open` to false does publish, and `inset` in that event is the overlap still measured at blur.

`getState()` can move on those silent steps. Listen for `juice:change` when the open flag or a threshold-sized drift matters. Read `getState()` when the latest overlap matters.

## Platforms

iOS Safari does not shrink the layout viewport and does not implement `env(keyboard-inset-height)`. The CSS fallback stays `0px`. The runtime is what writes the overlap, and the formula subtracts `visualViewport.offsetTop` so the keyboard is not counted twice. A hardware keyboard attached to the device does not shrink the visual viewport, so the host stays closed.

Chrome Android's default is `resizes-visual`. The layout viewport stays, the keyboard covers the page, and the runtime's overlap is the inset. `env(keyboard-inset-height)` can also apply on Chromium 108+ inside the `@supports` block. An inline length from the runtime wins while open. Clearing it on close lets that environment variable show through.

`interactive-widget=resizes-content` on Chrome Android 108+ shrinks `innerHeight`. The formula is about `0`, and the runtime does not add a second pad. That meta tag is the alternative to this host on that browser. It is not a substitute on iOS.

This runtime does not set `navigator.virtualKeyboard.overlaysContent`. It does not opt the page into the Virtual Keyboard API overlay flag. Geometry comes from `visualViewport`.

## Server render

`createKeyboardAvoider()` returns a no-op controller when `window` or `document` is missing, or when `visualViewport` is missing (old browsers use the same path). `destroy` and `sync` do nothing. `getState()` returns `{ open: false, inset: 0 }`. `startKeyboardAvoiderRuntime()` returns `null` when `window` or `document` is missing. The auto-boot at the bottom of the module is inside the same `window` / `document` guard, so importing the module during a server render does not touch a DOM.

A no-op does not install `--juice-keyboard-inset`. `destroy()` on it leaves an author value in place. A live controller removes the inline property whenever the keyboard is closed, including the first sync.

## Hosts added later

There is no `MutationObserver`. A host added after boot is not seen until the next update. `sync()` runs that update immediately. A later `focusin`, `focusout`, visual-viewport resize or scroll, window `resize`, or `orientationchange` runs it too. The first time that host is seen, `juice:change` is silent.

`destroy()` stops the listeners. It does not watch the DOM.

## Sig `bind()`

`@citrusworx/sigjs/juice` `bind()` does not include keyboard-avoider, pressable, touchable-row, or sheet. `JuiceRuntimeName` stops at twenty-eight names, through `table`. Passing `"keyboard-avoider"` is not a supported name. Passing `"pressable"` is not a supported name. Passing `"touchable-row"` is not a supported name. This runtime does not call `bind`, and Juice does not import Sig.

`juice:change` and `getState()` still work without Sig. Listen on the host, or call `getState()` on the controller.

## Accessibility

- This runtime does not set `role`, a name, or a live region. `[keyboard-open]` is not an ARIA state. The stylesheet does not select it. Screen readers are not told that a keyboard opened
- `scrollIntoView({ block: "nearest" })` moves the focused field into view after the inset settles. `noscroll` and `scrollIntoView: false` leave that to the author. A field that stays under the keyboard is an author choice on those hosts
- Reduced motion uses `behavior: "auto"` for that scroll, and translate mode sets `transition: none`. Padding does not animate
- A hardware keyboard does not open the inset. The field stays where it is, which is what a user with a physical keyboard already sees
- Focus is not moved and not trapped. Escape is not handled. The editable control keeps the platform keyboard
- Do not hide the only action in a region that stays covered. Padding mode on the scroll container, or footer mode on the action bar, is what keeps the control reachable
- `contenteditable="false"` is not treated as an editor. An inherited `contenteditable` ancestor is

## Examples

A scrolling form. Padding mode adds the overlap under the last field so it can scroll clear of the keyboard.

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">

<form keyboard-avoider>
  <label>Name <input name="name"></label>
  <label>Note <textarea name="note"></textarea></label>
  <button type="submit">Save</button>
</form>
```

A chat composer. Translate mode lifts the composer by the inset. It does not pad.

```html
<div keyboard-avoider="translate">
  <label>Message <input name="message"></label>
  <button type="button">Send</button>
</div>
```

A sticky footer action bar:

```html
<div keyboard-avoider="footer">
  <button type="button">Continue</button>
</div>
```

With safe area. Bare `[safe-area]` or `[safe-area="bottom"]` or `[safe-area="y"]` in padding mode takes the max of the floor, the home indicator, and the keyboard. The page still needs `viewport-fit=cover`.

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">

<div safe-area="bottom" keyboard-avoider>
  <label>Comment <textarea></textarea></label>
</div>

<footer safe-area="bottom" keyboard-avoider="footer">
  <button type="button">Done</button>
</footer>
```

The footer in that last example does not take the max. It keeps safe area's own padding and sets `bottom` to the keyboard inset. The first example takes the max, because it is padding mode.

A composer that should not scroll the page when a field inside it focuses:

```html
<div keyboard-avoider="translate noscroll">
  <input name="message">
</div>
```

## Limitations

- No `KeyboardAvoider()` factory. Author markup (or emit it from Sig/React) and let the runtime enhance it.
- This surface is Emerging, not Stable. Keyboard avoider is the thirty-first Emerging auto-enhance runtime. It shipped in 0.9.5. Touchable row remains the thirtieth and shipped in 0.9.4. Pressable remains the twenty-ninth and shipped in 0.9.4. Sheet is the thirty-second, on master, and not in the 0.9.5 npm cut. All thirty-two stay Emerging.
- `@citrusworx/sigjs/juice` `bind()` does not name keyboard-avoider, pressable, touchable-row, or sheet. Do not pass `"keyboard-avoider"` as a `JuiceRuntimeName`. See [Sig `bind()`](#sig-bind).
- The stylesheet does not select `[keyboard-open]`. Layout follows `--juice-keyboard-inset`.
- `open` is `inset > threshold` (default `80`) and an editable field is focused. An overlap of exactly `80` stays closed. Checkbox, radio, range, date, button, and the other non-text input types do not count as editable. A hardware keyboard stays closed.
- `getState().inset` is the measured overlap. It can stay non-zero after blur. The inline custom property is removed while closed, so CSS sees `0px` or the `env()` fallback.
- One inset for the page. `getState()` on any host returns that same pair. There is no per-host measurement.
- Scroll runs only for focus inside a host, two frames after geometry settles. `[keyboard-avoider~="noscroll"]` and `scrollIntoView: false` opt out. Reduced motion uses `behavior: "auto"`.
- Pinch zoom (`visualViewport.scale` other than `1`) skips the update and leaves the previous inset.
- There is no `MutationObserver`. Call `sync()` for hosts added later. The first observation is silent.
- `juice:change` fires on an open flip, or on an inset drift of at least `threshold` while open. Smaller steps update the property and `getState()` and do not dispatch. A drift while closed does not dispatch.
- This runtime does not set `navigator.virtualKeyboard.overlaysContent`.
- Translate-only and footer-only keep safe area's own padding. They do not take the `max()` formula. Padding mode, including a padding word composed with another word, does.
- Footer mode on `[drawer]` replaces the drawer's `position` and `bottom`. Put padding mode on the scrolling body inside the drawer. Footer mode on `nav[fixed]` sets `bottom: auto`, so `top: 0` does not stretch the bar down to the keyboard. `nav[sticky]` still takes the footer `bottom`. A sticky box does not stretch.
- `interactive-widget=resizes-content` is a viewport meta token. Juice does not add it. On Chrome Android 108+ it makes this host unnecessary, and the runtime's formula stays near `0`.
- There is no focus trap and no Escape handling. Keyboard avoider is not a layered overlay. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering).
- There is no z-index elevation. Footer mode sets `position: sticky` and does not set `z-index`. See [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands).
- Centered modal / dialog, edge-docked drawer, toast-stack, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, breadcrumb, progress, pagination, disclosure, spinner, select, input, textarea, field, icon button, avatar, table, pressable, touchable row, and accordion behavior are not part of this runtime.

## Why This Matches Navigation

The keyboard-avoider runtime copies the navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, breadcrumb, progress, pagination, disclosure, spinner, select, input, textarea, field, icon button, avatar, table, pressable, and touchable row lifecycle by convention:

- DOM-first
- automatic boot
- listeners for viewport geometry and for focus, coalesced with `requestAnimationFrame`
- idempotent singleton `start*Runtime` / `stop*Runtime`
- framework-agnostic

It does not use a `MutationObserver`. Call `sync()` when a host is added and no geometry or focus event will follow. Shared internals under `libraries/juice/src/js/src/shared/` are not a public multi-feature runtime API. `juice:change` comes from that shared helper. Keyboard avoider does not import Sig.

## Design Rule Going Forward

Interactive Juice browser features should follow this standard:

> Valid Juice markup should work automatically when it reaches the browser.
