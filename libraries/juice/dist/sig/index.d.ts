/**
 * Optional Sig adapter for Juice runtimes.
 *
 * Import this module from `@citrusworx/juiceui/sig` only. Juice runtimes
 * and the main entry do not import Sig. This module imports Sig and the
 * Juice controllers.
 *
 * `bind` seeds a Sig signal from `getState()`, then keeps it aligned with
 * `juice:change`. Select, input, and textarea have no `juice:change`;
 * those hosts also listen for native `input` and `change`.
 *
 * Setting the signal writes back through the controller for switch,
 * checkbox, disclosure, and modal. Other runtimes stay read-only.
 * `dispose` removes the host listeners. A `bind` call during Sig render
 * registers that dispose with the component cleanup scope, so unmount
 * drops the listeners too.
 */
import type { AccordionState, BannerState, BreadcrumbState, CheckboxState, ComboboxState, DisclosureState, DrawerState, FieldState, InputState, MenuState, ModalState, NavigationState, PaginationState, PopoverState, ProgressState, RadioState, SelectState, SliderState, SpinnerState, SwitchState, TabsState, TextareaState, ToastState, TooltipState, WizardState } from '../index.js';
export type JuiceRuntimeName = 'switch' | 'checkbox' | 'disclosure' | 'accordion' | 'modal' | 'drawer' | 'popover' | 'menu' | 'combobox' | 'slider' | 'progress' | 'radio' | 'tabs' | 'pagination' | 'breadcrumb' | 'wizard' | 'toast' | 'banner' | 'tooltip' | 'spinner' | 'nav' | 'field' | 'select' | 'input' | 'textarea';
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
