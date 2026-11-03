/**
 * Internal open-surface queries. Not a public export.
 * Selectors match the polish A/B overlay contract.
 *
 * Modal, drawer, sheet, popover, menu, and combobox take Escape from
 * the layer stack (last opened wins). These queries stay because toast
 * and disclosure are not stack layers and still yield when one of those
 * surfaces is open in the DOM. Tooltip does not consult them: an open
 * tip consumes Escape itself and does not close the layer under it.
 *
 * Menu closed vs open is native `hidden` on `[menu]`, not on
 * `[menu-root]`. Sheet closed vs open is native `hidden` on
 * `[sheet-overlay]`, including `sheet-overlay="none"`.
 */
export declare const hasOpenDialogOverlay: () => boolean;
export declare const hasOpenPopover: () => boolean;
export declare const hasOpenMenu: () => boolean;
export declare const hasOpenComboboxList: () => boolean;
export declare const hasOpenTooltip: () => boolean;
