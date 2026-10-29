/**
 * DOM-first runtime for Juice pressable chrome.
 *
 * Markup contract (Slice A — do not rename attrs):
 *   [pressable]              host. Any value, including "scale", is still
 *                            a pressable. Sync does not rewrite it.
 *   [pressed]                transient press. This runtime sets it only
 *                            for the gesture, and only when it added the
 *                            attribute. It is not a latched toggle.
 *   [pressable-longpress]    opt-in. Absent, the host does not arm a
 *                            long-press. Present with an empty value or
 *                            "true", the delay is `longPressDelay`
 *                            (default 500). A non-negative number is the
 *                            delay in milliseconds. "false" does not arm.
 *                            Any other value uses the default delay.
 *   [pressable-slop]         optional pixel slop for this host. A
 *                            non-negative number overrides `moveSlop`
 *                            (default 10). Anything else uses the option.
 *
 * Pointer:
 *   Primary pointerdown (mouse button 0, touch, or pen, and a primary
 *   pointer) sets the transient press. It clears on pointerup,
 *   pointercancel, pointerleave, pointerout that leaves the host,
 *   pointermove whose target is outside the host, lostpointercapture,
 *   and blur of the host itself. Moving farther than the slop, or a
 *   scroll whose target is the host or an ancestor (including the
 *   document), cancels the press and drops a pending long-press.
 *   pointermove and touch scrolling are not preventDefault'd.
 *   touch-action stays in CSS.
 *
 * Keyboard:
 *   Enter or Space on the host itself sets the transient press while
 *   the key is held, including on a native button. Native buttons
 *   already match :active; the attribute is set too so the pressed
 *   ring matches a pointer press. Keyup clears it. Repeat keydowns
 *   do not restart the gesture. Enter is never preventDefault'd, so
 *   a native click still fires. Space is preventDefault'd only on a
 *   custom button-like host, so the page does not scroll. That host's
 *   first role token is button, switch, checkbox, radio, menuitem,
 *   menuitemcheckbox, menuitemradio, option, tab, or treeitem, and
 *   the host is not a native control that already owns Space (button,
 *   input, textarea, select, summary, or contenteditable). A pressable
 *   with no button-like role is left alone, and role="link" keeps the
 *   scroll. Long-press is pointer-only. The host has to be the event
 *   target. This runtime does not add tabindex or role.
 *
 * Long-press:
 *   Armed only when [pressable-longpress] enables it. After the delay,
 *   the host dispatches a bubbling, cancelable, composed
 *   `juice:longpress` CustomEvent. detail is
 *   `{ pressed: true, longPressed: true }`. If the event is not
 *   preventDefault'd, the click that follows that gesture is
 *   suppressed once (capture-phase preventDefault and
 *   stopPropagation). If the event is canceled, the click is left
 *   alone. A slop or scroll cancel before the timer fires does not
 *   long-press and does not suppress the click. If the long-press
 *   already fired, a later cancel still suppresses that one click.
 *   The suppress flag expires on that click or on the next turn, so
 *   a later click is not swallowed.
 *
 * Latched [pressed]:
 *   [icon-button][toggle] and any host with aria-pressed own [pressed]
 *   as a latched toggle. This runtime never sets or removes [pressed]
 *   on those hosts. The gesture is still getState().pressed and still
 *   dispatches juice:change. :active paints the ring. On every other
 *   host, [pressed] is set only when it was absent, and removed only
 *   when this runtime added it. An author [pressed] that was already
 *   there is left in place.
 *
 * Disabled:
 *   :disabled (the disabled property), [disabled], and
 *   [aria-disabled="true"] do not press and do not long-press. A host
 *   that becomes disabled during a press is cleared.
 *
 * State is { pressed, longPressed }. pressed is the transient gesture,
 * not a latched attribute. longPressed is true only after
 *   juice:longpress has fired for the current gesture. Both return to
 *   false when the gesture ends. The first observation is recorded
 *   and does not dispatch. Later changes dispatch a bubbling
 *   juice:change CustomEvent with detail
 *   { runtime: "pressable", state }.
 *
 * Reduced motion stays in CSS. This runtime does not read
 * prefers-reduced-motion and does not animate. No Sig Pressable
 * factory. Pressable is the twenty-ninth Emerging auto-enhance
 * runtime.
 */
export type PressableOptions = {
    root?: ParentNode;
    pressableSelector?: string;
    longPressDelay?: number;
    moveSlop?: number;
};
export type PressableState = {
    pressed: boolean;
    longPressed: boolean;
};
export type PressableController = {
    destroy: () => void;
    sync: () => void;
    getState: (target?: HTMLElement | null) => PressableState | null;
};
export declare const createPressable: (options?: PressableOptions) => PressableController;
export declare const initPressable: (options?: PressableOptions) => PressableController;
export declare const startPressableRuntime: () => PressableController | null;
export declare const stopPressableRuntime: () => void;
