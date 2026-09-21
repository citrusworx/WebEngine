/**
 * DOM-first APG Progressbar runtime for Juice progress chrome.
 *
 * Markup contract (Slice A — do not rename attrs):
 *   [progress]       track host. Boolean (determinate) or
 *                    progress="indeterminate". Any other value is
 *                    determinate chrome; sync does not rewrite it.
 *                    Authors write <div progress>, not <progress>.
 *                    A native <progress> without the attribute is
 *                    ignored. Native value / max are not the value hook.
 *   [progress-fill]  filled portion. Optional for the runtime.
 *   [progress-label] optional visible value / status text. Authors own
 *                    the accessible name. The label is not copied into
 *                    aria-label, aria-labelledby, or aria-valuetext.
 *
 * Sync (markup-driven):
 *   1. role="progressbar" on the host. An author role that is not
 *      progressbar is replaced. The host is not made focusable
 *      (no tabindex). There is no keyboard and no pointer handler.
 *   2. Determinate: aria-valuemin (default 0), aria-valuemax (default
 *      100), and aria-valuenow. A missing or non-numeric valuenow is
 *      min, which is an empty bar (ratio 0), not indeterminate.
 *      Values clamp to min/max. A max below min collapses to min.
 *   3. The host inline custom property --juice-progress-ratio
 *      (unitless 0–1) stays in sync for every range, including ranges
 *      the 0–100 chrome selectors do not cover.
 *   4. Indeterminate is progress="indeterminate" only. That flag wins.
 *      APG omits aria-valuenow while indeterminate; min/max stay.
 *      The last determinate value is remembered and restored when the
 *      flag clears. CSS owns the sliding fill.
 *   5. aria-valuetext is never invented and never rewritten.
 *
 * Not a slider, not a spinner, and not a layered overlay: no focus
 * trap, no Escape, no Sig Progress factory.
 */
export type ProgressOptions = {
    root?: ParentNode;
    progressSelector?: string;
};
export type ProgressController = {
    destroy: () => void;
    sync: () => void;
    setValue: (value: number, target?: HTMLElement | null) => void;
    getValue: (target?: HTMLElement | null) => number;
    setIndeterminate: (indeterminate: boolean, target?: HTMLElement | null) => void;
    isIndeterminate: (target?: HTMLElement | null) => boolean;
};
export declare const createProgress: (options?: ProgressOptions) => ProgressController;
export declare const initProgress: (options?: ProgressOptions) => ProgressController;
export declare const startProgressRuntime: () => ProgressController | null;
export declare const stopProgressRuntime: () => void;
