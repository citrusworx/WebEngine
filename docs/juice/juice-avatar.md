# Avatar

An avatar is an initials or photo mark rooted at `[avatar]`. A broken or empty photo steps aside so the initials show.

Emerging. The twenty-seventh runtime. On master. Not in the published `@citrusworx/juiceui@0.9.2` release.

`createAvatar`, `initAvatar`, `startAvatarRuntime`, and `stopAvatarRuntime` are not in that npm cut.

Importing `@citrusworx/juiceui` enhances valid markup on master. [Automatic behavior](./juice-runtime-behavior.md#automatic-behavior). The published 0.9.2 package does not include this runtime.

## Markup

There is no HTML global `avatar` attribute, and there is no `<avatar>` element. `[status]` is not a global attribute either. The dot selectors are `[avatar][status="…"]`, so a bare `[status]` is not a presence dot. Do not style `[role="status"]`.

```html
<span avatar aria-label="Ada Lovelace">AL</span>

<span avatar="round">JL</span>

<span avatar="square" scale="sm">BL</span>

<span avatar scale="lg" status="online">
  <img alt="" src="ada.png">
  <span>AL</span>
</span>

<span avatar status="away">
  <img alt="Joan Clarke" src="joan.png">
</span>

<div avatar-group>
  <span avatar>
    <img alt="" src="ada.png">
    <span>AL</span>
  </span>
  <span avatar>
    <img alt="" src="joan.png">
    <span>JC</span>
  </span>
  <span avatar-more>+3</span>
</div>

<div avatar-group scale="lg">
  <span avatar>AL</span>
  <span avatar scale="sm">JC</span>
  <span avatar-more="square">+2</span>
</div>
```

## Attributes

| Hook | What it does |
|---|---|
| `[avatar]` | Host. Round mark. Boolean `[avatar]` is the round. Any value, including `"square"` and `"round"`, is still an avatar. |
| `[avatar="round"]` | The same round shape as boolean `[avatar]`. |
| `[avatar="square"]` | Squared mark. The other shape is a value on `[avatar]`, the same idea as `[badge="square"]`. Not a `[square]` boolean. |
| `[scale="sm"\|"lg"]` | Steps the box and the initials. Unmarked scale is the default size. There is no `[scale="md"]`. |
| child `<img>` | Photo. Covers the initials. Source order does not matter. |
| `[status="online"\|"away"\|"busy"\|"offline"]` | Presence dot on `[avatar]`, bottom-right, painted with `::after`. No child element. |
| `[avatar-group]` | Overlapping row. Not a runtime host. `[scale]` on the group steps every unmarked child. A child `[scale]` wins. |
| `[avatar-more]` | Overflow chip, the same box as an avatar. `+N` is the text. An `[avatar]` whose text is `+N` paints the same picture. |
| `[fallback]` | State the runtime sets on `[avatar]` when no photo is showing and none is still loading. Core CSS does not paint from this attribute. |

`[avatar-more="round"]` is the round chip. `[avatar-more="square"]` is the squared chip. The status dot is only on `[avatar]`. `[avatar-more]` does not grow a `::after`.

An `<img>` inside `[avatar]` is taken out of flow (`position: absolute; inset: 0; object-fit: cover`) and stacked above the initials (`z-index: 1` inside the avatar's `isolation`). Initials, a `<span>` or bare text, stay centered underneath.

Hiding or removing that image is what reveals the initials. The runtime does that with the `hidden` attribute.

Avatar CSS does not set `display` on the photo, so the user-agent `[hidden]` rule is what takes the photo out.

Initials paint at `font-weight: 600`, `line-height: 1`, `text-transform: uppercase`, and `white-space: nowrap`. The uppercase is paint. The runtime does not rewrite the text.

Core CSS does not give `[avatar]` an overlay `z-index`. The photo is `1` and the status dot is `2`, both inside the avatar. A group stacks the first eight faces from `8` down to `1`; later faces stay at `0`. Nothing here is `z-index: 10` or `1000`. See [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands).

## Sizes, status, and groups

`[scale="sm"|"lg"]` steps the box you already chose. Unmarked scale uses `--juice-avatar-size` (`2.5rem`), the same step as `[skeleton="circle"]`. `sm` is `1.5rem`. `lg` is `4rem`. Initials are `0.4` of that box. The status dot is `0.28` of that box. Those formulas are restated on the avatar, so a `:root` length does not freeze the dot at the default size.

`[avatar="square"]` uses `--juice-avatar-radius-square` (`0.375rem`), the same radius as `[badge="square"]` and `[skeleton]`. The round uses `999px`.

The status dot hangs off the bottom-right rim (`translate(20%, 20%)`). `[avatar][status]` sets `overflow: visible` so the ring is not clipped.

The ring is a `2px` shadow in `--juice-avatar-ring`, not a border, so the box size does not change. The dot's `background-color` eases with `--juice-motion-duration-fast` and `--juice-motion-ease-standard`.

`prefers-reduced-motion: reduce` sets `transition: none` on that dot. The translate is placement, and it stays.

`pointer-events: none` keeps the dot out of hit testing. Only `online`, `away`, `busy`, and `offline` paint a dot.

`[avatar-group]` is an inline row with no gap. Each face after the first gets `margin-inline-start: var(--juice-avatar-group-overlap)`, a negative quarter of the current size.

The group restates that overlap, and `[scale]` on the group reassigns `--juice-avatar-size` and `--juice-avatar-font-size`, so the stack tightens with the box. A child `[scale]` sets width and font-size on that child and leaves `--juice-avatar-size` alone, so it does not change the group's overlap.

Faces in a group also wear the `2px` ring as a shadow.

The first eight faces paint above the ones after them, so a bottom-right dot stays on the visible rim. Past eight, later faces paint in source order.

## Roles

Color defaults are stated on `:root` and again on `[theme]`. Geometry defaults are on `:root` only. Shipped library themes are not required to bind any `--juice-avatar-*` name. The only shipped override is Tide's away status, below. Generated `--jx-*` themes are not required to bind these roles and do not emit them.

| Role | Default |
|---|---|
| `--juice-avatar-size` / `-sm` / `-lg` | `2.5rem` / `1.5rem` / `4rem` |
| `--juice-avatar-font-size` / `-sm` / `-lg` | `calc(size * 0.4)` at each step |
| `--juice-avatar-radius` | `999px` |
| `--juice-avatar-radius-square` | `0.375rem` |
| `--juice-avatar-bg` | `var(--juice-surface-muted-bg, gray-200)` |
| `--juice-avatar-ink` | `currentColor` |
| `--juice-avatar-ring` | `var(--juice-surface-strong-bg, white-100)` |
| `--juice-avatar-ring-width` | `2px` |
| `--juice-avatar-status-size` | `calc(var(--juice-avatar-size) * 0.28)` |
| `--juice-avatar-group-overlap` | `calc(var(--juice-avatar-size) * -0.25)` |
| `--juice-avatar-status-online` | `var(--juice-banner-success, var(--juice-toast-success, green-700))` |
| `--juice-avatar-status-away` | `var(--juice-banner-warning, var(--juice-toast-warning, yellow-700))` |
| `--juice-avatar-status-busy` | `var(--juice-banner-error, var(--juice-toast-error, red-700))` |
| `--juice-avatar-status-offline` | `color-mix(in srgb, currentColor 55%, transparent)` |

`gray-200` is the unthemed fill. `white-100` is the unthemed ring. `green-700`, `yellow-700`, and `red-700` are the unthemed status hues when banner and toast roles are both missing. Offline has no banner or toast hue. Ink at 55% stays neutral on light and dark.

See the [Theme Contract](./juice-theme-contract.md) and [Attributes](./juice-attributes.md).

## Theming

The fill is the shared muted surface. Ink is `currentColor`. Status hues follow banner success, warning, and error, then toast, then the unthemed swatch. KiwiPress and Aquaflux read with no avatar override, because those themes already set the muted surface and the banner status hues.

Color is restated on `[theme]` for a custom-property reason. A `var()` resolves on the element that sets the property.

`:root` does not see a theme's `--juice-surface-muted-bg` or `--juice-banner-success`, so a formula that lived only on `:root` would bake the unthemed fallback in for every descendant. `[theme]` states the same formula again.

`currentColor` stays inside the ink and offline values and resolves where the avatar paints.

**Tide away.** Tide's banner warning is lagoon-800. That step sits on the muted surface (the same hue at low alpha) and the away dot disappears. The theme source notes that contrast at about 1.6:1. `libraries/juice/src/themes/tide/tide.scss` lifts only `--juice-avatar-status-away`:

```css
--juice-avatar-status-away: color-mix(in srgb, var(--tide-banner-warning) 45%, var(--tide-text));
```

The warning hue moves toward Tide's text color so the dot stays in family and readable. Online, busy, and offline already clear that surface. Tide does not override any other `--juice-avatar-*` name. No other shipped theme binds an avatar role.

## JavaScript

Outside a browser, `startAvatarRuntime()` returns `null` and `createAvatar()` returns a controller whose methods do nothing (`getState()` returns `null`).

| Export | What it does |
| --- | --- |
| `createAvatar(options?)` | Controller for `options.root`, or the document. |
| `initAvatar(options?)` | Same call as `createAvatar`. |
| `startAvatarRuntime()` | Document controller. A second call syncs and returns it. Returns `null` when there is no document. |
| `stopAvatarRuntime()` | Destroys that controller and cancels a deferred boot. |

A custom-root controller can run beside the document runtime. Each `load` and `error` is claimed once.

### Options

```ts
type AvatarOptions = {
  root?: ParentNode;
  avatarSelector?: string;
};
```

By default, Juice uses:

```ts
{
  root: document,
  avatarSelector: '[avatar]',
}
```

A custom `root` limits sync to avatars inside that root. When the root itself is an `[avatar]`, that host is managed too.

Hosts outside the root are left alone. `[avatar-group]` and `[avatar-more]` are not hosts, unless an author points `avatarSelector` at them. The shipped default does not.

### Controller

```ts
type AvatarState = {
  loaded: boolean;
  fallback: boolean;
  hasImage: boolean;
};

type AvatarController = {
  destroy: () => void;
  sync: () => void;
  getState: (target?: HTMLElement | null) => AvatarState | null;
};
```

`destroy()` removes the `load` and `error` listeners, disconnects the observer, and cancels a scheduled sync. It does not remove `[fallback]` or unhide an image this runtime hid.

Clearing those would paint a broken photo over the initials again. The last visual decision stays.

The runtime simply stops updating it. A later `load`, `error`, or `sync()` does not clear that fallback.

`getState()` still reads the image, so a photo that is still broken still reports fallback.

`sync()` walks each managed host and classifies its images. `getState()` reads that classification.

With no target, `getState()` uses the first managed `[avatar]` in the root. A target inside a host, including the `<img>`, resolves to that host. A node that is not an `[avatar]` and is not inside one returns `null`. `[avatar-more]`, `[avatar-group]`, and a stray `<img>` return `null`.

### Events

A real change of `{ loaded, fallback, hasImage }` dispatches a bubbling, composed [juice:change](./juice-runtime-behavior.md#juicechange) from `[avatar]`. `detail` is `{ runtime: "avatar", state }`.

`getState()` reads that shape, or `null` when the host is missing. The first observation does not dispatch, including an image that is already broken when the runtime starts.

A later `sync()` that leaves the state unchanged does not dispatch. A second `error` on a photo that is already in fallback does not dispatch. This surface stays Emerging and is on master, unreleased after 0.9.2.

`loaded` is true when at least one image in that avatar has loaded. `hasImage` is true when the avatar has at least one `<img>`, including one that is still loading or already in fallback.

`fallback` is true when the avatar has an image, none of them have loaded, and none of them are still loading. Initials with no `<img>` are `{ loaded: false, fallback: false, hasImage: false }`.

A stale `[fallback]` on that host is removed so the attribute matches.

## Behavior

The runtime performs five main jobs:

1. Find `[avatar]` hosts inside the root. Any attribute value, including `avatar="square"` and `avatar="round"`, stays as authored. Sync does not rewrite `[avatar]`, `[scale]`, or `[status]`. A node without `[avatar]` is ignored. `[avatar-group]` is not a host. Each `[avatar]` inside a group is judged on its own image
2. Classify each child `<img>` that belongs to that host. An image inside a nested `[avatar]` belongs to the inner host
3. Hide a broken or empty image with the `hidden` attribute, and set `[fallback]` on the avatar when nothing is loaded and nothing is still loading. A loaded image, or one that is still loading, stays visible. `[fallback]` comes off when a photo is showing or still loading
4. Leave `alt`, `aria-label`, `aria-labelledby`, `title`, and the initials text untouched. No initials are invented. No accessible name is written
5. Leave Escape, focus, and the keyboard alone. Avatar does not participate in the overlay yield order. There is no focus trap. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering)

`hidden` is removed only when this runtime set it. An author-hidden photo is left hidden, including after a later load.

`[avatar-more]` is not managed. An `<img>` inside the chip is left alone, and the chip does not receive `[fallback]`. A `+N` chip stays text.

## Images

An avatar with no `<img>` is initials. State is `{ loaded: false, fallback: false, hasImage: false }`.

An `<img>` is classified as one of four outcomes:

| Outcome | When | What the runtime does |
|---|---|---|
| Empty | No `src` and no `srcset`, or both are missing or whitespace | `[fallback]` on the avatar, `hidden` on that image. `hasImage` stays true |
| Broken | `error`, or `img.complete` with `naturalWidth === 0`, including a photo that failed before this runtime started | Same fallback. `alt` is not changed |
| Loaded | `load`, or `img.complete` with `naturalWidth > 0` | `[fallback]` off, and `hidden` removed if this runtime set it |
| Pending | A usable source, and the image is not complete yet | Leave the image visible. Leave `[fallback]` off. `hasImage` is true, so a pending photo is not the initials state |

**Empty `src` with `srcset`.** A usable source is a non-blank `src` or a non-blank `srcset`. An image with an empty or missing `src` and a real `srcset` is not empty.

While that image is not complete, the outcome is pending: the runtime waits for `load` or `error`, does not set `[fallback]`, and does not hide the image. A whitespace-only `src` together with a whitespace-only `srcset` is empty and falls back immediately.

`src=""` with no `srcset` is empty.

Changing `src` or `srcset` drops the previous verdict. The image is classified again. A new `src` that is still broken does not dispatch a second `juice:change` when the avatar was already in fallback. A new `src` that is still loading clears fallback and does dispatch, because the state changed.

Several images in one avatar: a broken one stays hidden. The avatar is in fallback only when none is loaded and none is still loading. One loaded photo clears `[fallback]` even if a sibling image is broken.

Images added or removed later are picked up on the next sync. Removing the last image clears `[fallback]` and returns the initials state.

## DOM updates

Later DOM changes schedule `sync()` on the next animation frame. [Sync](./juice-runtime-behavior.md#sync).

The observer watches child-list changes and `avatar`, `src`, `srcset`, `fallback`, and `hidden`. `[scale]` and `[status]` stay CSS. Removing `[avatar]` drops the host. `destroy()` stops that observation.

`load` and `error` publish on the event. They are not deferred to that frame.

## Sig `bind()`

`@citrusworx/sigjs/juice` `bind(host, runtime?)` accepts avatar. `JuiceRuntimeName` in `libraries/sig/src/juice.ts` includes `"avatar"`. The host matcher looks for `[avatar]`, after the earlier matchers, so a host that already matches stays on that runtime.

`bind(avatar)` seeds a signal from `getState()`. `bind(avatar, "avatar")` does the same.

Avatar is read-only: there is no write API, and `state.set` does not call a controller. The next `juice:change` copies the host back over the signal.

On a Juice build that does not export `startAvatarRuntime` (published `@citrusworx/juiceui` 0.9.1 and 0.9.2; the export is on master only), binding avatar throws `Sig juice bind: "avatar" needs a newer @citrusworx/juiceui that exports startAvatarRuntime.` The module still loads, and the other runtimes still bind. Juice does not import Sig, and this runtime does not call `bind`.

`juice:change` and `getState()` still work without Sig. Listen on the host, or call `getState()` on the controller.

## Accessibility

Authors own the accessible name. This runtime does not read or write `alt`, `aria-label`, `aria-labelledby`, `title`, or the initials. It does not set `aria-hidden`. It does not invent initials.

**Photo and initials.** Prefer one name, not two.

- When the initials are the name, give the image an empty `alt` (`alt=""`). The initials stay in the accessibility tree, and the photo is decorative.
- When the image names the person, put that name in `alt` and do not also leave initials that repeat it.
- The runtime does not clear or fill `alt` when a photo fails. The initials show because the image is `hidden`. Write the `alt` you still want announced if the browser exposes a hidden image.

**Initials only.** An avatar with no image exposes its text. `AL` is an abbreviation. If that abbreviation is not the name you want spoken, put `aria-label` on the avatar (`aria-label="Ada Lovelace"`). `aria-label` on the host is the name. The runtime will not add one. `title` is not used by this runtime.

**Status dot.** The dot is a `::after` with empty `content`. It is not text, and it is not `role="status"`. Assistive tech will not announce online, away, busy, or offline from the dot. Put the status in the avatar's accessible name, or in text next to the avatar (`Ada Lovelace, away`). The runtime does not do that.

**+N chip.** `[avatar-more]` is plain text in the same box. `+3` is the accessible name of that chip. It is not a button, not `aria-hidden`, and not a widget the runtime enhances. An `[avatar]` whose text is `+3` is the same picture and the same text. Do not hide the count in an `aria-label` that disagrees with the visible `+N`.

```html
<span avatar status="online" aria-label="Ada Lovelace, online">
  <img alt="" src="ada.png">
  <span>AL</span>
</span>

<div avatar-group aria-label="4 people">
  <span avatar aria-label="Ada Lovelace">AL</span>
  <span avatar-more>+3</span>
</div>
```

The group label is the author's. Chrome does not set it.

## Limitations

- There is no `Avatar()` factory. Author the markup and let the runtime enhance it.
- Only `[avatar]` hosts are handled. `[avatar-group]` is a row. `[avatar-more]` stays text. A stray `<img>` is ignored.
- A broken, empty, or already-failed image sets `[fallback]` on the avatar and `hidden` on that image. A later successful load clears both. An empty `src` with a real `srcset` waits. Core CSS does not style `[fallback]`.
- `destroy()` keeps the fallback in place. It does not unhide the image.
- The runtime never touches `alt`, labels, or initials. The status dot has no text of its own. The `+N` chip is plain text.
- `hidden` that the author set is left alone.
- There is no focus trap and no Escape handling. Avatar is not a layered overlay. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering).
- There is no overlay z-index. The photo, the dot, and the group ladder stack inside the mark. See [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands).
- Sig `bind()` accepts this runtime and stays read-only. A Juice build without `startAvatarRuntime` throws `needs a newer @citrusworx/juiceui`. See [Sig `bind()`](#sig-bind).
- Shipped themes do not have to bind `--juice-avatar-*`. Tide lifts `--juice-avatar-status-away` only.

## Not to be confused with

| This | Not this |
| --- | --- |
| Initials or photo mark | Badge (`[badge]` is a pill; `[badge="square"]` is only the square precedent) |
| Same box sizes as a circle skeleton | `[skeleton="circle"]`, which is a loading placeholder |
| A non-control | `[icon-button="round"]`, which is a button |

## Related

- [Attributes](./juice-attributes.md)
- [Theme contract](./juice-theme-contract.md)
- [Runtime behavior](./juice-runtime-behavior.md)
- [Badge](./juice-badge.md)
- [Skeleton](./juice-skeleton.md)
- [Icon button](./juice-icon-button-runtime.md)
