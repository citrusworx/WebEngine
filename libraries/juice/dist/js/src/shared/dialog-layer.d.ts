/**
 * Internal binding from modal, drawer, and sheet onto the layer stack.
 * Not a public export.
 *
 * Each open overlay is one stack slot. push happens on open. pop happens
 * when the close commits (hidden is set), so an in-flight exit stays the
 * open dialog until then. Destroy drops the slot with no dismiss.
 * Replacing an open dialog pops it, so layers above dismiss top-down with
 * reason 'cascade'. The focus trap belongs to a runtime only when its
 * overlay is the top of the stack and that layer is modal. A non-modal
 * sheet on top suspends the trap until it closes.
 *
 * A backdrop press is a pointer whose target is the overlay element.
 * The stack treats that press as outside every layer that does not
 * contain the target, so a lower backdrop dismisses only the top dialog.
 * The top dialog's own backdrop is inside its layer; the runtime closes
 * that one from click, and only if it was the top layer when the press
 * began. Presses on openers or the rest of the page are not backdrop
 * presses, so they do not dismiss a dialog.
 */
import { type LayerDismissReason, type LayerKind } from './layer-stack.js';
export type DialogLayerController = {
    /** Stack an open overlay. bringToTop re-pushes an existing slot to the top. */
    connect: (overlay: HTMLElement, bringToTop?: boolean) => void;
    /** Remove this slot without dismissing layers above it. */
    drop: (overlay: HTMLElement) => void;
    /** Pop this slot. Layers above it dismiss with reason 'cascade'. */
    pop: (overlay: HTMLElement) => void;
    /** Match the stack to overlays that are currently open. */
    reconcile: () => void;
    destroy: () => void;
};
/**
 * Top layer when the pointer went down, before the stack dismissed anyone.
 * undefined when this click was not preceded by a pointerdown. Callers
 * then read the live top, which is what click-only tests dispatch.
 */
export declare const backdropPressTop: () => HTMLElement | null | undefined;
/**
 * True when the latest pointerdown target is a dialog overlay element.
 * Dialog dismiss('outside') ignores every other press.
 */
export declare const outsidePressIsBackdrop: () => boolean;
/** Clears the backdrop-press snapshot. Test-only. */
export declare const __resetDialogLayersForTests: () => void;
export declare const createDialogLayers: (config: {
    kind: Extract<LayerKind, "modal" | "drawer" | "sheet">;
    selector: string;
    getOverlays: () => readonly HTMLElement[];
    isOpen: (overlay: HTMLElement) => boolean;
    isClosing: (overlay: HTMLElement) => boolean;
    isModal: (overlay: HTMLElement) => boolean;
    shouldStack: (overlay: HTMLElement) => boolean;
    dismiss: (overlay: HTMLElement, reason: LayerDismissReason) => void;
}) => DialogLayerController;
