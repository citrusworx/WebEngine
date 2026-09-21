/**
 * DOM-first APG Menu Button runtime for Juice menu chrome.
 *
 * Markup contract (Slice A — do not rename attrs):
 *   [menu-root] > opener + [menu][hidden] > [menuitem]+ /
 *   [menu-separator]? / [menu-label]?
 * Closed vs open is the native `hidden` attribute on `[menu]`, not on
 * `[menu-root]` (hiding the root would hide the opener).
 *
 * Opener: prefer `[menu-button]` inside the root. Authors may omit that
 * attr for CTA styling and use a plain button/control inside the root.
 * Pairing: `aria-haspopup="menu"` + `aria-controls` → the `[menu]` id
 * (runtime fills missing).
 *
 * This is an APG **Menu Button** (opener toggles a menu of menuitems).
 * It is not a popover, not a combobox, not a native <select> restyle,
 * not a menubar, and not a context menu. No submenus or typeahead in v1.
 * Placement stays CSS-absolute on `[menu-root]` (`top|bottom|left|right`,
 * default bottom). No Floating UI. No `aria-modal`.
 *
 * Keyboard focus (honest v1): **roving tabindex** on `[menuitem]`.
 * Combobox keeps focus on the input and uses `aria-activedescendant`
 * because the text field must remain the active element. APG Menu Button
 * moves focus onto the menuitem itself (ArrowUp/Down, Home/End move
 * `tabindex="0"` plus `menuitem="active"` paint). This runtime follows
 * that pattern. Separators and labels are skipped. Disabled items
 * (`aria-disabled="true"` or native `disabled`) are skipped.
 *
 * Open on opener click / Enter / Space (native buttons use click).
 * ArrowDown on a closed opener opens and focuses the first enabled item
 * (or the previously active item). ArrowUp opens onto the last enabled
 * item. Close on Escape (yields when an open [modal-overlay] or
 * [drawer-overlay] exists — menu sits with popover in the dialog-adjacent
 * band), outside click, Tab (closes without activating; focus moves on),
 * or after activating an item. Activating an item clicks it and restores
 * focus to the opener. Opening one managed menu closes the others. Modal
 * / drawer / popover are not auto-closed.
 */
export type MenuOptions = {
    root?: ParentNode;
    rootSelector?: string;
    buttonSelector?: string;
    menuSelector?: string;
    itemSelector?: string;
    separatorSelector?: string;
    labelSelector?: string;
};
export type MenuController = {
    destroy: () => void;
    sync: () => void;
    open: (target?: HTMLElement | null) => void;
    close: (target?: HTMLElement | null) => void;
    toggle: (target?: HTMLElement | null) => void;
    select: (target?: HTMLElement | null) => void;
};
export declare const createMenu: (options?: MenuOptions) => MenuController;
export declare const initMenu: (options?: MenuOptions) => MenuController;
export declare const startMenuRuntime: () => MenuController | null;
export declare const stopMenuRuntime: () => void;
