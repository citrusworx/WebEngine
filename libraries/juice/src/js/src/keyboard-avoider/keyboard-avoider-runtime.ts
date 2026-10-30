/**
 * DOM-first runtime for Juice keyboard-avoider chrome.
 *
 * Markup contract (Slice A — do not rename attrs):
 *   [keyboard-avoider]               host. Padding mode. Any unknown
 *                                    value is still a host. Words
 *                                    compose, same as the CSS.
 *   [keyboard-avoider="padding"]     padding mode. Matches ~= .
 *   [keyboard-avoider~="translate"]  translateY by the inset.
 *   [keyboard-avoider~="footer"]     sticky; bottom is the inset.
 *   [keyboard-avoider~="noscroll"]   this runtime does not
 *                                    scrollIntoView a focus inside
 *                                    that host. The word is behavior,
 *                                    not a layout mode. CSS ignores it.
 *   [keyboard-open]                  set on <html> and on each host
 *                                    while the keyboard is open.
 *                                    Slice A does not select it. The
 *                                    inset is the layout input.
 *
 * The overlap is the layout viewport minus the visual viewport:
 *
 *   inset = max(0, round(innerHeight - (visualViewport.height + visualViewport.offsetTop)))
 *
 * iOS reports part of that overlap as offsetTop. Leaving it out
 * counts the keyboard twice. Chrome Android with
 * interactive-widget=resizes-content shrinks innerHeight with the
 * keyboard, so the same formula is about 0 and this runtime does not
 * pad on top of the layout viewport. Pinch zoom (visualViewport.scale
 * other than 1) skips the update and leaves the previous inset.
 *
 * While open, the inset is written as `<n>px` on
 * document.documentElement (the <html> element), not on each host.
 * --juice-keyboard-inset inherits. When the keyboard is not open the
 * inline property is removed. A closed keyboard must not leave an
 * inline length behind: an inline value beats both the 0px role on
 * :root and the @supports env(keyboard-inset-height) fallback. Clearing
 * it is what lets that fallback show through. getState().inset is still
 * the measured overlap. Only the custom property is cleared.
 *
 * open is inset > threshold (default 80) and an editable element has
 * focus. Editable is a text-like input, the same set as the Input
 * runtime (missing type, empty type, text, email, password, search,
 * tel, url, number), plus a textarea, a select, or [contenteditable]
 * (including a focused descendant). A hardware keyboard does not
 * shrink the visual viewport, so a focused field stays closed. Every
 * other input type is not editable: checkbox, radio, range, date,
 * time, datetime-local, month, week, color, file, hidden, button,
 * submit, reset, and image.
 *
 * Listeners: visualViewport resize and scroll, window resize and
 * orientationchange, focusin and focusout on root. Updates are
 * coalesced with requestAnimationFrame. This runtime does not set
 * navigator.virtualKeyboard.overlaysContent.
 *
 * Scroll-into-view is on by default. focusin inside a host remembers
 * the focused element. The scroll runs two frames after geometry
 * events go quiet, so a resize burst settles before the element moves,
 * and the inset written on the first of those frames is the one layout
 * sees. A focus that never resizes still scrolls on that quiet window.
 * The call is element.scrollIntoView({ block: 'nearest', behavior })
 * with behavior 'auto' when prefersReducedMotion() is true and 'smooth'
 * otherwise. [keyboard-avoider~="noscroll"] or scrollIntoView: false
 * opts out. destroy cancels a pending scroll.
 *
 * State is { open, inset }. juice:change bubbles from each host with
 * detail { runtime: 'keyboard-avoider', state }. The first observation
 * is silent. Later events fire when open flips, or when the inset has
 * moved by at least `threshold` pixels from the last published inset
 * while open. Smaller steps still update the custom property and
 * getState. They accumulate against the last published inset, so a
 * slow drift still publishes once it is stale by `threshold`.
 *
 * No window, or no visualViewport, is a no-op (SSR and old browsers).
 * getState then returns { open: false, inset: 0 }. No Sig
 * KeyboardAvoider factory. Keyboard-avoider is the thirty-first
 * Emerging auto-enhance runtime.
 */

import { createJuiceChanges } from '../shared/change.js';
import { prefersReducedMotion } from '../shared/motion.js';

export type KeyboardAvoiderOptions = {
  root?: ParentNode;
  keyboardAvoiderSelector?: string;
  threshold?: number;
  scrollIntoView?: boolean;
};

export type KeyboardAvoiderState = {
  open: boolean;
  inset: number;
};

export type KeyboardAvoiderController = {
  destroy: () => void;
  sync: () => void;
  getState: (target?: HTMLElement | null) => KeyboardAvoiderState | null;
};

const INSET_VAR = '--juice-keyboard-inset';
const OPEN_ATTR = 'keyboard-open';
const DEFAULT_THRESHOLD = 80;

const CLOSED_STATE: KeyboardAvoiderState = { open: false, inset: 0 };

const TEXT_LIKE_TYPES = new Set([
  'text',
  'email',
  'password',
  'search',
  'tel',
  'url',
  'number',
]);

const DEFAULT_ROOT: ParentNode =
  typeof document !== 'undefined' ? document : ({} as ParentNode);

const DEFAULTS: Required<KeyboardAvoiderOptions> = {
  root: DEFAULT_ROOT,
  keyboardAvoiderSelector: '[keyboard-avoider]',
  threshold: DEFAULT_THRESHOLD,
  scrollIntoView: true,
};

const asArray = <T extends Element>(nodes: ArrayLike<T>): T[] =>
  Array.from(nodes);

const finiteThreshold = (value: number | undefined) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return DEFAULT_THRESHOLD;
  }
  return value;
};

const hasWord = (element: HTMLElement, word: string) => {
  const value = element.getAttribute('keyboard-avoider');
  if (!value) return false;
  return value.split(/\s+/).includes(word);
};

const isTextLikeInput = (input: HTMLInputElement) => {
  if (!input.hasAttribute('type')) return true;
  const type = input.getAttribute('type') ?? '';
  if (type === '') return true;
  return TEXT_LIKE_TYPES.has(type.toLowerCase());
};

// isContentEditable is the browser signal, including an inherited
// contenteditable ancestor. The attribute is checked too, because some
// DOM implementations leave the IDL false when the attribute is set.
const isContentEditableElement = (element: HTMLElement) => {
  if (element.isContentEditable) return true;
  const value = element.getAttribute('contenteditable');
  if (value === null) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === '' || normalized === 'true' || normalized === 'plaintext-only';
};

const isEditableElement = (element: HTMLElement) => {
  if (element instanceof HTMLTextAreaElement) return true;
  if (element instanceof HTMLSelectElement) return true;
  if (element instanceof HTMLInputElement) return isTextLikeInput(element);
  return false;
};

const viewportOf = (view: Window) => {
  const viewport = view.visualViewport;
  if (!viewport || typeof viewport.addEventListener !== 'function') return null;
  return viewport;
};

const readInset = (view: Window) => {
  const viewport = view.visualViewport;
  if (!viewport) return 0;
  const inner = view.innerHeight;
  const height = viewport.height;
  const offsetTop = viewport.offsetTop;
  if (![inner, height, offsetTop].every((value) => Number.isFinite(value))) return 0;
  return Math.max(0, Math.round(inner - (height + offsetTop)));
};

const isZoomed = (view: Window) => {
  const scale = view.visualViewport?.scale;
  return typeof scale === 'number' && scale !== 1;
};

const noopController = (): KeyboardAvoiderController => ({
  destroy: () => {},
  sync: () => {},
  getState: () => ({ ...CLOSED_STATE }),
});

export const createKeyboardAvoider = (
  options: KeyboardAvoiderOptions = {}
): KeyboardAvoiderController => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return noopController();
  }

  const viewport = viewportOf(window);
  if (!viewport) return noopController();

  const settings: Required<KeyboardAvoiderOptions> = {
    ...DEFAULTS,
    ...options,
    threshold: finiteThreshold(options.threshold),
    scrollIntoView: options.scrollIntoView !== false,
  };
  const root = settings.root ?? document;
  const rootEvents = root as ParentNode & EventTarget;
  const changes = createJuiceChanges<KeyboardAvoiderState>('keyboard-avoider');
  const openHosts = new Set<HTMLElement>();
  let destroyed = false;
  let measured: KeyboardAvoiderState = { ...CLOSED_STATE };
  // Last inset/open pair juice:change committed. Sub-threshold steps
  // move `measured` and the custom property without moving this.
  let published: KeyboardAvoiderState | null = null;
  let updateFrame = 0;
  let updateScheduled = false;
  let scrollOuter = 0;
  let scrollInner = 0;
  let scrollArmed = false;
  let pendingScroll: HTMLElement | null = null;

  const isManaged = (element: HTMLElement | null | undefined) => {
    if (!(element instanceof HTMLElement)) return false;
    if (!element.matches(settings.keyboardAvoiderSelector)) return false;
    if (root instanceof Document) return true;
    if (root instanceof Node) return root === element || root.contains(element);
    return false;
  };

  const getHosts = () => {
    const found = asArray(
      root.querySelectorAll<HTMLElement>(settings.keyboardAvoiderSelector)
    ).filter(isManaged);

    if (root instanceof HTMLElement && isManaged(root)) {
      return [root, ...found.filter((host) => host !== root)];
    }

    return found;
  };

  const resolveHost = (target?: HTMLElement | null) => {
    if (target) {
      if (isManaged(target)) return target;
      const containing = target.closest(settings.keyboardAvoiderSelector);
      if (containing instanceof HTMLElement && isManaged(containing)) {
        return containing;
      }
      return null;
    }

    return getHosts()[0] ?? null;
  };

  const hostFor = (element: HTMLElement | null) => {
    if (!element) return null;
    const host = element.closest(settings.keyboardAvoiderSelector);
    if (!(host instanceof HTMLElement) || !isManaged(host)) return null;
    return host;
  };

  const editableFocused = () => {
    const active = document.activeElement;
    if (!(active instanceof HTMLElement)) return false;
    let current: HTMLElement | null = active;
    while (current && current !== document.documentElement) {
      if (isEditableElement(current) || isContentEditableElement(current)) return true;
      current = current.parentElement;
    }
    return false;
  };

  const readState = (): KeyboardAvoiderState => {
    const inset = readInset(window);
    return {
      inset,
      open: inset > settings.threshold && editableFocused(),
    };
  };

  const writeInset = (state: KeyboardAvoiderState) => {
    const style = document.documentElement.style;
    // Remove, rather than write 0px. An inline 0px would beat the
    // env(keyboard-inset-height) fallback Slice A registers.
    if (state.open) style.setProperty(INSET_VAR, `${state.inset}px`);
    else style.removeProperty(INSET_VAR);
  };

  const setOpenAttribute = (open: boolean) => {
    const rootEl = document.documentElement;
    if (open) rootEl.setAttribute(OPEN_ATTR, '');
    else rootEl.removeAttribute(OPEN_ATTR);

    const next = open ? getHosts() : [];
    const keep = new Set(next);
    for (const host of openHosts) {
      if (!keep.has(host)) host.removeAttribute(OPEN_ATTR);
    }
    openHosts.clear();
    for (const host of next) {
      host.setAttribute(OPEN_ATTR, '');
      openHosts.add(host);
    }
  };

  const publish = (next: KeyboardAvoiderState) => {
    const prev = published;
    const openFlipped = prev !== null && prev.open !== next.open;
    const insetJumped =
      prev !== null &&
      prev.open &&
      next.open &&
      next.inset !== prev.inset &&
      Math.abs(next.inset - prev.inset) >= settings.threshold;
    const qualifies = openFlipped || insetJumped;

    if (prev === null || qualifies) published = { ...next };

    for (const host of getHosts()) {
      if (!changes.has(host)) {
        changes.note(host, next);
        continue;
      }
      if (qualifies) changes.note(host, next);
    }
  };

  const update = () => {
    if (destroyed || isZoomed(window)) return;
    const next = readState();
    measured = next;
    writeInset(next);
    setOpenAttribute(next.open);
    publish(next);
  };

  const cancelScrollFrames = () => {
    if (!scrollArmed) return;
    cancelAnimationFrame(scrollOuter);
    cancelAnimationFrame(scrollInner);
    scrollArmed = false;
  };

  const scheduleSettledScroll = () => {
    if (destroyed || !pendingScroll) return;
    cancelScrollFrames();
    scrollArmed = true;
    // Two frames: the update rAF writes the inset, then a quiet frame
    // scrolls. A geometry event before the second frame restarts this.
    scrollOuter = requestAnimationFrame(() => {
      if (destroyed || !pendingScroll) {
        scrollArmed = false;
        return;
      }
      scrollInner = requestAnimationFrame(() => {
        scrollArmed = false;
        if (destroyed || !pendingScroll) return;
        if (isZoomed(window)) return;
        const target = pendingScroll;
        if (!target.isConnected || !stillFocused(target)) {
          pendingScroll = null;
          return;
        }
        pendingScroll = null;
        const host = hostFor(target);
        if (!host || hasWord(host, 'noscroll') || !settings.scrollIntoView) return;
        target.scrollIntoView({
          block: 'nearest',
          behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        });
      });
    });
  };

  const scheduleUpdate = () => {
    if (destroyed || updateScheduled) return;
    updateScheduled = true;
    updateFrame = requestAnimationFrame(() => {
      updateScheduled = false;
      update();
    });
  };

  const handleGeometry = () => {
    if (destroyed) return;
    scheduleUpdate();
    if (pendingScroll) scheduleSettledScroll();
  };

  const handleFocusIn = (event: Event) => {
    if (destroyed) return;
    const target = event.target instanceof HTMLElement ? event.target : null;
    const host = target ? hostFor(target) : null;
    if (target && settings.scrollIntoView && host && !hasWord(host, 'noscroll')) {
      pendingScroll = target;
      scheduleSettledScroll();
    } else {
      pendingScroll = null;
      cancelScrollFrames();
    }
    scheduleUpdate();
  };

  // focusout does not cancel a pending scroll. jsdom and some browsers
  // deliver focusout after focusin for the same move, which would drop
  // the scroll focusin just armed. The scroll frame checks that the
  // element is still focused, so a real blur does not scroll.
  const handleFocusOut = () => {
    if (destroyed) return;
    scheduleUpdate();
  };

  const stillFocused = (target: HTMLElement) => {
    const active = document.activeElement;
    return active === target || (active instanceof Node && target.contains(active));
  };

  const sync = () => {
    if (destroyed) return;
    update();
  };

  viewport.addEventListener('resize', handleGeometry);
  viewport.addEventListener('scroll', handleGeometry);
  window.addEventListener('resize', handleGeometry);
  window.addEventListener('orientationchange', handleGeometry);
  rootEvents.addEventListener('focusin', handleFocusIn);
  rootEvents.addEventListener('focusout', handleFocusOut);

  sync();

  return {
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      if (updateScheduled) {
        cancelAnimationFrame(updateFrame);
        updateScheduled = false;
      }
      pendingScroll = null;
      cancelScrollFrames();
      viewport.removeEventListener('resize', handleGeometry);
      viewport.removeEventListener('scroll', handleGeometry);
      window.removeEventListener('resize', handleGeometry);
      window.removeEventListener('orientationchange', handleGeometry);
      rootEvents.removeEventListener('focusin', handleFocusIn);
      rootEvents.removeEventListener('focusout', handleFocusOut);
      writeInset(CLOSED_STATE);
      setOpenAttribute(false);
    },
    sync,
    getState: (target) => {
      if (destroyed) return null;
      const host = resolveHost(target);
      if (!host) return null;
      return { ...measured };
    },
  };
};

export const initKeyboardAvoider = createKeyboardAvoider;

let autoKeyboardAvoiderController: KeyboardAvoiderController | null = null;
let autoStartSuspended = false;
let bootOnReady: (() => void) | null = null;

const cancelDeferredAutoStart = () => {
  if (!bootOnReady || typeof document === 'undefined') return;
  document.removeEventListener('DOMContentLoaded', bootOnReady);
  bootOnReady = null;
};

export const startKeyboardAvoiderRuntime = (): KeyboardAvoiderController | null => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  autoStartSuspended = false;
  cancelDeferredAutoStart();

  if (autoKeyboardAvoiderController) {
    autoKeyboardAvoiderController.sync();
    return autoKeyboardAvoiderController;
  }

  autoKeyboardAvoiderController = createKeyboardAvoider();
  return autoKeyboardAvoiderController;
};

export const stopKeyboardAvoiderRuntime = () => {
  autoStartSuspended = true;
  cancelDeferredAutoStart();
  autoKeyboardAvoiderController?.destroy();
  autoKeyboardAvoiderController = null;
};

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    bootOnReady = () => {
      bootOnReady = null;
      if (!autoStartSuspended) {
        startKeyboardAvoiderRuntime();
      }
    };
    document.addEventListener('DOMContentLoaded', bootOnReady);
  } else {
    startKeyboardAvoiderRuntime();
  }
}
