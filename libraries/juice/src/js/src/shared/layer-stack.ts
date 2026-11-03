/**
 * Internal open-order overlay stack. Not a public export.
 *
 * B1 does not wire this into any runtime. Escape still uses the
 * type-ranked queries in overlays.ts. Sheet keeps its own body scroll
 * lock. B2 will send modal, drawer, sheet, popover, menu, and combobox
 * through this stack so the last one opened owns Escape and outside
 * clicks. Toast and tooltip stay off the stack.
 *
 * Order is open time. The last push is the top. Pushing an element that
 * is already stacked refreshes that slot in place (kind, modal, dismiss,
 * focus opt-in, containsTarget). It does not move the slot and it does
 * not add a second entry. Pop it and push it again to bring it to the
 * top. Every pop function returned for that element closes the same
 * slot. Calling pop again is a no-op.
 *
 * pop() removes this entry without calling its dismiss, because the
 * caller is already closing it. Layers above it are dismissed first,
 * top-down, with reason 'outside', and then this entry is removed.
 * Pass { cascade: false } or call removeLayer(el) to drop one entry
 * with no dismiss calls and no focus return. That is the destroy path.
 *
 * Focus return is opt-in so a runtime that already restores focus does
 * not do it twice. Omit restoreFocus to skip it. Set restoreFocus to an
 * element or null to opt in. pop() focuses that opener when it is still
 * connected and is not inside a layer this pop closed. Otherwise it
 * focuses the new top layer's element, if one remains. The fallback
 * focuses that element itself, not a descendant. When the element has
 * no tabindex, the fallback sets tabindex="-1" so programmatic focus
 * works without putting the layer in tab order. An existing tabindex
 * is left as it is.
 *
 * One document keydown listener and one document pointerdown listener,
 * both capture, attach on the first push and detach when the stack is
 * empty. They call dismiss. They do not pop. dismiss must call the pop
 * function or removeLayer, or that layer stays on top. An outside
 * pointerdown walks from the top until a layer contains the target, or
 * through the whole stack when none do. If dismiss leaves the same
 * element on top, the walk stops.
 *
 * containsTarget is the portal seam. The default check is
 * el.contains(target). TODO(portal): a portaled panel is not a
 * descendant of el, so the runtime passes containsTarget that also
 * includes the portaled node.
 *
 * acquireScrollLock is a ref-counted inline body overflow lock for
 * sheet to adopt later. Modal and drawer do not lock scroll in S3.
 * The first acquire saves body.style.overflow and sets 'hidden'. The
 * last release restores the saved inline value. Release is idempotent.
 * A stylesheet overflow is not read or written.
 *
 * Every function no-ops when document is undefined.
 * __resetLayerStackForTests is for unit tests, not the public entry.
 */

export type LayerKind =
  | 'modal'
  | 'drawer'
  | 'sheet'
  | 'popover'
  | 'menu'
  | 'combobox';

export type LayerDismissReason = 'escape' | 'outside';

export interface LayerEntry {
  el: HTMLElement;
  kind: LayerKind;
  modal: boolean;
  dismiss(reason: LayerDismissReason): void;
  /**
   * Opt in to stack-managed focus return. Omit the property when the
   * runtime restores focus itself. null opts in with no opener.
   */
  restoreFocus?: HTMLElement | null;
  /**
   * Portal seam. Default containment is el.contains(target).
   * TODO(portal): include the portaled node here. It is not inside el.
   */
  containsTarget?: (target: EventTarget | null) => boolean;
}

export type PopLayerOptions = {
  /**
   * When false, remove this entry only. Do not dismiss layers above it
   * and do not run focus return. Default true.
   */
  cascade?: boolean;
};

export type PopLayer = (options?: PopLayerOptions) => void;

const layers: LayerEntry[] = [];

let listening = false;
let scrollLocks = 0;
let savedOverflow: string | null = null;
let scrollEpoch = 0;

const hasDocument = () => typeof document !== 'undefined';

const snapshot = (entry: LayerEntry): LayerEntry => {
  const copy: LayerEntry = {
    el: entry.el,
    kind: entry.kind,
    modal: entry.modal,
    dismiss: entry.dismiss,
  };

  if (Object.hasOwn(entry, 'restoreFocus')) {
    copy.restoreFocus = entry.restoreFocus ?? null;
  }

  if (entry.containsTarget) {
    copy.containsTarget = entry.containsTarget;
  }

  return copy;
};

const layerContains = (layer: LayerEntry, target: EventTarget | null) => {
  if (layer.containsTarget) return layer.containsTarget(target);
  return target instanceof Node && layer.el.contains(target);
};

const focusLayerElement = (el: HTMLElement) => {
  if (!el.isConnected) return;
  if (!el.hasAttribute('tabindex')) {
    el.setAttribute('tabindex', '-1');
  }
  el.focus();
};

const restoreFocusTo = (entry: LayerEntry, closed: readonly LayerEntry[]) => {
  if (!Object.hasOwn(entry, 'restoreFocus')) return;

  const opener = entry.restoreFocus ?? null;
  if (
    opener &&
    opener.isConnected &&
    closed.every((layer) => !layer.el.contains(opener))
  ) {
    opener.focus();
    return;
  }

  const next = layers[layers.length - 1];
  if (!next) return;
  focusLayerElement(next.el);
};

const detach = () => {
  if (!listening) return;
  if (hasDocument()) {
    document.removeEventListener('keydown', onKeyDown, true);
    document.removeEventListener('pointerdown', onPointerDown, true);
  }
  listening = false;
};

const attach = () => {
  if (listening || !hasDocument()) return;
  document.addEventListener('keydown', onKeyDown, true);
  document.addEventListener('pointerdown', onPointerDown, true);
  listening = true;
};

const popLayer = (el: HTMLElement, options?: PopLayerOptions) => {
  if (!hasDocument()) return;

  const index = layers.findIndex((layer) => layer.el === el);
  if (index === -1) return;

  if (options?.cascade === false) {
    layers.splice(index, 1);
    if (layers.length === 0) detach();
    return;
  }

  const removed = layers.splice(index);
  const self = removed[0];

  try {
    for (let cursor = removed.length - 1; cursor >= 1; cursor -= 1) {
      removed[cursor]?.dismiss('outside');
    }
  } finally {
    if (self) restoreFocusTo(self, removed);
    if (layers.length === 0) detach();
  }
};

function onKeyDown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || event.defaultPrevented || event.isComposing) {
    return;
  }

  const top = layers[layers.length - 1];
  if (!top) return;

  try {
    top.dismiss('escape');
  } finally {
    event.preventDefault();
    event.stopPropagation();
  }
}

function onPointerDown(event: PointerEvent) {
  const target = event.target;
  const limit = layers.length + 1;

  for (let step = 0; step < limit && layers.length > 0; step += 1) {
    const top = layers[layers.length - 1];
    if (!top || layerContains(top, target)) return;

    const topEl = top.el;
    top.dismiss('outside');

    if (layers[layers.length - 1]?.el === topEl) return;
  }
}

export const pushLayer = (entry: LayerEntry): PopLayer => {
  if (!hasDocument()) return () => {};

  const next = snapshot(entry);
  const index = layers.findIndex((layer) => layer.el === next.el);

  if (index === -1) layers.push(next);
  else layers[index] = next;

  attach();

  return (options) => popLayer(next.el, options);
};

export const removeLayer = (el: HTMLElement) => {
  popLayer(el, { cascade: false });
};

export const topLayer = (): LayerEntry | null => {
  if (!hasDocument()) return null;
  return layers[layers.length - 1] ?? null;
};

export const isTopLayer = (el: HTMLElement) => {
  if (!hasDocument()) return false;
  return topLayer()?.el === el;
};

export const topModalLayer = (): LayerEntry | null => {
  if (!hasDocument()) return null;

  for (let index = layers.length - 1; index >= 0; index -= 1) {
    const layer = layers[index];
    if (layer?.modal) return layer;
  }

  return null;
};

export const acquireScrollLock = (): (() => void) => {
  if (!hasDocument() || document.body == null) return () => {};

  if (scrollLocks === 0) {
    savedOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }

  scrollLocks += 1;
  const epoch = scrollEpoch;
  let released = false;

  return () => {
    if (released || epoch !== scrollEpoch) return;
    released = true;
    scrollLocks = Math.max(0, scrollLocks - 1);

    if (scrollLocks > 0) return;
    if (!hasDocument() || document.body == null) {
      savedOverflow = null;
      return;
    }

    document.body.style.overflow = savedOverflow ?? '';
    savedOverflow = null;
  };
};

/** Clears stack, listeners, and scroll-lock state. Test-only. */
export const __resetLayerStackForTests = () => {
  layers.length = 0;
  detach();

  if (
    scrollLocks > 0 &&
    hasDocument() &&
    document.body != null &&
    savedOverflow !== null
  ) {
    document.body.style.overflow = savedOverflow;
  }

  scrollLocks = 0;
  savedOverflow = null;
  scrollEpoch += 1;
};
