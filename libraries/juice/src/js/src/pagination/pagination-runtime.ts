/**
 * DOM-first pagination runtime for Juice pagination chrome.
 *
 * Markup contract (Slice A — do not rename attrs):
 *   [pagination]       page-set root. Authors use <nav pagination> or
 *                      <ol pagination>.
 *   [pagination-item]  one cell. Layout only.
 *   [pagination-link]  optional. Anchors and buttons inside the control
 *                      are enough.
 *   [pagination-prev] / [pagination-next]
 *                      previous and next controls. The attr may sit on
 *                      the anchor or button, or on the item that wraps it.
 *   [pagination-ellipsis]
 *                      optional gap marker. Not a page control.
 *   [pagination-status]
 *                      optional "Page 2 of 12" text. Not a page control.
 *                      Ends are not parsed from this text.
 *
 * This is chrome, not a router. It does not remove href, listen to
 * history, trap focus, or handle Escape. It is not a layered overlay.
 *
 * Sync (markup-driven):
 *   1. Make the root a navigation landmark only when that is safe.
 *      Same rules as breadcrumb:
 *      - <nav> is already a landmark. Do not add a redundant
 *        role="navigation".
 *      - An element with no role that is not a list (ol / ul / menu)
 *        gets role="navigation". role="navigation" on a list would
 *        drop the list semantics, so <ol pagination> is left alone.
 *      - An author role is never overwritten.
 *      - Ancestor <nav> elements are not relabeled.
 *   2. Name that landmark only when it has no accessible name.
 *      When the root is a navigation landmark and aria-label,
 *      aria-labelledby, and title are all missing or blank, sync sets
 *      aria-label="Pagination". A non-empty author name is kept.
 *      Lists and other non-navigation roots are not given that label.
 *   3. Keep exactly one aria-current="page" inside the root when the
 *      set has a page control.
 *      Page controls are owned cells and links that are not prev,
 *      next, ellipsis, or status. If the author already set
 *      aria-current="page", the first one in tree order stays and any
 *      others in this root are removed. If none is set, the first page
 *      control is marked (on its link when it has one). A set with no
 *      page control is left without a current page.
 *   4. Sync prev/next disabled at the ends when that is inferable.
 *      Inference uses page controls plus optional ellipsis, not status
 *      text. Prev is disabled when the current page is the first page
 *      control and no ellipsis sits before it, or when that control's
 *      text is page 1. Next is disabled when the current page is the
 *      last page control and no ellipsis sits after it. Author-owned
 *      disabled (aria-disabled="true", native disabled, or [disabled]
 *      already present before this runtime wrote it) is never cleared.
 *      Runtime-owned disabled is aria-disabled="true", and disabled on
 *      buttons so they do not activate.
 *
 * Keyboard (conservative): ArrowLeft / ArrowUp and ArrowRight /
 * ArrowDown move focus to the previous or next enabled control. Home /
 * End move to the first or last enabled control. Disabled controls are
 * skipped. Focus does not wrap. Enter and Space are left to the
 * browser. A disabled link's click is cancelled so it does not navigate.
 *
 * setCurrent(item | index, pagination?) moves that single current. An
 * index applies to page controls only (prev / next are not pages), on
 * the given root, or the first root when omitted. It is not navigation.
 */

import { createEventClaim } from '../shared/events.js';

export type PaginationOptions = {
  root?: ParentNode;
  paginationSelector?: string;
  itemSelector?: string;
};

export type PaginationController = {
  destroy: () => void;
  sync: () => void;
  setCurrent: (
    itemOrIndex: HTMLElement | number,
    pagination?: HTMLElement | null
  ) => void;
};

type SlotKind = 'page' | 'prev' | 'next' | 'ellipsis' | 'status';

type Slot = {
  element: HTMLElement;
  kind: SlotKind;
  target: HTMLElement;
};

const DEFAULT_ROOT: ParentNode =
  typeof document !== 'undefined' ? document : ({} as ParentNode);

const DEFAULTS: Required<PaginationOptions> = {
  root: DEFAULT_ROOT,
  paginationSelector: '[pagination]',
  itemSelector: '[pagination-item]',
};

const LIST_TAGS = new Set(['OL', 'UL', 'MENU']);
const ARROW_NEXT = new Set(['ArrowRight', 'ArrowDown']);
const ARROW_PREV = new Set(['ArrowLeft', 'ArrowUp']);
const INTERACTIVE_SELECTOR = 'a, button, [pagination-link]';

const asArray = <T extends Element>(nodes: ArrayLike<T>): T[] =>
  Array.from(nodes);

const claimEvent = createEventClaim();

const runtimeDisabled = new WeakSet<HTMLElement>();
const authorDisabled = new WeakSet<HTMLElement>();

const hasAccessibleName = (element: HTMLElement) => {
  const label = element.getAttribute('aria-label');
  if (label !== null && label.trim() !== '') return true;

  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy !== null && labelledBy.trim() !== '') return true;

  const title = element.getAttribute('title');
  return title !== null && title.trim() !== '';
};

const isNavigationLandmark = (element: HTMLElement) => {
  const role = element.getAttribute('role');
  if (role) return role === 'navigation';
  return element.tagName === 'NAV';
};

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  if (target instanceof HTMLInputElement) return true;
  if (target instanceof HTMLTextAreaElement) return true;
  if (target instanceof HTMLSelectElement) return true;
  return target.isContentEditable;
};

const isDisabled = (element: HTMLElement) => {
  if (element.getAttribute('aria-disabled') === 'true') return true;
  if (element instanceof HTMLButtonElement && element.disabled) return true;
  if (element instanceof HTMLInputElement && element.disabled) return true;
  return element.hasAttribute('disabled');
};

const pageNumber = (element: HTMLElement) => {
  const sources = [element.textContent, element.getAttribute('aria-label')];
  for (const source of sources) {
    const text = source?.trim() ?? '';
    if (/^\d+$/.test(text)) return Number(text);
  }
  return null;
};

const noopController = (): PaginationController => ({
  destroy: () => {},
  sync: () => {},
  setCurrent: () => {},
});

export const createPagination = (
  options: PaginationOptions = {}
): PaginationController => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return noopController();
  }

  const settings = { ...DEFAULTS, ...options };
  const root = settings.root ?? document;
  const rootEvents = root as ParentNode & EventTarget;

  const partSelector = [
    settings.itemSelector,
    '[pagination-prev]',
    '[pagination-next]',
    '[pagination-ellipsis]',
    '[pagination-status]',
    '[pagination-link]',
    'a',
    'button',
  ].join(', ');

  const isManaged = (element: HTMLElement | null | undefined) => {
    if (!element?.matches(settings.paginationSelector)) return false;
    if (root instanceof Document) return true;
    if (root instanceof Node) return root === element || root.contains(element);
    return false;
  };

  const getPaginations = () => {
    const found = asArray(
      root.querySelectorAll<HTMLElement>(settings.paginationSelector)
    ).filter(isManaged);

    if (root instanceof HTMLElement && isManaged(root)) {
      return [root, ...found];
    }

    return found;
  };

  const belongsTo = (pagination: HTMLElement, element: Element) =>
    element.closest(settings.paginationSelector) === pagination;

  const partInside = (
    pagination: HTMLElement,
    element: HTMLElement,
    selector: string
  ) => {
    if (element.matches(selector)) return true;
    const found = element.querySelector(selector);
    return Boolean(found && belongsTo(pagination, found));
  };

  const kindOf = (pagination: HTMLElement, element: HTMLElement): SlotKind => {
    if (partInside(pagination, element, '[pagination-ellipsis]')) return 'ellipsis';
    if (partInside(pagination, element, '[pagination-status]')) return 'status';
    if (partInside(pagination, element, '[pagination-prev]')) return 'prev';
    if (partInside(pagination, element, '[pagination-next]')) return 'next';
    return 'page';
  };

  const interactiveTarget = (pagination: HTMLElement, element: HTMLElement) => {
    if (
      element.matches(INTERACTIVE_SELECTOR) &&
      !element.matches('[pagination-ellipsis], [pagination-status]')
    ) {
      return element;
    }

    const inner = asArray(
      element.querySelectorAll<HTMLElement>(INTERACTIVE_SELECTOR)
    ).find(
      (node) =>
        belongsTo(pagination, node) &&
        !node.closest('[pagination-ellipsis], [pagination-status]')
    );

    return inner ?? element;
  };

  const getSlots = (pagination: HTMLElement): Slot[] => {
    const nodes = asArray(
      pagination.querySelectorAll<HTMLElement>(partSelector)
    ).filter((node) => belongsTo(pagination, node));

    const slots: Slot[] = [];
    nodes.forEach((node) => {
      if (slots.some((slot) => slot.element.contains(node))) return;
      slots.push({
        element: node,
        kind: kindOf(pagination, node),
        target: interactiveTarget(pagination, node),
      });
    });
    return slots;
  };

  const findPageCurrents = (pagination: HTMLElement) => {
    const found = asArray(
      pagination.querySelectorAll<HTMLElement>('[aria-current="page"]')
    ).filter((element) => belongsTo(pagination, element));

    if (pagination.getAttribute('aria-current') === 'page') {
      return [pagination, ...found];
    }

    return found;
  };

  const markCurrent = (element: HTMLElement) => {
    if (element.getAttribute('aria-current') !== 'page') {
      element.setAttribute('aria-current', 'page');
    }
  };

  const clearPageCurrentExcept = (
    pagination: HTMLElement,
    keep: HTMLElement | null
  ) => {
    findPageCurrents(pagination).forEach((element) => {
      if (element !== keep) element.removeAttribute('aria-current');
    });
  };

  const ensureLandmark = (pagination: HTMLElement) => {
    const role = pagination.getAttribute('role');
    const isList = LIST_TAGS.has(pagination.tagName);

    if (!role && !isList && pagination.tagName !== 'NAV') {
      pagination.setAttribute('role', 'navigation');
    }

    if (isNavigationLandmark(pagination) && !hasAccessibleName(pagination)) {
      pagination.setAttribute('aria-label', 'Pagination');
    }
  };

  const slotDisabled = (slot: Slot) =>
    isDisabled(slot.target) ||
    (slot.element !== slot.target && isDisabled(slot.element));

  const noteAuthorDisabled = (slot: Slot) => {
    const control = slot.target;
    if (runtimeDisabled.has(control)) return;
    if (authorDisabled.has(control)) {
      if (!slotDisabled(slot)) authorDisabled.delete(control);
      return;
    }
    if (slotDisabled(slot)) authorDisabled.add(control);
  };

  const setRuntimeDisabled = (control: HTMLElement, disabled: boolean) => {
    if (authorDisabled.has(control)) return;

    if (disabled) {
      runtimeDisabled.add(control);
      if (control.getAttribute('aria-disabled') !== 'true') {
        control.setAttribute('aria-disabled', 'true');
      }
      if (control instanceof HTMLButtonElement && !control.disabled) {
        control.disabled = true;
      }
      return;
    }

    if (!runtimeDisabled.has(control)) return;
    runtimeDisabled.delete(control);
    if (control.getAttribute('aria-disabled') === 'true') {
      control.removeAttribute('aria-disabled');
    }
    if (control instanceof HTMLButtonElement && control.disabled) {
      control.disabled = false;
    }
  };

  const syncCurrent = (pagination: HTMLElement, slots: Slot[]) => {
    const currents = findPageCurrents(pagination);
    if (currents.length > 0) {
      clearPageCurrentExcept(pagination, currents[0]);
      return;
    }

    const firstPage = slots.find((slot) => slot.kind === 'page');
    if (!firstPage) return;
    markCurrent(firstPage.target);
  };

  const syncEnds = (pagination: HTMLElement, slots: Slot[]) => {
    const pages = slots.filter((slot) => slot.kind === 'page');
    const current = findPageCurrents(pagination)[0] ?? null;
    const currentPage = current
      ? (pages.find(
          (slot) =>
            slot.element === current ||
            slot.target === current ||
            slot.element.contains(current)
        ) ?? null)
      : null;

    let atStart = false;
    let atEnd = false;
    if (currentPage) {
      const currentIndex = slots.indexOf(currentPage);
      const ellipsisBefore = slots.some(
        (slot, index) => slot.kind === 'ellipsis' && index < currentIndex
      );
      const ellipsisAfter = slots.some(
        (slot, index) => slot.kind === 'ellipsis' && index > currentIndex
      );
      atStart = currentPage === pages[0] && !ellipsisBefore;
      atEnd = currentPage === pages[pages.length - 1] && !ellipsisAfter;
      if (
        pageNumber(currentPage.target) === 1 ||
        pageNumber(currentPage.element) === 1
      ) {
        atStart = true;
      }
    }

    const inferable = Boolean(currentPage);
    slots.forEach((slot) => {
      if (slot.kind !== 'prev' && slot.kind !== 'next') return;
      noteAuthorDisabled(slot);
      const disable =
        inferable && (slot.kind === 'prev' ? atStart : atEnd);
      setRuntimeDisabled(slot.target, disable);
    });
  };

  const syncPagination = (pagination: HTMLElement) => {
    if (!isManaged(pagination)) return;
    ensureLandmark(pagination);
    const slots = getSlots(pagination);
    syncCurrent(pagination, slots);
    syncEnds(pagination, slots);
  };

  const sync = () => {
    getPaginations().forEach((pagination) => {
      syncPagination(pagination);
    });
  };

  const resolvePagination = (target?: HTMLElement | null) => {
    if (target) {
      if (isManaged(target)) return target;
      const pagination = target.closest(settings.paginationSelector);
      if (pagination instanceof HTMLElement && isManaged(pagination)) {
        return pagination;
      }
      return null;
    }

    return getPaginations()[0] ?? null;
  };

  const setCurrent = (
    itemOrIndex: HTMLElement | number,
    pagination?: HTMLElement | null
  ) => {
    const explicit = itemOrIndex instanceof HTMLElement ? itemOrIndex : null;
    const paginationEl = resolvePagination(pagination ?? explicit);
    if (!paginationEl) return;

    const pages = getSlots(paginationEl).filter((slot) => slot.kind === 'page');
    const slot =
      typeof itemOrIndex === 'number'
        ? Number.isInteger(itemOrIndex)
          ? (pages[itemOrIndex] ?? null)
          : null
        : (pages.find(
            (page) =>
              page.element === itemOrIndex ||
              page.target === itemOrIndex ||
              page.element.contains(itemOrIndex)
          ) ?? null);

    if (!slot || !paginationEl.contains(slot.element)) return;

    const target =
      explicit &&
      explicit !== slot.element &&
      slot.element.contains(explicit) &&
      explicit.matches(INTERACTIVE_SELECTOR)
        ? explicit
        : slot.target;

    clearPageCurrentExcept(paginationEl, target);
    markCurrent(target);
    syncPagination(paginationEl);
  };

  const keyboardSlots = (pagination: HTMLElement) => {
    const seen = new Set<HTMLElement>();
    return getSlots(pagination).filter((slot) => {
      if (slot.kind !== 'page' && slot.kind !== 'prev' && slot.kind !== 'next') {
        return false;
      }
      if (seen.has(slot.target)) return false;
      seen.add(slot.target);
      return true;
    });
  };

  const resolveInteractive = (target: Element) => {
    const interactive = target.closest(INTERACTIVE_SELECTOR);
    if (!(interactive instanceof HTMLElement)) return null;
    if (interactive.matches('[pagination-ellipsis], [pagination-status]')) {
      return null;
    }
    if (interactive.closest('[pagination-ellipsis], [pagination-status]')) {
      return null;
    }
    return interactive;
  };

  const handleRootClick = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const control = resolveInteractive(target);
    if (!control) return;

    const pagination = control.closest(settings.paginationSelector);
    if (!(pagination instanceof HTMLElement) || !isManaged(pagination)) return;

    const slot = getSlots(pagination).find((candidate) => candidate.target === control);
    const disabled = isDisabled(control) || (slot ? slotDisabled(slot) : false);
    if (!disabled) return;
    if (!claimEvent(event)) return;
    event.preventDefault();
  };

  const handleRootKeydown = (event: Event) => {
    if (!(event instanceof KeyboardEvent)) return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.defaultPrevented) return;

    const target = event.target;
    if (!(target instanceof Element) || isEditableTarget(target)) return;

    const control = resolveInteractive(target);
    if (!control) return;

    const pagination = control.closest(settings.paginationSelector);
    if (!(pagination instanceof HTMLElement) || !isManaged(pagination)) return;

    const slots = keyboardSlots(pagination);
    const index = slots.findIndex((slot) => slot.target === control);
    if (index < 0) return;

    const enabled = (slot: Slot) => !slotDisabled(slot);
    let next: Slot | undefined;
    if (event.key === 'Home') {
      next = slots.find(enabled);
    } else if (event.key === 'End') {
      next = [...slots].reverse().find(enabled);
    } else if (ARROW_NEXT.has(event.key)) {
      next = slots.slice(index + 1).find(enabled);
    } else if (ARROW_PREV.has(event.key)) {
      next = slots.slice(0, index).reverse().find(enabled);
    } else {
      return;
    }

    if (!claimEvent(event)) return;
    event.preventDefault();
    if (next && next.target !== control) next.target.focus();
  };

  let destroyed = false;
  let syncScheduled = false;
  let syncFrame = 0;
  const scheduleSync = () => {
    if (destroyed || syncScheduled) return;
    syncScheduled = true;
    syncFrame = requestAnimationFrame(() => {
      syncScheduled = false;
      if (!destroyed) sync();
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
      attributes: true,
      attributeFilter: [
        'pagination',
        'pagination-item',
        'pagination-link',
        'pagination-prev',
        'pagination-next',
        'pagination-ellipsis',
        'pagination-status',
        'aria-current',
        'aria-label',
        'aria-labelledby',
        'aria-disabled',
        'disabled',
        'role',
        'title',
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
      rootEvents.removeEventListener('click', handleRootClick);
      rootEvents.removeEventListener('keydown', handleRootKeydown);
    },
    sync,
    setCurrent,
  };
};

export const initPagination = (
  options: PaginationOptions = {}
): PaginationController => createPagination(options);

let autoPaginationController: PaginationController | null = null;
let autoStartSuspended = false;
let bootOnReady: (() => void) | null = null;

const cancelDeferredAutoStart = () => {
  if (!bootOnReady || typeof document === 'undefined') return;
  document.removeEventListener('DOMContentLoaded', bootOnReady);
  bootOnReady = null;
};

export const startPaginationRuntime = (): PaginationController | null => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  autoStartSuspended = false;
  cancelDeferredAutoStart();

  if (autoPaginationController) {
    autoPaginationController.sync();
    return autoPaginationController;
  }

  autoPaginationController = createPagination();
  return autoPaginationController;
};

export const stopPaginationRuntime = () => {
  autoStartSuspended = true;
  cancelDeferredAutoStart();
  autoPaginationController?.destroy();
  autoPaginationController = null;
};

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    bootOnReady = () => {
      bootOnReady = null;
      if (!autoStartSuspended) {
        startPaginationRuntime();
      }
    };
    document.addEventListener('DOMContentLoaded', bootOnReady);
  } else {
    startPaginationRuntime();
  }
}
