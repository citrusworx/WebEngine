export type NavigationOptions = {
  root?: ParentNode;
  navSelector?: string;
  sidebarSelector?: string;
  toggleSelector?: string;
  mobileBreakpoint?: number;
};

export type NavigationController = {
  destroy: () => void;
  openSidebar: (toggle?: HTMLElement | null) => void;
  closeSidebar: (toggle?: HTMLElement | null) => void;
  toggleSidebar: (toggle?: HTMLElement | null) => void;
  sync: () => void;
  isMobile: () => boolean;
};

const DEFAULT_ROOT: ParentNode =
  typeof document !== 'undefined' ? document : ({} as ParentNode);

const DEFAULTS: Required<NavigationOptions> = {
  root: DEFAULT_ROOT,
  navSelector: 'nav[type="bar"], nav[type="links"]',
  sidebarSelector: 'nav[type="sidebar"]',
  toggleSelector: 'nav[type="mobile"]',
  mobileBreakpoint: 960,
};

const asArray = <T extends Element>(nodes: NodeListOf<T>): T[] =>
  Array.from(nodes);

const SIDEBAR_ID_PREFIX = 'juice-sidebar';
const TOGGLE_LABEL = 'Toggle navigation menu';

const setVisibility = (element: HTMLElement, visible: boolean) => {
  if (visible) {
    element.removeAttribute('hidden');
    return;
  }

  element.setAttribute('hidden', 'true');
};

const isNativeInteractiveToggle = (element: HTMLElement) =>
  element instanceof HTMLButtonElement ||
  element instanceof HTMLAnchorElement;

export const createNavigation = (
  options: NavigationOptions = {}
): NavigationController => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      destroy: () => {},
      openSidebar: () => {},
      closeSidebar: () => {},
      toggleSidebar: () => {},
      sync: () => {},
      isMobile: () => false,
    };
  }

  const settings = { ...DEFAULTS, ...options };
  const root = settings.root ?? document;
  const rootEvents = root as ParentNode & EventTarget;

  const getNavs = () =>
    asArray(root.querySelectorAll<HTMLElement>(settings.navSelector));
  const getSidebars = () =>
    asArray(root.querySelectorAll<HTMLElement>(settings.sidebarSelector));
  const getToggles = () =>
    asArray(root.querySelectorAll<HTMLElement>(settings.toggleSelector));

  const isMobile = () => window.innerWidth <= settings.mobileBreakpoint;

  let sidebarIdCounter = 0;

  const ensureSidebarId = (sidebar: HTMLElement) => {
    if (sidebar.id) return sidebar.id;
    sidebarIdCounter += 1;
    const sidebarId = `${SIDEBAR_ID_PREFIX}-${sidebarIdCounter}`;
    sidebar.id = sidebarId;
    return sidebarId;
  };

  const ensureToggleAccessibility = (
    toggle: HTMLElement | null | undefined,
    sidebar: HTMLElement | null | undefined
  ) => {
    if (!toggle) return;
    const hasVisibleContent =
      toggle.children.length > 0 || (toggle.textContent?.trim().length ?? 0) > 0;

    if (sidebar) {
      toggle.setAttribute('aria-controls', ensureSidebarId(sidebar));
    }

    if (hasVisibleContent) {
      toggle.removeAttribute('data-nav-toggle-icon');
    } else {
      toggle.setAttribute('data-nav-toggle-icon', 'default');
    }

    if (!toggle.hasAttribute('aria-label') && !toggle.hasAttribute('aria-labelledby')) {
      const text = toggle.textContent?.trim() ?? '';
      if (text.length === 0) {
        toggle.setAttribute('aria-label', TOGGLE_LABEL);
      }
    }

    if (!isNativeInteractiveToggle(toggle)) {
      toggle.setAttribute('role', 'button');
      if (!toggle.hasAttribute('tabindex')) {
        toggle.setAttribute('tabindex', '0');
      }
    }
  };

  const resolveSidebar = (toggle?: HTMLElement | null) => {
    const sidebars = getSidebars();
    if (sidebars.length === 0) return null;
    if (!toggle) return sidebars[0] ?? null;

    const toggleParent = toggle.parentElement;
    if (toggleParent) {
      const siblingSidebar = asArray(
        toggleParent.querySelectorAll<HTMLElement>(settings.sidebarSelector)
      )[0];

      if (siblingSidebar) return siblingSidebar;
    }

    let current: HTMLElement | null = toggle;
    while (current) {
      const localSidebar = asArray(
        current.querySelectorAll<HTMLElement>(settings.sidebarSelector)
      )[0];

      if (localSidebar) return localSidebar;
      current = current.parentElement;
    }

    return sidebars[0] ?? null;
  };

  const resolveToggle = (sidebar?: HTMLElement | null) => {
    const toggles = getToggles();
    if (toggles.length === 0) return null;
    if (!sidebar) return toggles[0] ?? null;

    const sidebarParent = sidebar.parentElement;
    if (sidebarParent) {
      const siblingToggle = asArray(
        sidebarParent.querySelectorAll<HTMLElement>(settings.toggleSelector)
      )[0];

      if (siblingToggle) return siblingToggle;
    }

    let current: HTMLElement | null = sidebar;
    while (current) {
      const localToggle = asArray(
        current.querySelectorAll<HTMLElement>(settings.toggleSelector)
      )[0];

      if (localToggle) return localToggle;
      current = current.parentElement;
    }

    return toggles[0] ?? null;
  };

  const openSidebar = (toggle?: HTMLElement | null) => {
    const sidebar = resolveSidebar(toggle);
    const resolvedToggle = toggle ?? resolveToggle(sidebar);

    if (!sidebar) return;

    ensureSidebarId(sidebar);
    ensureToggleAccessibility(resolvedToggle, sidebar);
    sidebar.removeAttribute('hidden');
    sidebar.setAttribute('aria-hidden', 'false');
    resolvedToggle?.setAttribute('aria-expanded', 'true');
  };

  const closeSidebar = (toggle?: HTMLElement | null) => {
    const sidebar = resolveSidebar(toggle);
    const resolvedToggle = toggle ?? resolveToggle(sidebar);

    if (!sidebar) return;

    ensureSidebarId(sidebar);
    ensureToggleAccessibility(resolvedToggle, sidebar);
    if (isMobile()) {
      sidebar.setAttribute('hidden', 'true');
    }

    sidebar.setAttribute('aria-hidden', String(isMobile()));
    resolvedToggle?.setAttribute('aria-expanded', 'false');
  };

  const toggleSidebar = (toggle?: HTMLElement | null) => {
    const sidebar = resolveSidebar(toggle);
    if (!sidebar) return;

    const isOpen = !sidebar.hasAttribute('hidden');
    if (isOpen) {
      closeSidebar(toggle);
      return;
    }

    openSidebar(toggle);
  };

  const sync = () => {
    const mobile = isMobile();
    const navs = getNavs();
    const toggles = getToggles();
    const sidebars = getSidebars();

    navs.forEach((nav) => setVisibility(nav, !mobile));
    toggles.forEach((toggle) => {
      const sidebar = resolveSidebar(toggle);
      ensureToggleAccessibility(toggle, sidebar);
      setVisibility(toggle, mobile);
      if (!mobile) {
        toggle.setAttribute('aria-expanded', 'false');
      }
    });

    sidebars.forEach((sidebar) => {
      ensureSidebarId(sidebar);
      const toggle = resolveToggle(sidebar);
      ensureToggleAccessibility(toggle, sidebar);

      if (!mobile) {
        sidebar.removeAttribute('hidden');
        sidebar.setAttribute('aria-hidden', 'false');
        toggle?.setAttribute('aria-expanded', 'false');
        return;
      }

      const shouldStayOpen = !sidebar.hasAttribute('hidden');
      if (shouldStayOpen) {
        sidebar.setAttribute('aria-hidden', 'false');
        toggle?.setAttribute('aria-expanded', 'true');
        return;
      }

      sidebar.setAttribute('hidden', 'true');
      sidebar.setAttribute('aria-hidden', 'true');
      toggle?.setAttribute('aria-expanded', 'false');
    });
  };

  const handleResize = () => sync();
  const handleRootClick = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const toggle = target.closest(settings.toggleSelector);
    if (!(toggle instanceof HTMLElement)) return;

    toggleSidebar(toggle);
  };

  const handleRootKeydown = (event: Event) => {
    if (!(event instanceof KeyboardEvent)) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;

    const target = event.target;
    if (!(target instanceof Element)) return;

    const toggle = target.closest(settings.toggleSelector);
    if (!(toggle instanceof HTMLElement) || isNativeInteractiveToggle(toggle)) {
      return;
    }

    event.preventDefault();
    toggleSidebar(toggle);
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

  window.addEventListener('resize', handleResize);
  rootEvents.addEventListener('click', handleRootClick);
  rootEvents.addEventListener('keydown', handleRootKeydown);

  if (observer && root instanceof Node) {
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['hidden', 'type'],
    });
  }

  sync();

  return {
    destroy: () => {
      window.removeEventListener('resize', handleResize);
      rootEvents.removeEventListener('click', handleRootClick);
      rootEvents.removeEventListener('keydown', handleRootKeydown);
      observer?.disconnect();
    },
    openSidebar,
    closeSidebar,
    toggleSidebar,
    sync,
    isMobile,
  };
};

export const initNavigation = (
  options: NavigationOptions = {}
): NavigationController => createNavigation(options);

let autoNavigationController: NavigationController | null = null;

export const startNavigationRuntime = (): NavigationController | null => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  if (autoNavigationController) {
    autoNavigationController.sync();
    return autoNavigationController;
  }

  autoNavigationController = createNavigation();
  return autoNavigationController;
};

export const stopNavigationRuntime = () => {
  autoNavigationController?.destroy();
  autoNavigationController = null;
};

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      startNavigationRuntime();
    });
  } else {
    startNavigationRuntime();
  }
}
