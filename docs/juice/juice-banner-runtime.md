# Banner

A banner is an inline alert rooted at `[banner]`.

Emerging. Shipped in `@citrusworx/juiceui@0.9.2`.

Importing `@citrusworx/juiceui` enhances valid markup. [Automatic behavior](./juice-runtime-behavior.md#automatic-behavior).

## Markup

```html
<div banner role="status">
  <div banner-body>Scheduled maintenance tonight.</div>
  <button type="button" banner-close aria-label="Dismiss">×</button>
</div>

<div banner="full" banner-tone="warning" name="maintenance" banner-persist="session">
  <div banner-body>Scheduled maintenance tonight.</div>
  <button type="button" banner-close aria-label="Dismiss">×</button>
</div>
```

The node stays in the DOM. Closed vs open is native `hidden` on the root.

## Attributes

| Hook | What it does |
| --- | --- |
| `[banner]` | Root. Bare is inset. There is no `[banner-region]` and no portal. |
| `[banner="full"]` | Edge-to-edge layout (width 100%, no radius). Status does not go on this attribute. |
| `[banner-tone]` | Optional status: `info`, `success`, `warning`, `error`. Bare is neutral. |
| `[banner-body]` | Optional body slot. |
| `[banner-close]` | Dismiss control. An empty name is filled as `aria-label="Dismiss"`. |
| `banner-persist` | `session` or `local`, plus a `name` or `id`. Without both, dismiss is in-memory only. |
| `hidden` | Native closed state. The runtime does not write layout `content`. |
| `--juice-banner-*` | Theme paint. There is no panel-shadow role. |

Optional `surfaceTone` on `[banner]` is allowed. Do not force it.

## JavaScript

| Export | What it does |
| --- | --- |
| `createBanner(options?)` | Controller for `options.root`, or the document. |
| `initBanner(options?)` | Same call as `createBanner`. |
| `startBannerRuntime()` | Document controller. A second call syncs and returns it. Returns `null` when there is no document. |
| `stopBannerRuntime()` | Destroys that controller and cancels a deferred boot. |

A custom-root controller can run beside the document runtime. Each click or key is claimed once.

### Options

| Option | Default | Notes |
| --- | --- | --- |
| `root` | `document` | Node to search. |
| `bannerSelector` | `[banner]` | Root query. |
| `closeSelector` | `[banner-close]` | Close control query. |

### Controller

| Method | What it does |
| --- | --- |
| `destroy()` | Disconnects this controller. |
| `sync()` | Wires role, close name, and persisted dismiss. |
| `show(target?)` | Removes `hidden`. Never hides siblings. Does not move focus in. |
| `dismiss(target?)` | Sets `hidden` on that banner. |
| `isShown(target?)` | Whether that banner lacks `hidden`. |
| `getState(target?)` | Returns `{ shown: boolean }`, or `null`. |

### Events

A real show or dismiss dispatches a bubbling [juice:change](./juice-runtime-behavior.md#juicechange) from `[banner]`.

`detail` is `{ runtime: "banner", state: { shown: boolean } }`. An unchanged `shown` does not dispatch. This surface stays Emerging.

## Accessibility

- Prefer `role="status"` for info, success, and neutral, or `role="alert"` for error and warning. The runtime fills a missing role.
- Enter and Space activate non-button `[banner-close]` controls.
- Escape is not handled. [Escape and layering](./juice-runtime-behavior.md#escape--layering).
- There is no focus trap, and show does not move focus into the banner.
- Banner has no z-index. [Z-index bands](./juice-runtime-behavior.md#z-index-bands).

## Behavior

1. Find `[banner]` and `[banner="full"]` roots. There is no region wrapper.
2. Set `role="status"` for info, success, and neutral, or `role="alert"` for `banner-tone="error"` or `"warning"`.
3. Fill an empty `[banner-close]` name and button role and tabindex on non-native closes.
4. Show and dismiss with native `hidden`. `show()` never hides siblings.
5. Remember dismiss when `banner-persist` is `session` or `local` and a `name` or `id` is set.
6. Handle `[banner-close]` clicks, and Enter or Space on non-button closes.
7. Leave Escape to the overlay yield order.

There is no auto-dismiss timer. The banner stays until dismiss. This runtime does not close other surfaces, and they do not close a banner.

### Persist

`banner-persist="session"` writes `sessionStorage`. `banner-persist="local"` writes `localStorage`.

The key is `name` when present, otherwise `id`. The stored name is `juice-banner:<key>` with value `"1"`.

A later `sync()` re-hides a persisted banner that is visible again. `show()` removes the stored key. Storage errors still dismiss in the current document.

Later DOM changes schedule `sync()` on the next animation frame. [Sync](./juice-runtime-behavior.md#sync).

## Not to be confused with

| This | Not this |
| --- | --- |
| Inline alert | Toast stack (`[toast-region]`) |
| In-flow callout | Dialog, drawer, or scrim |
| `[banner]` | Surface `overlay="frost"` or `overlay="tint"` |

## Related

- [Attributes](./juice-attributes.md)
- [Theme contract](./juice-theme-contract.md)
- [Runtime behavior](./juice-runtime-behavior.md)
- [Toast](./juice-toast-runtime.md)
