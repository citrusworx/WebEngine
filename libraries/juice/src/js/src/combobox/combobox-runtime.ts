/**
 * DOM-first combobox runtime for Juice combobox chrome.
 *
 * Markup contract (Slice A — do not rename attrs):
 *   [combobox] > [combobox-input] + [combobox-trigger]? +
 *   [combobox-list] > [combobox-option]+
 * Closed vs open is the native `hidden` attribute on [combobox-list].
 *
 * This is an editable combobox with a listbox popup (APG list
 * autocomplete, manual selection). It is not a native <select>
 * polyfill, not a popover, not a tooltip, and not a dialog overlay.
 * Single-select only. No async/remote fetch, no creatable options,
 * no multi-select, no Floating UI.
 *
 * Accessibility (honest v1):
 *   [combobox-input]  role="combobox" aria-autocomplete="list"
 *                     aria-expanded aria-controls aria-activedescendant
 *   [combobox-list]   role="listbox"
 *   [combobox-option] role="option" + guaranteed id on sync
 * Focus stays on the input. Visual focus on options is
 * `aria-activedescendant` plus `combobox-option="active"` paint.
 * Committed choice is `aria-selected="true"`.
 *
 * Open on input focus, typing, or trigger click. Close on Escape
 * (yields when an open [modal-overlay], [drawer-overlay],
 * [popover-root], or [menu] exists — those surfaces own Escape first;
 * menu sits with popover in the dialog-adjacent band),
 * outside click, blur (option mousedown preventDefault so the input
 * keeps focus through click-to-select), or after select.
 *
 * Filter: case-insensitive substring against option text and, when
 * present, `data-value`. Non-matches get `hidden` on the option.
 * An empty match set stays open with no visible options.
 *
 * Keyboard (list autocomplete, manual selection):
 *   ArrowDown / ArrowUp  open if needed; move active among visible
 *                        options (no wrap)
 *   Home / End           first / last visible option while open
 *                        (closed: native input cursor)
 *   Enter                select the active option
 *   Escape               close (yields to open dialog / popover / menu)
 *   Tab                  close without committing the active option
 *                        (APG manual selection). Focus moves on.
 *
 * Select: input value becomes option text, or `data-value` when that
 * attribute is present. Chosen option gets `aria-selected="true"`;
 * others are cleared. Closing (including after select, Tab, or
 * Escape) clears `combobox-option="active"` and aria-activedescendant
 * so a later Enter cannot commit a stale option.
 *
 * Trigger toggles the list. `aria-expanded` is written on the input
 * and, when present, the trigger. Opening one managed combobox closes
 * the others. Placement stays CSS (`[combobox-list]` is absolute
 * under the field at z-index 1050).
 */

import { createEventClaim } from '../shared/events.js';
import {
  hasOpenDialogOverlay,
  hasOpenMenu,
  hasOpenPopover,
} from '../shared/overlays.js';

export type ComboboxOptions = {
  root?: ParentNode;
  rootSelector?: string;
  inputSelector?: string;
  triggerSelector?: string;
  listSelector?: string;
  optionSelector?: string;
};

export type ComboboxController = {
  destroy: () => void;
  sync: () => void;
  open: (target?: HTMLElement | null) => void;
  close: (target?: HTMLElement | null) => void;
  toggle: (target?: HTMLElement | null) => void;
  select: (target?: HTMLElement | null) => void;
};

const DEFAULT_ROOT: ParentNode =
  typeof document !== 'undefined' ? document : ({} as ParentNode);

const DEFAULTS: Required<ComboboxOptions> = {
  root: DEFAULT_ROOT,
  rootSelector: '[combobox]',
  inputSelector: '[combobox-input]',
  triggerSelector: '[combobox-trigger]',
  listSelector: '[combobox-list]',
  optionSelector: '[combobox-option]',
};

const asArray = <T extends Element>(nodes: ArrayLike<T>): T[] =>
  Array.from(nodes);

const LIST_ID_PREFIX = 'juice-combobox-list';
const OPTION_ID_PREFIX = 'juice-combobox-option';

let idSerial = 0;

const nextGeneratedId = (prefix: string) => {
  let candidate = '';
  do {
    idSerial += 1;
    candidate = `${prefix}-${idSerial}`;
  } while (
    typeof document !== 'undefined' &&
    document.getElementById(candidate)
  );
  return candidate;
};

const assignUniqueId = (
  element: HTMLElement,
  preferred: string | null,
  prefix: string
) => {
  if (element.id) return element.id;
  if (preferred && !document.getElementById(preferred)) {
    element.id = preferred;
    return preferred;
  }
  element.id = nextGeneratedId(prefix);
  return element.id;
};

const claimEvent = createEventClaim();

const slugFromName = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'combobox';

const isNativeInteractive = (element: HTMLElement) => {
  if (element instanceof HTMLButtonElement) return true;
  if (element instanceof HTMLAnchorElement) return element.hasAttribute('href');
  return false;
};

const isEditableInput = (element: HTMLElement) =>
  element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement;

const getInputValue = (input: HTMLElement) => {
  if (isEditableInput(input)) return input.value;
  return input.textContent ?? '';
};

const setInputValue = (input: HTMLElement, value: string) => {
  if (isEditableInput(input)) {
    input.value = value;
    return;
  }
  input.textContent = value;
};

const isInputDisabled = (input: HTMLElement) => {
  if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
    return input.disabled;
  }
  return input.getAttribute('aria-disabled') === 'true';
};

const isComposingKey = (event: KeyboardEvent) =>
  event.isComposing || event.keyCode === 229;

const shouldYieldEscape = () =>
  hasOpenDialogOverlay() || hasOpenPopover() || hasOpenMenu();

const noopController = (): ComboboxController => ({
  destroy: () => {},
  sync: () => {},
  open: () => {},
  close: () => {},
  toggle: () => {},
  select: () => {},
});

export const createCombobox = (
  options: ComboboxOptions = {}
): ComboboxController => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return noopController();
  }

  const settings = { ...DEFAULTS, ...options };
  const root = settings.root ?? document;

  const getComboboxes = () =>
    asArray(root.querySelectorAll<HTMLElement>(settings.rootSelector));

  const resolveContainingCombobox = (element: Element | null | undefined) => {
    if (!element) return null;
    const combobox = element.closest(settings.rootSelector);
    return combobox instanceof HTMLElement ? combobox : null;
  };

  const isManagedCombobox = (element: HTMLElement | null | undefined) => {
    if (!element?.matches(settings.rootSelector)) return false;
    if (root instanceof Document) return true;
    if (root instanceof Node) return root.contains(element);
    return getComboboxes().includes(element);
  };

  const getInput = (combobox: HTMLElement) =>
    asArray(
      combobox.querySelectorAll<HTMLElement>(settings.inputSelector)
    ).find((input) => resolveContainingCombobox(input) === combobox) ?? null;

  const getList = (combobox: HTMLElement) =>
    asArray(
      combobox.querySelectorAll<HTMLElement>(settings.listSelector)
    ).find((list) => resolveContainingCombobox(list) === combobox) ?? null;

  const getTrigger = (combobox: HTMLElement) =>
    asArray(
      combobox.querySelectorAll<HTMLElement>(settings.triggerSelector)
    ).find((trigger) => resolveContainingCombobox(trigger) === combobox) ??
    null;

  const getOptions = (combobox: HTMLElement) => {
    const list = getList(combobox);
    const scope = list ?? combobox;
    return asArray(
      scope.querySelectorAll<HTMLElement>(settings.optionSelector)
    ).filter((option) => resolveContainingCombobox(option) === combobox);
  };

  const isListOpen = (combobox: HTMLElement) => {
    const list = getList(combobox);
    return Boolean(list && !list.hasAttribute('hidden'));
  };

  const getVisibleOptions = (combobox: HTMLElement) =>
    getOptions(combobox).filter((option) => !option.hasAttribute('hidden'));

  const getActiveOption = (combobox: HTMLElement) =>
    getVisibleOptions(combobox).find(
      (option) => option.getAttribute('combobox-option') === 'active'
    ) ?? null;

  const resolveCombobox = (target?: HTMLElement | null) => {
    if (target) {
      if (isManagedCombobox(target)) return target;

      const containing = resolveContainingCombobox(target);
      if (containing && isManagedCombobox(containing)) return containing;
    }

    return getComboboxes().find(isListOpen) ?? getComboboxes()[0] ?? null;
  };

  const namedBase = (combobox: HTMLElement) => {
    const name = combobox.getAttribute('name');
    if (name) return slugFromName(name);
    if (combobox.id) return slugFromName(combobox.id);
    return null;
  };

  const matchesFilter = (option: HTMLElement, query: string) => {
    if (!query) return true;
    const label = (option.textContent ?? '').trim().toLowerCase();
    if (label.includes(query)) return true;
    const value = option.getAttribute('data-value');
    return value != null && value.toLowerCase().includes(query);
  };

  const applyFilter = (combobox: HTMLElement) => {
    const input = getInput(combobox);
    const query = input ? getInputValue(input).trim().toLowerCase() : '';

    getOptions(combobox).forEach((option) => {
      const match = matchesFilter(option, query);
      if (option.hidden !== !match) {
        option.hidden = !match;
      }
    });

    const active = getActiveOption(combobox);
    if (!active) {
      getOptions(combobox).forEach((option) => {
        if (option.getAttribute('combobox-option') === 'active') {
          option.setAttribute('combobox-option', '');
        }
      });
      const inputEl = getInput(combobox);
      if (inputEl?.hasAttribute('aria-activedescendant')) {
        inputEl.removeAttribute('aria-activedescendant');
      }
    }
  };

  const revealOptions = (combobox: HTMLElement) => {
    getOptions(combobox).forEach((option) => {
      if (option.hidden) {
        option.hidden = false;
      }
    });
  };

  const setExpanded = (combobox: HTMLElement, expanded: boolean) => {
    const expandedValue = String(expanded);
    const input = getInput(combobox);
    if (input && input.getAttribute('aria-expanded') !== expandedValue) {
      input.setAttribute('aria-expanded', expandedValue);
    }

    const trigger = getTrigger(combobox);
    if (trigger && trigger.getAttribute('aria-expanded') !== expandedValue) {
      trigger.setAttribute('aria-expanded', expandedValue);
    }
  };

  const setOpenState = (combobox: HTMLElement, open: boolean) => {
    const list = getList(combobox);
    if (!list) return;
    if (list.hidden === !open) return;
    list.hidden = !open;
  };

  const setActiveOption = (
    combobox: HTMLElement,
    option: HTMLElement | null
  ) => {
    const input = getInput(combobox);
    getOptions(combobox).forEach((candidate) => {
      if (candidate === option) {
        if (candidate.getAttribute('combobox-option') !== 'active') {
          candidate.setAttribute('combobox-option', 'active');
        }
        return;
      }
      if (candidate.getAttribute('combobox-option') === 'active') {
        candidate.setAttribute('combobox-option', '');
      }
    });

    if (!input) return;
    if (option?.id) {
      if (input.getAttribute('aria-activedescendant') !== option.id) {
        input.setAttribute('aria-activedescendant', option.id);
      }
      if (typeof option.scrollIntoView === 'function') {
        option.scrollIntoView({ block: 'nearest' });
      }
      return;
    }

    if (input.hasAttribute('aria-activedescendant')) {
      input.removeAttribute('aria-activedescendant');
    }
  };

  const ensureComboboxAccessibility = (combobox: HTMLElement) => {
    const input = getInput(combobox);
    const list = getList(combobox);
    const trigger = getTrigger(combobox);
    const options = getOptions(combobox);
    if (!input || !list) return;

    const base = namedBase(combobox);

    if (input.getAttribute('role') !== 'combobox') {
      input.setAttribute('role', 'combobox');
    }

    if (input.getAttribute('aria-autocomplete') !== 'list') {
      input.setAttribute('aria-autocomplete', 'list');
    }

    assignUniqueId(list, base ? `${base}-list` : null, LIST_ID_PREFIX);

    if (list.getAttribute('role') !== 'listbox') {
      list.setAttribute('role', 'listbox');
    }

    if (input.getAttribute('aria-controls') !== list.id) {
      input.setAttribute('aria-controls', list.id);
    }

    options.forEach((option, index) => {
      assignUniqueId(
        option,
        base ? `${base}-option-${index + 1}` : null,
        OPTION_ID_PREFIX
      );
      if (option.getAttribute('role') !== 'option') {
        option.setAttribute('role', 'option');
      }
    });

    if (trigger) {
      if (!isNativeInteractive(trigger)) {
        trigger.setAttribute('role', 'button');
        if (!trigger.hasAttribute('tabindex')) {
          trigger.setAttribute('tabindex', '0');
        }
      }
      if (trigger.getAttribute('aria-controls') !== list.id) {
        trigger.setAttribute('aria-controls', list.id);
      }
      if (!trigger.hasAttribute('aria-haspopup')) {
        trigger.setAttribute('aria-haspopup', 'listbox');
      }
    }

    setExpanded(combobox, isListOpen(combobox));
  };

  const hideCombobox = (combobox: HTMLElement) => {
    ensureComboboxAccessibility(combobox);
    setOpenState(combobox, false);
    setExpanded(combobox, false);
    setActiveOption(combobox, null);
    revealOptions(combobox);
  };

  const showCombobox = (combobox: HTMLElement) => {
    getComboboxes()
      .concat(
        asArray(document.querySelectorAll<HTMLElement>(settings.rootSelector))
      )
      .forEach((other) => {
        if (other === combobox || !isListOpen(other)) return;
        hideCombobox(other);
      });

    ensureComboboxAccessibility(combobox);
    applyFilter(combobox);
    setOpenState(combobox, true);
    setExpanded(combobox, true);
  };

  const open = (target?: HTMLElement | null) => {
    const combobox = resolveCombobox(target);
    if (!combobox) return;
    const input = getInput(combobox);
    if (!input || isInputDisabled(input)) return;
    if (isListOpen(combobox)) {
      ensureComboboxAccessibility(combobox);
      applyFilter(combobox);
      setExpanded(combobox, true);
      return;
    }
    showCombobox(combobox);
  };

  const close = (target?: HTMLElement | null) => {
    const combobox = resolveCombobox(target);
    if (!combobox || !isListOpen(combobox)) return;
    hideCombobox(combobox);
  };

  const toggle = (target?: HTMLElement | null) => {
    const combobox = resolveCombobox(target);
    if (!combobox) return;
    if (isListOpen(combobox)) {
      close(combobox);
      return;
    }
    open(target ?? combobox);
  };

  const selectOption = (option: HTMLElement) => {
    const combobox = resolveContainingCombobox(option);
    if (!combobox || !isManagedCombobox(combobox)) return;

    const input = getInput(combobox);
    if (!input || isInputDisabled(input)) return;

    ensureComboboxAccessibility(combobox);

    const value = option.hasAttribute('data-value')
      ? (option.getAttribute('data-value') ?? '')
      : (option.textContent ?? '').trim();
    setInputValue(input, value);

    getOptions(combobox).forEach((candidate) => {
      const selected = candidate === option;
      const selectedValue = String(selected);
      if (candidate.getAttribute('aria-selected') !== selectedValue) {
        candidate.setAttribute('aria-selected', selectedValue);
      }
    });

    setActiveOption(combobox, option);
    hideCombobox(combobox);
  };

  const select = (target?: HTMLElement | null) => {
    if (target) {
      if (target.matches(settings.optionSelector)) {
        selectOption(target);
        return;
      }

      const closestOption = target.closest(settings.optionSelector);
      if (closestOption instanceof HTMLElement) {
        selectOption(closestOption);
        return;
      }
    }

    const combobox = resolveCombobox(target);
    if (!combobox) return;
    const active = getActiveOption(combobox);
    if (active) {
      selectOption(active);
    }
  };

  const moveActive = (
    combobox: HTMLElement,
    nextIndex: (index: number, length: number) => number
  ) => {
    const visible = getVisibleOptions(combobox);
    if (visible.length === 0) return;

    const current = visible.findIndex(
      (option) => option.getAttribute('combobox-option') === 'active'
    );
    const index = nextIndex(current, visible.length);
    const next = visible[Math.max(0, Math.min(visible.length - 1, index))];
    if (!next) return;
    setActiveOption(combobox, next);
  };

  const sync = () => {
    getComboboxes().forEach((combobox) => {
      ensureComboboxAccessibility(combobox);
      if (isListOpen(combobox)) {
        applyFilter(combobox);
        setExpanded(combobox, true);
        return;
      }
      setExpanded(combobox, false);
    });
  };

  const resolveOptionFromEvent = (target: Element, combobox: HTMLElement) => {
    const option = target.closest(settings.optionSelector);
    if (!(option instanceof HTMLElement)) return null;
    return resolveContainingCombobox(option) === combobox ? option : null;
  };

  const resolveTriggerFromEvent = (target: Element, combobox: HTMLElement) => {
    const trigger = target.closest(settings.triggerSelector);
    if (!(trigger instanceof HTMLElement)) return null;
    return resolveContainingCombobox(trigger) === combobox ? trigger : null;
  };

  const resolveInputFromEvent = (target: Element, combobox: HTMLElement) => {
    const input = target.closest(settings.inputSelector);
    if (!(input instanceof HTMLElement)) return null;
    return resolveContainingCombobox(input) === combobox ? input : null;
  };

  const handleDocumentClick = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const combobox = resolveContainingCombobox(target);
    if (combobox && isManagedCombobox(combobox)) {
      const option = resolveOptionFromEvent(target, combobox);
      if (option) {
        if (!claimEvent(event)) return;
        selectOption(option);
        return;
      }

      const trigger = resolveTriggerFromEvent(target, combobox);
      if (trigger) {
        if (!claimEvent(event)) return;
        toggle(combobox);
        const input = getInput(combobox);
        if (isListOpen(combobox) && input && document.activeElement !== input) {
          input.focus();
        }
        return;
      }

      return;
    }

    const openComboboxes = getComboboxes().filter(isListOpen);
    if (openComboboxes.length === 0) return;
    if (!claimEvent(event)) return;
    openComboboxes.forEach((openCombobox) => hideCombobox(openCombobox));
  };

  const handleDocumentMouseDown = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const combobox = resolveContainingCombobox(target);
    if (!combobox || !isManagedCombobox(combobox)) return;

    const option = resolveOptionFromEvent(target, combobox);
    if (!option) return;
    event.preventDefault();
  };

  const handleDocumentFocusIn = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const combobox = resolveContainingCombobox(target);
    if (!combobox || !isManagedCombobox(combobox)) return;

    const input = resolveInputFromEvent(target, combobox);
    if (!input || isInputDisabled(input)) return;
    if (!claimEvent(event)) return;
    open(combobox);
  };

  const handleDocumentFocusOut = (event: Event) => {
    if (!(event instanceof FocusEvent)) return;
    const target = event.target;
    if (!(target instanceof Element)) return;

    const combobox = resolveContainingCombobox(target);
    if (!combobox || !isManagedCombobox(combobox) || !isListOpen(combobox)) {
      return;
    }

    const input = resolveInputFromEvent(target, combobox);
    if (!input) return;

    const next = event.relatedTarget;
    if (next instanceof Node && combobox.contains(next)) return;
    if (!claimEvent(event)) return;
    hideCombobox(combobox);
  };

  const handleDocumentInput = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const combobox = resolveContainingCombobox(target);
    if (!combobox || !isManagedCombobox(combobox)) return;

    const input = resolveInputFromEvent(target, combobox);
    if (!input || isInputDisabled(input)) return;
    if (!claimEvent(event)) return;
    open(combobox);
  };

  const handleDocumentKeydown = (event: Event) => {
    if (!(event instanceof KeyboardEvent)) return;
    if (isComposingKey(event)) return;
    const target = event.target;
    if (!(target instanceof Element)) return;

    const combobox = resolveContainingCombobox(target);
    if (!combobox || !isManagedCombobox(combobox)) return;

    const input = resolveInputFromEvent(target, combobox);
    const trigger = resolveTriggerFromEvent(target, combobox);
    if (!input && !trigger) return;
    if (input && isInputDisabled(input)) return;

    if (event.key === 'Escape') {
      if (!isListOpen(combobox)) return;
      if (shouldYieldEscape() || event.defaultPrevented) return;
      if (!claimEvent(event)) return;
      event.preventDefault();
      event.stopPropagation();
      close(combobox);
      return;
    }

    if (event.key === 'Tab') {
      if (!isListOpen(combobox)) return;
      if (!claimEvent(event)) return;
      close(combobox);
      return;
    }

    if (event.key === 'ArrowDown') {
      if (!claimEvent(event)) return;
      event.preventDefault();
      if (!isListOpen(combobox)) {
        open(combobox);
      }
      if (trigger && !input) {
        getInput(combobox)?.focus();
      }
      moveActive(combobox, (index) => (index < 0 ? 0 : index + 1));
      return;
    }

    if (event.key === 'ArrowUp') {
      if (!claimEvent(event)) return;
      event.preventDefault();
      if (!isListOpen(combobox)) {
        open(combobox);
      }
      if (trigger && !input) {
        getInput(combobox)?.focus();
      }
      moveActive(combobox, (index, length) =>
        index < 0 ? length - 1 : index - 1
      );
      return;
    }

    if (
      trigger &&
      !input &&
      !isNativeInteractive(trigger) &&
      (event.key === 'Enter' || event.key === ' ')
    ) {
      if (!claimEvent(event)) return;
      event.preventDefault();
      toggle(combobox);
      const field = getInput(combobox);
      if (isListOpen(combobox) && field && document.activeElement !== field) {
        field.focus();
      }
      return;
    }

    if (!input) return;
    if (!isListOpen(combobox)) return;

    if (event.key === 'Home') {
      if (!claimEvent(event)) return;
      event.preventDefault();
      moveActive(combobox, () => 0);
      return;
    }

    if (event.key === 'End') {
      if (!claimEvent(event)) return;
      event.preventDefault();
      moveActive(combobox, (_index, length) => length - 1);
      return;
    }

    if (event.key !== 'Enter') return;
    const active = getActiveOption(combobox);
    if (!active) return;
    if (!claimEvent(event)) return;
    event.preventDefault();
    selectOption(active);
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

  document.addEventListener('click', handleDocumentClick);
  document.addEventListener('mousedown', handleDocumentMouseDown);
  document.addEventListener('focusin', handleDocumentFocusIn);
  document.addEventListener('focusout', handleDocumentFocusOut);
  document.addEventListener('input', handleDocumentInput);
  document.addEventListener('keydown', handleDocumentKeydown);

  if (observer && root instanceof Node) {
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        'hidden',
        'aria-expanded',
        'aria-selected',
        'aria-controls',
        'aria-activedescendant',
        'combobox',
        'combobox-input',
        'combobox-trigger',
        'combobox-list',
        'combobox-option',
      ],
    });
  }

  sync();

  return {
    destroy: () => {
      document.removeEventListener('click', handleDocumentClick);
      document.removeEventListener('mousedown', handleDocumentMouseDown);
      document.removeEventListener('focusin', handleDocumentFocusIn);
      document.removeEventListener('focusout', handleDocumentFocusOut);
      document.removeEventListener('input', handleDocumentInput);
      document.removeEventListener('keydown', handleDocumentKeydown);
      observer?.disconnect();
    },
    sync,
    open,
    close,
    toggle,
    select,
  };
};

export const initCombobox = (
  options: ComboboxOptions = {}
): ComboboxController => createCombobox(options);

let autoComboboxController: ComboboxController | null = null;
let autoStartSuspended = false;
let bootOnReady: (() => void) | null = null;

const cancelDeferredAutoStart = () => {
  if (!bootOnReady) return;
  document.removeEventListener('DOMContentLoaded', bootOnReady);
  bootOnReady = null;
};

export const startComboboxRuntime = (): ComboboxController | null => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  autoStartSuspended = false;
  cancelDeferredAutoStart();

  if (autoComboboxController) {
    autoComboboxController.sync();
    return autoComboboxController;
  }

  autoComboboxController = createCombobox();
  return autoComboboxController;
};

export const stopComboboxRuntime = () => {
  autoStartSuspended = true;
  cancelDeferredAutoStart();
  autoComboboxController?.destroy();
  autoComboboxController = null;
};

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    bootOnReady = () => {
      bootOnReady = null;
      if (!autoStartSuspended) {
        startComboboxRuntime();
      }
    };
    document.addEventListener('DOMContentLoaded', bootOnReady);
  } else {
    startComboboxRuntime();
  }
}
