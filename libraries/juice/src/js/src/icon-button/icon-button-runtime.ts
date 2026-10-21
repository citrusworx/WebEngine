/**
 * DOM-first runtime for Juice icon-button chrome.
 *
 * Markup contract (Slice A — do not rename attrs):
 *   [icon-button]         host. Square control on the existing button
 *                         chrome. Any value, including "round", is still
 *                         an icon button. Sync does not rewrite the
 *                         attribute. [icon-button][round] is the same
 *                         circle option. [scale="sm"|"lg"] stays CSS.
 *   [toggle]              on the host, this control is a pressed toggle.
 *                         Click flips it. Enter and Space flip it only
 *                         when the host is not a native button (and not
 *                         an <a href>, matching the other runtimes'
 *                         native-interactive check). A native <button>
 *                         already turns those keys into a click.
 *   [pressed]             kept in sync with aria-pressed on toggles.
 *                         An initial [pressed] or aria-pressed="true"
 *                         starts pressed. Anything else starts
 *                         aria-pressed="false". Non-toggles are not
 *                         given aria-pressed.
 *
 * Sync (markup-driven):
 *   1. Name check. An accessible name is a non-empty aria-label, an
 *      aria-labelledby that resolves to visible text, or visible text
 *      on the host. Blank values are not names. title is left
 *      untouched and is not a name (same convention as input and
 *      select). SVG subtrees and icon-only content contribute no
 *      text. Hidden and aria-hidden subtrees are skipped. This
 *      runtime does not invent a label.
 *   2. In development (NODE_ENV === "development"), an unnamed host
 *      warns once per element via console.warn. Production and test
 *      stay silent. A name added later does not warn again.
 *   3. Toggles write aria-pressed "true"|"false" and mirror [pressed].
 *      Disabled hosts ([disabled] or aria-disabled="true", including
 *      a native disabled button) still receive the initial value and
 *      do not flip.
 *   4. A non-button toggle gets role="button" and tabindex="0" when
 *      those are missing, so Enter and Space can reach it. An author
 *      role or tabindex is kept. Native buttons and links are left
 *      alone, including type.
 *
 * State is { pressed, disabled, named }. The first observation is
 * recorded and does not dispatch. Later changes dispatch a bubbling
 * juice:change CustomEvent with detail { runtime: "icon-button", state }.
 *
 * Not a switch and not a checkbox. No focus trap, no Escape handler,
 * and no Sig IconButton factory.
 */

import { createJuiceChanges } from '../shared/change.js';
import { createEventClaim } from '../shared/events.js';

export type IconButtonOptions = {
  root?: ParentNode;
  iconButtonSelector?: string;
};

export type IconButtonState = {
  pressed: boolean;
  disabled: boolean;
  named: boolean;
};

export type IconButtonController = {
  destroy: () => void;
  sync: () => void;
  toggle: (target?: HTMLElement | null) => void;
  getState: (target?: HTMLElement | null) => IconButtonState | null;
};

const DEFAULT_ROOT: ParentNode =
  typeof document !== 'undefined' ? document : ({} as ParentNode);

const DEFAULTS: Required<IconButtonOptions> = {
  root: DEFAULT_ROOT,
  iconButtonSelector: '[icon-button]',
};

const asArray = <T extends Element>(nodes: ArrayLike<T>): T[] =>
  Array.from(nodes);

const claimEvent = createEventClaim();
const warnedUnnamed = new WeakSet<HTMLElement>();

const isDevelopment = () =>
  typeof process !== 'undefined' && process.env.NODE_ENV === 'development';

const isNativeInteractive = (element: HTMLElement) => {
  if (element instanceof HTMLButtonElement) return true;
  if (element instanceof HTMLAnchorElement && element.hasAttribute('href')) {
    return true;
  }
  return false;
};

const isDisabled = (element: HTMLElement) => {
  if (element.getAttribute('aria-disabled') === 'true') return true;
  if (element instanceof HTMLButtonElement && element.disabled) return true;
  if (element instanceof HTMLInputElement && element.disabled) return true;
  return element.hasAttribute('disabled');
};

const isToggle = (element: HTMLElement) => element.hasAttribute('toggle');

const isVisibleElement = (element: HTMLElement) => {
  let current: HTMLElement | null = element;
  while (current) {
    if (current.hidden || current.getAttribute('aria-hidden') === 'true') {
      return false;
    }
    current = current.parentElement;
  }
  return true;
};

const visibleText = (element: HTMLElement) => {
  const parts: string[] = [];

  const walk = (node: Node) => {
    if (node instanceof SVGElement) return;
    if (
      node !== element &&
      node instanceof HTMLElement &&
      (node.hidden || node.getAttribute('aria-hidden') === 'true')
    ) {
      return;
    }
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent) parts.push(node.textContent);
      return;
    }
    node.childNodes.forEach((child) => walk(child));
  };

  walk(element);
  return parts.join('').replace(/\s+/g, ' ').trim();
};

const labelledByText = (element: HTMLElement) => {
  const value = element.getAttribute('aria-labelledby');
  if (value === null || value.trim() === '') return '';

  const parts: string[] = [];
  value
    .trim()
    .split(/\s+/)
    .forEach((id) => {
      const label = element.ownerDocument.getElementById(id);
      if (!(label instanceof HTMLElement)) return;
      if (!isVisibleElement(label)) return;
      const text = visibleText(label);
      if (text) parts.push(text);
    });

  return parts.join(' ').replace(/\s+/g, ' ').trim();
};

const hasAccessibleName = (element: HTMLElement) => {
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel !== null && ariaLabel.trim() !== '') return true;
  if (labelledByText(element)) return true;
  return visibleText(element) !== '';
};

const readPressed = (element: HTMLElement) =>
  element.getAttribute('aria-pressed') === 'true' ||
  element.hasAttribute('pressed');

const writePressed = (element: HTMLElement, pressed: boolean) => {
  const value = pressed ? 'true' : 'false';
  if (element.getAttribute('aria-pressed') !== value) {
    element.setAttribute('aria-pressed', value);
  }
  if (pressed) {
    if (!element.hasAttribute('pressed')) element.setAttribute('pressed', '');
    return;
  }
  if (element.hasAttribute('pressed')) element.removeAttribute('pressed');
};

const readState = (element: HTMLElement): IconButtonState => ({
  pressed: readPressed(element),
  disabled: isDisabled(element),
  named: hasAccessibleName(element),
});

const warnIfUnnamed = (element: HTMLElement) => {
  if (!isDevelopment()) return;
  if (hasAccessibleName(element)) return;
  if (warnedUnnamed.has(element)) return;
  warnedUnnamed.add(element);
  console.warn(
    '[juice] [icon-button] has no accessible name. Add a non-empty aria-label, an aria-labelledby that resolves to text, or visible text. Icon-only content and title do not count.',
    element
  );
};

const noopController = (): IconButtonController => ({
  destroy: () => {},
  sync: () => {},
  toggle: () => {},
  getState: () => null,
});

export const createIconButton = (
  options: IconButtonOptions = {}
): IconButtonController => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return noopController();
  }

  const settings = { ...DEFAULTS, ...options };
  const root = settings.root ?? document;
  const rootEvents = root as ParentNode & EventTarget;
  const changes = createJuiceChanges<IconButtonState>('icon-button');
  let destroyed = false;

  const isManaged = (element: HTMLElement | null | undefined) => {
    if (!(element instanceof HTMLElement)) return false;
    if (!element.matches(settings.iconButtonSelector)) return false;
    if (root instanceof Document) return true;
    if (root instanceof Node) return root === element || root.contains(element);
    return false;
  };

  const getButtons = () => {
    const found = asArray(
      root.querySelectorAll<HTMLElement>(settings.iconButtonSelector)
    ).filter(isManaged);

    if (root instanceof HTMLElement && isManaged(root)) {
      return [root, ...found.filter((button) => button !== root)];
    }

    return found;
  };

  const resolveIconButton = (target?: HTMLElement | null) => {
    if (target) {
      if (isManaged(target)) return target;
      const containing = target.closest(settings.iconButtonSelector);
      if (containing instanceof HTMLElement && isManaged(containing)) {
        return containing;
      }
      return null;
    }

    return getButtons()[0] ?? null;
  };

  const ensureChrome = (element: HTMLElement) => {
    if (!isToggle(element) || isNativeInteractive(element)) return;
    if (!element.hasAttribute('role')) element.setAttribute('role', 'button');
    if (!element.hasAttribute('tabindex')) element.setAttribute('tabindex', '0');
  };

  const ensureToggle = (element: HTMLElement) => {
    if (!isToggle(element)) return;
    ensureChrome(element);
    writePressed(element, readPressed(element));
  };

  const commitPressed = (element: HTMLElement, pressed: boolean) => {
    const baseline = readState(element);
    ensureChrome(element);
    writePressed(element, pressed);
    changes.note(element, readState(element), { baseline });
  };

  const toggle = (target?: HTMLElement | null) => {
    if (destroyed) return;
    const control = resolveIconButton(target);
    if (!control || !isToggle(control) || isDisabled(control)) return;
    warnIfUnnamed(control);
    commitPressed(control, !readPressed(control));
  };

  const sync = () => {
    if (destroyed) return;
    getButtons().forEach((button) => {
      if (!isManaged(button)) return;
      ensureToggle(button);
      warnIfUnnamed(button);
      changes.note(button, readState(button));
    });
  };

  const fromEvent = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return null;
    const control = target.closest(settings.iconButtonSelector);
    if (!(control instanceof HTMLElement) || !isManaged(control)) return null;
    return control;
  };

  const handleRootClick = (event: Event) => {
    if (destroyed) return;
    const control = fromEvent(event.target);
    if (!control || !isToggle(control) || isDisabled(control)) return;
    if (!claimEvent(event)) return;
    toggle(control);
  };

  const handleRootKeydown = (event: Event) => {
    if (destroyed) return;
    if (!(event instanceof KeyboardEvent)) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;

    const control = fromEvent(event.target);
    if (!control || !isToggle(control) || isDisabled(control)) return;
    if (isNativeInteractive(control)) return;
    if (!claimEvent(event)) return;

    event.preventDefault();
    toggle(control);
  };

  let syncScheduled = false;
  let syncFrame = 0;
  const scheduleSync = () => {
    if (syncScheduled || destroyed) return;
    syncScheduled = true;
    syncFrame = requestAnimationFrame(() => {
      syncScheduled = false;
      sync();
    });
  };

  const observer =
    typeof MutationObserver !== 'undefined'
      ? new MutationObserver(() => scheduleSync())
      : null;

  rootEvents.addEventListener('click', handleRootClick);
  rootEvents.addEventListener('keydown', handleRootKeydown);

  if (observer && root instanceof Node) {
    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: [
        'icon-button',
        'toggle',
        'pressed',
        'disabled',
        'role',
        'tabindex',
        'hidden',
        'aria-hidden',
        'aria-pressed',
        'aria-disabled',
        'aria-label',
        'aria-labelledby',
        'title',
        'href',
        'id',
      ],
    });
  }

  sync();

  return {
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      if (syncScheduled) {
        cancelAnimationFrame(syncFrame);
        syncScheduled = false;
      }
      rootEvents.removeEventListener('click', handleRootClick);
      rootEvents.removeEventListener('keydown', handleRootKeydown);
      observer?.disconnect();
    },
    sync,
    toggle,
    getState: (target) => {
      const control = resolveIconButton(target);
      if (!control) return null;
      return readState(control);
    },
  };
};

export const initIconButton = createIconButton;

let autoIconButtonController: IconButtonController | null = null;
let autoStartSuspended = false;
let bootOnReady: (() => void) | null = null;

const cancelDeferredAutoStart = () => {
  if (!bootOnReady || typeof document === 'undefined') return;
  document.removeEventListener('DOMContentLoaded', bootOnReady);
  bootOnReady = null;
};

export const startIconButtonRuntime = (): IconButtonController | null => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  autoStartSuspended = false;
  cancelDeferredAutoStart();

  if (autoIconButtonController) {
    autoIconButtonController.sync();
    return autoIconButtonController;
  }

  autoIconButtonController = createIconButton();
  return autoIconButtonController;
};

export const stopIconButtonRuntime = () => {
  autoStartSuspended = true;
  cancelDeferredAutoStart();
  autoIconButtonController?.destroy();
  autoIconButtonController = null;
};

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    bootOnReady = () => {
      bootOnReady = null;
      if (!autoStartSuspended) {
        startIconButtonRuntime();
      }
    };
    document.addEventListener('DOMContentLoaded', bootOnReady);
  } else {
    startIconButtonRuntime();
  }
}
