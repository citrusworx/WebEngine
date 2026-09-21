/**
 * DOM-first banner dismiss runtime for Juice banner chrome.
 *
 * Markup contract (authors place the callout — this is not a portal):
 *   [banner] / [banner="full"] + [banner-body]? + [banner-close]?
 * Optional status: [banner-tone="info|success|warning|error"]
 * Closed banners use native `hidden`. The node stays in the DOM.
 *
 * Banner is NOT a dialog and NOT a toast stack:
 *   - no focus trap, no aria-modal, no overlay, no [banner-region]
 *   - no auto-dismiss timer; the banner stays until dismiss
 *   - show() never hides siblings
 *   - do not move focus into the banner on show
 *
 * Escape is left to modal / drawer / popover / toast. Banner is inline
 * and not a dialog; v1 does not steal Escape for focused banners.
 *
 * Persist (lean): optional banner-persist="session|local" plus a `name`
 * or `id` key remembers dismiss in sessionStorage / localStorage.
 * Without persist, or without a name/id, dismiss is in-memory only.
 *
 * Live role: sync fills role="status" for info / success / neutral, and
 * role="alert" for error / warning. Empty close controls get
 * aria-label="Dismiss".
 */
export type BannerOptions = {
    root?: ParentNode;
    bannerSelector?: string;
    closeSelector?: string;
};
export type BannerController = {
    destroy: () => void;
    sync: () => void;
    show: (target?: HTMLElement | null) => void;
    dismiss: (target?: HTMLElement | null) => void;
};
export declare const createBanner: (options?: BannerOptions) => BannerController;
export declare const initBanner: (options?: BannerOptions) => BannerController;
export declare const startBannerRuntime: () => BannerController | null;
export declare const stopBannerRuntime: () => void;
