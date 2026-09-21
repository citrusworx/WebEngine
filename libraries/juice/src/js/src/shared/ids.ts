/**
 * Internal Juice runtime id helpers. Not a public export.
 */

export const escapeId = (value: string) =>
  typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
    ? CSS.escape(value)
    : value;

export const tokenIds = (value: string | null | undefined) =>
  (value ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

export const controlIds = (element: HTMLElement) =>
  tokenIds(element.getAttribute('aria-controls'));

export const resolveElementById = (id: string, root: ParentNode) => {
  const escaped = escapeId(id);
  if (root instanceof Document || root instanceof Element) {
    const local = root.querySelector<HTMLElement>(`#${escaped}`);
    if (local) return local;
  }
  if (typeof document === 'undefined') return null;
  const global = document.getElementById(id);
  return global instanceof HTMLElement ? global : null;
};
