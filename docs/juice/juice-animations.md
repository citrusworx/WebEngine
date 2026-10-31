# Juice Motion (Emerging)

Motion core shipped in `@citrusworx/juiceui@0.9.2` and stays **Emerging**. The 0.9.1 tarball still has the earlier attribute catalog. Token timing, the shared helper, and overlay enter/exit shipped in 0.9.2.

## Canonical attribute: `motion`

Use the **`motion`** attribute for entrance, exit, and attention animations on elements.

```html
<div motion="fade.in">…</div>
<button motion="spin::fast">…</button>
```

### Naming conventions

| Pattern | Example | Meaning |
|---------|---------|---------|
| `family` | `motion="pulse"` | Base motion |
| `family.variant` | `motion="fade.in"` | Variant within a family |
| `family::speed` | `motion="spin::fast"` | Speed modifier (double colon) |
| `family:modifier` | `motion="blink:slow"` | Named variant (single colon) |

Legacy spellings such as `bounce-in` and `bounce.in` are accepted where documented per family.

### Deprecated aliases (blink only)

For **`blink`** motions only, Juice still matches **`animation`** and **`animate`** with the same values. Prefer **`motion`** for new markup; aliases may be removed in a future major release.

```html
<!-- Preferred -->
<span motion="blink:signal">Live</span>

<!-- Deprecated -->
<span animation="blink:signal">Live</span>
```

## Motion tokens

Core CSS owns the defaults in `libraries/juice/src/styles/animations/_motion.scss`. Themes may override `--juice-motion-*`. See [Theme Contract](./juice-theme-contract.md) and [Theme authoring](./juice-theme-authoring.md).

### Duration and ease

| Token | Default | Role |
|-------|---------|------|
| `--juice-motion-duration-instant` | `0.15s` | Short property changes (hover, color) |
| `--juice-motion-duration-fast` | `0.2s` | Exit and dismiss |
| `--juice-motion-duration-base` | `0.3s` | Enter and accordion height |
| `--juice-motion-duration-slow` | `1s` | Catalog loops and one-shots; off-scale timings multiply this |
| `--juice-motion-ease-standard` | `ease` | Property transitions |
| `--juice-motion-ease-enter` | `ease-out` | Overlay enter |
| `--juice-motion-ease-exit` | `ease-in` | Overlay exit |
| `--juice-motion-ease-linear` | `linear` | Catalog fades, slides, and spins |

### Derived roles

These two curves are core-owned. The four ease roles above cannot reproduce them without a feel change. Generated `--jx-*` themes do not pass them through. A theme may still override them.

| Token | Default | Used by |
|-------|---------|---------|
| `--juice-motion-ease-in-out` | `ease-in-out` | Bounce, blink, progress indeterminate, accordion height |
| `--juice-motion-ease-steps` | `steps(2, end)` | `blink:terminal` |

Off-scale keyframe durations stay exact by multiplying `--juice-motion-duration-slow` (`0.4`, `0.5`, `0.6`, `0.8`, `1.2`, `1.4`, `1.6`, `2`, `3`, `3.4`, `4`, `5`, `7`, `8`, `10`).

### Component hooks

| Token | Default | Job |
|-------|---------|-----|
| `--juice-spinner-spin-duration` | `calc(var(--juice-motion-duration-slow) * 0.8)` | Spinner ring loop |
| `--juice-progress-indeterminate-duration` | `calc(var(--juice-motion-duration-slow) * 1.2)` | Indeterminate progress loop |
| `--juice-skeleton-duration` | `calc(var(--juice-motion-duration-slow) * 1.6)` | Skeleton sheen (`juice-skeleton-shimmer`). `[static]` and reduced motion remove the sweep and keep the base. |

`prefers-reduced-motion` stops the spinner spin and leaves the indicator. It stops the indeterminate progress animation.

It removes the skeleton sheen and leaves the base color. It sets `transition: none` on interactive `[list]` rows, which otherwise ease background and color with `--juice-motion-duration-fast` and `--juice-motion-ease-standard`.

It sets `transition: none` on `[table]` body rows, header and footer cells, and the sort caret, which otherwise ease background or caret opacity with those same tokens. Those stops are separate from the `[motion]` rule below.

Skeleton is CSS-only — see [Skeleton](./juice-skeleton.md). List is CSS-only — see [List](./juice-list.md).

Table row and caret motion is in [Table](./juice-table.md).

The `overlay-close-transition` mixin paints the shared close control (modal, drawer, popover, banner, toast): background and color over `--juice-motion-duration-fast` with `--juice-motion-ease-standard`. Each of those components sets `transition: none` on its close control under reduced motion.

## Reduced motion

One strategy, in CSS and in JS. Authors should not rely on motion for essential information.

### CSS

`prefers-reduced-motion: reduce` collapses the four duration tokens to `0.01ms` on `:root` and `[theme]`, with `!important`, so a theme pass-through literal cannot keep a long duration.

Loops also set `animation: none`. A collapsed duration on an infinite animation would still iterate.

Every `[motion]` element gets:

- `animation: none !important`
- `transition-duration` and `transition-delay` set to `--juice-motion-duration-instant` (itself `0.01ms` in this media query)

`blink` also forces `opacity: 1`, `transform: none`, and `filter: none` so a paused blink does not stay dim.

### JS

`libraries/juice/src/js/src/shared/motion.ts`:

- `prefersReducedMotion()` reads `matchMedia('(prefers-reduced-motion: reduce)')`. It returns `false` when `matchMedia` is missing (SSR, jsdom) or throws.
- `subscribeReducedMotion(listener)` reports later changes and returns an unsubscribe function. The unsubscribe is a no-op in those same environments.
- `runMotion` finishes in the same turn when reduced motion is on, or when the computed duration is `0`. `immediate: true` means the caller can set `hidden` or restore focus before it returns. A resolved promise alone would wait a microtask and miss that contract.
- If reduced motion turns on mid-flight, the current enter or exit finishes immediately.

## `data-motion-state` and the helper API

The helper is exported from `@citrusworx/juiceui` and stays Emerging. It is not a component factory.

| Export | Job |
|--------|-----|
| `prefersReducedMotion()` | Current reduced-motion match |
| `subscribeReducedMotion(listener)` | Subscribe; returns unsubscribe |
| `createMotionCancelToken()` | Token whose `cancel()` abandons an in-flight enter or exit |
| `runMotion(element, direction, token?)` | Drive one element. `direction` is `'enter'` or `'exit'` |
| `createElementMotion()` | One cancel token per element. A later enter or exit replaces the previous one |

`runMotion` writes `data-motion-state`:

| Direction | While playing | When finished |
|-----------|---------------|---------------|
| `enter` | `entering` | `entered` |
| `exit` | `exiting` | `exited` |

It resolves on `transitionend` or `animationend` whose target is that element. Events that bubble from children are ignored. If the event never arrives, a timeout fires after the longer of the computed transition and animation timelines (duration plus delay).

Cancelling does not apply the terminal state. `createElementMotion().cancel(element)` and `.destroy()` cancel in-flight plays.

`MotionResult.immediate` is `true` when the terminal state was applied before `runMotion` returned. `finished` resolves with `{ completed: true }` when the terminal state was applied, and `{ completed: false }` when the play was cancelled.

## Overlay enter and exit

Modal, drawer, sheet, popover, and toast use this lifecycle. Enter removes `hidden`, then plays. Exit plays first. `hidden` is set only after exit finishes (`data-motion-state="exited"`, or the same turn when motion is instant). Reduced motion, or a computed duration of `0`, does both in the same turn.

An in-flight exit stays the open surface until that commit. A new open cancels the exit.

### Modal

`[modal-overlay][data-motion-state]`:

| State | Overlay | Panel |
|-------|---------|-------|
| `entering` | Fade in, `--juice-motion-duration-base`, `--juice-motion-ease-enter` | Rise from `translateY(0.75rem)` |
| `exiting` | Fade out, `--juice-motion-duration-fast`, `--juice-motion-ease-exit` | Drop to `translateY(0.75rem)` |
| `exited` | `opacity: 0` | `translateY(0.75rem)` |

### Drawer

`[drawer-overlay][data-motion-state]`. The scrim fades on the same enter/exit tokens as modal. The panel slides on the edge:

| Edge | Enter from | Exit to |
|------|------------|---------|
| default / `right` | `translateX(100%)` | `translateX(100%)` |
| `left` | `translateX(-100%)` | `translateX(-100%)` |

### Sheet

`[sheet-overlay][data-motion-state]`. The scrim fades on the same enter/exit tokens as modal. The panel slides on the bottom edge: enter from `translateY(100%)` to none, exit back to `translateY(100%)`. `[dragging]` sets `transition: none` so a drag can write height. `prefers-reduced-motion: reduce` sets `transition: none` on `[sheet]` and `[sheet-close]`. See [Sheet](./juice-sheet-runtime.md).

### Popover

`[popover-root][data-motion-state]` fades the root. The panel shifts `0.5rem` from the trigger side, on the same enter (`base` / `enter`) and exit (`fast` / `exit`) tokens:

| Placement | Enter from | Exit to |
|-----------|------------|---------|
| default / `bottom` | `translateY(-0.5rem)` | `translateY(-0.5rem)` |
| `top` | `translateY(0.5rem)` | `translateY(0.5rem)` |
| `left` | `translateX(0.5rem)` | `translateX(0.5rem)` |
| `right` | `translateX(-0.5rem)` | `translateX(-0.5rem)` |

### Toast

`[toast][data-motion-state]` fades and travels `0.75rem`. Top regions (default, `top-right`, `top-left`) use `translateY(-0.75rem)`. `bottom-right` and `bottom-left` use `translateY(0.75rem)`. Enter uses `base` / `enter`. Exit uses `fast` / `exit`. Toast is not a dialog: there is no focus trap, and show does not move focus in.

### Events and focus during exit

For modal, drawer, sheet, and popover, the surface stays open until `hidden` is set. The focus trap and Escape still apply during exit. A second Escape does not start a second exit. Focus restores to the opener after `hidden` is set, not when the exit animation starts.

Toast has no focus trap. Escape still dismisses the most recently shown visible toast (same yield rules as before). `hidden` is set after the exit finishes. Showing a toast that is exiting cancels the exit and leaves it open.

## Reading-time timers

These timers are not motion. Reduced motion does not shorten them.

- Toast auto-dismiss reads `toast-duration`, or `defaultDuration` (`5000` ms). `0`, `Infinity`, and negative values stay sticky. Pointer or focus inside the toast still pauses the timer.
- Tooltip hide delay is the grace after pointer leave or blur (default `150` ms, `hideDelay` on `createTooltip`). It is not a motion duration.

## Accordion height

`[motion="accordion"]` must be on the **panel**, not the trigger. `ease.scss` transitions that element's height (`--juice-motion-duration-base`, `--juice-motion-ease-in-out`).

Accordion and disclosure measure `scrollHeight`, set an explicit pixel height, then let the transition run. Native `hidden` cannot interpolate to or from `auto`, so:

- `aria-expanded` updates immediately
- expand removes `hidden` before the height transition
- collapse sets `hidden` only after the height transition finishes

Without the attribute, show and hide stay an instant `hidden` toggle. Reduced motion also stays instant, even when the attribute is present.

## Beta-supported motions

### P0 (documented, tested, reduced-motion safe)

The P0 catalog CSS gate checks each selector below: it compiles, its keyframes compile (accordion is a height transition, not keyframes), the timing uses `--juice-motion-*` rather than a duration literal, and reduced motion neutralises `[motion]`.

| `motion` value | Description | Timing |
|----------------|-------------|--------|
| `fade.in` | Fade in | slow, linear |
| `fade.in::fast` | Fade in | base, linear |
| `fade.out` | Fade out | slow, linear |
| `slideIn.left` | Slide in from left | slow × 1.2, linear |
| `slideIn.left::fast` | Fast slide in | slow × 0.4, linear |
| `slideIn.left::slow` | Slow slide in | slow, exit ease |
| `spin` | Continuous rotation | slow × 2, linear |
| `spin::fast` | Fast spin | slow × 0.5, linear |
| `spin::slow` | Slow spin | slow × 4, linear |
| `pulse` | Scale pulse | slow × 5, standard |
| `grow` | Grow emphasis | slow × 2, linear |
| `accordion` | Panel height easing. Opt-in on the panel. Show/hide still uses native `hidden` | base, in-out |
| `blink` | Default blink | slow × 1.6, in-out |
| `blink:slow` | Slow blink | slow × 3.4, in-out |
| `blink:fast` | Fast blink | slow × 1.4, in-out |
| `blink:signal` | Signal-style blink | slow × 2, in-out |
| `blink:terminal` | Terminal cursor blink | slow × 1.2, steps |

### P1 (supported, less hardened)

P1 is not part of the P0 CSS gate.

| `motion` value | Description |
|----------------|-------------|
| `bounce` | Subtle vertical bounce |
| `bounce.in` / `bounce-in` | Enter from off-screen left |
| `bounce.out` / `bounce-out` | Exit to off-screen left |
| `wiggle` | Wiggle |
| `tilt` | Tilt (hover-enhanced) |
| `turn` | Turn (hover-enhanced) |
| `turn::fast` / `turn::slow` | Turn speed variants |
| `flash:red` | Red flash |
| `flicker` | Flicker |
| `bg.alive` | Background gradient motion (see gradial) |
| `fade.in.down` | Fade in while moving down into place |
| `fade.in.down::fast` | Fast fade in down |
| `fade.in.up` | Fade in while moving up into place |
| `fade.in.up::fast` | Fast fade in up |
| `fade.out.down` | Fade out while moving down |
| `fade.out.up` | Fade out while moving up |
| `slideOut.left` | Slide out to the left |
| `slideOut.left::fast` | Fast slide out left |
| `slideOut.right` | Slide out to the right |
| `slideOut.right::fast` | Fast slide out right |
| `slideOut.up` | Slide out upward |
| `slideOut.up::fast` | Fast slide out up |
| `slideOut.down` | Slide out downward |
| `slideOut.down::fast` | Fast slide out down |

### Post-Beta

Planned motions are listed in [juice-animations-roadmap.md](./juice-animations-roadmap.md).

## Gradient motion (separate namespace)

Animated gradients use the **`animation`** attribute on gradient-bearing elements, not `motion`:

| Value | Element | Behavior |
|-------|---------|----------|
| `flow` | `[gradient]` (non-text) | Flowing gradient overlay |
| `fall` | `body[gradient]` | Falling gradient background |

See [Juice styles](./juice-styles.md) for gradient attributes. Gradient shift timing reads `--juice-motion-duration-slow` and `--juice-motion-ease-linear`.

## Class utilities

### `.t-*` (keep)

Token-driven transition utilities. They are not the entrance catalog. Prefer `motion` for entrance, exit, and attention. Keep these when an author wants a property transition on the base duration and standard ease:

| Class | Transition |
|-------|------------|
| `.t-all` | `all` |
| `.t-width` | `width` |
| `.t-height` | `height` |
| `.t-flex` | `flex` |
| `.t-bg` | `background-color` |

Each uses `--juice-motion-duration-base` and `--juice-motion-ease-standard`. Reduced motion sets `transition: none` on all five.

### `.sm-to-md` (deprecated)

Deprecated in documentation only. The CSS stays, so existing markup does not break, and reduced motion still sets `transition: none`.

`.sm-to-md` sets `width: 15vw`. `.sm-to-md.expand` sets `width: 30vw`. The width change uses `--juice-motion-duration-slow` and `--juice-motion-ease-standard`. Nothing in Juice components uses it. Do not add it to new markup. Use layout attributes, or `[motion="accordion"]` on a panel when the job is height.

## Class-based slide helpers (legacy)

`libraries/juice/src/styles/animations/slidein.scss` also defines classes `.slideInRight`, `.slideInOutLeft`, and `.slideInOutRight` without `motion` attributes. Prefer `motion="slideIn.left"` for new work.
