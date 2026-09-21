/**
 * DOM-first APG Progressbar runtime for Juice progress chrome.
 *
 * Markup contract (Slice A — do not rename attrs):
 *   [progress]       track host. Boolean (determinate) or
 *                    progress="indeterminate". Any other value is
 *                    determinate chrome; sync does not rewrite it.
 *                    Authors write <div progress>, not <progress>.
 *                    A native <progress> without the attribute is
 *                    ignored. Native value / max are not the value hook.
 *   [progress-fill]  filled portion. Optional for the runtime.
 *   [progress-label] optional visible value / status text. Authors own
 *                    the accessible name. The label is not copied into
 *                    aria-label, aria-labelledby, or aria-valuetext.
 *
 * Sync (markup-driven):
 *   1. role="progressbar" on the host. An author role that is not
 *      progressbar is replaced. The host is not made focusable
 *      (no tabindex). There is no keyboard and no pointer handler.
 *   2. Determinate: aria-valuemin (default 0), aria-valuemax (default
 *      100), and aria-valuenow. A missing or non-numeric valuenow is
 *      min, which is an empty bar (ratio 0), not indeterminate.
 *      Values clamp to min/max. A max below min collapses to min.
 *   3. The host inline custom property --juice-progress-ratio
 *      (unitless 0–1) stays in sync for every range, including ranges
 *      the 0–100 chrome selectors do not cover.
 *   4. Indeterminate is progress="indeterminate" only. That flag wins.
 *      APG omits aria-valuenow while indeterminate; min/max stay.
 *      The last determinate value is remembered and restored when the
 *      flag clears. CSS owns the sliding fill.
 *   5. aria-valuetext is never invented and never rewritten.
 *
 * Not a slider, not a spinner, and not a layered overlay: no focus
 * trap, no Escape, no Sig Progress factory.
 */

export type ProgressOptions = {
  root?: ParentNode;
  progressSelector?: string;
};

export type ProgressController = {
  destroy: () => void;
  sync: () => void;
  setValue: (value: number, target?: HTMLElement | null) => void;
  getValue: (target?: HTMLElement | null) => number;
  setIndeterminate: (
    indeterminate: boolean,
    target?: HTMLElement | null
  ) => void;
  isIndeterminate: (target?: HTMLElement | null) => boolean;
};

type ProgressRecord = {
  value: number | null;
  hidValueNow: boolean;
};

const DEFAULT_ROOT: ParentNode =
  typeof document !== 'undefined' ? document : ({} as ParentNode);

const DEFAULTS: Required<ProgressOptions> = {
  root: DEFAULT_ROOT,
  progressSelector: '[progress]',
};

const asArray = <T extends Element>(nodes: ArrayLike<T>): T[] =>
  Array.from(nodes);

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const formatNumber = (value: number) => {
  if (!Number.isFinite(value) || Object.is(value, -0)) return '0';
  const rounded = Math.round(value * 1e6) / 1e6;
  return String(rounded);
};

const readFiniteAttr = (element: HTMLElement, name: string) => {
  const raw = element.getAttribute(name);
  if (raw == null) return null;
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
};

const ratioFor = (value: number, min: number, max: number) => {
  if (max === min) return 0;
  return clamp((value - min) / (max - min), 0, 1);
};

const records = new WeakMap<HTMLElement, ProgressRecord>();

const recordFor = (host: HTMLElement) => {
  let record = records.get(host);
  if (!record) {
    record = { value: null, hidValueNow: false };
    records.set(host, record);
  }
  return record;
};

const readRange = (host: HTMLElement) => {
  const min = readFiniteAttr(host, 'aria-valuemin') ?? 0;
  const rawMax = readFiniteAttr(host, 'aria-valuemax') ?? 100;
  const max = rawMax < min ? min : rawMax;
  return { min, max };
};

const isIndeterminateHost = (host: HTMLElement) =>
  host.getAttribute('progress') === 'indeterminate';

const resolveValue = (host: HTMLElement, override?: number) => {
  const { min, max } = readRange(host);
  const record = recordFor(host);
  const explicit = readFiniteAttr(host, 'aria-valuenow');
  let value: number;

  if (override != null && Number.isFinite(override)) {
    value = clamp(override, min, max);
  } else if (explicit != null) {
    value = clamp(explicit, min, max);
  } else if (record.hidValueNow && record.value != null) {
    value = clamp(record.value, min, max);
  } else {
    value = min;
  }

  return { min, max, value };
};

const noopController = (): ProgressController => ({
  destroy: () => {},
  sync: () => {},
  setValue: () => {},
  getValue: () => 0,
  setIndeterminate: () => {},
  isIndeterminate: () => false,
});

export const createProgress = (
  options: ProgressOptions = {}
): ProgressController => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return noopController();
  }

  const settings = { ...DEFAULTS, ...options };
  const root = settings.root ?? document;
  let destroyed = false;

  const isManagedProgress = (element: HTMLElement | null | undefined) => {
    if (!element?.matches(settings.progressSelector)) return false;
    if (root instanceof Document) return true;
    if (root instanceof Node) return root === element || root.contains(element);
    return false;
  };

  const getProgresses = () => {
    const found = asArray(
      root.querySelectorAll<HTMLElement>(settings.progressSelector)
    ).filter(isManagedProgress);

    if (root instanceof HTMLElement && isManagedProgress(root)) {
      return [root, ...found.filter((host) => host !== root)];
    }

    return found;
  };

  const resolveContainingProgress = (
    element: HTMLElement | null | undefined
  ) => {
    if (!element) return null;
    const host = element.closest(settings.progressSelector);
    if (!(host instanceof HTMLElement) || !isManagedProgress(host)) return null;
    return host;
  };

  const resolveProgress = (target?: HTMLElement | null) => {
    if (target) {
      if (isManagedProgress(target)) return target;
      const containing = resolveContainingProgress(target);
      if (containing) return containing;
    }

    return getProgresses().find((host) => isManagedProgress(host)) ?? null;
  };

  const writeHost = (host: HTMLElement, override?: number) => {
    const indeterminate = isIndeterminateHost(host);
    const { min, max, value } = resolveValue(host, override);
    const record = recordFor(host);
    record.value = value;
    record.hidValueNow = indeterminate;

    if (host.getAttribute('role') !== 'progressbar') {
      host.setAttribute('role', 'progressbar');
    }

    const minValue = formatNumber(min);
    const maxValue = formatNumber(max);
    const nowValue = formatNumber(value);

    if (host.getAttribute('aria-valuemin') !== minValue) {
      host.setAttribute('aria-valuemin', minValue);
    }
    if (host.getAttribute('aria-valuemax') !== maxValue) {
      host.setAttribute('aria-valuemax', maxValue);
    }

    if (indeterminate) {
      if (host.hasAttribute('aria-valuenow')) {
        host.removeAttribute('aria-valuenow');
      }
    } else if (host.getAttribute('aria-valuenow') !== nowValue) {
      host.setAttribute('aria-valuenow', nowValue);
    }

    const ratio = formatNumber(ratioFor(value, min, max));
    if (host.style.getPropertyValue('--juice-progress-ratio').trim() !== ratio) {
      host.style.setProperty('--juice-progress-ratio', ratio);
    }
  };

  const sync = () => {
    if (destroyed) return;

    getProgresses().forEach((host) => {
      if (!isManagedProgress(host)) return;
      writeHost(host);
    });
  };

  const setValue = (value: number, target?: HTMLElement | null) => {
    if (!Number.isFinite(value)) return;
    const host = resolveProgress(target);
    if (!host) return;
    writeHost(host, value);
  };

  const getValue = (target?: HTMLElement | null) => {
    const host = resolveProgress(target);
    if (!host) return 0;
    return resolveValue(host).value;
  };

  const setIndeterminate = (
    indeterminate: boolean,
    target?: HTMLElement | null
  ) => {
    const host = resolveProgress(target);
    if (!host) return;

    if (indeterminate) {
      if (host.getAttribute('progress') !== 'indeterminate') {
        host.setAttribute('progress', 'indeterminate');
      }
    } else if (host.getAttribute('progress') !== '') {
      host.setAttribute('progress', '');
    }

    writeHost(host);
  };

  const isIndeterminate = (target?: HTMLElement | null) => {
    const host = resolveProgress(target);
    if (!host) return false;
    return isIndeterminateHost(host);
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
        'progress',
        'role',
        'aria-valuemin',
        'aria-valuemax',
        'aria-valuenow',
        'aria-valuetext',
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
    setValue,
    getValue,
    setIndeterminate,
    isIndeterminate,
  };
};

export const initProgress = (
  options: ProgressOptions = {}
): ProgressController => createProgress(options);

let autoProgressController: ProgressController | null = null;
let autoStartSuspended = false;
let bootOnReady: (() => void) | null = null;

const cancelDeferredAutoStart = () => {
  if (!bootOnReady || typeof document === 'undefined') return;
  document.removeEventListener('DOMContentLoaded', bootOnReady);
  bootOnReady = null;
};

export const startProgressRuntime = (): ProgressController | null => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  autoStartSuspended = false;
  cancelDeferredAutoStart();

  if (autoProgressController) {
    autoProgressController.sync();
    return autoProgressController;
  }

  autoProgressController = createProgress();
  return autoProgressController;
};

export const stopProgressRuntime = () => {
  autoStartSuspended = true;
  cancelDeferredAutoStart();
  autoProgressController?.destroy();
  autoProgressController = null;
};

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    bootOnReady = () => {
      bootOnReady = null;
      if (!autoStartSuspended) {
        startProgressRuntime();
      }
    };
    document.addEventListener('DOMContentLoaded', bootOnReady);
  } else {
    startProgressRuntime();
  }
}
