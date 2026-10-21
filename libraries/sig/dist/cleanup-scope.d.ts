/**
 * Internal cleanup scopes for a component call or a `bindList` row.
 *
 * Not a package entry. `effect` registers its disposer here while a scope is
 * active. `@citrusworx/sigjs/juice` `bind` uses that path: a bind during Sig
 * render disposes with the view. App code does not import this module.
 *
 * @internal
 */
type Cleanup = () => void;
/** Register a disposer on the scope that is currently collecting, if any. */
export declare function registerCleanup(cleanup: Cleanup): void;
/**
 * Collects cleanups registered while `fn` runs and returns them as `dispose`.
 * The JSX runtime uses this for a component call. `bindList` uses it for a row.
 * If `fn` throws, those cleanups run before the error propagates.
 *
 * @internal
 */
export declare function captureCleanupScope<T>(fn: () => T): {
    value: T;
    dispose: () => void;
};
export {};
