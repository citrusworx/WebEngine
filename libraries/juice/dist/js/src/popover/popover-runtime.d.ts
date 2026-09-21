/**
 * DOM-first popover runtime for Juice popover chrome.
 *
 * Markup contract (Slice A — do not rename attrs):
 *   [popover-root][hidden] > [popover-panel] + [popover-header]? +
 *   [popover-body]? + [popover-close]?
 * Closed vs open is the native `hidden` attribute on [popover-root].
 *
 * Never use a bare `popover` attribute. HTML `popover=""` / `popover="manual"`
 * activates the platform Popover API. The floating surface is [popover-panel].
 *
 * Accessibility (honest v1): treat the panel as a **non-modal dialog**.
 * APG allows `role="dialog"` without `aria-modal` when the background stays
 * interactive (not inert). Escape and outside-click still dismiss. This is
 * not `role="menu"` (no arrow-key roving / typeahead in this cut) and not
 * a modal (`aria-modal="true"` would lie — there is no scrim).
 *
 * Openers: any element whose `aria-controls` token list includes a
 * `[popover-root]` id. The runtime sets `aria-expanded` / `aria-haspopup`.
 * `[popover-close]` dismisses the containing root.
 *
 * Placement (honest v1, no Floating UI): read `popover-root` (`top` /
 * `bottom` / `left` / `right`, default `bottom`), position `fixed` near the
 * opener from getBoundingClientRect (viewport coords; `fixed` needs no
 * scroll offset), with a small gap. If a transformed / filtered ancestor
 * is the fixed containing block, subtract that origin so Juice cards
 * (`[card="interactive"]:focus-within`) do not offset the panel. If the
 * preferred side overflows the viewport, flip once to the opposite side.
 * No shift / size middleware. Repositions on open, window resize, and
 * capture scroll (rAF-throttled).
 *
 * Escape closes the open popover on bubble (after modal/drawer capture),
 * and also yields when an open [modal-overlay] or [drawer-overlay] exists
 * or the event is already defaultPrevented (those dialogs own Escape).
 * Menu sits in the same dialog-adjacent band as popover (peers do not
 * yield to each other). Combobox / toast / tooltip yield to an open
 * popover or menu. Opening one managed popover closes the others. Modal
 * / drawer / menu are not auto-closed.
 */
export type PopoverPlacement = 'top' | 'bottom' | 'left' | 'right';
export type PopoverOptions = {
    root?: ParentNode;
    rootSelector?: string;
    panelSelector?: string;
    closeSelector?: string;
    gap?: number;
};
export type PopoverController = {
    destroy: () => void;
    sync: () => void;
    open: (target?: HTMLElement | null) => void;
    close: (target?: HTMLElement | null) => void;
    toggle: (target?: HTMLElement | null) => void;
};
export declare const createPopover: (options?: PopoverOptions) => PopoverController;
export declare const initPopover: (options?: PopoverOptions) => PopoverController;
export declare const startPopoverRuntime: () => PopoverController | null;
export declare const stopPopoverRuntime: () => void;
