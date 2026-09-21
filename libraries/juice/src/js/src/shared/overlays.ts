/**
 * Internal open-surface queries for Escape yield. Not a public export.
 * Selectors match the polish A contract; do not expand from here.
 */

const hasOpen = (selector: string) => {
  if (typeof document === 'undefined') return false;
  return Boolean(document.querySelector(selector));
};

export const hasOpenDialogOverlay = () =>
  hasOpen('[modal-overlay]:not([hidden]), [drawer-overlay]:not([hidden])');

export const hasOpenPopover = () => hasOpen('[popover-root]:not([hidden])');

export const hasOpenComboboxList = () =>
  hasOpen('[combobox-list]:not([hidden])');

export const hasOpenTooltip = () => hasOpen('[tooltip-root]:not([hidden])');
