/**
 * DOM-first APG Switch runtime for Juice switch chrome.
 *
 * Markup contract (Slice A — do not rename attrs):
 *   [switch] on the control host. Primary host is
 *   <button type="button" switch>. Visible labels live beside the
 *   control (wrapping <label>, aria-label, or aria-labelledby) — the
 *   host *is* the track. Track / thumb are CSS pseudo-elements; there
 *   are no [switch-track] / [switch-thumb] children.
 *
 * Hosts this runtime enhances:
 *   - HTMLButtonElement (primary). Sync fills role="switch",
 *     aria-checked "true"|"false", and type="button" when type is
 *     missing (so a form does not submit).
 *   - HTMLInputElement type="checkbox" (secondary). Chrome already
 *     paints :checked. Sync fills role="switch" and keeps aria-checked
 *     in lockstep with the native checked property (change events, and
 *     a static aria-checked="true" on an unchecked box is promoted onto
 *     .checked so :checked paint matches). This is not a form-checkbox
 *     restyle as the only story, and it is not menuitemcheckbox.
 *
 * Other [switch] hosts (div, span, text inputs, radios) are ignored.
 * Do not invent accessible names — authors must supply aria-label,
 * aria-labelledby, or visible text.
 *
 * v1 is binary. aria-checked="mixed" and any other value coerce to
 * "false". There is no switch="on", no tri-state, no focus trap, and
 * no Escape handling (not a layered overlay).
 *
 * Click and Enter/Space toggle. Native disabled or aria-disabled="true"
 * is ignored. Button click preventDefault stops accidental submit when
 * type is still the default.
 */

import { createEventClaim } from '../shared/events.js';

export type SwitchOptions = {
  root?: ParentNode;
  switchSelector?: string;
};

export type SwitchController = {
  destroy: () => void;
  sync: () => void;
  toggle: (target?: HTMLElement | null) => void;
  check: (target?: HTMLElement | null) => void;
  uncheck: (target?: HTMLElement | null) => void;
  setChecked: (checked: boolean, target?: HTMLElement | null) => void;
  isChecked: (target?: HTMLElement | null) => boolean;
};

const DEFAULT_ROOT: ParentNode =
  typeof document !== 'undefined' ? document : ({} as ParentNode);

const DEFAULTS: Required<SwitchOptions> = {
  root: DEFAULT_ROOT,
  switchSelector: '[switch]',
};

const asArray = <T extends Element>(nodes: ArrayLike<T>): T[] =>
  Array.from(nodes);

const claimEvent = createEventClaim();

const isCheckboxHost = (
  element: HTMLElement
): element is HTMLInputElement =>
  element instanceof HTMLInputElement && element.type === 'checkbox';

const isButtonHost = (
  element: HTMLElement
): element is HTMLButtonElement => element instanceof HTMLButtonElement;

const isEnhanceableSwitch = (element: HTMLElement) =>
  isButtonHost(element) || isCheckboxHost(element);

const isDisabled = (element: HTMLElement) => {
  if (element.getAttribute('aria-disabled') === 'true') return true;
  if (element instanceof HTMLButtonElement && element.disabled) return true;
  if (element instanceof HTMLInputElement && element.disabled) return true;
  return element.hasAttribute('disabled');
};

const readChecked = (element: HTMLElement) => {
  if (isCheckboxHost(element) && element.checked) return true;
  return element.getAttribute('aria-checked') === 'true';
};

const writeChecked = (element: HTMLElement, checked: boolean) => {
  const value = checked ? 'true' : 'false';
  if (element.getAttribute('aria-checked') !== value) {
    element.setAttribute('aria-checked', value);
  }
  if (isCheckboxHost(element) && element.checked !== checked) {
    element.checked = checked;
  }
};

const noopController = (): SwitchController => ({
  destroy: () => {},
  sync: () => {},
  toggle: () => {},
  check: () => {},
  uncheck: () => {},
  setChecked: () => {},
  isChecked: () => false,
});

export const createSwitch = (
  options: SwitchOptions = {}
): SwitchController => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return noopController();
  }

  const settings = { ...DEFAULTS, ...options };
  const root = settings.root ?? document;
  const rootEvents = root as ParentNode & EventTarget;

  const getSwitches = () =>
    asArray(
      root.querySelectorAll<HTMLElement>(settings.switchSelector)
    ).filter(isEnhanceableSwitch);

  const isManagedSwitch = (element: HTMLElement | null | undefined) => {
    if (!element?.matches(settings.switchSelector)) return false;
    if (!isEnhanceableSwitch(element)) return false;
    if (root instanceof Document) return true;
    if (root instanceof Node) return root.contains(element);
    return getSwitches().includes(element);
  };

  const resolveContainingSwitch = (
    element: HTMLElement | null | undefined
  ) => {
    if (!element) return null;
    const control = element.closest(settings.switchSelector);
    if (!(control instanceof HTMLElement)) return null;
    if (!isManagedSwitch(control)) return null;
    return control;
  };

  const resolveSwitch = (target?: HTMLElement | null) => {
    if (target) {
      if (isManagedSwitch(target)) return target;

      const containing = resolveContainingSwitch(target);
      if (containing) return containing;
    }

    return getSwitches().find(isManagedSwitch) ?? null;
  };

  const ensureSwitchAccessibility = (control: HTMLElement) => {
    if (control.getAttribute('role') !== 'switch') {
      control.setAttribute('role', 'switch');
    }

    if (isButtonHost(control) && !control.hasAttribute('type')) {
      control.type = 'button';
    }

    writeChecked(control, readChecked(control));
  };

  const setCheckedState = (
    target: HTMLElement | null | undefined,
    checked: boolean
  ) => {
    const control = resolveSwitch(target);
    if (!control || isDisabled(control)) return;

    ensureSwitchAccessibility(control);
    writeChecked(control, checked);
  };

  const toggle = (target?: HTMLElement | null) => {
    const control = resolveSwitch(target);
    if (!control || isDisabled(control)) return;

    setCheckedState(control, !readChecked(control));
  };

  const check = (target?: HTMLElement | null) => {
    setCheckedState(target, true);
  };

  const uncheck = (target?: HTMLElement | null) => {
    setCheckedState(target, false);
  };

  const setChecked = (checked: boolean, target?: HTMLElement | null) => {
    setCheckedState(target, checked);
  };

  const isChecked = (target?: HTMLElement | null) => {
    const control = resolveSwitch(target);
    if (!control) return false;
    return readChecked(control);
  };

  const sync = () => {
    getSwitches().forEach((control) => {
      if (!isManagedSwitch(control)) return;
      ensureSwitchAccessibility(control);
    });
  };

  const handleRootClick = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const control = resolveContainingSwitch(
      target instanceof HTMLElement ? target : target.parentElement
    );
    if (!control || isDisabled(control) || !isButtonHost(control)) return;
    if (!claimEvent(event)) return;

    event.preventDefault();
    toggle(control);
  };

  const handleRootChange = (event: Event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement) || !isCheckboxHost(target)) return;
    if (!isManagedSwitch(target) || isDisabled(target)) return;
    if (!claimEvent(event)) return;

    writeChecked(target, target.checked);
  };

  const handleRootKeydown = (event: Event) => {
    if (!(event instanceof KeyboardEvent)) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;

    const target = event.target;
    if (!(target instanceof Element)) return;

    const control = resolveContainingSwitch(
      target instanceof HTMLElement ? target : target.parentElement
    );
    if (!control || isDisabled(control)) return;
    if (!claimEvent(event)) return;

    event.preventDefault();
    toggle(control);
  };

  let syncScheduled = false;
  const scheduleSync = () => {
    if (syncScheduled) return;
    syncScheduled = true;

    requestAnimationFrame(() => {
      syncScheduled = false;
      sync();
    });
  };

  const observer =
    typeof MutationObserver !== 'undefined'
      ? new MutationObserver(() => scheduleSync())
      : null;

  rootEvents.addEventListener('click', handleRootClick);
  rootEvents.addEventListener('change', handleRootChange);
  rootEvents.addEventListener('keydown', handleRootKeydown);

  if (observer && root instanceof Node) {
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        'switch',
        'role',
        'aria-checked',
        'aria-disabled',
        'disabled',
        'type',
        'checked',
      ],
    });
  }

  sync();

  return {
    destroy: () => {
      rootEvents.removeEventListener('click', handleRootClick);
      rootEvents.removeEventListener('change', handleRootChange);
      rootEvents.removeEventListener('keydown', handleRootKeydown);
      observer?.disconnect();
    },
    sync,
    toggle,
    check,
    uncheck,
    setChecked,
    isChecked,
  };
};

export const initSwitch = (options: SwitchOptions = {}): SwitchController =>
  createSwitch(options);

let autoSwitchController: SwitchController | null = null;
let autoStartSuspended = false;
let bootOnReady: (() => void) | null = null;

const cancelDeferredAutoStart = () => {
  if (!bootOnReady) return;
  document.removeEventListener('DOMContentLoaded', bootOnReady);
  bootOnReady = null;
};

export const startSwitchRuntime = (): SwitchController | null => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  autoStartSuspended = false;
  cancelDeferredAutoStart();

  if (autoSwitchController) {
    autoSwitchController.sync();
    return autoSwitchController;
  }

  autoSwitchController = createSwitch();
  return autoSwitchController;
};

export const stopSwitchRuntime = () => {
  autoStartSuspended = true;
  cancelDeferredAutoStart();
  autoSwitchController?.destroy();
  autoSwitchController = null;
};

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    bootOnReady = () => {
      bootOnReady = null;
      if (!autoStartSuspended) {
        startSwitchRuntime();
      }
    };
    document.addEventListener('DOMContentLoaded', bootOnReady);
  } else {
    startSwitchRuntime();
  }
}
