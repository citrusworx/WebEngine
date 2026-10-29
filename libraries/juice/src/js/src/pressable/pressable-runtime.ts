/**
 * DOM-first runtime for Juice pressable chrome.
 *
 * Markup contract (Slice A — do not rename attrs):
 *   [pressable]              host. Any value, including "scale", is still
 *                            a pressable. Sync does not rewrite it.
 *   [pressed]                transient press. This runtime sets it only
 *                            for the gesture, and only when it added the
 *                            attribute. It is not a latched toggle.
 *   [pressable-longpress]    opt-in. Absent, the host does not arm a
 *                            long-press. Present with an empty value or
 *                            "true", the delay is `longPressDelay`
 *                            (default 500). A non-negative number is the
 *                            delay in milliseconds. "false" does not arm.
 *                            Any other value uses the default delay.
 *   [pressable-slop]         optional pixel slop for this host. A
 *                            non-negative number overrides `moveSlop`
 *                            (default 10). Anything else uses the option.
 *
 * Pointer:
 *   Primary pointerdown (mouse button 0, touch, or pen, and a primary
 *   pointer) sets the transient press. It clears on pointerup,
 *   pointercancel, pointerleave, pointerout that leaves the host,
 *   pointermove whose target is outside the host, lostpointercapture,
 *   and blur of the host itself. Moving farther than the slop, or a
 *   scroll whose target is the host or an ancestor (including the
 *   document), cancels the press and drops a pending long-press.
 *   pointermove and touch scrolling are not preventDefault'd.
 *   touch-action stays in CSS.
 *
 * Keyboard:
 *   Enter or Space on the host itself sets the transient press while
 *   the key is held, including on a native button. Native buttons
 *   already match :active; the attribute is set too so the pressed
 *   ring matches a pointer press. Keyup clears it. Repeat keydowns
 *   do not restart the gesture. Enter is never preventDefault'd, so
 *   a native click still fires. Space is preventDefault'd only on a
 *   custom button-like host, so the page does not scroll. That host's
 *   first role token is button, switch, checkbox, radio, menuitem,
 *   menuitemcheckbox, menuitemradio, option, tab, or treeitem, and
 *   the host is not a native control that already owns Space (button,
 *   input, textarea, select, summary, or contenteditable). A pressable
 *   with no button-like role is left alone, and role="link" keeps the
 *   scroll. Long-press is pointer-only. The host has to be the event
 *   target. This runtime does not add tabindex or role.
 *
 * Long-press:
 *   Armed only when [pressable-longpress] enables it. After the delay,
 *   the host dispatches a bubbling, cancelable, composed
 *   `juice:longpress` CustomEvent. detail is
 *   `{ pressed: true, longPressed: true }`. If the event is not
 *   preventDefault'd, the click that follows that gesture is
 *   suppressed once (capture-phase preventDefault and
 *   stopPropagation). If the event is canceled, the click is left
 *   alone. A slop or scroll cancel before the timer fires does not
 *   long-press and does not suppress the click. If the long-press
 *   already fired, a later cancel still suppresses that one click.
 *   The suppress flag expires on that click or on the next turn, so
 *   a later click is not swallowed.
 *
 * Latched [pressed]:
 *   [icon-button][toggle] and any host with aria-pressed own [pressed]
 *   as a latched toggle. This runtime never sets or removes [pressed]
 *   on those hosts. The gesture is still getState().pressed and still
 *   dispatches juice:change. :active paints the ring. On every other
 *   host, [pressed] is set only when it was absent, and removed only
 *   when this runtime added it. An author [pressed] that was already
 *   there is left in place.
 *
 * Disabled:
 *   :disabled (the disabled property), [disabled], and
 *   [aria-disabled="true"] do not press and do not long-press. A host
 *   that becomes disabled during a press is cleared.
 *
 * State is { pressed, longPressed }. pressed is the transient gesture,
 * not a latched attribute. longPressed is true only after
 *   juice:longpress has fired for the current gesture. Both return to
 *   false when the gesture ends. The first observation is recorded
 *   and does not dispatch. Later changes dispatch a bubbling
 *   juice:change CustomEvent with detail
 *   { runtime: "pressable", state }.
 *
 * Reduced motion stays in CSS. This runtime does not read
 * prefers-reduced-motion and does not animate. No Sig Pressable
 * factory. Pressable is the twenty-ninth Emerging auto-enhance
 * runtime.
 */

import { createJuiceChanges } from '../shared/change.js';
import { createEventClaim } from '../shared/events.js';

export type PressableOptions = {
  root?: ParentNode;
  pressableSelector?: string;
  longPressDelay?: number;
  moveSlop?: number;
};

export type PressableState = {
  pressed: boolean;
  longPressed: boolean;
};

export type PressableController = {
  destroy: () => void;
  sync: () => void;
  getState: (target?: HTMLElement | null) => PressableState | null;
};

const JUICE_LONGPRESS_EVENT = 'juice:longpress';

const DEFAULT_LONG_PRESS_DELAY = 500;
const DEFAULT_MOVE_SLOP = 10;

const DEFAULT_ROOT: ParentNode =
  typeof document !== 'undefined' ? document : ({} as ParentNode);

const DEFAULTS: Required<PressableOptions> = {
  root: DEFAULT_ROOT,
  pressableSelector: '[pressable]',
  longPressDelay: DEFAULT_LONG_PRESS_DELAY,
  moveSlop: DEFAULT_MOVE_SLOP,
};

const asArray = <T extends Element>(nodes: ArrayLike<T>): T[] =>
  Array.from(nodes);

const claimEvent = createEventClaim();

const REST_STATE: PressableState = { pressed: false, longPressed: false };

type PressSource = 'pointer' | 'keyboard';

type PressRecord = {
  source: PressSource;
  pointerId: number | null;
  originX: number;
  originY: number;
  slop: number;
  timer: ReturnType<typeof setTimeout> | null;
  active: boolean;
  longPressed: boolean;
  suppressClick: boolean;
  ownsPressed: boolean;
  onLeave: ((event: Event) => void) | null;
};

const isDisabled = (element: HTMLElement) => {
  if (element.getAttribute('aria-disabled') === 'true') return true;
  if (element.hasAttribute('disabled')) return true;
  if (
    'disabled' in element &&
    Boolean((element as HTMLButtonElement).disabled)
  ) {
    return true;
  }
  return false;
};

const isLatchedToggle = (element: HTMLElement) =>
  element.hasAttribute('aria-pressed') ||
  (element.hasAttribute('icon-button') && element.hasAttribute('toggle'));

const isPressKey = (key: string) => key === 'Enter' || key === ' ' || key === 'Spacebar';

const isSpaceKey = (key: string) => key === ' ' || key === 'Spacebar';

// Widget roles whose APG pattern activates on Space. Space would
// otherwise scroll the page, because these hosts are not native
// buttons. role="link" is not in this set: a link activates on Enter,
// and Space keeps scrolling. The first role token wins.
const CUSTOM_BUTTON_ROLES = new Set([
  'button',
  'switch',
  'checkbox',
  'radio',
  'menuitem',
  'menuitemcheckbox',
  'menuitemradio',
  'option',
  'tab',
  'treeitem',
]);

// Native controls whose Space key already does something. preventDefault
// would swallow a button click, a checkbox or radio toggle, a summary
// toggle, a select picker, a file dialog, or a typed space.
const isNativeSpaceOwner = (element: HTMLElement) => {
  if (element instanceof HTMLButtonElement) return true;
  if (element instanceof HTMLInputElement) return true;
  if (element instanceof HTMLTextAreaElement) return true;
  if (element instanceof HTMLSelectElement) return true;
  // tagName, not HTMLSummaryElement: that constructor is missing in some
  // DOM implementations, and reading the unbound name throws.
  if (element.tagName === 'SUMMARY') return true;
  if (isEditingHost(element)) return true;
  return false;
};

// isContentEditable is the browser signal, including an inherited
// contenteditable ancestor. The attribute is checked too, because some
// DOM implementations leave the IDL false when the attribute is set.
const isEditingHost = (element: HTMLElement) => {
  if (element.isContentEditable) return true;
  const value = element.getAttribute('contenteditable');
  if (value === null) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === '' || normalized === 'true' || normalized === 'plaintext-only';
};

const isCustomButtonHost = (element: HTMLElement) => {
  const role = element.getAttribute('role');
  if (!role) return false;
  const token = role.trim().toLowerCase().split(/\s+/)[0];
  return token !== undefined && CUSTOM_BUTTON_ROLES.has(token);
};

const shouldPreventSpaceScroll = (element: HTMLElement) =>
  isCustomButtonHost(element) && !isNativeSpaceOwner(element);

const parseNonNegative = (value: string | null) => {
  if (value === null) return null;
  const trimmed = value.trim();
  if (trimmed === '' || !/^\d+(?:\.\d+)?$/.test(trimmed)) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
};

const longPressDelayFor = (element: HTMLElement, fallback: number) => {
  if (!element.hasAttribute('pressable-longpress')) return null;
  const value = element.getAttribute('pressable-longpress');
  if (value !== null && value.trim().toLowerCase() === 'false') return null;
  const parsed = parseNonNegative(value);
  if (parsed === null) return fallback;
  return parsed;
};

const slopFor = (element: HTMLElement, fallback: number) => {
  if (!element.hasAttribute('pressable-slop')) return fallback;
  const parsed = parseNonNegative(element.getAttribute('pressable-slop'));
  return parsed === null ? fallback : parsed;
};

const finiteOption = (value: number | undefined, fallback: number) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return fallback;
  }
  return value;
};

const noopController = (): PressableController => ({
  destroy: () => {},
  sync: () => {},
  getState: () => null,
});

export const createPressable = (
  options: PressableOptions = {}
): PressableController => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return noopController();
  }

  const settings: Required<PressableOptions> = {
    ...DEFAULTS,
    ...options,
    longPressDelay: finiteOption(options.longPressDelay, DEFAULTS.longPressDelay),
    moveSlop: finiteOption(options.moveSlop, DEFAULTS.moveSlop),
  };
  const root = settings.root ?? document;
  const rootEvents = root as ParentNode & EventTarget;
  const changes = createJuiceChanges<PressableState>('pressable');
  const presses = new Map<HTMLElement, PressRecord>();
  const pendingClicks = new Map<HTMLElement, ReturnType<typeof setTimeout>>();
  let destroyed = false;

  const isManaged = (element: HTMLElement | null | undefined) => {
    if (!(element instanceof HTMLElement)) return false;
    if (!element.matches(settings.pressableSelector)) return false;
    if (root instanceof Document) return true;
    if (root instanceof Node) return root === element || root.contains(element);
    return false;
  };

  const getHosts = () => {
    const found = asArray(
      root.querySelectorAll<HTMLElement>(settings.pressableSelector)
    ).filter(isManaged);

    if (root instanceof HTMLElement && isManaged(root)) {
      return [root, ...found.filter((host) => host !== root)];
    }

    return found;
  };

  const resolvePressable = (target?: HTMLElement | null) => {
    if (target) {
      if (isManaged(target)) return target;
      const containing = target.closest(settings.pressableSelector);
      if (containing instanceof HTMLElement && isManaged(containing)) {
        return containing;
      }
      return null;
    }

    return getHosts()[0] ?? null;
  };

  const fromEvent = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return null;
    const host = target.closest(settings.pressableSelector);
    if (!(host instanceof HTMLElement) || !isManaged(host)) return null;
    return host;
  };

  const readGesture = (host: HTMLElement): PressableState => {
    const record = presses.get(host);
    if (!record) return { ...REST_STATE };
    return { pressed: record.active, longPressed: record.longPressed };
  };

  const publish = (host: HTMLElement) => {
    const next = readGesture(host);
    if (!changes.has(host)) {
      changes.note(host, next, { baseline: { ...REST_STATE } });
      return;
    }
    changes.note(host, next);
  };

  const setPressedAttribute = (host: HTMLElement, down: boolean, record: PressRecord) => {
    if (isLatchedToggle(host)) {
      record.ownsPressed = false;
      return;
    }

    if (down) {
      if (host.hasAttribute('pressed')) {
        record.ownsPressed = false;
        return;
      }
      host.setAttribute('pressed', '');
      record.ownsPressed = true;
      return;
    }

    if (record.ownsPressed && !isLatchedToggle(host)) {
      host.removeAttribute('pressed');
    }
    record.ownsPressed = false;
  };

  const clearTimer = (record: PressRecord) => {
    if (record.timer === null) return;
    clearTimeout(record.timer);
    record.timer = null;
  };

  const clearPendingClick = (host: HTMLElement) => {
    const timer = pendingClicks.get(host);
    if (timer !== undefined) clearTimeout(timer);
    pendingClicks.delete(host);
  };

  const armClickSuppress = (host: HTMLElement) => {
    clearPendingClick(host);
    const timer = setTimeout(() => {
      pendingClicks.delete(host);
    }, 0);
    pendingClicks.set(host, timer);
  };

  const hostForPointer = (pointerId: number) => {
    for (const [host, record] of presses) {
      if (record.source === 'pointer' && record.pointerId === pointerId) return host;
    }
    return null;
  };

  const endPress = (host: HTMLElement) => {
    const record = presses.get(host);
    if (!record) return;
    clearTimer(record);
    if (record.onLeave) {
      host.removeEventListener('pointerleave', record.onLeave);
      record.onLeave = null;
    }
    setPressedAttribute(host, false, record);
    const suppress = record.suppressClick;
    presses.delete(host);
    if (suppress) armClickSuppress(host);
    publish(host);
  };

  const armLongPress = (host: HTMLElement, record: PressRecord) => {
    const delay = longPressDelayFor(host, settings.longPressDelay);
    if (delay === null) return;
    record.timer = setTimeout(() => {
      record.timer = null;
      if (destroyed || presses.get(host) !== record) return;
      if (isDisabled(host) || !isManaged(host)) {
        endPress(host);
        return;
      }
      record.longPressed = true;
      const event = new CustomEvent(JUICE_LONGPRESS_EVENT, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: { pressed: true, longPressed: true },
      });
      host.dispatchEvent(event);
      if (!event.defaultPrevented) record.suppressClick = true;
      if (presses.get(host) === record) publish(host);
    }, delay);
  };

  const beginPress = (
    host: HTMLElement,
    source: PressSource,
    pointer: { pointerId: number; clientX: number; clientY: number } | null
  ) => {
    if (presses.has(host) || isDisabled(host) || !isManaged(host)) return false;
    const record: PressRecord = {
      source,
      pointerId: pointer?.pointerId ?? null,
      originX: pointer?.clientX ?? 0,
      originY: pointer?.clientY ?? 0,
      slop: slopFor(host, settings.moveSlop),
      timer: null,
      active: true,
      longPressed: false,
      suppressClick: false,
      ownsPressed: false,
      onLeave: null,
    };
    presses.set(host, record);
    setPressedAttribute(host, true, record);
    if (source === 'pointer') {
      const onLeave = (event: Event) => {
        if (destroyed) return;
        if (!(event instanceof PointerEvent)) return;
        if (event.pointerId !== record.pointerId) return;
        endPress(host);
      };
      record.onLeave = onLeave;
      host.addEventListener('pointerleave', onLeave);
      armLongPress(host, record);
    }
    publish(host);
    return true;
  };

  const isScrollForHost = (host: HTMLElement, target: EventTarget | null) => {
    const view = host.ownerDocument.defaultView;
    if (
      target == null ||
      target === view ||
      target === host.ownerDocument ||
      target === host.ownerDocument.documentElement
    ) {
      return true;
    }
    return target instanceof Node && target.contains(host);
  };

  const handlePointerDown = (event: Event) => {
    if (destroyed) return;
    if (!(event instanceof PointerEvent)) return;
    if (!event.isPrimary || event.button !== 0) return;
    const host = fromEvent(event.target);
    if (!host || isDisabled(host)) return;
    if (presses.has(host)) return;
    if (!claimEvent(event)) return;
    beginPress(host, 'pointer', {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
    });
  };

  const handlePointerMove = (event: Event) => {
    if (destroyed) return;
    if (!(event instanceof PointerEvent)) return;
    const host = hostForPointer(event.pointerId);
    if (!host) return;
    const record = presses.get(host);
    if (!record) return;
    if (event.target instanceof Node && !host.contains(event.target)) {
      endPress(host);
      return;
    }
    const distance = Math.hypot(
      event.clientX - record.originX,
      event.clientY - record.originY
    );
    if (distance > record.slop) endPress(host);
  };

  const handlePointerUp = (event: Event) => {
    if (destroyed) return;
    if (!(event instanceof PointerEvent)) return;
    const host = hostForPointer(event.pointerId);
    if (!host) return;
    endPress(host);
  };

  const handlePointerOut = (event: Event) => {
    if (destroyed) return;
    if (!(event instanceof PointerEvent)) return;
    const host = hostForPointer(event.pointerId);
    if (!host) return;
    if (!(event.target instanceof Node) || !host.contains(event.target)) return;
    const next = event.relatedTarget;
    if (next instanceof Node && host.contains(next)) return;
    endPress(host);
  };

  const handleLostCapture = (event: Event) => {
    if (destroyed) return;
    if (!(event instanceof PointerEvent)) return;
    const host = hostForPointer(event.pointerId);
    if (!host) return;
    endPress(host);
  };

  const handleScroll = (event: Event) => {
    if (destroyed || presses.size === 0) return;
    for (const host of Array.from(presses.keys())) {
      const record = presses.get(host);
      if (!record || record.source !== 'pointer') continue;
      if (!isScrollForHost(host, event.target)) continue;
      endPress(host);
    }
  };

  const handleKeyDown = (event: Event) => {
    if (destroyed) return;
    if (!(event instanceof KeyboardEvent)) return;
    if (!isPressKey(event.key)) return;
    if (!(event.target instanceof HTMLElement)) return;
    if (!event.target.matches(settings.pressableSelector)) return;
    const host = event.target;
    if (!isManaged(host)) return;
    if (isSpaceKey(event.key) && shouldPreventSpaceScroll(host) && event.cancelable) {
      event.preventDefault();
    }
    if (event.repeat || isDisabled(host) || presses.has(host)) return;
    if (!claimEvent(event)) return;
    beginPress(host, 'keyboard', null);
  };

  const handleKeyUp = (event: Event) => {
    if (destroyed) return;
    if (!(event instanceof KeyboardEvent) || !isPressKey(event.key)) return;
    if (!(event.target instanceof HTMLElement)) return;
    if (!event.target.matches(settings.pressableSelector)) return;
    const record = presses.get(event.target);
    if (!record || record.source !== 'keyboard') return;
    endPress(event.target);
  };

  const handleBlur = (event: Event) => {
    if (destroyed) return;
    if (!(event.target instanceof HTMLElement)) return;
    if (!event.target.matches(settings.pressableSelector)) return;
    if (!isManaged(event.target)) return;
    endPress(event.target);
  };

  const handleClick = (event: Event) => {
    if (destroyed) return;
    const host = fromEvent(event.target);
    if (!host || !pendingClicks.has(host)) return;
    clearPendingClick(host);
    if (event.cancelable) event.preventDefault();
    event.stopPropagation();
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

  const releaseBlocked = () => {
    for (const host of Array.from(presses.keys())) {
      if (!isManaged(host) || isDisabled(host)) endPress(host);
    }
  };

  const sync = () => {
    if (destroyed) return;
    releaseBlocked();
    getHosts().forEach((host) => {
      changes.note(host, readGesture(host));
    });
  };

  const observer =
    typeof MutationObserver !== 'undefined'
      ? new MutationObserver(() => {
          releaseBlocked();
          scheduleSync();
        })
      : null;

  const scrollOptions: AddEventListenerOptions = { capture: true, passive: true };
  const moveOptions: AddEventListenerOptions = { passive: true };

  rootEvents.addEventListener('pointerdown', handlePointerDown);
  rootEvents.addEventListener('pointermove', handlePointerMove, moveOptions);
  rootEvents.addEventListener('pointerup', handlePointerUp);
  rootEvents.addEventListener('pointercancel', handlePointerUp);
  rootEvents.addEventListener('pointerout', handlePointerOut);
  rootEvents.addEventListener('lostpointercapture', handleLostCapture);
  rootEvents.addEventListener('keydown', handleKeyDown);
  rootEvents.addEventListener('keyup', handleKeyUp);
  rootEvents.addEventListener('click', handleClick, true);
  rootEvents.addEventListener('blur', handleBlur, true);
  rootEvents.addEventListener('scroll', handleScroll, scrollOptions);

  const view =
    root instanceof Document
      ? root.defaultView
      : root instanceof Node
        ? (root.ownerDocument?.defaultView ?? null)
        : null;
  if (view) view.addEventListener('scroll', handleScroll, scrollOptions);

  if (observer && root instanceof Node) {
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        'pressable',
        'pressable-longpress',
        'pressable-slop',
        'pressed',
        'disabled',
        'aria-disabled',
        'aria-pressed',
        'icon-button',
        'toggle',
      ],
    });
  }

  sync();

  return {
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      if (syncScheduled) {
        cancelAnimationFrame(syncFrame);
        syncScheduled = false;
      }
      for (const host of Array.from(presses.keys())) endPress(host);
      for (const host of Array.from(pendingClicks.keys())) clearPendingClick(host);
      rootEvents.removeEventListener('pointerdown', handlePointerDown);
      rootEvents.removeEventListener('pointermove', handlePointerMove, moveOptions);
      rootEvents.removeEventListener('pointerup', handlePointerUp);
      rootEvents.removeEventListener('pointercancel', handlePointerUp);
      rootEvents.removeEventListener('pointerout', handlePointerOut);
      rootEvents.removeEventListener('lostpointercapture', handleLostCapture);
      rootEvents.removeEventListener('keydown', handleKeyDown);
      rootEvents.removeEventListener('keyup', handleKeyUp);
      rootEvents.removeEventListener('click', handleClick, true);
      rootEvents.removeEventListener('blur', handleBlur, true);
      rootEvents.removeEventListener('scroll', handleScroll, scrollOptions);
      if (view) view.removeEventListener('scroll', handleScroll, scrollOptions);
      observer?.disconnect();
    },
    sync,
    getState: (target) => {
      if (destroyed) return null;
      const host = resolvePressable(target);
      if (!host) return null;
      return readGesture(host);
    },
  };
};

export const initPressable = createPressable;

let autoPressableController: PressableController | null = null;
let autoStartSuspended = false;
let bootOnReady: (() => void) | null = null;

const cancelDeferredAutoStart = () => {
  if (!bootOnReady || typeof document === 'undefined') return;
  document.removeEventListener('DOMContentLoaded', bootOnReady);
  bootOnReady = null;
};

export const startPressableRuntime = (): PressableController | null => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  autoStartSuspended = false;
  cancelDeferredAutoStart();

  if (autoPressableController) {
    autoPressableController.sync();
    return autoPressableController;
  }

  autoPressableController = createPressable();
  return autoPressableController;
};

export const stopPressableRuntime = () => {
  autoStartSuspended = true;
  cancelDeferredAutoStart();
  autoPressableController?.destroy();
  autoPressableController = null;
};

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    bootOnReady = () => {
      bootOnReady = null;
      if (!autoStartSuspended) {
        startPressableRuntime();
      }
    };
    document.addEventListener('DOMContentLoaded', bootOnReady);
  } else {
    startPressableRuntime();
  }
}
