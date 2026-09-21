/**
 * DOM-first popover runtime for Juice popover chrome.
 *
 * Markup contract (Slice A — do not rename attrs):
 *   [popover-root][hidden] > [popover-panel] + [popover-header]? +
 *   [popover-body]? + [popover-close]?
 * Closed vs open is the native `hidden` attribute on [popover-root].
 *
 * Never use a bare `popover` attribute. HTML `popover=""` / `popover="manual"`
 * activates the platform Popover API. The floating surface is [popover-panel].
 *
 * Accessibility (honest v1): treat the panel as a **non-modal dialog**.
 * APG allows `role="dialog"` without `aria-modal` when the background stays
 * interactive (not inert). Escape and outside-click still dismiss. This is
 * not `role="menu"` (no arrow-key roving / typeahead in this cut) and not
 * a modal (`aria-modal="true"` would lie — there is no scrim).
 *
 * Openers: any element whose `aria-controls` token list includes a
 * `[popover-root]` id. The runtime sets `aria-expanded` / `aria-haspopup`.
 * `[popover-close]` dismisses the containing root.
 *
 * Placement (honest v1, no Floating UI): read `popover-root` (`top` /
 * `bottom` / `left` / `right`, default `bottom`), position `fixed` near the
 * opener from getBoundingClientRect (viewport coords; `fixed` needs no
 * scroll offset), with a small gap. If a transformed / filtered ancestor
 * is the fixed containing block, subtract that origin so Juice cards
 * (`[card="interactive"]:focus-within`) do not offset the panel. If the
 * preferred side overflows the viewport, flip once to the opposite side.
 * No shift / size middleware. Repositions on open, window resize, and
 * capture scroll (rAF-throttled).
 *
 * Escape closes the open popover on bubble (after modal/drawer capture),
 * and also yields when an open [modal-overlay] or [drawer-overlay] exists
 * or the event is already defaultPrevented (those dialogs own Escape).
 * Menu sits in the same dialog-adjacent band as popover (peers do not
 * yield to each other). Combobox / toast / tooltip yield to an open
 * popover or menu. Opening one managed popover closes the others. Modal
 * / drawer / menu are not auto-closed.
 */

import { createEventClaim } from '../shared/events.js';
import { moveFocusInto, wrapTabFocus } from '../shared/focus.js';
import { controlIds, resolveElementById } from '../shared/ids.js';
import { hasOpenDialogOverlay } from '../shared/overlays.js';

export type PopoverPlacement = 'top' | 'bottom' | 'left' | 'right';

export type PopoverOptions = {
  root?: ParentNode;
  rootSelector?: string;
  panelSelector?: string;
  closeSelector?: string;
  gap?: number;
};

export type PopoverController = {
  destroy: () => void;
  sync: () => void;
  open: (target?: HTMLElement | null) => void;
  close: (target?: HTMLElement | null) => void;
  toggle: (target?: HTMLElement | null) => void;
};

const DEFAULT_ROOT: ParentNode =
  typeof document !== 'undefined' ? document : ({} as ParentNode);

const DEFAULT_GAP = 8;

const DEFAULTS: Required<PopoverOptions> = {
  root: DEFAULT_ROOT,
  rootSelector: '[popover-root]',
  panelSelector: '[popover-panel]',
  closeSelector: '[popover-close]',
  gap: DEFAULT_GAP,
};

const PLACEMENTS = new Set<PopoverPlacement>([
  'top',
  'bottom',
  'left',
  'right',
]);

const asArray = <T extends Element>(nodes: ArrayLike<T>): T[] =>
  Array.from(nodes);

const ROOT_ID_PREFIX = 'juice-popover-root';
const PANEL_ID_PREFIX = 'juice-popover-panel';
const TITLE_ID_PREFIX = 'juice-popover-title';

const claimEvent = createEventClaim();
const focusRestorers = new WeakMap<HTMLElement, HTMLElement>();
const placementAnchors = new WeakMap<HTMLElement, HTMLElement>();

const slugFromName = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'popover';

const isNativeInteractive = (element: HTMLElement) => {
  if (element instanceof HTMLButtonElement) return true;
  if (element instanceof HTMLAnchorElement) return element.hasAttribute('href');
  return false;
};

const isPopoverOpen = (popover: HTMLElement) => !popover.hasAttribute('hidden');

const readPlacement = (popover: HTMLElement): PopoverPlacement => {
  const raw = popover.getAttribute('popover-root');
  if (raw && PLACEMENTS.has(raw as PopoverPlacement)) {
    return raw as PopoverPlacement;
  }
  return 'bottom';
};

const oppositePlacement = (placement: PopoverPlacement): PopoverPlacement => {
  switch (placement) {
    case 'top':
      return 'bottom';
    case 'bottom':
      return 'top';
    case 'left':
      return 'right';
    case 'right':
      return 'left';
  }
};

const coordsFor = (
  placement: PopoverPlacement,
  anchor: DOMRect,
  width: number,
  height: number,
  gap: number
) => {
  switch (placement) {
    case 'bottom':
      return { top: anchor.bottom + gap, left: anchor.left };
    case 'top':
      return { top: anchor.top - height - gap, left: anchor.left };
    case 'right':
      return { top: anchor.top, left: anchor.right + gap };
    case 'left':
      return { top: anchor.top, left: anchor.left - width - gap };
  }
};

const overflowsPreferredAxis = (
  placement: PopoverPlacement,
  top: number,
  left: number,
  width: number,
  height: number
) => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  switch (placement) {
    case 'bottom':
      return top + height > viewportHeight;
    case 'top':
      return top < 0;
    case 'right':
      return left + width > viewportWidth;
    case 'left':
      return left < 0;
  }
};

const tokenList = (value: string | null | undefined) =>
  (value ?? '')
    .split(/[,\s]+/)
    .map((token) => token.trim())
    .filter(Boolean);

const createsFixedContainingBlock = (element: Element) => {
  if (!(element instanceof HTMLElement)) return false;
  if (element === document.documentElement || element === document.body) {
    return false;
  }

  const style = window.getComputedStyle(element);
  if (style.transform !== 'none') return true;
  if (style.perspective !== 'none') return true;
  if (style.filter !== 'none') return true;

  const backdrop = style.getPropertyValue('backdrop-filter');
  if (backdrop && backdrop !== 'none') return true;

  if (
    tokenList(style.willChange).some((token) =>
      ['transform', 'perspective', 'filter', 'backdrop-filter'].includes(token)
    )
  ) {
    return true;
  }

  return tokenList(style.contain).some((token) =>
    ['paint', 'layout', 'strict', 'content'].includes(token)
  );
};

const getFixedContainingBlock = (element: HTMLElement) => {
  let current = element.parentElement;
  while (current && current !== document.documentElement) {
    if (createsFixedContainingBlock(current)) return current;
    current = current.parentElement;
  }
  return null;
};

const toContainingBlockCoords = (
  popover: HTMLElement,
  top: number,
  left: number
) => {
  const containing = getFixedContainingBlock(popover);
  if (!containing) return { top, left };
  const origin = containing.getBoundingClientRect();
  return { top: top - origin.top, left: left - origin.left };
};

export const createPopover = (options: PopoverOptions = {}): PopoverController => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      destroy: () => {},
      sync: () => {},
      open: () => {},
      close: () => {},
      toggle: () => {},
    };
  }

  const settings = { ...DEFAULTS, ...options };
  const root = settings.root ?? document;
  const gap =
    typeof options.gap === 'number' && Number.isFinite(options.gap)
      ? options.gap
      : DEFAULTS.gap;

  let idCounter = 0;

  const nextId = (prefix: string) => {
    idCounter += 1;
    return `${prefix}-${idCounter}`;
  };

  const getPopovers = () =>
    asArray(root.querySelectorAll<HTMLElement>(settings.rootSelector));

  const resolveContainingPopover = (element: Element | null | undefined) => {
    if (!element) return null;
    const popover = element.closest(settings.rootSelector);
    return popover instanceof HTMLElement ? popover : null;
  };

  const resolveById = (id: string) => resolveElementById(id, root);

  const isManagedPopover = (element: HTMLElement | null | undefined) => {
    if (!element?.matches(settings.rootSelector)) return false;
    if (root instanceof Document) return true;
    if (root instanceof Node) return root.contains(element);
    return getPopovers().includes(element);
  };

  const getPanel = (popover: HTMLElement) => {
    const marked = asArray(
      popover.querySelectorAll<HTMLElement>(settings.panelSelector)
    ).find((panel) => resolveContainingPopover(panel) === popover);
    if (marked) return marked;

    const roleDialog = asArray(
      popover.querySelectorAll<HTMLElement>('[role="dialog"]')
    ).find((panel) => resolveContainingPopover(panel) === popover);
    if (roleDialog) return roleDialog;

    const child = asArray(popover.children).find(
      (node): node is HTMLElement => node instanceof HTMLElement
    );
    return child ?? popover;
  };

  const resolvePopoverFromControls = (element: HTMLElement) => {
    if (resolveContainingPopover(element)) return null;

    for (const id of controlIds(element)) {
      const candidate = resolveById(id);
      if (candidate && isManagedPopover(candidate)) {
        return candidate;
      }
    }

    return null;
  };

  const resolvePopover = (target?: HTMLElement | null) => {
    if (target) {
      if (isManagedPopover(target)) return target;

      const containing = resolveContainingPopover(target);
      if (containing && isManagedPopover(containing)) return containing;

      if (target.matches(settings.closeSelector)) {
        const fromClose = resolveContainingPopover(target);
        if (fromClose && isManagedPopover(fromClose)) return fromClose;
      }

      const fromControls = resolvePopoverFromControls(target);
      if (fromControls) return fromControls;

      const closestOpener = target.closest('[aria-controls]');
      if (closestOpener instanceof HTMLElement) {
        const fromClosest = resolvePopoverFromControls(closestOpener);
        if (fromClosest) return fromClosest;
      }
    }

    return getPopovers().find(isPopoverOpen) ?? getPopovers()[0] ?? null;
  };

  const namedBase = (popover: HTMLElement) => {
    const name = popover.getAttribute('name');
    if (name) return slugFromName(name);
    if (popover.id) return slugFromName(popover.id);
    return null;
  };

  const getOpeners = (popover: HTMLElement) => {
    if (!popover.id) return [];
    return asArray(document.querySelectorAll<HTMLElement>('[aria-controls]')).filter(
      (element) => {
        if (resolveContainingPopover(element)) return false;
        return controlIds(element).includes(popover.id);
      }
    );
  };

  const setOpenerState = (popover: HTMLElement, expanded: boolean) => {
    const expandedValue = String(expanded);
    getOpeners(popover).forEach((opener) => {
      if (opener.getAttribute('aria-expanded') !== expandedValue) {
        opener.setAttribute('aria-expanded', expandedValue);
      }
      if (!opener.hasAttribute('aria-haspopup')) {
        opener.setAttribute('aria-haspopup', 'dialog');
      }
    });
  };

  const ensurePopoverAccessibility = (popover: HTMLElement) => {
    const panel = getPanel(popover);
    const base = namedBase(popover);

    if (!popover.id) {
      popover.id = base ? `${base}-root` : nextId(ROOT_ID_PREFIX);
    }

    if (!panel.id) {
      panel.id = base ? `${base}-panel` : nextId(PANEL_ID_PREFIX);
    }

    if (panel.getAttribute('role') !== 'dialog') {
      panel.setAttribute('role', 'dialog');
    }

    // Non-modal: do not set aria-modal. Authors may set it; we do not.

    if (
      !panel.hasAttribute('aria-labelledby') &&
      !panel.hasAttribute('aria-label')
    ) {
      const heading = panel.querySelector<HTMLElement>(
        '[popover-header] :is(h1,h2,h3,h4,h5,h6), :is(h1,h2,h3,h4,h5,h6)'
      );
      if (heading) {
        if (!heading.id) {
          heading.id = base ? `${base}-title` : nextId(TITLE_ID_PREFIX);
        }
        panel.setAttribute('aria-labelledby', heading.id);
      }
    }

    asArray(popover.querySelectorAll<HTMLElement>(settings.closeSelector))
      .filter((close) => resolveContainingPopover(close) === popover)
      .forEach((close) => {
        if (!isNativeInteractive(close)) {
          close.setAttribute('role', 'button');
          if (!close.hasAttribute('tabindex')) {
            close.setAttribute('tabindex', '0');
          }
        }
        if (
          !close.hasAttribute('aria-label') &&
          !close.hasAttribute('aria-labelledby') &&
          !close.textContent?.trim()
        ) {
          close.setAttribute('aria-label', 'Close');
        }
      });

    getOpeners(popover).forEach((opener) => {
      if (!isNativeInteractive(opener)) {
        opener.setAttribute('role', 'button');
        if (!opener.hasAttribute('tabindex')) {
          opener.setAttribute('tabindex', '0');
        }
      }
      if (!opener.hasAttribute('aria-haspopup')) {
        opener.setAttribute('aria-haspopup', 'dialog');
      }
      if (!opener.hasAttribute('aria-expanded')) {
        opener.setAttribute('aria-expanded', String(isPopoverOpen(popover)));
      }
    });
  };

  const rememberRestorer = (
    popover: HTMLElement,
    opener?: HTMLElement | null
  ) => {
    const active =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const restorer =
      opener && !popover.contains(opener)
        ? opener
        : active && !popover.contains(active)
          ? active
          : null;
    if (restorer) {
      focusRestorers.set(popover, restorer);
    }
    if (opener && !popover.contains(opener)) {
      placementAnchors.set(popover, opener);
    }
  };

  const restoreFocus = (popover: HTMLElement) => {
    const restorer = focusRestorers.get(popover);
    focusRestorers.delete(popover);
    if (restorer?.isConnected) {
      restorer.focus();
    }
  };

  const moveFocusIn = (popover: HTMLElement) => {
    moveFocusInto(getPanel(popover));
  };

  const clearPlacement = (popover: HTMLElement) => {
    popover.style.removeProperty('position');
    popover.style.removeProperty('top');
    popover.style.removeProperty('left');
    popover.style.removeProperty('right');
    popover.style.removeProperty('bottom');
    popover.style.removeProperty('margin');
    const panel = getPanel(popover);
    if (panel !== popover) {
      panel.style.removeProperty('margin');
    }
  };

  const applyPlacement = (
    popover: HTMLElement,
    opener?: HTMLElement | null
  ) => {
    const anchorEl =
      opener ??
      placementAnchors.get(popover) ??
      getOpeners(popover)[0] ??
      null;
    if (!anchorEl) return;

    const panel = getPanel(popover);
    popover.style.position = 'fixed';
    popover.style.right = 'auto';
    popover.style.bottom = 'auto';
    popover.style.margin = '0';
    if (panel !== popover) {
      panel.style.margin = '0';
    }

    const preferred = readPlacement(popover);
    const anchor = anchorEl.getBoundingClientRect();
    const box = popover.getBoundingClientRect();
    const width = box.width || popover.offsetWidth;
    const height = box.height || popover.offsetHeight;

    let placement = preferred;
    let { top, left } = coordsFor(placement, anchor, width, height, gap);
    if (overflowsPreferredAxis(placement, top, left, width, height)) {
      placement = oppositePlacement(placement);
      ({ top, left } = coordsFor(placement, anchor, width, height, gap));
    }

    ({ top, left } = toContainingBlockCoords(popover, top, left));
    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;
  };

  const setOpenState = (popover: HTMLElement, open: boolean) => {
    if (popover.hidden === !open) return;
    popover.hidden = !open;
  };

  const hidePopover = (popover: HTMLElement, restore: boolean) => {
    ensurePopoverAccessibility(popover);
    setOpenState(popover, false);
    setOpenerState(popover, false);
    clearPlacement(popover);
    if (restore) {
      restoreFocus(popover);
    } else {
      focusRestorers.delete(popover);
    }
  };

  const showPopover = (
    popover: HTMLElement,
    opener?: HTMLElement | null
  ) => {
    getPopovers()
      .concat(
        asArray(document.querySelectorAll<HTMLElement>(settings.rootSelector))
      )
      .forEach((other) => {
        if (other === popover || !isPopoverOpen(other)) return;
        hidePopover(other, false);
      });

    rememberRestorer(popover, opener);
    ensurePopoverAccessibility(popover);
    setOpenState(popover, true);
    setOpenerState(popover, true);
    applyPlacement(popover, opener);
    moveFocusIn(popover);
  };

  const open = (target?: HTMLElement | null) => {
    const popover = resolvePopover(target);
    if (!popover) return;
    if (isPopoverOpen(popover)) {
      ensurePopoverAccessibility(popover);
      setOpenerState(popover, true);
      applyPlacement(popover);
      return;
    }

    const opener =
      target && resolvePopoverFromControls(target) === popover
        ? target
        : target?.closest('[aria-controls]') instanceof HTMLElement &&
            resolvePopoverFromControls(
              target.closest('[aria-controls]') as HTMLElement
            ) === popover
          ? (target.closest('[aria-controls]') as HTMLElement)
          : null;

    showPopover(popover, opener);
  };

  const close = (target?: HTMLElement | null, restore = true) => {
    const popover = resolvePopover(target);
    if (!popover || !isPopoverOpen(popover)) return;
    hidePopover(popover, restore);
  };

  const toggle = (target?: HTMLElement | null) => {
    const popover = resolvePopover(target);
    if (!popover) return;
    if (isPopoverOpen(popover)) {
      close(popover);
      return;
    }
    open(target ?? popover);
  };

  const placeOpenPopovers = () => {
    getPopovers().forEach((popover) => {
      if (!isPopoverOpen(popover)) return;
      applyPlacement(popover);
    });
  };

  const sync = () => {
    getPopovers().forEach((popover) => {
      ensurePopoverAccessibility(popover);
      setOpenerState(popover, isPopoverOpen(popover));
      if (isPopoverOpen(popover)) {
        applyPlacement(popover);
      }
    });
  };

  const resolveOpenerFromEvent = (target: Element) => {
    const candidate =
      target instanceof HTMLElement ? target : target.closest('[aria-controls]');
    if (!(candidate instanceof HTMLElement)) return null;
    if (resolveContainingPopover(candidate)) return null;

    if (resolvePopoverFromControls(candidate)) return candidate;

    const closest = candidate.closest('[aria-controls]');
    if (closest instanceof HTMLElement && resolvePopoverFromControls(closest)) {
      return closest;
    }

    return null;
  };

  const getOpenPopover = () => getPopovers().find(isPopoverOpen) ?? null;

  const handleDocumentClick = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const popover = resolveContainingPopover(target);

    if (popover && isManagedPopover(popover)) {
      const closeControl =
        target.closest(settings.closeSelector) instanceof HTMLElement
          ? (target.closest(settings.closeSelector) as HTMLElement)
          : null;
      if (closeControl && resolveContainingPopover(closeControl) === popover) {
        if (!claimEvent(event)) return;
        close(popover);
      }
      return;
    }

    const opener = resolveOpenerFromEvent(target);
    if (opener) {
      if (!claimEvent(event)) return;
      toggle(opener);
      return;
    }

    const openPopover = getOpenPopover();
    if (!openPopover) return;
    if (!claimEvent(event)) return;
    close(openPopover, false);
  };

  const trapFocus = (event: KeyboardEvent, popover: HTMLElement) =>
    wrapTabFocus(event, getPanel(popover));

  const handleDocumentKeydown = (event: Event) => {
    if (!(event instanceof KeyboardEvent)) return;
    const target = event.target;
    if (!(target instanceof Element)) return;

    const openPopover = getOpenPopover();

    if (openPopover && event.key === 'Tab') {
      if (!claimEvent(event)) return;
      trapFocus(event, openPopover);
      return;
    }

    if (event.key !== 'Enter' && event.key !== ' ') return;

    const closeControl = target.closest(settings.closeSelector);
    if (
      closeControl instanceof HTMLElement &&
      resolveContainingPopover(closeControl) &&
      !isNativeInteractive(closeControl)
    ) {
      if (!claimEvent(event)) return;
      event.preventDefault();
      close(closeControl);
      return;
    }

    const opener = resolveOpenerFromEvent(target);
    if (!opener || isNativeInteractive(opener)) return;
    if (!claimEvent(event)) return;
    event.preventDefault();
    toggle(opener);
  };

  const handleEscapeKeydown = (event: Event) => {
    if (!(event instanceof KeyboardEvent) || event.key !== 'Escape') return;
    if (hasOpenDialogOverlay() || event.defaultPrevented) return;

    const openPopover = getOpenPopover();
    if (!openPopover) return;
    if (!claimEvent(event)) return;
    event.preventDefault();
    event.stopPropagation();
    close(openPopover);
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

  let placeScheduled = false;
  const schedulePlace = () => {
    if (placeScheduled) return;
    placeScheduled = true;

    requestAnimationFrame(() => {
      placeScheduled = false;
      placeOpenPopovers();
    });
  };

  const observer =
    typeof MutationObserver !== 'undefined'
      ? new MutationObserver(() => scheduleSync())
      : null;

  document.addEventListener('click', handleDocumentClick);
  document.addEventListener('keydown', handleDocumentKeydown, true);
  document.addEventListener('keydown', handleEscapeKeydown);
  window.addEventListener('resize', schedulePlace);
  window.addEventListener('scroll', schedulePlace, true);

  if (observer && root instanceof Node) {
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        'hidden',
        'aria-controls',
        'aria-labelledby',
        'popover-root',
        'popover-panel',
        'popover-close',
        'popover-header',
      ],
    });
  }

  sync();

  return {
    destroy: () => {
      document.removeEventListener('click', handleDocumentClick);
      document.removeEventListener('keydown', handleDocumentKeydown, true);
      document.removeEventListener('keydown', handleEscapeKeydown);
      window.removeEventListener('resize', schedulePlace);
      window.removeEventListener('scroll', schedulePlace, true);
      observer?.disconnect();
    },
    sync,
    open,
    close,
    toggle,
  };
};

export const initPopover = (options: PopoverOptions = {}): PopoverController =>
  createPopover(options);

let autoPopoverController: PopoverController | null = null;
let autoStartSuspended = false;
let bootOnReady: (() => void) | null = null;

const cancelDeferredAutoStart = () => {
  if (!bootOnReady) return;
  document.removeEventListener('DOMContentLoaded', bootOnReady);
  bootOnReady = null;
};

export const startPopoverRuntime = (): PopoverController | null => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  autoStartSuspended = false;
  cancelDeferredAutoStart();

  if (autoPopoverController) {
    autoPopoverController.sync();
    return autoPopoverController;
  }

  autoPopoverController = createPopover();
  return autoPopoverController;
};

export const stopPopoverRuntime = () => {
  autoStartSuspended = true;
  cancelDeferredAutoStart();
  autoPopoverController?.destroy();
  autoPopoverController = null;
};

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    bootOnReady = () => {
      bootOnReady = null;
      if (!autoStartSuspended) {
        startPopoverRuntime();
      }
    };
    document.addEventListener('DOMContentLoaded', bootOnReady);
  } else {
    startPopoverRuntime();
  }
}
