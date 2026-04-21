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

const DEFAULTS: Required<NavigationOptions> = {
  root: document,
  navSelector: 'nav[type="bar"], nav[type="links"]',
  sidebarSelector: 'nav[type="sidebar"]',
  toggleSelector: 'nav[type="mobile"]',
  mobileBreakpoint: 768,
};

const asArray = <T extends Element>(nodes: NodeListOf<T>): T[] =>
  Array.from(nodes);

const setVisibility = (element: HTMLElement, visible: boolean) => {
  if (visible) {
    element.removeAttribute('hidden');
    return;
  }

  element.setAttribute('hidden', 'true');
};

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

    sidebar.removeAttribute('hidden');
    sidebar.setAttribute('aria-hidden', 'false');
    resolvedToggle?.setAttribute('aria-expanded', 'true');
  };

  const closeSidebar = (toggle?: HTMLElement | null) => {
    const sidebar = resolveSidebar(toggle);
    const resolvedToggle = toggle ?? resolveToggle(sidebar);

    if (!sidebar) return;

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
      setVisibility(toggle, mobile);
      if (!mobile) {
        toggle.setAttribute('aria-expanded', 'false');
      }
    });

    sidebars.forEach((sidebar) => {
      const toggle = resolveToggle(sidebar);

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
