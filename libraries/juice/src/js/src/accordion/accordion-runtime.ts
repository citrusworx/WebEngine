export type AccordionOptions = {
  root?: ParentNode;
  accordionSelector?: string;
  triggerSelector?: string;
};

export type AccordionController = {
  destroy: () => void;
  sync: () => void;
  expand: (trigger?: HTMLElement | null) => void;
  collapse: (trigger?: HTMLElement | null) => void;
  toggle: (trigger?: HTMLElement | null) => void;
};

const DEFAULT_ROOT: ParentNode =
  typeof document !== 'undefined' ? document : ({} as ParentNode);

const DEFAULTS: Required<AccordionOptions> = {
  root: DEFAULT_ROOT,
  accordionSelector: '[accordion]',
  triggerSelector: '[accordion-item]',
};

const asArray = <T extends Element>(nodes: NodeListOf<T>): T[] =>
  Array.from(nodes);

const TRIGGER_ID_PREFIX = 'juice-accordion-trigger';
const PANEL_ID_PREFIX = 'juice-accordion-panel';

const isNativeInteractiveTrigger = (element: HTMLElement) =>
  element instanceof HTMLButtonElement ||
  element instanceof HTMLAnchorElement;

const slugFromName = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'accordion';

const setExpandedState = (
  trigger: HTMLElement,
  panel: HTMLElement | null,
  expanded: boolean
) => {
  const expandedValue = String(expanded);
  if (trigger.getAttribute('aria-expanded') !== expandedValue) {
    trigger.setAttribute('aria-expanded', expandedValue);
  }

  if (!panel) return;

  if (panel.hidden !== !expanded) {
    panel.hidden = !expanded;
  }

  const ariaHidden = String(!expanded);
  if (panel.getAttribute('aria-hidden') !== ariaHidden) {
    panel.setAttribute('aria-hidden', ariaHidden);
  }
};

const isExpanded = (trigger: HTMLElement, panel: HTMLElement | null) => {
  if (panel) return !panel.hasAttribute('hidden');
  return trigger.getAttribute('aria-expanded') === 'true';
};

export const createAccordion = (
  options: AccordionOptions = {}
): AccordionController => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      destroy: () => {},
      sync: () => {},
      expand: () => {},
      collapse: () => {},
      toggle: () => {},
    };
  }

  const settings = { ...DEFAULTS, ...options };
  const root = settings.root ?? document;
  const rootEvents = root as ParentNode & EventTarget;

  const getAccordions = () =>
    asArray(root.querySelectorAll<HTMLElement>(settings.accordionSelector));

  const getTriggers = (accordion: HTMLElement) =>
    asArray(
      accordion.querySelectorAll<HTMLElement>(settings.triggerSelector)
    ).filter((trigger) => trigger.closest(settings.accordionSelector) === accordion);

  const getAllTriggers = () => getAccordions().flatMap((accordion) => getTriggers(accordion));

  let idCounter = 0;
  let lastActiveTrigger: HTMLElement | null = null;

  const nextId = (prefix: string) => {
    idCounter += 1;
    return `${prefix}-${idCounter}`;
  };

  const resolveAccordion = (trigger: HTMLElement | null | undefined) => {
    if (!trigger) return null;
    const accordion = trigger.closest(settings.accordionSelector);
    return accordion instanceof HTMLElement ? accordion : null;
  };

  const resolvePanel = (trigger: HTMLElement) => {
    const accordion = resolveAccordion(trigger);
    if (!accordion) return null;

    const controls = trigger.getAttribute('aria-controls');
    if (controls) {
      const escaped =
        typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
          ? CSS.escape(controls)
          : controls;
      const byId = accordion.querySelector<HTMLElement>(`#${escaped}`);
      if (byId) return byId;
    }

    let sibling = trigger.nextElementSibling;
    while (sibling) {
      if (
        sibling instanceof HTMLElement &&
        !sibling.matches(settings.triggerSelector) &&
        !sibling.matches(settings.accordionSelector)
      ) {
        return sibling;
      }
      sibling = sibling.nextElementSibling;
    }

    return null;
  };

  const resolveTrigger = (trigger?: HTMLElement | null) => {
    if (trigger) {
      if (
        trigger.matches(settings.triggerSelector) &&
        resolveAccordion(trigger)
      ) {
        return trigger;
      }

      const closest = trigger.closest(settings.triggerSelector);
      if (closest instanceof HTMLElement && resolveAccordion(closest)) {
        return closest;
      }
    }

    return getAllTriggers()[0] ?? null;
  };

  const namedBase = (accordion: HTMLElement) => {
    const name = accordion.getAttribute('name');
    return name ? slugFromName(name) : null;
  };

  const ensurePairAccessibility = (
    trigger: HTMLElement,
    panel: HTMLElement | null
  ) => {
    const accordion = resolveAccordion(trigger);
    if (!accordion) return;

    const triggers = getTriggers(accordion);
    const index = Math.max(0, triggers.indexOf(trigger));
    const base = namedBase(accordion);
    const suffix = triggers.length > 1 ? `-${index + 1}` : '';

    if (!trigger.id) {
      trigger.id = base ? `${base}-trigger${suffix}` : nextId(TRIGGER_ID_PREFIX);
    }

    if (!isNativeInteractiveTrigger(trigger)) {
      trigger.setAttribute('role', 'button');
      if (!trigger.hasAttribute('tabindex')) {
        trigger.setAttribute('tabindex', '0');
      }
    }

    if (!panel) return;

    if (!panel.id) {
      panel.id = base ? `${base}-panel${suffix}` : nextId(PANEL_ID_PREFIX);
    }

    if (trigger.getAttribute('aria-controls') !== panel.id) {
      trigger.setAttribute('aria-controls', panel.id);
    }

    if (panel.getAttribute('role') !== 'region') {
      panel.setAttribute('role', 'region');
    }

    if (panel.getAttribute('aria-labelledby') !== trigger.id) {
      panel.setAttribute('aria-labelledby', trigger.id);
    }
  };

  const expand = (trigger?: HTMLElement | null) => {
    const resolved = resolveTrigger(trigger);
    if (!resolved) return;

    const panel = resolvePanel(resolved);
    ensurePairAccessibility(resolved, panel);
    setExpandedState(resolved, panel, true);
    lastActiveTrigger = resolved;
  };

  const collapse = (trigger?: HTMLElement | null) => {
    const resolved = resolveTrigger(trigger);
    if (!resolved) return;

    const panel = resolvePanel(resolved);
    ensurePairAccessibility(resolved, panel);
    setExpandedState(resolved, panel, false);

    if (resolved === lastActiveTrigger) {
      lastActiveTrigger =
        getAllTriggers().find(
          (item) => item !== resolved && isExpanded(item, resolvePanel(item))
        ) ?? null;
    }
  };

  const toggle = (trigger?: HTMLElement | null) => {
    const resolved = resolveTrigger(trigger);
    if (!resolved) return;

    const panel = resolvePanel(resolved);
    if (isExpanded(resolved, panel)) {
      collapse(resolved);
      return;
    }

    expand(resolved);
  };

  const sync = () => {
    getAccordions().forEach((accordion) => {
      getTriggers(accordion).forEach((trigger) => {
        const panel = resolvePanel(trigger);
        ensurePairAccessibility(trigger, panel);

        if (panel) {
          setExpandedState(trigger, panel, isExpanded(trigger, panel));
          return;
        }

        if (!trigger.hasAttribute('aria-expanded')) {
          trigger.setAttribute('aria-expanded', 'false');
        }
      });
    });
  };

  const handleRootClick = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const trigger = target.closest(settings.triggerSelector);
    if (!(trigger instanceof HTMLElement) || !resolveAccordion(trigger)) {
      return;
    }

    toggle(trigger);
  };

  const findOpenTriggerFromEvent = (target: Element) => {
    const focusedTrigger = target.closest(settings.triggerSelector);
    if (focusedTrigger instanceof HTMLElement && resolveAccordion(focusedTrigger)) {
      const panel = resolvePanel(focusedTrigger);
      if (isExpanded(focusedTrigger, panel)) return focusedTrigger;
    }

    const openTriggers = getAllTriggers().filter((trigger) =>
      isExpanded(trigger, resolvePanel(trigger))
    );

    const containing = openTriggers.find((trigger) => {
      const panel = resolvePanel(trigger);
      return panel?.contains(target);
    });
    if (containing) return containing;

    if (
      lastActiveTrigger &&
      resolveAccordion(lastActiveTrigger) &&
      isExpanded(lastActiveTrigger, resolvePanel(lastActiveTrigger))
    ) {
      return lastActiveTrigger;
    }

    return null;
  };

  const handleRootKeydown = (event: Event) => {
    if (!(event instanceof KeyboardEvent)) return;
    const target = event.target;
    if (!(target instanceof Element)) return;

    if (event.key === 'Escape') {
      const openTrigger = findOpenTriggerFromEvent(target);
      if (!openTrigger) return;

      event.preventDefault();
      collapse(openTrigger);
      openTrigger.focus();
      return;
    }

    if (event.key !== 'Enter' && event.key !== ' ') return;

    const trigger = target.closest(settings.triggerSelector);
    if (
      !(trigger instanceof HTMLElement) ||
      !resolveAccordion(trigger) ||
      isNativeInteractiveTrigger(trigger)
    ) {
      return;
    }

    event.preventDefault();
    toggle(trigger);
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
        'aria-expanded',
        'aria-controls',
        'accordion',
        'accordion-item',
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
    expand,
    collapse,
    toggle,
  };
};

export const initAccordion = (
  options: AccordionOptions = {}
): AccordionController => createAccordion(options);

let autoAccordionController: AccordionController | null = null;

export const startAccordionRuntime = (): AccordionController | null => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  if (autoAccordionController) {
    autoAccordionController.sync();
    return autoAccordionController;
  }

  autoAccordionController = createAccordion();
  return autoAccordionController;
};

export const stopAccordionRuntime = () => {
  autoAccordionController?.destroy();
  autoAccordionController = null;
};

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      startAccordionRuntime();
    });
  } else {
    startAccordionRuntime();
  }
}
