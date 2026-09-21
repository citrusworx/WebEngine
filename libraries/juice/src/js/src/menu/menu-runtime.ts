/**
 * DOM-first APG Menu Button runtime for Juice menu chrome.
 *
 * Markup contract (Slice A — do not rename attrs):
 *   [menu-root] > opener + [menu][hidden] > [menuitem]+ /
 *   [menu-separator]? / [menu-label]?
 * Closed vs open is the native `hidden` attribute on `[menu]`, not on
 * `[menu-root]` (hiding the root would hide the opener).
 *
 * Opener: prefer `[menu-button]` inside the root. Authors may omit that
 * attr for CTA styling and use a plain button/control inside the root.
 * Pairing: `aria-haspopup="menu"` + `aria-controls` → the `[menu]` id
 * (runtime fills missing).
 *
 * This is an APG **Menu Button** (opener toggles a menu of menuitems).
 * It is not a popover, not a combobox, not a native <select> restyle,
 * not a menubar, and not a context menu. No submenus or typeahead in v1.
 * Placement stays CSS-absolute on `[menu-root]` (`top|bottom|left|right`,
 * default bottom). No Floating UI. No `aria-modal`.
 *
 * Keyboard focus (honest v1): **roving tabindex** on `[menuitem]`.
 * Combobox keeps focus on the input and uses `aria-activedescendant`
 * because the text field must remain the active element. APG Menu Button
 * moves focus onto the menuitem itself (ArrowUp/Down, Home/End move
 * `tabindex="0"` plus `menuitem="active"` paint). This runtime follows
 * that pattern. Separators and labels are skipped. Disabled items
 * (`aria-disabled="true"` or native `disabled`) are skipped.
 *
 * Open on opener click / Enter / Space (native buttons use click).
 * ArrowDown on a closed opener opens and focuses the first enabled item
 * (or the previously active item). ArrowUp opens onto the last enabled
 * item. Close on Escape (yields when an open [modal-overlay] or
 * [drawer-overlay] exists — menu sits with popover in the dialog-adjacent
 * band), outside click, Tab (closes without activating; focus returns
 * to the opener so Tab's default can move to the next/previous control),
 * or after activating an item. Activating an item clicks it and restores
 * focus to the opener. Disabled items are intercepted on capture so
 * author click handlers never run. Opening one managed menu closes the
 * others. Modal / drawer / popover are not auto-closed. ArrowUp/Down on
 * a closed menu apply only to the opener. A controller claims opener
 * clicks only when it can resolve a panel (custom `menuSelector` can
 * coexist with the auto singleton).
 */

import { createEventClaim } from '../shared/events.js';
import { controlIds } from '../shared/ids.js';
import { hasOpenDialogOverlay } from '../shared/overlays.js';

export type MenuOptions = {
  root?: ParentNode;
  rootSelector?: string;
  buttonSelector?: string;
  menuSelector?: string;
  itemSelector?: string;
  separatorSelector?: string;
  labelSelector?: string;
};

export type MenuController = {
  destroy: () => void;
  sync: () => void;
  open: (target?: HTMLElement | null) => void;
  close: (target?: HTMLElement | null) => void;
  toggle: (target?: HTMLElement | null) => void;
  select: (target?: HTMLElement | null) => void;
};

const DEFAULT_ROOT: ParentNode =
  typeof document !== 'undefined' ? document : ({} as ParentNode);

const DEFAULTS: Required<MenuOptions> = {
  root: DEFAULT_ROOT,
  rootSelector: '[menu-root]',
  buttonSelector: '[menu-button]',
  menuSelector: '[menu]',
  itemSelector: '[menuitem]',
  separatorSelector: '[menu-separator]',
  labelSelector: '[menu-label]',
};

const asArray = <T extends Element>(nodes: ArrayLike<T>): T[] =>
  Array.from(nodes);

const MENU_ID_PREFIX = 'juice-menu';
const ITEM_ID_PREFIX = 'juice-menuitem';

let idSerial = 0;

const nextGeneratedId = (prefix: string) => {
  let candidate = '';
  do {
    idSerial += 1;
    candidate = `${prefix}-${idSerial}`;
  } while (
    typeof document !== 'undefined' &&
    document.getElementById(candidate)
  );
  return candidate;
};

const assignUniqueId = (
  element: HTMLElement,
  preferred: string | null,
  prefix: string
) => {
  if (element.id) return element.id;
  if (preferred && !document.getElementById(preferred)) {
    element.id = preferred;
    return preferred;
  }
  element.id = nextGeneratedId(prefix);
  return element.id;
};

const claimEvent = createEventClaim();
const lastActiveItems = new WeakMap<HTMLElement, HTMLElement>();
const focusRestorers = new WeakMap<HTMLElement, HTMLElement>();

const slugFromName = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'menu';

const isNativeInteractive = (element: HTMLElement) => {
  if (element instanceof HTMLButtonElement) return true;
  if (element instanceof HTMLAnchorElement) return element.hasAttribute('href');
  return false;
};

const isItemDisabled = (item: HTMLElement) => {
  if (item.getAttribute('aria-disabled') === 'true') return true;
  if (item instanceof HTMLButtonElement && item.disabled) return true;
  if (item instanceof HTMLInputElement && item.disabled) return true;
  return false;
};

const noopController = (): MenuController => ({
  destroy: () => {},
  sync: () => {},
  open: () => {},
  close: () => {},
  toggle: () => {},
  select: () => {},
});

export const createMenu = (options: MenuOptions = {}): MenuController => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return noopController();
  }

  const settings = { ...DEFAULTS, ...options };
  const root = settings.root ?? document;

  const getMenuRoots = () =>
    asArray(root.querySelectorAll<HTMLElement>(settings.rootSelector));

  const resolveContainingRoot = (element: Element | null | undefined) => {
    if (!element) return null;
    const menuRoot = element.closest(settings.rootSelector);
    return menuRoot instanceof HTMLElement ? menuRoot : null;
  };

  const isManagedRoot = (element: HTMLElement | null | undefined) => {
    if (!element?.matches(settings.rootSelector)) return false;
    if (root instanceof Document) return true;
    if (root instanceof Node) return root.contains(element);
    return getMenuRoots().includes(element);
  };

  const getPanel = (menuRoot: HTMLElement) =>
    asArray(
      menuRoot.querySelectorAll<HTMLElement>(settings.menuSelector)
    ).find((panel) => resolveContainingRoot(panel) === menuRoot) ?? null;

  const isInsidePanel = (element: Element, menuRoot: HTMLElement) => {
    const panel = getPanel(menuRoot);
    return Boolean(panel && panel.contains(element));
  };

  const getItems = (menuRoot: HTMLElement) => {
    const panel = getPanel(menuRoot);
    if (!panel) return [];
    return asArray(
      panel.querySelectorAll<HTMLElement>(settings.itemSelector)
    ).filter((item) => resolveContainingRoot(item) === menuRoot);
  };

  const getEnabledItems = (menuRoot: HTMLElement) =>
    getItems(menuRoot).filter(
      (item) => !item.hasAttribute('hidden') && !isItemDisabled(item)
    );

  const getSeparators = (menuRoot: HTMLElement) => {
    const panel = getPanel(menuRoot);
    if (!panel) return [];
    return asArray(
      panel.querySelectorAll<HTMLElement>(settings.separatorSelector)
    ).filter((separator) => resolveContainingRoot(separator) === menuRoot);
  };

  const getOpener = (menuRoot: HTMLElement) => {
    const marked = asArray(
      menuRoot.querySelectorAll<HTMLElement>(settings.buttonSelector)
    ).find(
      (button) =>
        resolveContainingRoot(button) === menuRoot &&
        !isInsidePanel(button, menuRoot)
    );
    if (marked) return marked;

    const byPopup = asArray(
      menuRoot.querySelectorAll<HTMLElement>('[aria-haspopup="menu"]')
    ).find(
      (candidate) =>
        resolveContainingRoot(candidate) === menuRoot &&
        !isInsidePanel(candidate, menuRoot)
    );
    if (byPopup) return byPopup;

    const panel = getPanel(menuRoot);
    if (panel?.id) {
      const byControls = asArray(
        menuRoot.querySelectorAll<HTMLElement>('[aria-controls]')
      ).find((candidate) => {
        if (resolveContainingRoot(candidate) !== menuRoot) return false;
        if (isInsidePanel(candidate, menuRoot)) return false;
        return controlIds(candidate).includes(panel.id);
      });
      if (byControls) return byControls;
    }

    return (
      asArray(
        menuRoot.querySelectorAll<HTMLElement>(
          'button, [role="button"], a[href]'
        )
      ).find(
        (candidate) =>
          resolveContainingRoot(candidate) === menuRoot &&
          !isInsidePanel(candidate, menuRoot)
      ) ?? null
    );
  };

  const isMenuOpen = (menuRoot: HTMLElement) => {
    const panel = getPanel(menuRoot);
    return Boolean(panel && !panel.hasAttribute('hidden'));
  };

  const getActiveItem = (menuRoot: HTMLElement) =>
    getEnabledItems(menuRoot).find(
      (item) => item.getAttribute('menuitem') === 'active'
    ) ?? null;

  const resolveMenuRoot = (target?: HTMLElement | null) => {
    if (target) {
      if (isManagedRoot(target)) return target;

      const containing = resolveContainingRoot(target);
      if (containing && isManagedRoot(containing)) return containing;
    }

    return getMenuRoots().find(isMenuOpen) ?? getMenuRoots()[0] ?? null;
  };

  const namedBase = (menuRoot: HTMLElement) => {
    const name = menuRoot.getAttribute('name');
    if (name) return slugFromName(name);
    if (menuRoot.id) return slugFromName(menuRoot.id);
    const panel = getPanel(menuRoot);
    if (panel?.id) return slugFromName(panel.id);
    return null;
  };

  const setExpanded = (menuRoot: HTMLElement, expanded: boolean) => {
    const opener = getOpener(menuRoot);
    if (!opener) return;
    const expandedValue = String(expanded);
    if (opener.getAttribute('aria-expanded') !== expandedValue) {
      opener.setAttribute('aria-expanded', expandedValue);
    }
  };

  const setOpenState = (menuRoot: HTMLElement, open: boolean) => {
    const panel = getPanel(menuRoot);
    if (!panel) return;
    if (panel.hidden === !open) return;
    panel.hidden = !open;
  };

  const applyRovingTabindex = (
    menuRoot: HTMLElement,
    active: HTMLElement | null
  ) => {
    const open = isMenuOpen(menuRoot);
    getItems(menuRoot).forEach((item) => {
      const isActive = item === active && open && !isItemDisabled(item);
      if (isActive) {
        if (item.getAttribute('menuitem') !== 'active') {
          item.setAttribute('menuitem', 'active');
        }
        if (item.getAttribute('tabindex') !== '0') {
          item.setAttribute('tabindex', '0');
        }
        lastActiveItems.set(menuRoot, item);
        return;
      }

      if (item.getAttribute('menuitem') === 'active') {
        item.setAttribute('menuitem', '');
      }
      if (item.getAttribute('tabindex') !== '-1') {
        item.setAttribute('tabindex', '-1');
      }
    });
  };

  const setActiveItem = (
    menuRoot: HTMLElement,
    item: HTMLElement | null,
    focus: boolean
  ) => {
    applyRovingTabindex(menuRoot, item);
    if (focus && item && isMenuOpen(menuRoot) && typeof item.focus === 'function') {
      item.focus();
    }
  };

  const pickOpenItem = (
    menuRoot: HTMLElement,
    prefer: 'first' | 'last' | 'previous' = 'previous'
  ) => {
    const enabled = getEnabledItems(menuRoot);
    if (enabled.length === 0) return null;

    if (prefer === 'last') return enabled[enabled.length - 1] ?? null;
    if (prefer === 'first') return enabled[0] ?? null;

    const previous = lastActiveItems.get(menuRoot);
    if (previous && enabled.includes(previous)) return previous;

    const marked = enabled.find(
      (item) => item.getAttribute('menuitem') === 'active'
    );
    return marked ?? enabled[0] ?? null;
  };

  const ensureMenuAccessibility = (menuRoot: HTMLElement) => {
    const panel = getPanel(menuRoot);
    if (!panel) return;

    const opener = getOpener(menuRoot);
    const items = getItems(menuRoot);
    const base = namedBase(menuRoot);

    assignUniqueId(panel, base ? `${base}-menu` : null, MENU_ID_PREFIX);

    if (panel.getAttribute('role') !== 'menu') {
      panel.setAttribute('role', 'menu');
    }

    items.forEach((item, index) => {
      assignUniqueId(
        item,
        base ? `${base}-item-${index + 1}` : null,
        ITEM_ID_PREFIX
      );
      if (item.getAttribute('role') !== 'menuitem') {
        item.setAttribute('role', 'menuitem');
      }
    });

    getSeparators(menuRoot).forEach((separator) => {
      if (separator.getAttribute('role') !== 'separator') {
        separator.setAttribute('role', 'separator');
      }
    });

    if (opener) {
      if (!isNativeInteractive(opener)) {
        opener.setAttribute('role', 'button');
        if (!opener.hasAttribute('tabindex')) {
          opener.setAttribute('tabindex', '0');
        }
      }
      if (opener.getAttribute('aria-haspopup') !== 'menu') {
        opener.setAttribute('aria-haspopup', 'menu');
      }
      if (opener.getAttribute('aria-controls') !== panel.id) {
        opener.setAttribute('aria-controls', panel.id);
      }
    }

    setExpanded(menuRoot, isMenuOpen(menuRoot));
    applyRovingTabindex(menuRoot, isMenuOpen(menuRoot) ? pickOpenItem(menuRoot) : null);
  };

  const rememberRestorer = (
    menuRoot: HTMLElement,
    opener?: HTMLElement | null
  ) => {
    const active =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const restorer =
      opener && !isInsidePanel(opener, menuRoot)
        ? opener
        : active && !isInsidePanel(active, menuRoot)
          ? active
          : getOpener(menuRoot);
    if (restorer) {
      focusRestorers.set(menuRoot, restorer);
    }
  };

  const restoreFocus = (menuRoot: HTMLElement) => {
    const restorer = focusRestorers.get(menuRoot) ?? getOpener(menuRoot);
    focusRestorers.delete(menuRoot);
    if (restorer?.isConnected && typeof restorer.focus === 'function') {
      restorer.focus();
    }
  };

  const hideMenu = (menuRoot: HTMLElement, restore: boolean) => {
    ensureMenuAccessibility(menuRoot);
    setOpenState(menuRoot, false);
    setExpanded(menuRoot, false);
    applyRovingTabindex(menuRoot, null);
    if (restore) {
      restoreFocus(menuRoot);
    } else {
      focusRestorers.delete(menuRoot);
    }
  };

  const showMenu = (
    menuRoot: HTMLElement,
    opener?: HTMLElement | null,
    prefer: 'first' | 'last' | 'previous' = 'previous'
  ) => {
    getMenuRoots()
      .concat(
        asArray(document.querySelectorAll<HTMLElement>(settings.rootSelector))
      )
      .forEach((other) => {
        if (other === menuRoot || !isMenuOpen(other)) return;
        hideMenu(other, false);
      });

    rememberRestorer(menuRoot, opener ?? getOpener(menuRoot));
    ensureMenuAccessibility(menuRoot);
    setOpenState(menuRoot, true);
    setExpanded(menuRoot, true);

    const item = pickOpenItem(menuRoot, prefer);
    setActiveItem(menuRoot, item, true);

    if (!item) {
      const panel = getPanel(menuRoot);
      if (panel) {
        if (!panel.hasAttribute('tabindex')) {
          panel.setAttribute('tabindex', '-1');
        }
        panel.focus();
      }
    }
  };

  const open = (
    target?: HTMLElement | null,
    prefer: 'first' | 'last' | 'previous' = 'previous'
  ) => {
    const menuRoot = resolveMenuRoot(target);
    if (!menuRoot) return;
    if (isMenuOpen(menuRoot)) {
      ensureMenuAccessibility(menuRoot);
      setExpanded(menuRoot, true);
      return;
    }
    const opener =
      target && getOpener(menuRoot) === target
        ? target
        : getOpener(menuRoot);
    showMenu(menuRoot, opener, prefer);
  };

  const close = (target?: HTMLElement | null, restore = true) => {
    const menuRoot = resolveMenuRoot(target);
    if (!menuRoot || !isMenuOpen(menuRoot)) return;
    hideMenu(menuRoot, restore);
  };

  const toggle = (target?: HTMLElement | null) => {
    const menuRoot = resolveMenuRoot(target);
    if (!menuRoot) return;
    if (isMenuOpen(menuRoot)) {
      close(menuRoot);
      return;
    }
    open(target ?? menuRoot);
  };

  const activateItem = (item: HTMLElement) => {
    const menuRoot = resolveContainingRoot(item);
    if (!menuRoot || !isManagedRoot(menuRoot)) return;
    if (isItemDisabled(item)) return;
    item.click();
  };

  const select = (target?: HTMLElement | null) => {
    if (target) {
      if (target.matches(settings.itemSelector)) {
        activateItem(target);
        return;
      }

      const closestItem = target.closest(settings.itemSelector);
      if (closestItem instanceof HTMLElement) {
        activateItem(closestItem);
        return;
      }
    }

    const menuRoot = resolveMenuRoot(target);
    if (!menuRoot) return;
    const active = getActiveItem(menuRoot);
    if (active) {
      activateItem(active);
    }
  };

  const moveActive = (
    menuRoot: HTMLElement,
    nextIndex: (index: number, length: number) => number
  ) => {
    const enabled = getEnabledItems(menuRoot);
    if (enabled.length === 0) return;

    const current = enabled.findIndex(
      (item) => item.getAttribute('menuitem') === 'active'
    );
    const index = nextIndex(current, enabled.length);
    const wrapped =
      ((index % enabled.length) + enabled.length) % enabled.length;
    const next = enabled[wrapped];
    if (!next) return;
    setActiveItem(menuRoot, next, true);
  };

  const sync = () => {
    getMenuRoots().forEach((menuRoot) => {
      ensureMenuAccessibility(menuRoot);
      setExpanded(menuRoot, isMenuOpen(menuRoot));
    });
  };

  const resolveItemFromEvent = (target: Element, menuRoot: HTMLElement) => {
    const item = target.closest(settings.itemSelector);
    if (!(item instanceof HTMLElement)) return null;
    return resolveContainingRoot(item) === menuRoot ? item : null;
  };

  const resolveOpenerFromEvent = (target: Element, menuRoot: HTMLElement) => {
    const opener = getOpener(menuRoot);
    if (!opener) return null;
    if (target === opener || opener.contains(target)) return opener;
    return null;
  };

  const getOpenMenuRoot = () => getMenuRoots().find(isMenuOpen) ?? null;

  const handleDisabledItemClickCapture = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const menuRoot = resolveContainingRoot(target);
    if (!menuRoot || !isManagedRoot(menuRoot)) return;

    const item = resolveItemFromEvent(target, menuRoot);
    if (!item || !isItemDisabled(item)) return;
    if (!claimEvent(event)) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  };

  const handleDocumentClick = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const menuRoot = resolveContainingRoot(target);
    if (menuRoot && isManagedRoot(menuRoot)) {
      const item = resolveItemFromEvent(target, menuRoot);
      if (item) {
        if (isItemDisabled(item)) return;
        if (!claimEvent(event)) return;
        lastActiveItems.set(menuRoot, item);
        hideMenu(menuRoot, true);
        return;
      }

      const opener = resolveOpenerFromEvent(target, menuRoot);
      if (opener) {
        if (!getPanel(menuRoot)) return;
        if (!claimEvent(event)) return;
        event.preventDefault();
        toggle(menuRoot);
        return;
      }

      if (isInsidePanel(target, menuRoot)) return;

      const nestedOpen = getOpenMenuRoot();
      if (!nestedOpen || nestedOpen !== menuRoot) return;
      if (!claimEvent(event)) return;
      hideMenu(nestedOpen, false);
      return;
    }

    const openMenu = getOpenMenuRoot();
    if (!openMenu) return;
    if (!claimEvent(event)) return;
    hideMenu(openMenu, false);
  };

  const handleDocumentKeydown = (event: Event) => {
    if (!(event instanceof KeyboardEvent)) return;
    const target = event.target;
    if (!(target instanceof Element)) return;

    const menuRoot = resolveContainingRoot(target);
    const openMenu = getOpenMenuRoot();

    if (event.key === 'Escape') {
      if (!openMenu) return;
      if (hasOpenDialogOverlay() || event.defaultPrevented) return;
      if (!claimEvent(event)) return;
      event.preventDefault();
      event.stopPropagation();
      close(openMenu);
      return;
    }

    if (event.key === 'Tab') {
      if (!openMenu) return;
      if (!claimEvent(event)) return;
      // Restore to the opener so Tab's default keeps sequential focus
      // (hiding the focused menuitem would drop the tab origin).
      close(openMenu, true);
      return;
    }

    if (!menuRoot || !isManagedRoot(menuRoot)) return;

    const opener = resolveOpenerFromEvent(target, menuRoot);
    const item = resolveItemFromEvent(target, menuRoot);

    if (event.key === 'ArrowDown') {
      if (!isMenuOpen(menuRoot)) {
        if (!opener || !getPanel(menuRoot)) return;
        if (!claimEvent(event)) return;
        event.preventDefault();
        open(opener, 'first');
        return;
      }
      if (!item && !opener) return;
      if (!claimEvent(event)) return;
      event.preventDefault();
      moveActive(menuRoot, (index) => (index < 0 ? 0 : index + 1));
      return;
    }

    if (event.key === 'ArrowUp') {
      if (!isMenuOpen(menuRoot)) {
        if (!opener || !getPanel(menuRoot)) return;
        if (!claimEvent(event)) return;
        event.preventDefault();
        open(opener, 'last');
        return;
      }
      if (!item && !opener) return;
      if (!claimEvent(event)) return;
      event.preventDefault();
      moveActive(menuRoot, (index, length) =>
        index < 0 ? length - 1 : index - 1
      );
      return;
    }

    if (!isMenuOpen(menuRoot)) {
      if (
        opener &&
        getPanel(menuRoot) &&
        !isNativeInteractive(opener) &&
        (event.key === 'Enter' || event.key === ' ')
      ) {
        if (!claimEvent(event)) return;
        event.preventDefault();
        toggle(menuRoot);
      }
      return;
    }

    if (event.key === 'Home') {
      if (!item && !opener) return;
      if (!claimEvent(event)) return;
      event.preventDefault();
      moveActive(menuRoot, () => 0);
      return;
    }

    if (event.key === 'End') {
      if (!item && !opener) return;
      if (!claimEvent(event)) return;
      event.preventDefault();
      moveActive(menuRoot, (_index, length) => length - 1);
      return;
    }

    if (event.key !== 'Enter' && event.key !== ' ') return;

    if (item && !isItemDisabled(item)) {
      if (!claimEvent(event)) return;
      event.preventDefault();
      item.click();
      return;
    }

    if (
      opener &&
      !isNativeInteractive(opener) &&
      (event.key === 'Enter' || event.key === ' ')
    ) {
      if (!claimEvent(event)) return;
      event.preventDefault();
      toggle(menuRoot);
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

  document.addEventListener('click', handleDisabledItemClickCapture, true);
  document.addEventListener('click', handleDocumentClick);
  document.addEventListener('keydown', handleDocumentKeydown);

  if (observer && root instanceof Node) {
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        'hidden',
        'aria-controls',
        'aria-expanded',
        'aria-disabled',
        'aria-haspopup',
        'disabled',
        'menu-root',
        'menu-button',
        'menu',
        'menuitem',
        'menu-separator',
        'menu-label',
      ],
    });
  }

  sync();

  return {
    destroy: () => {
      document.removeEventListener(
        'click',
        handleDisabledItemClickCapture,
        true
      );
      document.removeEventListener('click', handleDocumentClick);
      document.removeEventListener('keydown', handleDocumentKeydown);
      observer?.disconnect();
    },
    sync,
    open,
    close,
    toggle,
    select,
  };
};

export const initMenu = (options: MenuOptions = {}): MenuController =>
  createMenu(options);

let autoMenuController: MenuController | null = null;
let autoStartSuspended = false;
let bootOnReady: (() => void) | null = null;

const cancelDeferredAutoStart = () => {
  if (!bootOnReady) return;
  document.removeEventListener('DOMContentLoaded', bootOnReady);
  bootOnReady = null;
};

export const startMenuRuntime = (): MenuController | null => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  autoStartSuspended = false;
  cancelDeferredAutoStart();

  if (autoMenuController) {
    autoMenuController.sync();
    return autoMenuController;
  }

  autoMenuController = createMenu();
  return autoMenuController;
};

export const stopMenuRuntime = () => {
  autoStartSuspended = true;
  cancelDeferredAutoStart();
  autoMenuController?.destroy();
  autoMenuController = null;
};

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    bootOnReady = () => {
      bootOnReady = null;
      if (!autoStartSuspended) {
        startMenuRuntime();
      }
    };
    document.addEventListener('DOMContentLoaded', bootOnReady);
  } else {
    startMenuRuntime();
  }
}
