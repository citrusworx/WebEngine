/**
 * DOM-first runtime for Juice native textarea chrome.
 *
 * Markup contract (Slice A — do not rename attrs):
 *   [textarea]        host, on the native element: <textarea textarea>.
 *                     Any attribute value is still a textarea. Sync does
 *                     not rewrite the attribute. A node that is not a
 *                     <textarea> is ignored. A <textarea> without
 *                     [textarea] is ignored. A textarea inside [combobox],
 *                     including [combobox-input], is ignored.
 *   [textarea-label]  optional visible label. Pair it with the control
 *                     (wrapping element, or for/id).
 *
 * Sync (markup-driven):
 *   1. Name the control from a visible label when the author has not
 *      set an accessible name. Sources, in order: an associated
 *      <label for>, a wrapping <label>, then [textarea-label] (for/id,
 *      a wrapping element, or the nearest preceding sibling).
 *   2. An author aria-label or aria-labelledby is kept. A blank value
 *      is not a name. title is left untouched and does not block a
 *      visible label.
 *   3. A label that does not contain the control is referenced with
 *      aria-labelledby (an id is added only when that label has none).
 *      A wrapping label is copied into aria-label as its visible text,
 *      excluding the control, so the textarea's own value is not part
 *      of the name. Hidden labels and empty text are skipped.
 *   4. When no visible label exists, sync does not invent a name.
 *      A name this runtime wrote is removed if that label goes away
 *      or the host stops being a [textarea] textarea.
 *
 * Typing, change, and keys stay on the native control. There is no
 * auto-grow, no character count, no validation engine, no floating
 * label, no keyboard handler, no Escape handler, no focus trap, and
 * no Sig Textarea factory.
 *
 * Limitations: auto-grow, a character count, validation, a floating
 * label, keyboard handling, Escape, a focus trap, and a Sig Textarea
 * factory are out of scope. Runtime docs are later.
 */

import { escapeId } from '../shared/ids.js';

export type TextareaOptions = {
  root?: ParentNode;
  textareaSelector?: string;
};

export type TextareaController = {
  destroy: () => void;
  sync: () => void;
};

type OwnedName = {
  attribute: 'aria-label' | 'aria-labelledby';
  value: string;
};

const DEFAULT_ROOT: ParentNode =
  typeof document !== 'undefined' ? document : ({} as ParentNode);

const DEFAULTS: Required<TextareaOptions> = {
  root: DEFAULT_ROOT,
  textareaSelector: 'textarea[textarea]',
};

const asArray = <T extends Element>(nodes: ArrayLike<T>): T[] =>
  Array.from(nodes);

const noopController = (): TextareaController => ({
  destroy: () => {},
  sync: () => {},
});

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
      if (node instanceof HTMLTextAreaElement) return;
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

export const createTextarea = (
  options: TextareaOptions = {}
): TextareaController => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return noopController();
  }

  const settings = { ...DEFAULTS, ...options };
  const root = settings.root ?? document;
  const ownedNames = new WeakMap<HTMLTextAreaElement, OwnedName>();
  const tracked = new Set<HTMLTextAreaElement>();
  let destroyed = false;
  let idCounter = 0;

  const isManagedTextarea = (
    element: HTMLElement | null | undefined
  ): element is HTMLTextAreaElement => {
    if (!(element instanceof HTMLTextAreaElement)) return false;
    if (!element.matches(settings.textareaSelector)) return false;
    if (element.closest('[combobox]')) return false;
    if (element.hasAttribute('combobox-input')) return false;
    if (root instanceof Document) return true;
    if (root instanceof Node) return root === element || root.contains(element);
    return false;
  };

  const getTextareas = () => {
    const found = asArray(
      root.querySelectorAll<HTMLElement>(settings.textareaSelector)
    ).filter(isManagedTextarea);

    if (root instanceof HTMLTextAreaElement && isManagedTextarea(root)) {
      return [root, ...found.filter((textarea) => textarea !== root)];
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
    textarea: HTMLTextAreaElement
  ) => {
    if (!label || label === textarea) return null;
    if (textarea.contains(label)) return null;
    if (!isVisibleElement(label)) return null;
    if (!visibleLabelText(label)) return null;
    return label;
  };

  const labelsFor = (textarea: HTMLTextAreaElement) => {
    if (!textarea.id) return [];
    const escaped = escapeId(textarea.id);
    const found = queryAll(`label[for="${escaped}"]`).filter(
      (label): label is HTMLLabelElement =>
        label instanceof HTMLLabelElement && label.htmlFor === textarea.id
    );

    if (textarea.labels) {
      Array.from(textarea.labels).forEach((label) => {
        if (label.htmlFor === textarea.id && !found.includes(label)) {
          found.push(label);
        }
      });
    }

    return found;
  };

  const wrappingLabel = (textarea: HTMLTextAreaElement) => {
    const label = textarea.closest('label');
    if (!(label instanceof HTMLLabelElement)) return null;
    if (label.htmlFor && label.htmlFor !== textarea.id) return null;
    return label;
  };

  const textareaLabelFor = (textarea: HTMLTextAreaElement) => {
    if (!textarea.id) return null;
    const escaped = escapeId(textarea.id);
    const match = queryAll(`[textarea-label][for="${escaped}"]`).find(
      (label) => label.getAttribute('for') === textarea.id
    );
    return usableLabel(match, textarea);
  };

  const textareaHostsIn = (scope: ParentNode) => {
    if (!(scope instanceof Document || scope instanceof Element)) return [];
    return asArray(
      scope.querySelectorAll<HTMLElement>(settings.textareaSelector)
    ).filter(
      (element): element is HTMLTextAreaElement =>
        element instanceof HTMLTextAreaElement &&
        !element.closest('[combobox]') &&
        !element.hasAttribute('combobox-input')
    );
  };

  const wrappingTextareaLabel = (textarea: HTMLTextAreaElement) => {
    const label = textarea.parentElement?.closest<HTMLElement>('[textarea-label]');
    if (!label || textareaHostsIn(label).length !== 1) return null;
    return usableLabel(label, textarea);
  };

  const precedingTextareaLabel = (textarea: HTMLTextAreaElement) => {
    let sibling = textarea.previousElementSibling;
    while (sibling) {
      if (sibling instanceof HTMLTextAreaElement) return null;
      if (sibling instanceof HTMLElement) {
        if (sibling.matches('[textarea-label]')) {
          return usableLabel(sibling, textarea);
        }
        if (!sibling.querySelector('textarea')) {
          const nested = sibling.querySelector<HTMLElement>('[textarea-label]');
          const match = usableLabel(nested, textarea);
          if (match) return match;
        }
      }
      sibling = sibling.previousElementSibling;
    }
    return null;
  };

  const findLabel = (textarea: HTMLTextAreaElement) => {
    for (const label of labelsFor(textarea)) {
      const match = usableLabel(label, textarea);
      if (match) return match;
    }

    const wrapped = usableLabel(wrappingLabel(textarea), textarea);
    if (wrapped) return wrapped;

    return (
      textareaLabelFor(textarea) ??
      wrappingTextareaLabel(textarea) ??
      precedingTextareaLabel(textarea)
    );
  };

  const owns = (
    textarea: HTMLTextAreaElement,
    attribute: OwnedName['attribute']
  ) => {
    const owned = ownedNames.get(textarea);
    return (
      owned?.attribute === attribute &&
      textarea.getAttribute(attribute) === owned.value
    );
  };

  const hasAuthorName = (textarea: HTMLTextAreaElement) => {
    const ariaLabel = textarea.getAttribute('aria-label');
    if (
      ariaLabel !== null &&
      ariaLabel.trim() !== '' &&
      !owns(textarea, 'aria-label')
    ) {
      return true;
    }

    const labelledBy = textarea.getAttribute('aria-labelledby');
    return (
      labelledBy !== null &&
      labelledBy.trim() !== '' &&
      !owns(textarea, 'aria-labelledby')
    );
  };

  const clearOwned = (textarea: HTMLTextAreaElement) => {
    const owned = ownedNames.get(textarea);
    if (!owned) return;
    if (textarea.getAttribute(owned.attribute) === owned.value) {
      textarea.removeAttribute(owned.attribute);
    }
    ownedNames.delete(textarea);
  };

  const releaseOwnedForAuthor = (textarea: HTMLTextAreaElement) => {
    const owned = ownedNames.get(textarea);
    if (!owned) return;

    const ariaLabel = textarea.getAttribute('aria-label');
    const labelledBy = textarea.getAttribute('aria-labelledby');
    const authorLabel =
      ariaLabel !== null &&
      ariaLabel.trim() !== '' &&
      !owns(textarea, 'aria-label');
    const authorBy =
      labelledBy !== null &&
      labelledBy.trim() !== '' &&
      !owns(textarea, 'aria-labelledby');

    if (
      owned.attribute === 'aria-labelledby' &&
      authorLabel &&
      textarea.getAttribute('aria-labelledby') === owned.value
    ) {
      textarea.removeAttribute('aria-labelledby');
    }

    if (
      owned.attribute === 'aria-label' &&
      authorBy &&
      textarea.getAttribute('aria-label') === owned.value
    ) {
      textarea.removeAttribute('aria-label');
    }

    ownedNames.delete(textarea);
  };

  const ensureId = (element: HTMLElement) => {
    if (element.id.trim()) return element.id;

    let id = '';
    do {
      idCounter += 1;
      id = `juice-textarea-label-${idCounter}`;
    } while (document.getElementById(id));

    element.id = id;
    return id;
  };

  const setOwned = (
    textarea: HTMLTextAreaElement,
    attribute: OwnedName['attribute'],
    value: string
  ) => {
    const other: OwnedName['attribute'] =
      attribute === 'aria-label' ? 'aria-labelledby' : 'aria-label';
    const owned = ownedNames.get(textarea);
    if (
      owned?.attribute === other &&
      textarea.getAttribute(other) === owned.value
    ) {
      textarea.removeAttribute(other);
    }
    if (textarea.getAttribute(attribute) !== value) {
      textarea.setAttribute(attribute, value);
    }
    ownedNames.set(textarea, { attribute, value });
  };

  const syncTextarea = (textarea: HTMLTextAreaElement) => {
    if (!isManagedTextarea(textarea)) return;

    if (hasAuthorName(textarea)) {
      releaseOwnedForAuthor(textarea);
      return;
    }

    const label = findLabel(textarea);
    const text = label ? visibleLabelText(label) : '';
    if (!label || !text) {
      clearOwned(textarea);
      return;
    }

    if (label.contains(textarea)) {
      setOwned(textarea, 'aria-label', text);
      return;
    }

    setOwned(textarea, 'aria-labelledby', ensureId(label));
  };

  const sync = () => {
    if (destroyed) return;
    const current = getTextareas();
    const currentSet = new Set(current);

    tracked.forEach((textarea) => {
      if (currentSet.has(textarea)) return;
      clearOwned(textarea);
      tracked.delete(textarea);
    });

    current.forEach((textarea) => {
      tracked.add(textarea);
      syncTextarea(textarea);
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
        'textarea',
        'textarea-label',
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

export const initTextarea = createTextarea;

let autoTextareaController: TextareaController | null = null;
let autoStartSuspended = false;
let bootOnReady: (() => void) | null = null;

const cancelDeferredAutoStart = () => {
  if (!bootOnReady || typeof document === 'undefined') return;
  document.removeEventListener('DOMContentLoaded', bootOnReady);
  bootOnReady = null;
};

export const startTextareaRuntime = (): TextareaController | null => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  autoStartSuspended = false;
  cancelDeferredAutoStart();

  if (autoTextareaController) {
    autoTextareaController.sync();
    return autoTextareaController;
  }

  autoTextareaController = createTextarea();
  return autoTextareaController;
};

export const stopTextareaRuntime = () => {
  autoStartSuspended = true;
  cancelDeferredAutoStart();
  autoTextareaController?.destroy();
  autoTextareaController = null;
};

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    bootOnReady = () => {
      bootOnReady = null;
      if (!autoStartSuspended) {
        startTextareaRuntime();
      }
    };
    document.addEventListener('DOMContentLoaded', bootOnReady);
  } else {
    startTextareaRuntime();
  }
}
