/**
 * Internal focus-trap helpers for modal, drawer, and popover. Not a public export.
 */
export declare const isFocusableCandidate: (element: HTMLElement) => boolean;
export declare const getFocusable: (container: HTMLElement) => HTMLElement[];
export declare const moveFocusInto: (container: HTMLElement) => void;
export declare const wrapTabFocus: (event: KeyboardEvent, container: HTMLElement) => boolean;
