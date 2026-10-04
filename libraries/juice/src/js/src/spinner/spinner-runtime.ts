/**
 * DOM-first indeterminate busy-indicator runtime for Juice spinner chrome.
 *
 * Markup contract (Slice A — do not rename attrs):
 *   [spinner]        host. The ring is ::before. CSS owns the spin
 *                    (juice-spinner-spin). prefers-reduced-motion already
 *                    stops that animation. Any attribute value, including
 *                    spinner="busy", is still a spinner. Sync does not
 *                    rewrite the attribute. There is no <spinner> element.
 *                    A node without [spinner] is ignored.
 *   [spinner-label]  optional visible text, usually inside the host.
 *                    Authors own the accessible name. The label is not
 *                    copied into aria-label or aria-labelledby.
 *
 * Sync (markup-driven):
 *   1. Shown means the host does not have the native hidden attribute.
 *      While shown, role="status" and aria-busy="true". An author role
 *      that is not status is replaced. The host is not made focusable
 *      (no tabindex). There is no keyboard and no pointer handler.
 *   2. Hidden means native hidden. hide() sets that attribute and clears
 *      role="status" and aria-busy so the spinner does not announce as
 *      busy. show() removes hidden and restores the shown state.
 *      Siblings are left alone.
 *   3. When there is no visible [spinner-label], authors supply the
 *      accessible name (aria-label or aria-labelledby). This runtime
 *      does not invent label text, and it does not rewrite a name the
 *      author already set.
 *
 * Not a progress bar: no value, no aria-valuenow, no
 * --juice-progress-ratio. Not a layered overlay: no focus trap, no
 * Escape, no Sig Spinner factory.
 *
 * Limitations: a value, keyboard handling, Escape, a focus trap, and a
 * Sig Spinner factory are out of scope. See
 * docs/juice/juice-spinner-runtime.md.
 */

export type SpinnerOptions = {
  root?: ParentNode;
  spinnerSelector?: string;
};

export type SpinnerController = {
  destroy: () => void;
  sync: () => void;
  show: (target?: HTMLElement | null) => void;
  hide: (target?: HTMLElement | null) => void;
  isShown: (target?: HTMLElement | null) => boolean;
};

const DEFAULT_ROOT: ParentNode =
  typeof document !== 'undefined' ? document : ({} as ParentNode);

const DEFAULTS: Required<SpinnerOptions> = {
  root: DEFAULT_ROOT,
  spinnerSelector: '[spinner]',
};

const asArray = <T extends Element>(nodes: ArrayLike<T>): T[] =>
  Array.from(nodes);

const isShownHost = (host: HTMLElement) => !host.hasAttribute('hidden');

const noopController = (): SpinnerController => ({
  destroy: () => {},
  sync: () => {},
  show: () => {},
  hide: () => {},
  isShown: () => false,
});

export const createSpinner = (
  options: SpinnerOptions = {}
): SpinnerController => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return noopController();
  }

  const settings = { ...DEFAULTS, ...options };
  const root = settings.root ?? document;
  let destroyed = false;

  const isManagedSpinner = (element: HTMLElement | null | undefined) => {
    if (!element?.matches(settings.spinnerSelector)) return false;
    if (root instanceof Document) return true;
    if (root instanceof Node) return root === element || root.contains(element);
    return false;
  };

  const getSpinners = () => {
    const found = asArray(
      root.querySelectorAll<HTMLElement>(settings.spinnerSelector)
    ).filter(isManagedSpinner);

    if (root instanceof HTMLElement && isManagedSpinner(root)) {
      return [root, ...found.filter((host) => host !== root)];
    }

    return found;
  };

  const resolveContainingSpinner = (
    element: HTMLElement | null | undefined
  ) => {
    if (!element) return null;
    const host = element.closest(settings.spinnerSelector);
    if (!(host instanceof HTMLElement) || !isManagedSpinner(host)) return null;
    return host;
  };

  const resolveSpinner = (target?: HTMLElement | null) => {
    if (target) {
      if (isManagedSpinner(target)) return target;
      const containing = resolveContainingSpinner(target);
      if (containing) return containing;
    }

    return getSpinners().find((host) => isManagedSpinner(host)) ?? null;
  };

  const writeHost = (host: HTMLElement) => {
    if (isShownHost(host)) {
      if (host.getAttribute('role') !== 'status') {
        host.setAttribute('role', 'status');
      }
      if (host.getAttribute('aria-busy') !== 'true') {
        host.setAttribute('aria-busy', 'true');
      }
      return;
    }

    if (host.getAttribute('role') === 'status') {
      host.removeAttribute('role');
    }
    if (host.hasAttribute('aria-busy')) {
      host.removeAttribute('aria-busy');
    }
  };

  const sync = () => {
    if (destroyed) return;

    getSpinners().forEach((host) => {
      if (!isManagedSpinner(host)) return;
      writeHost(host);
    });
  };

  const show = (target?: HTMLElement | null) => {
    const host = resolveSpinner(target);
    if (!host) return;
    if (host.hidden) host.hidden = false;
    writeHost(host);
  };

  const hide = (target?: HTMLElement | null) => {
    const host = resolveSpinner(target);
    if (!host) return;
    if (host.getAttribute('role') === 'status') {
      host.removeAttribute('role');
    }
    if (host.hasAttribute('aria-busy')) {
      host.removeAttribute('aria-busy');
    }
    if (!host.hidden) host.hidden = true;
  };

  const isShown = (target?: HTMLElement | null) => {
    const host = resolveSpinner(target);
    if (!host) return false;
    return isShownHost(host);
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
      attributes: true,
      attributeFilter: [
        'spinner',
        'hidden',
        'role',
        'aria-busy',
        'aria-label',
        'aria-labelledby',
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
    show,
    hide,
    isShown,
  };
};

export const initSpinner = (
  options: SpinnerOptions = {}
): SpinnerController => createSpinner(options);

let autoSpinnerController: SpinnerController | null = null;
let autoStartSuspended = false;
let bootOnReady: (() => void) | null = null;

const cancelDeferredAutoStart = () => {
  if (!bootOnReady || typeof document === 'undefined') return;
  document.removeEventListener('DOMContentLoaded', bootOnReady);
  bootOnReady = null;
};

export const startSpinnerRuntime = (): SpinnerController | null => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  autoStartSuspended = false;
  cancelDeferredAutoStart();

  if (autoSpinnerController) {
    autoSpinnerController.sync();
    return autoSpinnerController;
  }

  autoSpinnerController = createSpinner();
  return autoSpinnerController;
};

export const stopSpinnerRuntime = () => {
  autoStartSuspended = true;
  cancelDeferredAutoStart();
  autoSpinnerController?.destroy();
  autoSpinnerController = null;
};

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    bootOnReady = () => {
      bootOnReady = null;
      if (!autoStartSuspended) {
        startSpinnerRuntime();
      }
    };
    document.addEventListener('DOMContentLoaded', bootOnReady);
  } else {
    startSpinnerRuntime();
  }
}
