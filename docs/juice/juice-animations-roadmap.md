# Juice animations roadmap (post-Beta)

Motions not yet implemented. Track here instead of inline SCSS comments.

## Entrance / exit families

- Bounce Out Left, Bounce Out Right
- Flip, Flip In X, Flip In Y, Flip Out X, Flip Out Y
- Light Speed In, Light Speed Out
- Roll In, Roll Out
- Rotate In / Out and corner variants
- Zoom In / Out and directional variants

Implemented in Beta (see [juice-animations.md](./juice-animations.md)): fade in/out directional variants; slideOut left, right, up, down.

## Berillium-style extras

- Jelly, Heartbeat, Wobble, Rubber Band, Swing, Hinge, Skew, Shake
- Fade out with shrink
- Parallax scroll, Drift, Starburst, Glitch, Ripple
- Flip card, Reveal, Wave, Float, Earthquake, 3D rotate

## Implementation notes

- New families should use `[motion="family.variant"]` and live in `libraries/juice/src/styles/animations/<family>.scss`.
- Forward from `animate.scss` and document in [juice-animations.md](./juice-animations.md) when promoted to P0 or P1.
