/**
 * DOM-first sortable headers for Juice table chrome.
 *
 * Markup contract (Slice A — do not rename attrs):
 *   [table]               host. A real <table>. <div table> is not a
 *                         host. Sync does not rewrite [table].
 *   th[sortable]          opt-in header inside that table. [sortable]
 *                         was free (no other Juice attribute uses it),
 *                         so the name did not need a [table-sortable]
 *                         fallback. A sortable cell outside [table] is
 *                         left alone.
 *   [numeric]             on the th or on a cell in that column. The
 *                         column compares as numbers. One numeric cell
 *                         makes the whole column numeric, including
 *                         every tbody. Slice A still owns tabular nums.
 *   [data-sort-value]     on a body cell. Compared instead of the
 *                         visible text. Parsed as a number when the
 *                         column is numeric.
 *
 * The runtime wraps each sortable header's contents in
 * <button type="button"> so the header is keyboard and screen-reader
 * operable. Enter and Space stay with the browser: a native button
 * turns them into a click, and a key handler here would sort twice.
 * Wrapping is idempotent. destroy moves the original nodes back out
 * and removes that button. An accessible name is the header text.
 * This runtime does not invent one.
 *
 * Activation cycles that column ascending -> descending -> none.
 * Single-column sort. The active th gets aria-sort="ascending" or
 * "descending". Every other sortable th in the table gets
 * aria-sort="none". An author aria-sort of ascending or descending is
 * adopted as the initial state and is not a client reorder (server
 * HTML can already be sorted). The next activation continues the cycle.
 *
 * Each tbody is reordered on its own. The original row order is the
 * DOM order first observed while this runtime is not itself holding a
 * client sort. Rows first seen during a client sort are appended to
 * that memory. direction "none" puts the memory back. Sort is stable:
 * equal keys keep original order.
 *
 * Comparison, in order:
 *   1. data-sort-value when that attribute is present (trimmed).
 *   2. Otherwise the cell's text, whitespace collapsed and trimmed.
 *   3. Numeric columns use a finite decimal parse (commas removed).
 *      Values that do not parse sort after every number, in both
 *      directions, and tie with each other.
 *   4. Text columns use Intl.Collator numeric: true, sensitivity:
 *      "base" (case-insensitive, natural numeric).
 *
 * Column identity is the header's cellIndex. Colspan and rowspan are
 * not expanded into a visual grid. A body cell is the cell at that
 * same cellIndex, or empty when the row has no cell there. A colspan
 * on an earlier cell shifts later cellIndexes, so the sorted value can
 * disagree with the painted column. Put one cell per column in each
 * body row when the sort must follow the painted grid. Sortable
 * headers belong in thead. A th[sortable] inside tbody is not special:
 * its row is sorted with the other rows of that tbody.
 *
 * Before a reorder, the table dispatches a bubbling cancelable
 * juice:sort CustomEvent. detail is { column, direction } where column
 * is the activated header's cellIndex even when direction is "none".
 * If defaultPrevented, aria-sort and state still update and rows stay
 * put (server-side sort). sync() while that canceled sort is current
 * refreshes the remembered order from the DOM and still does not
 * reorder. The next activation that is not canceled sorts from the
 * DOM order at that moment.
 *
 * State is { column: number | null, direction }. column is null when
 * direction is "none", and is the header cellIndex otherwise. The
 * first observation does not dispatch. Later changes dispatch a
 * bubbling juice:change CustomEvent with detail
 * { runtime: "table", state }. sync() re-reads headers and rows,
 * wraps new sortable headers, and re-applies a client sort so rows
 * added later join it.
 *
 * destroy restores original contents, restores row order when this
 * runtime had reordered them, and puts author aria-sort back. Shared
 * sort memory is cleared, so a second live controller re-reads the
 * restored DOM on its next sync. No Sig Table factory.
 */

import { createJuiceChanges } from '../shared/change.js';
import { createEventClaim } from '../shared/events.js';

export type TableOptions = {
  root?: ParentNode;
  tableSelector?: string;
  sortableSelector?: string;
};

export type TableSortDirection = 'ascending' | 'descending' | 'none';

export type TableState = {
  column: number | null;
  direction: TableSortDirection;
};

export type TableController = {
  destroy: () => void;
  sync: () => void;
  getState: (target?: HTMLElement | null) => TableState | null;
};

type SharedSort = {
  header: HTMLTableCellElement | null;
  direction: TableSortDirection;
  reorder: boolean;
};

const JUICE_SORT_EVENT = 'juice:sort';

const DEFAULT_ROOT: ParentNode =
  typeof document !== 'undefined' ? document : ({} as ParentNode);

const DEFAULTS: Required<TableOptions> = {
  root: DEFAULT_ROOT,
  tableSelector: '[table]',
  sortableSelector: 'th[sortable]',
};

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});

const NUMERIC_VALUE = /^[+-]?(?:\d+\.?\d*|\.\d+)$/;

const asArray = <T extends Element>(nodes: ArrayLike<T>): T[] =>
  Array.from(nodes);

const claimEvent = createEventClaim();

// Shared so the auto runtime and a custom-root controller do not wrap
// twice or sort the same click twice. Same idea as createEventClaim.
const createdButtons = new WeakSet<HTMLButtonElement>();
const enhancedHeaders = new Set<HTMLTableCellElement>();
const authorSort = new WeakMap<HTMLTableCellElement, string | null>();
const originals = new WeakMap<HTMLTableSectionElement, HTMLTableRowElement[]>();
const sharedSort = new WeakMap<HTMLTableElement, SharedSort>();

const rememberAuthor = (th: HTMLTableCellElement) => {
  if (authorSort.has(th)) return;
  authorSort.set(th, th.getAttribute('aria-sort'));
};

const authoredDirection = (th: HTMLTableCellElement): TableSortDirection | null => {
  const value = authorSort.has(th) ? authorSort.get(th) ?? null : th.getAttribute('aria-sort');
  if (value === 'ascending' || value === 'descending') return value;
  return null;
};

const parseNumeric = (raw: string): number | null => {
  const trimmed = raw.trim().replace(/,/g, '');
  if (!NUMERIC_VALUE.test(trimmed)) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
};

const cellRaw = (row: HTMLTableRowElement, column: number) => {
  const cell = row.cells[column];
  if (!cell) return '';
  if (cell.hasAttribute('data-sort-value')) {
    return (cell.getAttribute('data-sort-value') ?? '').trim();
  }
  return (cell.textContent ?? '').replace(/\s+/g, ' ').trim();
};

const columnIsNumeric = (table: HTMLTableElement, column: number) => {
  const cells = table.querySelectorAll('th, td');
  for (const cell of cells) {
    if (!(cell instanceof HTMLTableCellElement)) continue;
    if (cell.closest('table') !== table) continue;
    if (cell.cellIndex !== column) continue;
    if (cell.hasAttribute('numeric')) return true;
  }
  return false;
};

const compareValues = (
  left: string,
  right: string,
  direction: 'ascending' | 'descending',
  numeric: boolean
) => {
  if (numeric) {
    const a = parseNumeric(left);
    const b = parseNumeric(right);
    if (a === null && b === null) return 0;
    if (a === null) return 1;
    if (b === null) return -1;
    if (a === b) return 0;
    const delta = a < b ? -1 : 1;
    return direction === 'descending' ? -delta : delta;
  }

  const delta = collator.compare(left, right);
  if (delta === 0) return 0;
  return direction === 'descending' ? -delta : delta;
};

const orderedRows = (
  rows: HTMLTableRowElement[],
  column: number,
  direction: TableSortDirection,
  numeric: boolean
) => {
  if (direction === 'none') return rows.slice();

  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      const cmp = compareValues(
        cellRaw(a.row, column),
        cellRaw(b.row, column),
        direction,
        numeric
      );
      if (cmp !== 0) return cmp;
      return a.index - b.index;
    })
    .map((item) => item.row);
};

const placeRows = (tbody: HTMLTableSectionElement, rows: HTMLTableRowElement[]) => {
  const current = Array.from(tbody.rows);
  if (current.length === rows.length && current.every((row, index) => row === rows[index])) {
    return;
  }
  rows.forEach((row) => tbody.appendChild(row));
};

const snapshot = (table: HTMLTableElement) => {
  Array.from(table.tBodies).forEach((tbody) => {
    originals.set(tbody, Array.from(tbody.rows));
  });
};

const mergeOriginals = (table: HTMLTableElement) => {
  Array.from(table.tBodies).forEach((tbody) => {
    const current = Array.from(tbody.rows);
    const known = (originals.get(tbody) ?? []).filter((row) => row.parentNode === tbody);
    if (!originals.has(tbody)) {
      originals.set(tbody, current);
      return;
    }
    const seen = new Set(known);
    const fresh = current.filter((row) => !seen.has(row));
    originals.set(tbody, [...known, ...fresh]);
  });
};

const applyOrder = (
  table: HTMLTableElement,
  column: number,
  direction: TableSortDirection
) => {
  const numeric = direction !== 'none' && columnIsNumeric(table, column);
  Array.from(table.tBodies).forEach((tbody) => {
    const known = originals.get(tbody);
    const source = (known ?? Array.from(tbody.rows)).filter((row) => row.parentNode === tbody);
    placeRows(tbody, orderedRows(source, column, direction, numeric));
  });
};

const stateOf = (record: SharedSort | undefined): TableState => {
  if (!record || record.direction === 'none' || !record.header || record.header.cellIndex < 0) {
    return { column: null, direction: 'none' };
  }
  return { column: record.header.cellIndex, direction: record.direction };
};

const noopController = (): TableController => ({
  destroy: () => {},
  sync: () => {},
  getState: () => null,
});

export const createTable = (options: TableOptions = {}): TableController => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return noopController();
  }

  const settings = { ...DEFAULTS, ...options };
  const root = settings.root ?? document;
  const rootEvents = root as ParentNode & EventTarget;
  const changes = createJuiceChanges<TableState>('table');
  const touched = new Set<HTMLTableElement>();
  let destroyed = false;

  const isManaged = (table: HTMLTableElement | null | undefined) => {
    if (!(table instanceof HTMLTableElement)) return false;
    if (!table.matches(settings.tableSelector)) return false;
    if (root instanceof Document) return true;
    if (root instanceof Node) return root === table || root.contains(table);
    return false;
  };

  const getTables = () => {
    const found = asArray(root.querySelectorAll(settings.tableSelector)).filter(
      (element): element is HTMLTableElement =>
        element instanceof HTMLTableElement && isManaged(element)
    );

    if (root instanceof HTMLTableElement && isManaged(root) && !found.includes(root)) {
      return [root, ...found];
    }

    return found;
  };

  const headersOf = (table: HTMLTableElement) =>
    asArray(table.querySelectorAll<HTMLTableCellElement>(settings.sortableSelector)).filter(
      (th) => th.tagName === 'TH' && th.closest('table') === table
    );

  const ensureButton = (th: HTMLTableCellElement) => {
    const only = th.children.length === 1 ? th.children[0] : null;
    if (
      only instanceof HTMLButtonElement &&
      only.type === 'button' &&
      createdButtons.has(only)
    ) {
      enhancedHeaders.add(th);
      return only;
    }

    const button = th.ownerDocument.createElement('button');
    button.type = 'button';
    while (th.firstChild) button.appendChild(th.firstChild);
    th.appendChild(button);
    createdButtons.add(button);
    enhancedHeaders.add(th);
    return button;
  };

  const releaseHeader = (th: HTMLTableCellElement) => {
    const only = th.children.length === 1 ? th.children[0] : null;
    if (only instanceof HTMLButtonElement && createdButtons.has(only)) {
      while (only.firstChild) th.insertBefore(only.firstChild, only);
      only.remove();
      createdButtons.delete(only);
    }

    if (authorSort.has(th)) {
      const authored = authorSort.get(th) ?? null;
      if (authored === null) th.removeAttribute('aria-sort');
      else if (th.getAttribute('aria-sort') !== authored) th.setAttribute('aria-sort', authored);
      authorSort.delete(th);
    }

    enhancedHeaders.delete(th);
  };

  const writeSort = (table: HTMLTableElement, record: SharedSort) => {
    headersOf(table).forEach((th) => {
      const value =
        record.header === th && record.direction !== 'none' ? record.direction : 'none';
      if (th.getAttribute('aria-sort') !== value) th.setAttribute('aria-sort', value);
    });
  };

  const ensureRecord = (table: HTMLTableElement, headers: HTMLTableCellElement[]) => {
    const existing = sharedSort.get(table);
    if (!existing) {
      let header: HTMLTableCellElement | null = null;
      let direction: TableSortDirection = 'none';
      for (const th of headers) {
        const authored = authoredDirection(th);
        if (authored) {
          header = th;
          direction = authored;
          break;
        }
      }
      const created: SharedSort = { header, direction, reorder: false };
      sharedSort.set(table, created);
      return created;
    }

    if (existing.header && !headers.includes(existing.header)) {
      if (existing.reorder) {
        mergeOriginals(table);
        applyOrder(table, existing.header.cellIndex, 'none');
      }
      existing.header = null;
      existing.direction = 'none';
      existing.reorder = false;
    }

    return existing;
  };

  const releaseStale = (table: HTMLTableElement, headers: HTMLTableCellElement[]) => {
    const live = new Set(headers);
    Array.from(table.querySelectorAll('th')).forEach((th) => {
      if (!(th instanceof HTMLTableCellElement)) return;
      if (!enhancedHeaders.has(th) || live.has(th)) return;
      if (th.closest('table') !== table) return;
      releaseHeader(th);
    });
  };

  const syncTable = (table: HTMLTableElement) => {
    touched.add(table);
    const headers = headersOf(table);
    headers.forEach((th) => rememberAuthor(th));
    const record = ensureRecord(table, headers);
    headers.forEach((th) => ensureButton(th));
    releaseStale(table, headers);
    writeSort(table, record);

    if (record.reorder && record.direction !== 'none' && record.header) {
      mergeOriginals(table);
      applyOrder(table, record.header.cellIndex, record.direction);
    } else {
      snapshot(table);
    }

    changes.note(table, stateOf(record));
  };

  const sync = () => {
    if (destroyed) return;
    getTables().forEach((table) => {
      if (!isManaged(table)) return;
      syncTable(table);
    });
  };

  const activate = (table: HTMLTableElement, th: HTMLTableCellElement) => {
    const headers = headersOf(table);
    headers.forEach((header) => rememberAuthor(header));
    const record = ensureRecord(table, headers);
    const same = record.header === th && record.direction !== 'none';
    const next: TableSortDirection = !same
      ? 'ascending'
      : record.direction === 'ascending'
        ? 'descending'
        : 'none';

    const event = new CustomEvent(JUICE_SORT_EVENT, {
      bubbles: true,
      cancelable: true,
      composed: true,
      detail: {
        column: th.cellIndex,
        direction: next,
      },
    });
    table.dispatchEvent(event);

    if (next === 'none') {
      record.header = null;
      record.direction = 'none';
    } else {
      record.header = th;
      record.direction = next;
    }

    headers.forEach((header) => ensureButton(header));
    writeSort(table, record);

    if (event.defaultPrevented) {
      record.reorder = false;
    } else if (next === 'none') {
      mergeOriginals(table);
      applyOrder(table, th.cellIndex, 'none');
      record.reorder = false;
    } else {
      if (record.reorder) mergeOriginals(table);
      else snapshot(table);
      applyOrder(table, th.cellIndex, next);
      record.reorder = true;
    }

    changes.note(table, stateOf(record));
  };

  const resolveTable = (target?: HTMLElement | null) => {
    if (target) {
      const table =
        target instanceof HTMLTableElement ? target : target.closest('table');
      if (table instanceof HTMLTableElement && isManaged(table)) return table;
      return null;
    }

    return getTables()[0] ?? null;
  };

  const handleClick = (event: Event) => {
    if (destroyed) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest('button');
    if (!(button instanceof HTMLButtonElement) || !createdButtons.has(button)) return;
    if (button.disabled || button.getAttribute('aria-disabled') === 'true') return;

    const th = button.closest('th');
    if (!(th instanceof HTMLTableCellElement)) return;
    if (!th.matches(settings.sortableSelector)) return;
    if (th.hasAttribute('disabled') || th.getAttribute('aria-disabled') === 'true') return;
    if (th.cellIndex < 0) return;

    const table = th.closest('table');
    if (!(table instanceof HTMLTableElement) || !isManaged(table)) return;
    if (!claimEvent(event)) return;
    activate(table, th);
  };

  let syncScheduled = false;
  let syncFrame = 0;
  const scheduleSync = () => {
    if (syncScheduled || destroyed) return;
    syncScheduled = true;
    syncFrame = requestAnimationFrame(() => {
      syncScheduled = false;
      sync();
    });
  };

  const observer =
    typeof MutationObserver !== 'undefined'
      ? new MutationObserver(() => scheduleSync())
      : null;

  rootEvents.addEventListener('click', handleClick);

  if (observer && root instanceof Node) {
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['table', 'sortable', 'numeric', 'data-sort-value'],
    });
  }

  sync();

  return {
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      if (syncScheduled) {
        cancelAnimationFrame(syncFrame);
        syncScheduled = false;
      }
      rootEvents.removeEventListener('click', handleClick);
      observer?.disconnect();

      touched.forEach((table) => {
        const record = sharedSort.get(table);
        if (record?.reorder) {
          mergeOriginals(table);
          applyOrder(table, record.header?.cellIndex ?? 0, 'none');
        }

        Array.from(table.querySelectorAll('th')).forEach((th) => {
          if (!(th instanceof HTMLTableCellElement)) return;
          if (!enhancedHeaders.has(th)) return;
          if (th.closest('table') !== table) return;
          releaseHeader(th);
        });

        sharedSort.delete(table);
        Array.from(table.tBodies).forEach((tbody) => originals.delete(tbody));
      });
      touched.clear();
    },
    sync,
    getState: (target) => {
      if (destroyed) return null;
      const table = resolveTable(target);
      if (!table) return null;
      const record = sharedSort.get(table);
      if (!record) return null;
      return stateOf(record);
    },
  };
};

export const initTable = createTable;

let autoTableController: TableController | null = null;
let autoStartSuspended = false;
let bootOnReady: (() => void) | null = null;

const cancelDeferredAutoStart = () => {
  if (!bootOnReady || typeof document === 'undefined') return;
  document.removeEventListener('DOMContentLoaded', bootOnReady);
  bootOnReady = null;
};

export const startTableRuntime = (): TableController | null => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  autoStartSuspended = false;
  cancelDeferredAutoStart();

  if (autoTableController) {
    autoTableController.sync();
    return autoTableController;
  }

  autoTableController = createTable();
  return autoTableController;
};

export const stopTableRuntime = () => {
  autoStartSuspended = true;
  cancelDeferredAutoStart();
  autoTableController?.destroy();
  autoTableController = null;
};

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    bootOnReady = () => {
      bootOnReady = null;
      if (!autoStartSuspended) {
        startTableRuntime();
      }
    };
    document.addEventListener('DOMContentLoaded', bootOnReady);
  } else {
    startTableRuntime();
  }
}
