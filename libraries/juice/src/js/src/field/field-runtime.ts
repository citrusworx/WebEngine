/**
 * DOM-first runtime for Juice field wrappers.
 *
 * Markup contract (Slice A — do not rename attrs):
 *   [field]         host wrapper around a control. Any attribute value
 *                   is still a field. Sync does not rewrite the attribute.
 *   [field-label]   chrome only. This runtime does not name the control.
 *                   Naming stays with the input, textarea, and select
 *                   runtimes.
 *   [field-help]    optional help text.
 *   [field-error]   optional error text.
 *   [field][invalid] wrapper invalid state. Paints in CSS. This runtime
 *                   mirrors it onto the control when the author has not
 *                   set aria-invalid.
 *
 * Sync (markup-driven):
 *   1. Find the control: the first input, textarea, or select inside
 *      the field that is not inside a nested field. A button, a nested
 *      field's control, and a field with no control are skipped.
 *   2. When the author has not set aria-describedby, point it at the
 *      visible [field-help] and [field-error] in that field, in
 *      document order. Nested fields keep their own parts. Give a part
 *      an id only when it lacks one. Hidden parts and empty text are
 *      skipped. An author aria-describedby is kept. A blank value is
 *      not a description.
 *   3. [field][invalid] sets aria-invalid="true" on the control when
 *      the author has not set aria-invalid. A blank value is not set.
 *      Clearing [invalid] removes only an aria-invalid this runtime
 *      wrote.
 *   4. Anything this runtime wrote (aria-describedby, aria-invalid, or
 *      an id on a help or error part) is removed when its source goes
 *      away, or on destroy. An author value is left in place.
 *
 * Typing, change, and keys stay on the native control. There is no
 * validation engine, no floating label, no keyboard handler, no
 * Escape handler, no focus trap, and no Sig Field factory.
 *
 * Limitations: validation, a floating label, keyboard handling,
 * Escape, a focus trap, naming, and a Sig Field factory are out of
 * scope. [field-label] is chrome only.
 */

import { createJuiceChanges } from '../shared/change.js';

export type FieldOptions = {
  root?: ParentNode;
  fieldSelector?: string;
};

export type FieldState = {
  invalid: boolean;
};

export type FieldController = {
  destroy: () => void;
  sync: () => void;
  isInvalid: (target?: HTMLElement | null) => boolean;
  getState: (target?: HTMLElement | null) => FieldState | null;
};

type FieldControl = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

type FieldRecord = {
  control: FieldControl | null;
};

const CONTROL_SELECTOR = 'input, textarea, select';
const DESCRIPTION_SELECTOR = '[field-help], [field-error]';

const DEFAULT_ROOT: ParentNode =
  typeof document !== 'undefined' ? document : ({} as ParentNode);

const DEFAULTS: Required<FieldOptions> = {
  root: DEFAULT_ROOT,
  fieldSelector: '[field]',
};

const asArray = <T extends Element>(nodes: ArrayLike<T>): T[] =>
  Array.from(nodes);

const noopController = (): FieldController => ({
  destroy: () => {},
  sync: () => {},
  isInvalid: () => false,
  getState: () => null,
});

const isFieldControl = (element: Element | null | undefined): element is FieldControl =>
  element instanceof HTMLInputElement ||
  element instanceof HTMLTextAreaElement ||
  element instanceof HTMLSelectElement;

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

const describedbyTokens = (value: string | null) =>
  (value ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

export const createField = (options: FieldOptions = {}): FieldController => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return noopController();
  }

  const settings = { ...DEFAULTS, ...options };
  const root = settings.root ?? document;
  const ownedDescribedby = new WeakMap<HTMLElement, string>();
  const ownedInvalid = new WeakSet<HTMLElement>();
  const ownedIds = new WeakMap<HTMLElement, string>();
  const ownedIdElements = new Set<HTMLElement>();
  const controlOwner = new WeakMap<HTMLElement, HTMLElement>();
  const fieldRecords = new WeakMap<HTMLElement, FieldRecord>();
  const tracked = new Set<HTMLElement>();
  let referenced = new Set<HTMLElement>();
  let destroyed = false;
  let idCounter = 0;
  const changes = createJuiceChanges<FieldState>('field');

  const readFieldState = (field: HTMLElement): FieldState => ({
    invalid: field.hasAttribute('invalid'),
  });

  const publishField = (field: HTMLElement) => {
    changes.note(field, readFieldState(field));
  };

  const isManagedField = (
    element: Element | null | undefined
  ): element is HTMLElement => {
    if (!(element instanceof HTMLElement)) return false;
    if (!element.matches(settings.fieldSelector)) return false;
    if (root instanceof Document) return true;
    if (root instanceof Node) return root === element || root.contains(element);
    return false;
  };

  const getFields = () => {
    const found = asArray(
      root.querySelectorAll<HTMLElement>(settings.fieldSelector)
    ).filter(isManagedField);

    if (root instanceof HTMLElement && isManagedField(root)) {
      return [root, ...found.filter((field) => field !== root)];
    }

    return found;
  };

  const nearestField = (element: HTMLElement) =>
    element.parentElement?.closest<HTMLElement>(settings.fieldSelector) ?? null;

  const findControl = (field: HTMLElement) => {
    const nodes = field.querySelectorAll(CONTROL_SELECTOR);
    for (const node of nodes) {
      if (!isFieldControl(node)) continue;
      if (nearestField(node) !== field) continue;
      return node;
    }
    return null;
  };

  const findDescriptions = (field: HTMLElement, control: FieldControl) => {
    const found: HTMLElement[] = [];
    field.querySelectorAll<HTMLElement>(DESCRIPTION_SELECTOR).forEach((node) => {
      if (nearestField(node) !== field) return;
      if (node === control || node.contains(control) || control.contains(node)) {
        return;
      }
      if (!isVisibleElement(node)) return;
      if (!visibleText(node)) return;
      found.push(node);
    });
    return found;
  };

  const ownsDescribedby = (control: HTMLElement) => {
    const owned = ownedDescribedby.get(control);
    return (
      owned !== undefined && control.getAttribute('aria-describedby') === owned
    );
  };

  const hasAuthorDescribedby = (control: HTMLElement) => {
    const value = control.getAttribute('aria-describedby');
    if (value === null || value.trim() === '') return false;
    return !ownsDescribedby(control);
  };

  const hasAuthorInvalid = (control: HTMLElement) => {
    const value = control.getAttribute('aria-invalid');
    if (value === null || value.trim() === '') return false;
    return !(ownedInvalid.has(control) && value === 'true');
  };

  const clearOwnedDescribedby = (control: HTMLElement) => {
    const owned = ownedDescribedby.get(control);
    if (owned === undefined) return;
    if (control.getAttribute('aria-describedby') === owned) {
      control.removeAttribute('aria-describedby');
    }
    ownedDescribedby.delete(control);
  };

  const clearOwnedInvalid = (control: HTMLElement) => {
    if (!ownedInvalid.has(control)) return;
    if (control.getAttribute('aria-invalid') === 'true') {
      control.removeAttribute('aria-invalid');
    }
    ownedInvalid.delete(control);
  };

  const releaseControl = (field: HTMLElement, control: HTMLElement) => {
    if (controlOwner.get(control) !== field) return;
    clearOwnedDescribedby(control);
    clearOwnedInvalid(control);
    controlOwner.delete(control);
  };

  const releaseField = (field: HTMLElement) => {
    const record = fieldRecords.get(field);
    fieldRecords.delete(field);
    if (record?.control) releaseControl(field, record.control);
  };

  const ensureId = (element: HTMLElement) => {
    const existing = element.id.trim();
    if (existing) {
      const owned = ownedIds.get(element);
      if (owned && owned !== existing) {
        ownedIds.delete(element);
        ownedIdElements.delete(element);
      }
      return existing;
    }

    let id = '';
    do {
      idCounter += 1;
      id = `juice-field-desc-${idCounter}`;
    } while (document.getElementById(id));

    element.id = id;
    ownedIds.set(element, id);
    ownedIdElements.add(element);
    return id;
  };

  const descriptionStillReferenced = (id: string) => {
    const nodes = document.querySelectorAll<HTMLElement>('[aria-describedby]');
    for (const node of nodes) {
      if (describedbyTokens(node.getAttribute('aria-describedby')).includes(id)) {
        return true;
      }
    }
    return false;
  };

  const releaseUnreferencedIds = () => {
    for (const element of [...ownedIdElements]) {
      if (referenced.has(element)) continue;
      const id = ownedIds.get(element);
      ownedIds.delete(element);
      ownedIdElements.delete(element);
      if (!id || element.id !== id) continue;
      if (element.isConnected && descriptionStillReferenced(id)) continue;
      element.removeAttribute('id');
    }
  };

  const syncField = (field: HTMLElement) => {
    const control = findControl(field);
    const previous = fieldRecords.get(field);
    if (previous?.control && previous.control !== control) {
      releaseControl(field, previous.control);
    }

    if (!control) {
      fieldRecords.set(field, { control: null });
      publishField(field);
      return;
    }

    controlOwner.set(control, field);

    if (hasAuthorDescribedby(control)) {
      ownedDescribedby.delete(control);
    } else {
      const ids: string[] = [];
      for (const description of findDescriptions(field, control)) {
        const id = ensureId(description);
        referenced.add(description);
        if (!ids.includes(id)) ids.push(id);
      }
      if (ids.length) {
        const value = ids.join(' ');
        if (control.getAttribute('aria-describedby') !== value) {
          control.setAttribute('aria-describedby', value);
        }
        ownedDescribedby.set(control, value);
      } else {
        clearOwnedDescribedby(control);
      }
    }

    if (field.hasAttribute('invalid')) {
      if (!hasAuthorInvalid(control)) {
        if (control.getAttribute('aria-invalid') !== 'true') {
          control.setAttribute('aria-invalid', 'true');
        }
        ownedInvalid.add(control);
      } else if (
        ownedInvalid.has(control) &&
        control.getAttribute('aria-invalid') !== 'true'
      ) {
        ownedInvalid.delete(control);
      }
    } else {
      clearOwnedInvalid(control);
    }

    fieldRecords.set(field, { control });
    publishField(field);
  };

  const resolveField = (target?: HTMLElement | null) => {
    const fromTarget = target?.closest(settings.fieldSelector);
    if (fromTarget instanceof HTMLElement && isManagedField(fromTarget)) {
      return fromTarget;
    }
    return getFields()[0] ?? null;
  };

  const isInvalid = (target?: HTMLElement | null) => {
    const field = resolveField(target);
    if (!field) return false;
    return readFieldState(field).invalid;
  };

  const getState = (target?: HTMLElement | null): FieldState | null => {
    const field = resolveField(target);
    if (!field) return null;
    return readFieldState(field);
  };

  const sync = () => {
    if (destroyed) return;
    const current = getFields();
    const currentSet = new Set(current);
    referenced = new Set();

    tracked.forEach((field) => {
      if (currentSet.has(field)) return;
      releaseField(field);
      tracked.delete(field);
    });

    current.forEach((field) => {
      tracked.add(field);
      syncField(field);
    });

    releaseUnreferencedIds();
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
        'field',
        'field-help',
        'field-error',
        'invalid',
        'hidden',
        'aria-hidden',
        'aria-describedby',
        'aria-invalid',
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
      observer?.disconnect();
      for (const field of [...tracked]) {
        releaseField(field);
      }
      tracked.clear();
      referenced = new Set();
      releaseUnreferencedIds();
    },
    sync,
    isInvalid,
    getState,
  };
};

export const initField = createField;

let autoFieldController: FieldController | null = null;
let autoStartSuspended = false;
let bootOnReady: (() => void) | null = null;

const cancelDeferredAutoStart = () => {
  if (!bootOnReady || typeof document === 'undefined') return;
  document.removeEventListener('DOMContentLoaded', bootOnReady);
  bootOnReady = null;
};

export const startFieldRuntime = (): FieldController | null => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  autoStartSuspended = false;
  cancelDeferredAutoStart();

  if (autoFieldController) {
    autoFieldController.sync();
    return autoFieldController;
  }

  autoFieldController = createField();
  return autoFieldController;
};

export const stopFieldRuntime = () => {
  autoStartSuspended = true;
  cancelDeferredAutoStart();
  autoFieldController?.destroy();
  autoFieldController = null;
};

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    bootOnReady = () => {
      bootOnReady = null;
      if (!autoStartSuspended) {
        startFieldRuntime();
      }
    };
    document.addEventListener('DOMContentLoaded', bootOnReady);
  } else {
    startFieldRuntime();
  }
}
