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
export declare const createSheet: (options?: SheetOptions) => SheetController;
export declare const initSheet: (options?: SheetOptions) => SheetController;
export declare const startSheetRuntime: () => SheetController | null;
export declare const stopSheetRuntime: () => void;
