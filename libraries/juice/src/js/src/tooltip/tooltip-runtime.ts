/**
 * DOM-first tooltip runtime for Juice tooltip chrome.
 *
 * Markup contract (Slice A — do not rename attrs):
 *   [tooltip-root][hidden] > [tooltip-panel role="tooltip"]
 * Closed vs open is the native `hidden` attribute on [tooltip-root].
 *
 * Never use a bare `tooltip` attribute. Juice chrome is not the native
 * HTML `title` attribute — do not restyle or replace `title`.
 *
 * Tooltip is a thin cousin of popover: hover/focus only, no interactive
 * content, no close button, no focus trap, no status variants. Do not
 * move focus into the tip. It is not a popover, not a modal, not a
 * drawer, and not a toast stack.
 *
 * Pairing: prefer `aria-describedby` pointing at the tooltip-root id
 * (APG). `aria-controls` is also accepted for consistency with other
 * Juice runtimes. Sync fills a missing root id and ensures the trigger
 * `aria-describedby` token list includes that id.
 *
 * Show on pointer enter / focus of the trigger; hide on pointer leave /
 * blur after a short grace (default 150ms) so a brief leave does not
 * flicker. The tip has `pointer-events: none` in chrome, so the delay
 * is not a bridge onto the tip. Touch / first-tap is later — v1 is
 * hover and keyboard focus only.
 *
 * Placement (honest v1, no Floating UI): read `tooltip-root` (`top` /
 * `bottom` / `left` / `right`, default `top`), position `fixed` near
 * the trigger from getBoundingClientRect, with a small gap. If a
 * transformed / filtered ancestor is the fixed containing block,
 * subtract that origin. If the preferred side overflows the viewport,
 * flip once to the opposite side. Repositions on open, window resize,
 * and capture scroll (rAF-throttled).
 *
 * Escape hides the open tip on bubble, but yields when an open
 * [modal-overlay], [drawer-overlay], or [popover-root] exists, or the
 * event is already defaultPrevented (same courtesy as toast / popover).
 * Opening one managed tooltip closes the others.
 */

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export type TooltipOptions = {
  root?: ParentNode;
  rootSelector?: string;
  panelSelector?: string;
  gap?: number;
  hideDelay?: number;
};

export type TooltipController = {
  destroy: () => void;
  sync: () => void;
  show: (target?: HTMLElement | null) => void;
  hide: (target?: HTMLElement | null) => void;
};

const DEFAULT_ROOT: ParentNode =
  typeof document !== 'undefined' ? document : ({} as ParentNode);

const DEFAULT_GAP = 8;
const DEFAULT_HIDE_DELAY = 150;

const DEFAULTS: Required<TooltipOptions> = {
  root: DEFAULT_ROOT,
  rootSelector: '[tooltip-root]',
  panelSelector: '[tooltip-panel]',
  gap: DEFAULT_GAP,
  hideDelay: DEFAULT_HIDE_DELAY,
};

const PLACEMENTS = new Set<TooltipPlacement>([
  'top',
  'bottom',
  'left',
  'right',
]);

const asArray = <T extends Element>(nodes: ArrayLike<T>): T[] =>
  Array.from(nodes);

const ROOT_ID_PREFIX = 'juice-tooltip-root';

const handledEvents = new WeakSet<Event>();
const placementAnchors = new WeakMap<HTMLElement, HTMLElement>();

const claimEvent = (event: Event) => {
  if (handledEvents.has(event)) return false;
  handledEvents.add(event);
  return true;
};

const escapeId = (value: string) =>
  typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
    ? CSS.escape(value)
    : value;

const slugFromName = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'tooltip';

const tokenIds = (value: string | null | undefined) =>
  (value ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

const describedIds = (element: HTMLElement) =>
  tokenIds(element.getAttribute('aria-describedby'));

const controlIds = (element: HTMLElement) =>
  tokenIds(element.getAttribute('aria-controls'));

const includeToken = (value: string | null | undefined, id: string) => {
  const tokens = tokenIds(value);
  if (tokens.includes(id)) return tokens.join(' ');
  return [...tokens, id].join(' ');
};

const isTooltipOpen = (tooltip: HTMLElement) => !tooltip.hasAttribute('hidden');

const hasOpenBlockingOverlay = () => {
  if (typeof document === 'undefined') return false;
  return Boolean(
    document.querySelector(
      [
        '[modal-overlay]:not([hidden])',
        '[drawer-overlay]:not([hidden])',
        '[popover-root]:not([hidden])',
      ].join(', ')
    )
  );
};

const readPlacement = (tooltip: HTMLElement): TooltipPlacement => {
  const raw = tooltip.getAttribute('tooltip-root');
  if (raw && PLACEMENTS.has(raw as TooltipPlacement)) {
    return raw as TooltipPlacement;
  }
  return 'top';
};

const oppositePlacement = (placement: TooltipPlacement): TooltipPlacement => {
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
  placement: TooltipPlacement,
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
  placement: TooltipPlacement,
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
  tooltip: HTMLElement,
  top: number,
  left: number
) => {
  const containing = getFixedContainingBlock(tooltip);
  if (!containing) return { top, left };
  const origin = containing.getBoundingClientRect();
  return { top: top - origin.top, left: left - origin.left };
};

export const createTooltip = (options: TooltipOptions = {}): TooltipController => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      destroy: () => {},
      sync: () => {},
      show: () => {},
      hide: () => {},
    };
  }

  const settings = { ...DEFAULTS, ...options };
  const root = settings.root ?? document;
  const gap =
    typeof options.gap === 'number' && Number.isFinite(options.gap)
      ? options.gap
      : DEFAULTS.gap;
  const hideDelay =
    typeof options.hideDelay === 'number' && Number.isFinite(options.hideDelay)
      ? Math.max(0, options.hideDelay)
      : DEFAULTS.hideDelay;

  let idCounter = 0;
  let hideTimer: ReturnType<typeof setTimeout> | null = null;
  let pointerTrigger: HTMLElement | null = null;
  let focusTrigger: HTMLElement | null = null;

  const nextId = (prefix: string) => {
    idCounter += 1;
    return `${prefix}-${idCounter}`;
  };

  const getTooltips = () =>
    asArray(root.querySelectorAll<HTMLElement>(settings.rootSelector));

  const resolveContainingTooltip = (element: Element | null | undefined) => {
    if (!element) return null;
    const tooltip = element.closest(settings.rootSelector);
    return tooltip instanceof HTMLElement ? tooltip : null;
  };

  const resolveById = (id: string) => {
    const escaped = escapeId(id);
    if (root instanceof Document || root instanceof Element) {
      const local = root.querySelector<HTMLElement>(`#${escaped}`);
      if (local) return local;
    }
    const global = document.getElementById(id);
    return global instanceof HTMLElement ? global : null;
  };

  const isManagedTooltip = (element: HTMLElement | null | undefined) => {
    if (!element?.matches(settings.rootSelector)) return false;
    if (root instanceof Document) return true;
    if (root instanceof Node) return root.contains(element);
    return getTooltips().includes(element);
  };

  const getPanel = (tooltip: HTMLElement) => {
    const marked = asArray(
      tooltip.querySelectorAll<HTMLElement>(settings.panelSelector)
    ).find((panel) => resolveContainingTooltip(panel) === tooltip);
    if (marked) return marked;

    const roleTip = asArray(
      tooltip.querySelectorAll<HTMLElement>('[role="tooltip"]')
    ).find((panel) => resolveContainingTooltip(panel) === tooltip);
    if (roleTip) return roleTip;

    const child = asArray(tooltip.children).find(
      (node): node is HTMLElement => node instanceof HTMLElement
    );
    return child ?? tooltip;
  };

  const resolveTooltipFromTrigger = (element: HTMLElement) => {
    if (resolveContainingTooltip(element)) return null;

    for (const id of describedIds(element)) {
      const candidate = resolveById(id);
      if (candidate && isManagedTooltip(candidate)) {
        return candidate;
      }
    }

    for (const id of controlIds(element)) {
      const candidate = resolveById(id);
      if (candidate && isManagedTooltip(candidate)) {
        return candidate;
      }
    }

    return null;
  };

  const resolveTriggerFromEvent = (target: Element) => {
    const start =
      target instanceof HTMLElement ? target : target.parentElement;
    if (!start) return null;

    const described = start.closest('[aria-describedby]');
    if (described instanceof HTMLElement && resolveTooltipFromTrigger(described)) {
      return described;
    }

    const controlled = start.closest('[aria-controls]');
    if (controlled instanceof HTMLElement && resolveTooltipFromTrigger(controlled)) {
      return controlled;
    }

    if (start instanceof HTMLElement && resolveTooltipFromTrigger(start)) {
      return start;
    }

    return null;
  };

  const getOpenTooltip = () => getTooltips().find(isTooltipOpen) ?? null;

  const resolveTooltip = (target?: HTMLElement | null) => {
    if (target) {
      if (isManagedTooltip(target)) return target;

      const containing = resolveContainingTooltip(target);
      if (containing && isManagedTooltip(containing)) return containing;

      if (resolveTooltipFromTrigger(target)) {
        return resolveTooltipFromTrigger(target);
      }

      const fromEvent = resolveTriggerFromEvent(target);
      if (fromEvent) return resolveTooltipFromTrigger(fromEvent);
    }

    return getOpenTooltip() ?? getTooltips()[0] ?? null;
  };

  const namedBase = (tooltip: HTMLElement) => {
    const name = tooltip.getAttribute('name');
    if (name) return slugFromName(name);
    if (tooltip.id) return slugFromName(tooltip.id);
    return null;
  };

  const getTriggers = (tooltip: HTMLElement) => {
    if (!tooltip.id) return [];
    const seen = new Set<HTMLElement>();
    const matches: HTMLElement[] = [];

    asArray(
      document.querySelectorAll<HTMLElement>(
        '[aria-describedby], [aria-controls]'
      )
    ).forEach((element) => {
      if (seen.has(element) || resolveContainingTooltip(element)) return;
      if (resolveTooltipFromTrigger(element) !== tooltip) return;
      seen.add(element);
      matches.push(element);
    });

    return matches;
  };

  const ensureTriggerDescribedBy = (
    trigger: HTMLElement,
    tooltip: HTMLElement
  ) => {
    if (!tooltip.id) return;
    const next = includeToken(trigger.getAttribute('aria-describedby'), tooltip.id);
    if (trigger.getAttribute('aria-describedby') !== next) {
      trigger.setAttribute('aria-describedby', next);
    }
  };

  const ensureTooltipAccessibility = (tooltip: HTMLElement) => {
    const panel = getPanel(tooltip);
    const base = namedBase(tooltip);

    if (!tooltip.id) {
      tooltip.id = base ? `${base}-root` : nextId(ROOT_ID_PREFIX);
    }

    if (panel.getAttribute('role') !== 'tooltip') {
      panel.setAttribute('role', 'tooltip');
    }

    getTriggers(tooltip).forEach((trigger) => {
      ensureTriggerDescribedBy(trigger, tooltip);
    });
  };

  const rememberAnchor = (
    tooltip: HTMLElement,
    trigger?: HTMLElement | null
  ) => {
    if (trigger && !tooltip.contains(trigger)) {
      placementAnchors.set(tooltip, trigger);
    }
  };

  const clearPlacement = (tooltip: HTMLElement) => {
    tooltip.style.removeProperty('position');
    tooltip.style.removeProperty('top');
    tooltip.style.removeProperty('left');
    tooltip.style.removeProperty('right');
    tooltip.style.removeProperty('bottom');
    tooltip.style.removeProperty('margin');
    const panel = getPanel(tooltip);
    if (panel !== tooltip) {
      panel.style.removeProperty('margin');
    }
  };

  const applyPlacement = (
    tooltip: HTMLElement,
    trigger?: HTMLElement | null
  ) => {
    const anchorEl =
      trigger ??
      placementAnchors.get(tooltip) ??
      getTriggers(tooltip)[0] ??
      null;
    if (!anchorEl) return;

    const panel = getPanel(tooltip);
    tooltip.style.position = 'fixed';
    tooltip.style.right = 'auto';
    tooltip.style.bottom = 'auto';
    tooltip.style.margin = '0';
    if (panel !== tooltip) {
      panel.style.margin = '0';
    }

    const preferred = readPlacement(tooltip);
    const anchor = anchorEl.getBoundingClientRect();
    const box = tooltip.getBoundingClientRect();
    const width = box.width || tooltip.offsetWidth;
    const height = box.height || tooltip.offsetHeight;

    let placement = preferred;
    let { top, left } = coordsFor(placement, anchor, width, height, gap);
    if (overflowsPreferredAxis(placement, top, left, width, height)) {
      placement = oppositePlacement(placement);
      ({ top, left } = coordsFor(placement, anchor, width, height, gap));
    }

    ({ top, left } = toContainingBlockCoords(tooltip, top, left));
    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
  };

  const setOpenState = (tooltip: HTMLElement, open: boolean) => {
    if (tooltip.hidden === !open) return;
    tooltip.hidden = !open;
  };

  const cancelHide = () => {
    if (hideTimer == null) return;
    clearTimeout(hideTimer);
    hideTimer = null;
  };

  const hideTooltip = (tooltip: HTMLElement) => {
    cancelHide();
    ensureTooltipAccessibility(tooltip);
    setOpenState(tooltip, false);
    clearPlacement(tooltip);
  };

  const showTooltip = (
    tooltip: HTMLElement,
    trigger?: HTMLElement | null
  ) => {
    cancelHide();

    getTooltips()
      .concat(
        asArray(document.querySelectorAll<HTMLElement>(settings.rootSelector))
      )
      .forEach((other) => {
        if (other === tooltip || !isTooltipOpen(other)) return;
        hideTooltip(other);
      });

    rememberAnchor(tooltip, trigger);
    ensureTooltipAccessibility(tooltip);
    if (trigger) {
      ensureTriggerDescribedBy(trigger, tooltip);
    }
    setOpenState(tooltip, true);
    applyPlacement(tooltip, trigger);
  };

  const show = (target?: HTMLElement | null) => {
    const tooltip = resolveTooltip(target);
    if (!tooltip) return;

    const trigger =
      target && resolveTooltipFromTrigger(target) === tooltip
        ? target
        : resolveTriggerFromEvent(target ?? tooltip);

    if (isTooltipOpen(tooltip)) {
      ensureTooltipAccessibility(tooltip);
      if (trigger) ensureTriggerDescribedBy(trigger, tooltip);
      applyPlacement(tooltip, trigger);
      return;
    }

    showTooltip(tooltip, trigger);
  };

  const hide = (target?: HTMLElement | null) => {
    const tooltip = resolveTooltip(target);
    if (!tooltip || !isTooltipOpen(tooltip)) return;
    hideTooltip(tooltip);
  };

  const scheduleHide = (tooltip: HTMLElement) => {
    cancelHide();
    if (hideDelay <= 0) {
      hideTooltip(tooltip);
      return;
    }

    hideTimer = setTimeout(() => {
      hideTimer = null;
      if (pointerTrigger && resolveTooltipFromTrigger(pointerTrigger) === tooltip) {
        return;
      }
      if (focusTrigger && resolveTooltipFromTrigger(focusTrigger) === tooltip) {
        return;
      }
      hideTooltip(tooltip);
    }, hideDelay);
  };

  const placeOpenTooltips = () => {
    getTooltips().forEach((tooltip) => {
      if (!isTooltipOpen(tooltip)) return;
      applyPlacement(tooltip);
    });
  };

  const sync = () => {
    getTooltips().forEach((tooltip) => {
      ensureTooltipAccessibility(tooltip);
      if (isTooltipOpen(tooltip)) {
        applyPlacement(tooltip);
      }
    });
  };

  const handlePointerOver = (event: Event) => {
    if (!(event instanceof MouseEvent)) return;
    const target = event.target;
    if (!(target instanceof Element)) return;

    const trigger = resolveTriggerFromEvent(target);
    if (!trigger) return;
    if (!claimEvent(event)) return;

    pointerTrigger = trigger;
    cancelHide();
    show(trigger);
  };

  const handlePointerOut = (event: Event) => {
    if (!(event instanceof MouseEvent)) return;
    const target = event.target;
    if (!(target instanceof Element)) return;

    const trigger = resolveTriggerFromEvent(target);
    if (!trigger) return;

    const related = event.relatedTarget;
    if (related instanceof Node && trigger.contains(related)) return;
    if (!claimEvent(event)) return;

    if (pointerTrigger === trigger) {
      pointerTrigger = null;
    }

    const tooltip = resolveTooltipFromTrigger(trigger);
    if (!tooltip || !isTooltipOpen(tooltip)) return;
    if (focusTrigger && resolveTooltipFromTrigger(focusTrigger) === tooltip) {
      return;
    }
    scheduleHide(tooltip);
  };

  const handleFocusIn = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const trigger = resolveTriggerFromEvent(target);
    if (!trigger) return;
    if (!claimEvent(event)) return;

    focusTrigger = trigger;
    cancelHide();
    show(trigger);
  };

  const handleFocusOut = (event: Event) => {
    if (!(event instanceof FocusEvent)) return;
    const target = event.target;
    if (!(target instanceof Element)) return;

    const trigger = resolveTriggerFromEvent(target);
    if (!trigger) return;

    const related = event.relatedTarget;
    if (related instanceof Node && trigger.contains(related)) return;
    if (!claimEvent(event)) return;

    if (focusTrigger === trigger) {
      focusTrigger = null;
    }

    const tooltip = resolveTooltipFromTrigger(trigger);
    if (!tooltip || !isTooltipOpen(tooltip)) return;
    if (pointerTrigger && resolveTooltipFromTrigger(pointerTrigger) === tooltip) {
      return;
    }
    scheduleHide(tooltip);
  };

  const handleEscapeKeydown = (event: Event) => {
    if (!(event instanceof KeyboardEvent) || event.key !== 'Escape') return;
    if (hasOpenBlockingOverlay() || event.defaultPrevented) return;

    const openTooltip = getOpenTooltip();
    if (!openTooltip) return;
    if (!claimEvent(event)) return;
    event.preventDefault();
    event.stopPropagation();
    hideTooltip(openTooltip);
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
      placeOpenTooltips();
    });
  };

  const observer =
    typeof MutationObserver !== 'undefined'
      ? new MutationObserver(() => scheduleSync())
      : null;

  document.addEventListener('mouseover', handlePointerOver);
  document.addEventListener('mouseout', handlePointerOut);
  document.addEventListener('focusin', handleFocusIn);
  document.addEventListener('focusout', handleFocusOut);
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
        'aria-describedby',
        'aria-controls',
        'tooltip-root',
        'tooltip-panel',
      ],
    });
  }

  sync();

  return {
    destroy: () => {
      cancelHide();
      pointerTrigger = null;
      focusTrigger = null;
      document.removeEventListener('mouseover', handlePointerOver);
      document.removeEventListener('mouseout', handlePointerOut);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      document.removeEventListener('keydown', handleEscapeKeydown);
      window.removeEventListener('resize', schedulePlace);
      window.removeEventListener('scroll', schedulePlace, true);
      observer?.disconnect();
    },
    sync,
    show,
    hide,
  };
};

export const initTooltip = (options: TooltipOptions = {}): TooltipController =>
  createTooltip(options);

let autoTooltipController: TooltipController | null = null;
let autoStartSuspended = false;
let bootOnReady: (() => void) | null = null;

const cancelDeferredAutoStart = () => {
  if (!bootOnReady) return;
  document.removeEventListener('DOMContentLoaded', bootOnReady);
  bootOnReady = null;
};

export const startTooltipRuntime = (): TooltipController | null => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  autoStartSuspended = false;
  cancelDeferredAutoStart();

  if (autoTooltipController) {
    autoTooltipController.sync();
    return autoTooltipController;
  }

  autoTooltipController = createTooltip();
  return autoTooltipController;
};

export const stopTooltipRuntime = () => {
  autoStartSuspended = true;
  cancelDeferredAutoStart();
  autoTooltipController?.destroy();
  autoTooltipController = null;
};

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    bootOnReady = () => {
      bootOnReady = null;
      if (!autoStartSuspended) {
        startTooltipRuntime();
      }
    };
    document.addEventListener('DOMContentLoaded', bootOnReady);
  } else {
    startTooltipRuntime();
  }
}
