/**
 * DOM-first tooltip runtime for Juice tooltip chrome.
 *
 * Markup contract (Slice A — do not rename attrs):
 *   [tooltip-root][hidden] > [tooltip-panel role="tooltip"]
 * Closed vs open is the native `hidden` attribute on [tooltip-root].
 *
 * Never use a bare `tooltip` attribute. Juice chrome is not the native
 * HTML `title` attribute — do not restyle or replace `title`.
 *
 * Tooltip is a thin cousin of popover: hover/focus only, no interactive
 * content, no close button, no focus trap, no status variants. Do not
 * move focus into the tip. It is not a popover, not a modal, not a
 * drawer, and not a toast stack.
 *
 * Pairing: prefer `aria-describedby` pointing at the tooltip-root id
 * (APG). `aria-controls` is also accepted for consistency with other
 * Juice runtimes. Sync fills a missing root id and ensures the trigger
 * `aria-describedby` token list includes that id.
 *
 * Show on pointer enter / focus of the trigger; hide on pointer leave /
 * blur after a short grace (default 150ms) so a brief leave does not
 * flicker. The tip has `pointer-events: none` in chrome, so the delay
 * is not a bridge onto the tip. Touch / first-tap is later — v1 is
 * hover and keyboard focus only.
 *
 * Placement (honest v1, no Floating UI): read `tooltip-root` (`top` /
 * `bottom` / `left` / `right`, default `top`), position `fixed` near
 * the trigger from getBoundingClientRect, with a small gap. If a
 * transformed / filtered ancestor is the fixed containing block,
 * subtract that origin. If the preferred side overflows the viewport,
 * flip once to the opposite side. Repositions on open, window resize,
 * and capture scroll (rAF-throttled).
 *
 * Escape hides the open tip on bubble, but yields when an open
 * [modal-overlay], [drawer-overlay], [popover-root], [menu], or
 * [combobox-list] exists, or the event is already defaultPrevented
 * (same courtesy as toast / popover). Menu sits with popover in the
 * dialog-adjacent band. Toast does not block tooltip Escape — the tip
 * can hide while toasts remain. Opening one managed tooltip closes the
 * others.
 */
export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';
export type TooltipOptions = {
    root?: ParentNode;
    rootSelector?: string;
    panelSelector?: string;
    gap?: number;
    hideDelay?: number;
};
export type TooltipController = {
    destroy: () => void;
    sync: () => void;
    show: (target?: HTMLElement | null) => void;
    hide: (target?: HTMLElement | null) => void;
};
export declare const createTooltip: (options?: TooltipOptions) => TooltipController;
export declare const initTooltip: (options?: TooltipOptions) => TooltipController;
export declare const startTooltipRuntime: () => TooltipController | null;
export declare const stopTooltipRuntime: () => void;
