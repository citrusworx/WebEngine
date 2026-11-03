/**
 * Internal binding from popover, menu, and combobox onto the layer stack.
 * Not a public export.
 *
 * Each open widget is one stack slot. push happens on open. pop happens
 * when the close commits, so a popover's in-flight exit stays the open
 * layer until `hidden` is set. Destroy drops the slot and does not
 * dismiss anything above it. These layers are not modal. Focus return
 * stays in the runtime.
 *
 * Outside pointerdown dismisses only the top layer. dismiss('outside')
 * hides the widget and removes the slot after the stack's pointer walk,
 * so a lower layer stays up. The click that follows that pointer is not
 * a second outside close. Openers that live outside the layer element
 * belong in containsTarget, so pressing the opener is not outside and
 * the click handler can still toggle.
 *
 * Toast and tooltip are not light layers. They stay off the stack.
 */

import {
  pushLayer,
  removeLayer,
  type LayerDismissReason,
  type LayerKind,
} from './layer-stack.js';

export type LightLayerController = {
  /** Stack an open widget. bringToTop re-pushes an existing slot to the top. */
  connect: (el: HTMLElement, bringToTop?: boolean) => void;
  /** Remove this slot without dismissing layers above it. */
  drop: (el: HTMLElement) => void;
  /** Pop this slot. Layers above it dismiss with reason 'cascade'. */
  pop: (el: HTMLElement) => void;
  /**
   * Pop after the current stack pointer walk. dismiss('outside') uses
   * this so the walk still sees this element on top and stops.
   */
  popAfterPointer: (el: HTMLElement) => void;
  /** Match the stack to widgets that are currently open. */
  reconcile: () => void;
  destroy: () => void;
};

type PopLayerHandle = (options?: { cascade?: boolean }) => void;

const handles = new Map<HTMLElement, PopLayerHandle>();

let outsideDismissed = false;
let gestureUsers = 0;

const resetGesture = () => {
  outsideDismissed = false;
};

const onWindowClick = () => {
  resetGesture();
};

/**
 * True when this click follows a stack outside-dismiss in the same
 * gesture. Click handlers skip a second outside close.
 */
export const lightOutsideAlreadyDismissed = () => outsideDismissed;

export const markLightOutsideDismissed = () => {
  outsideDismissed = true;
};

const retainGestureWatch = () => {
  if (gestureUsers === 0 && typeof window !== 'undefined') {
    window.addEventListener('click', onWindowClick);
  }
  gestureUsers += 1;
  return () => {
    gestureUsers = Math.max(0, gestureUsers - 1);
    if (gestureUsers === 0 && typeof window !== 'undefined') {
      window.removeEventListener('click', onWindowClick);
      resetGesture();
    }
  };
};

/** Clears the outside-dismiss snapshot and handle map. Test-only. */
export const __resetLightLayersForTests = () => {
  resetGesture();
  handles.clear();
};

export const createLightLayers = (config: {
  kind: Extract<LayerKind, 'popover' | 'menu' | 'combobox'>;
  getElements: () => readonly HTMLElement[];
  isOpen: (el: HTMLElement) => boolean;
  isClosing?: (el: HTMLElement) => boolean;
  containsTarget?: (el: HTMLElement, target: EventTarget | null) => boolean;
  dismiss: (el: HTMLElement, reason: LayerDismissReason) => void;
}): LightLayerController => {
  const owned = new Set<HTMLElement>();
  const releaseGesture = retainGestureWatch();

  const connect = (el: HTMLElement, bringToTop = false) => {
    const existing = handles.get(el);
    if (existing && bringToTop) {
      existing({ cascade: false });
      handles.delete(el);
      owned.delete(el);
    }

    const pop = pushLayer({
      el,
      kind: config.kind,
      modal: false,
      dismiss: (reason) => config.dismiss(el, reason),
      containsTarget: config.containsTarget
        ? (target) => config.containsTarget?.(el, target) ?? false
        : undefined,
    });
    handles.set(el, pop);
    owned.add(el);
  };

  const drop = (el: HTMLElement) => {
    owned.delete(el);
    const pop = handles.get(el);
    if (!pop) {
      removeLayer(el);
      return;
    }
    handles.delete(el);
    pop({ cascade: false });
  };

  const pop = (el: HTMLElement) => {
    owned.delete(el);
    const popLayer = handles.get(el);
    if (!popLayer) return;
    handles.delete(el);
    popLayer();
  };

  const popAfterPointer = (el: HTMLElement) => {
    const popLayer = handles.get(el);
    if (!popLayer) return;
    queueMicrotask(() => {
      if (handles.get(el) !== popLayer) return;
      pop(el);
    });
  };

  const reconcile = () => {
    const elements = config.getElements();
    const live = new Set(elements);

    for (const el of [...owned]) {
      if (!live.has(el) || !el.isConnected || !config.isOpen(el)) {
        drop(el);
      }
    }

    for (const el of elements) {
      if (!config.isOpen(el)) continue;
      if (config.isClosing?.(el)) continue;
      connect(el, false);
    }
  };

  const onPointerDown = () => {
    // A new press starts a new gesture. dismiss('outside') may set the
    // flag again before the click that follows this pointerdown.
    outsideDismissed = false;
    reconcile();
  };

  const onKeyDown = (event: Event) => {
    if (!(event instanceof KeyboardEvent) || event.key !== 'Escape') return;
    reconcile();
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('keydown', onKeyDown, true);
  }

  return {
    connect,
    drop,
    pop,
    popAfterPointer,
    reconcile,
    destroy: () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('pointerdown', onPointerDown, true);
        window.removeEventListener('keydown', onKeyDown, true);
      }
      for (const el of [...owned]) drop(el);
      releaseGesture();
    },
  };
};
