/**
 * DOM-first APG Checkbox runtime for Juice checkbox chrome.
 *
 * Markup contract (Slice A — do not rename attrs):
 *   [checkbox] on the control host. Primary host is
 *   <button type="button" checkbox>. Visible labels live beside the
 *   control (wrapping <label>, aria-label, or aria-labelledby) — the
 *   host *is* the box. The checkmark is a CSS pseudo-element; there
 *   is no [checkbox-box] child.
 *
 * Hosts this runtime enhances:
 *   - HTMLButtonElement (primary). Sync fills role="checkbox",
 *     aria-checked "true"|"false", and type="button" when type is
 *     missing (so a form does not submit).
 *   - HTMLInputElement type="checkbox" (secondary). Chrome already
 *     paints :checked. Sync fills role="checkbox" and keeps
 *     aria-checked in lockstep with the native checked property
 *     (change events, and a static aria-checked="true" on an
 *     unchecked box is promoted onto .checked so :checked paint
 *     matches). This is not a form-checkbox restyle as the only
 *     story, and it is not menuitemcheckbox or [switch].
 *
 * Other [checkbox] hosts (div, span, text inputs, radios) are ignored.
 * Do not invent accessible names — authors must supply aria-label,
 * aria-labelledby, or visible text.
 *
 * v1 is binary. aria-checked="mixed" and any other value coerce to
 * "false". There is no tri-state, no focus trap, and no Escape
 * handling (not a layered overlay).
 *
 * Click and Enter/Space toggle. Native disabled or aria-disabled="true"
 * is ignored. Button click preventDefault stops accidental submit when
 * type is still the default.
 */

import { createEventClaim } from '../shared/events.js';

export type CheckboxOptions = {
  root?: ParentNode;
  checkboxSelector?: string;
};

export type CheckboxController = {
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

const DEFAULTS: Required<CheckboxOptions> = {
  root: DEFAULT_ROOT,
  checkboxSelector: '[checkbox]',
};

const asArray = <T extends Element>(nodes: ArrayLike<T>): T[] =>
  Array.from(nodes);

const claimEvent = createEventClaim();

const isNativeCheckbox = (
  element: HTMLElement
): element is HTMLInputElement =>
  element instanceof HTMLInputElement && element.type === 'checkbox';

const isButtonHost = (
  element: HTMLElement
): element is HTMLButtonElement => element instanceof HTMLButtonElement;

const isEnhanceableCheckbox = (element: HTMLElement) =>
  isButtonHost(element) || isNativeCheckbox(element);

const isDisabled = (element: HTMLElement) => {
  if (element.getAttribute('aria-disabled') === 'true') return true;
  if (element instanceof HTMLButtonElement && element.disabled) return true;
  if (element instanceof HTMLInputElement && element.disabled) return true;
  return element.hasAttribute('disabled');
};

const readChecked = (element: HTMLElement) => {
  if (isNativeCheckbox(element) && element.checked) return true;
  return element.getAttribute('aria-checked') === 'true';
};

const writeChecked = (element: HTMLElement, checked: boolean) => {
  const value = checked ? 'true' : 'false';
  if (element.getAttribute('aria-checked') !== value) {
    element.setAttribute('aria-checked', value);
  }
  if (isNativeCheckbox(element) && element.checked !== checked) {
    element.checked = checked;
  }
};

const noopController = (): CheckboxController => ({
  destroy: () => {},
  sync: () => {},
  toggle: () => {},
  check: () => {},
  uncheck: () => {},
  setChecked: () => {},
  isChecked: () => false,
});

export const createCheckbox = (
  options: CheckboxOptions = {}
): CheckboxController => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return noopController();
  }

  const settings = { ...DEFAULTS, ...options };
  const root = settings.root ?? document;
  const rootEvents = root as ParentNode & EventTarget;

  const getCheckboxes = () =>
    asArray(
      root.querySelectorAll<HTMLElement>(settings.checkboxSelector)
    ).filter(isEnhanceableCheckbox);

  const isManagedCheckbox = (element: HTMLElement | null | undefined) => {
    if (!element?.matches(settings.checkboxSelector)) return false;
    if (!isEnhanceableCheckbox(element)) return false;
    if (root instanceof Document) return true;
    if (root instanceof Node) return root.contains(element);
    return getCheckboxes().includes(element);
  };

  const resolveContainingCheckbox = (
    element: HTMLElement | null | undefined
  ) => {
    if (!element) return null;
    const control = element.closest(settings.checkboxSelector);
    if (!(control instanceof HTMLElement)) return null;
    if (!isManagedCheckbox(control)) return null;
    return control;
  };

  const resolveCheckbox = (target?: HTMLElement | null) => {
    if (target) {
      if (isManagedCheckbox(target)) return target;

      const containing = resolveContainingCheckbox(target);
      if (containing) return containing;
    }

    return getCheckboxes().find(isManagedCheckbox) ?? null;
  };

  const ensureCheckboxAccessibility = (control: HTMLElement) => {
    if (control.getAttribute('role') !== 'checkbox') {
      control.setAttribute('role', 'checkbox');
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
    const control = resolveCheckbox(target);
    if (!control || isDisabled(control)) return;

    ensureCheckboxAccessibility(control);
    writeChecked(control, checked);
  };

  const toggle = (target?: HTMLElement | null) => {
    const control = resolveCheckbox(target);
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
    const control = resolveCheckbox(target);
    if (!control) return false;
    return readChecked(control);
  };

  const sync = () => {
    getCheckboxes().forEach((control) => {
      if (!isManagedCheckbox(control)) return;
      ensureCheckboxAccessibility(control);
    });
  };

  const handleRootClick = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const control = resolveContainingCheckbox(
      target instanceof HTMLElement ? target : target.parentElement
    );
    if (!control || isDisabled(control) || !isButtonHost(control)) return;
    if (!claimEvent(event)) return;

    event.preventDefault();
    toggle(control);
  };

  const handleRootChange = (event: Event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement) || !isNativeCheckbox(target)) return;
    if (!isManagedCheckbox(target) || isDisabled(target)) return;
    if (!claimEvent(event)) return;

    writeChecked(target, target.checked);
  };

  const handleRootKeydown = (event: Event) => {
    if (!(event instanceof KeyboardEvent)) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;

    const target = event.target;
    if (!(target instanceof Element)) return;

    const control = resolveContainingCheckbox(
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
        'checkbox',
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

export const initCheckbox = (
  options: CheckboxOptions = {}
): CheckboxController => createCheckbox(options);

let autoCheckboxController: CheckboxController | null = null;
let autoStartSuspended = false;
let bootOnReady: (() => void) | null = null;

const cancelDeferredAutoStart = () => {
  if (!bootOnReady) return;
  document.removeEventListener('DOMContentLoaded', bootOnReady);
  bootOnReady = null;
};

export const startCheckboxRuntime = (): CheckboxController | null => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  autoStartSuspended = false;
  cancelDeferredAutoStart();

  if (autoCheckboxController) {
    autoCheckboxController.sync();
    return autoCheckboxController;
  }

  autoCheckboxController = createCheckbox();
  return autoCheckboxController;
};

export const stopCheckboxRuntime = () => {
  autoStartSuspended = true;
  cancelDeferredAutoStart();
  autoCheckboxController?.destroy();
  autoCheckboxController = null;
};

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    bootOnReady = () => {
      bootOnReady = null;
      if (!autoStartSuspended) {
        startCheckboxRuntime();
      }
    };
    document.addEventListener('DOMContentLoaded', bootOnReady);
  } else {
    startCheckboxRuntime();
  }
}
