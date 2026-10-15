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

import { effect, Signal } from '@citrusworx/sigjs';
import { JUICE_CHANGE_EVENT, juiceStatesEqual } from '../js/src/shared/change.js';
import {
  startAccordionRuntime,
  startBannerRuntime,
  startBreadcrumbRuntime,
  startCheckboxRuntime,
  startComboboxRuntime,
  startDisclosureRuntime,
  startDrawerRuntime,
  startFieldRuntime,
  startInputRuntime,
  startMenuRuntime,
  startModalRuntime,
  startNavigationRuntime,
  startPaginationRuntime,
  startPopoverRuntime,
  startProgressRuntime,
  startRadioRuntime,
  startSelectRuntime,
  startSliderRuntime,
  startSpinnerRuntime,
  startSwitchRuntime,
  startTabsRuntime,
  startTextareaRuntime,
  startToastRuntime,
  startTooltipRuntime,
  startWizardRuntime,
} from '../index.js';
import type {
  AccordionState,
  BannerState,
  BreadcrumbState,
  CheckboxState,
  ComboboxState,
  DisclosureState,
  DrawerState,
  FieldState,
  InputState,
  MenuState,
  ModalState,
  NavigationState,
  PaginationState,
  PopoverState,
  ProgressState,
  RadioState,
  SelectState,
  SliderState,
  SpinnerState,
  SwitchState,
  TabsState,
  TextareaState,
  ToastState,
  TooltipState,
  WizardState,
} from '../index.js';

export type JuiceRuntimeName =
  | 'switch'
  | 'checkbox'
  | 'disclosure'
  | 'accordion'
  | 'modal'
  | 'drawer'
  | 'popover'
  | 'menu'
  | 'combobox'
  | 'slider'
  | 'progress'
  | 'radio'
  | 'tabs'
  | 'pagination'
  | 'breadcrumb'
  | 'wizard'
  | 'toast'
  | 'banner'
  | 'tooltip'
  | 'spinner'
  | 'nav'
  | 'field'
  | 'select'
  | 'input'
  | 'textarea';

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

const NATIVE_VALUE_RUNTIMES = new Set<JuiceRuntimeName>([
  'select',
  'input',
  'textarea',
]);

const readers: {
  [K in JuiceRuntimeName]: (host: HTMLElement) => JuiceRuntimeState[K] | null;
} = {
  switch: (host) => startSwitchRuntime()?.getState(host) ?? null,
  checkbox: (host) => startCheckboxRuntime()?.getState(host) ?? null,
  disclosure: (host) => startDisclosureRuntime()?.getState(host) ?? null,
  accordion: (host) => startAccordionRuntime()?.getState(host) ?? null,
  modal: (host) => startModalRuntime()?.getState(host) ?? null,
  drawer: (host) => startDrawerRuntime()?.getState(host) ?? null,
  popover: (host) => startPopoverRuntime()?.getState(host) ?? null,
  menu: (host) => startMenuRuntime()?.getState(host) ?? null,
  combobox: (host) => startComboboxRuntime()?.getState(host) ?? null,
  slider: (host) => startSliderRuntime()?.getState(host) ?? null,
  progress: (host) => startProgressRuntime()?.getState(host) ?? null,
  radio: (host) => startRadioRuntime()?.getState(host) ?? null,
  tabs: (host) => startTabsRuntime()?.getState(host) ?? null,
  pagination: (host) => startPaginationRuntime()?.getState(host) ?? null,
  breadcrumb: (host) => startBreadcrumbRuntime()?.getState(host) ?? null,
  wizard: (host) => startWizardRuntime()?.getState(host) ?? null,
  toast: (host) => startToastRuntime()?.getState(host) ?? null,
  banner: (host) => startBannerRuntime()?.getState(host) ?? null,
  tooltip: (host) => startTooltipRuntime()?.getState(host) ?? null,
  spinner: (host) => startSpinnerRuntime()?.getState(host) ?? null,
  nav: (host) => startNavigationRuntime()?.getState(host) ?? null,
  field: (host) => startFieldRuntime()?.getState(host) ?? null,
  select: (host) => startSelectRuntime()?.getState(host) ?? null,
  input: (host) => startInputRuntime()?.getState(host) ?? null,
  textarea: (host) => startTextareaRuntime()?.getState(host) ?? null,
};

const hostMatchers: Array<{
  runtime: JuiceRuntimeName;
  match: (host: HTMLElement) => boolean;
}> = [
  {
    runtime: 'select',
    match: (host) =>
      host instanceof HTMLSelectElement && host.hasAttribute('select'),
  },
  {
    runtime: 'textarea',
    match: (host) =>
      host instanceof HTMLTextAreaElement && host.hasAttribute('textarea'),
  },
  {
    runtime: 'switch',
    match: (host) => host.hasAttribute('switch'),
  },
  {
    runtime: 'checkbox',
    match: (host) => host.hasAttribute('checkbox'),
  },
  {
    runtime: 'input',
    match: (host) =>
      host instanceof HTMLInputElement && host.hasAttribute('input'),
  },
  {
    runtime: 'disclosure',
    match: (host) => host.hasAttribute('disclosure'),
  },
  {
    runtime: 'accordion',
    match: (host) => host.hasAttribute('accordion'),
  },
  {
    runtime: 'modal',
    match: (host) => host.hasAttribute('modal-overlay'),
  },
  {
    runtime: 'drawer',
    match: (host) => host.hasAttribute('drawer-overlay'),
  },
  {
    runtime: 'popover',
    match: (host) => host.hasAttribute('popover-root'),
  },
  {
    runtime: 'menu',
    match: (host) => host.hasAttribute('menu-root'),
  },
  {
    runtime: 'combobox',
    match: (host) => host.hasAttribute('combobox'),
  },
  {
    runtime: 'slider',
    match: (host) => host.hasAttribute('slider'),
  },
  {
    runtime: 'progress',
    match: (host) => host.hasAttribute('progress'),
  },
  {
    runtime: 'radio',
    match: (host) => host.hasAttribute('radiogroup'),
  },
  {
    runtime: 'tabs',
    match: (host) => host.hasAttribute('tabs'),
  },
  {
    runtime: 'pagination',
    match: (host) => host.hasAttribute('pagination'),
  },
  {
    runtime: 'breadcrumb',
    match: (host) => host.hasAttribute('breadcrumb'),
  },
  {
    runtime: 'wizard',
    match: (host) => host.hasAttribute('wizard-shell'),
  },
  {
    runtime: 'toast',
    match: (host) => host.hasAttribute('toast'),
  },
  {
    runtime: 'banner',
    match: (host) => host.hasAttribute('banner'),
  },
  {
    runtime: 'tooltip',
    match: (host) => host.hasAttribute('tooltip-root'),
  },
  {
    runtime: 'spinner',
    match: (host) => host.hasAttribute('spinner'),
  },
  {
    runtime: 'nav',
    match: (host) =>
      host.tagName === 'NAV' && host.getAttribute('type') === 'sidebar',
  },
  {
    runtime: 'field',
    match: (host) => host.hasAttribute('field'),
  },
];

const inferRuntime = (host: HTMLElement): JuiceRuntimeName | null => {
  const match = hostMatchers.find((candidate) => candidate.match(host));
  return match?.runtime ?? null;
};

const readState = <R extends JuiceRuntimeName>(
  runtime: R,
  host: HTMLElement
): JuiceRuntimeState[R] | null => readers[runtime](host);

const cloneState = <T>(state: T): T => structuredClone(state);

const writeBack = (
  runtime: JuiceRuntimeName,
  host: HTMLElement,
  state: JuiceRuntimeState[JuiceRuntimeName]
) => {
  switch (runtime) {
    case 'switch':
      startSwitchRuntime()?.setChecked((state as SwitchState).checked, host);
      return;
    case 'checkbox':
      startCheckboxRuntime()?.setChecked(
        (state as CheckboxState).checked,
        host
      );
      return;
    case 'disclosure': {
      const expanded = (state as DisclosureState).expanded;
      const trigger = host.matches('[disclosure-trigger]')
        ? host
        : host.querySelector<HTMLElement>('[disclosure-trigger]');
      if (!trigger) return;
      const controller = startDisclosureRuntime();
      if (!controller) return;
      if (expanded) controller.expand(trigger);
      else controller.collapse(trigger);
      return;
    }
    case 'modal': {
      const controller = startModalRuntime();
      if (!controller) return;
      if ((state as ModalState).open) controller.open(host);
      else controller.close(host);
      return;
    }
    default:
      return;
  }
};

const isRuntimeName = (value: string): value is JuiceRuntimeName =>
  Object.prototype.hasOwnProperty.call(readers, value);

export function bind<R extends JuiceRuntimeName>(
  host: HTMLElement,
  runtime: R
): JuiceBinding<JuiceRuntimeState[R]>;
export function bind(
  host: HTMLElement,
  runtime?: JuiceRuntimeName
): JuiceBinding<JuiceRuntimeState[JuiceRuntimeName]>;
export function bind(
  host: HTMLElement,
  runtime?: JuiceRuntimeName
): JuiceBinding<JuiceRuntimeState[JuiceRuntimeName]> {
  const resolved = runtime ?? inferRuntime(host);
  if (!resolved || !isRuntimeName(resolved)) {
    throw new Error(
      'Juice sig bind: could not infer a runtime from this host. Pass a runtime name.'
    );
  }

  const seeded = readState(resolved, host);
  if (seeded == null) {
    throw new Error(
      `Juice sig bind: ${resolved} getState() returned null for this host.`
    );
  }

  const inner = Signal(cloneState(seeded));
  let disposed = false;

  const publish = (
    next: JuiceRuntimeState[JuiceRuntimeName],
    fromHost: boolean
  ) => {
    if (disposed) return;
    if (juiceStatesEqual(inner.get(), next)) return;
    inner.set(cloneState(next));
    if (!fromHost) writeBack(resolved, host, next);
  };

  const onJuiceChange = (event: Event) => {
    if (disposed || event.target !== host) return;
    if (!(event instanceof CustomEvent)) return;
    const detail = event.detail as { runtime?: unknown; state?: unknown } | null;
    if (!detail || detail.runtime !== resolved || detail.state == null) return;
    publish(detail.state as JuiceRuntimeState[JuiceRuntimeName], true);
  };

  const pullNative = () => {
    if (disposed) return;
    const next = readState(resolved, host);
    if (next == null) return;
    publish(next, true);
  };

  const native = NATIVE_VALUE_RUNTIMES.has(resolved);
  const stopListening = effect(() => {
    host.addEventListener(JUICE_CHANGE_EVENT, onJuiceChange);
    if (native) {
      host.addEventListener('input', pullNative);
      host.addEventListener('change', pullNative);
    }

    return () => {
      disposed = true;
      host.removeEventListener(JUICE_CHANGE_EVENT, onJuiceChange);
      if (native) {
        host.removeEventListener('input', pullNative);
        host.removeEventListener('change', pullNative);
      }
    };
  });

  const state: JuiceSignal<JuiceRuntimeState[JuiceRuntimeName]> = {
    get: () => inner.get(),
    set: (value) => publish(value, false),
  };

  return {
    state,
    dispose: () => {
      if (disposed) return;
      disposed = true;
      stopListening();
    },
  };
}
