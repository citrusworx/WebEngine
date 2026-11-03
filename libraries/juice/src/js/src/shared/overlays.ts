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

const hasOpen = (selector: string) => {
  if (typeof document === 'undefined') return false;
  return Boolean(document.querySelector(selector));
};

export const hasOpenDialogOverlay = () =>
  hasOpen(
    '[modal-overlay]:not([hidden]), [drawer-overlay]:not([hidden]), [sheet-overlay]:not([hidden])'
  );

export const hasOpenPopover = () => hasOpen('[popover-root]:not([hidden])');

export const hasOpenMenu = () =>
  hasOpen('[menu-root] [menu]:not([hidden])');

export const hasOpenComboboxList = () =>
  hasOpen('[combobox-list]:not([hidden])');

export const hasOpenTooltip = () => hasOpen('[tooltip-root]:not([hidden])');
