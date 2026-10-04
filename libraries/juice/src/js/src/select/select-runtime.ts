/**
 * DOM-first runtime for Juice native select chrome.
 *
 * Markup contract (Slice A — do not rename attrs):
 *   [select]        host, on the native element: <select select>.
 *                   Any attribute value is still a select. Sync does
 *                   not rewrite the attribute. A node that is not a
 *                   <select>, including [combobox], is ignored. A
 *                   <select> without [select] is ignored.
 *   [select-label]  optional visible label. Pair it with the control
 *                   (wrapping element, or for/id).
 *
 * The open list stays the platform popup. There is no [select-list]
 * and no [select-option]. [multiple] and size listboxes stay native
 * <select> elements. Sync does not set role, aria-expanded,
 * aria-multiselectable, or tabindex, and it does not build a listbox.
 *
 * Sync (markup-driven):
 *   1. Name the control from a visible label when the author has not
 *      set an accessible name. Sources, in order: an associated
 *      <label for>, a wrapping <label>, then [select-label] (for/id,
 *      a wrapping element, or the nearest preceding sibling).
 *   2. An author aria-label or aria-labelledby is kept. A blank value
 *      is not a name. title is left untouched and does not block a
 *      visible label.
 *   3. A label that does not contain the control is referenced with
 *      aria-labelledby (an id is added only when that label has none).
 *      A wrapping label is copied into aria-label as its visible text,
 *      excluding the control, so the selected option is not part of
 *      the name. Hidden labels and empty text are skipped.
 *   4. When no visible label exists, sync does not invent a name.
 *      A name this runtime wrote is removed if that label goes away.
 *
 * Change and keys stay on the native control. There is no keyboard
 * handler, no Escape handler, no focus trap, and no Sig Select factory.
 *
 * Limitations: a custom listbox, keyboard handling, Escape, a focus
 * trap, and a Sig Select factory are out of scope. See
 * docs/juice/juice-select-runtime.md.
 */

import { escapeId } from '../shared/ids.js';

export type SelectOptions = {
  root?: ParentNode;
  selectSelector?: string;
};

export type SelectController = {
  destroy: () => void;
  sync: () => void;
};

type OwnedName = {
  attribute: 'aria-label' | 'aria-labelledby';
  value: string;
};

const DEFAULT_ROOT: ParentNode =
  typeof document !== 'undefined' ? document : ({} as ParentNode);

const DEFAULTS: Required<SelectOptions> = {
  root: DEFAULT_ROOT,
  selectSelector: 'select[select]',
};

const asArray = <T extends Element>(nodes: ArrayLike<T>): T[] =>
  Array.from(nodes);

const noopController = (): SelectController => ({
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
      if (node instanceof HTMLSelectElement) return;
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

export const createSelect = (
  options: SelectOptions = {}
): SelectController => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return noopController();
  }

  const settings = { ...DEFAULTS, ...options };
  const root = settings.root ?? document;
  const ownedNames = new WeakMap<HTMLSelectElement, OwnedName>();
  let destroyed = false;
  let idCounter = 0;

  const isManagedSelect = (
    element: HTMLElement | null | undefined
  ): element is HTMLSelectElement => {
    if (!(element instanceof HTMLSelectElement)) return false;
    if (!element.matches(settings.selectSelector)) return false;
    if (element.closest('[combobox]')) return false;
    if (root instanceof Document) return true;
    if (root instanceof Node) return root === element || root.contains(element);
    return false;
  };

  const getSelects = () => {
    const found = asArray(
      root.querySelectorAll<HTMLElement>(settings.selectSelector)
    ).filter(isManagedSelect);

    if (root instanceof HTMLSelectElement && isManagedSelect(root)) {
      return [root, ...found.filter((select) => select !== root)];
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
    select: HTMLSelectElement
  ) => {
    if (!label || label === select) return null;
    if (select.contains(label)) return null;
    if (!isVisibleElement(label)) return null;
    if (!visibleLabelText(label)) return null;
    return label;
  };

  const labelsFor = (select: HTMLSelectElement) => {
    if (!select.id) return [];
    const escaped = escapeId(select.id);
    const found = queryAll(`label[for="${escaped}"]`).filter(
      (label): label is HTMLLabelElement =>
        label instanceof HTMLLabelElement && label.htmlFor === select.id
    );

    if (select.labels) {
      Array.from(select.labels).forEach((label) => {
        if (label.htmlFor === select.id && !found.includes(label)) {
          found.push(label);
        }
      });
    }

    return found;
  };

  const wrappingLabel = (select: HTMLSelectElement) => {
    const label = select.closest('label');
    if (!(label instanceof HTMLLabelElement)) return null;
    if (label.htmlFor && label.htmlFor !== select.id) return null;
    return label;
  };

  const selectLabelFor = (select: HTMLSelectElement) => {
    if (!select.id) return null;
    const escaped = escapeId(select.id);
    const match = queryAll(`[select-label][for="${escaped}"]`).find(
      (label) => label.getAttribute('for') === select.id
    );
    return usableLabel(match, select);
  };

  const wrappingSelectLabel = (select: HTMLSelectElement) => {
    const label = select.parentElement?.closest<HTMLElement>('[select-label]');
    if (!label || label.querySelectorAll(settings.selectSelector).length !== 1) {
      return null;
    }
    return usableLabel(label, select);
  };

  const precedingSelectLabel = (select: HTMLSelectElement) => {
    let sibling = select.previousElementSibling;
    while (sibling) {
      if (sibling instanceof HTMLSelectElement) return null;
      if (sibling instanceof HTMLElement) {
        if (sibling.matches('[select-label]')) {
          return usableLabel(sibling, select);
        }
        if (!sibling.querySelector('select')) {
          const nested = sibling.querySelector<HTMLElement>('[select-label]');
          const match = usableLabel(nested, select);
          if (match) return match;
        }
      }
      sibling = sibling.previousElementSibling;
    }
    return null;
  };

  const findLabel = (select: HTMLSelectElement) => {
    for (const label of labelsFor(select)) {
      const match = usableLabel(label, select);
      if (match) return match;
    }

    const wrapped = usableLabel(wrappingLabel(select), select);
    if (wrapped) return wrapped;

    return (
      selectLabelFor(select) ??
      wrappingSelectLabel(select) ??
      precedingSelectLabel(select)
    );
  };

  const owns = (
    select: HTMLSelectElement,
    attribute: OwnedName['attribute']
  ) => {
    const owned = ownedNames.get(select);
    return (
      owned?.attribute === attribute &&
      select.getAttribute(attribute) === owned.value
    );
  };

  const hasAuthorName = (select: HTMLSelectElement) => {
    const ariaLabel = select.getAttribute('aria-label');
    if (ariaLabel !== null && ariaLabel.trim() !== '' && !owns(select, 'aria-label')) {
      return true;
    }

    const labelledBy = select.getAttribute('aria-labelledby');
    return (
      labelledBy !== null &&
      labelledBy.trim() !== '' &&
      !owns(select, 'aria-labelledby')
    );
  };

  const clearOwned = (select: HTMLSelectElement) => {
    const owned = ownedNames.get(select);
    if (!owned) return;
    if (select.getAttribute(owned.attribute) === owned.value) {
      select.removeAttribute(owned.attribute);
    }
    ownedNames.delete(select);
  };

  const releaseOwnedForAuthor = (select: HTMLSelectElement) => {
    const owned = ownedNames.get(select);
    if (!owned) return;

    const ariaLabel = select.getAttribute('aria-label');
    const labelledBy = select.getAttribute('aria-labelledby');
    const authorLabel =
      ariaLabel !== null && ariaLabel.trim() !== '' && !owns(select, 'aria-label');
    const authorBy =
      labelledBy !== null &&
      labelledBy.trim() !== '' &&
      !owns(select, 'aria-labelledby');

    if (
      owned.attribute === 'aria-labelledby' &&
      authorLabel &&
      select.getAttribute('aria-labelledby') === owned.value
    ) {
      select.removeAttribute('aria-labelledby');
    }

    if (
      owned.attribute === 'aria-label' &&
      authorBy &&
      select.getAttribute('aria-label') === owned.value
    ) {
      select.removeAttribute('aria-label');
    }

    ownedNames.delete(select);
  };

  const ensureId = (element: HTMLElement) => {
    if (element.id.trim()) return element.id;

    let id = '';
    do {
      idCounter += 1;
      id = `juice-select-label-${idCounter}`;
    } while (document.getElementById(id));

    element.id = id;
    return id;
  };

  const setOwned = (
    select: HTMLSelectElement,
    attribute: OwnedName['attribute'],
    value: string
  ) => {
    const other: OwnedName['attribute'] =
      attribute === 'aria-label' ? 'aria-labelledby' : 'aria-label';
    const owned = ownedNames.get(select);
    if (owned?.attribute === other && select.getAttribute(other) === owned.value) {
      select.removeAttribute(other);
    }
    if (select.getAttribute(attribute) !== value) {
      select.setAttribute(attribute, value);
    }
    ownedNames.set(select, { attribute, value });
  };

  const syncSelect = (select: HTMLSelectElement) => {
    if (!isManagedSelect(select)) return;

    if (hasAuthorName(select)) {
      releaseOwnedForAuthor(select);
      return;
    }

    const label = findLabel(select);
    const text = label ? visibleLabelText(label) : '';
    if (!label || !text) {
      clearOwned(select);
      return;
    }

    if (label.contains(select)) {
      setOwned(select, 'aria-label', text);
      return;
    }

    setOwned(select, 'aria-labelledby', ensureId(label));
  };

  const sync = () => {
    if (destroyed) return;
    getSelects().forEach((select) => syncSelect(select));
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
        'select',
        'select-label',
        'for',
        'id',
        'hidden',
        'aria-hidden',
        'aria-label',
        'aria-labelledby',
        'multiple',
        'size',
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

export const initSelect = (options: SelectOptions = {}): SelectController =>
  createSelect(options);

let autoSelectController: SelectController | null = null;
let autoStartSuspended = false;
let bootOnReady: (() => void) | null = null;

const cancelDeferredAutoStart = () => {
  if (!bootOnReady || typeof document === 'undefined') return;
  document.removeEventListener('DOMContentLoaded', bootOnReady);
  bootOnReady = null;
};

export const startSelectRuntime = (): SelectController | null => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  autoStartSuspended = false;
  cancelDeferredAutoStart();

  if (autoSelectController) {
    autoSelectController.sync();
    return autoSelectController;
  }

  autoSelectController = createSelect();
  return autoSelectController;
};

export const stopSelectRuntime = () => {
  autoStartSuspended = true;
  cancelDeferredAutoStart();
  autoSelectController?.destroy();
  autoSelectController = null;
};

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    bootOnReady = () => {
      bootOnReady = null;
      if (!autoStartSuspended) {
        startSelectRuntime();
      }
    };
    document.addEventListener('DOMContentLoaded', bootOnReady);
  } else {
    startSelectRuntime();
  }
}
