/**
 * Internal per-runtime event claim. Not a public export.
 *
 * Call once at module scope so custom-root and auto-enhance instances
 * of the same runtime share one WeakSet and do not double-handle.
 */
export declare const createEventClaim: () => (event: Event) => boolean;
