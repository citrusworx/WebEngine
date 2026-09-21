/**
 * DOM-first banner dismiss runtime for Juice banner chrome.
 *
 * Markup contract (authors place the callout — this is not a portal):
 *   [banner] / [banner="full"] + [banner-body]? + [banner-close]?
 * Optional status: [banner-tone="info|success|warning|error"]
 * Closed banners use native `hidden`. The node stays in the DOM.
 *
 * Banner is NOT a dialog and NOT a toast stack:
 *   - no focus trap, no aria-modal, no overlay, no [banner-region]
 *   - no auto-dismiss timer; the banner stays until dismiss
 *   - show() never hides siblings
 *   - do not move focus into the banner on show
 *
 * Escape is left to modal / drawer / popover / toast. Banner is inline
 * and not a dialog; v1 does not steal Escape for focused banners.
 *
 * Persist (lean): optional banner-persist="session|local" plus a `name`
 * or `id` key remembers dismiss in sessionStorage / localStorage.
 * Without persist, or without a name/id, dismiss is in-memory only.
 *
 * Live role: sync fills role="status" for info / success / neutral, and
 * role="alert" for error / warning. Empty close controls get
 * aria-label="Dismiss".
 */

export type BannerOptions = {
  root?: ParentNode;
  bannerSelector?: string;
  closeSelector?: string;
};

export type BannerController = {
  destroy: () => void;
  sync: () => void;
  show: (target?: HTMLElement | null) => void;
  dismiss: (target?: HTMLElement | null) => void;
};

const DEFAULT_ROOT: ParentNode =
  typeof document !== 'undefined' ? document : ({} as ParentNode);

const DEFAULTS: Required<BannerOptions> = {
  root: DEFAULT_ROOT,
  bannerSelector: '[banner]',
  closeSelector: '[banner-close]',
};

const STORAGE_PREFIX = 'juice-banner:';

const asArray = <T extends Element>(nodes: ArrayLike<T>): T[] =>
  Array.from(nodes);

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

const isBannerVisible = (banner: HTMLElement) => !banner.hasAttribute('hidden');

const isAlertTone = (banner: HTMLElement) => {
  const tone = banner.getAttribute('banner-tone');
  return tone === 'error' || tone === 'warning';
};

const resolvePersist = (banner: HTMLElement) => {
  const mode = banner.getAttribute('banner-persist');
  if (mode !== 'session' && mode !== 'local') return null;

  const name = banner.getAttribute('name')?.trim();
  const id = banner.id?.trim();
  const key = name || id;
  if (!key) return null;

  const storage =
    mode === 'local'
      ? typeof localStorage === 'undefined'
        ? null
        : localStorage
      : typeof sessionStorage === 'undefined'
        ? null
        : sessionStorage;

  if (!storage) return null;
  return { storage, key: `${STORAGE_PREFIX}${key}` };
};

const readPersistedDismiss = (banner: HTMLElement) => {
  const persist = resolvePersist(banner);
  if (!persist) return false;
  try {
    return persist.storage.getItem(persist.key) === '1';
  } catch {
    return false;
  }
};

const writePersistedDismiss = (banner: HTMLElement, dismissed: boolean) => {
  const persist = resolvePersist(banner);
  if (!persist) return;
  try {
    if (dismissed) {
      persist.storage.setItem(persist.key, '1');
      return;
    }
    persist.storage.removeItem(persist.key);
  } catch {
    // Private mode / quota — dismiss still applies in the current document.
  }
};

export const createBanner = (options: BannerOptions = {}): BannerController => {
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

  const getBanners = () =>
    asArray(root.querySelectorAll<HTMLElement>(settings.bannerSelector));

  const resolveContainingBanner = (element: HTMLElement | null | undefined) => {
    if (!element) return null;
    const banner = element.closest(settings.bannerSelector);
    return banner instanceof HTMLElement ? banner : null;
  };

  const isManagedBanner = (element: HTMLElement | null | undefined) => {
    if (!element?.matches(settings.bannerSelector)) return false;
    if (root instanceof Document) return true;
    if (root instanceof Node) return root.contains(element);
    return getBanners().includes(element);
  };

  const resolveBanner = (target?: HTMLElement | null) => {
    if (target) {
      if (isManagedBanner(target)) return target;

      const containing = resolveContainingBanner(target);
      if (containing && isManagedBanner(containing)) return containing;
    }

    const banners = getBanners().filter(isManagedBanner);
    return banners.find(isBannerVisible) ?? banners[0] ?? null;
  };

  const ensureCloseAccessibility = (banner: HTMLElement) => {
    asArray(banner.querySelectorAll<HTMLElement>(settings.closeSelector))
      .filter((close) => resolveContainingBanner(close) === banner)
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

  const ensureBannerAccessibility = (banner: HTMLElement) => {
    const role = isAlertTone(banner) ? 'alert' : 'status';
    if (banner.getAttribute('role') !== role) {
      banner.setAttribute('role', role);
    }
    ensureCloseAccessibility(banner);
  };

  const setVisibleState = (banner: HTMLElement, visible: boolean) => {
    if (banner.hidden === !visible) return;
    banner.hidden = !visible;
  };

  const show = (target?: HTMLElement | null) => {
    const banner = resolveBanner(target);
    if (!banner) return;

    writePersistedDismiss(banner, false);
    ensureBannerAccessibility(banner);

    if (isBannerVisible(banner)) return;
    setVisibleState(banner, true);
  };

  const dismiss = (target?: HTMLElement | null) => {
    const banner = resolveBanner(target);
    if (!banner || !isBannerVisible(banner)) return;

    writePersistedDismiss(banner, true);
    setVisibleState(banner, false);
  };

  const sync = () => {
    getBanners().forEach((banner) => {
      if (!isManagedBanner(banner)) return;
      if (readPersistedDismiss(banner) && isBannerVisible(banner)) {
        setVisibleState(banner, false);
      }
      ensureBannerAccessibility(banner);
    });
  };

  const handleRootClick = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const closeControl = target.closest(settings.closeSelector);
    if (!(closeControl instanceof HTMLElement)) return;

    const banner = resolveContainingBanner(closeControl);
    if (!banner || !isManagedBanner(banner)) return;
    if (!claimEvent(event)) return;
    dismiss(banner);
  };

  const handleRootKeydown = (event: Event) => {
    if (!(event instanceof KeyboardEvent)) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;

    const target = event.target;
    if (!(target instanceof Element)) return;

    const closeControl = target.closest(settings.closeSelector);
    if (
      closeControl instanceof HTMLElement &&
      resolveContainingBanner(closeControl) &&
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

  if (observer && root instanceof Node) {
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        'hidden',
        'banner',
        'banner-close',
        'banner-tone',
        'banner-persist',
        'name',
        'id',
        'role',
        'aria-label',
      ],
    });
  }

  sync();

  return {
    destroy: () => {
      rootEvents.removeEventListener('click', handleRootClick);
      rootEvents.removeEventListener('keydown', handleRootKeydown);
      observer?.disconnect();
    },
    sync,
    show,
    dismiss,
  };
};

export const initBanner = (options: BannerOptions = {}): BannerController =>
  createBanner(options);

let autoBannerController: BannerController | null = null;
let autoStartSuspended = false;
let bootOnReady: (() => void) | null = null;

const cancelDeferredAutoStart = () => {
  if (!bootOnReady) return;
  document.removeEventListener('DOMContentLoaded', bootOnReady);
  bootOnReady = null;
};

export const startBannerRuntime = (): BannerController | null => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  autoStartSuspended = false;
  cancelDeferredAutoStart();

  if (autoBannerController) {
    autoBannerController.sync();
    return autoBannerController;
  }

  autoBannerController = createBanner();
  return autoBannerController;
};

export const stopBannerRuntime = () => {
  autoStartSuspended = true;
  cancelDeferredAutoStart();
  autoBannerController?.destroy();
  autoBannerController = null;
};

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    bootOnReady = () => {
      bootOnReady = null;
      if (!autoStartSuspended) {
        startBannerRuntime();
      }
    };
    document.addEventListener('DOMContentLoaded', bootOnReady);
  } else {
    startBannerRuntime();
  }
}
