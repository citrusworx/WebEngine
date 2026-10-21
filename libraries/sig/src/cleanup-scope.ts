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

interface CleanupScope {
    cleanups: Set<Cleanup>;
}

let currentCleanupScope: CleanupScope | null = null;

function disposeScope(scope: CleanupScope) {
    for (const cleanup of scope.cleanups) {
        cleanup();
    }
    scope.cleanups.clear();
}

/** Register a disposer on the scope that is currently collecting, if any. */
export function registerCleanup(cleanup: Cleanup) {
    currentCleanupScope?.cleanups.add(cleanup);
}

/**
 * Collects cleanups registered while `fn` runs and returns them as `dispose`.
 * The JSX runtime uses this for a component call. `bindList` uses it for a row.
 * If `fn` throws, those cleanups run before the error propagates.
 *
 * @internal
 */
export function captureCleanupScope<T>(fn: () => T): { value: T; dispose: () => void } {
    const parentScope = currentCleanupScope;
    const scope: CleanupScope = { cleanups: new Set() };
    currentCleanupScope = scope;

    try {
        let value: T;
        try {
            value = fn();
        } catch (error) {
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
    } finally {
        currentCleanupScope = parentScope;
    }
}
