/**
 * DOM-first APG Radio Group runtime for Juice radio chrome.
 *
 * Markup contract (Slice A — do not rename attrs):
 *   [radiogroup] is the group root (layout only — no group chrome).
 *   [radio] is one option. Primary host is
 *   <button type="button" radio> inside the group. Visible labels live
 *   beside the control (wrapping <label>, aria-label, or
 *   aria-labelledby) — the host *is* the disc. The dot is a CSS
 *   pseudo-element; there is no [radio-dot] child.
 *
 * Hosts this runtime enhances:
 *   - [radiogroup] roots. Sync fills role="radiogroup". Authors supply
 *     the group's accessible name. Radios outside a [radiogroup] are
 *     ignored (no solo exclusive group).
 *   - HTMLButtonElement [radio] descendants (primary). Sync fills
 *     role="radio", aria-checked "true"|"false", type="button" when
 *     type is missing, and a roving tabindex (one tab stop per group).
 *   - HTMLInputElement type="radio" (secondary). Chrome already paints
 *     :checked. Sync keeps aria-checked in lockstep with the native
 *     checked property. Exclusivity is the [radiogroup], not only the
 *     input name.
 *
 * Other [radio] hosts (div, span, text inputs, checkboxes) are ignored.
 * A radio belongs to its nearest [radiogroup]. Do not invent accessible
 * names.
 *
 * v1 is exclusive and binary. aria-checked="mixed" coerces to "false".
 * When more than one radio is checked, sync keeps the first in document
 * order. Zero checked is allowed until something is selected. There is
 * no focus trap and no Escape handling (not a layered overlay).
 *
 * Click, Enter, and Space select the targeted radio. Arrow keys move
 * the selection among enabled radios in the group and wrap, skipping
 * disabled / aria-disabled radios. Native disabled or aria-disabled="true"
 * is ignored.
 */

import { createEventClaim } from '../shared/events.js';

export type RadioOptions = {
  root?: ParentNode;
  radiogroupSelector?: string;
  radioSelector?: string;
};

export type RadioController = {
  destroy: () => void;
  sync: () => void;
  select: (radio?: HTMLElement | null) => void;
  getChecked: (group?: HTMLElement | null) => HTMLElement | null;
};

const DEFAULT_ROOT: ParentNode =
  typeof document !== 'undefined' ? document : ({} as ParentNode);

const DEFAULTS: Required<RadioOptions> = {
  root: DEFAULT_ROOT,
  radiogroupSelector: '[radiogroup]',
  radioSelector: '[radio]',
};

const ARROW_NEXT = new Set(['ArrowRight', 'ArrowDown']);
const ARROW_PREV = new Set(['ArrowLeft', 'ArrowUp']);

const asArray = <T extends Element>(nodes: ArrayLike<T>): T[] =>
  Array.from(nodes);

const claimEvent = createEventClaim();

const isNativeRadio = (element: HTMLElement): element is HTMLInputElement =>
  element instanceof HTMLInputElement && element.type === 'radio';

const isButtonHost = (
  element: HTMLElement
): element is HTMLButtonElement => element instanceof HTMLButtonElement;

const isEnhanceableRadio = (element: HTMLElement) =>
  isButtonHost(element) || isNativeRadio(element);

const isDisabled = (element: HTMLElement) => {
  if (element.getAttribute('aria-disabled') === 'true') return true;
  if (element instanceof HTMLButtonElement && element.disabled) return true;
  if (element instanceof HTMLInputElement && element.disabled) return true;
  return element.hasAttribute('disabled');
};

const readChecked = (element: HTMLElement) => {
  if (isNativeRadio(element) && element.checked) return true;
  return element.getAttribute('aria-checked') === 'true';
};

const writeChecked = (element: HTMLElement, checked: boolean) => {
  const value = checked ? 'true' : 'false';
  if (element.getAttribute('aria-checked') !== value) {
    element.setAttribute('aria-checked', value);
  }
  if (isNativeRadio(element) && element.checked !== checked) {
    element.checked = checked;
  }
};

const noopController = (): RadioController => ({
  destroy: () => {},
  sync: () => {},
  select: () => {},
  getChecked: () => null,
});

export const createRadio = (options: RadioOptions = {}): RadioController => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return noopController();
  }

  const settings = { ...DEFAULTS, ...options };
  const root = settings.root ?? document;
  const rootEvents = root as ParentNode & EventTarget;
  let applying = false;

  const getGroups = () =>
    asArray(root.querySelectorAll<HTMLElement>(settings.radiogroupSelector));

  const isManagedGroup = (element: HTMLElement | null | undefined) => {
    if (!element?.matches(settings.radiogroupSelector)) return false;
    if (root instanceof Document) return true;
    if (root instanceof Node) return root.contains(element);
    return getGroups().includes(element);
  };

  const resolveGroup = (element: HTMLElement | null | undefined) => {
    if (!element) return null;
    const group = element.closest(settings.radiogroupSelector);
    if (!(group instanceof HTMLElement)) return null;
    if (!isManagedGroup(group)) return null;
    return group;
  };

  const getRadios = (group: HTMLElement) =>
    asArray(group.querySelectorAll<HTMLElement>(settings.radioSelector)).filter(
      (radio) => {
        if (!isEnhanceableRadio(radio)) return false;
        return radio.closest(settings.radiogroupSelector) === group;
      }
    );

  const isManagedRadio = (element: HTMLElement | null | undefined) => {
    if (!element?.matches(settings.radioSelector)) return false;
    if (!isEnhanceableRadio(element)) return false;
    const group = element.closest(settings.radiogroupSelector);
    if (!(group instanceof HTMLElement)) return false;
    if (group === element) return false;
    return isManagedGroup(group);
  };

  const resolveRadio = (target?: HTMLElement | null) => {
    if (!target) return null;
    if (isManagedRadio(target)) return target;

    const containing = target.closest(settings.radioSelector);
    if (!(containing instanceof HTMLElement)) return null;
    if (!isManagedRadio(containing)) return null;
    return containing;
  };

  const resolveRadioFromEvent = (target: Element) => {
    const element =
      target instanceof HTMLElement ? target : target.parentElement;
    return resolveRadio(element);
  };

  const ensureRadioChrome = (radio: HTMLElement) => {
    if (radio.getAttribute('role') !== 'radio') {
      radio.setAttribute('role', 'radio');
    }

    if (isButtonHost(radio) && !radio.hasAttribute('type')) {
      radio.type = 'button';
    }
  };

  const applyTabStops = (radios: HTMLElement[], checked: HTMLElement | null) => {
    const tabTarget =
      checked && !isDisabled(checked)
        ? checked
        : (radios.find((radio) => !isDisabled(radio)) ?? null);

    radios.forEach((radio) => {
      const tabindex = radio === tabTarget ? '0' : '-1';
      if (radio.getAttribute('tabindex') !== tabindex) {
        radio.setAttribute('tabindex', tabindex);
      }
    });
  };

  const writeGroupSelection = (
    group: HTMLElement,
    checked: HTMLElement | null
  ) => {
    if (group.getAttribute('role') !== 'radiogroup') {
      group.setAttribute('role', 'radiogroup');
    }

    const radios = getRadios(group);
    applying = true;
    try {
      radios.forEach((radio) => {
        ensureRadioChrome(radio);
        writeChecked(radio, radio === checked);
      });
      applyTabStops(radios, checked);
    } finally {
      applying = false;
    }
  };

  const syncGroup = (group: HTMLElement) => {
    const checked = getRadios(group).find((radio) => readChecked(radio)) ?? null;
    writeGroupSelection(group, checked);
  };

  const select = (target?: HTMLElement | null) => {
    const radio = resolveRadio(target);
    if (!radio || isDisabled(radio)) return;

    const group = resolveGroup(radio);
    if (!group) return;

    writeGroupSelection(group, radio);
  };

  const getChecked = (target?: HTMLElement | null) => {
    let group: HTMLElement | null = null;

    if (!target) {
      group = getGroups().find((candidate) => isManagedGroup(candidate)) ?? null;
    } else if (isManagedGroup(target)) {
      group = target;
    } else {
      group = resolveGroup(target);
    }

    if (!group) return null;
    return getRadios(group).find((radio) => readChecked(radio)) ?? null;
  };

  const sync = () => {
    getGroups().forEach((group) => {
      if (!isManagedGroup(group)) return;
      syncGroup(group);
    });
  };

  const handleRootClick = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const radio = resolveRadioFromEvent(target);
    if (!radio || isDisabled(radio) || !isButtonHost(radio)) return;
    if (!claimEvent(event)) return;

    event.preventDefault();
    select(radio);
  };

  const handleRootChange = (event: Event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement) || !isNativeRadio(target)) return;
    if (!isManagedRadio(target) || isDisabled(target) || applying) return;
    if (!target.checked) return;
    if (!claimEvent(event)) return;

    select(target);
  };

  const moveSelection = (radio: HTMLElement, delta: number) => {
    const group = resolveGroup(radio);
    if (!group) return;

    const enabled = getRadios(group).filter((candidate) => !isDisabled(candidate));
    if (enabled.length === 0) return;

    const index = enabled.indexOf(radio);
    const start = index < 0 ? (delta > 0 ? -1 : 0) : index;
    const next = enabled[(start + delta + enabled.length) % enabled.length];
    if (!next) return;

    select(next);
    next.focus();
  };

  const handleRootKeydown = (event: Event) => {
    if (!(event instanceof KeyboardEvent)) return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;

    const target = event.target;
    if (!(target instanceof Element)) return;

    const radio = resolveRadioFromEvent(target);
    if (!radio || isDisabled(radio)) return;

    if (ARROW_NEXT.has(event.key) || ARROW_PREV.has(event.key)) {
      if (!claimEvent(event)) return;
      event.preventDefault();
      moveSelection(radio, ARROW_NEXT.has(event.key) ? 1 : -1);
      return;
    }

    if (event.key !== 'Enter' && event.key !== ' ') return;
    if (!claimEvent(event)) return;

    event.preventDefault();
    select(radio);
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
        'radiogroup',
        'radio',
        'role',
        'aria-checked',
        'aria-disabled',
        'disabled',
        'type',
        'checked',
        'tabindex',
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
    select,
    getChecked,
  };
};

export const initRadio = (options: RadioOptions = {}): RadioController =>
  createRadio(options);

let autoRadioController: RadioController | null = null;
let autoStartSuspended = false;
let bootOnReady: (() => void) | null = null;

const cancelDeferredAutoStart = () => {
  if (!bootOnReady) return;
  document.removeEventListener('DOMContentLoaded', bootOnReady);
  bootOnReady = null;
};

export const startRadioRuntime = (): RadioController | null => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  autoStartSuspended = false;
  cancelDeferredAutoStart();

  if (autoRadioController) {
    autoRadioController.sync();
    return autoRadioController;
  }

  autoRadioController = createRadio();
  return autoRadioController;
};

export const stopRadioRuntime = () => {
  autoStartSuspended = true;
  cancelDeferredAutoStart();
  autoRadioController?.destroy();
  autoRadioController = null;
};

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    bootOnReady = () => {
      bootOnReady = null;
      if (!autoStartSuspended) {
        startRadioRuntime();
      }
    };
    document.addEventListener('DOMContentLoaded', bootOnReady);
  } else {
    startRadioRuntime();
  }
}
