/**
 * DOM-first multi-step wizard runtime for Juice wizard chrome.
 *
 * Markup contract (authors place the shell — this is not a form engine):
 *   [wizard-shell] > [step-tracker] [steps] > [step]
 *                 > [wizard-content] > [step-page] + [step-nav]
 *
 * Pairing (first match wins, then document order):
 *   aria-controls → page id
 *   data-step / name / [step-page="…"] / id
 *
 * KiwiPress templates in this repo do not ship live wizard HTML. The pairing
 * tokens follow wizard.scss: named pages (`[step-page="welcome"]`) and
 * `[wizard-content][data-step="…"]`. Tracker items typically use the same
 * `data-step` / `name` token, or rely on index order.
 *
 * Navigation (honest default — documented here, not a second API):
 *   bare [wizard-shell]     jump to completed + current; no skip ahead
 *   wizard-shell="linear"   prev/next only; tracker clicks do nothing
 *   wizard-shell="free"     jump to any step
 * Programmatic next / prev / goTo always work. Linear / default only
 * constrain tracker clicks. Form validation and provisioning stay in the app.
 *
 * Visible vs hidden pages use native `hidden`. Do not write layout `content=`.
 * Step paint uses [step="pending"|"active"|"completed"] (slice A chrome).
 *
 * A11y is a step indicator + one visible region, not APG Tabs:
 *   aria-current="step" on the active tracker item
 *   [step-page] as role="region" labelled by its step when unlabeled
 */

import { createEventClaim } from '../shared/events.js';
import { escapeId } from '../shared/ids.js';

export type WizardOptions = {
  root?: ParentNode;
  shellSelector?: string;
  trackerSelector?: string;
  stepsSelector?: string;
  stepSelector?: string;
  pageSelector?: string;
  navSelector?: string;
  nextSelector?: string;
  prevSelector?: string;
  completeSelector?: string;
};

export type WizardController = {
  destroy: () => void;
  sync: () => void;
  next: (target?: HTMLElement | null) => void;
  prev: (target?: HTMLElement | null) => void;
  goTo: (step: number | string, target?: HTMLElement | null) => void;
  current: (target?: HTMLElement | null) => number;
};

const DEFAULT_ROOT: ParentNode =
  typeof document !== 'undefined' ? document : ({} as ParentNode);

const DEFAULTS: Required<WizardOptions> = {
  root: DEFAULT_ROOT,
  shellSelector: '[wizard-shell]',
  trackerSelector: '[step-tracker]',
  stepsSelector: '[steps]',
  stepSelector: '[step]',
  pageSelector: '[step-page]',
  navSelector: '[step-nav]',
  nextSelector: '[wizard-next]',
  prevSelector: '[wizard-prev]',
  completeSelector: '[wizard-complete]',
};

const asArray = <T extends Element>(nodes: ArrayLike<T>): T[] =>
  Array.from(nodes);

const STEP_ID_PREFIX = 'juice-wizard-step';
const PAGE_ID_PREFIX = 'juice-wizard-page';

const claimEvent = createEventClaim();

const isNativeInteractive = (element: HTMLElement) => {
  if (element instanceof HTMLButtonElement) return true;
  if (element instanceof HTMLInputElement) {
    return element.type === 'button' || element.type === 'submit';
  }
  if (element instanceof HTMLAnchorElement) return element.hasAttribute('href');
  return false;
};

const slugFromName = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'wizard';

const documentOrder = (left: HTMLElement, right: HTMLElement) => {
  const position = left.compareDocumentPosition(right);
  if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
  if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
  return 0;
};

type WizardNavMode = 'default' | 'linear' | 'free';

const navMode = (shell: HTMLElement): WizardNavMode => {
  const raw = (shell.getAttribute('wizard-shell') || '').trim().toLowerCase();
  if (raw === 'linear') return 'linear';
  if (raw === 'free') return 'free';
  return 'default';
};

const pairingKey = (element: HTMLElement) => {
  const dataStep = element.getAttribute('data-step');
  if (dataStep) return dataStep;
  const name = element.getAttribute('name');
  if (name) return name;
  const page = element.getAttribute('step-page');
  if (page) return page;
  if (element.id) return element.id;
  return null;
};

const keysOf = (element: HTMLElement) => {
  const keys = new Set<string>();
  const dataStep = element.getAttribute('data-step');
  if (dataStep) keys.add(dataStep);
  const name = element.getAttribute('name');
  if (name) keys.add(name);
  const page = element.getAttribute('step-page');
  if (page) keys.add(page);
  if (element.id) keys.add(element.id);
  return keys;
};

const canJumpTo = (mode: WizardNavMode, target: number, current: number) => {
  if (target === current) return true;
  if (mode === 'linear') return false;
  if (mode === 'free') return true;
  return target < current;
};

const isDisabledControl = (element: HTMLElement) => {
  if (
    (element instanceof HTMLButtonElement ||
      element instanceof HTMLInputElement) &&
    element.disabled
  ) {
    return true;
  }
  return element.getAttribute('aria-disabled') === 'true';
};

export const createWizard = (options: WizardOptions = {}): WizardController => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      destroy: () => {},
      sync: () => {},
      next: () => {},
      prev: () => {},
      goTo: () => {},
      current: () => 0,
    };
  }

  const settings = { ...DEFAULTS, ...options };
  const root = settings.root ?? document;
  const rootEvents = root as ParentNode & EventTarget;

  const getShells = () =>
    asArray(root.querySelectorAll<HTMLElement>(settings.shellSelector));

  const resolveShell = (element: HTMLElement | null | undefined) => {
    if (!element) return null;
    const shell = element.closest(settings.shellSelector);
    return shell instanceof HTMLElement ? shell : null;
  };

  const inShell = (element: HTMLElement, shell: HTMLElement) =>
    resolveShell(element) === shell;

  const getSteps = (shell: HTMLElement) => {
    const list = shell.querySelector<HTMLElement>(settings.stepsSelector);
    const tracker = shell.querySelector<HTMLElement>(settings.trackerSelector);
    const scope = list ?? tracker ?? shell;
    const seen = new Set<HTMLElement>();
    const steps: HTMLElement[] = [];

    const consider = (element: Element) => {
      if (!(element instanceof HTMLElement)) return;
      if (!element.matches(settings.stepSelector)) return;
      if (!inShell(element, shell) || seen.has(element)) return;
      if (element.closest(settings.pageSelector)) return;
      seen.add(element);
      steps.push(element);
    };

    asArray(scope.querySelectorAll<HTMLElement>(settings.stepSelector)).forEach(
      consider
    );

    return steps.sort(documentOrder);
  };

  const getPages = (shell: HTMLElement) =>
    asArray(shell.querySelectorAll<HTMLElement>(settings.pageSelector))
      .filter((page) => inShell(page, shell))
      .sort(documentOrder);

  const getNavs = (shell: HTMLElement) =>
    asArray(shell.querySelectorAll<HTMLElement>(settings.navSelector)).filter(
      (nav) => inShell(nav, shell)
    );

  const getMarkedControls = (shell: HTMLElement, selector: string) =>
    asArray(shell.querySelectorAll<HTMLElement>(selector)).filter((control) =>
      inShell(control, shell)
    );

  const navButtons = (nav: HTMLElement) => {
    const seen = new Set<HTMLElement>();
    const buttons: HTMLElement[] = [];

    const consider = (element: Element) => {
      if (!(element instanceof HTMLElement)) return;
      if (seen.has(element)) return;
      if (!nav.contains(element) || !inShell(element, resolveShell(nav) ?? nav)) {
        return;
      }
      seen.add(element);
      buttons.push(element);
    };

    asArray(nav.querySelectorAll<HTMLElement>('button')).forEach(consider);
    asArray(
      nav.querySelectorAll<HTMLElement>(
        `${settings.prevSelector}, ${settings.nextSelector}`
      )
    ).forEach(consider);

    return buttons.sort(documentOrder);
  };

  const getPrevControls = (shell: HTMLElement) => {
    const marked = getMarkedControls(shell, settings.prevSelector);
    if (marked.length > 0) return marked;

    const discovered: HTMLElement[] = [];
    getNavs(shell).forEach((nav) => {
      const buttons = navButtons(nav).filter(
        (button) => !button.matches(settings.nextSelector)
      );
      if (buttons.length >= 2) {
        discovered.push(buttons[0]);
      }
    });
    return discovered;
  };

  const getNextControls = (shell: HTMLElement) => {
    const marked = getMarkedControls(shell, settings.nextSelector);
    if (marked.length > 0) return marked;

    const discovered: HTMLElement[] = [];
    getNavs(shell).forEach((nav) => {
      const buttons = navButtons(nav).filter(
        (button) => !button.matches(settings.prevSelector)
      );
      if (buttons.length >= 2) {
        discovered.push(buttons[buttons.length - 1]);
      } else if (buttons.length === 1) {
        discovered.push(buttons[0]);
      }
    });
    return discovered;
  };

  const getCompleteControls = (shell: HTMLElement) =>
    getMarkedControls(shell, settings.completeSelector);

  const resolvePage = (shell: HTMLElement, step: HTMLElement) => {
    const pages = getPages(shell);
    const steps = getSteps(shell);

    const controls = step.getAttribute('aria-controls');
    if (controls) {
      const byId = shell.querySelector<HTMLElement>(`#${escapeId(controls)}`);
      if (
        byId &&
        byId.matches(settings.pageSelector) &&
        inShell(byId, shell)
      ) {
        return byId;
      }
    }

    const key = pairingKey(step);
    if (key) {
      const match = pages.find((page) => keysOf(page).has(key));
      if (match) return match;
    }

    const index = steps.indexOf(step);
    return index >= 0 ? pages[index] ?? null : null;
  };

  const resolveStep = (shell: HTMLElement, page: HTMLElement) => {
    const steps = getSteps(shell);
    const pages = getPages(shell);

    const match = steps.find((step) => resolvePage(shell, step) === page);
    if (match) return match;

    const index = pages.indexOf(page);
    return index >= 0 ? steps[index] ?? null : null;
  };

  const findIndexByToken = (shell: HTMLElement, token: string) => {
    const steps = getSteps(shell);
    const pages = getPages(shell);

    const stepIndex = steps.findIndex((step) => {
      if (step.id === token) return true;
      return keysOf(step).has(token);
    });
    if (stepIndex >= 0) return stepIndex;

    const pageIndex = pages.findIndex((page) => {
      if (page.id === token) return true;
      return keysOf(page).has(token);
    });
    if (pageIndex >= 0) {
      const step = resolveStep(shell, pages[pageIndex]);
      const mapped = step ? steps.indexOf(step) : pageIndex;
      return mapped >= 0 ? mapped : pageIndex;
    }

    return -1;
  };

  const lastIndex = (shell: HTMLElement) => {
    const count = Math.max(getSteps(shell).length, getPages(shell).length);
    return Math.max(0, count - 1);
  };

  const inferIndex = (shell: HTMLElement) => {
    const steps = getSteps(shell);
    const pages = getPages(shell);

    const activeStep = steps.findIndex(
      (step) => step.getAttribute('step') === 'active'
    );
    if (activeStep >= 0) return activeStep;

    const visiblePage = pages.find((page) => !page.hasAttribute('hidden'));
    if (visiblePage) {
      const step = resolveStep(shell, visiblePage);
      const mapped = step ? steps.indexOf(step) : pages.indexOf(visiblePage);
      if (mapped >= 0) return mapped;
    }

    const content = shell.querySelector<HTMLElement>('[wizard-content]');
    const token =
      shell.getAttribute('data-step') || content?.getAttribute('data-step');
    if (token) {
      const mapped = findIndexByToken(shell, token);
      if (mapped >= 0) return mapped;
    }

    return 0;
  };

  let idCounter = 0;
  const nextId = (prefix: string) => {
    idCounter += 1;
    return `${prefix}-${idCounter}`;
  };

  const namedBase = (shell: HTMLElement) => {
    const name = shell.getAttribute('name');
    return name ? slugFromName(name) : null;
  };

  const ensureListRole = (shell: HTMLElement) => {
    const list = shell.querySelector<HTMLElement>(settings.stepsSelector);
    if (!list || !inShell(list, shell)) return;
    if (list.tagName === 'UL' || list.tagName === 'OL') return;
    if (!list.getAttribute('role')) {
      list.setAttribute('role', 'list');
    }
  };

  const ensurePairAccessibility = (
    shell: HTMLElement,
    step: HTMLElement,
    page: HTMLElement | null,
    index: number,
    jumpable: boolean
  ) => {
    const steps = getSteps(shell);
    const base = namedBase(shell);
    const suffix = steps.length > 1 || getPages(shell).length > 1 ? `-${index + 1}` : '';

    if (!step.id) {
      step.id = base ? `${base}-step${suffix}` : nextId(STEP_ID_PREFIX);
    }

    if (!isNativeInteractive(step)) {
      if (jumpable && step.getAttribute('tabindex') !== '0') {
        step.setAttribute('tabindex', '0');
      }
      if (!jumpable && step.getAttribute('tabindex') === '0') {
        step.removeAttribute('tabindex');
      }
    }

    if (page) {
      if (!page.id) {
        page.id = base ? `${base}-page${suffix}` : nextId(PAGE_ID_PREFIX);
      }

      if (step.getAttribute('aria-controls') !== page.id) {
        step.setAttribute('aria-controls', page.id);
      }

      if (!page.getAttribute('role')) {
        page.setAttribute('role', 'region');
      }

      if (
        !page.hasAttribute('aria-label') &&
        !page.hasAttribute('aria-labelledby')
      ) {
        page.setAttribute('aria-labelledby', step.id);
      }
    }
  };

  const setControlDisabled = (element: HTMLElement, disabled: boolean) => {
    if (
      element instanceof HTMLButtonElement ||
      element instanceof HTMLInputElement
    ) {
      if (element.disabled !== disabled) {
        element.disabled = disabled;
      }
    }

    const value = String(disabled);
    if (element.getAttribute('aria-disabled') !== value) {
      element.setAttribute('aria-disabled', value);
    }
  };

  const setPageVisible = (page: HTMLElement, visible: boolean) => {
    if (page.hidden !== !visible) {
      page.hidden = !visible;
    }

    const ariaHidden = String(!visible);
    if (page.getAttribute('aria-hidden') !== ariaHidden) {
      page.setAttribute('aria-hidden', ariaHidden);
    }
  };

  const applyIndex = (shell: HTMLElement, index: number) => {
    const steps = getSteps(shell);
    const pages = getPages(shell);
    if (steps.length === 0 && pages.length === 0) return;

    const current = Math.min(Math.max(0, index), lastIndex(shell));
    const mode = navMode(shell);

    ensureListRole(shell);

    steps.forEach((step, stepIndex) => {
      const value =
        stepIndex < current
          ? 'completed'
          : stepIndex === current
            ? 'active'
            : 'pending';
      if (step.getAttribute('step') !== value) {
        step.setAttribute('step', value);
      }

      if (stepIndex === current) {
        if (step.getAttribute('aria-current') !== 'step') {
          step.setAttribute('aria-current', 'step');
        }
      } else if (step.hasAttribute('aria-current')) {
        step.removeAttribute('aria-current');
      }

      const jumpable = canJumpTo(mode, stepIndex, current);
      const page = resolvePage(shell, step);
      ensurePairAccessibility(shell, step, page, stepIndex, jumpable);

      if (!jumpable) {
        if (step.getAttribute('aria-disabled') !== 'true') {
          step.setAttribute('aria-disabled', 'true');
        }
      } else if (step.getAttribute('aria-disabled') === 'true') {
        step.removeAttribute('aria-disabled');
      }
    });

    const currentStep = steps[current] ?? null;
    const currentPage = currentStep
      ? resolvePage(shell, currentStep)
      : pages[current] ?? null;

    pages.forEach((page) => {
      const step = resolveStep(shell, page);
      const pageIndex = step ? steps.indexOf(step) : pages.indexOf(page);
      const visible = pageIndex === current;
      setPageVisible(page, visible);

      if (!page.getAttribute('role')) {
        page.setAttribute('role', 'region');
      }
    });

    const content = shell.querySelector<HTMLElement>('[wizard-content]');
    const token =
      (currentPage && pairingKey(currentPage)) ||
      (currentStep && pairingKey(currentStep));
    if (content && token && content.getAttribute('data-step') !== token) {
      content.setAttribute('data-step', token);
    }

    const atFirst = current <= 0;
    const atLast = current >= lastIndex(shell);
    getPrevControls(shell).forEach((control) =>
      setControlDisabled(control, atFirst)
    );
    getNextControls(shell).forEach((control) =>
      setControlDisabled(control, atLast)
    );
    getCompleteControls(shell).forEach((control) =>
      setControlDisabled(control, !atLast)
    );
  };

  const resolveTargetShell = (target?: HTMLElement | null) => {
    if (target) {
      const fromTarget = resolveShell(target);
      if (fromTarget) return fromTarget;
    }
    return getShells()[0] ?? null;
  };

  const current = (target?: HTMLElement | null) => {
    const shell = resolveTargetShell(target);
    if (!shell) return 0;
    return inferIndex(shell);
  };

  const goTo = (step: number | string, target?: HTMLElement | null) => {
    const shell = resolveTargetShell(target);
    if (!shell) return;

    const index =
      typeof step === 'number' ? step : findIndexByToken(shell, step);
    if (index < 0) return;

    applyIndex(shell, index);
  };

  const next = (target?: HTMLElement | null) => {
    const shell = resolveTargetShell(target);
    if (!shell) return;
    applyIndex(shell, inferIndex(shell) + 1);
  };

  const prev = (target?: HTMLElement | null) => {
    const shell = resolveTargetShell(target);
    if (!shell) return;
    applyIndex(shell, inferIndex(shell) - 1);
  };

  const sync = () => {
    getShells().forEach((shell) => {
      applyIndex(shell, inferIndex(shell));
    });
  };

  const resolveStepFromEvent = (target: Element) => {
    if (!(target instanceof HTMLElement)) return null;
    const shell = resolveShell(target);
    if (!shell) return null;
    if (target.closest(settings.pageSelector)) return null;

    const step = target.closest(settings.stepSelector);
    if (!(step instanceof HTMLElement) || !inShell(step, shell)) return null;
    if (step.closest(settings.pageSelector)) return null;
    return getSteps(shell).includes(step) ? step : null;
  };

  const resolveNavAction = (target: Element): 'next' | 'prev' | 'complete' | null => {
    if (!(target instanceof HTMLElement)) return null;
    const shell = resolveShell(target);
    if (!shell) return null;

    const complete = target.closest(settings.completeSelector);
    if (complete instanceof HTMLElement && inShell(complete, shell)) {
      return 'complete';
    }

    const nextControl = target.closest(settings.nextSelector);
    if (nextControl instanceof HTMLElement && inShell(nextControl, shell)) {
      return 'next';
    }

    const prevControl = target.closest(settings.prevSelector);
    if (prevControl instanceof HTMLElement && inShell(prevControl, shell)) {
      return 'prev';
    }

    const nav = target.closest(settings.navSelector);
    if (!(nav instanceof HTMLElement) || !inShell(nav, shell)) return null;

    const control = target.closest('button, [wizard-next], [wizard-prev]');
    if (!(control instanceof HTMLElement) || !nav.contains(control)) return null;

    if (getNextControls(shell).includes(control)) return 'next';
    if (getPrevControls(shell).includes(control)) return 'prev';
    return null;
  };

  const activateStep = (step: HTMLElement) => {
    const shell = resolveShell(step);
    if (!shell) return;

    const steps = getSteps(shell);
    const index = steps.indexOf(step);
    if (index < 0) return;
    if (!canJumpTo(navMode(shell), index, inferIndex(shell))) return;

    applyIndex(shell, index);
  };

  const handleRootClick = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const action = resolveNavAction(target);
    const navControl =
      target instanceof HTMLElement
        ? target.closest(
            `${settings.nextSelector}, ${settings.prevSelector}, ${settings.completeSelector}, button`
          )
        : null;

    if (
      navControl instanceof HTMLElement &&
      isDisabledControl(navControl) &&
      (action === 'next' || action === 'prev' || action === 'complete')
    ) {
      return;
    }

    if (action === 'complete') {
      claimEvent(event);
      return;
    }
    if (action === 'next') {
      if (!claimEvent(event)) return;
      next(target as HTMLElement);
      return;
    }
    if (action === 'prev') {
      if (!claimEvent(event)) return;
      prev(target as HTMLElement);
      return;
    }

    const step = resolveStepFromEvent(target);
    if (!step) return;
    if (!claimEvent(event)) return;
    activateStep(step);
  };

  const handleRootKeydown = (event: Event) => {
    if (!(event instanceof KeyboardEvent)) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;

    const target = event.target;
    if (!(target instanceof Element)) return;

    const action = resolveNavAction(target);
    if (action === 'next' || action === 'prev') {
      const control = target.closest('button, [wizard-next], [wizard-prev]');
      if (control instanceof HTMLElement && isNativeInteractive(control)) {
        return;
      }
      if (!claimEvent(event)) return;
      event.preventDefault();
      if (action === 'next') next(target as HTMLElement);
      else prev(target as HTMLElement);
      return;
    }

    const step = resolveStepFromEvent(target);
    if (!step || isNativeInteractive(step)) return;
    if (!claimEvent(event)) return;
    event.preventDefault();
    activateStep(step);
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
        'step',
        'data-step',
        'aria-controls',
        'wizard-shell',
        'step-page',
        'wizard-next',
        'wizard-prev',
        'wizard-complete',
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
    next,
    prev,
    goTo,
    current,
  };
};

export const initWizard = (options: WizardOptions = {}): WizardController =>
  createWizard(options);

let autoWizardController: WizardController | null = null;
let autoStartSuspended = false;
let bootOnReady: (() => void) | null = null;

const cancelDeferredAutoStart = () => {
  if (!bootOnReady) return;
  document.removeEventListener('DOMContentLoaded', bootOnReady);
  bootOnReady = null;
};

export const startWizardRuntime = (): WizardController | null => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  autoStartSuspended = false;
  cancelDeferredAutoStart();

  if (autoWizardController) {
    autoWizardController.sync();
    return autoWizardController;
  }

  autoWizardController = createWizard();
  return autoWizardController;
};

export const stopWizardRuntime = () => {
  autoStartSuspended = true;
  cancelDeferredAutoStart();
  autoWizardController?.destroy();
  autoWizardController = null;
};

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    bootOnReady = () => {
      bootOnReady = null;
      if (!autoStartSuspended) {
        startWizardRuntime();
      }
    };
    document.addEventListener('DOMContentLoaded', bootOnReady);
  } else {
    startWizardRuntime();
  }
}
