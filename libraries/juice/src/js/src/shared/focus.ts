/**
 * Internal focus-trap helpers for modal, drawer, and popover. Not a public export.
 */

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export const isFocusableCandidate = (element: HTMLElement) => {
  if (element.closest('[hidden]')) return false;
  if (element.getAttribute('aria-hidden') === 'true') return false;
  if (element instanceof HTMLButtonElement && element.disabled) return false;
  if (element instanceof HTMLInputElement && element.disabled) return false;
  return true;
};

export const getFocusable = (container: HTMLElement) =>
  Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  ).filter(isFocusableCandidate);

export const moveFocusInto = (container: HTMLElement) => {
  const autofocus = container.querySelector<HTMLElement>('[autofocus]');
  const focusable = getFocusable(container);
  const target =
    (autofocus && isFocusableCandidate(autofocus) ? autofocus : null) ??
    focusable[0] ??
    container;

  if (target === container && !container.hasAttribute('tabindex')) {
    container.setAttribute('tabindex', '-1');
  }

  target.focus();
};

export const wrapTabFocus = (event: KeyboardEvent, container: HTMLElement) => {
  if (event.key !== 'Tab') return false;

  const focusable = getFocusable(container);
  const current =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

  if (focusable.length === 0) {
    event.preventDefault();
    if (!container.hasAttribute('tabindex')) {
      container.setAttribute('tabindex', '-1');
    }
    container.focus();
    return true;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey) {
    if (!current || current === first || !container.contains(current)) {
      event.preventDefault();
      last.focus();
      return true;
    }
    return true;
  }

  if (!current || current === last || !container.contains(current)) {
    event.preventDefault();
    first.focus();
    return true;
  }

  return true;
};
