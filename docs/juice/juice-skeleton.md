# Juice Skeleton

This document explains the current skeleton chrome in `libraries/juice/src/components/skeleton/skeleton.scss` (monorepo path; outside this vault).

Skeleton is CSS-only. Importing the core stylesheet is enough. There is no JS entry, no `createSkeleton`, no auto-enhance, and no `Skeleton()` Sig factory. Markup is the contract.

This surface is Emerging, not Stable. It is on master and is not in the published `@citrusworx/juiceui@0.9.2` npm cut. It is not one of the thirty Emerging auto-enhance runtimes. That count stays thirty.

Skeleton is a loading placeholder. It holds the shape of content that has not arrived. A spinner is a busy ring (`[spinner]`). A progress bar is a valued track (`[progress]` / `[progress-fill]`). Those two have runtimes. Skeleton does not.

## Markup

There is no HTML global `skeleton` attribute, and there is no `<skeleton>` element. `[skeleton]` is an attribute selector.

```html
<div skeleton></div>

<div skeleton="rect"></div>

<div skeleton="text"></div>

<div skeleton="text" lines="3"></div>

<div skeleton="text">
  <span>Harbor ferry times</span>
  <span>Loading the afternoon board.</span>
  <span width="60%">Shorter last line.</span>
</div>

<span skeleton="circle"></span>

<div skeleton="rect" scale="lg"></div>
<div skeleton="text" lines="4" scale="sm"></div>
<span skeleton="circle" scale="sm"></span>

<div skeleton static>Kept as a still base.</div>
```

| Attribute | What paints |
|---|---|
| `[skeleton]` | Rectangle. Boolean `[skeleton]` is the rect. |
| `[skeleton="rect"]` | The same rectangle. |
| `[skeleton="text"]` | One line-height bar, full width of the container. |
| `[lines="1"`…`"8"]` | On text, that many bars. A count. |
| Element children of `[skeleton="text"]` with no `[lines]` | Each child is one line. The parent does not paint a second bar. |
| `[skeleton="circle"]` | Circle. Size is the circle role. |
| `[scale="sm"\|"lg"]` | Rect height, circle size, or text line height and gap. Unmarked scale is the default role. |
| `[static]` | Shimmer off. The base color stays. |

A value other than `text`, `circle`, or `rect` is not its own shape. Geometry for the rectangle lives on `[skeleton]`, so an unknown value still paints that box. Use `rect`, `text`, or `circle`.

There is no `[skeleton-line]`. A line is not a separate component name. The parent supplies the meaning, which matches Juice attribute naming. `[lines]` is a count because a boolean cannot say how many bars to reserve when the copy is not in the DOM yet.

Copy inside stays in the accessibility tree and does not paint. Glyphs use `-webkit-text-fill-color: transparent`, which leaves `color` (and `currentColor`) alone.

Rect, circle, and `[lines]` children are clipped. Text-line children keep their box — that box is the bar — and hide glyphs.

Replaced content (`img`, `svg`, `video`, `canvas`, `picture`, `iframe`) is not shown. Authors own `aria-busy` and the accessible name.

This chrome does not set them. Do not expect paint from a bare `[aria-busy]` or `[role="status"]`.

Core CSS does not give `[skeleton]` a z-index. It is an inline placeholder. See [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands).

## Lines and stacked children

`[lines]` reserves a stack when the words are not in the markup yet. The host is one element. A repeating mask cuts that fill into bars. `1` through `8` are the counts. Anything else, including `lines="9"` or `lines="0"`, keeps the single bar.

```html
<p skeleton="text" lines="1"></p>
<div skeleton="text" lines="3"></div>
<div skeleton="text" lines="8" scale="lg"></div>
```

Height for a count of `n` is `n` line heights plus `n - 1` gaps. The mask is a repeating linear gradient: a solid band of `--juice-skeleton-line-height`, then a transparent gap of `--juice-skeleton-line-gap`.

Stacked children are the other pattern. Leave `[lines]` off. Each element child is one line, which is the right shape for one phrase per line and for a shorter last line.

```html
<div skeleton="text">
  <span>Morning departures</span>
  <span>The board is still loading.</span>
  <span width="60%">Last line.</span>
</div>
```

The parent’s own fill and sheen turn off. It becomes a grid with `row-gap` set to the line gap, and its height follows the children. A child that is not itself `[skeleton]` becomes the bar. A nested `[skeleton]` stays the shape it names (a circle inside a text stack stays a circle). The parent does not paint a second bar behind those children.

`width` on the last child shortens that line. Width and height utilities share specificity with the skeleton geometry and load later, so they can override it. The same utilities can narrow a rect host.

If `[lines]` is set, children are loading copy, not extra bars. They are clipped, and the mask paints the count. `[lines]` wins over the stacked-child pattern.

## Sizes

`[scale="sm"|"lg"]` steps the shape you already chose. Unmarked scale uses the default role.

| Shape | What `[scale]` changes | Default / `sm` / `lg` |
|---|---|---|
| Rect (`[skeleton]`, `[skeleton="rect"]`) | Height | `4rem` / `2.5rem` / `6rem` |
| Circle | Width and height | `2.5rem` / `1.5rem` / `4rem` |
| Text | Line height and the gap between lines | Height `0.75rem` / `0.5rem` / `1rem`. Gap `0.5rem` / `0.375rem` / `0.625rem` |

On text, scale reassigns `--juice-skeleton-line-height` and `--juice-skeleton-line-gap` on the host. Counted masks and stacked children both inherit that step. Circle size does not use the rect height. Rect height does not use the circle size.

The circle is `inline-block`, with `border-radius: 999px`. A rect host and a text host use `--juice-skeleton-radius` (`0.375rem`) on the outer box. Counted `[lines]` share that one rounded box: the mask cuts the gaps, and it does not round each bar on its own. Stacked children each get `--juice-skeleton-radius`.

```html
<div row gap="1rem" aria-busy="true">
  <span skeleton="circle" scale="lg"></span>
  <div skeleton="text" lines="3" scale="sm"></div>
</div>
```

## Static and reduced motion

The sweep is `juice-skeleton-shimmer`. It runs on a `::after` sheen: a horizontal gradient that moves from `-100%` to `100%`, timed with `--juice-skeleton-duration` and `--juice-motion-ease-linear`, looping.

The default duration is `calc(var(--juice-motion-duration-slow) * 1.6)`. Core `--juice-motion-duration-slow` is `1s`, so the default sweep is `1.6s`.

Override `--juice-skeleton-duration` to retune it. Do not put a literal `ms` or `s` on the animation.

`[static]` removes that sheen and keeps the base color. Use it when a placeholder should sit still even for people who have not asked for reduced motion.

```html
<div skeleton="text" lines="3" static></div>
```

`prefers-reduced-motion: reduce` does the same thing to every skeleton: the sheen is removed and the base stays. Collapsing the duration tokens is not enough. An infinite animation still iterates when its duration becomes `0.01ms`, so the pseudo is stopped outright (`animation: none` and `content: none`). See [Animations](./juice-animations.md#reduced-motion).

`[static]` and reduced motion both apply to the host sheen and to the sheen on stacked line children.

## Roles

Color defaults are stated on `:root` and again on `[theme]`. Geometry defaults are on `:root` only. Shipped library themes and generated `--jx-*` themes are not required to bind any `--juice-skeleton-*` name.

| Role | Default |
|---|---|
| `--juice-skeleton-base` | `color-mix(in srgb, currentColor 14%, var(--juice-surface-muted-bg, gray-200))` |
| `--juice-skeleton-highlight` | `color-mix(in srgb, white 35%, transparent)` |
| `--juice-skeleton-radius` | `0.375rem` |
| `--juice-skeleton-line-height` / `-sm` / `-lg` | `0.75rem` / `0.5rem` / `1rem` |
| `--juice-skeleton-line-gap` / `-sm` / `-lg` | `0.5rem` / `0.375rem` / `0.625rem` |
| `--juice-skeleton-circle-size` / `-sm` / `-lg` | `2.5rem` / `1.5rem` / `4rem` |
| `--juice-skeleton-rect-height` / `-sm` / `-lg` | `4rem` / `2.5rem` / `6rem` |
| `--juice-skeleton-duration` | `calc(var(--juice-motion-duration-slow) * 1.6)` |

`gray-200` is the unthemed fallback (`hsl(0, 0%, 90%)`). `white` here is `white-100`.

See the [Theme Contract](./juice-theme-contract.md) and [Attributes](./juice-attributes.md).

## Theming

The base mixes inherited ink (`currentColor` at 14%) into the shared muted surface. KiwiPress, Tide, and Aquaflux read correctly without a per-theme skeleton bind, because each theme already sets `--juice-surface-muted-bg` and the text color the bar inherits.

Color is restated on `[theme]` for a custom-property reason. A `var()` resolves on the element that sets the property. `:root` does not see a theme’s `--juice-surface-muted-bg`, so a formula that lived only on `:root` would bake the gray-200 fallback in for every descendant. `[theme]` states the same formula again. `currentColor` stays inside that value and resolves where the bar paints.

Do not set `color: transparent` on the host. That would resolve `currentColor` to transparent and wash the mix out. Glyphs are hidden with `-webkit-text-fill-color` so `color` can keep doing this job.

The highlight is a translucent white sheen (`white` at 35%, mixed with transparent). It is not `--juice-surface-strong-bg`. On Tide the strong surface is darker than the muted wash, and using that role as the highlight would invert the sweep.

On a pale muted surface the 35% white sheen can disappear into the bar. Tune `--juice-skeleton-highlight` there — a slightly stronger translucent white, or a low-alpha ink, still reads as a sheen. Override that one role. A full theme bind is not required. Keep the highlight translucent. A solid fill that matches the base will hide the sweep.

Swapping `theme` on unchanged markup retints the bar, because the `[theme]` formula reads that theme’s muted surface and inherited ink.

## Accessibility

Authors own the accessible name and the busy state. Chrome does not write `aria-busy`, `aria-live`, `role`, or a label.

**Busy region.** Put `aria-busy="true"` on the region that is loading — the card, the list, the section — not on every bar. `aria-busy` tells assistive tech the region is not ready. It does not by itself speak a sentence. A bare `[aria-busy]` is not skeleton chrome.

**What is still in the tree.** Copy inside a skeleton stays available to assistive tech.

- Rect, circle, and counted `[lines]` children are clipped (a 1px clip, not `display: none` and not `aria-hidden`).
- Stacked line children keep their box. The glyphs are transparent and still readable.
- Text written directly on a single-line or rect host is hidden with transparent text fill and is still in the tree.

Empty bars plus a name on the region are the quieter pattern. If the words inside the skeleton are placeholder copy, people using assistive tech will hear those words. Do not put dummy text in the bars unless that text is acceptable to announce.

**Announcing.** One polite live region for the fetch is enough. `aria-live="polite"` on the loading region, or on a single status next to it, can carry “Loading departures” and later the result. Do not put `role="status"` on each bar. Juice does not style that role, and a status per bar chatters. Skeleton does not set `role="status"` the way a shown `[spinner]` does.

```html
<section aria-busy="true" aria-live="polite" aria-label="Departures">
  <div skeleton="text" lines="4"></div>
</section>
```

**Swap for real content.** When the data arrives, replace the skeleton markup with the real content in that same region and remove `aria-busy` (or set it to `false`). Leave the live region if the swap should be announced.

```html
<section aria-live="polite" aria-label="Departures">
  <h2>Afternoon board</h2>
  <p>The 4:10 ferry is on time.</p>
</section>
```

Do not leave `[skeleton]` on the real content. The chrome would keep the glyphs unpainted. Do not leave `aria-busy="true"` on the loaded region. Removing the placeholder and clearing the busy state in the same update is the whole handoff. There is no runtime to call.

A spinner is the control for “working” when there is no content shape yet. A skeleton is the shape of the content that will replace it. They can sit in the same region. They do not toggle each other.

## Limitations

- CSS-only. No `Skeleton()` factory, no `createSkeleton`, and no auto-enhance. The JS entry does not boot a skeleton runtime.
- Emerging, not Stable. On master, and not in the published `@citrusworx/juiceui@0.9.2` npm cut. The thirty-one Emerging runtimes stay thirty-one. Spinner remains the twenty-first. Icon button remains the twenty-sixth. Avatar is the twenty-seventh. Table is the twenty-eighth.
- This is not a spinner. `[spinner]` is an indeterminate ring with a runtime that sets `role="status"` and `aria-busy` while shown. See [Spinner Runtime](./juice-spinner-runtime.md).
- This is not a progress bar. `[progress]` / `[progress-fill]` is a valued bar, including `progress="indeterminate"`. See [Progress Runtime](./juice-progress-runtime.md).
- `[lines]` accepts `1` through `8`. Any other count keeps one bar. There is no `[skeleton-line]`.
- `[lines]` and stacked children are two patterns. With `[lines]`, children are clipped copy. Without `[lines]`, element children are the lines.
- `[static]` and `prefers-reduced-motion: reduce` remove the sheen and keep the base. The duration tokens collapsing is not what stops the loop.
- Authors own `aria-busy`, live regions, and the accessible name. Chrome does not set them and does not style a bare `[aria-busy]` or `[role="status"]`.
- Copy stays in the accessibility tree. Clipping and transparent text fill hide paint, not the text.
- There is no z-index elevation. Skeleton is an inline placeholder. See [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands).
- Shipped themes do not bind `--juice-skeleton-*`. Color on `[theme]` follows muted surface and inherited ink. Tune `--juice-skeleton-highlight` on pale surfaces. The highlight stays a translucent white sheen, not `--juice-surface-strong-bg`.

## Where this sits

Cards, badges, and stats are the other CSS-only structural hooks: markup plus theme paint, no runtime. List and safe area are CSS-only too.

Safe area only pads. Skeleton follows that shape, with its own roles and a dedicated page because the loading contract is easy to confuse with spinner and progress.

See [Badge](./juice-badge.md) [List](./juice-list.md)

[Safe Area](./juice-safe-area.md) [Cards](./juice-cards.md)

[Styles](./juice-styles.md) [Attributes](./juice-attributes.md)

and the [maturity matrix](./juice-maturity-matrix.md).
