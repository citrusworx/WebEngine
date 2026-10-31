/**
 * DOM-first dialog runtime for Juice sheet chrome.
 *
 * Markup contract (slice A — do not rename attrs):
 *   [sheet-overlay][hidden] > [sheet role="dialog"]
 *     [sheet-handle] [sheet-header] [sheet-body] [sheet-footer] [sheet-close]
 * Closed vs open is the native `hidden` attribute on the overlay.
 * Enter removes `hidden`, then plays. Exit plays first; `hidden` is set
 * only after it finishes. Focus moves in when a modal `hidden` is removed
 * and restores when that `hidden` is set. Reduced motion (or a zero
 * computed duration) does both in the same turn. An in-flight exit stays
 * the open dialog for Escape and the focus trap until that commit, and a
 * new open of that same overlay cancels it.
 *
 * Openers: any element whose `aria-controls` token list includes a
 * `[sheet-overlay]` id. `[sheet-close]` closes the containing overlay.
 * Backdrop click closes unless `sheet-overlay="static"` or
 * `closeOnBackdrop` is false. `sheet-overlay="none"` is non-modal: no
 * focus trap, no scroll lock, no backdrop close. Escape still closes.
 *
 * Scroll lock is modal only (boolean / omitted / "static"). A shared
 * counter locks `document.body` overflow on the first modal sheet and
 * restores the previous inline overflow when the last one closes, so
 * nested and sibling modal sheets do not unlock early. Several sheets
 * may be open together. This runtime does not close siblings.
 *
 * Detents. `sheet-detents` on `[sheet]` is the allowed set (`~=` words).
 * Absent, or with no known word, the set is "half full". Rank is
 * peek < half < full. On open the sheet rests at half when half is
 * allowed, otherwise full when full is allowed, otherwise peek — the
 * same rest slice A paints when `[detent]` is absent. `[detent]` is
 * written whenever that rest changes. An already-open sheet keeps a
 * valid `[detent]` until a gesture, the keyboard, or an open transition
 * replaces it.
 *
 * Drag. Pointer events on `[sheet-handle]` and `[sheet-header]` track
 * the finger after an 8px slop. `[sheet-body]` hands off only when
 * `scrollTop` is 0 and the gesture moves down. `[dragging]` is set on
 * the sheet and `data-motion-state` is `entered` for the gesture so the
 * enter/exit animation does not fight the inline height. The finger is
 * followed with inline height, plus `translateY` rubber-band (0.35 of
 * the overflow) past the highest detent and below the lowest. Reduced
 * motion clamps that visual and does not rubber-band; the logical
 * height still tracks so a close can commit. Release snaps by projecting
 * the logical height with velocity over 180ms and choosing the nearest
 * allowed detent. Downward velocity of at least 0.5px/ms at or below the
 * lowest detent, or a logical height more than 80px below it, closes.
 * `pointercancel` drops the gesture and restores the detent it started
 * on. Inline height/transform clear on the next frame after a snap so
 * the detent height transition can run.
 *
 * Keyboard. A MutationObserver on `documentElement` attributes watches
 * `[keyboard-open]`. While a sheet is open, gaining that attribute snaps
 * it to `full` when full is allowed, otherwise the highest detent.
 * Opening while the attribute is already set uses that same rest.
 *
 * State is `{ open, detent, dragging, modal }`. `juice:change` bubbles
 * from the overlay with `detail.runtime === "sheet"`. The first
 * observation is silent. Disabled (`disabled` / `aria-disabled="true"`)
 * and invalid hosts (an overlay with no `[sheet]`) are ignored.
 * Back button history is out of scope.
 *
 * Sheet is the thirty-second Emerging auto-enhance runtime.
 */

import { createJuiceChanges } from '../shared/change.js';
import { createEventClaim } from '../shared/events.js';
import { getFocusable, moveFocusInto, wrapTabFocus } from '../shared/focus.js';
import { controlIds, resolveElementById } from '../shared/ids.js';
import { createElementMotion, prefersReducedMotion } from '../shared/motion.js';

export type SheetDetent = 'peek' | 'half' | 'full';

export type SheetOptions = {
  root?: ParentNode;
  overlaySelector?: string;
  dialogSelector?: string;
  closeSelector?: string;
  handleSelector?: string;
  headerSelector?: string;
  bodySelector?: string;
  closeOnBackdrop?: boolean;
};

export type SheetState = {
  open: boolean;
  detent: SheetDetent;
  dragging: boolean;
  modal: boolean;
};

export type SheetController = {
  destroy: () => void;
  sync: () => void;
  open: (target?: HTMLElement | null) => void;
  close: (target?: HTMLElement | null) => void;
  toggle: (target?: HTMLElement | null) => void;
  isOpen: (target?: HTMLElement | null) => boolean;
  getState: (target?: HTMLElement | null) => SheetState | null;
};

const DETENT_RANK: SheetDetent[] = ['peek', 'half', 'full'];

const DETENT_VAR: Record<SheetDetent, string> = {
  peek: '--juice-sheet-peek',
  half: '--juice-sheet-half',
  full: '--juice-sheet-full',
};

const DRAG_SLOP_PX = 8;
const FLICK_VELOCITY = 0.5;
const FLICK_SAMPLE_MS = 120;
const PROJECT_MS = 180;
const CLOSE_PAST_PX = 80;
const RUBBER_BAND = 0.35;

const DEFAULT_ROOT: ParentNode =
  typeof document !== 'undefined' ? document : ({} as ParentNode);

const DEFAULTS: Required<SheetOptions> = {
  root: DEFAULT_ROOT,
  overlaySelector: '[sheet-overlay]',
  dialogSelector: '[sheet]',
  closeSelector: '[sheet-close]',
  handleSelector: '[sheet-handle]',
  headerSelector: '[sheet-header]',
  bodySelector: '[sheet-body]',
  closeOnBackdrop: true,
};

const asArray = <T extends Element>(nodes: ArrayLike<T>): T[] =>
  Array.from(nodes);

const OVERLAY_ID_PREFIX = 'juice-sheet-overlay';
const DIALOG_ID_PREFIX = 'juice-sheet-dialog';
const TITLE_ID_PREFIX = 'juice-sheet-title';

const claimEvent = createEventClaim();
const focusRestorers = new WeakMap<HTMLElement, HTMLElement>();

const modalLockHolds = new Map<HTMLElement, number>();
let modalLockCount = 0;
let savedBodyOverflow: string | null = null;

const slugFromName = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'sheet';

const isNativeInteractive = (element: HTMLElement) => {
  if (element instanceof HTMLButtonElement) return true;
  if (element instanceof HTMLAnchorElement) return element.hasAttribute('href');
  return false;
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

const isOverlayOpen = (overlay: HTMLElement) => !overlay.hasAttribute('hidden');

const isClosing = (overlay: HTMLElement) =>
  overlay.getAttribute('data-motion-state') === 'exiting';

const isModalOverlay = (overlay: HTMLElement) =>
  overlay.getAttribute('sheet-overlay') !== 'none';

const keyboardIsOpen = () =>
  document.documentElement.hasAttribute('keyboard-open');

const parseLength = (raw: string, basis: number): number | null => {
  const value = raw.trim();
  if (!value) return null;
  const px = /^(-?\d*\.?\d+)px$/.exec(value);
  if (px) return Number(px[1]);
  const vh = /^(-?\d*\.?\d+)(vh|dvh)$/.exec(value);
  if (vh) return (Number(vh[1]) / 100) * basis;
  const rem = /^(-?\d*\.?\d+)rem$/.exec(value);
  if (rem) {
    const root = Number.parseFloat(
      getComputedStyle(document.documentElement).fontSize
    );
    const font = Number.isFinite(root) && root > 0 ? root : 16;
    return Number(rem[1]) * font;
  }
  return null;
};

const viewportHeight = () => {
  const height = window.innerHeight;
  return Number.isFinite(height) && height > 0 ? height : 800;
};

const readCustomLength = (
  element: HTMLElement,
  name: string,
  fallback: number
) => {
  let raw = '';
  try {
    raw = getComputedStyle(element).getPropertyValue(name);
  } catch {
    raw = '';
  }
  const parsed = parseLength(raw, viewportHeight());
  return parsed != null && parsed > 0 ? parsed : fallback;
};

const fallbackDetentHeight = (detent: SheetDetent) => {
  const vh = viewportHeight();
  if (detent === 'peek') return vh * 0.25;
  if (detent === 'half') return vh * 0.5;
  const offset = readCustomLength(document.documentElement, '--juice-sheet-offset', 24);
  return Math.max(0, vh - offset);
};

const allowedDetents = (sheet: HTMLElement): SheetDetent[] => {
  if (!sheet.hasAttribute('sheet-detents')) return ['half', 'full'];
  const words = (sheet.getAttribute('sheet-detents') ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const allowed = DETENT_RANK.filter((detent) => words.includes(detent));
  return allowed.length > 0 ? allowed : ['half', 'full'];
};

const defaultDetent = (allowed: readonly SheetDetent[]): SheetDetent => {
  if (allowed.includes('half')) return 'half';
  if (allowed.includes('full')) return 'full';
  return allowed[0] ?? 'peek';
};

const keyboardDetent = (allowed: readonly SheetDetent[]): SheetDetent => {
  if (allowed.includes('full')) return 'full';
  return allowed[allowed.length - 1] ?? 'full';
};

const restingDetent = (allowed: readonly SheetDetent[]): SheetDetent =>
  keyboardIsOpen() ? keyboardDetent(allowed) : defaultDetent(allowed);

const readDetentAttr = (
  sheet: HTMLElement,
  allowed: readonly SheetDetent[]
): SheetDetent | null => {
  const value = sheet.getAttribute('detent');
  if (value === 'peek' || value === 'half' || value === 'full') {
    return allowed.includes(value) ? value : null;
  }
  return null;
};

const resolvedDetent = (sheet: HTMLElement): SheetDetent => {
  const allowed = allowedDetents(sheet);
  return readDetentAttr(sheet, allowed) ?? restingDetent(allowed);
};

const pruneDisconnectedLocks = () => {
  for (const overlay of [...modalLockHolds.keys()]) {
    if (overlay.isConnected) continue;
    modalLockHolds.delete(overlay);
    modalLockCount = Math.max(0, modalLockCount - 1);
  }
  if (modalLockCount === 0 && savedBodyOverflow !== null) {
    document.body.style.overflow = savedBodyOverflow;
    savedBodyOverflow = null;
  }
};

const retainModalLock = (overlay: HTMLElement) => {
  pruneDisconnectedLocks();
  const next = (modalLockHolds.get(overlay) ?? 0) + 1;
  modalLockHolds.set(overlay, next);
  if (next !== 1) return;
  if (modalLockCount === 0) {
    savedBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  modalLockCount += 1;
};

const releaseModalLock = (overlay: HTMLElement) => {
  const current = modalLockHolds.get(overlay) ?? 0;
  if (current === 0) return;
  if (current === 1) {
    modalLockHolds.delete(overlay);
    modalLockCount = Math.max(0, modalLockCount - 1);
    if (modalLockCount === 0) {
      document.body.style.overflow = savedBodyOverflow ?? '';
      savedBodyOverflow = null;
    }
    return;
  }
  modalLockHolds.set(overlay, current - 1);
};

type Sample = { y: number; t: number };

type DragSession = {
  overlay: HTMLElement;
  sheet: HTMLElement;
  pointerId: number;
  startY: number;
  startHeight: number;
  origin: 'chrome' | 'body';
  committed: boolean;
  detent: SheetDetent;
  samples: Sample[];
};

const velocityOf = (samples: Sample[]) => {
  if (samples.length < 2) return 0;
  const last = samples[samples.length - 1];
  if (!last) return 0;
  let firstIndex = samples.length - 1;
  for (let index = samples.length - 2; index >= 0; index -= 1) {
    const sample = samples[index];
    if (!sample) continue;
    if (last.t - sample.t > FLICK_SAMPLE_MS) break;
    firstIndex = index;
  }
  if (firstIndex === samples.length - 1) firstIndex = samples.length - 2;
  const first = samples[firstIndex];
  if (!first) return 0;
  const dt = last.t - first.t;
  if (dt <= 0) return 0;
  return (last.y - first.y) / dt;
};

const formatPx = (value: number) => `${Math.round(value * 100) / 100}px`;

export const createSheet = (options: SheetOptions = {}): SheetController => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      destroy: () => {},
      sync: () => {},
      open: () => {},
      close: () => {},
      toggle: () => {},
      isOpen: () => false,
      getState: () => null,
    };
  }

  const settings = { ...DEFAULTS, ...options };
  const root = settings.root ?? document;
  const rootEvents = root as ParentNode & EventTarget;
  const motion = createElementMotion();
  const changes = createJuiceChanges<SheetState>('sheet');
  const heldLocks = new Set<HTMLElement>();

  let idCounter = 0;
  let destroyed = false;
  let drag: DragSession | null = null;
  let suppressClick = false;

  const nextId = (prefix: string) => {
    idCounter += 1;
    return `${prefix}-${idCounter}`;
  };

  const getOverlays = () =>
    asArray(root.querySelectorAll<HTMLElement>(settings.overlaySelector));

  const resolveContainingOverlay = (element: HTMLElement | null | undefined) => {
    if (!element) return null;
    const overlay = element.closest(settings.overlaySelector);
    return overlay instanceof HTMLElement ? overlay : null;
  };

  const resolveById = (id: string) => resolveElementById(id, root);

  const isManagedOverlay = (element: HTMLElement | null | undefined) => {
    if (!element?.matches(settings.overlaySelector)) return false;
    if (root instanceof Document) return true;
    if (root instanceof Node) return root.contains(element);
    return getOverlays().includes(element);
  };

  const findSheet = (overlay: HTMLElement) => {
    const marked = asArray(
      overlay.querySelectorAll<HTMLElement>(settings.dialogSelector)
    ).find((dialog) => resolveContainingOverlay(dialog) === overlay);
    return marked ?? null;
  };

  const isActiveHost = (overlay: HTMLElement) => {
    const sheet = findSheet(overlay);
    if (!sheet) return false;
    if (isDisabled(overlay) || isDisabled(sheet)) return false;
    return true;
  };

  const resolveOverlayFromControls = (element: HTMLElement) => {
    if (resolveContainingOverlay(element)) return null;

    for (const id of controlIds(element)) {
      const candidate = resolveById(id);
      if (candidate && isManagedOverlay(candidate)) {
        return candidate;
      }
    }

    return null;
  };

  const resolveOverlay = (target?: HTMLElement | null) => {
    if (target) {
      if (isManagedOverlay(target)) return target;

      const containing = resolveContainingOverlay(target);
      if (containing && isManagedOverlay(containing)) return containing;

      if (target.matches(settings.closeSelector)) {
        const fromClose = resolveContainingOverlay(target);
        if (fromClose && isManagedOverlay(fromClose)) return fromClose;
      }

      const fromControls = resolveOverlayFromControls(target);
      if (fromControls) return fromControls;

      const closestOpener = target.closest('[aria-controls]');
      if (closestOpener instanceof HTMLElement) {
        const fromClosest = resolveOverlayFromControls(closestOpener);
        if (fromClosest) return fromClosest;
      }
    }

    return (
      getOverlays().find((overlay) => isOverlayOpen(overlay) && findSheet(overlay)) ??
      getOverlays().find((overlay) => findSheet(overlay)) ??
      null
    );
  };

  const namedBase = (overlay: HTMLElement) => {
    const name = overlay.getAttribute('name');
    if (name) return slugFromName(name);
    if (overlay.id) return slugFromName(overlay.id);
    return null;
  };

  const getOpeners = (overlay: HTMLElement) => {
    if (!overlay.id) return [];
    return asArray(document.querySelectorAll<HTMLElement>('[aria-controls]')).filter(
      (element) => {
        if (resolveContainingOverlay(element)) return false;
        return controlIds(element).includes(overlay.id);
      }
    );
  };

  const setOpenerState = (overlay: HTMLElement, expanded: boolean) => {
    const expandedValue = String(expanded);
    getOpeners(overlay).forEach((opener) => {
      if (opener.getAttribute('aria-expanded') !== expandedValue) {
        opener.setAttribute('aria-expanded', expandedValue);
      }
      if (!opener.hasAttribute('aria-haspopup')) {
        opener.setAttribute('aria-haspopup', 'dialog');
      }
    });
  };

  const ensureDialogAccessibility = (overlay: HTMLElement) => {
    const dialog = findSheet(overlay);
    if (!dialog) return;
    const base = namedBase(overlay);

    if (!overlay.id) {
      overlay.id = base ? `${base}-overlay` : nextId(OVERLAY_ID_PREFIX);
    }

    if (!dialog.id) {
      dialog.id = base ? `${base}-dialog` : nextId(DIALOG_ID_PREFIX);
    }

    if (dialog.getAttribute('role') !== 'dialog') {
      dialog.setAttribute('role', 'dialog');
    }

    const modalValue = isModalOverlay(overlay) ? 'true' : 'false';
    if (dialog.getAttribute('aria-modal') !== modalValue) {
      dialog.setAttribute('aria-modal', modalValue);
    }

    if (
      !dialog.hasAttribute('aria-labelledby') &&
      !dialog.hasAttribute('aria-label')
    ) {
      const headings = asArray(
        dialog.querySelectorAll<HTMLElement>(':is(h1,h2,h3,h4,h5,h6)')
      ).filter((node) => resolveContainingOverlay(node) === overlay);
      const heading =
        headings.find((node) => node.closest(settings.headerSelector)) ??
        headings[0];
      if (heading) {
        if (!heading.id) {
          heading.id = base ? `${base}-title` : nextId(TITLE_ID_PREFIX);
        }
        dialog.setAttribute('aria-labelledby', heading.id);
      }
    }

    asArray(overlay.querySelectorAll<HTMLElement>(settings.closeSelector))
      .filter((close) => resolveContainingOverlay(close) === overlay)
      .forEach((close) => {
        if (!isNativeInteractive(close)) {
          close.setAttribute('role', 'button');
          if (!close.hasAttribute('tabindex')) {
            close.setAttribute('tabindex', '0');
          }
        }
        if (
          !close.hasAttribute('aria-label') &&
          !close.hasAttribute('aria-labelledby') &&
          !close.textContent?.trim()
        ) {
          close.setAttribute('aria-label', 'Close');
        }
      });

    getOpeners(overlay).forEach((opener) => {
      if (!isNativeInteractive(opener)) {
        opener.setAttribute('role', 'button');
        if (!opener.hasAttribute('tabindex')) {
          opener.setAttribute('tabindex', '0');
        }
      }
      if (!opener.hasAttribute('aria-haspopup')) {
        opener.setAttribute('aria-haspopup', 'dialog');
      }
      if (!opener.hasAttribute('aria-expanded')) {
        opener.setAttribute('aria-expanded', String(isOverlayOpen(overlay)));
      }
    });
  };

  const readState = (overlay: HTMLElement): SheetState | null => {
    const sheet = findSheet(overlay);
    if (!sheet) return null;
    return {
      open: isOverlayOpen(overlay),
      detent: resolvedDetent(sheet),
      dragging: sheet.hasAttribute('dragging'),
      modal: isModalOverlay(overlay),
    };
  };

  const publish = (overlay: HTMLElement, baseline?: SheetState) => {
    const state = readState(overlay);
    if (!state) return;
    changes.note(overlay, state, baseline ? { baseline } : undefined);
  };

  const writeDetent = (sheet: HTMLElement, detent: SheetDetent) => {
    if (sheet.getAttribute('detent') !== detent) {
      sheet.setAttribute('detent', detent);
    }
  };

  const clearInlineMotion = (sheet: HTMLElement) => {
    sheet.style.height = '';
    sheet.style.transform = '';
  };

  const detentHeight = (sheet: HTMLElement, detent: SheetDetent) =>
    readCustomLength(sheet, DETENT_VAR[detent], fallbackDetentHeight(detent));

  const measureHeight = (sheet: HTMLElement, detent: SheetDetent) => {
    const laidOut = sheet.getBoundingClientRect().height;
    if (laidOut > 0) return laidOut;
    const inline = parseLength(sheet.style.height, viewportHeight());
    if (inline != null && inline > 0) return inline;
    return detentHeight(sheet, detent);
  };

  const heightMap = (sheet: HTMLElement, allowed: readonly SheetDetent[]) => {
    const heights = {} as Record<SheetDetent, number>;
    allowed.forEach((detent) => {
      heights[detent] = detentHeight(sheet, detent);
    });
    return heights;
  };

  const nearestDetent = (
    height: number,
    allowed: readonly SheetDetent[],
    heights: Record<SheetDetent, number>
  ) => {
    let best = allowed[0] ?? 'half';
    let bestDist = Number.POSITIVE_INFINITY;
    allowed.forEach((detent) => {
      const dist = Math.abs(heights[detent] - height);
      if (dist < bestDist) {
        best = detent;
        bestDist = dist;
      }
    });
    return best;
  };

  const lockModal = (overlay: HTMLElement) => {
    if (!isModalOverlay(overlay)) return;
    if (heldLocks.has(overlay)) return;
    heldLocks.add(overlay);
    retainModalLock(overlay);
  };

  const unlockModal = (overlay: HTMLElement) => {
    if (!heldLocks.has(overlay)) return;
    heldLocks.delete(overlay);
    releaseModalLock(overlay);
  };

  const rememberRestorer = (
    overlay: HTMLElement,
    opener?: HTMLElement | null
  ) => {
    const active =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const restorer =
      opener && !overlay.contains(opener)
        ? opener
        : active && !overlay.contains(active)
          ? active
          : null;
    if (restorer) {
      focusRestorers.set(overlay, restorer);
    }
  };

  const restoreFocus = (overlay: HTMLElement) => {
    const restorer = focusRestorers.get(overlay);
    focusRestorers.delete(overlay);
    if (restorer?.isConnected) {
      restorer.focus();
    }
  };

  const moveFocusIn = (overlay: HTMLElement) => {
    const dialog = findSheet(overlay);
    if (!dialog) return;
    moveFocusInto(dialog);
  };

  const finishDragVisual = (sheet: HTMLElement, immediate: boolean) => {
    if (sheet.hasAttribute('dragging')) {
      sheet.removeAttribute('dragging');
    }
    const clear = () => {
      if (sheet.hasAttribute('dragging')) return;
      clearInlineMotion(sheet);
    };
    if (immediate || prefersReducedMotion()) {
      clear();
      return;
    }
    requestAnimationFrame(clear);
  };

  const endDrag = (mode: 'snap' | 'cancel' | 'close') => {
    const session = drag;
    drag = null;
    if (!session) return;
    const { overlay, sheet, detent: startDetent, committed } = session;
    if (!committed) return;

    suppressClick = true;
    const allowed = allowedDetents(sheet);
    const heights = heightMap(sheet, allowed);
    const lowest = allowed[0] ?? startDetent;
    const highest = allowed[allowed.length - 1] ?? startDetent;
    const last = session.samples[session.samples.length - 1];
    const rawHeight = last
      ? session.startHeight + (session.startY - last.y)
      : session.startHeight;
    const velocity = velocityOf(session.samples);

    if (mode === 'cancel') {
      writeDetent(sheet, startDetent);
      finishDragVisual(sheet, true);
      publish(overlay);
      return;
    }

    const lowestHeight = heights[lowest] ?? session.startHeight;
    const pastLowest = rawHeight < lowestHeight - CLOSE_PAST_PX;
    const flungDown =
      velocity >= FLICK_VELOCITY && rawHeight <= lowestHeight + DRAG_SLOP_PX;
    if (mode === 'close' || pastLowest || flungDown) {
      finishDragVisual(sheet, true);
      publish(overlay);
      hideOverlay(overlay, true);
      return;
    }

    const projected = rawHeight - velocity * PROJECT_MS;
    const target = keyboardIsOpen()
      ? keyboardDetent(allowed)
      : nearestDetent(
          Math.min(
            Math.max(projected, heights[lowest] ?? projected),
            heights[highest] ?? projected
          ),
          allowed,
          heights
        );
    writeDetent(sheet, target);
    finishDragVisual(sheet, false);
    publish(overlay);
  };

  const hideOverlay = (overlay: HTMLElement, restore: boolean) => {
    if (!findSheet(overlay)) return;
    if (!isOverlayOpen(overlay) || isClosing(overlay)) return;
    if (drag?.overlay === overlay) {
      const session = drag;
      drag = null;
      if (session.committed) {
        finishDragVisual(session.sheet, true);
      }
    }

    ensureDialogAccessibility(overlay);
    const modal = isModalOverlay(overlay);
    motion.exit(overlay, () => {
      const baseline = readState(overlay);
      overlay.hidden = true;
      setOpenerState(overlay, false);
      unlockModal(overlay);
      if (baseline) publish(overlay, baseline);
      else publish(overlay);
      if (restore && modal) {
        restoreFocus(overlay);
      } else {
        focusRestorers.delete(overlay);
      }
    });
  };

  const showOverlay = (overlay: HTMLElement, opener?: HTMLElement | null) => {
    const sheet = findSheet(overlay);
    if (!sheet || !isActiveHost(overlay)) return;

    const baseline = readState(overlay) ?? undefined;
    if (isModalOverlay(overlay)) {
      rememberRestorer(overlay, opener);
    } else {
      focusRestorers.delete(overlay);
    }
    ensureDialogAccessibility(overlay);
    writeDetent(sheet, restingDetent(allowedDetents(sheet)));
    if (overlay.hidden) overlay.hidden = false;
    setOpenerState(overlay, true);
    if (isModalOverlay(overlay)) {
      lockModal(overlay);
      moveFocusIn(overlay);
    } else {
      unlockModal(overlay);
    }
    if (baseline) publish(overlay, baseline);
    else publish(overlay);
    motion.enter(overlay);
  };

  const open = (target?: HTMLElement | null) => {
    const overlay = resolveOverlay(target);
    if (!overlay || !isActiveHost(overlay)) return;
    if (isOverlayOpen(overlay) && !isClosing(overlay)) {
      ensureDialogAccessibility(overlay);
      setOpenerState(overlay, true);
      const sheet = findSheet(overlay);
      if (sheet && !readDetentAttr(sheet, allowedDetents(sheet))) {
        writeDetent(sheet, restingDetent(allowedDetents(sheet)));
        publish(overlay);
      }
      return;
    }

    const opener =
      target && resolveOverlayFromControls(target) === overlay
        ? target
        : target?.closest('[aria-controls]') instanceof HTMLElement &&
            resolveOverlayFromControls(
              target.closest('[aria-controls]') as HTMLElement
            ) === overlay
          ? (target.closest('[aria-controls]') as HTMLElement)
          : null;

    showOverlay(overlay, opener);
  };

  const close = (target?: HTMLElement | null) => {
    const overlay = resolveOverlay(target);
    if (!overlay || !findSheet(overlay)) return;
    if (!isOverlayOpen(overlay) || isClosing(overlay)) return;
    hideOverlay(overlay, true);
  };

  const toggle = (target?: HTMLElement | null) => {
    const overlay = resolveOverlay(target);
    if (!overlay || !isActiveHost(overlay)) return;
    if (isOverlayOpen(overlay) && !isClosing(overlay)) {
      close(overlay);
      return;
    }
    open(target ?? overlay);
  };

  const isOpen = (target?: HTMLElement | null) => {
    const overlay = resolveOverlay(target);
    if (!overlay || !findSheet(overlay)) return false;
    return isOverlayOpen(overlay);
  };

  const getState = (target?: HTMLElement | null): SheetState | null => {
    const overlay = resolveOverlay(target);
    if (!overlay) return null;
    return readState(overlay);
  };

  const reconcileLock = (overlay: HTMLElement) => {
    if (isOverlayOpen(overlay) && isModalOverlay(overlay)) {
      lockModal(overlay);
      return;
    }
    unlockModal(overlay);
  };

  const sync = () => {
    if (destroyed) return;
    pruneDisconnectedLocks();
    for (const overlay of [...heldLocks]) {
      if (!overlay.isConnected) heldLocks.delete(overlay);
    }
    getOverlays().forEach((overlay) => {
      const sheet = findSheet(overlay);
      if (!sheet) return;
      ensureDialogAccessibility(overlay);
      setOpenerState(overlay, isOverlayOpen(overlay));
      reconcileLock(overlay);
      if (
        isOverlayOpen(overlay) &&
        !isClosing(overlay) &&
        !sheet.hasAttribute('dragging') &&
        !readDetentAttr(sheet, allowedDetents(sheet))
      ) {
        writeDetent(sheet, restingDetent(allowedDetents(sheet)));
      }
      publish(overlay);
    });
  };

  const allowsBackdropClose = (overlay: HTMLElement) => {
    if (!settings.closeOnBackdrop) return false;
    if (!isModalOverlay(overlay)) return false;
    return overlay.getAttribute('sheet-overlay') !== 'static';
  };

  const resolveOpenerFromEvent = (target: Element) => {
    if (!(target instanceof HTMLElement)) return null;
    if (resolveContainingOverlay(target)) return null;

    if (resolveOverlayFromControls(target)) return target;

    const closest = target.closest('[aria-controls]');
    if (closest instanceof HTMLElement && resolveOverlayFromControls(closest)) {
      return closest;
    }

    return null;
  };

  const handleRootClick = (event: Event) => {
    if (suppressClick) {
      suppressClick = false;
      if (claimEvent(event)) {
        event.preventDefault();
        event.stopPropagation();
      }
      return;
    }

    const target = event.target;
    if (!(target instanceof Element)) return;

    const overlay = resolveContainingOverlay(
      target instanceof HTMLElement ? target : target.parentElement
    );

    if (overlay && isManagedOverlay(overlay)) {
      if (!isActiveHost(overlay) && !findSheet(overlay)) return;
      const closeControl =
        target.closest(settings.closeSelector) instanceof HTMLElement
          ? (target.closest(settings.closeSelector) as HTMLElement)
          : null;
      if (closeControl && resolveContainingOverlay(closeControl) === overlay) {
        if (!isActiveHost(overlay)) return;
        if (!claimEvent(event)) return;
        close(overlay);
        return;
      }

      if (target === overlay && allowsBackdropClose(overlay)) {
        if (!claimEvent(event)) return;
        close(overlay);
      }
      return;
    }

    const opener = resolveOpenerFromEvent(target);
    if (!opener) return;
    const destination = resolveOverlayFromControls(opener);
    if (!destination || !isActiveHost(destination)) return;
    if (!claimEvent(event)) return;
    toggle(opener);
  };

  const topmost = (predicate: (overlay: HTMLElement) => boolean) => {
    const open = getOverlays().filter(
      (overlay) => isOverlayOpen(overlay) && findSheet(overlay) && predicate(overlay)
    );
    const active = open.filter((overlay) => !isClosing(overlay));
    const pool = active.length > 0 ? active : open;
    return pool[pool.length - 1] ?? null;
  };

  const trapFocus = (event: KeyboardEvent, overlay: HTMLElement) => {
    const dialog = findSheet(overlay);
    if (!dialog) return;
    wrapTabFocus(event, dialog);
  };

  const handleRootKeydown = (event: Event) => {
    if (!(event instanceof KeyboardEvent)) return;
    const target = event.target;
    if (!(target instanceof Element)) return;

    const openOverlay = topmost(() => true);
    const modalOverlay = topmost(isModalOverlay);

    if (openOverlay && event.key === 'Escape') {
      if (!isActiveHost(openOverlay)) return;
      if (!claimEvent(event)) return;
      event.preventDefault();
      event.stopPropagation();
      close(openOverlay);
      return;
    }

    if (
      modalOverlay &&
      openOverlay === modalOverlay &&
      event.key === 'Tab'
    ) {
      if (!claimEvent(event)) return;
      trapFocus(event, modalOverlay);
      return;
    }

    if (event.key !== 'Enter' && event.key !== ' ') return;

    const closeControl = target.closest(settings.closeSelector);
    if (
      closeControl instanceof HTMLElement &&
      resolveContainingOverlay(closeControl) &&
      !isNativeInteractive(closeControl)
    ) {
      const owner = resolveContainingOverlay(closeControl);
      if (!owner || !isActiveHost(owner)) return;
      if (!claimEvent(event)) return;
      event.preventDefault();
      close(closeControl);
      return;
    }

    const opener = resolveOpenerFromEvent(target);
    if (!opener || isNativeInteractive(opener)) return;
    const destination = resolveOverlayFromControls(opener);
    if (!destination || !isActiveHost(destination)) return;
    if (!claimEvent(event)) return;
    event.preventDefault();
    toggle(opener);
  };

  const handleFocusIn = (event: Event) => {
    const openOverlay = topmost(() => true);
    if (!openOverlay || !isModalOverlay(openOverlay) || isClosing(openOverlay)) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Node) || openOverlay.contains(target)) return;
    if (!claimEvent(event)) return;

    const dialog = findSheet(openOverlay);
    if (!dialog) return;
    const focusable = getFocusable(dialog);
    (focusable[0] ?? dialog).focus();
  };

  const gestureOrigin = (target: Element, sheet: HTMLElement) => {
    if (target.closest(settings.closeSelector)) return null;
    const handle = target.closest(settings.handleSelector);
    if (handle instanceof HTMLElement && sheet.contains(handle)) return 'chrome' as const;
    const header = target.closest(settings.headerSelector);
    if (header instanceof HTMLElement && sheet.contains(header)) return 'chrome' as const;
    const body = target.closest(settings.bodySelector);
    if (body instanceof HTMLElement && sheet.contains(body)) return 'body' as const;
    return null;
  };

  const applyDragVisual = (
    sheet: HTMLElement,
    rawHeight: number,
    minHeight: number,
    maxHeight: number
  ) => {
    let height = rawHeight;
    let translate = 0;
    const reduced = prefersReducedMotion();
    if (rawHeight > maxHeight) {
      const extra = rawHeight - maxHeight;
      height = maxHeight;
      translate = reduced ? 0 : -(extra * RUBBER_BAND);
    } else if (rawHeight < minHeight) {
      const extra = minHeight - rawHeight;
      height = minHeight;
      translate = reduced ? 0 : extra * RUBBER_BAND;
    }
    sheet.style.height = formatPx(height);
    sheet.style.transform = translate === 0 ? '' : `translateY(${formatPx(translate)})`;
  };

  const commitDrag = (session: DragSession) => {
    if (session.committed) return;
    session.committed = true;
    motion.cancel(session.overlay);
    if (!session.sheet.hasAttribute('dragging')) {
      session.sheet.setAttribute('dragging', '');
    }
    session.overlay.setAttribute('data-motion-state', 'entered');
    publish(session.overlay);
  };

  const handlePointerDown = (event: Event) => {
    if (!(event instanceof PointerEvent) || event.button !== 0) return;
    if (drag) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    const originNode =
      target instanceof HTMLElement ? target : target.parentElement;
    const overlay = resolveContainingOverlay(originNode);
    if (!overlay || !isManagedOverlay(overlay) || !isActiveHost(overlay)) return;
    if (!isOverlayOpen(overlay) || isClosing(overlay)) return;
    const sheet = findSheet(overlay);
    if (!sheet) return;
    const origin = gestureOrigin(target, sheet);
    if (!origin) return;
    if (origin === 'body') {
      const body = target.closest(settings.bodySelector);
      if (!(body instanceof HTMLElement) || body.scrollTop > 0) return;
    }
    if (!claimEvent(event)) return;

    const detent = resolvedDetent(sheet);
    drag = {
      overlay,
      sheet,
      pointerId: event.pointerId,
      startY: event.clientY,
      startHeight: measureHeight(sheet, detent),
      origin,
      committed: false,
      detent,
      samples: [{ y: event.clientY, t: performance.now() }],
    };
  };

  const handlePointerMove = (event: Event) => {
    if (!(event instanceof PointerEvent) || !drag) return;
    if (event.pointerId !== drag.pointerId) return;
    if (!drag.sheet.isConnected || !isOverlayOpen(drag.overlay)) {
      endDrag('cancel');
      return;
    }

    const dy = event.clientY - drag.startY;
    if (!drag.committed) {
      if (Math.abs(dy) < DRAG_SLOP_PX) return;
      if (drag.origin === 'body' && dy <= 0) {
        drag = null;
        return;
      }
      commitDrag(drag);
    }

    if (!claimEvent(event)) return;
    event.preventDefault();
    drag.samples.push({ y: event.clientY, t: performance.now() });
    if (drag.samples.length > 20) drag.samples.shift();

    const allowed = allowedDetents(drag.sheet);
    const heights = heightMap(drag.sheet, allowed);
    const lowest = allowed[0];
    const highest = allowed[allowed.length - 1];
    if (!lowest || !highest) return;
    const rawHeight = drag.startHeight + (drag.startY - event.clientY);
    applyDragVisual(
      drag.sheet,
      rawHeight,
      heights[lowest],
      heights[highest]
    );
  };

  const handlePointerUp = (event: Event) => {
    if (!(event instanceof PointerEvent) || !drag) return;
    if (event.pointerId !== drag.pointerId) return;
    claimEvent(event);
    drag.samples.push({ y: event.clientY, t: performance.now() });
    endDrag('snap');
  };

  const handlePointerCancel = (event: Event) => {
    if (!(event instanceof PointerEvent) || !drag) return;
    if (event.pointerId !== drag.pointerId) return;
    claimEvent(event);
    endDrag('cancel');
  };

  const snapOpenSheetsForKeyboard = () => {
    if (!keyboardIsOpen()) return;
    getOverlays().forEach((overlay) => {
      if (!isOverlayOpen(overlay) || isClosing(overlay)) return;
      const sheet = findSheet(overlay);
      if (!sheet || sheet.hasAttribute('dragging')) return;
      const next = keyboardDetent(allowedDetents(sheet));
      if (sheet.getAttribute('detent') === next) return;
      clearInlineMotion(sheet);
      writeDetent(sheet, next);
      publish(overlay);
    });
  };

  let syncScheduled = false;
  const scheduleSync = () => {
    if (syncScheduled || destroyed) return;
    syncScheduled = true;

    requestAnimationFrame(() => {
      syncScheduled = false;
      if (destroyed) return;
      sync();
    });
  };

  const observer =
    typeof MutationObserver !== 'undefined'
      ? new MutationObserver(() => scheduleSync())
      : null;

  const keyboardObserver =
    typeof MutationObserver !== 'undefined'
      ? new MutationObserver(() => snapOpenSheetsForKeyboard())
      : null;

  rootEvents.addEventListener('click', handleRootClick);
  rootEvents.addEventListener('keydown', handleRootKeydown, true);
  rootEvents.addEventListener('focusin', handleFocusIn, true);
  rootEvents.addEventListener('pointerdown', handlePointerDown);
  document.addEventListener('pointermove', handlePointerMove);
  document.addEventListener('pointerup', handlePointerUp);
  document.addEventListener('pointercancel', handlePointerCancel);

  if (observer && root instanceof Node) {
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        'hidden',
        'aria-controls',
        'aria-labelledby',
        'aria-modal',
        'aria-disabled',
        'disabled',
        'sheet-overlay',
        'sheet',
        'sheet-close',
        'sheet-detents',
        'detent',
        'dragging',
      ],
    });
  }

  keyboardObserver?.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['keyboard-open'],
  });

  sync();

  return {
    destroy: () => {
      destroyed = true;
      if (drag?.committed) finishDragVisual(drag.sheet, true);
      drag = null;
      rootEvents.removeEventListener('click', handleRootClick);
      rootEvents.removeEventListener('keydown', handleRootKeydown, true);
      rootEvents.removeEventListener('focusin', handleFocusIn, true);
      rootEvents.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerCancel);
      observer?.disconnect();
      keyboardObserver?.disconnect();
      motion.destroy();
      for (const overlay of [...heldLocks]) unlockModal(overlay);
    },
    sync,
    open,
    close,
    toggle,
    isOpen,
    getState,
  };
};

export const initSheet = (options: SheetOptions = {}): SheetController =>
  createSheet(options);

let autoSheetController: SheetController | null = null;
let autoStartSuspended = false;
let bootOnReady: (() => void) | null = null;

const cancelDeferredAutoStart = () => {
  if (!bootOnReady) return;
  document.removeEventListener('DOMContentLoaded', bootOnReady);
  bootOnReady = null;
};

export const startSheetRuntime = (): SheetController | null => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  autoStartSuspended = false;
  cancelDeferredAutoStart();

  if (autoSheetController) {
    autoSheetController.sync();
    return autoSheetController;
  }

  autoSheetController = createSheet();
  return autoSheetController;
};

export const stopSheetRuntime = () => {
  autoStartSuspended = true;
  cancelDeferredAutoStart();
  autoSheetController?.destroy();
  autoSheetController = null;
};

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    bootOnReady = () => {
      bootOnReady = null;
      if (!autoStartSuspended) {
        startSheetRuntime();
      }
    };
    document.addEventListener('DOMContentLoaded', bootOnReady);
  } else {
    startSheetRuntime();
  }
}
