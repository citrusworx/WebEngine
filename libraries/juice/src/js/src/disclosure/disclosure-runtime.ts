/**
 * DOM-first disclosure runtime for Juice disclosure chrome.
 *
 * Markup contract (Slice A — do not rename attrs):
 *   [disclosure]         standalone root. One trigger, one panel.
 *                        Not an accordion and not a stack.
 *   [disclosure-trigger] the button. Expanded state is aria-expanded.
 *   [disclosure-panel]   the controlled region.
 *
 * Pairing: aria-controls inside the root, otherwise the next sibling
 * [disclosure-panel] or the next panel sibling. Orphans outside
 * [disclosure] are ignored. There is no exclusive group and no Sig
 * factory. Accordion markup is not enhanced here.
 *
 * Open/closed state is aria-expanded on the trigger plus native hidden
 * and aria-hidden on the panel. This runtime never writes layout
 * content="active" or content="hidden".
 *
 * Keyboard: click toggles. Enter and Space activate non-button triggers.
 * Escape collapses the focused open disclosure, or the last opened one,
 * and returns focus to that trigger. It yields to an open modal, drawer,
 * or popover (and to an already-handled Escape). There is no global
 * disclosure Escape and no arrow-key roving tabindex.
 *
 * Limitations: exclusive groups, arrow-key roving tabindex, and a Sig
 * Disclosure factory are out of scope. See
 * docs/juice/juice-disclosure-runtime.md.
 */

import { createEventClaim } from '../shared/events.js';
import { escapeId } from '../shared/ids.js';
import { hasOpenDialogOverlay, hasOpenPopover } from '../shared/overlays.js';

export type DisclosureOptions = {
  root?: ParentNode;
  disclosureSelector?: string;
  triggerSelector?: string;
};

export type DisclosureController = {
  destroy: () => void;
  sync: () => void;
  expand: (trigger?: HTMLElement | null) => void;
  collapse: (trigger?: HTMLElement | null) => void;
  toggle: (trigger?: HTMLElement | null) => void;
};

const DEFAULT_ROOT: ParentNode =
  typeof document !== 'undefined' ? document : ({} as ParentNode);

const DEFAULTS: Required<DisclosureOptions> = {
  root: DEFAULT_ROOT,
  disclosureSelector: '[disclosure]',
  triggerSelector: '[disclosure-trigger]',
};

const asArray = <T extends Element>(nodes: NodeListOf<T>): T[] =>
  Array.from(nodes);

const TRIGGER_ID_PREFIX = 'juice-disclosure-trigger';
const PANEL_ID_PREFIX = 'juice-disclosure-panel';
const PANEL_SELECTOR = '[disclosure-panel]';

const isNativeInteractiveTrigger = (element: HTMLElement) => {
  if (element instanceof HTMLButtonElement) return true;
  if (element instanceof HTMLAnchorElement) return element.hasAttribute('href');
  return false;
};

const claimEvent = createEventClaim();

const slugFromName = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'disclosure';

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

const shouldYieldEscape = (event: KeyboardEvent) =>
  event.defaultPrevented || hasOpenDialogOverlay() || hasOpenPopover();

export const createDisclosure = (
  options: DisclosureOptions = {}
): DisclosureController => {
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

  const getDisclosures = () =>
    asArray(root.querySelectorAll<HTMLElement>(settings.disclosureSelector));

  const getTriggers = (disclosure: HTMLElement) =>
    asArray(
      disclosure.querySelectorAll<HTMLElement>(settings.triggerSelector)
    ).filter(
      (trigger) => trigger.closest(settings.disclosureSelector) === disclosure
    );

  const getAllTriggers = () =>
    getDisclosures().flatMap((disclosure) => getTriggers(disclosure));

  let idCounter = 0;
  let lastActiveTrigger: HTMLElement | null = null;

  const nextId = (prefix: string) => {
    idCounter += 1;
    return `${prefix}-${idCounter}`;
  };

  const resolveDisclosure = (trigger: HTMLElement | null | undefined) => {
    if (!trigger) return null;
    const disclosure = trigger.closest(settings.disclosureSelector);
    return disclosure instanceof HTMLElement ? disclosure : null;
  };

  const resolvePanel = (trigger: HTMLElement) => {
    const disclosure = resolveDisclosure(trigger);
    if (!disclosure) return null;

    const controls = trigger.getAttribute('aria-controls');
    if (controls) {
      const byId = disclosure.querySelector<HTMLElement>(
        `#${escapeId(controls)}`
      );
      if (byId && byId !== trigger) return byId;
    }

    let sibling = trigger.nextElementSibling;
    while (sibling) {
      if (
        sibling instanceof HTMLElement &&
        (sibling.matches(PANEL_SELECTOR) ||
          (!sibling.matches(settings.triggerSelector) &&
            !sibling.matches(settings.disclosureSelector)))
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
        resolveDisclosure(trigger)
      ) {
        return trigger;
      }

      const closest = trigger.closest(settings.triggerSelector);
      if (closest instanceof HTMLElement && resolveDisclosure(closest)) {
        return closest;
      }
    }

    return getAllTriggers()[0] ?? null;
  };

  const namedBase = (disclosure: HTMLElement) => {
    const name = disclosure.getAttribute('name');
    return name ? slugFromName(name) : null;
  };

  const ensurePairAccessibility = (
    trigger: HTMLElement,
    panel: HTMLElement | null
  ) => {
    const disclosure = resolveDisclosure(trigger);
    if (!disclosure) return;

    const triggers = getTriggers(disclosure);
    const index = Math.max(0, triggers.indexOf(trigger));
    const base = namedBase(disclosure);
    const suffix = triggers.length > 1 ? `-${index + 1}` : '';

    if (!trigger.id) {
      trigger.id = base
        ? `${base}-trigger${suffix}`
        : nextId(TRIGGER_ID_PREFIX);
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
    getDisclosures().forEach((disclosure) => {
      getTriggers(disclosure).forEach((trigger) => {
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
    if (!(trigger instanceof HTMLElement) || !resolveDisclosure(trigger)) {
      return;
    }

    if (!claimEvent(event)) return;
    toggle(trigger);
  };

  const findOpenTriggerFromEvent = (target: Element) => {
    const focusedTrigger = target.closest(settings.triggerSelector);
    if (
      focusedTrigger instanceof HTMLElement &&
      resolveDisclosure(focusedTrigger)
    ) {
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
      resolveDisclosure(lastActiveTrigger) &&
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
      if (shouldYieldEscape(event)) return;

      const openTrigger = findOpenTriggerFromEvent(target);
      if (!openTrigger || !claimEvent(event)) return;

      event.preventDefault();
      collapse(openTrigger);
      openTrigger.focus();
      return;
    }

    if (event.key !== 'Enter' && event.key !== ' ') return;

    const trigger = target.closest(settings.triggerSelector);
    if (
      !(trigger instanceof HTMLElement) ||
      !resolveDisclosure(trigger) ||
      isNativeInteractiveTrigger(trigger)
    ) {
      return;
    }

    if (!claimEvent(event)) return;
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
        'disclosure',
        'disclosure-trigger',
        'disclosure-panel',
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

export const initDisclosure = (
  options: DisclosureOptions = {}
): DisclosureController => createDisclosure(options);

let autoDisclosureController: DisclosureController | null = null;
let autoStartSuspended = false;
let bootOnReady: (() => void) | null = null;

const cancelDeferredAutoStart = () => {
  if (!bootOnReady || typeof document === 'undefined') return;
  document.removeEventListener('DOMContentLoaded', bootOnReady);
  bootOnReady = null;
};

export const startDisclosureRuntime = (): DisclosureController | null => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  autoStartSuspended = false;
  cancelDeferredAutoStart();

  if (autoDisclosureController) {
    autoDisclosureController.sync();
    return autoDisclosureController;
  }

  autoDisclosureController = createDisclosure();
  return autoDisclosureController;
};

export const stopDisclosureRuntime = () => {
  autoStartSuspended = true;
  cancelDeferredAutoStart();
  autoDisclosureController?.destroy();
  autoDisclosureController = null;
};

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    bootOnReady = () => {
      bootOnReady = null;
      if (!autoStartSuspended) {
        startDisclosureRuntime();
      }
    };
    document.addEventListener('DOMContentLoaded', bootOnReady);
  } else {
    startDisclosureRuntime();
  }
}
