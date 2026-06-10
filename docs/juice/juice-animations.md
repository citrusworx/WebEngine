# Juice Motion (Beta)

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

## Gradient motion (separate namespace)

Animated gradients use the **`animation`** attribute on gradient-bearing elements, not `motion`:

| Value | Element | Behavior |
|-------|---------|----------|
| `flow` | `[gradient]` (non-text) | Flowing gradient overlay |
| `fall` | `body[gradient]` | Falling gradient background |

See [Juice styles](./juice-styles.md) for gradient attributes.

## Beta-supported motions

### P0 (documented, tested, reduced-motion safe)

| `motion` value | Description |
|----------------|-------------|
| `fade.in` | Fade in (1s) |
| `fade.in::fast` | Fade in (0.3s) |
| `fade.out` | Fade out |
| `slideIn.left` | Slide in from left |
| `slideIn.left::fast` | Fast slide in |
| `slideIn.left::slow` | Slow slide in |
| `spin` | Continuous rotation |
| `spin::fast` | Fast spin |
| `spin::slow` | Slow spin |
| `pulse` | Scale pulse |
| `grow` | Grow emphasis |
| `accordion` | Accordion panel easing |
| `blink` | Default blink |
| `blink:slow` | Slow blink |
| `blink:fast` | Fast blink |
| `blink:signal` | Signal-style blink |
| `blink:terminal` | Terminal cursor blink |

### P1 (supported, less hardened)

| `motion` value | Description |
|----------------|-------------|
| `bounce` | Subtle vertical bounce |
| `bounce.in` / `bounce-in` / `bounce.in` | Enter from off-screen left |
| `bounce.out` / `bounce-out` / `bounce.out` | Exit to off-screen left |
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

## Reduced motion

When the user prefers reduced motion, Juice disables **`motion`** animations and shortens transition utilities. Authors should not rely on motion for essential information.

```css
/* Applied globally via _motion-reduced.scss */
@media (prefers-reduced-motion: reduce) { … }
```

## Class-based slide helpers (legacy)

[slidein.scss](../../libraries/juice/src/styles/animations/slidein.scss) also defines classes `.slideInRight`, `.slideInOutLeft`, and `.slideInOutRight` without `motion` attributes. Prefer `motion="slideIn.left"` for new work.
