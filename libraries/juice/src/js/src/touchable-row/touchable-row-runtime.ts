/**
 * DOM-first runtime for Juice touchable-row chrome.
 *
 * Markup contract (Slice A — do not rename attrs):
 *   [touchable-row]              host. Any value is still a row. Words
 *                                compose, same as the CSS: dense,
 *                                chevron, undivided, plus the two words
 *                                this runtime owns.
 *   [touchable-row~="select"]    opt-in. Activation toggles selection.
 *                                Absent, the row does not toggle.
 *                                getState().selected still reports the
 *                                CSS selected state.
 *   [touchable-row~="activate"]  explicit opt-in for keyboard chrome
 *                                when the row is not [pressable] and
 *                                not selectable. See below.
 *   [selected]                   selected signal, with aria-selected
 *                                or aria-current. CSS paints the start
 *                                bar from any of the three.
 *   [pressable]                  press feedback stays on Pressable.
 *                                This runtime does not set [pressed].
 *
 * Why those words, and not [touchable-row-select]: dense, chevron,
 * and undivided already compose on the host attribute. Selection and
 * the keyboard opt-in are host behavior, not slots.
 * [touchable-row-leading], [touchable-row-content], [touchable-row-title],
 * [touchable-row-subtitle], and [touchable-row-trailing] are the parts.
 * A [touchable-row-select] attribute would read as another part.
 *
 * Keyboard activation:
 *   Enter or Space on a non-native host (not `a` or `button`) dispatches
 *   one bubbling click. Repeat keydowns do not. Enter is never
 *   preventDefault'd. Space is preventDefault'd only on those
 *   non-native hosts, so the page does not scroll (the same reason as
 *   the Pressable Space fix, applied to every li/div row rather than
 *   only to a button-like role). Native `a` and `button` already
 *   activate from the platform — Enter on a link, Enter and Space on
 *   a button — and this runtime does not dispatch a second click and
 *   does not preventDefault Space on them. An `<a>` without href is
 *   still native: give it an href, or use a div with select / activate
 *   / pressable. An editing host is left alone so Space can type.
 *   A [menuitem] host (the attribute, or a menuitem role) is left
 *   alone on the key. The menu runtime owns Enter and Space and clicks
 *   the item once. This runtime still sees that click.
 *
 *   Keys and clicks that start in an interactive descendant do not
 *   activate the row, so a trailing control works on its own. The
 *   descendant is a button, a, input, textarea, select, summary,
 *   [switch], [icon-button], [menuitem], an editing host, or an
 *   element whose first role token is button, switch, checkbox, radio,
 *   link, menuitem, menuitemcheckbox, menuitemradio, option, tab,
 *   textbox, searchbox, combobox, slider, or spinbutton.
 *
 * Role and tabindex:
 *   A plain row is a layout shell. Sync does not give it a role or a
 *   tabindex, or it would enter the tab order just by being drawn.
 *   Chrome is added only when the row is interactive, the author has
 *   not set that attribute, the host is not native, and the host is
 *   not a menuitem:
 *     [pressable]                   the row is a press target
 *     [touchable-row~="select"]     the row toggles selection
 *     [touchable-row~="activate"]   explicit opt-in
 *   The added role is "button" and the added tabindex is "0". An
 *   author role or tabindex is kept, including role="link". Native
 *   links and buttons already have a platform role and tab stop.
 *   Menuitems keep the role the menu runtime writes. A disabled row
 *   is not given a tab stop it did not already have. Destroy does
 *   not remove a role or tabindex this runtime added.
 *
 * Selection:
 *   Independent toggles. There is no single-select group. List has
 *   no runtime, and its [selected] wash is author state. Tabs are a
 *   different widget (panels and a roving tabindex). Radio groups use
 *   the native name on inputs. This row has no container. Activating
 *   one selectable row does not clear its siblings.
 *   Activation is the click, including the click this runtime
 *   dispatches for a non-native host. The written signal is [selected]
 *   plus aria-selected on a host that is not a link, or aria-current
 *   on `a` and role="link". CSS treats aria-current other than "false"
 *   as selected, which is the link-shaped signal. Turning a row off
 *   clears [selected] and writes the chosen aria attribute to "false",
 *   and clears the other aria signal when that signal is still
 *   selected, so one toggle fully unselects the row. Rows without
 *   [touchable-row~="select"] do not toggle.
 *
 * Long-press:
 *   Not implemented here. A row with [pressable][pressable-longpress]
 *   uses Pressable's juice:longpress. Pressable suppresses the click
 *   that follows a long-press on the capture phase (preventDefault
 *   and stopPropagation) unless that event was canceled. Selection
 *   listens for click on the bubble phase, so the suppressed click
 *   never toggles. A later click does.
 *
 * Disabled:
 *   :disabled (the disabled property), [disabled], and
 *   [aria-disabled="true"] are ignored entirely. No click is
 *   synthesized, selection does not change, and the attempt does not
 *   dispatch juice:change.
 *
 * State is { selected, disabled }. selected is the CSS selected
 * state, not the select word. The first observation is recorded and
 * does not dispatch. Later changes dispatch a bubbling juice:change
 * CustomEvent with detail { runtime: "touchable-row", state }.
 *
 * No Sig TouchableRow factory. Touchable-row is the thirtieth
 * Emerging auto-enhance runtime.
 */

import { createJuiceChanges } from '../shared/change.js';
import { createEventClaim } from '../shared/events.js';

export type TouchableRowOptions = {
  root?: ParentNode;
  touchableRowSelector?: string;
};

export type TouchableRowState = {
  selected: boolean;
  disabled: boolean;
};

export type TouchableRowController = {
  destroy: () => void;
  sync: () => void;
  getState: (target?: HTMLElement | null) => TouchableRowState | null;
};

const DEFAULT_ROOT: ParentNode =
  typeof document !== 'undefined' ? document : ({} as ParentNode);

const DEFAULTS: Required<TouchableRowOptions> = {
  root: DEFAULT_ROOT,
  touchableRowSelector: '[touchable-row]',
};

const asArray = <T extends Element>(nodes: ArrayLike<T>): T[] =>
  Array.from(nodes);

const claimEvent = createEventClaim();

const INTERACTIVE_ROLES = new Set([
  'button',
  'switch',
  'checkbox',
  'radio',
  'link',
  'menuitem',
  'menuitemcheckbox',
  'menuitemradio',
  'option',
  'tab',
  'textbox',
  'searchbox',
  'combobox',
  'slider',
  'spinbutton',
]);

const MENU_ITEM_ROLES = new Set(['menuitem', 'menuitemcheckbox', 'menuitemradio']);

const isActivationKey = (key: string) =>
  key === 'Enter' || key === ' ' || key === 'Spacebar';

const isSpaceKey = (key: string) => key === ' ' || key === 'Spacebar';

const firstRole = (element: HTMLElement) => {
  const role = element.getAttribute('role');
  if (!role) return '';
  const token = role.trim().toLowerCase().split(/\s+/)[0];
  return token ?? '';
};

const hasWord = (element: HTMLElement, word: string) => {
  const value = element.getAttribute('touchable-row');
  if (!value) return false;
  return value.split(/\s+/).includes(word);
};

const isSelectable = (element: HTMLElement) => hasWord(element, 'select');

const isExplicitActivate = (element: HTMLElement) => hasWord(element, 'activate');

const isInteractiveChrome = (element: HTMLElement) =>
  element.hasAttribute('pressable') ||
  isSelectable(element) ||
  isExplicitActivate(element);

const isNativeHost = (element: HTMLElement) =>
  element instanceof HTMLButtonElement || element instanceof HTMLAnchorElement;

const isEditingHost = (element: HTMLElement) => {
  if (element.isContentEditable) return true;
  const value = element.getAttribute('contenteditable');
  if (value === null) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === '' || normalized === 'true' || normalized === 'plaintext-only';
};

const isMenuItem = (element: HTMLElement) =>
  element.hasAttribute('menuitem') || MENU_ITEM_ROLES.has(firstRole(element));

const usesCurrent = (element: HTMLElement) =>
  element instanceof HTMLAnchorElement || firstRole(element) === 'link';

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

const isInteractiveControl = (element: HTMLElement) => {
  const tag = element.tagName;
  if (
    tag === 'A' ||
    tag === 'BUTTON' ||
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    tag === 'SUMMARY'
  ) {
    return true;
  }
  if (
    element.hasAttribute('switch') ||
    element.hasAttribute('icon-button') ||
    element.hasAttribute('menuitem')
  ) {
    return true;
  }
  if (isEditingHost(element)) return true;
  return INTERACTIVE_ROLES.has(firstRole(element));
};

const readSelected = (element: HTMLElement) => {
  if (element.hasAttribute('selected')) return true;
  if (element.getAttribute('aria-selected') === 'true') return true;
  const current = element.getAttribute('aria-current');
  return current !== null && current !== 'false';
};

const readState = (element: HTMLElement): TouchableRowState => ({
  selected: readSelected(element),
  disabled: isDisabled(element),
});

const writeSelected = (element: HTMLElement, selected: boolean) => {
  if (selected) element.setAttribute('selected', '');
  else element.removeAttribute('selected');

  if (usesCurrent(element)) {
    const next = selected ? 'true' : 'false';
    if (element.getAttribute('aria-current') !== next) {
      element.setAttribute('aria-current', next);
    }
    if (!selected && element.getAttribute('aria-selected') === 'true') {
      element.setAttribute('aria-selected', 'false');
    }
    return;
  }

  const next = selected ? 'true' : 'false';
  if (element.getAttribute('aria-selected') !== next) {
    element.setAttribute('aria-selected', next);
  }
  if (!selected) {
    const current = element.getAttribute('aria-current');
    if (current !== null && current !== 'false') {
      element.setAttribute('aria-current', 'false');
    }
  }
};

const eventElement = (target: EventTarget | null) => {
  if (target instanceof HTMLElement) return target;
  if (target instanceof Node) return target.parentElement;
  return null;
};

const noopController = (): TouchableRowController => ({
  destroy: () => {},
  sync: () => {},
  getState: () => null,
});

export const createTouchableRow = (
  options: TouchableRowOptions = {}
): TouchableRowController => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return noopController();
  }

  const settings = { ...DEFAULTS, ...options };
  const root = settings.root ?? document;
  const rootEvents = root as ParentNode & EventTarget;
  const changes = createJuiceChanges<TouchableRowState>('touchable-row');
  let destroyed = false;
  let syncing = false;

  const isManaged = (element: HTMLElement | null | undefined) => {
    if (!(element instanceof HTMLElement)) return false;
    if (!element.matches(settings.touchableRowSelector)) return false;
    if (root instanceof Document) return true;
    if (root instanceof Node) return root === element || root.contains(element);
    return false;
  };

  const getHosts = () => {
    const found = asArray(
      root.querySelectorAll<HTMLElement>(settings.touchableRowSelector)
    ).filter(isManaged);

    if (root instanceof HTMLElement && isManaged(root)) {
      return [root, ...found.filter((host) => host !== root)];
    }

    return found;
  };

  const resolveRow = (target?: HTMLElement | null) => {
    if (target) {
      if (isManaged(target)) return target;
      const containing = target.closest(settings.touchableRowSelector);
      if (containing instanceof HTMLElement && isManaged(containing)) {
        return containing;
      }
      return null;
    }

    return getHosts()[0] ?? null;
  };

  const rowFromEvent = (target: EventTarget | null) => {
    const element = eventElement(target);
    if (!element) return null;
    const host = element.closest(settings.touchableRowSelector);
    if (!(host instanceof HTMLElement) || !isManaged(host)) return null;

    let current: HTMLElement | null = element;
    while (current && current !== host) {
      if (isInteractiveControl(current)) return null;
      current = current.parentElement;
    }

    return host;
  };

  const ensureChrome = (element: HTMLElement) => {
    if (isNativeHost(element) || isMenuItem(element) || isDisabled(element)) return;
    if (!isInteractiveChrome(element)) return;
    if (!element.hasAttribute('role')) element.setAttribute('role', 'button');
    if (!element.hasAttribute('tabindex')) element.setAttribute('tabindex', '0');
  };

  const toggleSelected = (host: HTMLElement) => {
    const before = readState(host);
    ensureChrome(host);
    writeSelected(host, !readSelected(host));
    // Rebase before publishing. The other controller may already have
    // written this host, and note() would treat a return to its stale
    // snapshot as no change.
    changes.adopt(host, before);
    changes.note(host, readState(host));
  };

  const sync = () => {
    if (destroyed || syncing) return;
    syncing = true;
    try {
      getHosts().forEach((host) => {
        ensureChrome(host);
        changes.note(host, readState(host));
      });
    } finally {
      syncing = false;
    }
  };

  const handleClick = (event: Event) => {
    if (destroyed) return;
    const host = rowFromEvent(event.target);
    if (!host || isDisabled(host) || !isSelectable(host)) return;
    if (!claimEvent(event)) return;
    toggleSelected(host);
  };

  const handleKeyDown = (event: Event) => {
    if (destroyed) return;
    if (!(event instanceof KeyboardEvent)) return;
    if (event.repeat || event.isComposing) return;
    if (!isActivationKey(event.key)) return;

    const host = rowFromEvent(event.target);
    if (!host || isDisabled(host)) return;
    if (isNativeHost(host) || isEditingHost(host) || isMenuItem(host)) return;

    if (isSpaceKey(event.key) && event.cancelable) event.preventDefault();
    if (!claimEvent(event)) return;

    host.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        composed: true,
      })
    );
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

  rootEvents.addEventListener('click', handleClick);
  rootEvents.addEventListener('keydown', handleKeyDown);

  if (observer && root instanceof Node) {
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        'touchable-row',
        'pressable',
        'selected',
        'disabled',
        'role',
        'tabindex',
        'href',
        'aria-disabled',
        'aria-selected',
        'aria-current',
        'menuitem',
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
      rootEvents.removeEventListener('click', handleClick);
      rootEvents.removeEventListener('keydown', handleKeyDown);
      observer?.disconnect();
    },
    sync,
    getState: (target) => {
      if (destroyed) return null;
      const host = resolveRow(target);
      if (!host) return null;
      return readState(host);
    },
  };
};

export const initTouchableRow = createTouchableRow;

let autoTouchableRowController: TouchableRowController | null = null;
let autoStartSuspended = false;
let bootOnReady: (() => void) | null = null;

const cancelDeferredAutoStart = () => {
  if (!bootOnReady || typeof document === 'undefined') return;
  document.removeEventListener('DOMContentLoaded', bootOnReady);
  bootOnReady = null;
};

export const startTouchableRowRuntime = (): TouchableRowController | null => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  autoStartSuspended = false;
  cancelDeferredAutoStart();

  if (autoTouchableRowController) {
    autoTouchableRowController.sync();
    return autoTouchableRowController;
  }

  autoTouchableRowController = createTouchableRow();
  return autoTouchableRowController;
};

export const stopTouchableRowRuntime = () => {
  autoStartSuspended = true;
  cancelDeferredAutoStart();
  autoTouchableRowController?.destroy();
  autoTouchableRowController = null;
};

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    bootOnReady = () => {
      bootOnReady = null;
      if (!autoStartSuspended) {
        startTouchableRowRuntime();
      }
    };
    document.addEventListener('DOMContentLoaded', bootOnReady);
  } else {
    startTouchableRowRuntime();
  }
}
