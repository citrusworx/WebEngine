/**
 * Shared enter/exit motion for Juice runtimes.
 *
 * `prefersReducedMotion` reads `matchMedia('(prefers-reduced-motion: reduce)')`.
 * It returns false when `matchMedia` is missing (SSR, jsdom) or throws.
 * `subscribeReducedMotion` reports later changes and returns an unsubscribe
 * function. The unsubscribe is a no-op in those same environments.
 *
 * `runMotion` drives one element:
 *   enter → data-motion-state="entering", then "entered"
 *   exit  → data-motion-state="exiting", then "exited"
 * It resolves on `transitionend` or `animationend` whose target is that
 * element. Events that bubble from children are ignored. If the event never
 * arrives, a timeout fires after the computed transition and animation
 * duration plus delay (the longer of the two). Duration 0, or reduced
 * motion, finishes in the same turn (`immediate: true`) so callers can set
 * `hidden` or restore focus before they return. A resolved promise alone
 * would wait a microtask and miss that contract.
 *
 * Pass a `MotionCancelToken` to abandon an in-flight enter or exit. Cancelling
 * does not apply the terminal state. `createElementMotion` keeps one token
 * per element so a later enter or exit replaces the previous one.
 */

export type MotionState = 'entering' | 'entered' | 'exiting' | 'exited';

export type MotionDirection = 'enter' | 'exit';

export type MotionCancelToken = {
  readonly cancelled: boolean;
  cancel: () => void;
};

export type MotionResult = {
  /** True when the terminal state was applied before `runMotion` returned. */
  immediate: boolean;
  /** Resolves when the motion finishes or is cancelled. */
  finished: Promise<{ completed: boolean }>;
};

export type MotionPlayer = {
  enter: (
    element: HTMLElement,
    onComplete?: () => void,
    afterStart?: () => void
  ) => void;
  exit: (
    element: HTMLElement,
    onComplete?: () => void,
    afterStart?: () => void
  ) => void;
  cancel: (element: HTMLElement) => void;
  destroy: () => void;
};

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const terminalState = (direction: MotionDirection): MotionState =>
  direction === 'enter' ? 'entered' : 'exited';

const activeState = (direction: MotionDirection): MotionState =>
  direction === 'enter' ? 'entering' : 'exiting';

const matchReducedMotion = (): MediaQueryList | null => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return null;
  }

  try {
    return window.matchMedia(REDUCED_MOTION_QUERY);
  } catch {
    return null;
  }
};

export const prefersReducedMotion = (): boolean => matchReducedMotion()?.matches ?? false;

export const subscribeReducedMotion = (
  listener: (reduced: boolean) => void
): (() => void) => {
  const query = matchReducedMotion();
  if (!query) return () => {};

  const notify = () => listener(query.matches);

  if (typeof query.addEventListener === 'function') {
    query.addEventListener('change', notify);
    return () => query.removeEventListener('change', notify);
  }

  const legacy = query as MediaQueryList & {
    addListener?: (fn: () => void) => void;
    removeListener?: (fn: () => void) => void;
  };

  if (typeof legacy.addListener === 'function') {
    legacy.addListener(notify);
    return () => legacy.removeListener?.(notify);
  }

  return () => {};
};

export const createMotionCancelToken = (): MotionCancelToken => {
  let cancelled = false;

  return {
    get cancelled() {
      return cancelled;
    },
    cancel() {
      cancelled = true;
    },
  };
};

const parseTime = (value: string): number => {
  const trimmed = value.trim();
  const match = /^(-?\d*\.?\d+)(ms|s)$/.exec(trimmed);
  if (!match) return 0;

  const amount = Number.parseFloat(match[1] ?? '');
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return match[2] === 'ms' ? amount : amount * 1000;
};

const parseTimeList = (value: string): number[] =>
  value
    .split(',')
    .map((part) => parseTime(part))
    .filter((part) => Number.isFinite(part));

const longestTimeline = (durations: number[], delays: number[]): number => {
  let longest = 0;

  durations.forEach((duration, index) => {
    const delay = delays[index] ?? delays[0] ?? 0;
    longest = Math.max(longest, duration + delay);
  });

  return longest;
};

const readMotionDuration = (element: HTMLElement): number => {
  if (typeof window === 'undefined' || typeof window.getComputedStyle !== 'function') {
    return 0;
  }

  let style: CSSStyleDeclaration;
  try {
    style = window.getComputedStyle(element);
  } catch {
    return 0;
  }

  const transition = longestTimeline(
    parseTimeList(style.transitionDuration || ''),
    parseTimeList(style.transitionDelay || '')
  );
  const animation = longestTimeline(
    parseTimeList(style.animationDuration || ''),
    parseTimeList(style.animationDelay || '')
  );

  return Math.max(transition, animation);
};

export const runMotion = (
  element: HTMLElement,
  direction: MotionDirection,
  token: MotionCancelToken = createMotionCancelToken()
): MotionResult => {
  let settled = false;
  let timeoutId = 0;
  let unsubscribe = () => {};
  let resolveFinished: (value: { completed: boolean }) => void = () => {};

  const finished = new Promise<{ completed: boolean }>((resolve) => {
    resolveFinished = resolve;
  });

  const cleanup = () => {
    element.removeEventListener('transitionend', onEnd);
    element.removeEventListener('animationend', onEnd);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      timeoutId = 0;
    }
    unsubscribe();
    unsubscribe = () => {};
  };

  const finish = (completed: boolean) => {
    if (settled) return;
    if (!completed && !token.cancelled) return;
    settled = true;
    cleanup();
    if (completed && !token.cancelled) {
      element.setAttribute('data-motion-state', terminalState(direction));
    }
    resolveFinished({ completed: completed && !token.cancelled });
  };

  const onEnd = (event: Event) => {
    if (event.target !== element) return;
    finish(true);
  };

  const previousCancel = token.cancel.bind(token);
  token.cancel = () => {
    if (token.cancelled) return;
    previousCancel();
    finish(false);
  };

  if (token.cancelled) {
    resolveFinished({ completed: false });
    return { immediate: true, finished };
  }

  element.setAttribute('data-motion-state', activeState(direction));

  if (prefersReducedMotion() || readMotionDuration(element) <= 0) {
    finish(true);
    return { immediate: true, finished };
  }

  const duration = readMotionDuration(element);
  element.addEventListener('transitionend', onEnd);
  element.addEventListener('animationend', onEnd);
  timeoutId = window.setTimeout(() => finish(true), Math.ceil(duration));
  unsubscribe = subscribeReducedMotion((reduced) => {
    if (reduced) finish(true);
  });

  return { immediate: false, finished };
};

export const createElementMotion = (): MotionPlayer => {
  const tokens = new WeakMap<HTMLElement, MotionCancelToken>();
  const active = new Set<HTMLElement>();

  const play = (
    element: HTMLElement,
    direction: MotionDirection,
    onComplete?: () => void,
    afterStart?: () => void
  ) => {
    tokens.get(element)?.cancel();
    const token = createMotionCancelToken();
    tokens.set(element, token);
    active.add(element);

    const result = runMotion(element, direction, token);
    afterStart?.();

    const complete = () => {
      if (token.cancelled) return;
      active.delete(element);
      onComplete?.();
    };

    if (result.immediate) {
      complete();
      return;
    }

    void result.finished.then((outcome) => {
      if (!outcome.completed || token.cancelled) return;
      complete();
    });
  };

  return {
    enter: (element, onComplete, afterStart) =>
      play(element, 'enter', onComplete, afterStart),
    exit: (element, onComplete, afterStart) =>
      play(element, 'exit', onComplete, afterStart),
    cancel: (element) => {
      tokens.get(element)?.cancel();
      active.delete(element);
    },
    destroy: () => {
      active.forEach((element) => tokens.get(element)?.cancel());
      active.clear();
    },
  };
};
