/**
 * DOM-first APG Slider runtime for Juice slider chrome.
 *
 * Markup contract (Slice A — do not rename attrs):
 *   [slider]        track host. Boolean or "horizontal".
 *                   [slider="vertical"] is not painted and is not enhanced.
 *   [slider-fill]   completed portion. Optional.
 *   [slider-thumb]  real thumb. Required. Orphan thumbs are ignored.
 *                   The first thumb whose nearest [slider] is the host
 *                   is the control. Extra thumbs are not a multi-thumb
 *                   slider in v1.
 *
 * Focus model: the thumb is the APG slider. Sync sets role="slider",
 * tabindex="0" when the thumb is not natively focusable, type="button"
 * when a button thumb omitted type, aria-valuemin (default 0),
 * aria-valuemax (default 100), aria-valuenow, and
 * aria-orientation="horizontal" on the thumb. The host stays the track.
 * An author role="slider" on the host is removed so assistive tech sees
 * one slider. Thumb aria-valuemin / aria-valuemax / aria-valuenow win
 * over the same attributes on the host. A missing valuenow defaults to
 * min. aria-valuetext is never invented and is never rewritten. Authors
 * supply the accessible name.
 *
 * Paint: the host inline custom property --juice-slider-ratio (unitless
 * 0–1) stays in sync for every range. Integer aria-valuenow 0–100 on the
 * thumb also matches the chrome attribute selectors.
 *
 * Keyboard (thumb only): ArrowLeft / ArrowDown decrease, ArrowRight /
 * ArrowUp increase, Home / End jump to min / max, PageUp / PageDown move
 * by a larger step. Step is 1. Page step is 10. Values clamp to min/max.
 * Pointer: primary pointerdown on the track, fill, or thumb jumps to that
 * position and starts a drag; pointermove follows until pointerup or
 * pointercancel. The thumb captures the pointer when the platform allows
 * it. Disabled or aria-disabled="true" on the host or thumb is ignored.
 *
 * v1 is horizontal Juice markup only. There is no vertical orientation,
 * no multi-thumb, no native <input type="range"> restyle, and no Escape
 * handling (not a layered overlay).
 */
export type SliderOptions = {
    root?: ParentNode;
    sliderSelector?: string;
};
export type SliderController = {
    destroy: () => void;
    sync: () => void;
    setValue: (value: number, target?: HTMLElement | null) => void;
    getValue: (target?: HTMLElement | null) => number;
    increment: (target?: HTMLElement | null) => void;
    decrement: (target?: HTMLElement | null) => void;
};
export declare const createSlider: (options?: SliderOptions) => SliderController;
export declare const initSlider: (options?: SliderOptions) => SliderController;
export declare const startSliderRuntime: () => SliderController | null;
export declare const stopSliderRuntime: () => void;
