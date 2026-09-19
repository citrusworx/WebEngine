/**
 * DOM-first dialog runtime for Juice modal chrome.
 *
 * Markup contract:
 *   [modal-overlay][hidden] > [modal role="dialog"] + [modal-close]
 * Closed vs open is the native `hidden` attribute on the overlay.
 *
 * Openers: any element whose `aria-controls` token list includes a
 * `[modal-overlay]` id. `[modal-close]` closes the containing overlay.
 * Backdrop click closes unless `modal-overlay="static"` or
 * `closeOnBackdrop` is false.
 */

export type ModalOptions = {
  root?: ParentNode;
  overlaySelector?: string;
  dialogSelector?: string;
  closeSelector?: string;
  closeOnBackdrop?: boolean;
};

export type ModalController = {
  destroy: () => void;
  sync: () => void;
  open: (target?: HTMLElement | null) => void;
  close: (target?: HTMLElement | null) => void;
  toggle: (target?: HTMLElement | null) => void;
};

const DEFAULT_ROOT: ParentNode =
  typeof document !== 'undefined' ? document : ({} as ParentNode);

const DEFAULTS: Required<ModalOptions> = {
  root: DEFAULT_ROOT,
  overlaySelector: '[modal-overlay]',
  dialogSelector: '[modal]',
  closeSelector: '[modal-close]',
  closeOnBackdrop: true,
};

const asArray = <T extends Element>(nodes: ArrayLike<T>): T[] =>
  Array.from(nodes);

const OVERLAY_ID_PREFIX = 'juice-modal-overlay';
const DIALOG_ID_PREFIX = 'juice-modal-dialog';
const TITLE_ID_PREFIX = 'juice-modal-title';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const handledEvents = new WeakSet<Event>();
const focusRestorers = new WeakMap<HTMLElement, HTMLElement>();

const claimEvent = (event: Event) => {
  if (handledEvents.has(event)) return false;
  handledEvents.add(event);
  return true;
};

const escapeId = (value: string) =>
  typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
    ? CSS.escape(value)
    : value;

const slugFromName = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'modal';

const isNativeInteractive = (element: HTMLElement) => {
  if (element instanceof HTMLButtonElement) return true;
  if (element instanceof HTMLAnchorElement) return element.hasAttribute('href');
  return false;
};

const controlIds = (element: HTMLElement) =>
  (element.getAttribute('aria-controls') ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

const isOverlayOpen = (overlay: HTMLElement) => !overlay.hasAttribute('hidden');

const isFocusableCandidate = (element: HTMLElement) => {
  if (element.closest('[hidden]')) return false;
  if (element.getAttribute('aria-hidden') === 'true') return false;
  if (element instanceof HTMLButtonElement && element.disabled) return false;
  if (element instanceof HTMLInputElement && element.disabled) return false;
  return true;
};

const getFocusable = (container: HTMLElement) =>
  asArray(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    isFocusableCandidate
  );

export const createModal = (options: ModalOptions = {}): ModalController => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      destroy: () => {},
      sync: () => {},
      open: () => {},
      close: () => {},
      toggle: () => {},
    };
  }

  const settings = { ...DEFAULTS, ...options };
  const root = settings.root ?? document;
  const rootEvents = root as ParentNode & EventTarget;

  let idCounter = 0;

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

  const resolveById = (id: string) => {
    const escaped = escapeId(id);
    if (root instanceof Document || root instanceof Element) {
      const local = root.querySelector<HTMLElement>(`#${escaped}`);
      if (local) return local;
    }
    const global = document.getElementById(id);
    return global instanceof HTMLElement ? global : null;
  };

  const isManagedOverlay = (element: HTMLElement | null | undefined) => {
    if (!element?.matches(settings.overlaySelector)) return false;
    if (root instanceof Document) return true;
    if (root instanceof Node) return root.contains(element);
    return getOverlays().includes(element);
  };

  const getDialog = (overlay: HTMLElement) => {
    const marked = asArray(
      overlay.querySelectorAll<HTMLElement>(settings.dialogSelector)
    ).find((dialog) => resolveContainingOverlay(dialog) === overlay);
    if (marked) return marked;

    const roleDialog = asArray(
      overlay.querySelectorAll<HTMLElement>('[role="dialog"]')
    ).find((dialog) => resolveContainingOverlay(dialog) === overlay);
    if (roleDialog) return roleDialog;

    const child = asArray(overlay.children).find(
      (node): node is HTMLElement => node instanceof HTMLElement
    );
    return child ?? overlay;
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
      getOverlays().find(isOverlayOpen) ??
      getOverlays()[0] ??
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
    const dialog = getDialog(overlay);
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

    if (dialog.getAttribute('aria-modal') !== 'true') {
      dialog.setAttribute('aria-modal', 'true');
    }

    if (
      !dialog.hasAttribute('aria-labelledby') &&
      !dialog.hasAttribute('aria-label')
    ) {
      const heading = dialog.querySelector<HTMLElement>(
        '[modal-header] :is(h1,h2,h3,h4,h5,h6), :is(h1,h2,h3,h4,h5,h6)'
      );
      if (heading) {
        if (!heading.id) {
          heading.id = base ? `${base}-title` : nextId(TITLE_ID_PREFIX);
        }
        dialog.setAttribute('aria-labelledby', heading.id);
      }
    }

    asArray(
      overlay.querySelectorAll<HTMLElement>(settings.closeSelector)
    )
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
    const dialog = getDialog(overlay);
    const autofocus = dialog.querySelector<HTMLElement>('[autofocus]');
    const focusable = getFocusable(dialog);
    const target =
      (autofocus && isFocusableCandidate(autofocus) ? autofocus : null) ??
      focusable[0] ??
      dialog;

    if (target === dialog && !dialog.hasAttribute('tabindex')) {
      dialog.setAttribute('tabindex', '-1');
    }

    target.focus();
  };

  const setOpenState = (overlay: HTMLElement, open: boolean) => {
    if (overlay.hidden === !open) return;
    overlay.hidden = !open;
  };

  const hideOverlay = (overlay: HTMLElement, restore: boolean) => {
    ensureDialogAccessibility(overlay);
    setOpenState(overlay, false);
    setOpenerState(overlay, false);
    if (restore) {
      restoreFocus(overlay);
    } else {
      focusRestorers.delete(overlay);
    }
  };

  const showOverlay = (
    overlay: HTMLElement,
    opener?: HTMLElement | null
  ) => {
    getOverlays()
      .concat(
        asArray(
          document.querySelectorAll<HTMLElement>(settings.overlaySelector)
        )
      )
      .forEach((other) => {
        if (other === overlay || !isOverlayOpen(other)) return;
        hideOverlay(other, false);
      });

    rememberRestorer(overlay, opener);
    ensureDialogAccessibility(overlay);
    setOpenState(overlay, true);
    setOpenerState(overlay, true);
    moveFocusIn(overlay);
  };

  const open = (target?: HTMLElement | null) => {
    const overlay = resolveOverlay(target);
    if (!overlay) return;
    if (isOverlayOpen(overlay)) {
      ensureDialogAccessibility(overlay);
      setOpenerState(overlay, true);
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
    if (!overlay || !isOverlayOpen(overlay)) return;
    hideOverlay(overlay, true);
  };

  const toggle = (target?: HTMLElement | null) => {
    const overlay = resolveOverlay(target);
    if (!overlay) return;
    if (isOverlayOpen(overlay)) {
      close(overlay);
      return;
    }
    open(target ?? overlay);
  };

  const sync = () => {
    getOverlays().forEach((overlay) => {
      ensureDialogAccessibility(overlay);
      setOpenerState(overlay, isOverlayOpen(overlay));
    });
  };

  const allowsBackdropClose = (overlay: HTMLElement) => {
    if (!settings.closeOnBackdrop) return false;
    return overlay.getAttribute('modal-overlay') !== 'static';
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
    const target = event.target;
    if (!(target instanceof Element)) return;

    const overlay = resolveContainingOverlay(
      target instanceof HTMLElement ? target : target.parentElement
    );

    if (overlay && isManagedOverlay(overlay)) {
      const closeControl =
        target.closest(settings.closeSelector) instanceof HTMLElement
          ? (target.closest(settings.closeSelector) as HTMLElement)
          : null;
      if (closeControl && resolveContainingOverlay(closeControl) === overlay) {
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
    if (!claimEvent(event)) return;
    toggle(opener);
  };

  const getOpenOverlay = () => getOverlays().find(isOverlayOpen) ?? null;

  const trapFocus = (event: KeyboardEvent, overlay: HTMLElement) => {
    if (event.key !== 'Tab') return false;

    const dialog = getDialog(overlay);
    const focusable = getFocusable(dialog);
    const current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    if (focusable.length === 0) {
      event.preventDefault();
      if (!dialog.hasAttribute('tabindex')) {
        dialog.setAttribute('tabindex', '-1');
      }
      dialog.focus();
      return true;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey) {
      if (!current || current === first || !dialog.contains(current)) {
        event.preventDefault();
        last.focus();
        return true;
      }
      return true;
    }

    if (!current || current === last || !dialog.contains(current)) {
      event.preventDefault();
      first.focus();
      return true;
    }

    return true;
  };

  const handleRootKeydown = (event: Event) => {
    if (!(event instanceof KeyboardEvent)) return;
    const target = event.target;
    if (!(target instanceof Element)) return;

    const openOverlay = getOpenOverlay();

    if (openOverlay && event.key === 'Escape') {
      if (!claimEvent(event)) return;
      event.preventDefault();
      event.stopPropagation();
      close(openOverlay);
      return;
    }

    if (openOverlay && event.key === 'Tab') {
      if (!claimEvent(event)) return;
      trapFocus(event, openOverlay);
      return;
    }

    if (event.key !== 'Enter' && event.key !== ' ') return;

    const closeControl = target.closest(settings.closeSelector);
    if (
      closeControl instanceof HTMLElement &&
      resolveContainingOverlay(closeControl) &&
      !isNativeInteractive(closeControl)
    ) {
      if (!claimEvent(event)) return;
      event.preventDefault();
      close(closeControl);
      return;
    }

    const opener = resolveOpenerFromEvent(target);
    if (!opener || isNativeInteractive(opener)) return;
    if (!claimEvent(event)) return;
    event.preventDefault();
    toggle(opener);
  };

  const handleFocusIn = (event: Event) => {
    const openOverlay = getOpenOverlay();
    if (!openOverlay) return;

    const target = event.target;
    if (!(target instanceof Node) || openOverlay.contains(target)) return;
    if (!claimEvent(event)) return;

    const dialog = getDialog(openOverlay);
    const focusable = getFocusable(dialog);
    (focusable[0] ?? dialog).focus();
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
  rootEvents.addEventListener('keydown', handleRootKeydown, true);
  rootEvents.addEventListener('focusin', handleFocusIn, true);

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
        'modal-overlay',
        'modal',
        'modal-close',
      ],
    });
  }

  sync();

  return {
    destroy: () => {
      rootEvents.removeEventListener('click', handleRootClick);
      rootEvents.removeEventListener('keydown', handleRootKeydown, true);
      rootEvents.removeEventListener('focusin', handleFocusIn, true);
      observer?.disconnect();
    },
    sync,
    open,
    close,
    toggle,
  };
};

export const initModal = (options: ModalOptions = {}): ModalController =>
  createModal(options);

let autoModalController: ModalController | null = null;
let autoStartSuspended = false;
let bootOnReady: (() => void) | null = null;

const cancelDeferredAutoStart = () => {
  if (!bootOnReady) return;
  document.removeEventListener('DOMContentLoaded', bootOnReady);
  bootOnReady = null;
};

export const startModalRuntime = (): ModalController | null => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  autoStartSuspended = false;
  cancelDeferredAutoStart();

  if (autoModalController) {
    autoModalController.sync();
    return autoModalController;
  }

  autoModalController = createModal();
  return autoModalController;
};

export const stopModalRuntime = () => {
  autoStartSuspended = true;
  cancelDeferredAutoStart();
  autoModalController?.destroy();
  autoModalController = null;
};

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    bootOnReady = () => {
      bootOnReady = null;
      if (!autoStartSuspended) {
        startModalRuntime();
      }
    };
    document.addEventListener('DOMContentLoaded', bootOnReady);
  } else {
    startModalRuntime();
  }
}
