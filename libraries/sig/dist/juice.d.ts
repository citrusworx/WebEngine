/**
 * Optional Juice adapter. Import from `@citrusworx/sigjs/juice`.
 *
 * The main Sig entry does not import Juice. This module is the only one
 * that does. Juice is an optional peer: Sig installs without it, and Juice
 * depends on Sig's main entry, not this subpath, so the packages do not cycle.
 *
 * Updates follow Juice's DOM contract: a bubbling `juice:change` event whose
 * detail is `{ runtime, state }`. Select, input, and textarea do not emit
 * that event; they use native `input` and `change`. Twenty-eight of the
 * thirty-one names do emit it. State types for the original runtimes are
 * imported as types. Icon button, avatar, table, pressable, touchable-row,
 * and keyboard-avoider use local shapes, so the published declarations do
 * not name Juice types that older builds do not export. Those six start
 * functions are read from the Juice module namespace and may be missing.
 * Binding one of them then throws. The other twenty-five keep named imports,
 * so an older Juice still loads this module and still binds them.
 *
 * Pressable state is `{ pressed, longPressed }`. The host is `[pressable]`.
 * Opt-in `[pressable-longpress]` also dispatches a bubbling, cancelable
 * `juice:longpress` whose detail is `{ pressed: true, longPressed: true }`.
 * That event is not `{ runtime, state }`. This module does not listen for it.
 * The runtime then dispatches `juice:change` with the same gesture, and that
 * is what the signal follows.
 *
 * Touchable-row state is `{ selected, disabled }`. The host is
 * `[touchable-row]`. Later changes dispatch `juice:change` from that host.
 *
 * Keyboard-avoider state is `{ open, inset }`. The host is
 * `[keyboard-avoider]`. It does dispatch `juice:change` from each host, with
 * detail `{ runtime: "keyboard-avoider", state }`. The first observation is
 * silent. Later events fire when `open` flips, or when `inset` has moved by
 * at least the runtime threshold (default 80) from the last published inset
 * while open. Smaller steps still update `getState()`, the inline
 * `--juice-keyboard-inset` on `<html>`, and `[keyboard-open]` on `<html>` and
 * each host. This module does not read those. The signal stays on the last
 * `juice:change`.
 *
 * `sheet` is not a name. It is on Juice master and is not in published
 * juiceui through 0.9.5. Binding it waits until `@citrusworx/juiceui`
 * publishes `sheet`.
 *
 * `state.set` writes back for switch, checkbox, disclosure, modal, and
 * icon-button. Icon-button calls `toggle` only when the host has `[toggle]`
 * and `pressed` changes, then republishes `getState()`. A disabled host or a
 * host without `[toggle]` refuses the write and the signal matches the host.
 * Avatar, table, pressable, touchable-row, and keyboard-avoider are
 * read-only. Table has no Juice API to set sort. Pressable, touchable-row,
 * and keyboard-avoider expose `getState` only.
 *
 * `bind` returns `{ state, dispose }`. `dispose` removes the host listeners.
 * A call during Sig render also disposes on unmount: `effect` registers that
 * disposer on the internal cleanup scope (`captureCleanupScope`).
 */
import type { AccordionState, BannerState, BreadcrumbState, CheckboxState, ComboboxState, DisclosureState, DrawerState, FieldState, InputState, MenuState, ModalState, NavigationState, PaginationState, PopoverState, ProgressState, RadioState, SelectState, SliderState, SpinnerState, SwitchState, TabsState, TextareaState, ToastState, TooltipState, WizardState } from "@citrusworx/juiceui";
export type JuiceRuntimeName = "switch" | "checkbox" | "disclosure" | "accordion" | "modal" | "drawer" | "popover" | "menu" | "combobox" | "slider" | "progress" | "radio" | "tabs" | "pagination" | "breadcrumb" | "wizard" | "toast" | "banner" | "tooltip" | "spinner" | "nav" | "field" | "select" | "input" | "textarea" | "icon-button" | "avatar" | "table" | "pressable" | "touchable-row" | "keyboard-avoider";
type IconButtonState = {
    pressed: boolean;
    disabled: boolean;
    named: boolean;
};
type AvatarState = {
    loaded: boolean;
    fallback: boolean;
    hasImage: boolean;
};
type TableState = {
    column: number | null;
    direction: "ascending" | "descending" | "none";
};
type PressableState = {
    pressed: boolean;
    longPressed: boolean;
};
type TouchableRowState = {
    selected: boolean;
    disabled: boolean;
};
type KeyboardAvoiderState = {
    open: boolean;
    inset: number;
};
export type JuiceRuntimeState = {
    switch: SwitchState;
    checkbox: CheckboxState;
    disclosure: DisclosureState;
    accordion: AccordionState;
    modal: ModalState;
    drawer: DrawerState;
    popover: PopoverState;
    menu: MenuState;
    combobox: ComboboxState;
    slider: SliderState;
    progress: ProgressState;
    radio: RadioState;
    tabs: TabsState;
    pagination: PaginationState;
    breadcrumb: BreadcrumbState;
    wizard: WizardState;
    toast: ToastState;
    banner: BannerState;
    tooltip: TooltipState;
    spinner: SpinnerState;
    nav: NavigationState;
    field: FieldState;
    select: SelectState;
    input: InputState;
    textarea: TextareaState;
    "icon-button": IconButtonState;
    avatar: AvatarState;
    table: TableState;
    pressable: PressableState;
    "touchable-row": TouchableRowState;
    "keyboard-avoider": KeyboardAvoiderState;
};
export type JuiceSignal<T> = {
    get: () => T;
    set: (value: T) => void;
};
export type JuiceBinding<T> = {
    /** Sig signal seeded from `getState` and updated when the host changes. */
    state: JuiceSignal<T>;
    /** Remove host listeners. Safe to call more than once. */
    dispose: () => void;
};
export declare function bind<R extends JuiceRuntimeName>(host: HTMLElement, runtime: R): JuiceBinding<JuiceRuntimeState[R]>;
export declare function bind(host: HTMLElement, runtime?: JuiceRuntimeName): JuiceBinding<JuiceRuntimeState[JuiceRuntimeName]>;
export {};
