/**
 * Internal Juice runtime id helpers. Not a public export.
 */
export declare const escapeId: (value: string) => string;
export declare const tokenIds: (value: string | null | undefined) => string[];
export declare const controlIds: (element: HTMLElement) => string[];
export declare const resolveElementById: (id: string, root: ParentNode) => HTMLElement | null;
