/**
 * DOM-first runtime for Juice native text-input chrome.
 *
 * Markup contract (Slice A — do not rename attrs):
 *   [input]        host, on the native element: <input input>.
 *                  Text-like types only: missing type, empty type,
 *                  text, email, password, search, tel, url, and
 *                  number. Any attribute value is still an input.
 *                  Sync does not rewrite the attribute. A node that
 *                  is not an <input> is ignored. An <input> without
 *                  [input] is ignored. Checkbox, radio, range, file,
 *                  date, time, datetime-local, month, week, color,
 *                  hidden, button, submit, reset, and image are
 *                  ignored. An input inside [combobox], including
 *                  [combobox-input], is ignored.
 *   [input-label]  optional visible label. Pair it with the control
 *                  (wrapping element, or for/id).
 *
 * Sync (markup-driven):
 *   1. Name the control from a visible label when the author has not
 *      set an accessible name. Sources, in order: an associated
 *      <label for>, a wrapping <label>, then [input-label] (for/id,
 *      a wrapping element, or the nearest preceding sibling).
 *   2. An author aria-label or aria-labelledby is kept. A blank value
 *      is not a name. title is left untouched and does not block a
 *      visible label.
 *   3. A label that does not contain the control is referenced with
 *      aria-labelledby (an id is added only when that label has none).
 *      A wrapping label is copied into aria-label as its visible text,
 *      excluding the control, so the input's own value is not part of
 *      the name. Hidden labels and empty text are skipped.
 *   4. When no visible label exists, sync does not invent a name.
 *      A name this runtime wrote is removed if that label goes away
 *      or the host stops being a text-like [input].
 *
 * Typing, change, and keys stay on the native control. There is no
 * mask, no validation engine, no floating label, no keyboard handler,
 * no Escape handler, no focus trap, and no Sig Input factory.
 *
 * Limitations: a mask, validation, a floating label, keyboard
 * handling, Escape, a focus trap, and a Sig Input factory are out of
 * scope. Runtime docs are later.
 */

import { escapeId } from '../shared/ids.js';

export type InputOptions = {
  root?: ParentNode;
  inputSelector?: string;
};

export type InputController = {
  destroy: () => void;
  sync: () => void;
};

type OwnedName = {
  attribute: 'aria-label' | 'aria-labelledby';
  value: string;
};

const TEXT_LIKE_TYPES = new Set([
  'text',
  'email',
  'password',
  'search',
  'tel',
  'url',
  'number',
]);

const DEFAULT_ROOT: ParentNode =
  typeof document !== 'undefined' ? document : ({} as ParentNode);

const DEFAULTS: Required<InputOptions> = {
  root: DEFAULT_ROOT,
  inputSelector: 'input[input]',
};

const asArray = <T extends Element>(nodes: ArrayLike<T>): T[] =>
  Array.from(nodes);

const noopController = (): InputController => ({
  destroy: () => {},
  sync: () => {},
});

const isTextLikeInput = (input: HTMLInputElement) => {
  if (!input.hasAttribute('type')) return true;
  const type = input.getAttribute('type') ?? '';
  if (type === '') return true;
  return TEXT_LIKE_TYPES.has(type.toLowerCase());
};

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

const visibleLabelText = (label: HTMLElement) => {
  const parts: string[] = [];

  const walk = (node: Node) => {
    if (node !== label) {
      if (node instanceof HTMLInputElement) return;
      if (
        node instanceof HTMLElement &&
        (node.hidden || node.getAttribute('aria-hidden') === 'true')
      ) {
        return;
      }
    }
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent) parts.push(node.textContent);
      return;
    }
    node.childNodes.forEach((child) => walk(child));
  };

  walk(label);
  return parts.join('').replace(/\s+/g, ' ').trim();
};

export const createInput = (options: InputOptions = {}): InputController => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return noopController();
  }

  const settings = { ...DEFAULTS, ...options };
  const root = settings.root ?? document;
  const ownedNames = new WeakMap<HTMLInputElement, OwnedName>();
  const tracked = new Set<HTMLInputElement>();
  let destroyed = false;
  let idCounter = 0;

  const isManagedInput = (
    element: HTMLElement | null | undefined
  ): element is HTMLInputElement => {
    if (!(element instanceof HTMLInputElement)) return false;
    if (!element.matches(settings.inputSelector)) return false;
    if (!isTextLikeInput(element)) return false;
    if (element.closest('[combobox]')) return false;
    if (element.hasAttribute('combobox-input')) return false;
    if (root instanceof Document) return true;
    if (root instanceof Node) return root === element || root.contains(element);
    return false;
  };

  const getInputs = () => {
    const found = asArray(
      root.querySelectorAll<HTMLElement>(settings.inputSelector)
    ).filter(isManagedInput);

    if (root instanceof HTMLInputElement && isManagedInput(root)) {
      return [root, ...found.filter((input) => input !== root)];
    }

    return found;
  };

  const queryAll = (selector: string) => {
    const found = new Set<HTMLElement>();
    const collect = (scope: ParentNode) => {
      if (!(scope instanceof Document || scope instanceof Element)) return;
      scope.querySelectorAll<HTMLElement>(selector).forEach((node) => {
        found.add(node);
      });
    };

    collect(root);
    if (typeof document !== 'undefined' && root !== document) collect(document);
    return Array.from(found);
  };

  const usableLabel = (
    label: HTMLElement | null | undefined,
    input: HTMLInputElement
  ) => {
    if (!label || label === input) return null;
    if (input.contains(label)) return null;
    if (!isVisibleElement(label)) return null;
    if (!visibleLabelText(label)) return null;
    return label;
  };

  const labelsFor = (input: HTMLInputElement) => {
    if (!input.id) return [];
    const escaped = escapeId(input.id);
    const found = queryAll(`label[for="${escaped}"]`).filter(
      (label): label is HTMLLabelElement =>
        label instanceof HTMLLabelElement && label.htmlFor === input.id
    );

    if (input.labels) {
      Array.from(input.labels).forEach((label) => {
        if (label.htmlFor === input.id && !found.includes(label)) {
          found.push(label);
        }
      });
    }

    return found;
  };

  const wrappingLabel = (input: HTMLInputElement) => {
    const label = input.closest('label');
    if (!(label instanceof HTMLLabelElement)) return null;
    if (label.htmlFor && label.htmlFor !== input.id) return null;
    return label;
  };

  const inputLabelFor = (input: HTMLInputElement) => {
    if (!input.id) return null;
    const escaped = escapeId(input.id);
    const match = queryAll(`[input-label][for="${escaped}"]`).find(
      (label) => label.getAttribute('for') === input.id
    );
    return usableLabel(match, input);
  };

  const textLikeHostsIn = (scope: ParentNode) => {
    if (!(scope instanceof Document || scope instanceof Element)) return [];
    return asArray(
      scope.querySelectorAll<HTMLElement>(settings.inputSelector)
    ).filter(
      (element): element is HTMLInputElement =>
        element instanceof HTMLInputElement &&
        isTextLikeInput(element) &&
        !element.closest('[combobox]') &&
        !element.hasAttribute('combobox-input')
    );
  };

  const wrappingInputLabel = (input: HTMLInputElement) => {
    const label = input.parentElement?.closest<HTMLElement>('[input-label]');
    if (!label || textLikeHostsIn(label).length !== 1) return null;
    return usableLabel(label, input);
  };

  const precedingInputLabel = (input: HTMLInputElement) => {
    let sibling = input.previousElementSibling;
    while (sibling) {
      if (sibling instanceof HTMLInputElement) return null;
      if (sibling instanceof HTMLElement) {
        if (sibling.matches('[input-label]')) {
          return usableLabel(sibling, input);
        }
        if (!sibling.querySelector('input')) {
          const nested = sibling.querySelector<HTMLElement>('[input-label]');
          const match = usableLabel(nested, input);
          if (match) return match;
        }
      }
      sibling = sibling.previousElementSibling;
    }
    return null;
  };

  const findLabel = (input: HTMLInputElement) => {
    for (const label of labelsFor(input)) {
      const match = usableLabel(label, input);
      if (match) return match;
    }

    const wrapped = usableLabel(wrappingLabel(input), input);
    if (wrapped) return wrapped;

    return (
      inputLabelFor(input) ??
      wrappingInputLabel(input) ??
      precedingInputLabel(input)
    );
  };

  const owns = (input: HTMLInputElement, attribute: OwnedName['attribute']) => {
    const owned = ownedNames.get(input);
    return (
      owned?.attribute === attribute &&
      input.getAttribute(attribute) === owned.value
    );
  };

  const hasAuthorName = (input: HTMLInputElement) => {
    const ariaLabel = input.getAttribute('aria-label');
    if (ariaLabel !== null && ariaLabel.trim() !== '' && !owns(input, 'aria-label')) {
      return true;
    }

    const labelledBy = input.getAttribute('aria-labelledby');
    return (
      labelledBy !== null &&
      labelledBy.trim() !== '' &&
      !owns(input, 'aria-labelledby')
    );
  };

  const clearOwned = (input: HTMLInputElement) => {
    const owned = ownedNames.get(input);
    if (!owned) return;
    if (input.getAttribute(owned.attribute) === owned.value) {
      input.removeAttribute(owned.attribute);
    }
    ownedNames.delete(input);
  };

  const releaseOwnedForAuthor = (input: HTMLInputElement) => {
    const owned = ownedNames.get(input);
    if (!owned) return;

    const ariaLabel = input.getAttribute('aria-label');
    const labelledBy = input.getAttribute('aria-labelledby');
    const authorLabel =
      ariaLabel !== null && ariaLabel.trim() !== '' && !owns(input, 'aria-label');
    const authorBy =
      labelledBy !== null &&
      labelledBy.trim() !== '' &&
      !owns(input, 'aria-labelledby');

    if (
      owned.attribute === 'aria-labelledby' &&
      authorLabel &&
      input.getAttribute('aria-labelledby') === owned.value
    ) {
      input.removeAttribute('aria-labelledby');
    }

    if (
      owned.attribute === 'aria-label' &&
      authorBy &&
      input.getAttribute('aria-label') === owned.value
    ) {
      input.removeAttribute('aria-label');
    }

    ownedNames.delete(input);
  };

  const ensureId = (element: HTMLElement) => {
    if (element.id.trim()) return element.id;

    let id = '';
    do {
      idCounter += 1;
      id = `juice-input-label-${idCounter}`;
    } while (document.getElementById(id));

    element.id = id;
    return id;
  };

  const setOwned = (
    input: HTMLInputElement,
    attribute: OwnedName['attribute'],
    value: string
  ) => {
    const other: OwnedName['attribute'] =
      attribute === 'aria-label' ? 'aria-labelledby' : 'aria-label';
    const owned = ownedNames.get(input);
    if (owned?.attribute === other && input.getAttribute(other) === owned.value) {
      input.removeAttribute(other);
    }
    if (input.getAttribute(attribute) !== value) {
      input.setAttribute(attribute, value);
    }
    ownedNames.set(input, { attribute, value });
  };

  const syncInput = (input: HTMLInputElement) => {
    if (!isManagedInput(input)) return;

    if (hasAuthorName(input)) {
      releaseOwnedForAuthor(input);
      return;
    }

    const label = findLabel(input);
    const text = label ? visibleLabelText(label) : '';
    if (!label || !text) {
      clearOwned(input);
      return;
    }

    if (label.contains(input)) {
      setOwned(input, 'aria-label', text);
      return;
    }

    setOwned(input, 'aria-labelledby', ensureId(label));
  };

  const sync = () => {
    if (destroyed) return;
    const current = getInputs();
    const currentSet = new Set(current);

    tracked.forEach((input) => {
      if (currentSet.has(input)) return;
      clearOwned(input);
      tracked.delete(input);
    });

    current.forEach((input) => {
      tracked.add(input);
      syncInput(input);
    });
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

  if (observer && root instanceof Node) {
    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: [
        'input',
        'input-label',
        'type',
        'for',
        'id',
        'hidden',
        'aria-hidden',
        'aria-label',
        'aria-labelledby',
        'combobox',
        'combobox-input',
      ],
    });
  }

  sync();

  return {
    destroy: () => {
      destroyed = true;
      if (syncScheduled) {
        cancelAnimationFrame(syncFrame);
        syncScheduled = false;
      }
      observer?.disconnect();
    },
    sync,
  };
};

export const initInput = createInput;

let autoInputController: InputController | null = null;
let autoStartSuspended = false;
let bootOnReady: (() => void) | null = null;

const cancelDeferredAutoStart = () => {
  if (!bootOnReady || typeof document === 'undefined') return;
  document.removeEventListener('DOMContentLoaded', bootOnReady);
  bootOnReady = null;
};

export const startInputRuntime = (): InputController | null => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  autoStartSuspended = false;
  cancelDeferredAutoStart();

  if (autoInputController) {
    autoInputController.sync();
    return autoInputController;
  }

  autoInputController = createInput();
  return autoInputController;
};

export const stopInputRuntime = () => {
  autoStartSuspended = true;
  cancelDeferredAutoStart();
  autoInputController?.destroy();
  autoInputController = null;
};

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    bootOnReady = () => {
      bootOnReady = null;
      if (!autoStartSuspended) {
        startInputRuntime();
      }
    };
    document.addEventListener('DOMContentLoaded', bootOnReady);
  } else {
    startInputRuntime();
  }
}
