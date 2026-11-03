/**
 * Internal binding from modal, drawer, and sheet onto the layer stack.
 * Not a public export.
 *
 * Each open overlay is one stack slot. push happens on open. pop happens
 * when the close commits (hidden is set), so an in-flight exit stays the
 * open dialog until then. Destroy drops the slot with no dismiss.
 * Replacing an open dialog pops it, so layers above dismiss top-down with
 * reason 'cascade'. The focus trap belongs to a runtime only when its
 * overlay is the top of the stack and that layer is modal. A non-modal
 * sheet on top suspends the trap until it closes.
 *
 * A backdrop press is a pointer whose target is the overlay element.
 * The stack treats that press as outside every layer that does not
 * contain the target, so a lower backdrop dismisses only the top dialog.
 * The top dialog's own backdrop is inside its layer; the runtime closes
 * that one from click, and only if it was the top layer when the press
 * began. Presses on openers or the rest of the page are not backdrop
 * presses, so they do not dismiss a dialog.
 */

import {
  pushLayer,
  removeLayer,
  topLayer,
  type LayerDismissReason,
  type LayerKind,
} from './layer-stack.js';

export type DialogLayerController = {
  /** Stack an open overlay. bringToTop re-pushes an existing slot to the top. */
  connect: (overlay: HTMLElement, bringToTop?: boolean) => void;
  /** Remove this slot without dismissing layers above it. */
  drop: (overlay: HTMLElement) => void;
  /** Pop this slot. Layers above it dismiss with reason 'cascade'. */
  pop: (overlay: HTMLElement) => void;
  /** Match the stack to overlays that are currently open. */
  reconcile: () => void;
  destroy: () => void;
};

const backdropSelectors = new Map<string, number>();

const retainBackdropSelector = (selector: string) => {
  backdropSelectors.set(selector, (backdropSelectors.get(selector) ?? 0) + 1);
  return () => {
    const next = (backdropSelectors.get(selector) ?? 1) - 1;
    if (next <= 0) backdropSelectors.delete(selector);
    else backdropSelectors.set(selector, next);
  };
};

const isBackdropTarget = (target: EventTarget | null) => {
  if (!(target instanceof Element)) return false;
  for (const selector of backdropSelectors.keys()) {
    try {
      if (target.matches(selector)) return true;
    } catch {
      // A runtime registered a selector the DOM cannot match.
    }
  }
  return false;
};

let pointerSeen = false;
let pointerTop: HTMLElement | null = null;
let backdropPress = false;
let gestureUsers = 0;

const resetGesture = () => {
  pointerSeen = false;
  pointerTop = null;
  backdropPress = false;
};

const notePointer = (event: Event) => {
  pointerSeen = true;
  pointerTop = topLayer()?.el ?? null;
  backdropPress = isBackdropTarget(event.target);
};

const onWindowClick = () => {
  resetGesture();
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

/**
 * Top layer when the pointer went down, before the stack dismissed anyone.
 * undefined when this click was not preceded by a pointerdown. Callers
 * then read the live top, which is what click-only tests dispatch.
 */
export const backdropPressTop = (): HTMLElement | null | undefined => {
  if (!pointerSeen) return undefined;
  return pointerTop;
};

/**
 * True when the latest pointerdown target is a dialog overlay element.
 * Dialog dismiss('outside') ignores every other press.
 */
export const outsidePressIsBackdrop = () => backdropPress;

/** Clears the backdrop-press snapshot. Test-only. */
export const __resetDialogLayersForTests = () => {
  resetGesture();
};

export const createDialogLayers = (config: {
  kind: Extract<LayerKind, 'modal' | 'drawer' | 'sheet'>;
  selector: string;
  getOverlays: () => readonly HTMLElement[];
  isOpen: (overlay: HTMLElement) => boolean;
  isClosing: (overlay: HTMLElement) => boolean;
  isModal: (overlay: HTMLElement) => boolean;
  shouldStack: (overlay: HTMLElement) => boolean;
  dismiss: (overlay: HTMLElement, reason: LayerDismissReason) => void;
}): DialogLayerController => {
  const pops = new Map<HTMLElement, PopLayerHandle>();
  const releaseSelector = retainBackdropSelector(config.selector);
  const releaseGesture = retainGestureWatch();

  const connect = (overlay: HTMLElement, bringToTop = false) => {
    if (!config.shouldStack(overlay)) {
      drop(overlay);
      return;
    }

    const existing = pops.get(overlay);
    if (existing && bringToTop) {
      existing({ cascade: false });
      pops.delete(overlay);
    }

    const pop = pushLayer({
      el: overlay,
      kind: config.kind,
      modal: config.isModal(overlay),
      dismiss: (reason) => config.dismiss(overlay, reason),
    });
    pops.set(overlay, pop);
  };

  const drop = (overlay: HTMLElement) => {
    const pop = pops.get(overlay);
    pops.delete(overlay);
    if (pop) pop({ cascade: false });
    else removeLayer(overlay);
  };

  const pop = (overlay: HTMLElement) => {
    const popLayer = pops.get(overlay);
    if (!popLayer) return;
    pops.delete(overlay);
    popLayer();
  };

  const reconcile = () => {
    const overlays = config.getOverlays();
    const live = new Set(overlays);

    for (const overlay of [...pops.keys()]) {
      if (!live.has(overlay) || !overlay.isConnected || !config.isOpen(overlay)) {
        drop(overlay);
      }
    }

    for (const overlay of overlays) {
      if (!config.isOpen(overlay)) continue;
      if (!config.shouldStack(overlay)) {
        if (pops.has(overlay)) drop(overlay);
        continue;
      }
      if (config.isClosing(overlay)) continue;
      connect(overlay, false);
    }
  };

  const onPointerDown = (event: Event) => {
    reconcile();
    notePointer(event);
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
    reconcile,
    destroy: () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('pointerdown', onPointerDown, true);
        window.removeEventListener('keydown', onKeyDown, true);
      }
      for (const overlay of [...pops.keys()]) drop(overlay);
      releaseSelector();
      releaseGesture();
    },
  };
};

type PopLayerHandle = (options?: { cascade?: boolean }) => void;
