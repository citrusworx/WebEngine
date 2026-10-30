/**
 * DOM-first runtime for Juice keyboard-avoider chrome.
 *
 * Markup contract (Slice A — do not rename attrs):
 *   [keyboard-avoider]               host. Padding mode. Any unknown
 *                                    value is still a host. Words
 *                                    compose, same as the CSS.
 *   [keyboard-avoider="padding"]     padding mode. Matches ~= .
 *   [keyboard-avoider~="translate"]  translateY by the inset.
 *   [keyboard-avoider~="footer"]     sticky; bottom is the inset.
 *   [keyboard-avoider~="noscroll"]   this runtime does not
 *                                    scrollIntoView a focus inside
 *                                    that host. The word is behavior,
 *                                    not a layout mode. CSS ignores it.
 *   [keyboard-open]                  set on <html> and on each host
 *                                    while the keyboard is open.
 *                                    Slice A does not select it. The
 *                                    inset is the layout input.
 *
 * The overlap is the layout viewport minus the visual viewport:
 *
 *   inset = max(0, round(innerHeight - (visualViewport.height + visualViewport.offsetTop)))
 *
 * iOS reports part of that overlap as offsetTop. Leaving it out
 * counts the keyboard twice. Chrome Android with
 * interactive-widget=resizes-content shrinks innerHeight with the
 * keyboard, so the same formula is about 0 and this runtime does not
 * pad on top of the layout viewport. Pinch zoom (visualViewport.scale
 * other than 1) skips the update and leaves the previous inset.
 *
 * While open, the inset is written as `<n>px` on
 * document.documentElement (the <html> element), not on each host.
 * --juice-keyboard-inset inherits. When the keyboard is not open the
 * inline property is removed. A closed keyboard must not leave an
 * inline length behind: an inline value beats both the 0px role on
 * :root and the @supports env(keyboard-inset-height) fallback. Clearing
 * it is what lets that fallback show through. getState().inset is still
 * the measured overlap. Only the custom property is cleared.
 *
 * open is inset > threshold (default 80) and an editable element has
 * focus. Editable is a text-like input, the same set as the Input
 * runtime (missing type, empty type, text, email, password, search,
 * tel, url, number), plus a textarea, a select, or [contenteditable]
 * (including a focused descendant). A hardware keyboard does not
 * shrink the visual viewport, so a focused field stays closed. Every
 * other input type is not editable: checkbox, radio, range, date,
 * time, datetime-local, month, week, color, file, hidden, button,
 * submit, reset, and image.
 *
 * Listeners: visualViewport resize and scroll, window resize and
 * orientationchange, focusin and focusout on root. Updates are
 * coalesced with requestAnimationFrame. This runtime does not set
 * navigator.virtualKeyboard.overlaysContent.
 *
 * Scroll-into-view is on by default. focusin inside a host remembers
 * the focused element. The scroll runs two frames after geometry
 * events go quiet, so a resize burst settles before the element moves,
 * and the inset written on the first of those frames is the one layout
 * sees. A focus that never resizes still scrolls on that quiet window.
 * The call is element.scrollIntoView({ block: 'nearest', behavior })
 * with behavior 'auto' when prefersReducedMotion() is true and 'smooth'
 * otherwise. [keyboard-avoider~="noscroll"] or scrollIntoView: false
 * opts out. destroy cancels a pending scroll.
 *
 * State is { open, inset }. juice:change bubbles from each host with
 * detail { runtime: 'keyboard-avoider', state }. The first observation
 * is silent. Later events fire when open flips, or when the inset has
 * moved by at least `threshold` pixels from the last published inset
 * while open. Smaller steps still update the custom property and
 * getState. They accumulate against the last published inset, so a
 * slow drift still publishes once it is stale by `threshold`.
 *
 * No window, or no visualViewport, is a no-op (SSR and old browsers).
 * getState then returns { open: false, inset: 0 }. No Sig
 * KeyboardAvoider factory. Keyboard-avoider is the thirty-first
 * Emerging auto-enhance runtime.
 */
export type KeyboardAvoiderOptions = {
    root?: ParentNode;
    keyboardAvoiderSelector?: string;
    threshold?: number;
    scrollIntoView?: boolean;
};
export type KeyboardAvoiderState = {
    open: boolean;
    inset: number;
};
export type KeyboardAvoiderController = {
    destroy: () => void;
    sync: () => void;
    getState: (target?: HTMLElement | null) => KeyboardAvoiderState | null;
};
export declare const createKeyboardAvoider: (options?: KeyboardAvoiderOptions) => KeyboardAvoiderController;
export declare const initKeyboardAvoider: (options?: KeyboardAvoiderOptions) => KeyboardAvoiderController;
export declare const startKeyboardAvoiderRuntime: () => KeyboardAvoiderController | null;
export declare const stopKeyboardAvoiderRuntime: () => void;
