/**
 * DOM-first runtime for Juice touchable-row chrome.
 *
 * Markup contract (Slice A — do not rename attrs):
 *   [touchable-row]              host. Any value is still a row. Words
 *                                compose, same as the CSS: dense,
 *                                chevron, undivided, plus the two words
 *                                this runtime owns.
 *   [touchable-row~="select"]    opt-in. Activation toggles selection.
 *                                Absent, the row does not toggle.
 *                                getState().selected still reports the
 *                                CSS selected state.
 *   [touchable-row~="activate"]  explicit opt-in for keyboard chrome
 *                                when the row is not [pressable] and
 *                                not selectable. See below.
 *   [selected]                   selected signal, with aria-selected
 *                                or aria-current. CSS paints the start
 *                                bar from any of the three.
 *   [pressable]                  press feedback stays on Pressable.
 *                                This runtime does not set [pressed].
 *
 * Why those words, and not [touchable-row-select]: dense, chevron,
 * and undivided already compose on the host attribute. Selection and
 * the keyboard opt-in are host behavior, not slots.
 * [touchable-row-leading], [touchable-row-content], [touchable-row-title],
 * [touchable-row-subtitle], and [touchable-row-trailing] are the parts.
 * A [touchable-row-select] attribute would read as another part.
 *
 * Keyboard activation:
 *   Enter or Space on a non-native host (not `a` or `button`) dispatches
 *   one bubbling click. Repeat keydowns do not. Enter is never
 *   preventDefault'd. Space is preventDefault'd only on those
 *   non-native hosts, so the page does not scroll (the same reason as
 *   the Pressable Space fix, applied to every li/div row rather than
 *   only to a button-like role). Native `a` and `button` already
 *   activate from the platform — Enter on a link, Enter and Space on
 *   a button — and this runtime does not dispatch a second click and
 *   does not preventDefault Space on them. An `<a>` without href is
 *   still native: give it an href, or use a div with select / activate
 *   / pressable. An editing host is left alone so Space can type.
 *   A [menuitem] host (the attribute, or a menuitem role) is left
 *   alone on the key. The menu runtime owns Enter and Space and clicks
 *   the item once. This runtime still sees that click.
 *
 *   Keys and clicks that start in an interactive descendant do not
 *   activate the row, so a trailing control works on its own. The
 *   descendant is a button, a, input, textarea, select, summary,
 *   [switch], [icon-button], [menuitem], an editing host, or an
 *   element whose first role token is button, switch, checkbox, radio,
 *   link, menuitem, menuitemcheckbox, menuitemradio, option, tab,
 *   textbox, searchbox, combobox, slider, or spinbutton.
 *
 * Role and tabindex:
 *   A plain row is a layout shell. Sync does not give it a role or a
 *   tabindex, or it would enter the tab order just by being drawn.
 *   Chrome is added only when the row is interactive, the author has
 *   not set that attribute, the host is not native, and the host is
 *   not a menuitem:
 *     [pressable]                   the row is a press target
 *     [touchable-row~="select"]     the row toggles selection
 *     [touchable-row~="activate"]   explicit opt-in
 *   The added role is "button" and the added tabindex is "0". An
 *   author role or tabindex is kept, including role="link". Native
 *   links and buttons already have a platform role and tab stop.
 *   Menuitems keep the role the menu runtime writes. A disabled row
 *   is not given a tab stop it did not already have. Destroy does
 *   not remove a role or tabindex this runtime added.
 *
 * Selection:
 *   Independent toggles. There is no single-select group. List has
 *   no runtime, and its [selected] wash is author state. Tabs are a
 *   different widget (panels and a roving tabindex). Radio groups use
 *   the native name on inputs. This row has no container. Activating
 *   one selectable row does not clear its siblings.
 *   Activation is the click, including the click this runtime
 *   dispatches for a non-native host. The written signal is [selected]
 *   plus aria-selected on a host that is not a link, or aria-current
 *   on `a` and role="link". CSS treats aria-current other than "false"
 *   as selected, which is the link-shaped signal. Turning a row off
 *   clears [selected] and writes the chosen aria attribute to "false",
 *   and clears the other aria signal when that signal is still
 *   selected, so one toggle fully unselects the row. Rows without
 *   [touchable-row~="select"] do not toggle.
 *
 * Long-press:
 *   Not implemented here. A row with [pressable][pressable-longpress]
 *   uses Pressable's juice:longpress. Pressable suppresses the click
 *   that follows a long-press on the capture phase (preventDefault
 *   and stopPropagation) unless that event was canceled. Selection
 *   listens for click on the bubble phase, so the suppressed click
 *   never toggles. A later click does.
 *
 * Disabled:
 *   :disabled (the disabled property), [disabled], and
 *   [aria-disabled="true"] are ignored entirely. No click is
 *   synthesized, selection does not change, and the attempt does not
 *   dispatch juice:change.
 *
 * State is { selected, disabled }. selected is the CSS selected
 * state, not the select word. The first observation is recorded and
 * does not dispatch. Later changes dispatch a bubbling juice:change
 * CustomEvent with detail { runtime: "touchable-row", state }.
 *
 * No Sig TouchableRow factory. Touchable-row is the thirtieth
 * Emerging auto-enhance runtime.
 */
export type TouchableRowOptions = {
    root?: ParentNode;
    touchableRowSelector?: string;
};
export type TouchableRowState = {
    selected: boolean;
    disabled: boolean;
};
export type TouchableRowController = {
    destroy: () => void;
    sync: () => void;
    getState: (target?: HTMLElement | null) => TouchableRowState | null;
};
export declare const createTouchableRow: (options?: TouchableRowOptions) => TouchableRowController;
export declare const initTouchableRow: (options?: TouchableRowOptions) => TouchableRowController;
export declare const startTouchableRowRuntime: () => TouchableRowController | null;
export declare const stopTouchableRowRuntime: () => void;
