/**
 * Internal cleanup scopes for a component call or a `bindList` row.
 *
 * Not a package entry. `effect` registers its disposer here while a scope is
 * active. `@citrusworx/sigjs/juice` `bind` uses that path: a bind during Sig
 * render disposes with the view. App code does not import this module.
 *
 * @internal
 */
let currentCleanupScope = null;
function disposeScope(scope) {
    for (const cleanup of scope.cleanups) {
        cleanup();
    }
    scope.cleanups.clear();
}
/** Register a disposer on the scope that is currently collecting, if any. */
export function registerCleanup(cleanup) {
    currentCleanupScope?.cleanups.add(cleanup);
}
/**
 * Collects cleanups registered while `fn` runs and returns them as `dispose`.
 * The JSX runtime uses this for a component call. `bindList` uses it for a row.
 * If `fn` throws, those cleanups run before the error propagates.
 *
 * @internal
 */
export function captureCleanupScope(fn) {
    const parentScope = currentCleanupScope;
    const scope = { cleanups: new Set() };
    currentCleanupScope = scope;
    try {
        let value;
        try {
            value = fn();
        }
        catch (error) {
            disposeScope(scope);
            throw error;
        }
        let disposed = false;
        return {
            value,
            dispose: () => {
                if (disposed) {
                    return;
                }
                disposed = true;
                disposeScope(scope);
            },
        };
    }
    finally {
        currentCleanupScope = parentScope;
    }
}
//# sourceMappingURL=cleanup-scope.js.map