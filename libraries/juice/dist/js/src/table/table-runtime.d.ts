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
export declare const createTable: (options?: TableOptions) => TableController;
export declare const initTable: (options?: TableOptions) => TableController;
export declare const startTableRuntime: () => TableController | null;
export declare const stopTableRuntime: () => void;
