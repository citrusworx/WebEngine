/**
 * DOM-first APG Slider runtime for Juice slider chrome.
 *
 * Markup contract (Slice A — do not rename attrs):
 *   [slider]        track host. Boolean or "horizontal".
 *                   [slider="vertical"] is not painted and is not enhanced.
 *   [slider-fill]   completed portion. Optional.
 *   [slider-thumb]  real thumb. Required. Orphan thumbs are ignored.
 *                   The first thumb whose nearest [slider] is the host
 *                   is the control. Extra thumbs are not a multi-thumb
 *                   slider in v1.
 *
 * Focus model: the thumb is the APG slider. Sync sets role="slider",
 * tabindex="0" when the thumb is not natively focusable, type="button"
 * when a button thumb omitted type, aria-valuemin (default 0),
 * aria-valuemax (default 100), aria-valuenow, and
 * aria-orientation="horizontal" on the thumb. The host stays the track.
 * An author role="slider" on the host is removed so assistive tech sees
 * one slider. Thumb aria-valuemin / aria-valuemax / aria-valuenow win
 * over the same attributes on the host. A missing valuenow defaults to
 * min. aria-valuetext is never invented and is never rewritten. Authors
 * supply the accessible name.
 *
 * Paint: the host inline custom property --juice-slider-ratio (unitless
 * 0–1) stays in sync for every range. Integer aria-valuenow 0–100 on the
 * thumb also matches the chrome attribute selectors.
 *
 * Keyboard (thumb only): ArrowLeft / ArrowDown decrease, ArrowRight /
 * ArrowUp increase, Home / End jump to min / max, PageUp / PageDown move
 * by a larger step. Step is 1. Page step is 10. Values clamp to min/max.
 * Pointer: primary pointerdown on the track, fill, or thumb jumps to that
 * position and starts a drag; pointermove follows until pointerup or
 * pointercancel. The thumb captures the pointer when the platform allows
 * it. Disabled or aria-disabled="true" on the host or thumb is ignored.
 *
 * v1 is horizontal Juice markup only. There is no vertical orientation,
 * no multi-thumb, no native <input type="range"> restyle, and no Escape
 * handling (not a layered overlay).
 */

import { createEventClaim } from '../shared/events.js';

export type SliderOptions = {
  root?: ParentNode;
  sliderSelector?: string;
};

export type SliderController = {
  destroy: () => void;
  sync: () => void;
  setValue: (value: number, target?: HTMLElement | null) => void;
  getValue: (target?: HTMLElement | null) => number;
  increment: (target?: HTMLElement | null) => void;
  decrement: (target?: HTMLElement | null) => void;
};

const STEP = 1;
const PAGE_STEP = 10;

const DEFAULT_ROOT: ParentNode =
  typeof document !== 'undefined' ? document : ({} as ParentNode);

const DEFAULTS: Required<SliderOptions> = {
  root: DEFAULT_ROOT,
  sliderSelector: '[slider]:not([slider="vertical"])',
};

const asArray = <T extends Element>(nodes: ArrayLike<T>): T[] =>
  Array.from(nodes);

const claimEvent = createEventClaim();

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

const closestSliderHost = (element: Element) => {
  const host = element.closest('[slider]');
  return host instanceof HTMLElement ? host : null;
};

const findOwnedThumb = (host: HTMLElement) => {
  const thumbs = host.querySelectorAll<HTMLElement>('[slider-thumb]');
  for (const thumb of thumbs) {
    if (closestSliderHost(thumb) === host) return thumb;
  }
  return null;
};

const isNativelyFocusable = (element: HTMLElement) => {
  if (element instanceof HTMLButtonElement) return true;
  if (element instanceof HTMLInputElement) return true;
  if (element instanceof HTMLSelectElement) return true;
  if (element instanceof HTMLTextAreaElement) return true;
  if (element instanceof HTMLAnchorElement && element.hasAttribute('href')) {
    return true;
  }
  return false;
};

const isDisabledElement = (element: HTMLElement) => {
  if (element.getAttribute('aria-disabled') === 'true') return true;
  if (
    (element instanceof HTMLButtonElement ||
      element instanceof HTMLInputElement ||
      element instanceof HTMLSelectElement ||
      element instanceof HTMLTextAreaElement ||
      element instanceof HTMLFieldSetElement ||
      element instanceof HTMLOptGroupElement ||
      element instanceof HTMLOptionElement) &&
    element.disabled
  ) {
    return true;
  }
  return element.hasAttribute('disabled');
};

const isDisabledSlider = (host: HTMLElement, thumb: HTMLElement) =>
  isDisabledElement(host) || isDisabledElement(thumb);

const readBounds = (host: HTMLElement, thumb: HTMLElement) => {
  const min =
    readFiniteAttr(thumb, 'aria-valuemin') ??
    readFiniteAttr(host, 'aria-valuemin') ??
    0;
  const rawMax =
    readFiniteAttr(thumb, 'aria-valuemax') ??
    readFiniteAttr(host, 'aria-valuemax') ??
    100;
  const max = rawMax < min ? min : rawMax;
  const rawValue =
    readFiniteAttr(thumb, 'aria-valuenow') ??
    readFiniteAttr(host, 'aria-valuenow') ??
    min;
  return {
    min,
    max,
    value: clamp(rawValue, min, max),
  };
};

const ratioFor = (value: number, min: number, max: number) => {
  if (max === min) return 0;
  return clamp((value - min) / (max - min), 0, 1);
};

const snapToStep = (value: number, min: number) => {
  const steps = Math.round((value - min) / STEP);
  return min + steps * STEP;
};

const valueFromClientX = (
  host: HTMLElement,
  thumb: HTMLElement,
  clientX: number,
  min: number,
  max: number
) => {
  const width = host.getBoundingClientRect().width;
  if (!(width > 0) || max === min) return min;

  const thumbWidth = thumb.getBoundingClientRect().width;
  const inset = thumbWidth > 0 && thumbWidth < width ? thumbWidth / 2 : 0;
  const travel = width - inset * 2;
  if (!(travel > 0)) return min;

  const ratio = clamp(
    (clientX - host.getBoundingClientRect().left - inset) / travel,
    0,
    1
  );
  return clamp(snapToStep(min + ratio * (max - min), min), min, max);
};

const capturePointer = (element: HTMLElement, pointerId: number) => {
  if (typeof element.setPointerCapture !== 'function') return;
  try {
    element.setPointerCapture(pointerId);
  } catch {
    // Detached nodes and jsdom can reject capture. Root listeners still
    // follow the drag.
  }
};

const releasePointer = (element: HTMLElement, pointerId: number) => {
  if (typeof element.releasePointerCapture !== 'function') return;
  try {
    if (
      typeof element.hasPointerCapture === 'function' &&
      !element.hasPointerCapture(pointerId)
    ) {
      return;
    }
    element.releasePointerCapture(pointerId);
  } catch {
    // Capture may already have been released.
  }
};

const focusThumb = (thumb: HTMLElement) => {
  if (typeof thumb.focus !== 'function') return;
  try {
    thumb.focus({ preventScroll: true });
  } catch {
    thumb.focus();
  }
};

const noopController = (): SliderController => ({
  destroy: () => {},
  sync: () => {},
  setValue: () => {},
  getValue: () => 0,
  increment: () => {},
  decrement: () => {},
});

export const createSlider = (
  options: SliderOptions = {}
): SliderController => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return noopController();
  }

  const settings = { ...DEFAULTS, ...options };
  const root = settings.root ?? document;
  const rootEvents = root as ParentNode & EventTarget;
  let destroyed = false;
  let drag: {
    host: HTMLElement;
    thumb: HTMLElement;
    pointerId: number;
  } | null = null;

  const getSliders = () =>
    asArray(
      root.querySelectorAll<HTMLElement>(settings.sliderSelector)
    ).filter((host) => findOwnedThumb(host) !== null);

  const isManagedSlider = (host: HTMLElement | null | undefined) => {
    if (!host?.matches(settings.sliderSelector)) return false;
    if (!findOwnedThumb(host)) return false;
    if (root instanceof Document) return true;
    if (root instanceof Node) return root.contains(host);
    return getSliders().includes(host);
  };

  const resolveContainingSlider = (
    element: HTMLElement | null | undefined
  ) => {
    if (!element) return null;
    const host = closestSliderHost(element);
    if (!host || !isManagedSlider(host)) return null;
    return host;
  };

  const resolveSlider = (target?: HTMLElement | null) => {
    if (target) {
      if (isManagedSlider(target)) return target;
      const containing = resolveContainingSlider(target);
      if (containing) return containing;
    }

    return getSliders().find((host) => isManagedSlider(host)) ?? null;
  };

  const writeSlider = (
    host: HTMLElement,
    thumb: HTMLElement,
    min: number,
    max: number,
    value: number
  ) => {
    if (host.getAttribute('role') === 'slider') {
      host.removeAttribute('role');
    }

    if (thumb.getAttribute('role') !== 'slider') {
      thumb.setAttribute('role', 'slider');
    }

    if (
      !isNativelyFocusable(thumb) &&
      !thumb.hasAttribute('tabindex')
    ) {
      thumb.setAttribute('tabindex', '0');
    }

    if (thumb instanceof HTMLButtonElement && !thumb.hasAttribute('type')) {
      thumb.type = 'button';
    }

    const minValue = formatNumber(min);
    const maxValue = formatNumber(max);
    const nowValue = formatNumber(value);
    if (thumb.getAttribute('aria-valuemin') !== minValue) {
      thumb.setAttribute('aria-valuemin', minValue);
    }
    if (thumb.getAttribute('aria-valuemax') !== maxValue) {
      thumb.setAttribute('aria-valuemax', maxValue);
    }
    if (thumb.getAttribute('aria-valuenow') !== nowValue) {
      thumb.setAttribute('aria-valuenow', nowValue);
    }
    if (thumb.getAttribute('aria-orientation') !== 'horizontal') {
      thumb.setAttribute('aria-orientation', 'horizontal');
    }

    const ratio = formatNumber(ratioFor(value, min, max));
    if (host.style.getPropertyValue('--juice-slider-ratio').trim() !== ratio) {
      host.style.setProperty('--juice-slider-ratio', ratio);
    }
  };

  const commitValue = (
    host: HTMLElement,
    value: number,
    snap: boolean
  ) => {
    const thumb = findOwnedThumb(host);
    if (!thumb || isDisabledSlider(host, thumb)) return;
    const bounds = readBounds(host, thumb);
    const next = clamp(
      snap ? snapToStep(value, bounds.min) : value,
      bounds.min,
      bounds.max
    );
    writeSlider(host, thumb, bounds.min, bounds.max, next);
  };

  const sync = () => {
    if (destroyed) return;

    getSliders().forEach((host) => {
      if (!isManagedSlider(host)) return;
      const thumb = findOwnedThumb(host);
      if (!thumb) return;
      const bounds = readBounds(host, thumb);
      writeSlider(host, thumb, bounds.min, bounds.max, bounds.value);
    });
  };

  const setValue = (value: number, target?: HTMLElement | null) => {
    if (!Number.isFinite(value)) return;
    const host = resolveSlider(target);
    if (!host) return;
    commitValue(host, value, false);
  };

  const getValue = (target?: HTMLElement | null) => {
    const host = resolveSlider(target);
    if (!host) return 0;
    const thumb = findOwnedThumb(host);
    if (!thumb) return 0;
    return readBounds(host, thumb).value;
  };

  const stepValue = (
    target: HTMLElement | null | undefined,
    delta: number
  ) => {
    const host = resolveSlider(target);
    if (!host) return;
    const thumb = findOwnedThumb(host);
    if (!thumb || isDisabledSlider(host, thumb)) return;
    const bounds = readBounds(host, thumb);
    commitValue(host, bounds.value + delta, false);
  };

  const moveToBound = (
    target: HTMLElement | null | undefined,
    edge: 'min' | 'max'
  ) => {
    const host = resolveSlider(target);
    if (!host) return;
    const thumb = findOwnedThumb(host);
    if (!thumb || isDisabledSlider(host, thumb)) return;
    const bounds = readBounds(host, thumb);
    commitValue(host, edge === 'min' ? bounds.min : bounds.max, false);
  };

  const clearDrag = () => {
    if (!drag) return;
    releasePointer(drag.thumb, drag.pointerId);
    drag = null;
  };

  const updateFromPointer = (
    host: HTMLElement,
    thumb: HTMLElement,
    clientX: number
  ) => {
    if (isDisabledSlider(host, thumb)) return;
    const bounds = readBounds(host, thumb);
    const next = valueFromClientX(host, thumb, clientX, bounds.min, bounds.max);
    writeSlider(host, thumb, bounds.min, bounds.max, next);
  };

  const handleRootPointerDown = (event: Event) => {
    if (!(event instanceof PointerEvent) || event.button !== 0) return;

    const target = event.target;
    if (!(target instanceof Element)) return;

    const host = resolveContainingSlider(
      target instanceof HTMLElement ? target : target.parentElement
    );
    if (!host) return;

    const thumb = findOwnedThumb(host);
    if (!thumb || isDisabledSlider(host, thumb)) return;
    if (drag) return;
    if (!claimEvent(event)) return;

    event.preventDefault();
    focusThumb(thumb);
    updateFromPointer(host, thumb, event.clientX);
    drag = { host, thumb, pointerId: event.pointerId };
    capturePointer(thumb, event.pointerId);
  };

  const handleRootPointerMove = (event: Event) => {
    if (!(event instanceof PointerEvent) || !drag) return;
    if (event.pointerId !== drag.pointerId) return;
    if (!isManagedSlider(drag.host)) {
      clearDrag();
      return;
    }
    if (!claimEvent(event)) return;

    event.preventDefault();
    updateFromPointer(drag.host, drag.thumb, event.clientX);
  };

  const handleRootPointerEnd = (event: Event) => {
    if (!(event instanceof PointerEvent) || !drag) return;
    if (event.pointerId !== drag.pointerId) return;
    claimEvent(event);
    clearDrag();
  };

  const handleRootKeydown = (event: Event) => {
    if (!(event instanceof KeyboardEvent)) return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.isComposing) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Element)) return;

    const origin =
      target instanceof HTMLElement ? target : target.parentElement;
    const host = resolveContainingSlider(origin);
    if (!host) return;

    const thumb = findOwnedThumb(host);
    if (!thumb || !origin || (origin !== thumb && !thumb.contains(origin))) {
      return;
    }
    if (isDisabledSlider(host, thumb)) return;

    let delta: number | null = null;
    let edge: 'min' | 'max' | null = null;

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        delta = -STEP;
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        delta = STEP;
        break;
      case 'PageDown':
        delta = -PAGE_STEP;
        break;
      case 'PageUp':
        delta = PAGE_STEP;
        break;
      case 'Home':
        edge = 'min';
        break;
      case 'End':
        edge = 'max';
        break;
      default:
        return;
    }

    if (!claimEvent(event)) return;
    event.preventDefault();

    if (edge) {
      moveToBound(thumb, edge);
      return;
    }

    if (delta != null) {
      stepValue(thumb, delta);
    }
  };

  let syncScheduled = false;
  const scheduleSync = () => {
    if (syncScheduled || destroyed) return;
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

  rootEvents.addEventListener('pointerdown', handleRootPointerDown);
  rootEvents.addEventListener('pointermove', handleRootPointerMove);
  rootEvents.addEventListener('pointerup', handleRootPointerEnd);
  rootEvents.addEventListener('pointercancel', handleRootPointerEnd);
  rootEvents.addEventListener('keydown', handleRootKeydown);

  if (observer && root instanceof Node) {
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        'slider',
        'slider-thumb',
        'role',
        'aria-valuemin',
        'aria-valuemax',
        'aria-valuenow',
        'aria-orientation',
        'aria-disabled',
        'aria-valuetext',
        'disabled',
        'tabindex',
        'type',
      ],
    });
  }

  sync();

  return {
    destroy: () => {
      destroyed = true;
      clearDrag();
      rootEvents.removeEventListener('pointerdown', handleRootPointerDown);
      rootEvents.removeEventListener('pointermove', handleRootPointerMove);
      rootEvents.removeEventListener('pointerup', handleRootPointerEnd);
      rootEvents.removeEventListener('pointercancel', handleRootPointerEnd);
      rootEvents.removeEventListener('keydown', handleRootKeydown);
      observer?.disconnect();
    },
    sync,
    setValue,
    getValue,
    increment: (target) => stepValue(target, STEP),
    decrement: (target) => stepValue(target, -STEP),
  };
};

export const initSlider = (options: SliderOptions = {}): SliderController =>
  createSlider(options);

let autoSliderController: SliderController | null = null;
let autoStartSuspended = false;
let bootOnReady: (() => void) | null = null;

const cancelDeferredAutoStart = () => {
  if (!bootOnReady || typeof document === 'undefined') return;
  document.removeEventListener('DOMContentLoaded', bootOnReady);
  bootOnReady = null;
};

export const startSliderRuntime = (): SliderController | null => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  autoStartSuspended = false;
  cancelDeferredAutoStart();

  if (autoSliderController) {
    autoSliderController.sync();
    return autoSliderController;
  }

  autoSliderController = createSlider();
  return autoSliderController;
};

export const stopSliderRuntime = () => {
  autoStartSuspended = true;
  cancelDeferredAutoStart();
  autoSliderController?.destroy();
  autoSliderController = null;
};

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    bootOnReady = () => {
      bootOnReady = null;
      if (!autoStartSuspended) {
        startSliderRuntime();
      }
    };
    document.addEventListener('DOMContentLoaded', bootOnReady);
  } else {
    startSliderRuntime();
  }
}
