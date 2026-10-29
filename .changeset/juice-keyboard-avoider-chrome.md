---
"@citrusworx/juiceui": patch
---

Add keyboard-avoider chrome (`[keyboard-avoider]`, `[keyboard-avoider~="padding"]`, `[keyboard-avoider~="translate"]`, `[keyboard-avoider~="footer"]`) and the `--juice-keyboard-inset`, `--juice-keyboard-duration`, and `--juice-keyboard-easing` roles on `:root`. Padding mode sets `padding-bottom` from the inset. Translate shifts with `translateY`. Footer is `position: sticky` with `bottom` set to the inset. With `[safe-area]` in padding mode, bottom padding is `max(var(--juice-safe-area-pad), env(safe-area-inset-bottom, 0px), var(--juice-keyboard-inset))`. No runtime. Shipped themes do not bind the roles. `interactive-widget=resizes-content` is a documented alternative on Chrome Android 108+.
