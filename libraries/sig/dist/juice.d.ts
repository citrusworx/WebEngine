/**
 * Optional Juice adapter. Import from `@citrusworx/sigjs/juice`.
 *
 * The main Sig entry does not import Juice. This module is the only one
 * that does. Juice is an optional peer: Sig installs without it, and Juice
 * depends on Sig's main entry, not this subpath, so the packages do not cycle.
 *
 * Updates follow Juice's DOM contract: a bubbling `juice:change` event whose
 * detail is `{ runtime, state }`. Select, input, and textarea do not emit
 * that event; they use native `input` and `change`. State types are imported
 * as types. Seeding and write-back call the runtime controllers.
 *
 * `bind` returns `{ state, dispose }`. `dispose` removes the host listeners.
 * A call during Sig render also disposes on unmount: `effect` registers that
 * disposer on the internal cleanup scope (`captureCleanupScope`).
 */
import type { AccordionState, BannerState, BreadcrumbState, CheckboxState, ComboboxState, DisclosureState, DrawerState, FieldState, InputState, MenuState, ModalState, NavigationState, PaginationState, PopoverState, ProgressState, RadioState, SelectState, SliderState, SpinnerState, SwitchState, TabsState, TextareaState, ToastState, TooltipState, WizardState } from "@citrusworx/juiceui";
export type JuiceRuntimeName = "switch" | "checkbox" | "disclosure" | "accordion" | "modal" | "drawer" | "popover" | "menu" | "combobox" | "slider" | "progress" | "radio" | "tabs" | "pagination" | "breadcrumb" | "wizard" | "toast" | "banner" | "tooltip" | "spinner" | "nav" | "field" | "select" | "input" | "textarea";
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
