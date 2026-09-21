/**
 * Internal open-surface queries for Escape yield. Not a public export.
 * Selectors match the polish A/B overlay contract.
 *
 * Yield order (highest owns Escape first):
 *   modal/drawer overlay → popover ≈ menu (same band) → combobox →
 *   toast / tooltip. Menu closed vs open is native `hidden` on `[menu]`,
 *   not on `[menu-root]`.
 */
export declare const hasOpenDialogOverlay: () => boolean;
export declare const hasOpenPopover: () => boolean;
export declare const hasOpenMenu: () => boolean;
export declare const hasOpenComboboxList: () => boolean;
export declare const hasOpenTooltip: () => boolean;
