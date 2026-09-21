import { createEventClaim } from '../shared/events.js';
import { escapeId } from '../shared/ids.js';

export type TabsOptions = {
  root?: ParentNode;
  tabsSelector?: string;
  listSelector?: string;
  triggerSelector?: string;
  panelSelector?: string;
};

export type TabsController = {
  destroy: () => void;
  sync: () => void;
  select: (trigger?: HTMLElement | null) => void;
};

const DEFAULT_ROOT: ParentNode =
  typeof document !== 'undefined' ? document : ({} as ParentNode);

const DEFAULTS: Required<TabsOptions> = {
  root: DEFAULT_ROOT,
  tabsSelector: '[tabs]',
  listSelector: '[tabs-list]',
  triggerSelector: '[tab]',
  panelSelector: '[tab-panel]',
};

const asArray = <T extends Element>(nodes: ArrayLike<T>): T[] =>
  Array.from(nodes);

const TRIGGER_ID_PREFIX = 'juice-tabs-trigger';
const PANEL_ID_PREFIX = 'juice-tabs-panel';

const claimEvent = createEventClaim();

const isNativeInteractiveTrigger = (element: HTMLElement) => {
  if (element instanceof HTMLButtonElement) return true;
  if (element instanceof HTMLAnchorElement) return element.hasAttribute('href');
  return false;
};

const slugFromName = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'tabs';

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  if (target instanceof HTMLInputElement) return true;
  if (target instanceof HTMLTextAreaElement) return true;
  if (target instanceof HTMLSelectElement) return true;
  return target.isContentEditable;
};

export const createTabs = (options: TabsOptions = {}): TabsController => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      destroy: () => {},
      sync: () => {},
      select: () => {},
    };
  }

  const settings = { ...DEFAULTS, ...options };
  const root = settings.root ?? document;
  const rootEvents = root as ParentNode & EventTarget;

  const getTabRoots = () =>
    asArray(root.querySelectorAll<HTMLElement>(settings.tabsSelector));

  const getList = (tabs: HTMLElement) => {
    const list = tabs.querySelector<HTMLElement>(`:scope > ${settings.listSelector}`);
    return list instanceof HTMLElement ? list : null;
  };

  const resolveTabs = (element: HTMLElement | null | undefined) => {
    if (!element) return null;
    const tabs = element.closest(settings.tabsSelector);
    return tabs instanceof HTMLElement ? tabs : null;
  };

  const isInsidePanel = (element: HTMLElement) => {
    const panel = element.closest(settings.panelSelector);
    if (!(panel instanceof HTMLElement)) return false;
    const tabs = resolveTabs(element);
    return Boolean(tabs && tabs.contains(panel));
  };

  const isTriggerInRoot = (element: HTMLElement, tabs: HTMLElement) => {
    if (resolveTabs(element) !== tabs) return false;
    if (isInsidePanel(element)) return false;

    const list = getList(tabs);
    const scope = list ?? tabs;
    const marked =
      element.matches(settings.triggerSelector) ||
      element.getAttribute('role') === 'tab';

    if (marked) {
      return scope.contains(element);
    }

    return element.tagName === 'BUTTON' && element.parentElement === scope;
  };

  const getTriggers = (tabs: HTMLElement) => {
    const list = getList(tabs);
    const scope = list ?? tabs;
    const seen = new Set<HTMLElement>();
    const triggers: HTMLElement[] = [];

    const consider = (element: Element) => {
      if (!(element instanceof HTMLElement)) return;
      if (!isTriggerInRoot(element, tabs) || seen.has(element)) return;
      seen.add(element);
      triggers.push(element);
    };

    asArray(scope.children).forEach(consider);
    asArray(scope.querySelectorAll<HTMLElement>(settings.triggerSelector)).forEach(
      consider
    );
    asArray(scope.querySelectorAll<HTMLElement>('[role="tab"]')).forEach(consider);

    return triggers.sort((left, right) => {
      const position = left.compareDocumentPosition(right);
      if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
      if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
      return 0;
    });
  };

  const getPanels = (tabs: HTMLElement) =>
    asArray(tabs.querySelectorAll<HTMLElement>(settings.panelSelector)).filter(
      (panel) => resolveTabs(panel) === tabs
    );

  const getAllTriggers = () => getTabRoots().flatMap((tabs) => getTriggers(tabs));

  let idCounter = 0;

  const nextId = (prefix: string) => {
    idCounter += 1;
    return `${prefix}-${idCounter}`;
  };

  const resolvePanel = (trigger: HTMLElement) => {
    const tabs = resolveTabs(trigger);
    if (!tabs) return null;

    const controls = trigger.getAttribute('aria-controls');
    if (controls) {
      const byId = tabs.querySelector<HTMLElement>(`#${escapeId(controls)}`);
      if (byId && byId.matches(settings.panelSelector) && resolveTabs(byId) === tabs) {
        return byId;
      }
    }

    const triggers = getTriggers(tabs);
    const panels = getPanels(tabs);
    const index = triggers.indexOf(trigger);
    if (index >= 0 && panels[index]) {
      return panels[index];
    }

    let sibling = trigger.nextElementSibling;
    while (sibling) {
      if (
        sibling instanceof HTMLElement &&
        sibling.matches(settings.panelSelector) &&
        resolveTabs(sibling) === tabs
      ) {
        return sibling;
      }
      if (sibling instanceof HTMLElement && isTriggerInRoot(sibling, tabs)) {
        break;
      }
      sibling = sibling.nextElementSibling;
    }

    return null;
  };

  const resolveTrigger = (trigger?: HTMLElement | null) => {
    if (trigger) {
      const tabs = resolveTabs(trigger);
      if (tabs && isTriggerInRoot(trigger, tabs)) {
        return trigger;
      }

      const closestMarked = trigger.closest(settings.triggerSelector);
      if (closestMarked instanceof HTMLElement) {
        const closestTabs = resolveTabs(closestMarked);
        if (closestTabs && isTriggerInRoot(closestMarked, closestTabs)) {
          return closestMarked;
        }
      }
    }

    return getAllTriggers()[0] ?? null;
  };

  const namedBase = (tabs: HTMLElement) => {
    const name = tabs.getAttribute('name');
    return name ? slugFromName(name) : null;
  };

  const ensureTablist = (tabs: HTMLElement) => {
    const list = getList(tabs);
    const panels = getPanels(tabs);
    const tablist = list ?? (panels.length === 0 ? tabs : null);
    if (!tablist) return;

    if (tablist.getAttribute('role') !== 'tablist') {
      tablist.setAttribute('role', 'tablist');
    }

    const name = tabs.getAttribute('name');
    if (
      name &&
      !tablist.hasAttribute('aria-label') &&
      !tablist.hasAttribute('aria-labelledby')
    ) {
      tablist.setAttribute('aria-label', name);
    }
  };

  const ensurePairAccessibility = (
    trigger: HTMLElement,
    panel: HTMLElement | null
  ) => {
    const tabs = resolveTabs(trigger);
    if (!tabs) return;

    ensureTablist(tabs);

    const triggers = getTriggers(tabs);
    const index = Math.max(0, triggers.indexOf(trigger));
    const base = namedBase(tabs);
    const suffix = triggers.length > 1 ? `-${index + 1}` : '';

    if (!trigger.id) {
      trigger.id = base ? `${base}-tab${suffix}` : nextId(TRIGGER_ID_PREFIX);
    }

    if (trigger.getAttribute('role') !== 'tab') {
      trigger.setAttribute('role', 'tab');
    }

    if (!isNativeInteractiveTrigger(trigger) && !trigger.hasAttribute('tabindex')) {
      trigger.setAttribute('tabindex', '-1');
    }

    if (!panel) return;

    if (!panel.id) {
      panel.id = base ? `${base}-panel${suffix}` : nextId(PANEL_ID_PREFIX);
    }

    if (trigger.getAttribute('aria-controls') !== panel.id) {
      trigger.setAttribute('aria-controls', panel.id);
    }

    if (panel.getAttribute('role') !== 'tabpanel') {
      panel.setAttribute('role', 'tabpanel');
    }

    if (panel.getAttribute('aria-labelledby') !== trigger.id) {
      panel.setAttribute('aria-labelledby', trigger.id);
    }
  };

  const isSelected = (trigger: HTMLElement) =>
    trigger.hasAttribute('active') || trigger.getAttribute('aria-selected') === 'true';

  const setSelectedState = (
    trigger: HTMLElement,
    panel: HTMLElement | null,
    selected: boolean
  ) => {
    if (selected) {
      if (!trigger.hasAttribute('active')) {
        trigger.setAttribute('active', '');
      }
    } else if (trigger.hasAttribute('active')) {
      trigger.removeAttribute('active');
    }

    const selectedValue = String(selected);
    if (trigger.getAttribute('aria-selected') !== selectedValue) {
      trigger.setAttribute('aria-selected', selectedValue);
    }

    const tabindex = selected ? '0' : '-1';
    if (trigger.getAttribute('tabindex') !== tabindex) {
      trigger.setAttribute('tabindex', tabindex);
    }

    if (!panel) return;

    if (panel.hidden !== !selected) {
      panel.hidden = !selected;
    }

    const ariaHidden = String(!selected);
    if (panel.getAttribute('aria-hidden') !== ariaHidden) {
      panel.setAttribute('aria-hidden', ariaHidden);
    }

    if (selected) {
      if (panel.getAttribute('tabindex') !== '0') {
        panel.setAttribute('tabindex', '0');
      }
    } else if (panel.hasAttribute('tabindex')) {
      panel.removeAttribute('tabindex');
    }
  };

  const applyExclusiveSelection = (tabs: HTMLElement, selectedTrigger: HTMLElement) => {
    const triggers = getTriggers(tabs);
    const panels = getPanels(tabs);
    const selectedPanel = resolvePanel(selectedTrigger);

    triggers.forEach((trigger) => {
      const panel = resolvePanel(trigger);
      ensurePairAccessibility(trigger, panel);
      setSelectedState(trigger, panel, trigger === selectedTrigger);
    });

    panels.forEach((panel) => {
      if (panel === selectedPanel) return;
      if (!panel.hidden) {
        panel.hidden = true;
      }
      if (panel.getAttribute('aria-hidden') !== 'true') {
        panel.setAttribute('aria-hidden', 'true');
      }
      if (panel.hasAttribute('tabindex')) {
        panel.removeAttribute('tabindex');
      }
    });
  };

  const select = (trigger?: HTMLElement | null) => {
    const resolved = resolveTrigger(trigger);
    if (!resolved) return;

    const tabs = resolveTabs(resolved);
    if (!tabs) return;

    applyExclusiveSelection(tabs, resolved);
  };

  const pickSelectedTrigger = (tabs: HTMLElement) => {
    const triggers = getTriggers(tabs);
    if (triggers.length === 0) return null;
    return triggers.find((trigger) => isSelected(trigger)) ?? triggers[0];
  };

  const sync = () => {
    getTabRoots().forEach((tabs) => {
      const triggers = getTriggers(tabs);
      if (triggers.length === 0) {
        ensureTablist(tabs);
        return;
      }

      const selected = pickSelectedTrigger(tabs);
      if (!selected) return;
      applyExclusiveSelection(tabs, selected);
    });
  };

  const resolveTriggerFromEvent = (target: Element) => {
    if (!(target instanceof HTMLElement)) return null;
    const tabs = resolveTabs(target);
    if (!tabs) return null;

    if (isTriggerInRoot(target, tabs)) {
      return target;
    }

    const closest = target.closest(
      `${settings.triggerSelector}, [role="tab"], ${settings.tabsSelector} > button, ${settings.listSelector} > button`
    );
    if (!(closest instanceof HTMLElement)) return null;
    return isTriggerInRoot(closest, tabs) ? closest : null;
  };

  const handleRootClick = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const trigger = resolveTriggerFromEvent(target);
    if (!trigger) return;
    if (!claimEvent(event)) return;
    select(trigger);
  };

  const moveSelection = (trigger: HTMLElement, nextIndex: (index: number, length: number) => number) => {
    const tabs = resolveTabs(trigger);
    if (!tabs) return;

    const triggers = getTriggers(tabs);
    if (triggers.length === 0) return;

    const currentIndex = Math.max(0, triggers.indexOf(trigger));
    const next = triggers[nextIndex(currentIndex, triggers.length)];
    if (!next) return;

    select(next);
    next.focus();
  };

  const handleRootKeydown = (event: Event) => {
    if (!(event instanceof KeyboardEvent)) return;
    const target = event.target;
    if (!(target instanceof Element) || isEditableTarget(target)) return;

    const trigger = resolveTriggerFromEvent(target);
    if (!trigger) return;

    if (event.key === 'Escape' || event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      return;
    }

    if (event.key === 'ArrowRight') {
      if (!claimEvent(event)) return;
      event.preventDefault();
      moveSelection(trigger, (index, length) => (index + 1) % length);
      return;
    }

    if (event.key === 'ArrowLeft') {
      if (!claimEvent(event)) return;
      event.preventDefault();
      moveSelection(trigger, (index, length) => (index - 1 + length) % length);
      return;
    }

    if (event.key === 'Home') {
      if (!claimEvent(event)) return;
      event.preventDefault();
      moveSelection(trigger, () => 0);
      return;
    }

    if (event.key === 'End') {
      if (!claimEvent(event)) return;
      event.preventDefault();
      moveSelection(trigger, (_index, length) => length - 1);
      return;
    }

    if (event.key !== 'Enter' && event.key !== ' ') return;
    if (isNativeInteractiveTrigger(trigger)) return;
    if (!claimEvent(event)) return;
    event.preventDefault();
    select(trigger);
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
        'active',
        'aria-selected',
        'aria-controls',
        'tabs',
        'tabs-list',
        'tab',
        'tab-panel',
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
    select,
  };
};

export const initTabs = (options: TabsOptions = {}): TabsController =>
  createTabs(options);

let autoTabsController: TabsController | null = null;
let autoStartSuspended = false;
let bootOnReady: (() => void) | null = null;

const cancelDeferredAutoStart = () => {
  if (!bootOnReady) return;
  document.removeEventListener('DOMContentLoaded', bootOnReady);
  bootOnReady = null;
};

export const startTabsRuntime = (): TabsController | null => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  autoStartSuspended = false;
  cancelDeferredAutoStart();

  if (autoTabsController) {
    autoTabsController.sync();
    return autoTabsController;
  }

  autoTabsController = createTabs();
  return autoTabsController;
};

export const stopTabsRuntime = () => {
  autoStartSuspended = true;
  cancelDeferredAutoStart();
  autoTabsController?.destroy();
  autoTabsController = null;
};

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    bootOnReady = () => {
      bootOnReady = null;
      if (!autoStartSuspended) {
        startTabsRuntime();
      }
    };
    document.addEventListener('DOMContentLoaded', bootOnReady);
  } else {
    startTabsRuntime();
  }
}
