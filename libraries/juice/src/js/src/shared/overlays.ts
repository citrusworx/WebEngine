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
