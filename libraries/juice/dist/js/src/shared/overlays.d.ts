/**
 * Internal open-surface queries for Escape yield. Not a public export.
 * Selectors match the polish A/B overlay contract.
 *
 * Yield order (highest owns Escape first):
 *   modal/drawer/sheet overlay → popover ≈ menu (same band) → combobox →
 *   toast / tooltip. Menu closed vs open is native `hidden` on `[menu]`,
 *   not on `[menu-root]`. Sheet closed vs open is native `hidden` on
 *   `[sheet-overlay]`, including `sheet-overlay="none"`.
 *
 * Modal, drawer, and sheet take their own Escape from the layer stack.
 * These queries stay the interim yield for popover, menu, combobox,
 * toast, and tooltip until those runtimes join the stack.
 */
export declare const hasOpenDialogOverlay: () => boolean;
export declare const hasOpenPopover: () => boolean;
export declare const hasOpenMenu: () => boolean;
export declare const hasOpenComboboxList: () => boolean;
export declare const hasOpenTooltip: () => boolean;
