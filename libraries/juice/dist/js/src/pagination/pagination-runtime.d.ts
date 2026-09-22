/**
 * DOM-first pagination runtime for Juice pagination chrome.
 *
 * Markup contract (Slice A — do not rename attrs):
 *   [pagination]       page-set root. Authors use <nav pagination> or
 *                      <ol pagination>.
 *   [pagination-item]  one cell. Layout only.
 *   [pagination-link]  optional. Anchors and buttons inside the control
 *                      are enough.
 *   [pagination-prev] / [pagination-next]
 *                      previous and next controls. The attr may sit on
 *                      the anchor or button, or on the item that wraps it.
 *   [pagination-ellipsis]
 *                      optional gap marker. Not a page control.
 *   [pagination-status]
 *                      optional "Page 2 of 12" text. Not a page control.
 *                      Ends are not parsed from this text.
 *
 * This is chrome, not a router. It does not remove href, listen to
 * history, trap focus, or handle Escape. It is not a layered overlay.
 *
 * Sync (markup-driven):
 *   1. Make the root a navigation landmark only when that is safe.
 *      Same rules as breadcrumb:
 *      - <nav> is already a landmark. Do not add a redundant
 *        role="navigation".
 *      - An element with no role that is not a list (ol / ul / menu)
 *        gets role="navigation". role="navigation" on a list would
 *        drop the list semantics, so <ol pagination> is left alone.
 *      - An author role is never overwritten.
 *      - Ancestor <nav> elements are not relabeled.
 *   2. Name that landmark only when it has no accessible name.
 *      When the root is a navigation landmark and aria-label,
 *      aria-labelledby, and title are all missing or blank, sync sets
 *      aria-label="Pagination". A non-empty author name is kept.
 *      Lists and other non-navigation roots are not given that label.
 *   3. Keep exactly one aria-current="page" inside the root when the
 *      set has a page control.
 *      Page controls are owned cells and links that are not prev,
 *      next, ellipsis, or status. If the author already set
 *      aria-current="page", the first one in tree order stays and any
 *      others in this root are removed. If none is set, the first page
 *      control is marked (on its link when it has one). A set with no
 *      page control is left without a current page.
 *   4. Sync prev/next disabled at the ends when that is inferable.
 *      Inference uses page controls plus optional ellipsis, not status
 *      text. Prev is disabled when the current page is the first page
 *      control and no ellipsis sits before it, or when that control's
 *      text is page 1. Next is disabled when the current page is the
 *      last page control and no ellipsis sits after it. Author-owned
 *      disabled (aria-disabled="true", native disabled, or [disabled]
 *      already present before this runtime wrote it) is never cleared.
 *      Runtime-owned disabled is aria-disabled="true", and disabled on
 *      buttons so they do not activate.
 *
 * Keyboard (conservative): ArrowLeft / ArrowUp and ArrowRight /
 * ArrowDown move focus to the previous or next enabled control. Home /
 * End move to the first or last enabled control. Disabled controls are
 * skipped. Focus does not wrap. Enter and Space are left to the
 * browser. A disabled link's click is cancelled so it does not navigate.
 *
 * setCurrent(item | index, pagination?) moves that single current. An
 * index applies to page controls only (prev / next are not pages), on
 * the given root, or the first root when omitted. It is not navigation.
 */
export type PaginationOptions = {
    root?: ParentNode;
    paginationSelector?: string;
    itemSelector?: string;
};
export type PaginationController = {
    destroy: () => void;
    sync: () => void;
    setCurrent: (itemOrIndex: HTMLElement | number, pagination?: HTMLElement | null) => void;
};
export declare const createPagination: (options?: PaginationOptions) => PaginationController;
export declare const initPagination: (options?: PaginationOptions) => PaginationController;
export declare const startPaginationRuntime: () => PaginationController | null;
export declare const stopPaginationRuntime: () => void;
