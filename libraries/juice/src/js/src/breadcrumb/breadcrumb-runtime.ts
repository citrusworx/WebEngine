/**
 * Light DOM-first breadcrumb runtime for Juice breadcrumb chrome.
 *
 * Markup contract (Slice A — do not rename attrs):
 *   [breadcrumb]       trail root. Authors use <nav breadcrumb> or
 *                      <ol breadcrumb>.
 *   [breadcrumb-item]  one crumb. Separator is CSS on every item
 *                      except the last.
 *   [breadcrumb-link]  optional. Anchors inside the trail are enough.
 *   [breadcrumb-separator]
 *                      optional explicit separator. Authors own it.
 *
 * This is chrome, not a router. v1 does not listen to history, clicks,
 * or the keyboard. It claims no events (no createEventClaim). There is
 * no Escape handler, no focus trap, and no overlay.
 *
 * Sync (markup-driven):
 *   1. Make the root a navigation landmark only when that is safe.
 *      - <nav> is already a landmark. Do not add a redundant
 *        role="navigation".
 *      - An element with no role that is not a list (ol / ul / menu)
 *        gets role="navigation". role="navigation" on a list would
 *        drop the list semantics, so <ol breadcrumb> is left alone.
 *      - An author role is never overwritten.
 *      - Ancestor <nav> elements are not relabeled. A parent nav may
 *        be a larger landmark than this trail.
 *   2. Name that landmark only when it has no accessible name.
 *      APG's breadcrumb pattern puts the trail in a navigation
 *      landmark labeled "Breadcrumb" (aria-label or aria-labelledby).
 *      When the root is a navigation landmark and aria-label,
 *      aria-labelledby, and title are all missing or blank, sync sets
 *      aria-label="Breadcrumb". A non-empty author name is kept.
 *      Lists and other non-navigation roots are not given that label.
 *   3. Keep a single aria-current="page" inside the trail.
 *      Crumbs are owned [breadcrumb-item] elements. When a trail has
 *      none, direct-child anchors and [breadcrumb-link] elements are
 *      the crumbs (the same flat markup the chrome styles).
 *      If the author already set aria-current="page", the first one
 *      in tree order stays and any others in this trail are removed.
 *      If none is set and the trail has crumbs, the last crumb is
 *      marked. A crumb that contains a link is marked on that link
 *      (the last owned anchor or [breadcrumb-link]); otherwise the
 *      crumb element itself is marked.
 *   4. Do not rewrite the current crumb's href, click behavior, or
 *      disabled state. Authors own whether the current page is a link.
 *
 * setCurrent(item | index, trail?) moves that single current. An index
 * applies to the given trail, or the first trail when trail is omitted.
 * It is not a navigation.
 */

export type BreadcrumbOptions = {
  root?: ParentNode;
  breadcrumbSelector?: string;
  itemSelector?: string;
};

export type BreadcrumbController = {
  destroy: () => void;
  sync: () => void;
  setCurrent: (
    itemOrIndex: HTMLElement | number,
    trail?: HTMLElement | null
  ) => void;
};

const DEFAULT_ROOT: ParentNode =
  typeof document !== 'undefined' ? document : ({} as ParentNode);

const DEFAULTS: Required<BreadcrumbOptions> = {
  root: DEFAULT_ROOT,
  breadcrumbSelector: '[breadcrumb]',
  itemSelector: '[breadcrumb-item]',
};

const LINK_SELECTOR = 'a, [breadcrumb-link]';
const LIST_TAGS = new Set(['OL', 'UL', 'MENU']);

const asArray = <T extends Element>(nodes: ArrayLike<T>): T[] =>
  Array.from(nodes);

const hasAccessibleName = (element: HTMLElement) => {
  const label = element.getAttribute('aria-label');
  if (label !== null && label.trim() !== '') return true;

  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy !== null && labelledBy.trim() !== '') return true;

  const title = element.getAttribute('title');
  return title !== null && title.trim() !== '';
};

const isNavigationLandmark = (element: HTMLElement) => {
  const role = element.getAttribute('role');
  if (role) return role === 'navigation';
  return element.tagName === 'NAV';
};

const noopController = (): BreadcrumbController => ({
  destroy: () => {},
  sync: () => {},
  setCurrent: () => {},
});

export const createBreadcrumb = (
  options: BreadcrumbOptions = {}
): BreadcrumbController => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return noopController();
  }

  const settings = { ...DEFAULTS, ...options };
  const root = settings.root ?? document;

  const isManagedTrail = (element: HTMLElement | null | undefined) => {
    if (!element?.matches(settings.breadcrumbSelector)) return false;
    if (root instanceof Document) return true;
    if (root instanceof Node) return root === element || root.contains(element);
    return false;
  };

  const getTrails = () => {
    const found = asArray(
      root.querySelectorAll<HTMLElement>(settings.breadcrumbSelector)
    ).filter(isManagedTrail);

    if (root instanceof HTMLElement && isManagedTrail(root)) {
      return [root, ...found];
    }

    return found;
  };

  const belongsToTrail = (trail: HTMLElement, element: Element) =>
    element.closest(settings.breadcrumbSelector) === trail;

  const getCrumbs = (trail: HTMLElement) => {
    const items = asArray(
      trail.querySelectorAll<HTMLElement>(settings.itemSelector)
    ).filter((item) => belongsToTrail(trail, item));

    if (items.length) return items;

    return asArray(trail.children).filter(
      (child): child is HTMLElement =>
        child instanceof HTMLElement && child.matches(LINK_SELECTOR)
    );
  };

  const findPageCurrents = (trail: HTMLElement) => {
    const found = asArray(
      trail.querySelectorAll<HTMLElement>('[aria-current="page"]')
    ).filter((element) => belongsToTrail(trail, element));

    if (trail.getAttribute('aria-current') === 'page') {
      return [trail, ...found];
    }

    return found;
  };

  const ownedLinks = (crumb: HTMLElement) => {
    if (!crumb.matches(settings.itemSelector)) return [];

    return asArray(crumb.querySelectorAll<HTMLElement>(LINK_SELECTOR)).filter(
      (link) => link.closest(settings.itemSelector) === crumb
    );
  };

  const preferredCurrentTarget = (crumb: HTMLElement) => {
    if (crumb.matches(LINK_SELECTOR)) return crumb;
    const links = ownedLinks(crumb);
    return links[links.length - 1] ?? crumb;
  };

  const markCurrent = (element: HTMLElement) => {
    if (element.getAttribute('aria-current') !== 'page') {
      element.setAttribute('aria-current', 'page');
    }
  };

  const clearPageCurrentExcept = (
    trail: HTMLElement,
    keep: HTMLElement | null
  ) => {
    findPageCurrents(trail).forEach((element) => {
      if (element !== keep) element.removeAttribute('aria-current');
    });
  };

  const ensureLandmark = (trail: HTMLElement) => {
    const role = trail.getAttribute('role');
    const isList = LIST_TAGS.has(trail.tagName);

    if (!role && !isList && trail.tagName !== 'NAV') {
      trail.setAttribute('role', 'navigation');
    }

    if (isNavigationLandmark(trail) && !hasAccessibleName(trail)) {
      trail.setAttribute('aria-label', 'Breadcrumb');
    }
  };

  const resolveTrail = (target?: HTMLElement | null) => {
    if (target) {
      if (isManagedTrail(target)) return target;

      const trail = target.closest(settings.breadcrumbSelector);
      if (trail instanceof HTMLElement && isManagedTrail(trail)) return trail;
      return null;
    }

    return getTrails()[0] ?? null;
  };

  const resolveCrumb = (trail: HTMLElement, target: HTMLElement) => {
    const crumbs = getCrumbs(trail);
    return (
      crumbs.find((crumb) => crumb === target || crumb.contains(target)) ??
      null
    );
  };

  const syncTrail = (trail: HTMLElement) => {
    ensureLandmark(trail);

    const currents = findPageCurrents(trail);
    if (currents.length > 0) {
      clearPageCurrentExcept(trail, currents[0]);
      return;
    }

    const crumbs = getCrumbs(trail);
    const last = crumbs[crumbs.length - 1];
    if (!last) return;

    markCurrent(preferredCurrentTarget(last));
  };

  const sync = () => {
    getTrails().forEach((trail) => {
      if (!isManagedTrail(trail)) return;
      syncTrail(trail);
    });
  };

  const setCurrent = (
    itemOrIndex: HTMLElement | number,
    trail?: HTMLElement | null
  ) => {
    const explicit =
      itemOrIndex instanceof HTMLElement ? itemOrIndex : null;
    const trailEl = resolveTrail(trail ?? explicit);
    if (!trailEl) return;

    const crumb =
      typeof itemOrIndex === 'number'
        ? (getCrumbs(trailEl)[itemOrIndex] ?? null)
        : resolveCrumb(trailEl, itemOrIndex);

    if (!crumb || !trailEl.contains(crumb)) return;

    const target =
      explicit &&
      explicit !== crumb &&
      crumb.contains(explicit) &&
      explicit.matches(LINK_SELECTOR)
        ? explicit
        : preferredCurrentTarget(crumb);

    clearPageCurrentExcept(trailEl, target);
    markCurrent(target);
  };

  let syncScheduled = false;
  let syncFrame = 0;
  const scheduleSync = () => {
    if (syncScheduled) return;
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

  if (observer && root instanceof Node) {
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        'breadcrumb',
        'breadcrumb-item',
        'breadcrumb-link',
        'aria-current',
        'aria-label',
        'aria-labelledby',
        'role',
        'title',
      ],
    });
  }

  sync();

  return {
    destroy: () => {
      if (syncScheduled) {
        cancelAnimationFrame(syncFrame);
        syncScheduled = false;
      }
      observer?.disconnect();
    },
    sync,
    setCurrent,
  };
};

export const initBreadcrumb = (
  options: BreadcrumbOptions = {}
): BreadcrumbController => createBreadcrumb(options);

let autoBreadcrumbController: BreadcrumbController | null = null;
let autoStartSuspended = false;
let bootOnReady: (() => void) | null = null;

const cancelDeferredAutoStart = () => {
  if (!bootOnReady || typeof document === 'undefined') return;
  document.removeEventListener('DOMContentLoaded', bootOnReady);
  bootOnReady = null;
};

export const startBreadcrumbRuntime = (): BreadcrumbController | null => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  autoStartSuspended = false;
  cancelDeferredAutoStart();

  if (autoBreadcrumbController) {
    autoBreadcrumbController.sync();
    return autoBreadcrumbController;
  }

  autoBreadcrumbController = createBreadcrumb();
  return autoBreadcrumbController;
};

export const stopBreadcrumbRuntime = () => {
  autoStartSuspended = true;
  cancelDeferredAutoStart();
  autoBreadcrumbController?.destroy();
  autoBreadcrumbController = null;
};

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    bootOnReady = () => {
      bootOnReady = null;
      if (!autoStartSuspended) {
        startBreadcrumbRuntime();
      }
    };
    document.addEventListener('DOMContentLoaded', bootOnReady);
  } else {
    startBreadcrumbRuntime();
  }
}
