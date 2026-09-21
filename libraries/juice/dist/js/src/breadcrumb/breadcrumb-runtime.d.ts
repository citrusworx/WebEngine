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
    setCurrent: (itemOrIndex: HTMLElement | number, trail?: HTMLElement | null) => void;
};
export declare const createBreadcrumb: (options?: BreadcrumbOptions) => BreadcrumbController;
export declare const initBreadcrumb: (options?: BreadcrumbOptions) => BreadcrumbController;
export declare const startBreadcrumbRuntime: () => BreadcrumbController | null;
export declare const stopBreadcrumbRuntime: () => void;
