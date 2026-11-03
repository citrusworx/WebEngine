/**
 * Internal binding from popover, menu, and combobox onto the layer stack.
 * Not a public export.
 *
 * Each open widget is one stack slot. push happens on open. pop happens
 * when the close commits, so a popover's in-flight exit stays the open
 * layer until `hidden` is set. Destroy drops the slot and does not
 * dismiss anything above it. These layers are not modal. Focus return
 * stays in the runtime.
 *
 * Outside pointerdown dismisses only the top layer. dismiss('outside')
 * hides the widget and removes the slot after the stack's pointer walk,
 * so a lower layer stays up. The click that follows that pointer is not
 * a second outside close. Openers that live outside the layer element
 * belong in containsTarget, so pressing the opener is not outside and
 * the click handler can still toggle.
 *
 * Toast and tooltip are not light layers. They stay off the stack.
 */
import { type LayerDismissReason, type LayerKind } from './layer-stack.js';
export type LightLayerController = {
    /** Stack an open widget. bringToTop re-pushes an existing slot to the top. */
    connect: (el: HTMLElement, bringToTop?: boolean) => void;
    /** Remove this slot without dismissing layers above it. */
    drop: (el: HTMLElement) => void;
    /** Pop this slot. Layers above it dismiss with reason 'cascade'. */
    pop: (el: HTMLElement) => void;
    /**
     * Pop after the current stack pointer walk. dismiss('outside') uses
     * this so the walk still sees this element on top and stops.
     */
    popAfterPointer: (el: HTMLElement) => void;
    /** Match the stack to widgets that are currently open. */
    reconcile: () => void;
    destroy: () => void;
};
/**
 * True when this click follows a stack outside-dismiss in the same
 * gesture. Click handlers skip a second outside close.
 */
export declare const lightOutsideAlreadyDismissed: () => boolean;
export declare const markLightOutsideDismissed: () => void;
/** Clears the outside-dismiss snapshot and handle map. Test-only. */
export declare const __resetLightLayersForTests: () => void;
export declare const createLightLayers: (config: {
    kind: Extract<LayerKind, "popover" | "menu" | "combobox">;
    getElements: () => readonly HTMLElement[];
    isOpen: (el: HTMLElement) => boolean;
    isClosing?: (el: HTMLElement) => boolean;
    containsTarget?: (el: HTMLElement, target: EventTarget | null) => boolean;
    dismiss: (el: HTMLElement, reason: LayerDismissReason) => void;
}) => LightLayerController;
