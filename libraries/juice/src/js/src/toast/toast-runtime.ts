/**
 * DOM-first toast / snackbar runtime for Juice toast chrome.
 *
 * Markup contract (authors place the region — this is not a portal):
 *   [toast-region] > [toast] + [toast-title]? + [toast-body]? + [toast-close]?
 * Individual toasts use native `hidden` when dismissed. The region stays in the DOM.
 *
 * Toast is NOT a dialog:
 *   - no focus trap, no aria-modal, no exclusive "one toast only"
 *   - stacking is the point; show() never hides siblings
 *   - do not move focus into the toast on show (disruptive)
 *
 * Duration:
 *   - createToast({ defaultDuration: 5000 }) — ms before auto-dismiss
 *   - Per-toast override: toast-duration="3000"
 *   - Sticky: toast-duration="0", toast-duration="Infinity", or a negative number
 *   - defaultDuration of 0 / Infinity / negative also means no auto-dismiss
 *
 * Auto-dismiss pauses while pointer or focus is inside the toast, then resumes.
 *
 * Escape dismisses the most recently shown visible toast, but only when no
 * open [modal-overlay], [drawer-overlay], [popover-root], [combobox-list],
 * or [tooltip-root] exists (those surfaces own Escape first). An open tip
 * hides while toasts remain — toast does not steal Escape from tooltip.
 *
 * Live region: sync fills missing aria-live="polite" and
 * aria-relevant="additions" on [toast-region]. Opt into assertive with
 * aria-live="assertive" or toast-live="assertive" on the region or toast.
 * role="status" for polite; role="alert" for toast="error" or assertive.
 */

export type ToastOptions = {
  root?: ParentNode;
  regionSelector?: string;
  toastSelector?: string;
  closeSelector?: string;
  defaultDuration?: number;
};

export type ToastController = {
  destroy: () => void;
  sync: () => void;
  show: (target?: HTMLElement | null) => void;
  dismiss: (target?: HTMLElement | null) => void;
};

const DEFAULT_ROOT: ParentNode =
  typeof document !== 'undefined' ? document : ({} as ParentNode);

const DEFAULT_DURATION = 5000;

const DEFAULTS: Required<ToastOptions> = {
  root: DEFAULT_ROOT,
  regionSelector: '[toast-region]',
  toastSelector: '[toast]',
  closeSelector: '[toast-close]',
  defaultDuration: DEFAULT_DURATION,
};

const asArray = <T extends Element>(nodes: ArrayLike<T>): T[] =>
  Array.from(nodes);

type TimerState = {
  timeoutId: ReturnType<typeof setTimeout> | null;
  remaining: number;
  startedAt: number;
  paused: boolean;
};

const handledEvents = new WeakSet<Event>();

const claimEvent = (event: Event) => {
  if (handledEvents.has(event)) return false;
  handledEvents.add(event);
  return true;
};

const isNativeInteractive = (element: HTMLElement) => {
  if (element instanceof HTMLButtonElement) return true;
  if (element instanceof HTMLAnchorElement) return element.hasAttribute('href');
  return false;
};

const isToastVisible = (toast: HTMLElement) => !toast.hasAttribute('hidden');

const isStickyDuration = (duration: number) =>
  !Number.isFinite(duration) || duration <= 0;

const parseDuration = (raw: string | null, fallback: number) => {
  if (raw == null) return fallback;
  const trimmed = raw.trim();
  if (!trimmed) return fallback;
  if (trimmed.toLowerCase() === 'infinity') return 0;
  const parsed = Number(trimmed);
  if (Number.isNaN(parsed)) return fallback;
  return parsed;
};

const hasOpenDialogOverlay = () => {
  if (typeof document === 'undefined') return false;
  return Boolean(
    document.querySelector(
      '[modal-overlay]:not([hidden]), [drawer-overlay]:not([hidden])'
    )
  );
};

const hasOpenPopover = () => {
  if (typeof document === 'undefined') return false;
  return Boolean(document.querySelector('[popover-root]:not([hidden])'));
};

const hasOpenComboboxList = () => {
  if (typeof document === 'undefined') return false;
  return Boolean(document.querySelector('[combobox-list]:not([hidden])'));
};

const hasOpenTooltip = () => {
  if (typeof document === 'undefined') return false;
  return Boolean(document.querySelector('[tooltip-root]:not([hidden])'));
};

const shouldYieldEscape = () =>
  hasOpenDialogOverlay() ||
  hasOpenPopover() ||
  hasOpenComboboxList() ||
  hasOpenTooltip();

export const createToast = (options: ToastOptions = {}): ToastController => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      destroy: () => {},
      sync: () => {},
      show: () => {},
      dismiss: () => {},
    };
  }

  const settings = { ...DEFAULTS, ...options };
  const root = settings.root ?? document;
  const rootEvents = root as ParentNode & EventTarget;
  const defaultDuration =
    typeof options.defaultDuration === 'number'
      ? options.defaultDuration
      : DEFAULTS.defaultDuration;

  const timers = new WeakMap<HTMLElement, TimerState>();
  const timedToasts = new Set<HTMLElement>();
  const showOrder: HTMLElement[] = [];

  const getRegions = () =>
    asArray(root.querySelectorAll<HTMLElement>(settings.regionSelector));

  const resolveContainingRegion = (element: HTMLElement | null | undefined) => {
    if (!element) return null;
    const region = element.closest(settings.regionSelector);
    return region instanceof HTMLElement ? region : null;
  };

  const resolveContainingToast = (element: HTMLElement | null | undefined) => {
    if (!element) return null;
    const toast = element.closest(settings.toastSelector);
    if (!(toast instanceof HTMLElement)) return null;
    if (!resolveContainingRegion(toast)) return null;
    return toast;
  };

  const getToasts = (region?: HTMLElement) => {
    const scope = region ?? root;
    return asArray(
      scope.querySelectorAll<HTMLElement>(settings.toastSelector)
    ).filter((toast) => resolveContainingRegion(toast));
  };

  const isManagedToast = (element: HTMLElement | null | undefined) => {
    if (!element?.matches(settings.toastSelector)) return false;
    if (!resolveContainingRegion(element)) return false;
    if (root instanceof Document) return true;
    if (root instanceof Node) return root.contains(element);
    return getToasts().includes(element);
  };

  const resolveDuration = (toast: HTMLElement) =>
    parseDuration(toast.getAttribute('toast-duration'), defaultDuration);

  const isAssertive = (region: HTMLElement, toast: HTMLElement) => {
    if (region.getAttribute('aria-live') === 'assertive') return true;
    if (region.getAttribute('toast-live') === 'assertive') return true;
    if (toast.getAttribute('aria-live') === 'assertive') return true;
    if (toast.getAttribute('toast-live') === 'assertive') return true;
    return false;
  };

  const rememberShown = (toast: HTMLElement, bump = true) => {
    const index = showOrder.indexOf(toast);
    if (index >= 0) {
      if (!bump) return;
      showOrder.splice(index, 1);
    }
    showOrder.push(toast);
  };

  const forgetShown = (toast: HTMLElement) => {
    const index = showOrder.indexOf(toast);
    if (index >= 0) showOrder.splice(index, 1);
  };

  const getTopmostVisibleToast = () => {
    for (let index = showOrder.length - 1; index >= 0; index -= 1) {
      const toast = showOrder[index];
      if (toast.isConnected && isManagedToast(toast) && isToastVisible(toast)) {
        return toast;
      }
    }

    const visible = getToasts().filter(isToastVisible);
    return visible[visible.length - 1] ?? null;
  };

  const resolveToast = (target?: HTMLElement | null) => {
    if (target) {
      if (isManagedToast(target)) return target;

      const containing = resolveContainingToast(target);
      if (containing && isManagedToast(containing)) return containing;
    }

    return getTopmostVisibleToast() ?? getToasts()[0] ?? null;
  };

  const clearTimer = (toast: HTMLElement) => {
    const state = timers.get(toast);
    if (state?.timeoutId != null) {
      clearTimeout(state.timeoutId);
    }
    timers.delete(toast);
    timedToasts.delete(toast);
  };

  const clearAllTimers = () => {
    timedToasts.forEach((toast) => {
      const state = timers.get(toast);
      if (state?.timeoutId != null) {
        clearTimeout(state.timeoutId);
      }
      timers.delete(toast);
    });
    timedToasts.clear();
  };

  const startTimer = (toast: HTMLElement) => {
    if (!isToastVisible(toast)) {
      clearTimer(toast);
      return;
    }

    const duration = resolveDuration(toast);
    if (isStickyDuration(duration)) {
      clearTimer(toast);
      return;
    }

    const existing = timers.get(toast);
    if (existing && (existing.timeoutId != null || existing.paused)) return;

    const state: TimerState = {
      timeoutId: null,
      remaining: duration,
      startedAt: Date.now(),
      paused: false,
    };
    state.timeoutId = setTimeout(() => dismiss(toast), duration);
    timers.set(toast, state);
    timedToasts.add(toast);
  };

  const pauseTimer = (toast: HTMLElement) => {
    const state = timers.get(toast);
    if (!state || state.paused) return;

    if (state.timeoutId != null) {
      clearTimeout(state.timeoutId);
      state.timeoutId = null;
      state.remaining = Math.max(0, state.remaining - (Date.now() - state.startedAt));
    }
    state.paused = true;
  };

  const resumeTimer = (toast: HTMLElement) => {
    const state = timers.get(toast);
    if (!state || !state.paused) return;

    state.paused = false;
    if (state.remaining <= 0) {
      dismiss(toast);
      return;
    }

    state.startedAt = Date.now();
    state.timeoutId = setTimeout(() => dismiss(toast), state.remaining);
  };

  const ensureCloseAccessibility = (toast: HTMLElement) => {
    asArray(toast.querySelectorAll<HTMLElement>(settings.closeSelector))
      .filter((close) => resolveContainingToast(close) === toast)
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
          close.setAttribute('aria-label', 'Dismiss');
        }
      });
  };

  const ensureRegionAccessibility = (region: HTMLElement) => {
    if (!region.hasAttribute('aria-live')) {
      const live =
        region.getAttribute('toast-live') === 'assertive' ? 'assertive' : 'polite';
      region.setAttribute('aria-live', live);
    }

    if (!region.hasAttribute('aria-relevant')) {
      region.setAttribute('aria-relevant', 'additions');
    }
  };

  const ensureToastAccessibility = (region: HTMLElement, toast: HTMLElement) => {
    const role =
      toast.getAttribute('toast') === 'error' || isAssertive(region, toast)
        ? 'alert'
        : 'status';

    if (toast.getAttribute('role') !== role) {
      toast.setAttribute('role', role);
    }

    ensureCloseAccessibility(toast);
  };

  const setVisibleState = (toast: HTMLElement, visible: boolean) => {
    if (toast.hidden === !visible) return;
    toast.hidden = !visible;
  };

  const show = (target?: HTMLElement | null) => {
    const toast = resolveToast(target);
    if (!toast) return;

    const region = resolveContainingRegion(toast);
    if (!region) return;

    ensureRegionAccessibility(region);
    ensureToastAccessibility(region, toast);

    if (isToastVisible(toast)) {
      rememberShown(toast);
      startTimer(toast);
      return;
    }

    setVisibleState(toast, true);
    rememberShown(toast);
    clearTimer(toast);
    startTimer(toast);
  };

  const dismiss = (target?: HTMLElement | null) => {
    const toast = resolveToast(target);
    if (!toast || !isToastVisible(toast)) return;

    clearTimer(toast);
    forgetShown(toast);
    setVisibleState(toast, false);
  };

  const sync = () => {
    getRegions().forEach((region) => {
      ensureRegionAccessibility(region);
      getToasts(region).forEach((toast) => {
        ensureToastAccessibility(region, toast);
        if (isToastVisible(toast)) {
          rememberShown(toast, false);
          startTimer(toast);
          return;
        }
        clearTimer(toast);
        forgetShown(toast);
      });
    });

    timedToasts.forEach((toast) => {
      if (!toast.isConnected || !isManagedToast(toast) || !isToastVisible(toast)) {
        clearTimer(toast);
      }
    });
  };

  const handleRootClick = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const closeControl = target.closest(settings.closeSelector);
    if (!(closeControl instanceof HTMLElement)) return;

    const toast = resolveContainingToast(closeControl);
    if (!toast || !isManagedToast(toast)) return;
    if (!claimEvent(event)) return;
    dismiss(toast);
  };

  const leftToast = (event: MouseEvent | FocusEvent, toast: HTMLElement) => {
    const related = event.relatedTarget;
    return !(related instanceof Node && toast.contains(related));
  };

  const handlePointerOver = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const toast = resolveContainingToast(
      target instanceof HTMLElement ? target : target.parentElement
    );
    if (!toast || !isManagedToast(toast) || !isToastVisible(toast)) return;
    pauseTimer(toast);
  };

  const handlePointerOut = (event: Event) => {
    if (!(event instanceof MouseEvent)) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    const toast = resolveContainingToast(
      target instanceof HTMLElement ? target : target.parentElement
    );
    if (!toast || !isManagedToast(toast) || !isToastVisible(toast)) return;
    if (!leftToast(event, toast)) return;
    resumeTimer(toast);
  };

  const handleFocusIn = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const toast = resolveContainingToast(
      target instanceof HTMLElement ? target : target.parentElement
    );
    if (!toast || !isManagedToast(toast) || !isToastVisible(toast)) return;
    pauseTimer(toast);
  };

  const handleFocusOut = (event: Event) => {
    if (!(event instanceof FocusEvent)) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    const toast = resolveContainingToast(
      target instanceof HTMLElement ? target : target.parentElement
    );
    if (!toast || !isManagedToast(toast) || !isToastVisible(toast)) return;
    if (!leftToast(event, toast)) return;
    resumeTimer(toast);
  };

  const handleRootKeydown = (event: Event) => {
    if (!(event instanceof KeyboardEvent)) return;
    const target = event.target;
    if (!(target instanceof Element)) return;

    if (event.key === 'Escape') {
      if (shouldYieldEscape() || event.defaultPrevented) return;
      const toast = getTopmostVisibleToast();
      if (!toast || !claimEvent(event)) return;
      event.preventDefault();
      event.stopPropagation();
      dismiss(toast);
      return;
    }

    if (event.key !== 'Enter' && event.key !== ' ') return;

    const closeControl = target.closest(settings.closeSelector);
    if (
      closeControl instanceof HTMLElement &&
      resolveContainingToast(closeControl) &&
      !isNativeInteractive(closeControl)
    ) {
      if (!claimEvent(event)) return;
      event.preventDefault();
      dismiss(closeControl);
    }
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
  rootEvents.addEventListener('keydown', handleRootKeydown);
  rootEvents.addEventListener('mouseover', handlePointerOver);
  rootEvents.addEventListener('mouseout', handlePointerOut);
  rootEvents.addEventListener('focusin', handleFocusIn);
  rootEvents.addEventListener('focusout', handleFocusOut);

  if (observer && root instanceof Node) {
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        'hidden',
        'toast-region',
        'toast',
        'toast-close',
        'toast-duration',
        'toast-live',
        'aria-live',
        'aria-relevant',
      ],
    });
  }

  sync();

  return {
    destroy: () => {
      rootEvents.removeEventListener('click', handleRootClick);
      rootEvents.removeEventListener('keydown', handleRootKeydown);
      rootEvents.removeEventListener('mouseover', handlePointerOver);
      rootEvents.removeEventListener('mouseout', handlePointerOut);
      rootEvents.removeEventListener('focusin', handleFocusIn);
      rootEvents.removeEventListener('focusout', handleFocusOut);
      observer?.disconnect();
      clearAllTimers();
    },
    sync,
    show,
    dismiss,
  };
};

export const initToast = (options: ToastOptions = {}): ToastController =>
  createToast(options);

let autoToastController: ToastController | null = null;
let autoStartSuspended = false;
let bootOnReady: (() => void) | null = null;

const cancelDeferredAutoStart = () => {
  if (!bootOnReady) return;
  document.removeEventListener('DOMContentLoaded', bootOnReady);
  bootOnReady = null;
};

export const startToastRuntime = (): ToastController | null => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  autoStartSuspended = false;
  cancelDeferredAutoStart();

  if (autoToastController) {
    autoToastController.sync();
    return autoToastController;
  }

  autoToastController = createToast();
  return autoToastController;
};

export const stopToastRuntime = () => {
  autoStartSuspended = true;
  cancelDeferredAutoStart();
  autoToastController?.destroy();
  autoToastController = null;
};

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    bootOnReady = () => {
      bootOnReady = null;
      if (!autoStartSuspended) {
        startToastRuntime();
      }
    };
    document.addEventListener('DOMContentLoaded', bootOnReady);
  } else {
    startToastRuntime();
  }
}
