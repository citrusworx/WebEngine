/**
 * Internal open-order overlay stack. Not a public export.
 *
 * B2a wires modal, drawer, and sheet so the last one opened owns Escape
 * and backdrop presses. Popover, menu, and combobox still use the
 * type-ranked queries in overlays.ts until B2b. Toast and tooltip stay
 * off the stack. Sheet body scroll lock is acquireScrollLock. Modal
 * and drawer do not lock scroll.
 *
 * Order is open time. The last push is the top. Pushing an element that
 * is already stacked refreshes that slot in place (kind, modal, dismiss,
 * focus opt-in, containsTarget). It does not move the slot and it does
 * not add a second entry. Pop it and push it again to bring it to the
 * top. Every pop function returned for that element closes the same
 * slot. Calling pop again is a no-op.
 *
 * pop() removes this entry without calling its dismiss, because the
 * caller is already closing it. Layers above it are dismissed first,
 * top-down, with reason 'cascade', and then this entry is removed.
 * Pass { cascade: false } or call removeLayer(el) to drop one entry
 * with no dismiss calls and no focus return. That is the destroy path.
 *
 * Focus return is opt-in so a runtime that already restores focus does
 * not do it twice. Omit restoreFocus to skip it. Set restoreFocus to an
 * element or null to opt in. pop() focuses that opener when it is still
 * connected and is not inside a layer this pop closed. Otherwise it
 * focuses the new top layer's element, if one remains. The fallback
 * focuses that element itself, not a descendant. When the element has
 * no tabindex, the fallback sets tabindex="-1" so programmatic focus
 * works without putting the layer in tab order. An existing tabindex
 * is left as it is.
 *
 * One document keydown listener and one document pointerdown listener,
 * both capture, attach on the first push and detach when the stack is
 * empty. They call dismiss. They do not pop. dismiss must call the pop
 * function or removeLayer, or that layer stays on top. An outside
 * pointerdown walks from the top until a layer contains the target, or
 * through the whole stack when none do. If dismiss leaves the same
 * element on top, the walk stops.
 *
 * containsTarget is the portal seam. The default check is
 * el.contains(target). TODO(portal): a portaled panel is not a
 * descendant of el, so the runtime passes containsTarget that also
 * includes the portaled node.
 *
 * acquireScrollLock is the ref-counted inline body overflow lock sheet
 * uses. Modal and drawer do not lock scroll in S3.
 * The first acquire saves body.style.overflow and sets 'hidden'. The
 * last release restores the saved inline value. Release is idempotent.
 * A stylesheet overflow is not read or written.
 *
 * Every function no-ops when document is undefined.
 * __resetLayerStackForTests is for unit tests, not the public entry.
 */
export type LayerKind = 'modal' | 'drawer' | 'sheet' | 'popover' | 'menu' | 'combobox';
export type LayerDismissReason = 'escape' | 'outside' | 'cascade';
export interface LayerEntry {
    el: HTMLElement;
    kind: LayerKind;
    modal: boolean;
    dismiss(reason: LayerDismissReason): void;
    /**
     * Opt in to stack-managed focus return. Omit the property when the
     * runtime restores focus itself. null opts in with no opener.
     */
    restoreFocus?: HTMLElement | null;
    /**
     * Portal seam. Default containment is el.contains(target).
     * TODO(portal): include the portaled node here. It is not inside el.
     */
    containsTarget?: (target: EventTarget | null) => boolean;
}
export type PopLayerOptions = {
    /**
     * When false, remove this entry only. Do not dismiss layers above it
     * and do not run focus return. Default true.
     */
    cascade?: boolean;
};
export type PopLayer = (options?: PopLayerOptions) => void;
export declare const pushLayer: (entry: LayerEntry) => PopLayer;
export declare const removeLayer: (el: HTMLElement) => void;
export declare const topLayer: () => LayerEntry | null;
export declare const isTopLayer: (el: HTMLElement) => boolean;
export declare const topModalLayer: () => LayerEntry | null;
export declare const acquireScrollLock: () => (() => void);
/** Clears stack, listeners, and scroll-lock state. Test-only. */
export declare const __resetLayerStackForTests: () => void;
